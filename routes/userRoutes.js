import express from "express";
import * as userController from "../controllers/userController.js";
import authMiddleware from "../middlewares/authMiddleware.js";

const router = express.Router();

router.put("/user/:username", authMiddleware, userController.updateUser);
router.delete("/user/:username", authMiddleware, userController.deleteUser);
router.put("/user/follow/:username", authMiddleware, userController.follow);
router.put("/user/unfollow/:username", authMiddleware, userController.unFollow);
router.get("/user/:username", authMiddleware, userController.getUser);
router.get("/", authMiddleware, userController.getAllUser);
router.get("/profile", authMiddleware, userController.getUserProfile);
router.get("/followers", authMiddleware, userController.getFollowers);
router.get("/followings", authMiddleware, userController.getFollowings);

export default router;
