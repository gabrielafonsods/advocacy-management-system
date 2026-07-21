import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { PrismaClient } from '@prisma/client';
import { notifyUsers, notifyByRole, notifyAll } from '../services/notification.service';
import { runDailyNotificationChecks } from '../jobs/notificationScheduler';

const prisma = new PrismaClient();

export const getNotifications = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const { limit = 10, unreadOnly } = req.query;

    const where: any = { userId };
    if (unreadOnly === 'true') {
      where.isRead = false;
    }

    const notifications = await prisma.notification.findMany({
      where,
      take: parseInt(limit as string),
      orderBy: { createdAt: 'desc' },
    });

    const unreadCount = await prisma.notification.count({
      where: { userId, isRead: false },
    });

    res.json({
      success: true,
      data: notifications,
      unreadCount,
    });
  } catch (error) {
    next(error);
  }
};

export const markAsRead = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const notification = await prisma.notification.findFirst({
      where: { id, userId },
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notificação não encontrada',
      });
    }

    await prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });

    res.json({
      success: true,
      message: 'Notificação marcada como lida',
    });
  } catch (error) {
    next(error);
  }
};

export const markAllAsRead = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;

    await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });

    res.json({
      success: true,
      message: 'Todas as notificações foram marcadas como lidas',
    });
  } catch (error) {
    next(error);
  }
};

export const deleteNotification = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const notification = await prisma.notification.findFirst({
      where: { id, userId },
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notificação não encontrada',
      });
    }

    await prisma.notification.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: 'Notificação excluída',
    });
  } catch (error) {
    next(error);
  }
};

// Criação manual de notificação — apenas SOCIO. Permite escolher usuários
// específicos ("citar quem quiser"), um ou mais cargos, ou todo mundo.
export const createNotification = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { title, message, target, userIds, roles, link } = req.body;

    if (!title || !message) {
      throw new AppError('Título e mensagem são obrigatórios', 400);
    }

    const payload = { title, message, type: 'MENSAGEM', link };

    if (target === 'ALL') {
      await notifyAll(payload);
    } else if (target === 'ROLE') {
      if (!Array.isArray(roles) || !roles.length) {
        throw new AppError('Selecione ao menos um cargo', 400);
      }
      await notifyByRole(roles, payload);
    } else {
      if (!Array.isArray(userIds) || !userIds.length) {
        throw new AppError('Selecione ao menos um usuário', 400);
      }
      await notifyUsers(userIds, payload);
    }

    res.status(201).json({ success: true, message: 'Notificação enviada com sucesso' });
  } catch (error) {
    next(error);
  }
};

// Dispara manualmente a verificação diária (prazos, audiências, processos
// parados, honorários em atraso) — útil para testar sem esperar o horário
// agendado. Apenas SOCIO.
export const runChecksNow = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const count = await runDailyNotificationChecks();
    res.json({ success: true, message: `Verificação concluída: ${count} notificação(ões) geradas` });
  } catch (error) {
    next(error);
  }
};
