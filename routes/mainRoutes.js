const express = require("express");
const Router = express.Router();
const { login, ViewAdminDetails } = require("../controller/adminController");
const {
  registerUser,
  loginUser,
  ViewUsers,
} = require("../controller/userController");
const quizRoutes = require("./quizRoutes");
const topicRoutes = require("./topicRoutes");

//user routes
Router.post("/register", registerUser);
Router.post("/login", loginUser);
Router.get("/all-users", ViewUsers);

//quiz routes
Router.use("/quiz", quizRoutes);

//topic routes
Router.use("/topic", topicRoutes);

module.exports = Router;
