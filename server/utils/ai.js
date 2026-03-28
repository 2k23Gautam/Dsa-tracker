const axios = require('axios');
const { GoogleGenerativeAI } = require('@google/generative-ai');

/**
 * Suggest metadata for a problem using Gemini 2.0 Flash (preferred) 
 * or Groq API (fallback), now aware of the user's solution and including visualization.
 */
async function suggestProblemMetadata(problemInput, solutionCode = "") {
  const geminiKey = process.env.GEMINI_API_KEY;
  const groqKey = process.env.GROQ_API_KEY;

  if (!geminiKey && !groqKey) {
    throw new Error("Neither GEMINI_API_KEY nor GROQ_API_KEY is configured in .env");
  }

  // Common Prompt
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
      "suggestedApproach": "A short, revision-friendly explanation (2-4 bullet points). Focus on the core intuition and logical steps. No code. No examples. Simple, interview-ready language.",
      "visualization": "Mermaid.js code (flowchart TD or sequenceDiagram) that visually explains the algorithm. Use clean, high-level labels."
    }

    Formatting Guidelines:
    - Combine Approach + Intuition into the 'suggestedApproach' field.
    - Use bullet points.
    - Keep it very concise (2-4 lines total).
    - Assume this is for last-day interview/contest revision.
    - Style: No code, no examples, no extra explanations.
    
    Mermaid Rules:
    - All node labels MUST be in double quotes (e.g., A[\"Label\"]).
    - Avoid parenthesis or special characters inside labels.
    - Use simple alphanumeric IDs for nodes.
    - Ensure the syntax is valid.
    - Return NO markdown, NO preamble, ONLY the raw JSON object.
  `;

  // Try Gemini First if key exists
  if (geminiKey) {
    const genAI = new GoogleGenerativeAI(geminiKey);
    // User requested latest models: 3.1 series and 2.5 series
    const modelsToTry = [
      "gemini-3.1-pro-preview", 
      "gemini-3.1-flash-lite-preview",
      "gemini-3-flash-preview",
      "gemini-2.5-pro",
      "gemini-2.5-flash",
      "gemini-2.0-flash",
      "gemini-1.5-flash"
    ];

    for (const modelName of modelsToTry) {
      try {
        console.log(`Using ${modelName} for suggestion...`);
        const model = genAI.getGenerativeModel({ model: modelName });

        const result = await model.generateContent({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.2,
            responseMimeType: "application/json",
          }
        });

        const text = result.response.text();
        return parseAiResponse(text);
      } catch (err) {
        console.warn(`${modelName} failed:`, err.message);
        // If it's the last Gemini model, and we have Groq, move on.
        // Otherwise, if no Groq, throw the error.
        if (modelName === modelsToTry[modelsToTry.length - 1] && !groqKey) {
          throw err;
        }
      }
    }
    console.log("All Gemini models failed. Falling back to Groq...");
  }

  // Fallback to Groq
  if (groqKey) {
    const API_URL = "https://api.groq.com/openai/v1/chat/completions";
    const MODEL = "llama-3.3-70b-versatile";

    try {
      const response = await axios.post(
        API_URL,
        {
          model: MODEL,
          messages: [{ role: "user", content: prompt }],
          temperature: 0.2,
          response_format: { type: "json_object" }
        },
        {
          headers: {
            "Authorization": `Bearer ${groqKey}`,
            "Content-Type": "application/json"
          }
        }
      );

      const text = response.data?.choices?.[0]?.message?.content;
      return parseAiResponse(text);
    } catch (err) {
      const errorMsg = err.response?.data?.error?.message || err.message;
      throw new Error(`AI extraction failed (Groq): ${errorMsg}`);
    }
  }
}

/**
 * Helper to clean and parse AI JSON responses
 */
function parseAiResponse(text) {
  if (!text) throw new Error("Empty response from AI");

  // Clean markdown backticks if any
  const jsonStr = text.replace(/```json|```/g, "").trim();
  const raw = JSON.parse(jsonStr);

  const getVal = (keys) => {
    const key = keys.find(k => raw[k] !== undefined || raw[k.toLowerCase()] !== undefined);
    return key ? (raw[key] || raw[key.toLowerCase()]) : null;
  };

  return {
    topics: Array.isArray(getVal(['topics'])) ? getVal(['topics']) : (getVal(['topics']) ? [getVal(['topics'])] : []),
    patterns: Array.isArray(getVal(['patterns'])) ? getVal(['patterns']) : (getVal(['patterns']) ? [getVal(['patterns'])] : []),
    difficulty: getVal(['difficulty']) || "",
    timeComplexity: getVal(['timeComplexity']) || "",
    spaceComplexity: getVal(['spaceComplexity']) || "",
    suggestedApproach: getVal(['suggestedApproach']) || "",
    visualization: (getVal(['visualization']) || "").replace(/```mermaid|```/g, "").trim()
  };
}

module.exports = { suggestProblemMetadata };

