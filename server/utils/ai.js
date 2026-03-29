const axios = require('axios');
const { GoogleGenerativeAI } = require('@google/generative-ai');

/**
 * Suggest metadata for a DSA problem based on the problem name/link
 * and (most importantly) the user's submitted solution code.
 */
async function suggestProblemMetadata(problemInput, solutionCode = "") {
  const geminiKey = process.env.GEMINI_API_KEY;
  const groqKey = process.env.GROQ_API_KEY;

  if (!geminiKey && !groqKey) {
    throw new Error("Neither GEMINI_API_KEY nor GROQ_API_KEY is configured in .env");
  }

  const hasSolution = solutionCode && solutionCode.trim().length > 0;
  const hasContext = problemInput && problemInput !== 'Unknown Problem';

  // Build a clean, minimal, unambiguous prompt
  const prompt = `You are a senior DSA (Data Structures & Algorithms) expert. Your job is to analyze the following and return a JSON object.

${hasContext ? `Problem: "${problemInput}"` : ''}
${hasSolution ? `\nUser's Solution Code:\n\`\`\`\n${solutionCode.trim()}\n\`\`\`` : ''}

Instructions:
- topics: List the relevant DSA topics from the code/problem (e.g. "Array", "String", "Tree", "Graph", "DP", "Heap", "Stack", "Linked List", "Binary Search", "Math").
- patterns: List the algorithmic patterns used (e.g. "Two Pointers", "Sliding Window", "DFS", "BFS", "Binary Search", "Greedy", "Hashing", "Backtracking", "Recursion + Memoization").
- difficulty: The problem difficulty ("Easy", "Medium", or "Hard").
- timeComplexity: ${hasSolution ? "Based ONLY on the provided code logic (not the optimal solution)." : "The time complexity of the standard approach."}
- spaceComplexity: ${hasSolution ? "Based ONLY on the provided code logic (not the optimal solution)." : "The space complexity of the standard approach."}
- suggestedApproach: ${hasSolution ? "A 2-3 sentence plain English explanation of how the provided code works. NO numbered lists, NO bullet points, NO newlines — write as a single flowing paragraph." : "A brief 2-3 sentence explanation of the best approach to solve this problem. NO lists, NO numbers, single flowing paragraph."}

Respond with ONLY a raw JSON object (no markdown, no \`\`\`, no extra text):
{
  "topics": ["Array"],
  "difficulty": "Medium",
  "patterns": ["Two Pointers"],
  "timeComplexity": "O(n)",
  "spaceComplexity": "O(1)",
  "suggestedApproach": "Plain english explanation here."
}`;

  // Try Gemini models in order
  if (geminiKey) {
    const genAI = new GoogleGenerativeAI(geminiKey);
    const modelsToTry = [
      "gemini-2.5-flash",
      "gemini-2.0-flash",
      "gemini-1.5-flash",
    ];

    for (const modelName of modelsToTry) {
      try {
        console.log(`[AI] Trying ${modelName}...`);
        const model = genAI.getGenerativeModel({ model: modelName });

        const result = await model.generateContent({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.1,
            responseMimeType: "application/json",
          }
        });

        const text = result.response.text();
        console.log(`[AI] Raw response from ${modelName}:`, text.substring(0, 300));
        return parseAiResponse(text);
      } catch (err) {
        console.warn(`[AI] ${modelName} failed:`, err.message);
        if (modelName === modelsToTry[modelsToTry.length - 1] && !groqKey) {
          throw err;
        }
      }
    }
    console.log("[AI] All Gemini models failed. Falling back to Groq...");
  }

  // Fallback to Groq
  if (groqKey) {
    const API_URL = "https://api.groq.com/openai/v1/chat/completions";
    const MODEL = "llama-3.3-70b-versatile";

    try {
      console.log("[AI] Trying Groq...");
      const response = await axios.post(
        API_URL,
        {
          model: MODEL,
          messages: [{ role: "user", content: prompt }],
          temperature: 0.1,
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
      console.log("[AI] Raw Groq response:", text?.substring(0, 300));
      return parseAiResponse(text);
    } catch (err) {
      const errorMsg = err.response?.data?.error?.message || err.message;
      throw new Error(`AI extraction failed (Groq): ${errorMsg}`);
    }
  }
}

/**
 * Parse and sanitize the AI JSON response
 */
function parseAiResponse(text) {
  if (!text) throw new Error("Empty response from AI");

  // Strip markdown code fences if present
  const jsonStr = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim();
  const raw = JSON.parse(jsonStr);

  // Helper to get a field by multiple possible key names (case-insensitive)
  const get = (keys) => {
    for (const k of keys) {
      if (raw[k] !== undefined) return raw[k];
      const lk = k.toLowerCase();
      if (raw[lk] !== undefined) return raw[lk];
    }
    return null;
  };

  // Sanitize approach: remove numbered lists, bullets, and collapse to one line
  let approach = get(['suggestedApproach', 'approach', 'suggested_approach']) || "";
  if (Array.isArray(approach)) approach = approach.join(' ');
  approach = approach.replace(/^\s*\d+[.)]\s*/gm, '');  // Remove "1. " "2) "
  approach = approach.replace(/^\s*[-*•]\s*/gm, '');     // Remove "- " "* "
  approach = approach.replace(/\n+/g, ' ');              // No newlines
  approach = approach.replace(/\s{2,}/g, ' ').trim();    // Normalize spaces

  // Sanitize arrays
  const toArray = (val) => {
    if (!val) return [];
    if (Array.isArray(val)) return val.filter(v => typeof v === 'string' && v.trim());
    if (typeof val === 'string') return [val.trim()].filter(Boolean);
    return [];
  };

  return {
    topics: toArray(get(['topics'])),
    patterns: toArray(get(['patterns'])),
    difficulty: get(['difficulty']) || "",
    timeComplexity: get(['timeComplexity', 'time_complexity']) || "",
    spaceComplexity: get(['spaceComplexity', 'space_complexity']) || "",
    suggestedApproach: approach
  };
}

module.exports = { suggestProblemMetadata };
