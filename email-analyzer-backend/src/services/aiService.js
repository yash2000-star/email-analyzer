// src/services/aiService.js

// --- Remove or comment out OpenAI imports ---
// const OpenAI = require('openai');

// --- Import Google Generative AI ---
const { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } = require("@google/generative-ai");

// --- Configure the Google AI client ---
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// --- Safety Settings (Recommended for Gemini) ---
const safetySettings = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
];

const analyzeEmailContent = async (subject, body) => {
  console.log(`Analyzing email with Subject (using Gemini): "${subject.substring(0, 50)}..."`);

  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash-latest",
    safetySettings
  });

  const prompt = `
    Analyze the following email content and provide:
    1. A concise summary (1-2 sentences).
    2. A list of key action items or deadlines mentioned. If no specific action is required, state that.

    Email Subject: "${subject}"

    Email Body:
    """
    ${body.substring(0, 3500)}
    """

    Please format your response ONLY as a JSON object with the following structure:
    {
      "summary": "Your concise summary here.",
      "actionPoints": ["Action item 1", "Action item 2", "Deadline: YYYY-MM-DD"]
    }
    If there are no action points, return an empty array for "actionPoints". Ensure the output is valid JSON.
  `;

  const generationConfig = {
    temperature: 0.5,
    maxOutputTokens: 250,
  };

  try {
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig,
    });
    const response = result.response;

    if (!response || !response.candidates || response.candidates.length === 0) {
      const blockReason = response?.promptFeedback?.blockReason;
      if (blockReason) {
        throw new Error(`Gemini response blocked due to safety settings: ${blockReason}`);
      }
      throw new Error('Gemini response is empty or missing candidates.');
    }

    const finishReason = response.candidates[0]?.finishReason;
    if (finishReason && finishReason !== 'STOP' && finishReason !== 'MAX_TOKENS') {
      throw new Error(`Gemini generation finished unexpectedly: ${finishReason}`);
    }

    const responseContent = response.candidates[0]?.content?.parts?.[0]?.text;

    if (!responseContent) {
      console.warn("Gemini response content is empty despite successful finish reason.");
      throw new Error('Gemini response content is empty.');
    }

    console.log("Raw Gemini Response:", responseContent);

    // --- New JSON Parsing Logic (Your Update) ---
    let analysisResult;
    try {
      const firstBraceIndex = responseContent.indexOf('{');
      const lastBraceIndex = responseContent.lastIndexOf('}');

      if (firstBraceIndex === -1 || lastBraceIndex === -1 || lastBraceIndex < firstBraceIndex) {
        console.error("Could not find valid JSON structure (start '{' and end '}') in AI response.");
        console.error("Raw response:", responseContent);
        throw new Error(`AI response does not appear to contain a valid JSON object: ${responseContent.substring(0, 100)}...`);
      }

      const potentialJson = responseContent.substring(firstBraceIndex, lastBraceIndex + 1);
      console.log("Extracted potential JSON string:", potentialJson);

      analysisResult = JSON.parse(potentialJson);
    } catch (parseError) {
      console.error("Failed to parse extracted AI response as JSON:", parseError);
      console.error("Raw response content that caused failure:", responseContent);
      throw new Error(`AI returned non-JSON or malformed JSON response after extraction attempt: ${responseContent.substring(0,100)}...`);
    }

    // --- Existing validation block ---
    if (!analysisResult || typeof analysisResult.summary !== 'string' || !Array.isArray(analysisResult.actionPoints)) {
      console.error("Parsed AI response has unexpected structure:", analysisResult);
      throw new Error('AI response structure is invalid after parsing.');
    }

    console.log(`Analysis complete (Gemini) for Subject: "${subject.substring(0, 50)}..."`);
    return {
      summary: analysisResult.summary,
      actionPoints: analysisResult.actionPoints
    };

  } catch (error) {
    console.error(`Error analyzing email content with Gemini: ${error.message}`);
    throw error;
  }
};

module.exports = {
  analyzeEmailContent,
};
