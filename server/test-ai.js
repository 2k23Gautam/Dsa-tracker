require('dotenv').config();
const axios = require('axios');

async function diagnose() {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    console.error("❌ GROQ_API_KEY is not set in .env");
    return;
  }

  const API_URL = "https://api.groq.com/openai/v1/chat/completions";
  const MODEL = "llama-3.3-70b-versatile";

  try {
    console.log("--- Diagnosing Groq API ---");
    console.log("API Key found. Testing connection...");
    
    const response = await axios.post(
      API_URL,
      {
        model: MODEL,
        messages: [{ role: "user", content: "hi" }],
        max_tokens: 10
      },
      {
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        }
      }
    );

    console.log("✅ SUCCESS with Groq:", response.data.choices[0].message.content);
  } catch (err) {
    const errorMsg = err.response?.data?.error?.message || err.message;
    console.error("❌ FAILED with Groq:", errorMsg);
  }
}

diagnose();
