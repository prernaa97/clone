import jwt from "jsonwebtoken";

export function getUserIdFromToken(req) {
  try {
    const authHeader = req.headers?.authorization || "";
    if (!authHeader.toLowerCase().startsWith("bearer ")) return null;
    const token = authHeader.substring(7);
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    return payload?.sub || null;
  } catch (_) {
    return null;
  }
}


