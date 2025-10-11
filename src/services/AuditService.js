const AuditLog = require('../models/AuditLog');

class AuditService {
  static async logAction(action, details, actor, referenceType = null, referenceId = null) {
    try {
      const auditLog = new AuditLog({
        timestampISO: new Date(),
        displayDateTime: new Date().toLocaleString('en-US', {
          timeZone: 'Asia/Karachi',
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          timeZoneName: 'short'
        }),
        action,
        details,
        actor: actor || 'System',
        referenceType,
        referenceId,
        ipAddress: '127.0.0.1', // This would come from request in real implementation
        userAgent: 'Inventory System'
      });

      await auditLog.save();
      return auditLog;
    } catch (error) {
      console.error('Audit logging failed:', error);
      // Don't throw error to avoid breaking main functionality
    }
  }

  static async logProductAction(action, productId, details, actor, quantity = null, warehouse = null) {
    return this.logAction(
      action,
      details,
      actor,
      'Product',
      productId
    );
  }

  static async logWarehouseAction(action, warehouseId, details, actor) {
    return this.logAction(
      action,
      details,
      actor,
      'Warehouse',
      warehouseId
    );
  }

  static async logPurchaseAction(action, purchaseId, details, actor) {
    return this.logAction(
      action,
      details,
      actor,
      'Purchase',
      purchaseId
    );
  }

  static async logSalesAction(action, salesId, details, actor) {
    return this.logAction(
      action,
      details,
      actor,
      'SalesOrder',
      salesId
    );
  }

  static async getAuditTrail(referenceType, referenceId, limit = 50) {
    try {
      const query = {};
      if (referenceType) query.referenceType = referenceType;
      if (referenceId) query.referenceId = referenceId;

      return await AuditLog.find(query)
        .sort({ timestampISO: -1 })
        .limit(limit)
        .lean();
    } catch (error) {
      console.error('Failed to get audit trail:', error);
      return [];
    }
  }

  static async getProductTimeline(productId, limit = 100) {
    try {
      return await AuditLog.find({
        $or: [
          { referenceType: 'Product', referenceId: productId },
          { details: { $regex: productId, $options: 'i' } }
        ]
      })
        .sort({ timestampISO: 1 })
        .limit(limit)
        .lean();
    } catch (error) {
      console.error('Failed to get product timeline:', error);
      return [];
    }
  }

  static async getUserActivity(userId, limit = 50) {
    try {
      return await AuditLog.find({ actor: userId })
        .sort({ timestampISO: -1 })
        .limit(limit)
        .lean();
    } catch (error) {
      console.error('Failed to get user activity:', error);
      return [];
    }
  }

  static async getSystemStats() {
    try {
      const stats = await AuditLog.aggregate([
        {
          $group: {
            _id: '$action',
            count: { $sum: 1 },
            lastActivity: { $max: '$timestampISO' }
          }
        },
        {
          $sort: { count: -1 }
        }
      ]);

      const totalActions = await AuditLog.countDocuments();
      const todayActions = await AuditLog.countDocuments({
        timestampISO: {
          $gte: new Date(new Date().setHours(0, 0, 0, 0))
        }
      });

      return {
        totalActions,
        todayActions,
        actionBreakdown: stats
      };
    } catch (error) {
      console.error('Failed to get system stats:', error);
      return {
        totalActions: 0,
        todayActions: 0,
        actionBreakdown: []
      };
    }
  }
}

module.exports = AuditService;
