import express from "express";
import * as messageControllers from "../controllers/messageController.js";
import authMiddleware from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/:id", authMiddleware, messageControllers.sendMessage);
router.get("/:id", authMiddleware, messageControllers.getMessages);

export default router;
