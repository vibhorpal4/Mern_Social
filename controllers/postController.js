import Post from "../models/postModel.js";
import User from "../models/userModel.js";
import cloudinary from "cloudinary";
import Notification from "../models/notificationModel.js";

export const createPost = async (req, res) => {
  try {
    let images = [];

    if (typeof req.body.images === "string") {
      images.push(req.body.images);
    } else {
      images = req.body.images;
    }

    let imagesLinks = [];

    for (let i = 0; i < images.length; i++) {
      const result = await cloudinary.v2.uploader.upload(images[i], {
        folder: "Post",
        upload_preset: "social",
      });

      imagesLinks.push({
        public_id: result.public_id,
        url: result.secure_url,
      });
    }

    const user = await User.findById(req.user._id);

    const post = await Post.create({
      caption: req.body.caption,
      images: imagesLinks,
      owner: user._id,
    });
    await post.save();

    await user.updateOne({
      $push: {
        posts: post._id,
      },
    });
    return res.status(201).json({ message: `Post created successfully`, post });
  } catch (error) {
    return res
      .status(500)
      .json({ message: `Internal Server Error: ${error.message}` });
  }
};

export const updatePost = async (req, res) => {
  try {
    const { caption } = req.body;
    const { id } = req.params;
    const newPost = await Post.findById(id);
    if (
      newPost.owner.toString() === req.user._id.toString() ||
      req.user.isAdmin === true
    ) {
      await newPost.updateOne({ caption });
      return res.status(200).json({ message: `Post updated` });
    } else {
      return res
        .status(401)
        .json({ message: `Post owner can only update the post` });
    }
  } catch (error) {
    return res
      .status(500)
      .json({ message: `Internal Server Error: ${error.message}` });
  }
};

export const deletePost = async (req, res) => {
  try {
    const { id } = req.params;
    const post = await Post.findById(id);
    const user = await User.findById(req.user._id);
    if (
      post.owner.toString() === user._id.toString() ||
      user.isAdmin === true
    ) {
      for (let i = 0; i < images.length; i++) {
        await cloudinary.v2.uploader.destroy(images[i].public_id);
      }
      await user.updateOne({
        $pull: {
          posts: post._id,
        },
      });
      await post.deleteOne();
      return res.status(200).json({ message: `Post deleted successfully` });
    } else {
      return res
        .status(401)
        .json({ message: `Post owner can only delete the post` });
    }
  } catch (error) {
    return res
      .status(500)
      .json({ message: `Internal Server Error: ${error.message}` });
  }
};

export const getAllPosts = async (req, res) => {
  try {
    const reqUser = await User.findById(req.user._id);

    const posts = await Post.find({
      $or: [
        {
          owner: {
            $nin: reqUser.blockedUsers,
          },
        },
        {
          owner: {
            $nin: reqUser.blockedByUsers,
          },
        },
      ],
    })
      .populate("owner")
      .populate("comments")
      .limit(20)
      .sort({ createdAt: -1 });
    return res.status(200).json({ message: `Post loaded Successfully`, posts });
  } catch (error) {
    return res
      .status(500)
      .json({ message: `Internal Server Error: ${error.message}` });
  }
};

export const getPost = async (req, res) => {
  try {
    const { id } = req.params;
    const post = await Post.findById(id);
    if (!post) {
      return res.status(404).json({ message: `Post not found` });
    }
    return res.status(200).json({ message: `Post loaded Successfully`, post });
  } catch (error) {
    return res
      .status(500)
      .json({ message: `Internal Server Error: ${error.message}` });
  }
};

export const like = async (req, res) => {
  try {
    const { id } = req.params;
    const post = await Post.findById(id);

    if (!post) {
      return res.status(404).json({ message: `Post not found` });
    }
    const reqUser = await User.findById(req.user._id);
    if (post.likes.includes(reqUser._id)) {
      await Notification.findOneAndDelete({
        text: `${reqUser.username} liked your post`,
        post: post._id,
      });
      await post.updateOne({
        $pull: {
          likes: reqUser._id,
        },
      });
      await reqUser.updateOne({
        $pull: {
          likedPosts: post._id,
        },
      });
      return res.status(200).json({ message: `Post UnLiked Successfully` });
    } else {
      await post.updateOne({
        $push: {
          likes: reqUser._id,
        },
      });
      await reqUser.updateOne({
        $push: {
          likedPosts: post._id,
        },
      });
      const user = await User.findById(post.owner);
      if (reqUser._id === user._id) {
        const notification = await Notification.create({
          sender: reqUser._id,
          reciver: user._id,
          post: post._id,
          text: `${reqUser.username} liked your post`,
        });
        req.io.to(user.socketId).emit("Notification", notification.text);
      }

      return res.status(200).json({ message: `Post Liked Successfully` });
    }
  } catch (error) {
    return res
      .status(500)
      .json({ message: `Internal Server Error: ${error.message}` });
  }
};

export const getTimeLinePost = async (req, res) => {
  try {
    const reqUser = await User.findById(req.user._id);
    const myPosts = await Post.find({
      owner: reqUser._id,
    })
      .populate("owner")
      .populate("comments")
      .sort({ createdAt: -1 });

    const friendPost = await Post.find({
      owner: {
        $in: reqUser.followings,
      },

      $or: [
        {
          owner: {
            $nin: reqUser.blockedUsers,
          },
        },
        {
          owner: {
            $nin: reqUser.blockedByUsers,
          },
        },
      ],
    })
      .populate("owner")
      .populate("comments")
      .sort({ createdAt: -1 });

    const allPosts = await Post.find({
      $or: [
        {
          owner: {
            $nin: reqUser.blockedUsers,
          },
        },
        {
          owner: {
            $nin: reqUser.blockedByUsers,
          },
        },
      ],
    })
      .populate("owner")
      .populate("comments")
      .sort({ createdAt: -1 });

    let timelinePosts;

    if (reqUser.followings.length < 5) {
      timelinePosts = allPosts;
    } else {
      timelinePosts = friendPost.concat(myPosts);
    }

    const posts = timelinePosts.slice(0, 20);
    res.status(200).json({ message: `Post loaded Successfully`, posts });
  } catch (error) {
    return res
      .status(500)
      .json({ message: `Internal Server Error: ${error.message}` });
  }
};

export const savePost = async (req, res) => {
  try {
    const { id } = req.params;
    const post = await Post.findById(id);
    const user = await User.findById(req.user._id);
    if (user.savedPosts.includes(post._id)) {
      await user.updateOne({
        $pull: {
          savedPosts: post._id,
        },
      });
      await post.updateOne({
        $pull: {
          savedBy: user._id,
        },
      });
      return res.status(200).json({ message: `Post removed from saved posts` });
    } else {
      await user.updateOne({
        $push: {
          savedPosts: post._id,
        },
      });
      await post.updateOne({
        $push: {
          savedBy: user._id,
        },
      });
      return res.status(200).json({ message: `Post added to saved posts` });
    }
  } catch (error) {
    return res
      .status(500)
      .json({ message: `Internal Server Error: ${error.message}` });
  }
};

export const getSavedPosts = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const posts = await Post.find({
      savedBy: {
        $in: user._id,
      },
    }).populate("owner");
    return res
      .status(200)
      .json({ message: `Saved Posts loaded successfully`, posts });
  } catch (error) {
    return res
      .status(500)
      .json({ message: `Internal Server Error: ${error.message}` });
  }
};
