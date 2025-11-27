// Script to send approval email to Qanzak Global
import { TrialNotificationService } from './server/trial-notifications.js';

const trialData = {
  email: 'meetingmattersofficial@gmail.com',
  name: 'Muhammad',
  company: 'Qanzak Global',
  planId: 'professional'
};

// Generate secure credentials for Qanzak Global
const loginCredentials = {
  username: 'muhammad' + Math.random().toString(36).substr(2, 4),
  password: 'trial' + Math.random().toString(36).substr(2, 8)
};

async function sendApprovalEmail() {
  try {
    console.log('Sending approval email to Qanzak Global...');
    console.log('Email:', trialData.email);
    console.log('Name:', trialData.name);
    console.log('Company:', trialData.company);
    console.log('Plan:', trialData.planId);
    console.log('Username:', loginCredentials.username);
    console.log('Password:', loginCredentials.password);
    
    const trialNotificationService = new TrialNotificationService();
    await trialNotificationService.sendTrialApprovalNotification(
      trialData.email,
      trialData.name,
      trialData.company,
      trialData.planId,
      loginCredentials
    );
    
    console.log('✅ Approval email sent successfully to Qanzak Global!');
    console.log('📧 Email sent to:', trialData.email);
    console.log('🔑 Login credentials included in email');
    
  } catch (error) {
    console.error('❌ Failed to send approval email:', error);
    console.error('Error details:', error.message);
  }
}

sendApprovalEmail();