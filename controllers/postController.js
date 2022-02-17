import Post from "../models/postModel.js";
import User from "../models/userModel.js";
import cloudinary from "cloudinary";

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
      await post.updateOne({
        $pull: {
          likes: req.user._id,
        },
      });
      return res.status(200).json({ message: `Post UnLiked Successfully` });
    } else {
      await post.updateOne({
        $push: {
          likes: req.user._id,
        },
      });
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
    const timelinePosts = myPosts.concat(...friendPost);
    const posts = timelinePosts.slice(0, 20);
    res.status(200).json({ message: `Post loaded Successfully`, posts });
  } catch (error) {
    return res
      .status(500)
      .json({ message: `Internal Server Error: ${error.message}` });
  }
};
