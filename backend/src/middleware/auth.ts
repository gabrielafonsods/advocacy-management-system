import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from './errorHandler';
import prisma from '../config/database';

const JWT_ISSUER = 'manuadv-api';
const JWT_AUDIENCE = 'manuadv-app';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('Token não fornecido', 401);
    }

    const token = authHeader.split(' ')[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET!, {
      algorithms: ['HS256'],
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
    }) as {
      id: string;
      email: string;
      role: string;
      tokenVersion: number;
    };

    // Confere no banco se o usuário ainda está ativo e se o token não foi
    // invalidado por um logout ou troca de senha (tokenVersion mudou).
    // Isso garante que revogar acesso funciona de verdade, e não só quando
    // o token expira sozinho (15 min).
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { isActive: true, tokenVersion: true, role: true },
    });

    if (!user || !user.isActive) {
      throw new AppError('Usuário inativo ou não encontrado', 401);
    }

    if (user.tokenVersion !== decoded.tokenVersion) {
      throw new AppError('Sessão expirada, faça login novamente', 401);
    }

    req.user = { id: decoded.id, email: decoded.email, role: user.role };
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      next(new AppError('Token inválido', 401));
    } else if (error instanceof jwt.TokenExpiredError) {
      next(new AppError('Token expirado', 401));
    } else {
      next(error);
    }
  }
};

export const authorize = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError('Não autenticado', 401));
    }

    if (!roles.includes(req.user.role)) {
      return next(new AppError('Acesso negado', 403));
    }

    next();
  };
};
