import { Router } from 'express';
import {
  register,
  login,
  refreshToken,
  logout,
  enable2FA,
  verify2FA,
  disable2FA,
  getCurrentUser
} from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth';
import rateLimit from 'express-rate-limit';

// Limite bem mais rígido que o global — protege login/registro contra
// força bruta e credential stuffing (5 tentativas a cada 15 minutos por IP).
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { status: 'error', message: 'Muitas tentativas. Aguarde alguns minutos e tente novamente.' },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
});

const router = Router();

router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.post('/refresh', refreshToken);
router.post('/logout', authenticate, logout);
router.get('/me', authenticate, getCurrentUser);

// 2FA
router.post('/2fa/enable', authenticate, enable2FA);
router.post('/2fa/verify', authenticate, verify2FA);
router.post('/2fa/disable', authenticate, disable2FA);

export default router;
