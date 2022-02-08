import express from "express";
import authMiddleware from "../middlewares/authMiddleware.js";
import * as commentController from "../controllers/commentController.js";

const router = express.Router();

router.post("/:id/create", authMiddleware, commentController.createComment);
router.put("/:id", authMiddleware, commentController.updateComment);
router.delete("/:id", authMiddleware, commentController.deleteComment);
router.get("/", authMiddleware, commentController.getAllComments);
router.get("/:id", authMiddleware, commentController.getComment);

export default router;
