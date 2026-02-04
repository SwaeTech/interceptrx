import jwt from "jsonwebtoken";
import { Request, Response } from "express";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-this";

export interface AuthUser {
  id: string;
  email: string;
  scopes: string[];
  orgId: string;
}

export interface AuthContext {
  user: AuthUser | null;
  req: Request;
  res: Response;
}

export function getAuthContext(req: Request, res: Response): AuthContext {
  const context: AuthContext = {
    user: null,
    req,
    res,
  };

  // Try to get token from cookie first
  let token = req.cookies?.token;

  // If not in cookie, try Authorization header
  if (!token) {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7);
    }
  }

  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as AuthUser;
      context.user = decoded;
    } catch (error) {
      // Token is invalid or expired, user remains null
      console.error("JWT verification failed:", error);
    }
  }

  return context;
}
