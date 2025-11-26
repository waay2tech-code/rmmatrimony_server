const User = require("../models/User");

const adminMiddleware = async (req, res, next) => {
  try {
    // First ensure user is authenticated
    if (!req.userId) {
      return res.status(401).json({ message: "Authentication required" });
    }
    
    // Find the user
    const user = await User.findById(req.userId);
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    // Check if user is admin
    if (user.userType !== 'admin') {
      return res.status(403).json({ message: "Access denied. Admins only." });
    }
    
    next();
  } catch (err) {
    console.error("Admin middleware error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

module.exports = adminMiddleware;