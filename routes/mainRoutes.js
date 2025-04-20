const express = require("express");
const Router = express.Router();
const { login, ViewAdminDetails } = require("../controller/adminController");
const { registerUser, loginUser } = require("../controller/userController");
const quizRoutes=require("./quizRoutes");

//user routes
Router.post("/register", registerUser);
Router.post("/login", loginUser);

//quiz routes
Router.use("/quiz",quizRoutes)

module.exports = Router;
