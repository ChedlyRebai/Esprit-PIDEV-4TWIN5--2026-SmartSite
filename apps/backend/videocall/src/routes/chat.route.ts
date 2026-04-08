import express from "express";
import { protectRouteForChatToken } from "../middleware/auth.middleware";
import { getStreamToken } from "../controllers/chat.controller";

const router = express.Router();

router.get("/token", protectRouteForChatToken, getStreamToken);

export default router;
