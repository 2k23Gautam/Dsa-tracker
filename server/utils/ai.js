const axios = require('axios');

/**
 * Suggest metadata for a problem using Groq API, now aware of the user's solution.
 */
async function suggestProblemMetadata(problemInput, solutionCode = "") {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error("GROQ_API_KEY is not configured in .env");
  }

  const API_URL = "https://api.groq.com/openai/v1/chat/completions";
  const MODEL = "llama-3.3-70b-versatile";

  const prompt = `
    You are a DSA (Data Structures and Algorithms) expert. 
    Problem: "${problemInput}"
    ${solutionCode ? `User's Solution Code:\n\`\`\`\n${solutionCode}\n\`\`\`` : ''}
    
    Analyze the problem ${solutionCode ? 'and the provided solution ' : ''}to return ONLY a raw JSON object:
    {
      "topics": ["Topic1", "Topic2"],
      "difficulty": "Easy" | "Medium" | "Hard",
      "patterns": ["Pattern1", "Pattern2"],
      "timeComplexity": "e.g., O(n)",
      "spaceComplexity": "e.g., O(1)",
      "suggestedApproach": "A detailed explanation containing the intuitive thinking process (intuition) behind the optimal approach and the logical approach to solve the problem based on the provided solution."
    }

    Rules:
    - Use standard DSA topics.
    - If solution code is provided, use it to accurately determine Time and Space complexity.
    - Return NO markdown, NO preamble, ONLY the raw JSON object.
  `;

  try {
    const response = await axios.post(
      API_URL,
      {
        model: MODEL,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.2, // Lower temperature for more consistent JSON
        response_format: { type: "json_object" } // Groq supports JSON mode
      },
      {
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        }
      }
    );

    const text = response.data?.choices?.[0]?.message?.content;

    if (!text) {
      throw new Error("Empty response from Groq AI");
    }

    console.log("Groq AI Response:", text);

    // Parse the JSON (cleaning any accidental markdown)
    const jsonStr = text.replace(/```json|```/g, "").trim();
    const rawSuggestions = JSON.parse(jsonStr);

    // Normalize keys (case-insensitive) and values
    const getVal = (keys) => {
      const key = keys.find(k => rawSuggestions[k] !== undefined || rawSuggestions[k.toLowerCase()] !== undefined || rawSuggestions[k.charAt(0).toUpperCase() + k.slice(1)] !== undefined);
      return key ? (rawSuggestions[key] || rawSuggestions[key.toLowerCase()] || rawSuggestions[key.charAt(0).toUpperCase() + key.slice(1)]) : null;
    };

    const topics = getVal(['topics', 'topic']) || [];
    const patterns = getVal(['patterns', 'pattern']) || [];
    const difficulty = getVal(['difficulty']) || "";
    const timeComplexity = getVal(['timeComplexity', 'time_complexity']) || "";
    const spaceComplexity = getVal(['spaceComplexity', 'space_complexity']) || "";
    const suggestedApproach = getVal(['suggestedApproach', 'approach', 'suggested_approach']) || "";

    return {
      topics: Array.isArray(topics) ? topics : [topics],
      patterns: Array.isArray(patterns) ? patterns : [patterns],
      difficulty: difficulty ? (difficulty.charAt(0).toUpperCase() + difficulty.slice(1).toLowerCase()) : "",
      timeComplexity: timeComplexity,
      spaceComplexity: spaceComplexity,
      suggestedApproach: suggestedApproach
    };

  } catch (err) {
    const errorMsg = err.response?.data?.error?.message || err.message;
    console.error("Groq API Error Details:", errorMsg);
    throw new Error(`AI extraction failed (Groq): ${errorMsg}`);
  }
}

module.exports = { suggestProblemMetadata };
