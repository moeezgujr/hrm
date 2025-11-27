import fs from 'fs';

// Read the contract content
const contractContent = fs.readFileSync('muqaddas_contract_content.txt', 'utf8');

// Read admin cookies
const cookies = fs.readFileSync('admin_cookies_new.txt', 'utf8');

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

console.log('Creating contract for Muqaddas Saeed...');

fetch('http://localhost:5000/api/contracts', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Cookie': cookies.split('\n').find(line => line.includes('connect.sid'))?.split('\t').pop() || ''
  },
  body: JSON.stringify(contractData)
})
.then(response => {
  console.log('HTTP Status:', response.status);
  return response.text();
})
.then(data => {
  console.log('Response:', data);
  try {
    const json = JSON.parse(data);
    console.log('Contract created successfully with ID:', json.id);
  } catch (e) {
    console.log('Response text:', data);
  }
})
.catch(error => {
  console.error('Error:', error);
});