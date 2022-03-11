import Chat from "../models/chatsModel.js";
import Message from "../models/messageModel.js";
import User from "../models/userModel.js";
import cloudinary from "cloudinary";

export const sendMessage = async (req, res) => {
  try {
    const { message, media } = req.body;
    const { id } = req.params;
    const sender = await User.findById(req.user._id);
    const reciver = await User.findById(id);
    const isChat = await Chat.findOne({
      members: {
        $all: [sender._id, reciver._id],
      },
    });
    if (media) {
      const result = await cloudinary.v2.uploader.upload(media, {
        folder: "Chat",
        upload_preset: "social",
      });
      const image = {
        public_id: result.public_id,
        url: result.secure_url,
      };

      if (isChat) {
        const msg = await Message.create({
          chatId: isChat._id,
          sender: sender._id,
          media: image,
        });
        await isChat.updateOne({
          lastMessage: "photo",
        });

        return res
          .status(200)
          .json({ message: `Message Send Successfully`, msg });
      } else {
        const chat = await Chat.create({
          members: [sender._id, reciver._id],
          lastMessage: "photo",
        });
        const msg = await Message.create({
          chatId: chat._id,
          sender: sender._id,
          media: image,
        });

        return res
          .status(200)
          .json({ message: `Message Send Successfully`, msg });
      }
    } else {
      if (isChat) {
        const msg = await Message.create({
          chatId: isChat._id,
          sender: sender._id,
          message,
        });
        await isChat.updateOne({
          lastMessage: "photo",
        });

        return res
          .status(200)
          .json({ message: `Message Send Successfully`, msg });
      } else {
        const chat = await Chat.create({
          members: [sender._id, reciver._id],
          lastMessage: "photo",
        });
        const msg = await Message.create({
          chatId: chat._id,
          sender: sender._id,
          message,
        });

        return res
          .status(200)
          .json({ message: `Message Send Successfully`, msg });
      }
    }
  } catch (error) {
    return res
      .status(500)
      .json({ message: `Internal Server Error: ${error.message}` });
  }
};

export const deleteMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const message = await Message.findById(id);
    await message.deleteOne();
    return res.status(200).json({ message: `Message deleted successfully` });
  } catch (error) {
    return res
      .status(500)
      .json({ message: `Internal server error: ${error.message}` });
  }
};
