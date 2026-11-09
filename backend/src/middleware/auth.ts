import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/env';
import { ApiResponse } from '../utils/apiResponse';

export interface AuthenticatedUser {
  username: string;
  role: string;
  fullName?: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

export function authenticateJwt(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json(ApiResponse.error('Missing or invalid Authorization header'));
    return;
  }

  const token = authHeader.substring(7);

  try {
    const decoded = jwt.verify(token, config.jwt.secret) as any;
    req.user = {
      username: decoded.sub || decoded.username,
      role: decoded.role || 'ADMIN',
      fullName: decoded.fullName,
    };
    next();
  } catch (err: any) {
    res.status(401).json(ApiResponse.error('Invalid or expired authentication token'));
  }
}

export function requireRole(allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json(ApiResponse.error('Authentication required'));
      return;
    }

    const userRole = (req.user.role || '').toUpperCase();
    const isAllowed = allowedRoles.map((r) => r.toUpperCase()).includes(userRole);

    if (!isAllowed) {
      res.status(403).json(ApiResponse.error('Access denied: insufficient permissions'));
      return;
    }

    next();
  };
}

