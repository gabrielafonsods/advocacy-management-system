import { Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';
import { createAuditLog } from '../utils/audit';
import { notifySocios, notifyUser } from '../services/notification.service';
import { validatePasswordStrength } from '../utils/passwordPolicy';
import { isRealImage } from '../utils/fileSignature';
import fs from 'fs';

// Get all users
export const getUsers = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        cpf: true,
        oab: true,
        phone: true,
        role: true,
        isActive: true,
        twoFactorEnabled: true,
        profileImage: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    res.json({ status: 'success', data: users });
  } catch (error) {
    next(error);
  }
};

// Get user by ID
export const getUser = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        cpf: true,
        oab: true,
        phone: true,
        role: true,
        isActive: true,
        twoFactorEnabled: true,
        profileImage: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new AppError('Usuário não encontrado', 404);
    }

    res.json({ status: 'success', data: user });
  } catch (error) {
    next(error);
  }
};

// Update user
export const updateUser = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { name, email, cpf, oab, phone, role, isActive, password, currentPassword } = req.body;

    const existingUser = await prisma.user.findUnique({ where: { id } });
    if (!existingUser) {
      throw new AppError('Usuário não encontrado', 404);
    }

    const isSelf = req.user!.id === id;
    const isSocio = req.user!.role === 'SOCIO';

    // Só o próprio usuário ou um sócio podem editar este cadastro
    if (!isSelf && !isSocio) {
      throw new AppError('Você não tem permissão para editar este usuário', 403);
    }

    // Só um sócio pode alterar cargo ou ativar/desativar contas
    if ((role !== undefined && role !== existingUser.role) || isActive !== undefined) {
      if (!isSocio) {
        throw new AppError('Apenas um sócio pode alterar cargo ou status da conta', 403);
      }
    }

    // Troca de senha: o próprio usuário precisa confirmar a senha atual;
    // um sócio pode redefinir a senha de outra pessoa sem essa confirmação.
    if (password) {
      if (isSelf) {
        if (!currentPassword) {
          throw new AppError('Informe a senha atual para definir uma nova senha', 400);
        }
        const currentPasswordValid = await bcrypt.compare(currentPassword, existingUser.password);
        if (!currentPasswordValid) {
          throw new AppError('Senha atual incorreta', 401);
        }
      }
      const passwordError = validatePasswordStrength(password);
      if (passwordError) {
        throw new AppError(passwordError, 400);
      }
    }

    // Check if email is being changed and if it's already in use
    if (email !== existingUser.email) {
      const emailExists = await prisma.user.findUnique({ where: { email } });
      if (emailExists) {
        throw new AppError('Email já está em uso', 400);
      }
    }

    const updateData: any = {
      name,
      email,
      cpf,
      oab,
      phone,
    };

    // Cargo e status ativo só entram no update se for um sócio alterando
    if (isSocio) {
      if (role !== undefined) updateData.role = role;
      if (isActive !== undefined) updateData.isActive = isActive;
    }

    if (password) {
      updateData.password = await bcrypt.hash(password, 12);
      updateData.tokenVersion = { increment: 1 };
    }

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        cpf: true,
        oab: true,
        phone: true,
        role: true,
        isActive: true,
        twoFactorEnabled: true,
        profileImage: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    await createAuditLog(
      'UPDATE',
      'User',
      user.id,
      req.user?.id || user.id,
      req.ip,
      req.get('user-agent'),
      `Usuário ${user.name} atualizado`
    );

    if (role !== undefined && role !== existingUser.role) {
      await notifySocios({
        title: 'Permissões alteradas',
        message: `O cargo de ${user.name} foi alterado de ${existingUser.role} para ${role}.`,
        type: 'PERMISSAO_ALTERADA',
        link: '/configuracoes',
      });
      await notifyUser(user.id, {
        title: 'Suas permissões foram alteradas',
        message: `Seu cargo no sistema agora é ${role}.`,
        type: 'PERMISSAO_ALTERADA',
      });
    }

    res.json({ status: 'success', data: user });
  } catch (error) {
    next(error);
  }
};

// Delete user
export const deleteUser = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new AppError('Usuário não encontrado', 404);
    }

    // Instead of deleting, deactivate the user
    await prisma.user.update({
      where: { id },
      data: { isActive: false },
    });

    await createAuditLog(
      'DELETE',
      'User',
      id,
      req.user?.id || id,
      req.ip,
      req.get('user-agent'),
      `Usuário ${user.name} desativado`
    );

    res.json({ status: 'success', message: 'Usuário desativado com sucesso' });
  } catch (error) {
    next(error);
  }
};

// Upload profile image
export const uploadProfileImage = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    if (!req.file) {
      throw new AppError('Nenhuma imagem foi enviada', 400);
    }

    // Nunca confiar só na extensão/Content-Type: confere a assinatura real do arquivo
    if (!isRealImage(req.file.path)) {
      fs.unlinkSync(req.file.path);
      throw new AppError('O arquivo enviado não é uma imagem válida', 400);
    }

    const existingUser = await prisma.user.findUnique({ where: { id } });
    if (!existingUser) {
      throw new AppError('Usuário não encontrado', 404);
    }

    if (req.user!.id !== id && req.user!.role !== 'SOCIO') {
      throw new AppError('Você não tem permissão para alterar a foto deste usuário', 403);
    }

    // Delete old profile image if exists
    if (existingUser.profileImage) {
      const path = require('path');
      const oldImagePath = path.join(__dirname, '../../uploads/profiles', path.basename(existingUser.profileImage));
      if (fs.existsSync(oldImagePath)) {
        fs.unlinkSync(oldImagePath);
      }
    }

    // Save new profile image path
    const profileImageUrl = `/uploads/profiles/${req.file.filename}`;
    
    const user = await prisma.user.update({
      where: { id },
      data: { profileImage: profileImageUrl },
      select: {
        id: true,
        name: true,
        email: true,
        cpf: true,
        oab: true,
        phone: true,
        role: true,
        isActive: true,
        profileImage: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    await createAuditLog(
      'UPDATE',
      'User',
      user.id,
      req.user?.id || user.id,
      `Foto de perfil atualizada para ${user.name}`,
      undefined,
      undefined
    );

    res.json({ 
      status: 'success', 
      message: 'Foto de perfil atualizada com sucesso',
      data: user 
    });
  } catch (error) {
    next(error);
  }
};
