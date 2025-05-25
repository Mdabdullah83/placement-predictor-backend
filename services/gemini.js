const {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
} = require("@google/generative-ai");

const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);

// Initialize the model with your preferred version
const model = genAI.getGenerativeModel({
  model: "gemini-1.5-pro-latest",
});

// Configuration for quiz generation
const generationConfig = {
  temperature: 0.9,
  topP: 0.95,
  topK: 64,
  maxOutputTokens: 8192,
};

// Safety settings
const safetySettings = [
  {
    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
    threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
  },
  {
    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
    threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
  },
  {
    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
    threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
  },
  {
    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
    threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
  },
];

async function generateQuiz(prompt) {
  try {
    // Add JSON format instruction to the prompt
    const jsonPrompt = `${prompt}
INSTRUCTIONS:
I will only respond with a JSON object. No other text or formatting.
{
  "questions": [
    {
      "questionText": "The question text",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": "A/B/C/D",
      "explanation": "Detailed explanation with real-world context and best practices",
      "type": "technical/behavioral/problem-solving"
    }
  ]
}`;

    // Start a chat session
    const chatSession = model.startChat({
      generationConfig,
      safetySettings,
      history: [],
    });

    // Send the prompt and get response
    const result = await chatSession.sendMessage(jsonPrompt);
    let responseText = result.response.text();
    
    // Clean up the response text to ensure valid JSON
    responseText = responseText
      .replace(/```json\n?|\n?```/g, '')  // Remove markdown code block syntax
      .replace(/^[^{]*/, '')              // Remove any text before the first {
      .replace(/}[^}]*$/, '}')            // Remove any text after the last }
      .trim();

    console.log("Cleaned Response:", responseText);

    try {
      // Try to parse as JSON first
      const jsonResponse = JSON.parse(responseText);
      if (jsonResponse.questions && Array.isArray(jsonResponse.questions)) {
        // Validate and transform each question to ensure proper structure
        const validatedQuestions = jsonResponse.questions
          .filter(q => q?.questionText && q?.options)  // Only include questions with required fields
          .map(q => ({
            questionText: q.questionText,
            options: Array.isArray(q.options) && q.options.length > 0 ? q.options : 
                     ["Option A", "Option B", "Option C", "Option D"], // Default options if none provided
            correctAnswer: q.correctAnswer && ['A', 'B', 'C', 'D'].includes(q.correctAnswer) ? 
                         q.correctAnswer : 'A',  // Default to A if invalid
            explanation: q.explanation || 'No explanation provided',
            type: ['technical', 'behavioral', 'problem-solving'].includes(q.type) ? 
                  q.type : 'technical'  // Default to technical if invalid
          }));
        
        if (validatedQuestions.length > 0) {
          return validatedQuestions;
        }
      }
      throw new Error("Invalid JSON structure or no valid questions");
    } catch (parseError) {
      console.warn("JSON parsing failed:", parseError);
      // Fallback to text parsing if JSON parsing fails
      return parseQuizFromText(responseText);
    }
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw new Error(`Quiz generation failed: ${error.message}`);
  }
}

// Fallback text parsing function
function parseQuizFromText(text) {
  const questions = [];
  const questionBlocks = text.split(/\n\s*\n/).filter(block => block.trim());
  
  questionBlocks.forEach(block => {
    const lines = block.split('\n').map(line => line.trim()).filter(line => line);
    
    if (lines.length >= 3) {
      const questionText = lines[0].replace(/^\d+\.\s*/, '');
      const options = [];
      let correctAnswer = '';
      let explanation = '';
      let type = 'technical';
      
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        
        if (line.match(/correct answer:\s*([A-D])/i)) {
          correctAnswer = line.match(/correct answer:\s*([A-D])/i)[1];
        } 
        else if (line.match(/explanation:/i)) {
          explanation = line.split(/explanation:\s*/i)[1].trim();
        }
        else if (line.match(/^[A-Z]\)\s/)) {
          options.push(line.replace(/^[A-Z]\)\s*/, ''));
        }
      }
      
      if (questionText && options.length > 0 && correctAnswer) {
        questions.push({
          questionText,
          options,
          correctAnswer,
          explanation: explanation || 'No explanation provided',
          type
        });
      }
    }
  });
  
  return questions;
}

module.exports = { generateQuiz };