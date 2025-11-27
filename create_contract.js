import fs from 'fs';

// Read the contract content
const contractContent = fs.readFileSync('muqaddas_contract_content.txt', 'utf8');

// Read session cookies
const cookies = fs.readFileSync('current_session_cookies.txt', 'utf8');

const contractData = {
  userId: 49,
  contractType: "employment_offer",
  jobTitle: "Customer Relationship Manager (CRM)",
  department: "Customer Relations",
  salary: "60000",
  currency: "PKR",
  startDate: "2025-09-01T00:00:00.000Z",
  contractDuration: "permanent",
  workingHours: "10:00 AM to 6:00 PM (Monday to Saturday)",
  probationPeriod: "3 months",
  benefits: "Health insurance, Performance bonus as per policy, Annual leave (21 days), Professional development opportunities",
  contractContent: contractContent
};

console.log('Creating contract with data:', JSON.stringify(contractData, null, 2));

fetch('http://localhost:5000/api/contracts', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Cookie': cookies.trim()
  },
  body: JSON.stringify(contractData)
})
.then(response => {
  console.log('HTTP Status:', response.status);
  return response.text();
})
.then(data => {
  console.log('Response:', data);
})
.catch(error => {
  console.error('Error:', error);
});