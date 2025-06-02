const bcrypt = require("bcrypt");
const { validationResult } = require("express-validator");
const httpStatusCode = require("../constant/httpStatusCode");
const UserModel = require("../models/userModel");
const AdminModel = require("../models/adminModel");

const { getToken } = require("../middleware/authMiddleware");
const { SendEmail } = require("../services/emailServices");

const registerUser = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(httpStatusCode.BAD_REQUEST).json({
        success: false,
        errors: errors.array(),
      });
    }

    const { username, email, password, role, department, year, university } =
      req.body;

    // Check if user already exists
    let existingUser;
    if (role === "user") {
      existingUser = await UserModel.findOne({ email });
    } else if (role === "admin") {
      existingUser = await AdminModel.findOne({ email });
    }

    if (existingUser) {
      return res.status(httpStatusCode.CONFLICT).json({
        success: false,
        message:
          "User is already registered with this email or phone. Please sign in.",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    let newUser;
    console.log("user:", role, username, email, password);

    if (role === "user") {
      newUser = await UserModel.create({
        username,
        email,
        password: hashedPassword,
        role: "user",
        department,
        year,
        university,
      });
    } else if (role === "admin") {
      newUser = await AdminModel.create({
        username,
        email,
        password: hashedPassword,
        role: "admin",
      });
    }

    // Send a congratulatory email to the user
    // SendEmail(email, newUser.username);
    return res.status(httpStatusCode.CREATED).json({
      success: true,
      message: "User registered successfully!",
      data: newUser,
    });
  } catch (error) {
    console.error("Error registering user:", error);
    return res.status(httpStatusCode.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Something went wrong!",
      error: error.message,
    });
  }
};

const loginUser = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(httpStatusCode.BAD_REQUEST).json({
        success: false,
        errors: errors.array(),
      });
    }

    const { email, password } = req.body;

    // Check if user exists in any of the relevant collections
    let user = await UserModel.findOne({ email });

    if (!user) {
      user = await AdminModel.findOne({ email });
      if (!user) {
        return res.status(httpStatusCode.UNAUTHORIZED).json({
          success: false,
          message: "Invalid email or user not registered!",
        });
      }
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(httpStatusCode.UNAUTHORIZED).json({
        success: false,
        message: "Invalid password",
      });
    }

    // SendEmail(email,user.username);
    const token = await getToken(user);

    return res.status(httpStatusCode.OK).json({
      success: true,
      message: "Successfully logged in!",
      data: { user, token, role: user.role },
    });
  } catch (error) {
    console.error("Error logging in:", error);
    return res.status(httpStatusCode.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Something went wrong!",
      error: error.message,
    });
  }
};

const ViewUsers = async (req, res) => {
  try {
    const Users = await UserModel.find();
    if (!Users) {
      return res.status(httpStatusCode.BAD_REQUEST).json({
        success: false,
        message: "users are not found",
      });
    }

    return res.status(httpStatusCode.OK).json({
      success: true,
      message: "viewd successfully",
      data: Users,
    });
  } catch (error) {
    return res.status(httpStatusCode.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "something went wrong !!",
      error: error.message,
    });
  }
};

const ViewStudentDetails = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(httpStatusCode.BAD_REQUEST).json({
        success: false,
        errors: errors.array(),
      });
    }
    const user = await UserModel.findById(req.user._id);
    if (!user) {
      return res.status(httpStatusCode.NOT_FOUND).json({
        success: false,
        message: "student is not found",
      });
    }
    return res.status(httpStatusCode.OK).json({
      success: true,
      message: "Student details",
      data: user,
    });
  } catch (error) {
    return res.status(httpStatusCode.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message,
    });
  }
};

const UpdateStudentDetails = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(httpStatusCode.BAD_REQUEST).json({
        success: false,
        errors: errors.array(),
      });
    }

    const {
      firstname,
      lastname,
      email,
      phone,
      expertise,
      username,
      password,
      confirmPassword,
      pincode,
      address,
      city,
      country,
      aboutInfo,
      personalWebsite,
      githubProfile,
    } = req.body;
    const profileImage = req.file.filename;

    const updatedUser = await UserModel.findByIdAndUpdate(
      req.user._id,
      {
        firstname,
        lastname,
        phone,
        expertise,
        username,
        profileImage,
        pincode,
        address,
        city,
        country,
        aboutInfo,
        personalWebsite,
        githubProfile,
      },
      { new: true }
    ); // Ensure you get the updated document back

    if (!updatedUser) {
      return res.status(httpStatusCode.NOT_FOUND).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(httpStatusCode.OK).json({
      success: true,
      message: "User details successfully updated",
      data: updatedUser,
    });
  } catch (error) {
    return res.status(httpStatusCode.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Failed to update User details",
      error: error.message,
    });
  }
};

module.exports = {
  registerUser,
  loginUser,
  ViewUsers,
  ViewStudentDetails,
  UpdateStudentDetails,
};
