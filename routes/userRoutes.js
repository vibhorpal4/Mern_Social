import express from "express";
import * as userController from "../controllers/userController.js";
import authMiddleware from "../middlewares/authMiddleware.js";

const router = express.Router();

router.put("/user/:username", authMiddleware, userController.updateUser);
router.delete("/user/:username", authMiddleware, userController.deleteUser);
router.put("/user/:username/follow", authMiddleware, userController.follow);
router.put("/user/:username/unfollow", authMiddleware, userController.unFollow);
router.get("/user/:username", authMiddleware, userController.getUser);
router.get("/", authMiddleware, userController.getAllUser);
router.get("/profile", authMiddleware, userController.getUserProfile);
router.get(
  "/user/:username/followers",
  authMiddleware,
  userController.getFollowers
);
router.get(
  "/user/:username/followings",
  authMiddleware,
  userController.getFollowings
);
router.put(
  "/user/:username/change/password",
  authMiddleware,
  userController.changePassword
);
router.get("/user/:id", authMiddleware, userController.getUserById);
router.put("/user/:username/block", authMiddleware, userController.blockUser);
router.put(
  "/user/:username/unblock",
  authMiddleware,
  userController.unBlockUser
);

export default router;
