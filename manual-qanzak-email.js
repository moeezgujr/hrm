import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

// Create the exact same transporter configuration as the working emailService
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'meetingmatters786@gmail.com', // The verified working email
    pass: process.env.GMAIL_PASS, // Using the environment variable that works
  },
});

async function sendQanzakApprovalEmail() {
  try {
    // Generate credentials for Muhammad at Qanzak Global
    const credentials = {
      username: 'muhammad' + Math.random().toString(36).substr(2, 4),
      password: 'trial' + Math.random().toString(36).substr(2, 8)
    };

    const subject = '🎉 Trial Approved - Welcome to Meeting Matters!';
    
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Trial Approved</title>
  <style>
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
      line-height: 1.6; 
      color: #333; 
      margin: 0;
      padding: 0;
      background-color: #f8f9fa;
    }
    .container { 
      max-width: 600px; 
      margin: 0 auto; 
      background: white;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    .header { 
      background: linear-gradient(135deg, #16a34a 0%, #15803d 100%); 
      color: white; 
      padding: 30px; 
      text-align: center; 
    }
    .content { 
      padding: 30px; 
    }
    .success-banner { 
      background: #f0fdf4; 
      border: 2px solid #22c55e; 
      padding: 20px; 
      border-radius: 8px; 
      text-align: center; 
      margin: 20px 0; 
    }
    .credentials-box {
      background: #dcfce7; 
      border: 2px solid #16a34a; 
      padding: 25px; 
      border-radius: 8px; 
      margin: 25px 0; 
      text-align: center;
    }
    .cred-item {
      background: white; 
      padding: 20px; 
      border-radius: 6px; 
      margin: 15px 0;
    }
    code {
      background: #f3f4f6; 
      padding: 4px 8px; 
      border-radius: 4px; 
      font-size: 14px;
    }
    .btn {
      display: inline-block; 
      background: #16a34a; 
      color: white; 
      padding: 15px 30px; 
      text-decoration: none; 
      border-radius: 8px; 
      font-weight: 600; 
      font-size: 16px;
      margin: 30px 0;
    }
    .features-box {
      background: #f9fafb; 
      padding: 20px; 
      border-radius: 8px; 
      margin: 20px 0;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎉 Trial Approved!</h1>
      <p style="margin: 0; opacity: 0.9;">Welcome to Meeting Matters</p>
    </div>
    
    <div class="content">
      <p>Hi <strong>Muhammad</strong>,</p>
      
      <div class="success-banner">
        <h2 style="margin: 0 0 8px 0; color: #166534;">Congratulations!</h2>
        <p style="margin: 0; color: #166534;">Your trial request for <strong>Qanzak Global</strong> has been approved!</p>
      </div>

      <p>You now have <strong>14 days of full access</strong> to all Professional plan features.</p>

      <div class="credentials-box">
        <h3 style="margin: 0 0 20px 0; color: #166534; font-size: 20px;">🔑 Your Login Credentials</h3>
        <div class="cred-item">
          <p style="margin: 8px 0; font-size: 16px;"><strong>Website:</strong> <a href="https://replit-7w9y--5000.replit.app" style="color: #166534; text-decoration: none;">https://replit-7w9y--5000.replit.app</a></p>
          <p style="margin: 8px 0; font-size: 16px;"><strong>Username:</strong> <code>${credentials.username}</code></p>
          <p style="margin: 8px 0; font-size: 16px;"><strong>Password:</strong> <code>${credentials.password}</code></p>
        </div>
        <p style="margin-top: 15px; margin-bottom: 0; font-size: 14px; color: #166534;"><em>⚠️ Please change your password after first login for security</em></p>
      </div>

      <div style="text-align: center;">
        <a href="https://replit-7w9y--5000.replit.app" class="btn">
          🚀 Start Your Trial Now
        </a>
      </div>

      <div class="features-box">
        <h3 style="margin: 0 0 12px 0; color: #374151;">During your trial:</h3>
        <ul style="margin: 0; color: #6b7280;">
          <li>Explore all HR management features</li>
          <li>Set up your team and departments</li>
          <li>Test onboarding workflows</li>
          <li>Try psychometric assessments</li>
          <li>Access dedicated customer support</li>
        </ul>
      </div>

      <p>Need help getting started? Contact our support team at <a href="mailto:support@themeetingmatters.com">support@themeetingmatters.com</a></p>
      
      <p>Welcome aboard!</p>
      
      <p>Best regards,<br>
      <strong>The Meeting Matters Team</strong></p>
    </div>
  </div>
</body>
</html>
    `;

    console.log('🚀 Sending trial approval email to Qanzak Global...');
    console.log('📧 Email: meetingmattersofficial@gmail.com');
    console.log('👤 Name: Muhammad');
    console.log('🏢 Company: Qanzak Global');
    console.log('🔑 Username:', credentials.username);
    console.log('🔐 Password:', credentials.password);

    // Send the email
    const result = await transporter.sendMail({
      from: 'meetingmatters786@gmail.com',
      to: 'meetingmattersofficial@gmail.com',
      subject: subject,
      html: htmlContent
    });

    console.log('✅ Email sent successfully!');
    console.log('📨 Message ID:', result.messageId);
    console.log('📧 Email delivered to: meetingmattersofficial@gmail.com');
    console.log('🎯 Login credentials included in the email');
    console.log('');
    console.log('Login Details for Qanzak Global:');
    console.log('- Website: https://replit-7w9y--5000.replit.app');
    console.log('- Username:', credentials.username);
    console.log('- Password:', credentials.password);

  } catch (error) {
    console.error('❌ Failed to send email:', error.message);
    if (error.code) {
      console.error('Error code:', error.code);
    }
  }
}

sendQanzakApprovalEmail();