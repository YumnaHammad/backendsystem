const { Product, Warehouse, AuditLog } = require('../models');
const { createAuditLog } = require('../middleware/audit');

// Generate unique SKU based on product name
const generateUniqueSKU = async (productName) => {
  if (!productName) {
    throw new Error('Product name is required to generate SKU');
  }
  
  // Clean product name: remove special characters, convert to uppercase, replace spaces
  const cleanName = productName
    .toUpperCase()
    .replace(/[^A-Z0-9\s]/g, '') // Remove special characters
    .replace(/\s+/g, '') // Remove spaces
    .substring(0, 8); // Limit to 8 characters
  
  // Ensure we have at least some characters
  if (cleanName.length === 0) {
    throw new Error('Product name must contain at least one alphanumeric character');
  }
  
  // Add timestamp suffix for uniqueness
  const timestamp = Date.now().toString().slice(-4); // Last 4 digits of timestamp
  const baseSKU = `${cleanName}${timestamp}`;
  
  // Check if SKU already exists, if so, add incremental number
  let sku = baseSKU;
  let counter = 1;
  let attempts = 0;
  const maxAttempts = 1000; // Prevent infinite loop
  
  while (await Product.findOne({ sku })) {
    attempts++;
    if (attempts > maxAttempts) {
      // If we've tried too many times, use a completely random suffix
      const randomSuffix = Math.random().toString(36).substring(2, 8).toUpperCase();
      sku = `${cleanName}${randomSuffix}`;
      break;
    }
    
    // Try different formats for uniqueness
    if (counter <= 99) {
      sku = `${cleanName}${timestamp}${counter.toString().padStart(2, '0')}`;
    } else if (counter <= 999) {
      sku = `${cleanName}${timestamp}${counter.toString().padStart(3, '0')}`;
    } else {
      // Use longer timestamp if needed
      const longTimestamp = Date.now().toString().slice(-6);
      sku = `${cleanName}${longTimestamp}${counter.toString().padStart(2, '0')}`;
    }
    
    counter++;
  }
  
  return sku;
};

