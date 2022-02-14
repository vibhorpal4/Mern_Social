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
    // console.log(imagesLinks);

    const owner = req.user;

    const post = await Post.create({
      caption: req.body.caption,
      images: imagesLinks,
      owner,
    });
    await post.save();

    const user = await User.findById(owner._id);
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
    const posts = await Post.find();
    if (!posts) {
      return res.status(404).json({ message: `No posts found` });
    }
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
    if (post.likes.includes(req.user._id)) {
      post.updateOne({
        $pull: {
          likes: req.user._id,
        },
      });
      return res.status(200).json({ message: `Post Liked Successfully` });
    } else {
      post.updateOne({
        $push: {
          likes: req.user._id,
        },
      });
      return res.status(200).json({ message: `Post Unliked Successfully` });
    }
  } catch (error) {
    return res
      .status(500)
      .json({ message: `Internal Server Error: ${error.message}` });
  }
};

export const getTimeLinePost = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const myPosts = await Post.find({
      owner: user._id,
    });
    const friendPost = await Promise.all(
      user.followings.map((id) => {
        Post.find({ owner: id });
      })
    );
    const posts = myPosts.concat(...friendPost);
    res.status(200).json({ message: `Post loaded Successfully`, posts });
  } catch (error) {
    return res
      .status(500)
      .json({ message: `Internal Server Error: ${error.message}` });
  }
};

export const getMyPosts = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: `User not found` });
    }
    const posts = await Post.find({
      owner: user._id,
    });
    if (!posts) {
      return res.status(404).json({ message: `No post found` });
    }
    return res.status(200).json({ message: `Posts get successfully`, posts });
  } catch (error) {
    return res
      .status(500)
      .json({ message: `Internal Server Error: ${error.message}` });
  }
};
