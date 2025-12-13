const ErrorResponse = require('../utils/errorResponse');

// Grant access to specific roles
const permit = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new ErrorResponse('User not authenticated', 401));
    }
    
    if (!roles.includes(req.user.role)) {
      return next(new ErrorResponse(`Role '${req.user.role}' is not authorized`, 403));
    }
    
    next();
  };
};

module.exports = { permit };