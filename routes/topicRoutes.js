const Router = require("express").Router();
const {
  CreateTopic,
  GetAllTopics,
  GetSingleTopic,
  UpdateTopic,
  DeleteTopic,
} = require("../controller/topicController");
const { verifyToken } = require("../middleware/authMiddleware");

Router.post("/", verifyToken, CreateTopic);
Router.get("/all", verifyToken, GetAllTopics);
Router.get("/:id", verifyToken, GetSingleTopic);
Router.patch("/:id", verifyToken, UpdateTopic);
Router.delete("/:id", verifyToken, DeleteTopic);

module.exports = Router;
