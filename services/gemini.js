const {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
} = require("@google/generative-ai");

const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);

// Initialize the model with your preferred version
const model = genAI.getGenerativeModel({
  model: "gemini-1.5-pro-latest", // or "gemini-2.5-pro-preview-03-25" if available
});

// Configuration for quiz generation
const generationConfig = {
  temperature: 0.9, // Lower for more focused answers
  topP: 0.95,
  topK: 64,
  maxOutputTokens: 8192, // Reduced for quiz responses
};

// Safety settings (optional but recommended)
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
    // Start a chat session (better for multi-turn, but we'll use single message)
    const chatSession = model.startChat({
      generationConfig,
      safetySettings,
      history: [], // Start with empty history
    });

    // Send the prompt
    const result = await chatSession.sendMessage(prompt);
    
    // Process the response
    const responseText = result.response.text();
    return parseQuizFromText(responseText);
    
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw new Error(`Quiz generation failed: ${error.message}`);
  }
}

// Your existing parsing function (updated to handle new format)
function parseQuizFromText(text) {
  const questions = [];
  const questionBlocks = text.split(/\n\s*\n/).filter(block => block.trim());
  
  questionBlocks.forEach(block => {
    const lines = block.split('\n').map(line => line.trim()).filter(line => line);
    
    if (lines.length >= 3) { // Minimum: question, options, answer
      const questionText = lines[0].replace(/^\d+\.\s*/, '');
      const options = [];
      let correctAnswer = '';
      let explanation = '';
      
      // Process options and answers
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        
        // Check for correct answer marker
        if (line.match(/correct answer:/i)) {
          correctAnswer = line.split(':')[1].trim();
        } 
        // Check for explanation
        else if (line.match(/explanation:/i)) {
          explanation = line.split(':')[1].trim();
        }
        // Otherwise treat as option if it starts with A), B) etc.
        else if (line.match(/^[A-Z]\)\s/)) {
          options.push(line.replace(/^[A-Z]\)\s*/, ''));
        }
      }
      
      if (questionText && options.length > 0 && correctAnswer) {
        questions.push({
          questionText,
          options,
          correctAnswer,
          explanation
        });
      }
    }
  });
  
  return questions;
}

module.exports = { generateQuiz };