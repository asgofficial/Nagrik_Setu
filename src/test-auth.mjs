// Test JWT Authentication API Endpoints
const BASE_URL = 'http://localhost:3001';

async function runTests() {
  console.log('=== STARTING JWT AUTHENTICATION TESTS ===\n');

  // 1. Test Seed User Login (Citizen)
  console.log('1. Testing Seed Citizen Login (citizen@nagriksetu.gov.in)...');
  const loginRes1 = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'citizen@nagriksetu.gov.in',
      password: 'Citizen@123'
    })
  });
  const loginData1 = await loginRes1.json();
  console.log('Status:', loginRes1.status);
  console.log('Response:', JSON.stringify(loginData1, null, 2));
  console.log('Cookie header:', loginRes1.headers.get('set-cookie'));
  const citizenToken = loginData1.token;

  if (!citizenToken) throw new Error('Citizen login failed!');
  console.log('✅ Seed Citizen Login Passed\n');

  // 2. Test /api/auth/me with Bearer Token
  console.log('2. Testing /api/auth/me with Bearer Token...');
  const meRes = await fetch(`${BASE_URL}/api/auth/me`, {
    headers: { 'Authorization': `Bearer ${citizenToken}` }
  });
  const meData = await meRes.json();
  console.log('Status:', meRes.status);
  console.log('Response:', JSON.stringify(meData, null, 2));
  if (!meData.user || meData.user.email !== 'citizen@nagriksetu.gov.in') {
    throw new Error('/api/auth/me verification failed');
  }
  console.log('✅ /api/auth/me Bearer Token Verification Passed\n');

  // 3. Test New User Registration (Citizen)
  const testEmail = `testuser_${Date.now()}@example.com`;
  console.log(`3. Testing New User Registration (${testEmail})...`);
  const regRes = await fetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Rohan Sharma',
      email: testEmail,
      password: 'TestPassword@123',
      phone: '9876543299',
      role: 'citizen'
    })
  });
  const regData = await regRes.json();
  console.log('Status:', regRes.status);
  console.log('Response:', JSON.stringify(regData, null, 2));
  if (!regData.token || !regData.user) {
    throw new Error('Registration failed!');
  }
  console.log('✅ New User Registration Passed\n');

  // 4. Test Login with New User
  console.log('4. Testing Login with Newly Registered User...');
  const newLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: testEmail,
      password: 'TestPassword@123'
    })
  });
  const newLoginData = await newLoginRes.json();
  console.log('Status:', newLoginRes.status);
  console.log('Response:', JSON.stringify(newLoginData, null, 2));
  if (!newLoginData.token) throw new Error('New user login failed!');
  console.log('✅ New User Login Passed\n');

  // 5. Test Officer Registration with Valid Officer Code
  const officerEmail = `officer_${Date.now()}@municipality.gov.in`;
  console.log(`5. Testing Officer Registration with Valid Officer Code (${officerEmail})...`);
  const officerRegRes = await fetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Inspector Vijay Roy',
      email: officerEmail,
      password: 'OfficerPassword@123',
      phone: '9811122233',
      role: 'officer',
      officerCode: 'JANSETU_OFFICER_2026'
    })
  });
  const officerRegData = await officerRegRes.json();
  console.log('Status:', officerRegRes.status);
  console.log('Response:', JSON.stringify(officerRegData, null, 2));
  if (officerRegData.user?.role !== 'officer') throw new Error('Officer registration failed!');
  console.log('✅ Officer Registration with Code Passed\n');

  // 6. Test Officer Registration with INVALID Officer Code (Should Fail)
  console.log('6. Testing Officer Registration with INVALID Officer Code (Expect 403)...');
  const invalidOfficerRes = await fetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Fake Officer',
      email: `fake_${Date.now()}@fake.com`,
      password: 'Password@123',
      role: 'officer',
      officerCode: 'WRONG_CODE'
    })
  });
  const invalidOfficerData = await invalidOfficerRes.json();
  console.log('Status:', invalidOfficerRes.status);
  console.log('Response:', JSON.stringify(invalidOfficerData, null, 2));
  if (invalidOfficerRes.status !== 403) throw new Error('Should have rejected invalid officer code');
  console.log('✅ Invalid Officer Code Rejection Passed\n');

  // 7. Test Logout Endpoint
  console.log('7. Testing /api/auth/logout...');
  const logoutRes = await fetch(`${BASE_URL}/api/auth/logout`, {
    method: 'POST'
  });
  const logoutData = await logoutRes.json();
  console.log('Status:', logoutRes.status);
  console.log('Response:', JSON.stringify(logoutData, null, 2));
  console.log('Set-Cookie after logout:', logoutRes.headers.get('set-cookie'));
  console.log('✅ Logout Passed\n');

  console.log('🎉 ALL JWT AUTHENTICATION BACKEND TESTS PASSED SUCCESSFULLY! 🎉');
}

runTests().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});