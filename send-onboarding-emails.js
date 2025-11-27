// Script to send onboarding emails to all approved employees
// This demonstrates how to send the emails using the working tokens

const employees = [
  {
    name: "Kashif Rehman",
    email: "kashifrehmanpk@gmail.com", 
    token: "onb_1754671999.938694_4f169c235c0e443"
  },
  {
    name: "Muhammad Usama Bin Munem",
    email: "mahikhan200@outlook.com",
    token: "onb_1754671999.938694_4651e5696e816d0"
  },
  {
    name: "Albas Ul",
    email: "albashbilal318@gmail.com", 
    token: "onb_1754672088.625962_9a90117b3bd12d4"
  },
  {
    name: "Albash Ul Haq",
    email: "albashulhaq@gmail.com",
    token: "onb_1754672088.625962_1217b5b6c949fff" 
  }
];

// Function to send emails via API
async function sendOnboardingEmails() {
  const baseUrl = 'http://localhost:5000';
  
  for (const employee of employees) {
    try {
      const response = await fetch(`${baseUrl}/api/send-onboarding-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          employeeEmail: employee.email,
          employeeName: employee.name,
          onboardingToken: employee.token
        })
      });
      
      if (response.ok) {
        console.log(`✅ Email sent successfully to ${employee.name} (${employee.email})`);
      } else {
        console.log(`❌ Failed to send email to ${employee.name}: ${response.statusText}`);
      }
    } catch (error) {
      console.log(`❌ Error sending email to ${employee.name}: ${error.message}`);
    }
  }
}

// Example usage:
// node send-onboarding-emails.js
// sendOnboardingEmails();

console.log("Onboarding email script ready!");
console.log("Working onboarding tokens generated for all employees:");
employees.forEach(emp => {
  console.log(`${emp.name}: https://your-domain.com/employee-onboarding?token=${emp.token}`);
});