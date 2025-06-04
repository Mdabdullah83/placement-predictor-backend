const mongoose = require("mongoose");
const TopicSchema = new mongoose.Schema({
  image: {
    type: String,
    required: false,
  },
  title: {
    type: String,
    required: false,
  },
  jobRole: {
    type: String,
    required: false,
  },
  level: {
    type: String,
    required: false,
  },
  category: {
    type: String,
    required: false,
  },
  time: {
    type: String,
    required: false,
  },
  description: {
    type: String,
    required: false,
  },
});

module.exports = mongoose.model("topic", TopicSchema);
