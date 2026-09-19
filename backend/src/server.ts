import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { locationsRouter } from './routes/locations';
import { ownerRouter } from './routes/owner';
import { generateToken } from './middleware/auth';

dotenv.config();

export const app = express();
const PORT = process.env.PORT || 4000;

// Security & Core Middleware
app.use(helmet());
app.use(
  cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-App-Client', 'X-Dev-Bypass', 'X-Officer-Id', 'X-User-Role'],
  })
);
app.use(express.json({ limit: '10mb' }));

// Health Check Endpoint
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'healthy',
    service: 'AgriRoute Backend Service',
    timestamp: new Date().toISOString(),
  });
});

// Authentication Token Generation Route (For client testing & session init)
app.post('/api/auth/token', (req: Request, res: Response) => {
  const { id, role, phone, name } = req.body;
  const userRole = role === 'owner' ? 'owner' : 'officer';
  const token = generateToken({
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
app.use('/api/locations', locationsRouter);
app.use('/api/owner', ownerRouter);

// 404 Handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Cannot ${req.method} ${req.path}`,
  });
});

// Global Error Handling Middleware
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[Unhandled Error]:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'production' ? 'An unexpected error occurred' : err.message,
  });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🚀 AgriRoute backend service running at http://localhost:${PORT}`);
    console.log(`📡 Ingestion Endpoint: http://localhost:${PORT}/api/locations/sync-batch`);
    console.log(`🗺️  Live Fleet Endpoint: http://localhost:${PORT}/api/owner/officers-live`);
    console.log(`⏱️  Timeline & Stops Endpoint: http://localhost:${PORT}/api/owner/timeline`);
    console.log(`🔗 Tracker Pairing Endpoint: http://localhost:${PORT}/api/owner/link-tracker`);
  });
}
