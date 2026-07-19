import { Response, NextFunction } from 'express';
import fs from 'fs';
import path from 'path';
import prisma from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';
import { createAuditLog } from '../utils/audit';
import { generateTemplatePdf } from '../services/pdf.service';

export const getTemplates = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { category } = req.query;
    const where: any = { isActive: true };
    if (category) where.category = category;

    const templates = await prisma.template.findMany({ where, orderBy: { name: 'asc' } });
    res.json({ status: 'success', data: templates });
  } catch (error) {
    next(error);
  }
};

export const getTemplate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const template = await prisma.template.findUnique({ where: { id: req.params.id } });
    if (!template) throw new AppError('Template não encontrado', 404);
    res.json({ status: 'success', data: template });
  } catch (error) {
    next(error);
  }
};

export const createTemplate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { name, description, content, category, variables } = req.body;
    if (!name || !content || !category) {
      throw new AppError('Nome, conteúdo e categoria são obrigatórios', 400);
    }

    const template = await prisma.template.create({
      data: {
        name,
        description,
        content,
        category,
        variables: Array.isArray(variables) ? JSON.stringify(variables) : variables,
      },
    });

    res.status(201).json({ status: 'success', message: 'Template criado com sucesso', data: template });
  } catch (error) {
    next(error);
  }
};

export const updateTemplate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { name, description, content, category, variables, isActive } = req.body;

    const template = await prisma.template.update({
      where: { id: req.params.id },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(content !== undefined && { content }),
        ...(category !== undefined && { category }),
        ...(variables !== undefined && {
          variables: Array.isArray(variables) ? JSON.stringify(variables) : variables,
        }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    res.json({ status: 'success', message: 'Template atualizado com sucesso', data: template });
  } catch (error) {
    next(error);
  }
};

export const deleteTemplate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await prisma.template.delete({ where: { id: req.params.id } });
    res.json({ status: 'success', message: 'Template excluído com sucesso' });
  } catch (error) {
    next(error);
  }
};

const VALID_DOCUMENT_TYPES = ['PETICAO', 'PROCURACAO', 'CONTRATO', 'ATA', 'PARECER', 'OUTROS'];

/**
 * Gera um PDF a partir de um template, substituindo as variáveis {VAR} pelo
 * que foi informado (ou pelo que conseguimos preencher automaticamente a
 * partir do processo/cliente). Por padrão também salva o resultado como um
 * Documento vinculado ao processo, para já entrar no histórico.
 */
export const generateFromTemplate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const template = await prisma.template.findUnique({ where: { id: req.params.id } });
    if (!template) throw new AppError('Template não encontrado', 404);

    const { caseId, variables = {}, saveAsDocument = true } = req.body;

    let autoVariables: Record<string, string> = {};

    if (caseId) {
      const caseData = await prisma.case.findUnique({
        where: { id: caseId },
        include: { client: true, responsible: true },
      });

      if (!caseData) throw new AppError('Processo não encontrado', 404);

      autoVariables = {
        NOME_CLIENTE: caseData.client.name,
        CPF: caseData.client.cpfCnpj,
        ENDERECO: [caseData.client.address, caseData.client.city, caseData.client.state]
          .filter(Boolean)
          .join(', '),
        CIDADE: caseData.client.city || caseData.jurisdiction || '',
        NOME_ADVOGADO: caseData.responsible.name,
        OAB: caseData.responsible.oab || '',
        UF: caseData.responsible.oab ? caseData.responsible.oab.replace(/[0-9]/g, '') : '',
        VARA: caseData.court || '',
      };
    }

    const finalVariables: Record<string, string> = {
      ...autoVariables,
      ...variables,
      DATA: (variables as any).DATA || new Date().toLocaleDateString('pt-BR'),
    };

    let content = template.content;
    for (const [key, value] of Object.entries(finalVariables)) {
      content = content.split(`{${key}}`).join(value || '');
    }

    const pdfBuffer = await generateTemplatePdf(template.name, content);

    let documentId: string | null = null;

    if (saveAsDocument) {
      const uploadsDir = path.join(__dirname, '../../uploads/documents');
      if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

      const fileName = `${template.category}-${Date.now()}.pdf`;
      fs.writeFileSync(path.join(uploadsDir, fileName), pdfBuffer);

      const docType = VALID_DOCUMENT_TYPES.includes(template.category) ? template.category : 'OUTROS';

      const document = await prisma.document.create({
        data: {
          title: `${template.name} - ${new Date().toLocaleDateString('pt-BR')}`,
          description: `Gerado automaticamente a partir do template "${template.name}"`,
          type: docType as any,
          fileName,
          filePath: `/uploads/documents/${fileName}`,
          fileSize: pdfBuffer.length,
          mimeType: 'application/pdf',
          uploadedBy: req.user!.id,
          caseId: caseId || null,
        },
      });

      documentId = document.id;

      await createAuditLog(
        'GENERATE_PDF',
        'Document',
        document.id,
        req.user!.id,
        req.ip,
        req.get('user-agent'),
        `Gerado a partir do template ${template.name}`
      );
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('X-Document-Id', documentId || '');
    res.setHeader('Content-Disposition', `inline; filename="${template.category}-${Date.now()}.pdf"`);
    res.send(pdfBuffer);
  } catch (error) {
    next(error);
  }
};
