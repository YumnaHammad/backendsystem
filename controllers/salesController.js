const { SalesOrder, Product, Customer, Warehouse, StockMovement, SalesShipment } = require('../models');
const { createAuditLog } = require('../middleware/audit');

// Create a new sales order
const createSalesOrder = async (req, res) => {
  try {
    const { customerInfo, items, deliveryAddress, expectedDeliveryDate, notes } = req.body;

    // User authentication is optional - use system user if not authenticated
    let userId = req.user?._id || null;
    
    // If no user, try to find a default admin user
    if (!userId) {
      const User = require('../models/User');
      const adminUser = await User.findOne({ role: 'admin', isActive: true });
      if (adminUser) {
        userId = adminUser._id;
      }
    }

    // Validate products and check stock availability
    let totalAmount = 0;
    const validatedItems = [];
    const stockChecks = [];

    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (!product) {
        return res.status(404).json({ error: `Product with ID ${item.productId} not found` });
      }

      // Get variant info if provided
      let variantName = null;
      if (item.variantId && product.hasVariants && product.variants) {
        const variant = product.variants.find(v => (v._id?.toString() === item.variantId || v.sku === item.variantId));
        if (variant) {
          variantName = variant.name;
        }
      }

      // Check stock availability across all warehouses
      const warehouses = await Warehouse.find({ isActive: true });
      let totalAvailableStock = 0;
      
      for (const warehouse of warehouses) {
      const stockItem = warehouse.currentStock.find(stock => 
        stock.productId.toString() === item.productId
      );
        if (stockItem) {
          totalAvailableStock += (stockItem.quantity - stockItem.reservedQuantity);
        }
      }
      
      if (totalAvailableStock < item.quantity) {
        return res.status(400).json({ 
          error: `Insufficient stock for product ${product.name}${variantName ? ` (${variantName})` : ''}. Available: ${totalAvailableStock}, Required: ${item.quantity}` 
        });
      }

      const itemTotal = item.quantity * item.unitPrice;
      totalAmount += itemTotal;

      validatedItems.push({
        productId: item.productId,
        variantId: item.variantId || null,
        variantName: variantName,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: itemTotal
      });

      stockChecks.push({
        productId: item.productId,
        variantId: item.variantId || null,
        variantName: variantName,
        availableStock: totalAvailableStock,
        requiredStock: item.quantity
      });
    }

    // Generate order number
    const count = await SalesOrder.countDocuments();
    const orderNumber = `SO-${String(count + 1).padStart(4, '0')}`;

    // Create sales order
    const salesOrder = new SalesOrder({
      orderNumber,
      customerInfo,
      items: validatedItems,
      totalAmount,
      deliveryAddress,
      expectedDeliveryDate,
      notes,
      createdBy: userId
    });

    await salesOrder.save();
    
    // Create audit log (only if user is authenticated)
    if (req.user && userId) {
      await createAuditLog(
        userId,
        req.user.role || 'admin',
        'sales_order_created',
        'SalesOrder',
        salesOrder._id,
        null,
        { orderNumber: salesOrder.orderNumber, totalAmount, customerName: customerInfo.name },
        req
      );
    }

    // Populate items for response
    await salesOrder.populate([
      { path: 'items.productId', select: 'name sku' },
      { path: 'createdBy', select: 'firstName lastName' }
    ]);

    res.status(201).json({
      message: 'Sales order created successfully',
      salesOrder,
      stockChecks
    });

  } catch (error) {
    console.error('Create sales order error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get all sales orders
const getAllSalesOrders = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, startDate, endDate, isActive } = req.query;
    
    // Show all sales orders by default, allow filtering by isActive
    let query = {};
    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }
    
    if (status) query.status = status;
    if (startDate || endDate) {
      query.orderDate = {};
      if (startDate) query.orderDate.$gte = new Date(startDate);
      if (endDate) query.orderDate.$lte = new Date(endDate);
    }

    const salesOrders = await SalesOrder.find(query)
      .populate('items.productId', 'name sku')
      .populate('createdBy', 'firstName lastName')
      .sort({ orderDate: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await SalesOrder.countDocuments(query);

    res.json({
      salesOrders,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });

  } catch (error) {
    console.error('Get sales orders error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get sales order by ID
const getSalesOrderById = async (req, res) => {
  try {
    const { id } = req.params;

    const salesOrder = await SalesOrder.findById(id)
      .populate('items.productId', 'name sku description unit')
      .populate('createdBy', 'firstName lastName email');

    if (!salesOrder) {
      return res.status(404).json({ error: 'Sales order not found' });
    }

    res.json(salesOrder);

  } catch (error) {
    console.error('Get sales order error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Update sales order status
const updateSalesOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    console.log('Status update request:', { id, status, notes });

    const salesOrder = await SalesOrder.findById(id).populate('items.productId');
    if (!salesOrder) {
      console.error('Sales order not found:', id);
      return res.status(404).json({ error: 'Sales order not found' });
    }

    console.log('Current order status:', salesOrder.status);
    console.log('Attempting to change to:', status);

    const oldStatus = salesOrder.status;
    
    // Handle return status - restore stock to warehouse
    if (status === 'return' || status === 'returned') {
      console.log('Processing return - restoring stock to warehouse');
      
      // Find an active warehouse to return stock to (prefer first warehouse)
      const warehouses = await Warehouse.find({ isActive: true });
      if (warehouses.length === 0) {
        return res.status(400).json({ error: 'No active warehouse found to return stock' });
      }
      
      const warehouse = warehouses[0]; // Use first available warehouse
      console.log('Returning stock to warehouse:', warehouse.name);
      
      // Process each item and return to stock
      for (const item of salesOrder.items) {
        const product = item.productId;
        const quantity = item.quantity;
        
        console.log(`Returning ${quantity} units of ${product.name} to stock`);
        
        // Find or create stock entry for this product
        let stockItem = warehouse.currentStock.find(stock => 
          stock.productId.toString() === product._id.toString()
        );
        
        const previousQuantity = stockItem ? stockItem.quantity : 0;
        
            if (stockItem) {
              stockItem.quantity += quantity;
              // Add 'returned' tag if not already present
              if (!stockItem.tags) {
                stockItem.tags = [];
              }
              if (!stockItem.tags.includes('returned')) {
                stockItem.tags.push('returned');
              }
            } else {
              warehouse.currentStock.push({
                productId: product._id,
                quantity: quantity,
                reservedQuantity: 0,
                tags: ['returned']
              });
              stockItem = warehouse.currentStock[warehouse.currentStock.length - 1];
            }
        
        // Create stock movement record
        const stockMovement = new StockMovement({
          productId: product._id,
          warehouseId: warehouse._id,
          movementType: 'in',
          quantity: quantity,
          previousQuantity: previousQuantity,
          newQuantity: stockItem.quantity,
          referenceType: 'return',
          referenceId: salesOrder._id,
          notes: `Returned from sales order ${salesOrder.orderNumber}`,
          createdBy: req.user?._id || salesOrder.createdBy
        });
        
        await stockMovement.save();
        console.log(`Stock movement created: ${quantity} units added`);
      }
      
      await warehouse.save();
      console.log('Warehouse stock updated successfully');
    }
    
    salesOrder.status = status;
    if (notes) salesOrder.notes = notes;

    await salesOrder.save();

    console.log('Status updated successfully to:', salesOrder.status);

    // Create audit log (only if user is authenticated)
    if (req.user) {
      await createAuditLog(
        req.user._id,
        req.user.role,
        'sales_order_status_updated',
        'SalesOrder',
        salesOrder._id,
        { status: oldStatus },
        { status: salesOrder.status },
        { orderNumber: salesOrder.orderNumber },
        req
      );
    }

        res.json({
          message: status === 'return' || status === 'returned' 
            ? 'Order marked as returned and stock restored to warehouse'
            : 'Sales order status updated successfully',
          salesOrder,
          stockRestored: status === 'return' || status === 'returned',
          warehouseName: (status === 'return' || status === 'returned') ? warehouse.name : null
        });

  } catch (error) {
    console.error('Update sales order status error:', error);
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    
    // Send more detailed error info
    res.status(500).json({ 
      error: error.message || 'Internal server error',
      details: error.name 
    });
  }
};

// Dispatch sales order
const dispatchSalesOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { warehouseId, trackingNumber, carrier, expectedDeliveryDate } = req.body;

    const salesOrder = await SalesOrder.findById(id);
    if (!salesOrder) {
      return res.status(404).json({ error: 'Sales order not found' });
    }

    if (salesOrder.status !== 'confirmed') {
      return res.status(400).json({ error: 'Sales order must be confirmed to dispatch' });
    }

    const warehouse = await Warehouse.findById(warehouseId);
    if (!warehouse) {
      return res.status(404).json({ error: 'Warehouse not found' });
    }

    // Check stock availability and reserve stock
    for (const orderItem of salesOrder.items) {
      const stockItem = warehouse.currentStock.find(item => 
        item.productId.toString() === orderItem.productId.toString()
      );

      if (!stockItem || stockItem.quantity < orderItem.quantity) {
        return res.status(400).json({ 
          error: `Insufficient stock in warehouse for product ${orderItem.productId}` 
        });
      }

      // Reserve stock
      stockItem.reservedQuantity += orderItem.quantity;
    }

    // Get user ID
    let userId = req.user?._id || salesOrder.createdBy;

    // Create shipment
    const shipment = new SalesShipment({
      salesOrderId: salesOrder._id,
      items: salesOrder.items.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
        warehouseId
      })),
      trackingNumber,
      carrier,
      expectedDeliveryDate,
      deliveryAddress: salesOrder.deliveryAddress,
      createdBy: userId
    });

    await shipment.save();

    // Update sales order status
    salesOrder.status = 'dispatched';
    await salesOrder.save();

    // Save warehouse with reserved stock
    await warehouse.save();

    // Create audit log (only if user is authenticated)
    if (req.user) {
      await createAuditLog(
        req.user._id,
        req.user.role,
        'sales_order_dispatched',
        'SalesOrder',
        salesOrder._id,
        { status: 'confirmed' },
        { status: 'dispatched' },
        { orderNumber: salesOrder.orderNumber, shipmentNumber: shipment.shipmentNumber },
        req
      );
    }

    res.json({
      message: 'Sales order dispatched successfully',
      salesOrder,
      shipment
    });

  } catch (error) {
    console.error('Dispatch sales order error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Mark delivery as completed
const markDeliveryCompleted = async (req, res) => {
  try {
    const { id } = req.params;
    const { actualDeliveryDate } = req.body;
    
    const salesOrder = await SalesOrder.findById(id);
    if (!salesOrder) {
      return res.status(404).json({ error: 'Sales order not found' });
    }

    if (salesOrder.status !== 'dispatched') {
      return res.status(400).json({ error: 'Sales order must be dispatched to mark as delivered' });
    }

    // Get the shipment
    const shipment = await SalesShipment.findOne({ salesOrderId: id });
    if (!shipment) {
      return res.status(404).json({ error: 'Shipment not found' });
    }

    // Update stock - remove from warehouse
    for (const shipmentItem of shipment.items) {
      const warehouse = await Warehouse.findById(shipmentItem.warehouseId);
      if (warehouse) {
        const stockItem = warehouse.currentStock.find(item => 
          item.productId.toString() === shipmentItem.productId.toString()
      );
      
      if (stockItem) {
          const previousQuantity = stockItem.quantity;
          stockItem.quantity -= shipmentItem.quantity;
          stockItem.reservedQuantity -= shipmentItem.quantity;

          // Create stock movement record
          const stockMovement = new StockMovement({
            productId: shipmentItem.productId,
            warehouseId: shipmentItem.warehouseId,
            movementType: 'out',
            quantity: shipmentItem.quantity,
            previousQuantity,
            newQuantity: stockItem.quantity,
            referenceType: 'sales',
            referenceId: salesOrder._id,
            notes: `Delivered for sales order ${salesOrder.orderNumber}`,
            createdBy: req.user?._id || salesOrder.createdBy
          });

          await stockMovement.save();
        await warehouse.save();
      }
    }
    }

    // Update sales order and shipment
    salesOrder.status = 'delivered';
    salesOrder.actualDeliveryDate = actualDeliveryDate || new Date();
    
    shipment.status = 'delivered';
    shipment.actualDeliveryDate = actualDeliveryDate || new Date();

    await salesOrder.save();
    await shipment.save();

    // Create audit log (only if user is authenticated)
    if (req.user) {
      await createAuditLog(
        req.user._id,
        req.user.role,
        'sales_order_delivered',
        'SalesOrder',
        salesOrder._id,
        { status: 'dispatched' },
        { status: 'delivered' },
        { orderNumber: salesOrder.orderNumber },
        req
      );
    }

    res.json({
      message: 'Delivery marked as completed successfully',
      salesOrder,
      shipment
    });

  } catch (error) {
    console.error('Mark delivery completed error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Delete sales order (hard delete)
const deleteSalesOrder = async (req, res) => {
  try {
    const { id } = req.params;
    
    const salesOrder = await SalesOrder.findById(id);
    if (!salesOrder) {
      return res.status(404).json({ error: 'Sales order not found' });
    }

    if (salesOrder.status === 'dispatched' || salesOrder.status === 'delivered') {
      return res.status(400).json({ 
        error: 'Cannot delete dispatched or delivered sales order' 
      });
    }

    // Hard delete
    await SalesOrder.findByIdAndDelete(id);

    // Create audit log (only if user is authenticated)
    if (req.user) {
      await createAuditLog(
        req.user._id,
        req.user.role,
        'sales_order_deleted',
        'SalesOrder',
        id,
        salesOrder.toObject(),
        null,
        { orderNumber: salesOrder.orderNumber },
        req
      );
    }

    res.json({ message: 'Sales order deleted successfully' });

  } catch (error) {
    console.error('Delete sales order error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  createSalesOrder,
  getAllSalesOrders,
  getSalesOrderById,
  updateSalesOrderStatus,
  dispatchSalesOrder,
  markDeliveryCompleted,
  deleteSalesOrder
};