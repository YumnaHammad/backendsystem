const { Purchase, Product, Supplier, Warehouse, StockMovement, Receipt } = require('../models');
const { createAuditLog } = require('../middleware/audit');

// Create a new purchase
const createPurchase = async (req, res) => {
  try {
    const { supplierId, items, expectedDeliveryDate, notes, paymentMethod } = req.body;

    console.log('Creating purchase - Full request body:', JSON.stringify(req.body, null, 2));

    // Validate required fields
    if (!supplierId) {
      return res.status(400).json({ 
        error: 'Supplier ID is required',
        field: 'supplierId' 
      });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ 
        error: 'At least one purchase item is required',
        field: 'items' 
      });
    }

    // Validate supplier
    const supplier = await Supplier.findById(supplierId);
    if (!supplier) {
      return res.status(404).json({ 
        error: 'Supplier not found',
        supplierId 
      });
    }

    // Validate products and calculate totals
    let totalAmount = 0;
    const validatedItems = [];

    for (const item of items) {
      // Validate item fields
      if (!item.productId) {
        return res.status(400).json({ 
          error: 'Product ID is required for each item',
          field: 'productId' 
        });
      }
      
      if (!item.quantity || item.quantity <= 0) {
        return res.status(400).json({ 
          error: 'Valid quantity is required for each item',
          field: 'quantity' 
        });
      }
      
      if (!item.unitPrice || item.unitPrice <= 0) {
        return res.status(400).json({ 
          error: 'Valid unit price is required for each item',
          field: 'unitPrice' 
        });
      }

      const product = await Product.findById(item.productId);
      if (!product) {
        return res.status(404).json({ 
          error: `Product with ID ${item.productId} not found`,
          productId: item.productId 
        });
      }

      const itemTotal = item.quantity * item.unitPrice;
      totalAmount += itemTotal;

      validatedItems.push({
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: itemTotal
      });
    }

    // Generate unique purchase number
    let purchaseNumber;
    let attempts = 0;
    const maxAttempts = 10;
    
    do {
      const count = await Purchase.countDocuments();
      purchaseNumber = `PUR-${String(count + 1 + attempts).padStart(4, '0')}`;
      attempts++;
      
      // Check if this purchase number already exists
      const existingPurchase = await Purchase.findOne({ purchaseNumber });
      if (!existingPurchase) {
        break;
      }
      
      if (attempts >= maxAttempts) {
        // Fallback to timestamp-based number
        purchaseNumber = `PUR-${Date.now().toString().slice(-4)}`;
        break;
      }
    } while (attempts < maxAttempts);

    // Validate user authentication - Purchase requires a logged-in user
    if (!req.user || !req.user._id) {
      console.error('Purchase creation failed: User not authenticated');
      console.error('req.user:', req.user);
      return res.status(401).json({ 
        error: 'Authentication required. Please log in to create purchases.',
        field: 'authentication',
        details: 'You must be logged in to create purchase orders'
      });
    }

    console.log('Creating purchase with user:', req.user._id);

    // Create purchase
    const purchase = new Purchase({
      purchaseNumber,
      supplierId,
      items: validatedItems,
      totalAmount,
      expectedDeliveryDate,
      notes,
      paymentMethod,
      createdBy: req.user._id
    });

    await purchase.save();

    // Automatically add stock to the first available warehouse
    const warehouse = await Warehouse.findOne({});
    if (warehouse) {
      // Add stock to warehouse for each item
      for (const item of validatedItems) {
        const stockItem = warehouse.currentStock.find(stock => 
          stock.productId.toString() === item.productId
        );

        if (stockItem) {
          stockItem.quantity += item.quantity;
        } else {
          warehouse.currentStock.push({
            productId: item.productId,
            quantity: item.quantity,
            reservedQuantity: 0
          });
        }

        // Create stock movement record
        const stockMovement = new StockMovement({
          productId: item.productId,
          warehouseId: warehouse._id,
          movementType: 'in',
          quantity: item.quantity,
          previousQuantity: stockItem ? stockItem.quantity - item.quantity : 0,
          newQuantity: stockItem ? stockItem.quantity : item.quantity,
          referenceType: 'purchase',
          referenceId: purchase._id,
          notes: `Received from purchase ${purchase.purchaseNumber}`,
          createdBy: req.user ? req.user._id : null
        });

        await stockMovement.save();
      }

      await warehouse.save();

      // Update purchase status to received
      purchase.status = 'received';
      purchase.receivedDate = new Date();
      await purchase.save();
    }

    // Audit log will be created by middleware

    // Populate supplier and items for response
    await purchase.populate([
      { path: 'supplierId', select: 'name supplierCode' },
      { path: 'items.productId', select: 'name sku' },
      { path: 'createdBy', select: 'firstName lastName' }
    ]);

    res.status(201).json({
      message: 'Purchase created and stock added successfully',
      purchase
    });

  } catch (error) {
    console.error('Create purchase error:', error);
    console.error('Error details:', error.message);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      error: 'Failed to create purchase',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// Get all purchases
const getAllPurchases = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, supplierId, startDate, endDate, isActive } = req.query;
    
    // Show all purchases by default, allow filtering by isActive
    let query = {};
    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }
    
    if (status) query.status = status;
    if (supplierId) query.supplierId = supplierId;
    if (startDate || endDate) {
      query.purchaseDate = {};
      if (startDate) query.purchaseDate.$gte = new Date(startDate);
      if (endDate) query.purchaseDate.$lte = new Date(endDate);
    }

    const purchases = await Purchase.find(query)
      .populate('supplierId', 'name supplierCode')
      .populate('items.productId', 'name sku')
      .populate('createdBy', 'firstName lastName')
      .sort({ purchaseDate: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Purchase.countDocuments(query);

    res.json({
      purchases,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });

  } catch (error) {
    console.error('Get purchases error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get purchase by ID
const getPurchaseById = async (req, res) => {
  try {
    const { id } = req.params;

    const purchase = await Purchase.findById(id)
      .populate('supplierId', 'name supplierCode email phone address')
      .populate('items.productId', 'name sku description unit')
      .populate('createdBy', 'firstName lastName email');

    if (!purchase) {
      return res.status(404).json({ error: 'Purchase not found' });
    }

    res.json(purchase);

  } catch (error) {
    console.error('Get purchase error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Update purchase status
const updatePurchaseStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    const purchase = await Purchase.findById(id);
    if (!purchase) {
      return res.status(404).json({ error: 'Purchase not found' });
    }

    const oldStatus = purchase.status;
    purchase.status = status;
    if (notes) purchase.notes = notes;

    await purchase.save();

    // Create audit log only if user is authenticated
    if (req.user) {
      try {
        await createAuditLog(
          req.user._id,
          req.user.role,
          'purchase_status_updated',
          'Purchase',
          purchase._id,
          { status: oldStatus },
          { status: purchase.status },
          { purchaseNumber: purchase.purchaseNumber },
          req
        );
      } catch (auditError) {
        console.error('Audit log error (non-critical):', auditError);
      }
    }

    res.json({
      message: 'Purchase status updated successfully',
      purchase
    });

  } catch (error) {
    console.error('Update purchase status error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};


// Generate receipt for payment
const generateReceipt = async (req, res) => {
  try {
    const { id } = req.params;
    const { paymentMethod, paymentReference, notes } = req.body;

    const purchase = await Purchase.findById(id);
    if (!purchase) {
      return res.status(404).json({ error: 'Purchase not found' });
    }

    if (purchase.paymentStatus === 'paid') {
      return res.status(400).json({ error: 'Purchase is already paid' });
    }

    // Create receipt
    const receipt = new Receipt({
      purchaseId: purchase._id,
      supplierId: purchase.supplierId,
      amount: purchase.totalAmount,
      paymentMethod,
      paymentReference,
      notes,
      createdBy: req.user ? req.user._id : null
    });

    await receipt.save();

    // Update purchase payment status
    purchase.paymentStatus = 'paid';
    purchase.paymentDate = new Date();
    purchase.receiptNumber = receipt.receiptNumber;

    await purchase.save();

    // Create audit log only if user is authenticated
    if (req.user) {
      try {
        await createAuditLog(
          req.user._id,
          req.user.role,
          'receipt_generated',
          'Receipt',
          receipt._id,
          null,
          { receiptNumber: receipt.receiptNumber, amount: receipt.amount },
          req
        );
      } catch (auditError) {
        console.error('Audit log error (non-critical):', auditError);
      }
    }

    res.json({
      message: 'Receipt generated successfully',
      receipt,
      purchase
    });

  } catch (error) {
    console.error('Generate receipt error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Generate invoice for purchase
const generateInvoice = async (req, res) => {
  try {
    const { id } = req.params;
    
    const purchase = await Purchase.findById(id)
      .populate('supplierId', 'name supplierCode email phone address')
      .populate('items.productId', 'name sku category sellingPrice')
      .populate('createdBy', 'firstName lastName email');
    
    if (!purchase) {
      return res.status(404).json({ error: 'Purchase not found' });
    }
    
    // Generate invoice number
    const invoiceNumber = await purchase.generateInvoice();
    
    res.json({
      success: true,
      message: 'Invoice generated successfully',
      invoiceNumber,
      purchase: purchase
    });
  } catch (error) {
    console.error('Generate invoice error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Mark payment as cleared and update stock
const markPaymentCleared = async (req, res) => {
  try {
    const { id } = req.params;
    
    const purchase = await Purchase.findById(id)
      .populate('supplierId', 'name supplierCode')
      .populate('items.productId', 'name sku')
      .populate('createdBy', 'firstName lastName');
    
    if (!purchase) {
      return res.status(404).json({ error: 'Purchase not found' });
    }
    
    if (purchase.paymentStatus === 'paid') {
      return res.status(400).json({ error: 'Payment already cleared' });
    }
    
    // Mark payment as cleared and update stock
    await purchase.markPaymentCleared();
    
    res.json({
      success: true,
      message: 'Payment cleared and stock updated successfully',
      receiptNumber: purchase.receiptNumber,
      purchase: purchase
    });
  } catch (error) {
    console.error('Mark payment cleared error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Download receipt/invoice
const downloadDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const { type } = req.query; // 'invoice' or 'receipt'
    
    const purchase = await Purchase.findById(id)
      .populate('supplierId', 'name supplierCode email phone address')
      .populate('items.productId', 'name sku category sellingPrice')
      .populate('createdBy', 'firstName lastName email');
    
    if (!purchase) {
      return res.status(404).json({ error: 'Purchase not found' });
    }
    
    if (type === 'invoice' && !purchase.invoiceGenerated) {
      return res.status(400).json({ error: 'Invoice not generated yet' });
    }
    
    if (type === 'receipt' && !purchase.receiptGenerated) {
      return res.status(400).json({ error: 'Receipt not generated yet' });
    }
    
    // Generate document data
    const documentData = {
      purchase,
      type,
      generatedDate: type === 'invoice' ? purchase.invoiceDate : purchase.receiptDate,
      documentNumber: type === 'invoice' ? purchase.invoiceNumber : purchase.receiptNumber
    };
    
    res.json({
      success: true,
      document: documentData
    });
  } catch (error) {
    console.error('Download document error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Delete purchase (hard delete)
const deletePurchase = async (req, res) => {
  try {
    const { id } = req.params;

    const purchase = await Purchase.findById(id);
    if (!purchase) {
      return res.status(404).json({ error: 'Purchase not found' });
    }

    if (purchase.status === 'received') {
      return res.status(400).json({ 
        error: 'Cannot delete received purchase. Stock has been added to warehouse.' 
      });
    }

    // Hard delete
    await Purchase.findByIdAndDelete(id);

    // Create audit log only if user is authenticated
    if (req.user) {
      try {
        await createAuditLog(
          req.user._id,
          req.user.role,
          'purchase_deleted',
          'Purchase',
          id,
          purchase.toObject(),
          null,
          { purchaseNumber: purchase.purchaseNumber },
          req
        );
      } catch (auditError) {
        console.error('Audit log error (non-critical):', auditError);
      }
    }

    res.json({ message: 'Purchase deleted successfully' });

  } catch (error) {
    console.error('Delete purchase error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  createPurchase,
  getAllPurchases,
  getPurchaseById,
  updatePurchaseStatus,
  generateReceipt,
  generateInvoice,
  markPaymentCleared,
  downloadDocument,
  deletePurchase
};