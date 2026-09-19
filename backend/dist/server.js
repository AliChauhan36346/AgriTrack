"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.app = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const dotenv_1 = __importDefault(require("dotenv"));
const locations_1 = require("./routes/locations");
const owner_1 = require("./routes/owner");
const auth_1 = require("./middleware/auth");
dotenv_1.default.config();
exports.app = (0, express_1.default)();
const PORT = process.env.PORT || 4000;
// Security & Core Middleware
exports.app.use((0, helmet_1.default)());
exports.app.use((0, cors_1.default)({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-App-Client', 'X-Dev-Bypass', 'X-Officer-Id', 'X-User-Role'],
}));
exports.app.use(express_1.default.json({ limit: '10mb' }));
// Health Check Endpoint
exports.app.get('/health', (_req, res) => {
    res.status(200).json({
        status: 'healthy',
        service: 'AgriRoute Backend Service',
        timestamp: new Date().toISOString(),
    });
});
// Authentication Token Generation Route (For client testing & session init)
exports.app.post('/api/auth/token', (req, res) => {
    const { id, role, phone, name } = req.body;
    const userRole = role === 'owner' ? 'owner' : 'officer';
    const token = (0, auth_1.generateToken)({
        id: id || 'a1111111-1111-1111-1111-111111111111',
        role: userRole,
        phone: phone || '+92 300 1234567',
        name: name || (userRole === 'owner' ? 'Shop Owner' : 'Muhammad Tariq'),
    });
    res.status(200).json({
        token,
        role: userRole,
        expiresIn: '7d',
    });
});
// Route Handlers
exports.app.use('/api/locations', locations_1.locationsRouter);
exports.app.use('/api/owner', owner_1.ownerRouter);
// 404 Handler
exports.app.use((req, res) => {
    res.status(404).json({
        error: 'Not Found',
        message: `Cannot ${req.method} ${req.path}`,
    });
});
// Global Error Handling Middleware
exports.app.use((err, _req, res, _next) => {
    console.error('[Unhandled Error]:', err);
    res.status(500).json({
        error: 'Internal Server Error',
        message: process.env.NODE_ENV === 'production' ? 'An unexpected error occurred' : err.message,
    });
});
if (require.main === module) {
    exports.app.listen(PORT, () => {
        console.log(`🚀 AgriRoute backend service running at http://localhost:${PORT}`);
        console.log(`📡 Ingestion Endpoint: http://localhost:${PORT}/api/locations/sync-batch`);
        console.log(`🗺️  Live Fleet Endpoint: http://localhost:${PORT}/api/owner/officers-live`);
        console.log(`⏱️  Timeline & Stops Endpoint: http://localhost:${PORT}/api/owner/timeline`);
        console.log(`🔗 Tracker Pairing Endpoint: http://localhost:${PORT}/api/owner/link-tracker`);
    });
}
