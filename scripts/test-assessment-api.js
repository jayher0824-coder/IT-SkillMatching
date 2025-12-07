const fetch = require('node-fetch');

async function testAssessmentAPI() {
  try {
    // First, we need to simulate a logged-in user
    // For testing, we'll just check if the endpoint responds
    
    const baseUrl = 'http://localhost:3000';
    
    console.log('Testing assessment API endpoints...\n');
    
    // Test 1: Get all assessments (without auth - should fail)
    console.log('Test 1: GET /api/assessments (without auth)');
    try {
      const response = await fetch(`${baseUrl}/api/assessments`);
      const data = await response.json();
      console.log('Status:', response.status);
      console.log('Response:', JSON.stringify(data, null, 2));
      console.log('');
    } catch (error) {
      console.log('Error:', error.message);
      console.log('');
    }
    
    // Test 2: Get programming category (without auth - should fail)
    console.log('Test 2: GET /api/assessments?category=programming (without auth)');
    try {
      const response = await fetch(`${baseUrl}/api/assessments?category=programming`);
      const data = await response.json();
      console.log('Status:', response.status);
      console.log('Response:', JSON.stringify(data, null, 2));
      console.log('');
    } catch (error) {
      console.log('Error:', error.message);
      console.log('');
    }
    
    console.log('Note: These endpoints require authentication. To test fully, you need to:');
    console.log('1. Log in through the web interface');
    console.log('2. Check the browser console logs');
    console.log('3. Verify that the assessment loads correctly\n');
    
  } catch (error) {
    console.error('Test error:', error);
  }
}

testAssessmentAPI();
