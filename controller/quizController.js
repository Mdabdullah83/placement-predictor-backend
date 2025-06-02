const httpStatusCode = require("../constant/httpStatusCode");
const Quiz = require("../models/quizModel");
const { generateQuiz } = require("../services/gemini");

// @desc    Generate a new quiz with Gemini
// @route   POST /api/quizzes/generate
// @access  Private
const generateQuizWithAI = async (req, res) => {
  try {
    const { jobRole, level, category, numberOfQuestions = 10 } = req.body;

    // Validate inputs against model schema enums
    const validJobRoles = [
      "Frontend Developer",
      "Backend Developer",
      "Full Stack Developer",
      "Data Scientist",
      "DevOps Engineer",
      "UI/UX Designer",
      "Product Manager",
      "QA Engineer",
    ];

    const validLevels = ["beginner", "intermediate", "advanced"];
    const validCategories = [
      "Technical Skills",
      "Soft Skills",
      "System Design",
      "Problem Solving",
      "Domain Knowledge",
    ];

    if (!validJobRoles.includes(jobRole)) {
      throw new Error(
        `Invalid job role. Must be one of: ${validJobRoles.join(", ")}`
      );
    }
    if (!validLevels.includes(level)) {
      throw new Error(
        `Invalid level. Must be one of: ${validLevels.join(", ")}`
      );
    }
    if (!validCategories.includes(category)) {
      throw new Error(
        `Invalid category. Must be one of: ${validCategories.join(", ")}`
      );
    }

    const prompt = `Generate a JSON object containing ${numberOfQuestions} interview questions for a ${level} level ${jobRole} position, focusing on ${category}.
      
The response must be a valid JSON object with this exact structure:
{
  "questions": [
    {
      "questionText": "Clear question with real-world context",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": "A",
      "explanation": "Detailed explanation including best practices and context",
      "type": "technical | behavioral | problem-solving"
    }
  ]
}

Requirements:
1. Questions should reflect real-world interview scenarios
2. For ${level} level:
   - beginner: Focus on fundamental concepts and basic applications
   - intermediate: Include problem-solving and real-world scenarios
   - advanced: Complex scenarios, system design, and best practices
3. Include a mix of question types:
   - technical: Core technical knowledge questions
   - behavioral: Soft skills and experience questions
   - problem-solving: Practical problem-solving scenarios
4. Each question must have:
   - 4 realistic and plausible options
   - correctAnswer must be exactly "A", "B", "C", or "D"
   - detailed explanation with real-world context

Return ONLY the JSON object, no additional text or formatting.`;

    const questions = await generateQuiz(prompt);
    console.log("Generated questions:", questions);

    if (!questions || questions.length === 0) {
      throw new Error("No valid questions were generated");
    }

    const newQuiz = new Quiz({
      title: `${jobRole} ${category} Quiz`,
      description: `${level} level interview preparation quiz for ${jobRole} position, focusing on ${category}`,
      jobRole,
      level,
      category,
      questions,
      createdBy: req.user._id,
    });

    await newQuiz.save();

    res.status(201).json({
      success: true,
      data: newQuiz,
    });
  } catch (error) {
    console.error("Quiz generation error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Quiz generation failed",
      error: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
};

// @desc    Get all quizzes for logged in user
// @route   GET /api/quizzes
// @access  Private
const getQuizzes = async (req, res) => {
  try {
    const quizzes = await Quiz.find();
    if (!quizzes) {
      return res.status(httpStatusCode.BAD_REQUEST).json({
        success: false,
        message: "quizzes not found",
      });
    }
    return res.status(httpStatusCode.OK).json({
      success: true,
      message: "QUizzes found successfully",
      data: quizzes,
    });
  } catch (error) {
    console.error("Error fetching quizzes:", error);
    res.status(500).json({
      message: "Error fetching quizzes",
      error: error.message,
    });
  }
};

// @desc    Get single quiz
// @route   GET /api/quizzes/:id
// @access  Private
const getQuiz = async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);

    if (!quiz) {
      return res.status(404).json({ message: "Quiz not found" });
    }

    // Optional: Verify quiz belongs to requesting user
    if (quiz.createdBy.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ message: "Not authorized to access this quiz" });
    }

    res.json(quiz);
  } catch (error) {
    console.error("Error fetching quiz:", error);
    res.status(500).json({
      message: "Error fetching quiz",
      error: error.message,
    });
  }
};

// @desc    Delete a quiz
// @route   DELETE /api/quizzes/:id
// @access  Private
const deleteQuiz = async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);

    if (!quiz) {
      return res.status(404).json({ message: "Quiz not found" });
    }

    // Verify quiz belongs to requesting user
    if (quiz.createdBy.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ message: "Not authorized to delete this quiz" });
    }

    await quiz.remove();
    res.json({ message: "Quiz removed" });
  } catch (error) {
    console.error("Error deleting quiz:", error);
    res.status(500).json({
      message: "Error deleting quiz",
      error: error.message,
    });
  }
};

module.exports = {
  generateQuizWithAI,
  getQuizzes,
  getQuiz,
  deleteQuiz,
};
