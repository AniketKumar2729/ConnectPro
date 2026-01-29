import path from "path";
import { uploadFileToCloudinary } from "../config/cloudinary.config.js";
import Status from "../models/status.model.js";
import Message from "../models/message.model.js";
import { response } from "../utils/responseHandler.utils.js";

//send status
export const createStatus = async (req, res) => {
  try {
    const { content, contentType } = req.body;
    const userId = req.user.userId;
    const file = req.file;

    let mediaUrl = null;
    let finalContentType = contentType || "text";

    //handle file controll
    if (file) {
      const uploadFile = await uploadFileToCloudinary(file);
      if (!uploadFile?.secure_url) {
        return response(res, 400, "Failed to upload media");
      }
      mediaUrl = uploadFile?.secure_url;

      if (file.mimeType.startsWith("image")) {
        finalContentType = "image";
      } else if (file.mimeType.startsWith("video")) {
        finalContentType = "video";
      } else {
        return response(res, 400, "Unsupported file type");
      }
    } else if (content?.trim()) {
      finalContentType = "text";
    } else {
      return response(res, 400, "Message content is required");
    }

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    const status = new Status({
      user: userId,
      content: mediaUrl || content,
      contentType: finalContentType,
      expiresAt: expiresAt,
    });
    await status.save();

    const populatedStatus = await Status.findOne(status?._id)
      .populate("user", "username profilePicture")
      .populate("viewers", "username profilePicture");

    return response(res, 201, "Status created successfully", populatedStatus);
  } catch (error) {
    console.error(error);
    return response(res, 500, "Internal server error");
  }
};

//get status
export const getAllStatus = async (req, res) => {
  try {
    const allStatus = await Status.find({
      expiresAt: { $gt: new Date() },
    })
      .populate("user", "username profilePicture")
      .populate("viewers", "username profilePicture")
      .sort({ createdAt: -1 });
    return response(res, 200, "Status retrieved successfully", allStatus);
  } catch (error) {
    console.error(error);
    return response(res, 500, "Internal server error");
  }
};

//viewers status
export const viewStatus = async (req, res) => {
  const { statusId } = req.params;
  const userId = req.user.userId;
  try {
    const status = await Status.findById(statusId);
    if (!status) return response(res, 404, "Status not found");
    if (!status.viewers.includes(userId)) {
      status.viewers.push(userId);
      await status.save();

      const updatedStatus = await Status.findById(statusId)
        .populate("user", "username profilePicture")
        .populate("viewers", "username profilePicture");
    } else {
      console.log("User Alread viewed the status");
    }
    return response(res, 200, "Status Viewed successfully");
  } catch (error) {
    console.error(error);
    return response(res, 500, "Internal server error");
  }
};

// deleting status
export const deletingStatus = async (req, res) => {
  const { statusId } = req.params;
  const userId = req.user.userId;
  try {
    const status = await Status.findById(statusId);
    if (!status) return response(res, 404, "Status not found");
    if (status.user.toString() !== userId)
      return response(res, 403, "You are not authorized to delete the status");
    await status.deleteOne();

    return response(res,200,"status deleted successfully");
  } catch (error) {
    console.error(error);
    return response(res, 500, "Internal server error");
  }
};
