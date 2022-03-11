import express from "express";
import authMiddleware from "../middlewares/authMiddleware.js";
import * as chatControllers from "../controllers/chatController.js";

const router = express.Router();

router.post("/:id", authMiddleware, chatControllers.createChat);
router.get("/", authMiddleware, chatControllers.getAllChats);
router.get("/:id", authMiddleware, chatControllers.getAllConversionOfChat);

export default router;
