const Quiz = require('../models/quizModel');
const { generateQuiz } = require('../services/gemini');

// @desc    Generate a new quiz with Gemini
// @route   POST /api/quizzes/generate
// @access  Private
const generateQuizWithAI = async (req, res) => {
    try {
      const { subject, topic, difficulty, numberOfQuestions, questionType = 'multiple_choice' } = req.body;
      
      // Enhanced prompt with clear instructions
      const prompt = `
      Generate a ${difficulty} level quiz with ${numberOfQuestions} questions about ${topic} in ${subject}.
      Question type: ${questionType}.
      
      Format requirements:
      1. Each question should be numbered (1., 2., etc.)
      2. For multiple choice:
         - Provide 4 options labeled A), B), C), D)
         - Mark correct answer with "Correct answer: X"
      3. Include brief explanations after correct answers marked with "Explanation:"
      4. Separate questions with blank lines
      
      Example format:
      1. What is the capital of France?
      A) London
      B) Paris
      C) Berlin
      D) Madrid
      Correct answer: B
      Explanation: Paris has been the capital of France since 508 AD.
      
      Now generate the quiz about ${topic}:
      `;
      
      const questions = await generateQuiz(prompt);
      
      if (!questions || questions.length === 0) {
        throw new Error('No valid questions were generated');
      }
      
      const newQuiz = new Quiz({
        title: `${topic} Quiz`,
        description: `Auto-generated ${difficulty} quiz about ${topic} in ${subject}`,
        subject,
        difficulty,
        questions,
        createdBy: req.user._id,
        questionType
      });
      
      await newQuiz.save();
      
      res.status(201).json({
        success: true,
        data: newQuiz
      });
      
    } catch (error) {
      console.error('Quiz generation error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Quiz generation failed',
        error: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  };

// @desc    Get all quizzes for logged in user
// @route   GET /api/quizzes
// @access  Private
const getQuizzes = async (req, res) => {
  try {
    const quizzes = await Quiz.find({ createdBy: req.user._id });
    res.json(quizzes);
  } catch (error) {
    console.error('Error fetching quizzes:', error);
    res.status(500).json({ 
      message: 'Error fetching quizzes', 
      error: error.message 
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
      return res.status(404).json({ message: 'Quiz not found' });
    }
    
    // Optional: Verify quiz belongs to requesting user
    if (quiz.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to access this quiz' });
    }
    
    res.json(quiz);
  } catch (error) {
    console.error('Error fetching quiz:', error);
    res.status(500).json({ 
      message: 'Error fetching quiz', 
      error: error.message 
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
      return res.status(404).json({ message: 'Quiz not found' });
    }
    
    // Verify quiz belongs to requesting user
    if (quiz.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this quiz' });
    }
    
    await quiz.remove();
    res.json({ message: 'Quiz removed' });
  } catch (error) {
    console.error('Error deleting quiz:', error);
    res.status(500).json({ 
      message: 'Error deleting quiz', 
      error: error.message 
    });
  }
};

module.exports = {
  generateQuizWithAI,
  getQuizzes,
  getQuiz,
  deleteQuiz
};