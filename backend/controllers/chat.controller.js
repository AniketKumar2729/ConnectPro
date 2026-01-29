import path from "path";
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

//get all conversation
export const getConversation = async (req, res) => {
  const userId = req.user.userId;
  try {
    let conversation = await Conversation.find({
      participant: userId,
    })
      .populate("participant", "username profilePicture isOnline lastSeen")
      .populate({
        path: "lastMessage",
        populate: {
          path: "sender receiver",
          select: "username profilePicture",
        },
      })
      .sort({ updatedAt: -1 });
    return response(res, 201, "Conversation got successfully", conversation);
  } catch (error) {
    console.error(error);
    return response(res, 500, "Internal server error");
  }
};

//get message of specific conversation
export const getMessages = async (req, res) => {
  const { conversationId } = req.params;
  const userId = req.user.userId;
  try {
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return response(res, 404, "Conversation not found");
    }
    if (!conversation.participant.includes(userId)) {
      return response(res, 403, "Not authorized to view this conversation");
    }
    const messages = await Message.find({ conversation: conversationId })
      .populate("sender", "username profilePicture")
      .populate("receiver", "username profilePicture")
      .sort("createdAt");

    await Message.updateMany(
      {
        conversation: conversationId,
        receiver: userId,
        messageStatus: { $in: ["send", "delivered"] },
      },
      { $set: { messageStatus: "read" } },
    );

    conversation.unreadCount = 0;

    await conversation.save();

    return response(res, 200, "Message retrive", messages);
  } catch (error) {
    console.error(error);
    return response(res, 500, "Internal server error");
  }
};

//marking the message as read
export const markAsRead = async (req, res) => {
  const { messageIds } = req.body;
  const userId = req.user.userId;

  try {
    // get relavant message to determine senders
    let messages = await Message.find({
      _id: { $in: messageIds },
      receiver: userId,
    });
    await Message.updateMany(
      { _id: { $in: messageIds }, receiver: userId },
      { $set: { messageStatus: "read" } },
    );

    return response(res, 200, "Message marked as read", messages);
  } catch (error) {
    console.error(error);
    return response(res, 500, "Internal server error");
  }
};

// deleting the message
export const deleteMessage = async (req, res) => {
  const { messageId } = req.params;
  const userId = req.user.userId;
  try {
    const message = await Message.findById(messageId);
    if (!message) return response(res, 404, "Message Not Found");
    if (message.sender.toString() !== userId)
      return response(res, 403, "You are not authorized to delete this message");
    await message.deleteOne();

    return response(res, 200, "Message deleted successfully");
  } catch (error) {
    console.error(error);
    return response(res, 500, "Internal server error");
  }
};
