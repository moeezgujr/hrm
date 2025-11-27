// Create user account through API endpoint

async function createQanzakUser() {
  try {
    console.log('Creating user account for Qanzak Global via API...');
    
    // The credentials that were sent in the email
    const userData = {
      username: 'muhammad0lfc',
      password: 'trialx06z4nho',
      email: 'meetingmattersofficial@gmail.com',
      firstName: 'Muhammad',
      lastName: '',
      role: 'trial_user'
    };

    const response = await fetch('http://localhost:5000/api/create-trial-user', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData)
    });

    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ User account created successfully!');
      console.log('📧 Email:', userData.email);
      console.log('👤 Username:', userData.username);
      console.log('🔐 Password:', userData.password);
      console.log('🆔 User ID:', result.userId);
      
      console.log('\nQanzak Global can now login with:');
      console.log('- Website: https://replit-7w9y--5000.replit.app');
      console.log('- Username:', userData.username);
      console.log('- Password:', userData.password);
    } else {
      console.error('❌ Error creating user:', result.message);
    }

  } catch (error) {
    console.error('❌ Error creating user:', error.message);
  }
}

createQanzakUser();