import Chat from "../models/chatsModel.js";
import Message from "../models/messageModel.js";
import User from "../models/userModel.js";

export const sendMessage = async (req, res) => {
  try {
    const { body } = req.body;
    const { id } = req.params;
    const reqUser = await User.findById(req.user._id);
    const chat = await Chat.findById(id).populate("members");
    const message = await Message.create({
      chatId: chat._id,
      sender: reqUser._id,
      body,
    });
    return res
      .status(200)
      .json({ message: `Message Send Successfully`, message });
  } catch (error) {
    return res
      .status(500)
      .json({ message: `Internal Server Error: ${error.message}` });
  }
};

export const getMessages = async (req, res) => {
  try {
    const { chatId } = req.params;
    const messages = await Message.find({
      chatId,
    });
    return res
      .status(200)
      .json({ message: `Messages loaded successfully`, messages });
  } catch (error) {
    return res
      .status(500)
      .json({ message: `Internal Server Error:${error.message}` });
  }
};


