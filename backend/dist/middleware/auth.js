"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateToken = generateToken;
exports.authenticateJWT = authenticateJWT;
exports.requireRole = requireRole;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const JWT_SECRET = process.env.JWT_SECRET || 'agriroute_jwt_secret_development_key_2026';
/**
 * Generate a JWT token for testing or client session login.
 */
function generateToken(payload, expiresIn = '7d') {
    return jsonwebtoken_1.default.sign(payload, JWT_SECRET, { expiresIn: expiresIn });
}
/**
 * JWT Authentication Middleware
 * Validates Bearer token in Authorization header.
 * Allows dev bypass if DEV_AUTH_BYPASS is true or in non-production with demo token.
 */
function authenticateJWT(req, res, next) {
    const authHeader = req.headers.authorization;
    // Development / Demo quick bypass option
    if (process.env.NODE_ENV !== 'production' &&
        (req.headers['x-dev-bypass'] === 'true' || !authHeader)) {
        req.user = {
            id: req.headers['x-officer-id'] || 'a1111111-1111-1111-1111-111111111111',
            role: req.headers['x-user-role'] || 'owner',
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
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    }
    catch (err) {
        res.status(403).json({
            error: 'Forbidden',
            message: 'Invalid, expired, or malformed JWT token.',
        });
    }
}
/**
 * Role-Based Access Control Guard
 */
function requireRole(allowedRole) {
    return (req, res, next) => {
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
