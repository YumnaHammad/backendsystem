const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Inventory Management System API',
      version: '1.0.0',
      description: 'API documentation for the Inventory Management and Lead Tracking System',
    },
    servers: [
      {
        url: 'http://localhost:5000',
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            username: { type: 'string' },
            email: { type: 'string' },
            role: { type: 'string', enum: ['admin', 'user'] },
            firstName: { type: 'string' },
            lastName: { type: 'string' },
          },
        },
        Lead: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            name: { type: 'string' },
            email: { type: 'string' },
            phone: { type: 'string' },
            company: { type: 'string' },
            source: { type: 'string' },
            status: { type: 'string', enum: ['new', 'in-progress', 'converted', 'lost'] },
            assignedTo: { type: 'integer' },
            notes: { type: 'string' },
            value: { type: 'number', format: 'decimal' },
          },
        },
        Product: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            name: { type: 'string' },
            sku: { type: 'string' },
            description: { type: 'string' },
            price: { type: 'number', format: 'decimal' },
            category: { type: 'string' },
            unit: { type: 'string' },
            minStock: { type: 'integer' },
          },
        },
        Warehouse: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            name: { type: 'string' },
            location: { type: 'string' },
            address: { type: 'string' },
            capacity: { type: 'integer' },
            isActive: { type: 'boolean' },
          },
        },
        Stock: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            productId: { type: 'integer' },
            warehouseId: { type: 'integer' },
            actualStock: { type: 'integer' },
            reservedStock: { type: 'integer' },
            projectedStock: { type: 'integer' },
          },
        },
        Receipt: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            productId: { type: 'integer' },
            warehouseId: { type: 'integer' },
            quantity: { type: 'integer' },
            unitCost: { type: 'number', format: 'decimal' },
            totalCost: { type: 'number', format: 'decimal' },
            supplier: { type: 'string' },
            reference: { type: 'string' },
            notes: { type: 'string' },
            receivedBy: { type: 'integer' },
          },
        },
        Dispatch: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            productId: { type: 'integer' },
            warehouseId: { type: 'integer' },
            quantity: { type: 'integer' },
            unitPrice: { type: 'number', format: 'decimal' },
            totalPrice: { type: 'number', format: 'decimal' },
            customer: { type: 'string' },
            reference: { type: 'string' },
            notes: { type: 'string' },
            status: { type: 'string', enum: ['reserved', 'shipped', 'delivered'] },
            dispatchedBy: { type: 'integer' },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ['./routes/*.js'], // paths to files containing OpenAPI definitions
};

const specs = swaggerJsdoc(options);

module.exports = specs;
