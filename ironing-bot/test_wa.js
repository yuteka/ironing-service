require('dotenv').config();
const axios = require('axios');

async function testWA() {
  const token = process.env.WHATSAPP_TOKEN;
  const phoneId = process.env.PHONE_ID;
  
  try {
    const response = await axios.post(
      `https://graph.facebook.com/v18.0/${phoneId}/messages`,
      {
        messaging_product: 'whatsapp',
        to: '919876543210', // Just a test to see if API accepts the request or throws Auth error
        type: 'text',
        text: { body: 'test' }
      },
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );
    console.log("Success:", response.data);
  } catch (err) {
    console.error("Error:", err.response?.data || err.message);
  }
}

testWA();
