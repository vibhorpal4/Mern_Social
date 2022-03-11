import express from "express";
import * as messageControllers from "../controllers/messageController.js";
import authMiddleware from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/:id", authMiddleware, messageControllers.sendMessage);

export default router;
