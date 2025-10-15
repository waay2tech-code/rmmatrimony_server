const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const moment = require('moment'); // Install: npm install moment
const crypto = require('crypto');
const emailService = require('../services/emailService');
const { generateMemberID, ensureMemberID } = require('../utils/memberIdGenerator');
// exports.register = async (req, res) => {
//    console.log("register",req.body);
   
//   try {
//     const { name, email, password ,gender,phone,age} = req.body;
//     if (!name || !email || !password || !gender || !phone) {
//       return res.status(400).json({ msg: "❌ All fields are required" });
//     }

//     const existingUser = await User.findOne({ email });
//     if (existingUser) {
//       return res.status(400).json({ msg: "❌ Email already registered" });
//     }

//     const hashedPassword = await bcrypt.hash(password, 10);
//     const user = new User({ name, email, password: hashedPassword, mobile:phone,gender,age});
//     await user.save();

//     res.status(201).json({ msg: '✅ Registered successfully' });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// };




// controllers/authController.js

exports.register = async (req, res) => {
  console.log("register", req.body);
  
  try {
    const { name, email, password, gender, phone, age, isAdmin } = req.body;
    if (!name || !email || !password || !gender || !phone) {
      return res.status(400).json({ msg: "❌ All fields are required" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ msg: "❌ Email already registered" });
    }
    const existingPhone = await User.findOne({ mobile: phone });
    if (existingPhone) {
      return res.status(400).json({ msg: "❌ Phone number already registered" });
    }

    // Generate Member ID using utility function
    const memberid = await generateMemberID();
    
    console.log("Generated Member ID:", memberid);

    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Determine user type - admin or regular user
    const userType = isAdmin ? 'admin' : 'user';
    
    const user = new User({ 
      name, 
      email, 
      password: hashedPassword, 
      mobile: phone, 
      gender, 
      age,
      memberid, // Add the generated member ID
      userType // Set user type
    });
    
    await user.save();

    res.status(201).json({ 
      msg: '✅ Registered successfully', 
      memberid: memberid 
    });
  } catch (err) {
    console.error("Registration error:", err);
    res.status(500).json({ error: err.message });
  }
};

// Special endpoint for admin registration
// This should be protected in production with additional security measures
exports.adminRegister = async (req, res) => {
  console.log("Admin register", req.body);
  
  try {
    const { name, email, password } = req.body;
    
    // Validate required fields
    if (!name || !email || !password) {
      return res.status(400).json({ msg: "❌ All fields are required" });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ msg: "❌ Email already registered" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
     // Generate Member ID using utility function
     const memberid = await generateMemberID();
    console.log("Generated Member ID:", memberid);
    // Create admin user
    const user = new User({ 
      name, 
      email, 
      password: hashedPassword,
      memberid,
      userType: 'admin' // Explicitly set as admin
    });
    
    await user.save();

    res.status(201).json({ 
      msg: '✅ Admin registered successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        userType: user.userType
      }
    });
  } catch (err) {
    console.error("Admin registration errorrrrrrrrrrrrrrrr:", err);
    res.status(500).json({ error: err.message });
  }
};

