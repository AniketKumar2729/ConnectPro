import { uploadFileToCloudinary } from "../config/cloudinary.config.js";
import Conversation from "../models/conversation.model.js";
import Message from "../models/message.model.js";
import { response } from "../utils/responseHandler.utils.js";

//send message
export const sendMessage = async (req, res) => {
  try {
    const { senderId, receiverId, content, messageStatus } = req.body;
    const file = req.file;

    const participant = [senderId, receiverId].sort();
    //checking consersation exists
    let conversation = await Conversation.findOne({ participant: participant });
    if (!conversation) {
      conversation = new Conversation({
        participant,
      });
      await conversation.save();
    }
    let imageOrVideoUrl = null;
    let contentType = null;

    //handle file controll
    if (file) {
      const uploadFile = await uploadFileToCloudinary(file);
      if (!uploadFile?.secure_url) {
        return response(res, 400, "Failed to upload media");
      }
      imageOrVideoUrl = uploadFile?.secure_url;

      if (file.mimeType.startsWith("image")) {
        contentType = "image";
      } else if (file.mimeType.startsWith("video")) {
        contentType = "video";
      } else {
        return response(res, 400, "Unsupported file type");
      }
    } else if (content?.trim()) {
      contentType = "text";
    } else {
      return response(res, 400, "Message content is required");
    }

    const message = new Message({
      conversation: conversation?._id,
      sender: senderId,
      receiver: receiverId,
      content,
      contentType,
      imageOrVideoUrl,
      messageStatus,
    });
    await message.save();

    if (message?.content) conversation.lastMessage = message?._id;
    conversation.unreadCount += 1;
    await conversation.save();

    const populatedMessage = await Message.findOne(message?._id)
      .populate("sender", "username profilePicture")
      .populate("receiver", "username profilePicture");

    return response(res, 201, "Message send successfully", populatedMessage);
  } catch (error) {
    console.error(error);
    return response(res, 500, "Internal server error");
  }
};
