import express from "express";
import * as authController from "../controllers/authController.js";
import authMiddleware from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/register", authController.register);
router.post("/login", authController.login);
router.get("/logout", authMiddleware, authController.logout);
router.post("/forgot/password", authMiddleware, authController.forgotPassword);
router.put(
  "/password/reset/:token",
  authMiddleware,
  authController.resetPassword
);

export default router;