const getAllProducts = async (req, res) => {
  try {
    const { category, search, page = 1, limit, isActive } = req.query;
    
    // Show all products by default, allow filtering by isActive
    let query = {};
    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }
    
    if (category) {
      query.category = new RegExp(category, 'i');
    }
    
    if (search) {
      query.$or = [
        { name: new RegExp(search, 'i') },
        { sku: new RegExp(search, 'i') },
        { description: new RegExp(search, 'i') }
      ];
    }

    let queryBuilder = Product.find(query).sort({ createdAt: -1 });
    
    // Only apply limit and skip if limit is provided
    if (limit) {
      queryBuilder = queryBuilder.limit(limit * 1).skip((page - 1) * limit);
    }
    
    const products = await queryBuilder;

    const total = await Product.countDocuments(query);

    // Get stock information for each product
    const productsWithStock = await Promise.all(
      products.map(async (product) => {
        const warehouses = await Warehouse.find({ 'currentStock.productId': product._id });
        let totalStock = 0;
        
        warehouses.forEach(warehouse => {
          const stockItem = warehouse.currentStock.find(item => 
            item.productId.toString() === product._id.toString()
          );
          if (stockItem) {
            totalStock += stockItem.quantity;
          }
        });

        return {
          ...product.toObject(),
          totalStock,
          warehouses: warehouses.map(w => ({
            id: w._id,
            name: w.name,
            stock: w.currentStock.find(item => 
              item.productId.toString() === product._id.toString()
            )?.quantity || 0
          }))
        };
      })
    );

    res.json({
      products: productsWithStock,
      totalPages: limit ? Math.ceil(total / limit) : 1,
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const product = await Product.findById(id);
    
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Get stock information
    const warehouses = await Warehouse.find({ 'currentStock.productId': id });
    let totalStock = 0;
    
    const warehouseStock = warehouses.map(warehouse => {
      const stockItem = warehouse.currentStock.find(item => 
        item.productId.toString() === id
      );
      const stock = stockItem ? stockItem.quantity : 0;
      totalStock += stock;
      
      return {
        id: warehouse._id,
        name: warehouse.name,
        location: warehouse.location,
        stock,
        capacity: warehouse.capacity,
        usage: (warehouse.getTotalStock() / warehouse.capacity) * 100
      };
    });

    // Get product timeline/audit logs
    const timeline = await AuditLog.find({
      $or: [
        { resourceType: 'Product', resourceId: id },
        { metadata: { $regex: id } }
      ]
    })
    .sort({ timestampISO: -1 })
    .limit(50)
    .populate('actorId', 'firstName lastName email');

    // Calculate stock alert status
    let stockStatus = 'OK';
    let alertMessage = '';
    
    if (totalStock === 0) {
      stockStatus = 'RED';
      alertMessage = 'Out of Stock';
    } else if (totalStock <= 5) {
      stockStatus = 'YELLOW';
      alertMessage = 'Low Stock';
    }

    res.json({
      ...product.toObject(),
      totalStock,
      warehouseStock,
      timeline,
      stockStatus,
      alertMessage
    });
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const createProduct = async (req, res) => {
  try {
    const productData = req.body;
    
    // Generate unique SKU if not provided or if "Generate" was clicked
    if (!productData.sku || productData.generateSku) {
      productData.sku = await generateUniqueSKU(productData.name);
    }
    
    // Check if SKU already exists
    const existingProduct = await Product.findOne({ sku: productData.sku });
    if (existingProduct) {
      return res.status(400).json({ error: 'SKU already exists' });
    }

    const product = await Product.create(productData);
    
    // Create audit log (only if user is authenticated)
    if (req.user) {
      await createAuditLog(
        req.user._id,
        req.user.role,
        'product_created',
        'Product',
        product._id,
        null,
        product.toObject(),
        { sku: product.sku, name: product.name },
        req
      );
    }

    res.status(201).json(product);
  } catch (error) {
    console.error('Create product error:', error);
    if (error.code === 11000) {
      return res.status(400).json({ error: 'SKU already exists' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
};

const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Check SKU uniqueness if SKU is being updated
    if (updateData.sku && updateData.sku !== product.sku) {
      const existingProduct = await Product.findOne({ 
        sku: updateData.sku,
        _id: { $ne: id } // Exclude current product
      });
      if (existingProduct) {
        return res.status(400).json({ error: 'SKU already exists' });
      }
    }

    const oldValues = product.toObject();
    const updatedProduct = await Product.findByIdAndUpdate(
      id, 
      updateData, 
      { new: true, runValidators: true }
    );

    // Create audit log
    await createAuditLog(
      req.user._id,
      req.user.role,
      'product_updated',
      'Product',
      id,
      oldValues,
      updatedProduct.toObject(),
      { sku: updatedProduct.sku, name: updatedProduct.name },
      req
    );

    res.json(updatedProduct);
  } catch (error) {
    console.error('Update product error:', error);
    if (error.code === 11000) {
      return res.status(400).json({ error: 'SKU already exists' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
};

const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    
    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Check if product has stock
    const warehouses = await Warehouse.find({ 'currentStock.productId': id });
    let totalStock = 0;
    
    warehouses.forEach(warehouse => {
      const stockItem = warehouse.currentStock.find(item => 
        item.productId.toString() === id
      );
      if (stockItem) {
        totalStock += stockItem.quantity;
      }
    });

    if (totalStock > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete product with existing stock. Transfer or sell stock first.' 
      });
    }

    // Hard delete - completely remove from database
    await Product.findByIdAndDelete(id);

    // Create audit log (only if user is authenticated)
    if (req.user) {
      await createAuditLog(
        req.user._id,
        req.user.role,
        'product_deleted',
        'Product',
        id,
        product.toObject(),
        null,
        { sku: product.sku, name: product.name },
        req
      );
    }

    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Generate SKU endpoint
const generateSKU = async (req, res) => {
  try {
    const { productName } = req.body;
    
    if (!productName) {
      return res.status(400).json({ error: 'Product name is required' });
    }
    
    const sku = await generateUniqueSKU(productName);
    res.json({ sku });
  } catch (error) {
    console.error('Generate SKU error:', error);
    res.status(500).json({ error: 'Failed to generate SKU' });
  }
};

module.exports = {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  generateSKU
};