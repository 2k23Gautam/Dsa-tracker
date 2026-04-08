require('dotenv').config();
const axios = require('axios');

async function checkModels() {
  const apiKey = process.env.GROQ_API_KEY;
  try {
    const res = await axios.get("https://api.groq.com/openai/v1/models", {
      headers: { "Authorization": `Bearer ${apiKey}` }
    });
    console.log("AVAILABLE MODELS:", res.data.data.map(m => m.id).join(", "));
  } catch(e) {
    console.error("FAILED", e.message);
  }
}
checkModels();
