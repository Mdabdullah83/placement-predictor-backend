const mongoose = require('mongoose');

const QuestionSchema = new mongoose.Schema({
  questionText: { type: String, required: true },
  options: { type: [String], required: true },
  correctAnswer: { type: String, required: true },
  explanation: { type: String },
  type: { 
    type: String, 
    enum: ['technical', 'behavioral', 'problem-solving'],
    default: 'technical'
  }
});

const QuizSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  jobRole: { 
    type: String, 
    required: true,
    enum: [
      'Frontend Developer',
      'Backend Developer',
      'Full Stack Developer',
      'Data Scientist',
      'DevOps Engineer',
      'UI/UX Designer',
      'Product Manager',
      'QA Engineer'
    ]
  },
  level: {
    type: String,
    required: true,
    enum: ['beginner', 'intermediate', 'advanced']
  },
  category: {
    type: String,
    required: true,
    enum: [
      'Technical Skills',
      'Soft Skills',
      'System Design',
      'Problem Solving',
      'Domain Knowledge'
    ]
  },
  difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' },
  questions: [QuestionSchema],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Quiz', QuizSchema);