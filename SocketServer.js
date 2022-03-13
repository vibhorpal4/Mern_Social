import User from "./models/userModel.js";
import Post from "./models/postModel.js";
import Notification from "./models/notificationModel.js";

let users = [];

const SocketServer = (socket) => {
  socket.on("Join", async (user) => {
    users.push({
      _id: user._id,
      socketId: socket.id,
    });
    const user1 = await User.findByIdAndUpdate(user._id, {
      isOnline: true,
      socketId: socket.id,
    });
    console.log(`${user1.username} has joined`);
  });

  socket.on("NotificationRead", async (user) => {
    await Notification.updateMany(
      {
        reciver: user._id,
        isRead: false,
      },
      {
        isRead: true,
      }
    );
  });

  socket.on("CommentCreate", (data) => {
    socket.broadcast.emit("CommentCreate", data);
  });

  socket.on("SendMessage", (data) => {
    socket.in(socket.id).emit("SendMessage", data);
  });

  socket.on("typing", () => {
    socket.in(socket.id).emit("typing");
  });

  socket.on('stopTyping' = () => {
    socket.in(socket.id).emit('stopTyping')
  })

  socket.on("disconnect", async () => {
    const disconnectedUser = await users.find(
      (usr) => usr.socketId === socket.id
    );
    if (disconnectedUser) {
      const disconnectedUsr = await User.findByIdAndUpdate(
        disconnectedUser._id,
        {
          isOnline: false,
          lastSeen: Date.now(),
        }
      );
      console.log(`${disconnectedUsr.username} had left`);
    } else {
      console.log("Socket error");
    }
  });
};

export default SocketServer;
