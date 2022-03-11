import Chat from "../models/chatsModel.js";
import User from "../models/userModel.js";

export const createChat = async (req, res) => {
  try {
    const { id } = req.params;
    const reqUser = await User.findById(req.user._id);
    const chat = await Chat.create({
      members: [reqUser._id, id],
    });
    return res.status(200).json({ message: `Chat created Successfully`, chat });
  } catch (error) {
    return res
      .status(500)
      .json({ message: `Internal Server Error:${error.message}` });
  }
};

export const getAllChats = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const chats = await Chat.find({
      members: {
        $in: [user._id],
      },
    });
    return res
      .status(200)
      .json({ message: `Chats loaded successfully`, chats });
  } catch (error) {
    return res
      .status(500)
      .json({ message: `Internal Server Error: ${error.message}` });
  }
};

export const getAllConversionOfChat = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    const chat = await Chat.findOne({
      members: {
        $all: [req.user._id, user._id],
      },
    });
    return res.status(200).json({ message: `Chat loaded Successfully`, chat });
  } catch (error) {
    return res
      .status(500)
      .json({ message: `Internal Server Error: ${error.message}` });
  }
};
