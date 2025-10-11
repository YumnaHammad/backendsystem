// Base Controller with common functionality
class BaseController {
  constructor(model) {
    this.model = model;
  }

  // Generic CRUD operations
  async getAll(req, res) {
    try {
      const { page = 1, limit = 10, sort = '-createdAt', ...filters } = req.query;
      const skip = (page - 1) * limit;
      
      const query = this.model.find(filters);
      const total = await this.model.countDocuments(filters);
      
      const data = await query
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .lean();

      res.json({
        success: true,
        data,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total,
          limit: parseInt(limit)
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  async getById(req, res) {
    try {
      const { id } = req.params;
      const data = await this.model.findById(id).lean();
      
      if (!data) {
        return res.status(404).json({
          success: false,
          error: `${this.model.modelName} not found`
        });
      }

      res.json({
        success: true,
        data
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  async create(req, res) {
    try {
      const data = new this.model(req.body);
      await data.save();
      
      res.status(201).json({
        success: true,
        data
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }

  async update(req, res) {
    try {
      const { id } = req.params;
      const data = await this.model.findByIdAndUpdate(
        id,
        req.body,
        { new: true, runValidators: true }
      );
      
      if (!data) {
        return res.status(404).json({
          success: false,
          error: `${this.model.modelName} not found`
        });
      }

      res.json({
        success: true,
        data
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }

  async delete(req, res) {
    try {
      const { id } = req.params;
      const data = await this.model.findByIdAndDelete(id);
      
      if (!data) {
        return res.status(404).json({
          success: false,
          error: `${this.model.modelName} not found`
        });
      }

      res.json({
        success: true,
        message: `${this.model.modelName} deleted successfully`
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // Error handling helper
  handleError(res, error, statusCode = 500) {
    console.error('Controller Error:', error);
    res.status(statusCode).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }

  // Success response helper
  sendSuccess(res, data, message = 'Success', statusCode = 200) {
    res.status(statusCode).json({
      success: true,
      message,
      data
    });
  }

  // Validation helper
  validateRequired(req, requiredFields) {
    const missing = requiredFields.filter(field => !req.body[field]);
    if (missing.length > 0) {
      throw new Error(`Missing required fields: ${missing.join(', ')}`);
    }
  }
}

module.exports = BaseController;
