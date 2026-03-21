const axios = require('axios');

async function test() {
  console.log('--- Testing Network Connection ---');
  
  try {
    console.log('Testing Google...');
    await axios.get('https://google.com', { timeout: 5000 });
    console.log('✅ Google reached.');
  } catch (e) {
    console.error('❌ Google failed:', e.message);
  }

  try {
    console.log('Testing Kontests API...');
    const res = await axios.get('https://kontests.net/api/v1/all', { 
      timeout: 5000,
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    console.log('✅ Kontests reached. Items:', res.data.length);
  } catch (e) {
    console.error('❌ Kontests failed:', e.message);
    if (e.response) {
      console.error('Status:', e.response.status);
      console.error('Data:', e.response.data);
    }
  }
}

test();
