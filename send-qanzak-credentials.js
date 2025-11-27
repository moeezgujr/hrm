import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

// Create the exact same transporter configuration as the working emailService
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'meetingmatters786@gmail.com',
    pass: process.env.GMAIL_PASS,
  },
});

async function sendCredentialsToQanzak() {
  try {
    const credentials = {
      username: 'muhammad0lfc',
      password: 'trialx06z4nho',
      website: process.env.REPLIT_DOMAINS ? `https://${process.env.REPLIT_DOMAINS.split(',')[0]}/qanzak` : `https://${process.env.REPL_SLUG}--5000.${process.env.REPL_OWNER}.replit.app/qanzak`
    };

    const subject = '✅ WORKING LINK: Your Meeting Matters Login - Custom Access Ready!';
    
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Login Credentials Ready</title>
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
      background: linear-gradient(135deg, #059669 0%, #047857 100%); 
      color: white; 
      padding: 30px; 
      text-align: center; 
    }
    .content { 
      padding: 30px; 
    }
    .ready-banner { 
      background: #f0fdf4; 
      border: 2px solid #22c55e; 
      padding: 25px; 
      border-radius: 8px; 
      text-align: center; 
      margin: 25px 0; 
    }
    .credentials-box {
      background: #dbeafe; 
      border: 2px solid #3b82f6; 
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
      padding: 6px 12px; 
      border-radius: 4px; 
      font-size: 16px;
      font-weight: 600;
      color: #1f2937;
    }
    .btn {
      display: inline-block; 
      background: #059669; 
      color: white; 
      padding: 15px 30px; 
      text-decoration: none; 
      border-radius: 8px; 
      font-weight: 600; 
      font-size: 16px;
      margin: 20px 0;
    }
    .steps-box {
      background: #f9fafb; 
      padding: 20px; 
      border-radius: 8px; 
      margin: 20px 0;
    }
    .step {
      margin: 12px 0;
      padding: 8px 0;
      border-bottom: 1px solid #e5e7eb;
    }
    .step:last-child {
      border-bottom: none;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🚀 Your Trial is Ready!</h1>
      <p style="margin: 0; opacity: 0.9;">Qanzak Global - Meeting Matters Access</p>
    </div>
    
    <div class="content">
      <p>Hi <strong>Muhammad</strong>,</p>
      
      <div class="ready-banner">
        <h2 style="margin: 0 0 8px 0; color: #166534;">✅ CUSTOM ACCESS LINK WORKING</h2>
        <p style="margin: 0; color: #166534;">Your personalized Qanzak Global access link is now active and ready!</p>
      </div>

      <p>Your <strong>14-day Professional plan trial</strong> has been activated and you can now login to explore all features.</p>

      <div class="credentials-box">
        <h3 style="margin: 0 0 20px 0; color: #1e40af; font-size: 20px;">🔑 Your Login Details</h3>
        <div class="cred-item">
          <p style="margin: 8px 0; font-size: 16px;"><strong>Website:</strong></p>
          <p style="margin: 8px 0;"><a href="${credentials.website}" style="color: #1e40af; text-decoration: none; font-weight: 600;">${credentials.website}</a></p>
          
          <p style="margin: 16px 0 8px 0; font-size: 16px;"><strong>Username:</strong></p>
          <p style="margin: 8px 0;"><code>${credentials.username}</code></p>
          
          <p style="margin: 16px 0 8px 0; font-size: 16px;"><strong>Password:</strong></p>
          <p style="margin: 8px 0;"><code>${credentials.password}</code></p>
        </div>
        <p style="margin-top: 15px; margin-bottom: 0; font-size: 14px; color: #1e40af;"><em>💡 We recommend changing your password after first login</em></p>
      </div>

      <div style="text-align: center;">
        <a href="${credentials.website}" class="btn">
          🏢 Access Meeting Matters Now
        </a>
      </div>

      <div class="steps-box">
        <h3 style="margin: 0 0 16px 0; color: #374151;">Quick Start Guide:</h3>
        <div class="step">
          <strong>1.</strong> Click the access link above or visit the website
        </div>
        <div class="step">
          <strong>2.</strong> Enter your username and password
        </div>
        <div class="step">
          <strong>3.</strong> Explore the HR dashboard and features
        </div>
        <div class="step">
          <strong>4.</strong> Test employee onboarding and management tools
        </div>
        <div class="step">
          <strong>5.</strong> Try psychometric assessments and reporting
        </div>
      </div>

      <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin: 20px 0; border-radius: 4px;">
        <p style="margin: 0;"><strong>Need assistance?</strong> Our support team is here to help you get the most out of your trial.</p>
        <p style="margin: 8px 0 0 0;">Contact us: <a href="mailto:support@themeetingmatters.com" style="color: #d97706;">support@themeetingmatters.com</a></p>
      </div>

      <p>We're excited to help <strong>Qanzak Global</strong> streamline your business operations with Meeting Matters!</p>
      
      <p>Best regards,<br>
      <strong>The Meeting Matters Team</strong></p>
    </div>
  </div>
</body>
</html>
    `;

    console.log('📧 Sending login credentials to Qanzak Global...');
    console.log('To:', 'meetingmattersofficial@gmail.com');
    console.log('Username:', credentials.username);
    console.log('Password:', credentials.password);
    console.log('Website:', credentials.website);

    // Send the email
    const result = await transporter.sendMail({
      from: 'meetingmatters786@gmail.com',
      to: 'meetingmattersofficial@gmail.com',
      subject: subject,
      html: htmlContent
    });

    console.log('✅ Login credentials email sent successfully!');
    console.log('📨 Message ID:', result.messageId);
    console.log('📧 Email delivered to: meetingmattersofficial@gmail.com');
    console.log('');
    console.log('=== QANZAK GLOBAL LOGIN DETAILS ===');
    console.log('Website:', credentials.website);
    console.log('Username:', credentials.username);
    console.log('Password:', credentials.password);
    console.log('Status: Account Ready for Immediate Access');

  } catch (error) {
    console.error('❌ Failed to send email:', error.message);
    if (error.code) {
      console.error('Error code:', error.code);
    }
  }
}

sendCredentialsToQanzak();