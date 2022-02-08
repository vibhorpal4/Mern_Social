import jwt from "jsonwebtoken";

const tokenGenerator = async (user, statusCode, res, message) => {
  const secret = process.env.JWT_SECRET;
  const expiresIn = process.env.JWT_EXPIRE;

  const token = jwt.sign({ id: user._id }, secret, {
    expiresIn,
  });

  const cookieExpire = process.env.COOKIE_EXPIRE;

  const options = {
    expires: new Date(Date.now() + cookieExpire * 24 * 60 * 60 * 1000),
    httpOnly: true,
  };

  res
    .status(statusCode)
    .cookie("token", token, options)
    .json({ message, user, token });
};

export default tokenGenerator;
