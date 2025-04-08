const express = require("express");
const Router = express.Router();
const { register, login, ViewAdminDetails } = require("../controller/adminController");
const quizRoutes=require("./quizRoutes");


Router.post("/register", register);
Router.post("/login", login);
Router.use("/quiz",quizRoutes)
module.exports = Router;
