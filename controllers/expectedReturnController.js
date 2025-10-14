const ExpectedReturn = require('../models/ExpectedReturn');
const SalesOrder = require('../models/SalesOrder');
const Product = require('../models/Product');
const Warehouse = require('../models/Warehouse');
const { createAuditLog } = require('../middleware/audit');

// Get all expected returns
const getAllExpectedReturns = async (req, res) => {
  try {
    const { status, from, to } = req.query;
    
    let query = {};
    
    if (status) {
      query.status = status;
    }
    
    if (from || to) {
      query.expectedReturnDate = {};
      if (from) query.expectedReturnDate.$gte = new Date(from);
      if (to) query.expectedReturnDate.$lte = new Date(to);
    }
    
    const expectedReturns = await ExpectedReturn.find(query)
      .populate('salesOrderId', 'orderNumber status')
      .populate('items.productId', 'name sku')
      .populate('warehouseId', 'name location')
      .populate('createdBy', 'firstName lastName')
      .sort({ createdAt: -1 });
    
    // Calculate statistics
    const stats = {
      total: expectedReturns.length,
      pending: expectedReturns.filter(r => r.status === 'pending').length,
      inTransit: expectedReturns.filter(r => r.status === 'in_transit').length,
      received: expectedReturns.filter(r => r.status === 'received').length,
      totalItems: expectedReturns.reduce((sum, r) => sum + r.items.reduce((s, i) => s + i.quantity, 0), 0)
    };
    
    res.json({ expectedReturns, stats });
  } catch (error) {
    console.error('Get expected returns error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get single expected return
const getExpectedReturnById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const expectedReturn = await ExpectedReturn.findById(id)
      .populate('salesOrderId')
      .populate('items.productId')
      .populate('warehouseId')
      .populate('createdBy', 'firstName lastName email');
    
    if (!expectedReturn) {
      return res.status(404).json({ error: 'Expected return not found' });
    }
    
    res.json(expectedReturn);
  } catch (error) {
    console.error('Get expected return error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Create expected return
const createExpectedReturn = async (req, res) => {
  try {
    const {
      salesOrderId,
      items,
      expectedReturnDate,
      returnReason,
      warehouseId,
      notes,
      trackingNumber
    } = req.body;
    
    // Validate sales order
    const salesOrder = await SalesOrder.findById(salesOrderId)
      .populate('items.productId');
    
    if (!salesOrder) {
      return res.status(404).json({ error: 'Sales order not found' });
    }
    
    // Populate product details
    const populatedItems = await Promise.all(items.map(async (item) => {
      const product = await Product.findById(item.productId);
      return {
        ...item,
        productName: product?.name || 'Unknown Product'
      };
    }));
    
    // Create expected return
    const expectedReturn = new ExpectedReturn({
      salesOrderId,
      orderNumber: salesOrder.orderNumber,
      customerName: salesOrder.customerInfo?.name || 'Unknown',
      customerEmail: salesOrder.customerInfo?.email,
      customerPhone: salesOrder.customerInfo?.phone,
      items: populatedItems,
      expectedReturnDate,
      returnReason,
      warehouseId,
      notes,
      trackingNumber,
      refundAmount: items.reduce((sum, item) => {
        const orderItem = salesOrder.items.find(i => 
          i.productId._id.toString() === item.productId.toString()
        );
        return sum + (orderItem ? orderItem.unitPrice * item.quantity : 0);
      }, 0),
      createdBy: req.user?._id
    });
    
    await expectedReturn.save();
    
    // Create audit log
    if (req.user) {
      await createAuditLog(
        req.user._id,
        req.user.role,
        'expected_return_created',
        'ExpectedReturn',
        expectedReturn._id,
        null,
        expectedReturn.toObject(),
        { orderNumber: salesOrder.orderNumber },
        req
      );
    }
    
    await expectedReturn.populate([
      { path: 'items.productId', select: 'name sku' },
      { path: 'warehouseId', select: 'name location' }
    ]);
    
    res.status(201).json({
      message: 'Expected return created successfully',
      expectedReturn
    });
  } catch (error) {
    console.error('Create expected return error:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
};

// Update expected return status
const updateExpectedReturnStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, actualReturnDate, notes, warehouseId } = req.body;
    
    const expectedReturn = await ExpectedReturn.findById(id).populate('items.productId');
    
    if (!expectedReturn) {
      return res.status(404).json({ error: 'Expected return not found' });
    }
    
    const oldStatus = expectedReturn.status;
    expectedReturn.status = status;
    
    if (actualReturnDate) {
      expectedReturn.actualReturnDate = actualReturnDate;
    }
    
    if (notes) {
      expectedReturn.notes = notes;
    }
    
    // Update warehouse if provided
    if (warehouseId) {
      expectedReturn.warehouseId = warehouseId;
    }
    
    // If status is 'received', add stock back to warehouse with 'returned' tag
    if (status === 'received') {
      const targetWarehouseId = warehouseId || expectedReturn.warehouseId;
      
      if (!targetWarehouseId) {
        return res.status(400).json({ error: 'Please select a warehouse to receive the return' });
      }
      
      const warehouse = await Warehouse.findById(targetWarehouseId);
      
      if (!warehouse) {
        return res.status(404).json({ error: 'Warehouse not found' });
      }
      
      for (const item of expectedReturn.items) {
        const product = item.productId;
        
        // Find or create stock entry by productId AND variantId
        let stockItem = warehouse.currentStock.find(stock =>
          stock.productId.toString() === product._id.toString() &&
          (stock.variantId || null) === (item.variantId || null)
        );
        
        if (stockItem) {
          // Move from expectedReturns to actual quantity AND returnedQuantity
          if (stockItem.expectedReturns && stockItem.expectedReturns >= item.quantity) {
            stockItem.expectedReturns -= item.quantity;
          }
          stockItem.quantity += item.quantity;
          
          // Track returned quantity
          if (!stockItem.returnedQuantity) {
            stockItem.returnedQuantity = 0;
          }
          stockItem.returnedQuantity += item.quantity;
          
          // Add 'returned' tag
          if (!stockItem.tags) {
            stockItem.tags = [];
          }
          if (!stockItem.tags.includes('returned')) {
            stockItem.tags.push('returned');
          }
          // Add condition tag
          if (item.condition && !stockItem.tags.includes(item.condition)) {
            stockItem.tags.push(item.condition);
          }
        } else {
          warehouse.currentStock.push({
            productId: product._id,
            variantId: item.variantId || null,
            variantName: item.variantName || null,
            quantity: item.quantity,
            reservedQuantity: 0,
            expectedReturns: 0,
            returnedQuantity: item.quantity,
            tags: ['returned', item.condition].filter(Boolean)
          });
        }
        
        // Create stock movement
        const StockMovement = require('../models/StockMovement');
        const stockMovement = new StockMovement({
          productId: product._id,
          warehouseId: warehouse._id,
          movementType: 'in',
          quantity: item.quantity,
          previousQuantity: stockItem ? stockItem.quantity - item.quantity : 0,
          newQuantity: stockItem ? stockItem.quantity : item.quantity,
          referenceType: 'return',
          referenceId: expectedReturn._id,
          notes: `Expected return received from order ${expectedReturn.orderNumber}`,
          createdBy: req.user?._id || expectedReturn.createdBy
        });
        await stockMovement.save();
      }
      
      await warehouse.save();
      expectedReturn.warehouseName = warehouse.name;
    }
    
    await expectedReturn.save();
    
    // Create audit log
    if (req.user) {
      await createAuditLog(
        req.user._id,
        req.user.role,
        'expected_return_status_updated',
        'ExpectedReturn',
        expectedReturn._id,
        { status: oldStatus },
        { status: expectedReturn.status },
        { orderNumber: expectedReturn.orderNumber },
        req
      );
    }
    
    res.json({
      message: status === 'received' 
        ? 'Return received and stock updated'
        : 'Expected return status updated',
      expectedReturn
    });
  } catch (error) {
    console.error('Update expected return status error:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
};

// Get expected returns by product (for purchase decisions)
const getExpectedReturnsByProduct = async (req, res) => {
  try {
    const expectedReturns = await ExpectedReturn.find({
      status: { $in: ['pending', 'in_transit'] }
    }).populate('items.productId', 'name sku');
    
    // Group by product
    const productReturns = {};
    
    expectedReturns.forEach(ret => {
      ret.items.forEach(item => {
        const productId = item.productId._id.toString();
        if (!productReturns[productId]) {
          productReturns[productId] = {
            product: item.productId,
            totalExpected: 0,
            returns: []
          };
        }
        productReturns[productId].totalExpected += item.quantity;
        productReturns[productId].returns.push({
          orderNumber: ret.orderNumber,
          quantity: item.quantity,
          expectedDate: ret.expectedReturnDate,
          status: ret.status,
          condition: item.condition
        });
      });
    });
    
    res.json({ productReturns: Object.values(productReturns) });
  } catch (error) {
    console.error('Get expected returns by product error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Delete expected return
const deleteExpectedReturn = async (req, res) => {
  try {
    const { id } = req.params;
    
    const expectedReturn = await ExpectedReturn.findById(id);
    if (!expectedReturn) {
      return res.status(404).json({ error: 'Expected return not found' });
    }
    
    await ExpectedReturn.findByIdAndDelete(id);
    
    res.json({ message: 'Expected return deleted successfully' });
  } catch (error) {
    console.error('Delete expected return error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  getAllExpectedReturns,
  getExpectedReturnById,
  createExpectedReturn,
  updateExpectedReturnStatus,
  getExpectedReturnsByProduct,
  deleteExpectedReturn
};

