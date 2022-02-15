import User from "../models/userModel.js";
import Comment from "../models/commentModel.js";
import Post from "../models/postModel.js";
import cloudinary from "cloudinary";
import ApiFeatures from "../utils/apiFeatures.js";
import bcrypt from "bcrypt";

export const updateUser = async (req, res) => {
  try {
    const userName = req.params.username;
    const user = await User.findOne({ username: userName });
    if (req.user.username === userName) {
      const { name, username, email, avatar, bio } = req.body;
      const oldUsername = await User.findOne({ username });
      if (username === user.username) {
        return res
          .status(400)
          .json({ message: `Please use a different username` });
      }
      if (email === user.email) {
        return res
          .status(400)
          .json({ message: `Please use a different email` });
      }
      if (oldUsername) {
        return res.status(400).json({ message: `Username is already in use` });
      }
      const oldEmail = await User.findOne({ email });
      if (oldEmail) {
        return res.status(400).json({ message: `Email is already in use` });
      }
      if (bio?.length > 150) {
        return res
          .status(400)
          .json({ message: `Bio can be only 150 characters long` });
      }
      if (avatar) {
        if (user.avatar.url && user.avatar.public_id) {
          await cloudinary.v2.uploader.destroy(user.avatar.public_id);
        }

        const result = await cloudinary.v2.uploader.upload(avatar, {
          folder: "User",
          upload_preset: "social",
        });
        const image = {
          public_id: result.public_id,
          url: result.secure_url,
        };

        await user.updateOne({
          name,
          username,
          email,
          avatar: image,
          bio,
        });

        return res.status(200).json({ message: `Profile Update Successfully` });
      } else {
        await user.updateOne({
          name,
          username,
          email,
          bio,
        });

        return res.status(200).json({ message: `Profile Update Successfully` });
      }
    } else {
      return res
        .status(401)
        .json({ message: `User can only update their own profile` });
    }
  } catch (error) {
    return res
      .status(500)
      .json({ message: `Internal Server Error: ${error.message}` });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const { username } = req.params;
    const user = await User.findOne({ username });
    if (req.user.username === user.username || req.user.isAdmin === true) {
      await Post.deleteMany({ owner: user._id });
      await Comment.deleteMany({ owner: user._id });
      await user.remove();
      return res.status(200).json({ message: `User remove successfully` });
    } else {
      return res
        .status(401)
        .json({ message: `User can only delete their own account` });
    }
  } catch (error) {
    return res
      .status(500)
      .json({ message: `Internal Server Error: ${error.message}` });
  }
};

export const follow = async (req, res) => {
  try {
    const { username } = req.params;
    const user = await User.findOne({ username });
    const reqUser = await User.findById(req.user._id);
    if (user.username === reqUser.username) {
      return res.status(400).json({ message: `You can not follow yourself` });
    }
    if (user.followers.includes(reqUser._id)) {
      return res.status(400).json({ message: `User already followed` });
    } else {
      await user.updateOne({
        $push: {
          followers: reqUser._id,
        },
      });
      await reqUser.updateOne({
        $push: {
          followings: user._id,
        },
      });
      return res.status(200).json({ message: `User follow Successfully` });
    }
  } catch (error) {
    return res
      .status(500)
      .json({ message: `Internal Server Error: ${error.message}` });
  }
};

export const unFollow = async (req, res) => {
  try {
    const { username } = req.params;
    const user = await User.findOne({ username });
    const reqUser = await User.findById(req.user._id);
    if (user.username === reqUser.username) {
      return res.status(400).json({ message: `You can not unfollow yourself` });
    }
    if (!user.followers.includes(reqUser._id)) {
      return res.status(400).json({ message: `User already unfollowed` });
    } else {
      await user.updateOne({
        $pull: {
          followers: reqUser._id,
        },
      });
      await reqUser.updateOne({
        $pull: {
          followings: user._id,
        },
      });
      return res.status(200).json({ message: `User unfollow Successfully` });
    }
  } catch (error) {
    return res
      .status(500)
      .json({ message: `Internal Server Error: ${error.message}` });
  }
};

export const getUser = async (req, res) => {
  try {
    const { username } = req.params;
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ message: `User not found` });
    }
    const posts = await Post.find({ owner: user._id });
    return res
      .status(200)
      .json({ message: `User loaded successfully`, user, posts });
  } catch (error) {
    return res
      .status(500)
      .json({ message: `Internal Server Error: ${error.message}` });
  }
};

export const getAllUser = async (req, res) => {
  try {
    const apiFeatures = new ApiFeatures(User.find(), req.query).search();
    const users = await apiFeatures.query;
    if (!users) {
      return res.status(404).json({ message: `Users not found` });
    }

    return res
      .status(200)
      .json({ message: `Users Loaded Successfully`, users });
  } catch (error) {
    return res
      .status(500)
      .json({ message: `Internal Server Error: ${error.message}` });
  }
};

export const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const posts = await Post.find({ owner: user._id });
    return res
      .status(200)
      .json({ message: `Profile Loaded Successfully`, user, posts });
  } catch (error) {
    return res
      .status(500)
      .json({ message: `Internal Server Error: ${error.message}` });
  }
};

export const getFollowers = async (req, res) => {
  try {
    const { username } = req.params;
    const user = await User.find({ username });
    const followers = await User.find({ followings: { $in: user._id } });
    if (followers.length === 0) {
      return res.status(404).json({ message: `No followers` });
    }
    return res
      .status(200)
      .json({ message: `Followers loaded successfully`, followers });
  } catch (error) {
    return res
      .status(500)
      .json({ message: `Internal Server Error: ${error.message}` });
  }
};

export const getFollowings = async (req, res) => {
  try {
    const { username } = req.params;
    const user = await User.find({ username });
    const followings = await User.find({ followers: { $in: user._id } });
    if (followings.length === 0) {
      return res.status(404).json({ message: `No followings` });
    }
    return res
      .status(200)
      .json({ message: `Followings loaded successfully`, followings });
  } catch (error) {
    return res
      .status(500)
      .json({ message: `Internal Server Error: ${error.message}` });
  }
};

export const changePassword = async (req, res) => {
  try {
    const { username } = req.params;
    const user = await User.findOne({ username }).select("+password");
    const { password, newPassword, confirmPassword } = req.body;
    if (req.user.username !== username) {
      return res.status(401).json({ message: `Unauthorized Access` });
    }
    if (!user) {
      return res.status(404).json({ message: `User not found` });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: `Old Password is not correct` });
    }
    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: `Password must be same` });
    }
    const pswd = await bcrypt.hash(password, 10);
    await user.updateOne({
      password: pswd,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: `Internal Server Error: ${error.message}` });
  }
};
