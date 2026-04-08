require('dotenv').config();
const axios = require('axios');

async function testGroq() {
  const check = async (model) => {
    try {
      const res = await axios.post(
        "https://api.groq.com/openai/v1/chat/completions",
        {
          model: model,
          messages: [{role: "system", content: "You are a DSA expert. Output JSON."}, {role: "user", content: "Solve two sum. Return JSON object: {'topics': ['Array']}"}],
          temperature: 0.2,
          max_tokens: 100,
          response_format: { type: "json_object" }
        },
        { headers: { "Authorization": `Bearer ${process.env.GROQ_API_KEY}` } }
      );
      console.log(`✅ ${model} SUCCESS:`, res.data.choices[0].message.content);
    } catch(err) {
      console.log(`❌ ${model} FAILED:`, err.response?.data || err.message);
    }
  }

  await check("openai/gpt-oss-120b");
  await check("llama-3.3-70b-versatile");
}
testGroq();
