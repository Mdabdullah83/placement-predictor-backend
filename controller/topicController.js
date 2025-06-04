const httpStatusCode = require("../constant/httpStatusCode");
const cloudinary = require("../config/cloudinaryConfig");
const TopicModel = require("../models/topicModel");

const CreateTopic = async (req, res) => {
  try {
    const { title, jobRole, level, category, time, description } = req.body;
    if (!title || !jobRole || !level || !category || !time || !description) {
      return res.status(httpStatusCode.BAD_REQUEST).json({
        success: false,
        message: "all fields are required!",
      });
    }

    let imageUrl = "";
    // Handle image upload if a file is provided
    if (req.file) {
      imageUrl = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: "uploads",
            resource_type: "auto",
          },

          (error, result) => {
            if (error) {
              console.log("error:", error);
              res.status(httpStatusCode?.INTERNAL_SERVER_ERROR).json({
                success: false,
                message: "Error uploading to Cloudinary.",
                error: error?.message,
              });
              return reject(new Error("Error uploading file"));
            }
            resolve(result.secure_url);
          }
        );
        stream.end(req.file.buffer); // Pass the file buffer
      });
    }
    const topic = await TopicModel.create({
      title,
      jobRole,
      level,
      category,
      time,
      description,
      image: imageUrl,
    });
    if (!topic) {
      return res.status(httpStatusCode.BAD_REQUEST).json({
        success: false,
        message: "error in db",
      });
    }
    return res.status(httpStatusCode.CREATED).json({
      success: true,
      message: "Topic created successfully",
      data: topic,
    });
  } catch (error) {
    console.log("error while create topic:", error);
    return res.status(httpStatusCode.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error?.message || "Something went wrong",
      error: error?.message,
    });
  }
};

const UpdateTopic = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, jobRole, level, category, time, description } = req.body;

    let updatedFields = { title, jobRole, level, category, time, description };

    if (req.file) {
      const imageUrl = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: "uploads",
            resource_type: "auto",
          },
          (error, result) => {
            if (error) {
              console.error("Error uploading to Cloudinary:", error);
              return reject(error);
            }
            resolve(result.secure_url);
          }
        );
        stream.end(req.file.buffer);
      });

      updatedFields.image = imageUrl;
    }

    const topic = await TopicModel.findByIdAndUpdate(id, updatedFields, {
      new: true,
    });

    if (!topic) {
      return res.status(httpStatusCode.NOT_FOUND).json({
        success: false,
        message: "Topic not found",
      });
    }

    return res.status(httpStatusCode.OK).json({
      success: true,
      message: "Topic updated successfully",
      data: topic,
    });
  } catch (error) {
    console.error("Error updating topic:", error);
    return res.status(httpStatusCode.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message || "Something went wrong",
    });
  }
};

const DeleteTopic = async (req, res) => {
  try {
    const { id } = req.params;
    const topic = await TopicModel.findByIdAndDelete(id);

    if (!topic) {
      return res.status(httpStatusCode.NOT_FOUND).json({
        success: false,
        message: "Topic not found",
      });
    }

    return res.status(httpStatusCode.OK).json({
      success: true,
      message: "Topic deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting topic:", error);
    return res.status(httpStatusCode.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message || "Something went wrong",
    });
  }
};

const GetSingleTopic = async (req, res) => {
  try {
    const { id } = req.params;
    const topic = await TopicModel.findById(id);

    if (!topic) {
      return res.status(httpStatusCode.NOT_FOUND).json({
        success: false,
        message: "Topic not found",
      });
    }

    return res.status(httpStatusCode.OK).json({
      success: true,
      message: "Topic fetched successfully",
      data: topic,
    });
  } catch (error) {
    console.error("Error fetching topic:", error);
    return res.status(httpStatusCode.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message || "Something went wrong",
    });
  }
};

const GetAllTopics = async (req, res) => {
  try {
    const topics = await TopicModel.find().sort({ createdAt: -1 }); // Latest first

    return res.status(httpStatusCode.OK).json({
      success: true,
      message: "Topics fetched successfully",
      data: topics,
    });
  } catch (error) {
    console.error("Error fetching topics:", error);
    return res.status(httpStatusCode.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message || "Something went wrong",
    });
  }
};

module.exports = {
  CreateTopic,
  UpdateTopic,
  DeleteTopic,
  GetSingleTopic,
  GetAllTopics,
};
