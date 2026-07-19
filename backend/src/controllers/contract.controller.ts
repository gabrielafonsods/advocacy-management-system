import { Response, NextFunction } from 'express';
import prisma from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';
import { createAuditLog } from '../utils/audit';
import { generateContractPdf } from '../services/pdf.service';

export const getContracts = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { clientId, status } = req.query;
    const where: any = {};
    if (clientId) where.clientId = clientId;
    if (status) where.status = status;

    const contracts = await prisma.contract.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { client: { select: { id: true, name: true, cpfCnpj: true } } },
    });

    res.json({ status: 'success', data: contracts });
  } catch (error) {
    next(error);
  }
};

export const getContract = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const contract = await prisma.contract.findUnique({
      where: { id: req.params.id },
      include: { client: true },
    });
    if (!contract) throw new AppError('Contrato não encontrado', 404);
    res.json({ status: 'success', data: contract });
  } catch (error) {
    next(error);
  }
};

export const createContract = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { title, description, value, startDate, endDate, status, terms, clientId } = req.body;
    if (!title || value === undefined || !startDate || !clientId) {
      throw new AppError('Título, valor, data de início e cliente são obrigatórios', 400);
    }

    const contract = await prisma.contract.create({
      data: {
        title,
        description,
        value: parseFloat(value),
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        status: status || 'ATIVO',
        terms,
        clientId,
      },
      include: { client: { select: { id: true, name: true, cpfCnpj: true } } },
    });

    await createAuditLog('CREATE', 'Contract', contract.id, req.user!.id, req.ip, req.get('user-agent'));

    res.status(201).json({ status: 'success', message: 'Contrato criado com sucesso', data: contract });
  } catch (error) {
    next(error);
  }
};

export const updateContract = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { title, description, value, startDate, endDate, status, terms, clientId } = req.body;

    const contract = await prisma.contract.update({
      where: { id: req.params.id },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(value !== undefined && { value: parseFloat(value) }),
        ...(startDate !== undefined && { startDate: new Date(startDate) }),
        ...(endDate !== undefined && { endDate: endDate ? new Date(endDate) : null }),
        ...(status !== undefined && { status }),
        ...(terms !== undefined && { terms }),
        ...(clientId !== undefined && { clientId }),
      },
      include: { client: { select: { id: true, name: true, cpfCnpj: true } } },
    });

    await createAuditLog('UPDATE', 'Contract', contract.id, req.user!.id, req.ip, req.get('user-agent'));

    res.json({ status: 'success', message: 'Contrato atualizado com sucesso', data: contract });
  } catch (error) {
    next(error);
  }
};

export const deleteContract = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await prisma.contract.delete({ where: { id: req.params.id } });
    await createAuditLog('DELETE', 'Contract', req.params.id, req.user!.id, req.ip, req.get('user-agent'));
    res.json({ status: 'success', message: 'Contrato excluído com sucesso' });
  } catch (error) {
    next(error);
  }
};

export const downloadContractPdf = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const contract = await prisma.contract.findUnique({
      where: { id: req.params.id },
      include: { client: true },
    });
    if (!contract) throw new AppError('Contrato não encontrado', 404);

    const pdfBuffer = await generateContractPdf({
      title: contract.title,
      description: contract.description,
      value: contract.value,
      startDate: contract.startDate,
      endDate: contract.endDate,
      terms: contract.terms,
      client: contract.client,
    });

    await createAuditLog('DOWNLOAD_PDF', 'Contract', contract.id, req.user!.id, req.ip, req.get('user-agent'));

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="contrato-${contract.id}.pdf"`);
    res.send(pdfBuffer);
  } catch (error) {
    next(error);
  }
};
