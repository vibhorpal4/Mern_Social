dotenv.config();
import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import mongoose from "mongoose";
import cors from "cors";
import fileUpload from "express-fileupload";
import cloudinary from "cloudinary";
import { createServer } from "http";
import jwt from "jsonwebtoken";
import { Server } from "socket.io";
import SocketServer from "./SocketServer.js";

//import Routes
import authRoutes from "./routes/authRoutes.js";
import postRoutes from "./routes/postRoutes.js";
import commentRoutes from "./routes/commentRoutes.js";
import userRoutes from "./routes/userRoutes.js";

//importing some models for socket
import User from "./models/userModel.js";

//Initialing server
const app = express();
const server = createServer(app);
const io = new Server(server);

app.use(function (req, res, next) {
  req.io = io;
  next();
});

// io.use((socket, next) => {
//   const token = socket.handshake.auth.token;
//   const user = socket.handshake.auth.user;
//   if (!token) {
//     return next(new Error("Socket Authentication Error"));
//   }
//   socket.reqUser = user;
//   socket.token = token;
//   socket.id = user._id;
//   next();
// });

io.on("connection", async (socket) => {
  // await User.findByIdAndUpdate(socket.reqUser._id, {
  //   isOnline: true,
  // });

  SocketServer(socket);
});

//Middlewares
app.use(cookieParser());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use(cors());
app.use(fileUpload());

//Routes
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/posts", postRoutes);
app.use("/api/v1/post/comments", commentRoutes);

//Conneting Database
const MONGO_URL = process.env.MONGO_URL;
mongoose
  .connect(MONGO_URL)
  .then(console.log(`DataBase connected Successfully`))
  .catch((err) => console.log(err));

//Cloudiary Config
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET,
});

//Connecting Server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server is running on PORT: ${PORT}`);
});
