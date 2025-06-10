// File: email-analyzer-backend/src/services/aiService.js
// --- UPDATED WITH ROBUST JSON PARSING ---

 const { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } = require("@google/generative-ai");

 const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const safetySettings = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
];
const model = genAI.getGenerativeModel({
  model: "gemini-1.5-flash-latest",
  safetySettings
});

const analyzeEmailContent = async (subject, body) => {
  // We check for an empty body here to avoid making a useless API call
  if (!body || body.trim() === '') {
    console.log(`[AI Skip] Skipping analysis for "${subject}" due to empty body.`);
    return {
      summary: "This email has no text content to analyze.",
      category: "Other", sentiment: "Neutral", actionPoints: []
    };
  }

  const prompt = `
    Analyze the following email content. Provide your analysis ONLY as a single, valid JSON object.

     Email Subject: "${subject}"
     Email Body:
    """
    ${body.substring(0, 4000)}
    """

    JSON structure required:
    {
      "summary": "A concise 1-2 sentence summary of the email.",
      "category": "Choose ONE category: Job Alert, Promotion, Social, Invoice, Urgent, Personal, Other.",
      "sentiment": "Choose ONE sentiment: Positive, Neutral, Negative.",
      "actionPoints": ["A list of key action items or deadlines mentioned. e.g., 'Reply by Friday'. If none, return an empty array."]
    }

    Ensure the output is only the JSON object and nothing else.
  `;

  const generationConfig = {
    temperature: 0.3,
    maxOutputTokens: 500,
    responseMimeType: "application/json",
  };

  try {
    const result = await model.generateContent(prompt, generationConfig);
    const response = result.response;
    let responseContent = response.candidates[0]?.content?.parts?.[0]?.text;

    if (!responseContent) {
      const blockReason = response?.promptFeedback?.blockReason;
      if (blockReason) throw new Error(`Gemini response blocked: ${blockReason}`);
      throw new Error('Gemini response is empty.');
    }

    // --- NEW ROBUST JSON PARSING LOGIC ---
    // It finds the first '{' and last '}' and extracts the content between them.
    const firstBraceIndex = responseContent.indexOf('{');
    const lastBraceIndex = responseContent.lastIndexOf('}');

    if (firstBraceIndex === -1 || lastBraceIndex === -1) {
      throw new Error(`AI response did not contain a valid JSON object.`);
    }

    const jsonString = responseContent.substring(firstBraceIndex, lastBraceIndex + 1);
    const analysisResult = JSON.parse(jsonString);
    // --- END OF NEW LOGIC ---

    if (!analysisResult || typeof analysisResult.summary !== 'string' || typeof analysisResult.category !== 'string' || typeof analysisResult.sentiment !== 'string' || !Array.isArray(analysisResult.actionPoints)) {
      throw new Error('AI response JSON structure is invalid after parsing.');
    }

    return analysisResult;

  } catch (error) {
    console.error(`Error analyzing email content with Gemini: ${error.message}`);
    return {
      summary: "AI analysis failed for this email.",
      category: "Other", sentiment: "Neutral", actionPoints: []
    };
  }
};

module.exports = { analyzeEmailContent };