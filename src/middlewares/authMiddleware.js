// // backend/middlewares/authMiddleware.js
// const jwt = require("jsonwebtoken");



// //const jwt = require("jsonwebtoken");

// const authMiddleware = (req, res, next) => {
//   const authHeader = req.header("Authorization");
//   if (!authHeader) {
//     return res.status(401).json({ message: "No token, authorization denied" });
//   }


//   console.log("Authorization Header:", authHeader);
  
//   const token = authHeader.split(" ")[1];
//   if (!token) {
//     return res.status(401).json({ message: "Invalid token format" });
//   }
//   console.log("Extracted Token:", token);
  
//   try {
//     const decoded = jwt.verify(token, process.env.JWT_SECRET);
//     console.log("Decoded JWT:", decoded); // ✅ Debug here
//     req.userId = decoded.id; // Must match what you added during jwt.sign()
//     next();
//   } catch (err) {
//     return res.status(401).json({ message: "Token is not valid" });
//   }
// };


// // Export whichever you want to use
// module.exports = authMiddleware;
// backend/middlewares/authMiddleware.js
const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {
  // Try to get token from cookie first, then from Authorization header
  let token = req.cookies?.token;
  
  if (!token) {
    const authHeader = req.header("Authorization");
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    }
  }

  if (!token) {
    return res.status(401).json({ message: "No token, authorization denied" });
  }

  console.log("Extracted Token:", token);
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("Decoded JWT:", decoded);
    req.userId = decoded.id;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Token is not valid" });
  }
};

module.exports = authMiddleware;
