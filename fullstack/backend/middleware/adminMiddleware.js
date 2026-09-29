const authMiddleware = require('./authMiddleware');
const { isAdminUserId } = require('../utils/admin');

const adminMiddleware = (req, res, next) => {
  authMiddleware(req, res, () => {
    // DEMO: Require both authentication and configured admin authorization
    if (!isAdminUserId(req.user?.id)) {
      return res.status(403).json({ message: 'Admin access is required' });
    }

    next();
  });
};

module.exports = adminMiddleware;
