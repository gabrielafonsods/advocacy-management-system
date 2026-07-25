import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import { errorHandler } from './middleware/errorHandler';
import { sanitizeBody } from './middleware/sanitize';
import { logger } from './utils/logger';

// Routes
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import clientRoutes from './routes/client.routes';
import caseRoutes from './routes/case.routes';
import deadlineRoutes from './routes/deadline.routes';
import hearingRoutes from './routes/hearing.routes';
import documentRoutes from './routes/document.routes';
import appointmentRoutes from './routes/appointment.routes';
import feeRoutes from './routes/fee.routes';
import contractRoutes from './routes/contract.routes';
import dashboardRoutes from './routes/dashboard.routes';
import notificationRoutes from './routes/notification.routes';
import templateRoutes from './routes/template.routes';
import auditRoutes from './routes/audit.routes';

dotenv.config();

const app: Application = express();

// Em produção, força HTTPS — a maioria dos provedores (Vercel, etc.) já
// entrega em HTTPS e repassa isso no header x-forwarded-proto.
app.use((req, res, next) => {
  if (process.env.NODE_ENV === 'production' && req.headers['x-forwarded-proto'] === 'http') {
    return res.redirect(301, `https://${req.headers.host}${req.url}`);
  }
  next();
});

// Security middleware
app.use(helmet());

// CORS: só os domínios explicitamente permitidos podem consumir a API.
// Nunca cai num "libera tudo" por padrão — se CORS_ORIGIN não estiver
// configurado, só libera localhost (dev). Aceita uma lista separada por
// vírgula (ex: "https://manuadv.com,https://www.manuadv.com").
const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:3000')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Requisições sem origem (ex: chamadas server-to-server, curl, apps
    // mobile) não têm cabeçalho Origin — deixamos passar, pois CORS é uma
    // proteção de navegador, não uma autenticação.
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      logger.warn(`🚫 CORS bloqueou origem não autorizada: ${origin}`);
      callback(new Error('Não permitido pelo CORS'));
    }
  },
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'),
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  message: 'Muitas requisições deste IP, tente novamente mais tarde.'
});
app.use('/api/', limiter);

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(sanitizeBody);

// Static files (não funciona bem na Vercel, mas mantém para desenvolvimento)
app.use('/uploads/profiles', express.static('uploads/profiles'));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/cases', caseRoutes);
app.use('/api/deadlines', deadlineRoutes);
app.use('/api/hearings', hearingRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/fees', feeRoutes);
app.use('/api/contracts', contractRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/templates', templateRoutes);
app.use('/api/audit', auditRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Root route
app.get('/', (req, res) => {
  res.json({ 
    message: 'ManuADV Jurídico API',
    version: '1.0.0',
    status: 'running'
  });
});

// Error handler
app.use(errorHandler);

export default app;