exports.login = async (req, res) => {

  try {
    const { email, password } = req.body;
    console.log(req.body);
    
    if (!email || !password)
      return res.status(400).json({ msg: "❌ All fields are required" });

    const user = await User.findOne({ email });
    if (!user)
      return res.status(400).json({ msg: "❌ Invalid email or password" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(400).json({ msg: "❌ Invalid email or password" });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: '1d',
    });

    // Set HTTP-only cookie
    res.cookie('token', token, {
      httpOnly: true,        // Prevents XSS attacks
      secure: process.env.NODE_ENV === 'production', // HTTPS only in production
      sameSite: 'strict',    // CSRF protection
      maxAge: 24 * 60 * 60 * 1000, // 1 day
    });

    res.json({
      success: true,
      user: { 
        id: user._id, 
        name: user.name, 
        email: user.email,
        gender: user.gender,
        phone: user.mobile,
        usertype: user.userType // Fixed: was user.userType, not user.usertype
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.msg });
  }
};

// Add logout controller
// Backend logout controller
exports.logout = async (req, res) => {
  try {
    // Clear the HTTP-only cookie
    res.clearCookie('token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    });

    res.json({
      success: true,
      message: "Logged out successfully"
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getCurrentUser= async (req, res) => {
  //console.log("Decoded from token:", req.user);
  console.log("userId:", req.userId);
  const userId = req.userId;
  
  try {
    // Fetch user profile without password
    let user = await User.findById(userId).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Ensure user has a member ID, generate one if missing
    if (!user.memberid) {
      console.log(`User ${user.name} missing member ID, generating...`);
      const memberid = await ensureMemberID(userId);
      // Fetch updated user data
      user = await User.findById(userId).select("-password");
    }

    // Fetch user's gallery photos
  //  const gallery = await UserGallery.findOne({ userId: userId });
    
    // Extract photos array or set empty array if no gallery found
   // const photos = gallery ? gallery.photos : [];

    res.status(200).json({ 
      profile: user
    
    });
  } catch (error) {
    console.error("Profile fetch error:", error);
    res.status(500).json({ message: "Error fetching profile" });
  }
};


// ✅ Forgot Password - Request password reset
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    
    // Validate input
    if (!email) {
      return res.status(400).json({ 
        success: false,
        message: "Email address is required" 
      });
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return res.status(400).json({ 
        success: false,
        message: "Please provide a valid email address" 
      });
    }

    // Check if user exists (but don't reveal if email doesn't exist for security)
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    
    // Always return success message for security (prevent email enumeration)
    const successMessage = "If an account with that email exists, we've sent password reset instructions.";
    
    if (!user) {
      // Still return success to prevent email enumeration attacks
      return res.status(200).json({
        success: true,
        message: successMessage
      });
    }

    // Check if a reset was recently requested (rate limiting)
    const now = new Date();
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
    
    if (user.resetPasswordExpires && user.resetPasswordExpires > fiveMinutesAgo) {
      return res.status(429).json({
        success: false,
        message: "Password reset was recently requested. Please wait 5 minutes before requesting again."
      });
    }

    // Generate secure reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    
    // Set token and expiration (30 minutes from now)
    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpires = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
    
    await user.save();

    // Send password reset email
    try {
      await emailService.sendPasswordResetEmail(user.email, resetToken, user.name);
      console.log("✅ Password reset email sent to:", user.email);
    } catch (emailError) {
      console.error("❌ Email sending failed:", emailError.message);
      
      // In development, don't fail the request if email service isn't configured
      if (emailError.message.includes('Email service not configured')) {
        console.log("🔧 Development mode: Password reset token generated but email not sent");
        console.log("🔗 Reset URL for testing:", `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`);
        
        // Don't clear the token in development - let user test with console URL
        return res.status(200).json({
          success: true,
          message: "Password reset request processed. Check server console for reset link (development mode).",
          devMode: process.env.NODE_ENV === 'development'
        });
      } else {
        // Clear the reset token only for actual email service failures
        user.resetPasswordToken = null;
        user.resetPasswordExpires = null;
        await user.save();
        
        return res.status(500).json({
          success: false,
          message: "Failed to send password reset email. Please try again later."
        });
      }
    }

    res.status(200).json({
      success: true,
      message: successMessage
    });
    
  } catch (error) {
    console.error("❌ Forgot password error:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred while processing your request. Please try again later."
    });
  }
};

// ✅ Reset Password - Verify token and update password
exports.resetPassword = async (req, res) => {
  try {
    const { token, newPassword, confirmPassword } = req.body;
    
    // Validate required fields
    if (!token || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "All fields are required (token, newPassword, confirmPassword)"
      });
    }
    
    // Validate token format
    if (typeof token !== 'string' || token.length !== 64) {
      return res.status(400).json({
        success: false,
        message: "Invalid token format"
      });
    }
    
    // Validate passwords match
    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Passwords do not match"
      });
    }
    
    // Validate password strength
    const passwordValidation = validatePasswordStrength(newPassword);
    if (!passwordValidation.isValid) {
      return res.status(400).json({
        success: false,
        message: "Password does not meet security requirements",
        errors: passwordValidation.errors
      });
    }
    
    // Hash the provided token
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    
    // Find user with valid reset token
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() }
    });
    
    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired password reset token. Please request a new password reset."
      });
    }
    
    // Check if new password is different from current password
    const isSamePassword = await bcrypt.compare(newPassword, user.password);
    if (isSamePassword) {
      return res.status(400).json({
        success: false,
        message: "New password must be different from your current password"
      });
    }
    
    // Hash new password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
    
    // Update user password and clear reset token
    user.password = hashedPassword;
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    user.lastPasswordReset = new Date();
    user.updatedAt = new Date();
    
    await user.save();
    
    console.log("✅ Password successfully reset for user:", user.email);
    
    // Send confirmation email (optional - don't fail if this fails)
    try {
      await emailService.sendNotificationEmail(
        user.email,
        'Password Successfully Reset - RM Matrimony',
        'Your password has been successfully reset. If you did not make this change, please contact our support team immediately.',
        user.name
      );
    } catch (emailError) {
      console.error("❌ Password reset confirmation email failed:", emailError);
      // Don't fail the request if confirmation email fails
    }
    
    res.status(200).json({
      success: true,
      message: "Password has been successfully reset. You can now log in with your new password."
    });
    
  } catch (error) {
    console.error("❌ Reset password error:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred while resetting your password. Please try again later."
    });
  }
};

// ✅ Password strength validation function
function validatePasswordStrength(password) {
  const errors = [];
  
  // Basic validation
  if (!password || typeof password !== 'string') {
    errors.push("Password is required");
    return { isValid: false, errors };
  }
  
  // Minimum length check
  if (password.length < 8) {
    errors.push("Password must be at least 8 characters long");
  }
  
  // Maximum length check (prevent DoS)
  if (password.length > 128) {
    errors.push("Password must be less than 128 characters long");
  }
  
  // Check for uppercase letter
  if (!/[A-Z]/.test(password)) {
    errors.push("Password must contain at least one uppercase letter");
  }
  
  // Check for lowercase letter
  if (!/[a-z]/.test(password)) {
    errors.push("Password must contain at least one lowercase letter");
  }
  
  // Check for number
  if (!/\d/.test(password)) {
    errors.push("Password must contain at least one number");
  }
  
  // Check for special character
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push("Password must contain at least one special character");
  }
  
  // Check for common weak patterns
  const commonPatterns = [
    { pattern: /123456/, message: "Contains common number sequence" },
    { pattern: /password/i, message: "Contains the word 'password'" },
    { pattern: /qwerty/i, message: "Contains keyboard pattern 'qwerty'" },
    { pattern: /abc123/i, message: "Contains common pattern 'abc123'" },
    { pattern: /(.)\1{3,}/, message: "Contains too many repeated characters" },
  ];
  
  for (const { pattern, message } of commonPatterns) {
    if (pattern.test(password)) {
      errors.push(message);
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors: errors
  };
}