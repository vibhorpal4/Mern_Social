import Comment from "../models/commentModel.js";
import User from "../models/userModel.js";
import Post from "../models/postModel.js";

export const createComment = async (req, res) => {
  try {
    const { title } = req.body;
    const { id } = req.params;
    const post = await Post.findById(id);
    if (!title) {
      return res.status(400).json({ message: `Please enter comment` });
    }
    const comment = await Comment.create({
      title,
      owner: req.user._id,
      post: post._id,
    });
    await comment.save();
    await post.updateOne({
      $push: {
        comments: comment._id,
      },
    });
    return res
      .status(201)
      .json({ message: `Comment added Successfully`, comment });
  } catch (error) {
    return res
      .status(500)
      .json({ message: `Internal Server Error: ${error.message}` });
  }
};

export const updateComment = async (req, res) => {
  try {
    const { id } = req.params;
    const comment = await Comment.findById(id);
    const { title } = req.body;
    const post = await Post.findOne({
      $in: {
        comments: comment._id,
      },
    });

    if (
      comment.owner.toString() === req.user._id.toString() ||
      post.owner.toString() === req.user._id.toString()
    ) {
      comment.updateOne({
        title,
      });
      return res.status(200).json({ message: `Comment update successfully` });
    } else {
      return res.status(401).json({
        message: `Only Post and Comment Owner can update the comment`,
      });
    }
  } catch (error) {
    return res
      .status(500)
      .json({ message: `Internal Server Error: ${error.message}` });
  }
};

export const deleteComment = async (req, res) => {
  try {
    const { id } = req.params;
    const comment = await Comment.findById(id);
    if (!comment) {
      return res.status(401).json({ message: `Comment not found` });
    }
    const post = await Post.findOne({
      $in: {
        comments: comment._id,
      },
    });

    if (
      comment.owner.toString() === req.user._id.toString() ||
      post.owner.toString() === req.user._id.toString()
    ) {
      await post.updateOne({
        $pull: {
          comments: comment._id,
        },
      });
      await comment.deleteOne();

      return res.status(200).json({ message: `Comment delete successfully` });
    } else {
      return res.status(401).json({
        message: `Only Post and Comment Owner can update the comment`,
      });
    }
  } catch (error) {
    return res
      .status(500)
      .json({ message: `Internal Server Error: ${error.message}` });
  }
};

export const getAllComments = async (req, res) => {
  try {
    const comments = await Comment.find();
    if (comments.length === 0) {
      return res.status(404).json({ message: `No comments found` });
    }
    return res
      .status(200)
      .json({ message: `Comments loaded Successfully`, comments });
  } catch (error) {
    return res
      .status(500)
      .json({ message: `Internal Server Error: ${error.message}` });
  }
};

export const getComment = async (req, res) => {
  try {
    const { id } = req.params;
    const comment = await Comment.findById(id);
    if (!comment) {
      return res.status(404).json({ message: `Comment not found` });
    }
    return res
      .status(200)
      .json({ message: `Comment loaded Successfully`, comment });
  } catch (error) {
    return res
      .status(500)
      .json({ message: `Internal Server Error: ${error.message}` });
  }
};
