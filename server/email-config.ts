// Simple email configuration for development testing
// This creates a test email service that logs emails instead of sending them

export interface EmailResult {
  success: boolean;
  messageId?: string;
  previewUrl?: string;
  error?: string;
}

export async function sendTestEmail(to: string, subject: string, html: string): Promise<EmailResult> {
  try {
    // In development, simulate email sending
    console.log('📧 EMAIL NOTIFICATION');
    console.log('━'.repeat(60));
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log('━'.repeat(60));
    console.log('Email Content Preview:');
    console.log(html.replace(/<[^>]*>/g, '').substring(0, 200) + '...');
    console.log('━'.repeat(60));
    
    // Simulate successful email sending
    const messageId = `test-${Date.now()}`;
    const previewUrl = `http://localhost:5000/email-preview/${messageId}`;
    
    console.log(`✅ Onboarding email would be sent to: ${to}`);
    console.log(`📧 Email Preview: ${previewUrl}`);
    console.log('');
    
    return {
      success: true,
      messageId,
      previewUrl
    };
  } catch (error) {
    console.error('❌ Email sending failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}