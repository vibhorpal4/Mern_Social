import Chat from "../models/chatsModel.js";
import User from "../models/userModel.js";
import Message from "../models/messageModel.js";

export const createChat = async (req, res) => {
  try {
    const { id } = req.params;
    const sender = await User.findById(req.user._id);
    const reciver = await User.findById(id);
    const chat = await Chat.create({
      members: [sender._id, reciver._id],
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
    }).sort({ updatedAt: -1 });

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
    // const reciver = await User.findById(id);
    // const sender = await User.findById(req.user._id);
    // const chat = await Chat.findOne({
    //   members: {
    //     $all: [sender._id, reciver._id],
    //   },
    // });
    const messages = await Message.find({
      chatId: id,
    });
    return res
      .status(200)
      .json({ message: `Chat loaded Successfully`, messages });
  } catch (error) {
    return res
      .status(500)
      .json({ message: `Internal Server Error: ${error.message}` });
  }
};

export const deleteChat = async (req, res) => {
  try {
    const { id } = req.params;
    const chat = await Chat.findById(id);
    await chat.deleteOne();
    return res.status(200).json({ message: `Chat deleted Successfully` });
  } catch (error) {
    return res
      .status(500)
      .json({ message: `Internal Server Error: ${error.message}` });
  }
};
