import User from "../models/userModel.js";
import tokenGenerator from "../utils/tokenGenerator.js";
import bcrypt from "bcrypt";
import sendEmail from "../utils/sendEmail.js";
import crypto from "crypto";

export const register = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res
        .status(400)
        .json({ message: `Please fill all the required fields` });
    }
    const oldUsername = await User.findOne({ username });
    if (oldUsername) {
      return res.status(400).json({ message: `Username must be unique` });
    }
    const oldUser = await User.findOne({ email });
    if (oldUser) {
      return res.status(400).json({ message: `User already Exist` });
    }

    const newUser = await User.create({
      username,
      email,
      password,
    });

    const user = await newUser.save();

    tokenGenerator(user, 201, res, `User Registred Successfully`);
  } catch (error) {
    return res
      .status(500)
      .json({ message: `Internal server error: ${error.message}` });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Please enter all the fields" });
    }

    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      return res.status(404).json({ message: `User not found` });
    }

    const isPasswordMatch = await bcrypt.compare(password, user.password);
    if (!isPasswordMatch) {
      return res.status(401).json({ message: `Invalid Credentials` });
    }

    tokenGenerator(user, 200, res, `User Login successfully`);
  } catch (error) {
    return res
      .status(500)
      .json({ message: `Internal Server Error: ${error.message}` });
  }
};

export const logout = async (req, res) => {
  try {
    res.cookie("token", null, {
      expires: new Date(Date.now()),
      httpOnly: true,
    });
    res.status(200).json({ message: `Logout Success` });
  } catch (error) {
    return res
      .status(500)
      .json({ message: `Internal Server Error: ${error.message}` });
  }
};

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: `User not found` });
    }
    const resetToken = user.getResetPasswordToken();
    await user.save({ validateBeforeSave: false });

    const resetPasswordUrl = `${req.protocol}://${req.get(
      "host"
    )}/api/v1/auth/password/reset/${resetToken}`;

    const message = `Your Password reset token is:- \n\n ${resetPasswordUrl} \n\n If you not requested this email then please ignore it`;

    try {
      await sendEmail({
        email: user.email,
        subject: `Social App Password Recovery`,
        message,
      });

      return res.status(200).json({
        message: `Password reset link is sent to your email: ${email} successfully`,
      });
    } catch (error) {
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;

      await user.save({ validateBeforeSave: false });
      return res
        .status(500)
        .json({ message: `Internal Server Error: ${error.message}` });
    }
  } catch (error) {
    return res
      .status(500)
      .json({ message: `Internal Server Error: ${error.message}` });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { password, confirmPassword } = req.body;

    const resetPasswordToken = crypto
      .createHash("sha256")
      .update(req.params.token)
      .digest("hex");

    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: {
        $gt: Date.now(),
      },
    }).select("+password");
    if (!user) {
      return res.status(404).json({
        message: `Reset Password Token is invalid or has been expired`,
      });
    }

    if (password !== confirmPassword) {
      return res
        .status(400)
        .json({ message: `Password and Confirm Password must be same` });
    }

    const pswd = await bcrypt.hash(password, 10);

    await user.updateOne({
      password: pswd,
      resetPasswordToken: undefined,
      resetPasswordExpire: undefined,
    });
    await user.save();

    tokenGenerator(user, 200, res, `Password Reset Successfull`);
  } catch (error) {
    return res
      .status(500)
      .json({ message: `Internal Server Error: ${error.message}` });
  }
};
