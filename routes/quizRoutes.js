const express = require('express');
const router = express.Router();
const {
  generateQuizWithAI,
  getQuizzes,
  getQuiz,
  deleteQuiz
} = require('../controller/quizController');
const { verifyToken } = require('../middleware/authMiddleware');


// Generate quiz with Gemini
router.post('/generate', verifyToken, generateQuizWithAI);

// Get all quizzes for user
router.get('/', verifyToken, getQuizzes);

// Get single quiz
router.get('/:id', verifyToken, getQuiz);

// Delete quiz
router.delete('/:id', verifyToken, deleteQuiz);

module.exports = router;