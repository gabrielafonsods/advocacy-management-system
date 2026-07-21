import prisma from '../config/database';

export interface NotificationPayload {
  title: string;
  message: string;
  type: string;
  link?: string;
}

/**
 * Cria uma notificação para um único usuário.
 */
export async function notifyUser(userId: string, payload: NotificationPayload) {
  if (!userId) return;
  return prisma.notification.create({
    data: {
      userId,
      title: payload.title,
      message: payload.message,
      type: payload.type,
      link: payload.link || null,
    },
  });
}

/**
 * Cria a mesma notificação para uma lista de usuários.
 */
export async function notifyUsers(userIds: string[], payload: NotificationPayload) {
  const uniqueIds = Array.from(new Set(userIds.filter(Boolean)));
  if (!uniqueIds.length) return;
  return prisma.notification.createMany({
    data: uniqueIds.map((userId) => ({
      userId,
      title: payload.title,
      message: payload.message,
      type: payload.type,
      link: payload.link || null,
    })),
  });
}

/**
 * Notifica todos os usuários ativos de um ou mais cargos (ex: ['SOCIO']).
 */
export async function notifyByRole(roles: string[], payload: NotificationPayload) {
  const users = await prisma.user.findMany({
    where: { role: { in: roles }, isActive: true },
    select: { id: true },
  });
  return notifyUsers(users.map((u) => u.id), payload);
}

/**
 * Notifica todos os usuários ativos do sistema.
 */
export async function notifyAll(payload: NotificationPayload) {
  const users = await prisma.user.findMany({ where: { isActive: true }, select: { id: true } });
  return notifyUsers(users.map((u) => u.id), payload);
}

/**
 * Notifica o(s) sócio(s) do escritório — usado em eventos estratégicos/supervisão.
 */
export async function notifySocios(payload: NotificationPayload) {
  return notifyByRole(['SOCIO'], payload);
}
