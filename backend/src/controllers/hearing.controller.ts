import { Response, NextFunction } from 'express';
import prisma from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';
import { notifyUser } from '../services/notification.service';
import { getAccessibleCaseIds } from '../utils/caseAccess';

export const getHearings = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const accessibleCaseIds = await getAccessibleCaseIds(req.user!);
    const where: any = {};
    if (accessibleCaseIds !== null) {
      where.caseId = { in: accessibleCaseIds };
    }

    const hearings = await prisma.hearing.findMany({
      where,
      include: {
        case: {
          select: {
            id: true,
            caseNumber: true,
            title: true,
          },
        },
      },
      orderBy: { date: 'asc' },
    });

    res.json({ status: 'success', data: hearings });
  } catch (error) {
    next(error);
  }
};

export const getHearing = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const hearing = await prisma.hearing.findUnique({
      where: { id },
      include: { case: true },
    });

    if (!hearing) {
      throw new AppError('Audiência não encontrada', 404);
    }

    const accessibleCaseIds = await getAccessibleCaseIds(req.user!);
    if (accessibleCaseIds !== null && (!hearing.caseId || !accessibleCaseIds.includes(hearing.caseId))) {
      throw new AppError('Você não tem acesso a esta audiência', 403);
    }

    res.json({ status: 'success', data: hearing });
  } catch (error) {
    next(error);
  }
};

export const createHearing = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { title, description, date, type, location, notes, caseId } = req.body;

    const hearing = await prisma.hearing.create({
      data: {
        title,
        description,
        date: new Date(date),
        type,
        location,
        notes,
        caseId,
      },
      include: { case: true },
    });

    if (hearing.case?.responsibleId) {
      await notifyUser(hearing.case.responsibleId, {
        title: 'Audiência marcada',
        message: `Audiência "${hearing.title}" marcada para o processo ${hearing.case.caseNumber}.`,
        type: 'AUDIENCIA_MARCADA',
        link: '/agenda',
      });
    }

    res.status(201).json({ status: 'success', data: hearing });
  } catch (error) {
    next(error);
  }
};

export const updateHearing = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { title, description, date, type, location, notes, status } = req.body;

    const hearing = await prisma.hearing.update({
      where: { id },
      data: {
        title,
        description,
        date: date ? new Date(date) : undefined,
        type,
        location,
        notes,
        status,
      },
      include: { case: true },
    });

    res.json({ status: 'success', data: hearing });
  } catch (error) {
    next(error);
  }
};

export const deleteHearing = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    await prisma.hearing.delete({ where: { id } });
    res.json({ status: 'success', message: 'Audiência excluída com sucesso' });
  } catch (error) {
    next(error);
  }
};
