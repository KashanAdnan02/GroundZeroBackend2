/**
 * Middleware Index File
 * Centralized export for all middleware functions
 */

const { requireAdmin, requireSuperAdmin } = require('./adminAuth');
const { authenticateUser, optionalAuth } = require('./auth');

module.exports = {
  // Admin authentication middleware
  requireAdmin,
  requireSuperAdmin,
  
  // User authentication middleware
   authenticateUser,
  optionalAuth
};