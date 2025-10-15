const nodemailer = require('nodemailer');

// Email service configuration
class EmailService {
  constructor() {
    this.transporter = null;
    this.initializeTransporter();
  }

  // Initialize email transporter with configuration
  initializeTransporter() {
    try {
      // Check if email credentials are configured
      if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
        console.warn('⚠️  Email credentials not configured. Password reset emails will not be sent.');
        console.warn('📧 Please set SMTP_USER and SMTP_PASS in your .env file to enable email functionality.');
        this.transporter = null;
        return;
      }

      // Validate email credentials format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(process.env.SMTP_USER)) {
        console.error('❌ Invalid SMTP_USER email format:', process.env.SMTP_USER);
        console.warn('📧 Please provide a valid email address for SMTP_USER in your .env file.');
        this.transporter = null;
        return;
      }

      // Validate SMTP_PASS is not empty
      if (process.env.SMTP_PASS.trim().length < 8) {
        console.error('❌ SMTP_PASS appears to be too short or invalid.');
        console.warn('📧 Please ensure SMTP_PASS is a valid app password (16 characters for Gmail).');
        this.transporter = null;
        return;
      }

      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT) || 587,
        secure: false, // true for 465, false for other ports
        auth: {
          user: process.env.SMTP_USER, // Your email
          pass: process.env.SMTP_PASS, // Your app password
        },
        tls: {
          rejectUnauthorized: false
        },
        timeout: 10000, // 10 seconds timeout
        connectionTimeout: 10000, // Connection timeout
        greetingTimeout: 5000, // Greeting timeout
        socketTimeout: 10000 // Socket timeout
      });

      // Verify connection configuration only if credentials are provided
      this.verifyConnection();
    } catch (error) {
      console.error('❌ Email service initialization failed:', error.message);
      this.transporter = null;
    }
  }

  // Verify email connection
  async verifyConnection() {
    if (!this.transporter) {
      console.log('📧 Email service not configured - skipping verification');
      return;
    }
    
    try {
      const verificationResult = await Promise.race([
        this.transporter.verify(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Email verification timeout')), 15000)
        )
      ]);
      
      console.log('✅ Email service ready and verified');
      return true;
    } catch (error) {
      console.error('❌ Email service connection failed:', error.message);
      console.warn('📝 Please check your email credentials in .env file');
      
      // Provide specific error guidance
      if (error.message.includes('authentication')) {
        console.warn('💡 Tip: For Gmail, use an App Password instead of your regular password');
        console.warn('💡 Enable 2FA and generate App Password: https://support.google.com/accounts/answer/185833');
      } else if (error.message.includes('timeout')) {
        console.warn('💡 Tip: Check your network connection and firewall settings');
      }
      
      this.transporter = null;
      return false;
    }
  }

  // Send password reset email
  async sendPasswordResetEmail(userEmail, resetToken, userName) {
    try {
      // Validate input parameters
      if (!userEmail || !resetToken) {
        throw new Error('Missing required parameters: userEmail and resetToken are required');
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(userEmail)) {
        throw new Error('Invalid email address format');
      }

      // Check if email service is configured
      if (!this.transporter) {
        console.warn('⚠️  Email service not configured. Cannot send password reset email.');
        console.log('📝 For testing: Reset token would be:', resetToken);
        console.log('🔗 Reset URL would be:', `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`);
        throw new Error('Email service not configured. Please set up SMTP credentials.');
      }

      const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`;
      
      const mailOptions = {
        from: {
          name: 'RM Matrimony',
          address: process.env.SMTP_USER || 'noreply@rmmatrimony.com'
        },
        to: userEmail,
        subject: 'Password Reset Request - RM Matrimony',
        html: this.getPasswordResetTemplate(userName, resetUrl),
        text: this.getPasswordResetTextTemplate(userName, resetUrl)
      };

      // Send email with timeout
      const result = await Promise.race([
        this.transporter.sendMail(mailOptions),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Email send timeout')), 30000)
        )
      ]);

      console.log('✅ Password reset email sent:', result.messageId);
      return { success: true, messageId: result.messageId };

    } catch (error) {
      console.error('❌ Failed to send password reset email:', error.message);
      
      // Provide specific error guidance
      if (error.message.includes('authentication')) {
        console.warn('💡 Email authentication failed - check SMTP credentials');
      } else if (error.message.includes('timeout')) {
        console.warn('💡 Email send timeout - check network connection');
      } else if (error.message.includes('Invalid email')) {
        console.warn('💡 Invalid recipient email address');
      }
      
      throw new Error(error.message || 'Failed to send password reset email');
    }
  }

  // HTML email template for password reset
  getPasswordResetTemplate(userName, resetUrl) {
    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Reset - RM Matrimony</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
            .container { background-color: #f9f9f9; padding: 30px; border-radius: 10px; }
            .header { text-align: center; margin-bottom: 30px; }
            .logo { background-color: #dc2626; color: white; padding: 15px; border-radius: 50%; display: inline-block; font-size: 24px; margin-bottom: 20px; }
            .reset-button { background-color: #dc2626; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0; font-weight: bold; }
            .reset-button:hover { background-color: #b91c1c; }
            .warning { background-color: #fef3c7; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #f59e0b; }
            .footer { text-align: center; margin-top: 30px; font-size: 14px; color: #666; }
            .security-info { background-color: #f0f9ff; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #3b82f6; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="logo">❤</div>
                <h1>Password Reset Request</h1>
            </div>
            
            <p>Hello ${userName || 'User'},</p>
            
            <p>We received a request to reset your password for your RM Matrimony account. If you made this request, click the button below to reset your password:</p>
            
            <div style="text-align: center;">
                <a href="${resetUrl}" class="reset-button">Reset My Password</a>
            </div>
            
            <div class="security-info">
                <h3>🔒 Security Information:</h3>
                <ul>
                    <li>This link will expire in <strong>30 minutes</strong></li>
                    <li>This link can only be used once</li>
                    <li>If you don't reset your password within 30 minutes, you'll need to request a new reset link</li>
                </ul>
            </div>
            
            <div class="warning">
                <h3>⚠️ Important Security Notice:</h3>
                <p>If you did not request this password reset, please ignore this email and your password will remain unchanged. Someone may have entered your email address by mistake.</p>
                <p>For your security, never share this link with anyone.</p>
            </div>
            
            <p>If the button above doesn't work, you can copy and paste this link into your browser:</p>
            <p style="word-break: break-all; background-color: #f5f5f5; padding: 10px; border-radius: 3px;">${resetUrl}</p>
            
            <div class="footer">
                <p>Best regards,<br>The RM Matrimony Team</p>
                <p style="font-size: 12px;">This is an automated email. Please do not reply to this email.</p>
            </div>
        </div>
    </body>
    </html>
    `;
  }

  // Plain text template for email clients that don't support HTML
  getPasswordResetTextTemplate(userName, resetUrl) {
    return `
Password Reset Request - RM Matrimony

Hello ${userName || 'User'},

We received a request to reset your password for your RM Matrimony account. 

To reset your password, click the following link:
${resetUrl}

SECURITY INFORMATION:
- This link will expire in 30 minutes
- This link can only be used once
- If you don't reset your password within 30 minutes, you'll need to request a new reset link

IMPORTANT SECURITY NOTICE:
If you did not request this password reset, please ignore this email and your password will remain unchanged. Someone may have entered your email address by mistake.

For your security, never share this link with anyone.

Best regards,
The RM Matrimony Team

This is an automated email. Please do not reply to this email.
    `;
  }

  // Send general notification email (can be extended for other purposes)
  async sendNotificationEmail(userEmail, subject, message, userName) {
    try {
      // Validate input parameters
      if (!userEmail || !subject || !message) {
        throw new Error('Missing required parameters: userEmail, subject, and message are required');
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(userEmail)) {
        throw new Error('Invalid email address format');
      }

      // Check if email service is configured
      if (!this.transporter) {
        console.warn('⚠️  Email service not configured. Cannot send notification email.');
        throw new Error('Email service not configured. Please set up SMTP credentials.');
      }

      const mailOptions = {
        from: {
          name: 'RM Matrimony',
          address: process.env.SMTP_USER || 'noreply@rmmatrimony.com'
        },
        to: userEmail,
        subject: subject,
        html: this.getGeneralTemplate(userName, subject, message),
        text: `Hello ${userName || 'User'},\n\n${message}\n\nBest regards,\nThe RM Matrimony Team`
      };

      // Send email with timeout
      const result = await Promise.race([
        this.transporter.sendMail(mailOptions),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Email send timeout')), 30000)
        )
      ]);

      console.log('✅ Notification email sent:', result.messageId);
      return { success: true, messageId: result.messageId };

    } catch (error) {
      console.error('❌ Failed to send notification email:', error.message);
      
      // Provide specific error guidance
      if (error.message.includes('authentication')) {
        console.warn('💡 Email authentication failed - check SMTP credentials');
      } else if (error.message.includes('timeout')) {
        console.warn('💡 Email send timeout - check network connection');
      }
      
      throw new Error('Failed to send notification email');
    }
  }

  // General email template
  getGeneralTemplate(userName, subject, message) {
    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${subject}</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
            .container { background-color: #f9f9f9; padding: 30px; border-radius: 10px; }
            .header { text-align: center; margin-bottom: 30px; }
            .logo { background-color: #dc2626; color: white; padding: 15px; border-radius: 50%; display: inline-block; font-size: 24px; margin-bottom: 20px; }
            .footer { text-align: center; margin-top: 30px; font-size: 14px; color: #666; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="logo">❤</div>
                <h1>${subject}</h1>
            </div>
            
            <p>Hello ${userName || 'User'},</p>
            <p>${message}</p>
            
            <div class="footer">
                <p>Best regards,<br>The RM Matrimony Team</p>
            </div>
        </div>
    </body>
    </html>
    `;
  }
}

// Export singleton instance
module.exports = new EmailService();