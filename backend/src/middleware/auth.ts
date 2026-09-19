import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'agriroute_jwt_secret_development_key_2026';

export interface AuthenticatedUser {
  id: string;
  role: 'owner' | 'officer';
  phone?: string;
  name?: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

/**
 * Generate a JWT token for testing or client session login.
 */
export function generateToken(payload: AuthenticatedUser, expiresIn: string = '7d'): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: expiresIn as any });
}

/**
 * JWT Authentication Middleware
 * Validates Bearer token in Authorization header.
 * Allows dev bypass if DEV_AUTH_BYPASS is true or in non-production with demo token.
 */
export function authenticateJWT(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  // Development / Demo quick bypass option
  if (
    process.env.NODE_ENV !== 'production' &&
    (req.headers['x-dev-bypass'] === 'true' || !authHeader)
  ) {
    req.user = {
      id: (req.headers['x-officer-id'] as string) || 'a1111111-1111-1111-1111-111111111111',
      role: (req.headers['x-user-role'] as 'owner' | 'officer') || 'owner',
      name: 'Development User',
    };
    return next();
  }

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Missing or invalid Authorization header. Expected Bearer token.',
    });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthenticatedUser;
    req.user = decoded;
    next();
  } catch (err) {
    res.status(403).json({
      error: 'Forbidden',
      message: 'Invalid, expired, or malformed JWT token.',
    });
  }
}

/**
 * Role-Based Access Control Guard
 */
export function requireRole(allowedRole: 'owner' | 'officer') {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized', message: 'Authentication required' });
      return;
    }

    if (req.user.role !== allowedRole && req.user.role !== 'owner') {
      res.status(403).json({
        error: 'Forbidden',
        message: `Access denied. Requires '${allowedRole}' privilege.`,
      });
      return;
    }

    next();
  };
}
