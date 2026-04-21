import jwt from "jsonwebtoken";
import User from "../models/User";

const getTokenFromRequest = (req) => {
  const cookieToken = req.cookies?.jwt;
  if (cookieToken) {
    return cookieToken;
  }

  const authHeader = req.headers?.authorization;
  if (typeof authHeader === "string" && authHeader.startsWith("Bearer ")) {
    return authHeader.slice(7).trim();
  }

  return null;
};

const extractUserIdFromPayload = (decoded) => {
  return decoded?.userId || decoded?.sub || decoded?.id || decoded?._id || null;
};

export const protectRoute = async (req, res, next) => {
  try {
    const token = getTokenFromRequest(req);

    if (!token) {
      return res.status(401).json({ message: "Unauthorized - No token provided" });
    }

    const decoded = jwt.verify(token, "smartsite");
    console.log("Decoded JWT payload:", decoded);
    if (!decoded) {
      return res.status(401).json({ message: "Unauthorized - Invalid token1" });
    }

    const userId = extractUserIdFromPayload(decoded);
    const user = userId ? await User.findById(userId).select("-password") : null;

    if (!user) {
      return res.status(401).json({ message: "Unauthorized - User not found" });
    }

    req.user = user;

    next();
  } catch (error) {
    console.log("Error in protectRoute middleware", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const protectRouteForChatToken = async (req, res, next) => {
  try {
    console.log("Headers:", req.headers);

    const token = getTokenFromRequest(req);
    console.log("Extracted token:", token);

    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }

    const decoded = jwt.verify(token, "smartsite");
    console.log("Decoded:", decoded);

    const userId = extractUserIdFromPayload(decoded);

    if (!userId) {
      return res.status(401).json({ message: "Invalid token payload" });
    }

    req.user = { id: String(userId) };

    next();
  } catch (error) {
    console.log("JWT ERROR:", error.name, error.message);
    res.status(401).json({ message: "Unauthorized - " + error.message });
  }
};