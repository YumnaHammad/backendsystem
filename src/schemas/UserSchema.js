const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// User Schema
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters long'],
    select: false // Don't include password in queries by default
  },
  role: {
    type: String,
    enum: {
      values: ['admin', 'manager', 'employee', 'viewer'],
      message: 'Role must be one of: admin, manager, employee, viewer'
    },
    default: 'employee'
  },
  department: {
    type: String,
    enum: ['management', 'warehouse', 'sales', 'purchasing', 'finance', 'it'],
    default: 'warehouse'
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended'],
    default: 'active'
  },
  profile: {
    phone: {
      type: String,
      trim: true
    },
    avatar: {
      type: String,
      trim: true
    },
    address: {
      street: String,
      city: String,
      state: String,
      country: {
        type: String,
        default: 'Pakistan'
      },
      postalCode: String
    },
    emergencyContact: {
      name: String,
      phone: String,
      relationship: String
    },
    dateOfBirth: Date,
    hireDate: {
      type: Date,
      default: Date.now
    },
    employeeId: {
      type: String,
      unique: true,
      sparse: true
    }
  },
  permissions: {
    canCreateProducts: {
      type: Boolean,
      default: false
    },
    canEditProducts: {
      type: Boolean,
      default: false
    },
    canDeleteProducts: {
      type: Boolean,
      default: false
    },
    canManageWarehouses: {
      type: Boolean,
      default: false
    },
    canProcessPurchases: {
      type: Boolean,
      default: false
    },
    canProcessSales: {
      type: Boolean,
      default: false
    },
    canViewReports: {
      type: Boolean,
      default: false
    },
    canManageUsers: {
      type: Boolean,
      default: false
    },
    canAccessFinance: {
      type: Boolean,
      default: false
    }
  },
  lastLogin: {
    type: Date
  },
  loginAttempts: {
    type: Number,
    default: 0
  },
  lockUntil: {
    type: Date
  },
  // Audit fields
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ status: 1 });
userSchema.index({ 'profile.employeeId': 1 });

// Virtual for full name
userSchema.virtual('fullName').get(function() {
  return this.name;
});

// Virtual for account locked status
userSchema.virtual('isLocked').get(function() {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

// Virtual for user display info
userSchema.virtual('displayInfo').get(function() {
  return {
    id: this._id,
    name: this.name,
    email: this.email,
    role: this.role,
    department: this.department,
    status: this.status,
    lastLogin: this.lastLogin,
    isLocked: this.isLocked
  };
});

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
  // Only hash password if it's been modified
  if (!this.isModified('password')) return next();
  
  try {
    // Hash password with cost of 12
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Pre-save middleware to generate employee ID
userSchema.pre('save', function(next) {
  if (this.isNew && !this.profile.employeeId && this.role !== 'admin') {
    const prefix = this.department.substring(0, 3).toUpperCase();
    const timestamp = Date.now().toString().slice(-6);
    this.profile.employeeId = `${prefix}-${timestamp}`;
  }
  next();
});

// Instance methods
userSchema.methods.comparePassword = async function(candidatePassword) {
  if (!this.password) {
    throw new Error('Password not set');
  }
  return await bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.incLoginAttempts = function() {
  // If we have a previous lock that has expired, restart at 1
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $unset: { lockUntil: 1 },
      $set: { loginAttempts: 1 }
    });
  }
  
  const updates = { $inc: { loginAttempts: 1 } };
  
  // Lock account after 5 failed attempts for 2 hours
  if (this.loginAttempts + 1 >= 5 && !this.isLocked) {
    updates.$set = { lockUntil: Date.now() + 2 * 60 * 60 * 1000 }; // 2 hours
  }
  
  return this.updateOne(updates);
};

userSchema.methods.resetLoginAttempts = function() {
  return this.updateOne({
    $unset: { loginAttempts: 1, lockUntil: 1 },
    $set: { lastLogin: new Date() }
  });
};

userSchema.methods.hasPermission = function(permission) {
  if (this.role === 'admin') return true;
  return this.permissions[permission] === true;
};

userSchema.methods.canAccess = function(resource, action) {
  if (this.role === 'admin') return true;
  
  const permissionMap = {
    'products': {
      'create': 'canCreateProducts',
      'edit': 'canEditProducts',
      'delete': 'canDeleteProducts',
      'view': true // Everyone can view products
    },
    'warehouses': {
      'manage': 'canManageWarehouses',
      'view': true
    },
    'purchases': {
      'process': 'canProcessPurchases',
      'view': true
    },
    'sales': {
      'process': 'canProcessSales',
      'view': true
    },
    'reports': {
      'view': 'canViewReports'
    },
    'users': {
      'manage': 'canManageUsers',
      'view': this.role === 'manager' || this.role === 'admin'
    },
    'finance': {
      'access': 'canAccessFinance',
      'view': this.role === 'admin'
    }
  };
  
  const permission = permissionMap[resource]?.[action];
  if (permission === true) return true;
  if (typeof permission === 'string') return this.hasPermission(permission);
  
  return false;
};

// Static methods
userSchema.statics.findByRole = function(role) {
  return this.find({ role, status: 'active' });
};

userSchema.statics.findByDepartment = function(department) {
  return this.find({ department, status: 'active' });
};

userSchema.statics.findActive = function() {
  return this.find({ status: 'active' });
};

userSchema.statics.findAdmins = function() {
  return this.find({ role: 'admin', status: 'active' });
};

// Set default permissions based on role
userSchema.methods.setDefaultPermissions = function() {
  switch (this.role) {
    case 'admin':
      Object.keys(this.permissions).forEach(key => {
        this.permissions[key] = true;
      });
      break;
    case 'manager':
      this.permissions.canCreateProducts = true;
      this.permissions.canEditProducts = true;
      this.permissions.canManageWarehouses = true;
      this.permissions.canProcessPurchases = true;
      this.permissions.canProcessSales = true;
      this.permissions.canViewReports = true;
      // Managers cannot manage users or access finance
      this.permissions.canManageUsers = false;
      this.permissions.canAccessFinance = false;
      break;
    case 'employee':
      this.permissions.canProcessPurchases = true;
      this.permissions.canProcessSales = true;
      break;
    case 'viewer':
      this.permissions.canViewReports = true;
      break;
  }
};

module.exports = userSchema;
