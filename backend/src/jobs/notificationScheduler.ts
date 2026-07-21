import prisma from '../config/database';
import { notifySocios, notifyUser } from '../services/notification.service';
import { logger } from '../utils/logger';

function startOfDay(date: Date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

/**
 * Roda uma vez por dia (agendado no server.ts) e cobre as notificações que
 * dependem de datas: prazos, audiências, processos parados e honorários
 * em atraso. Também pode ser disparado manualmente via
 * POST /api/notifications/run-checks (apenas SOCIO) para testes.
 */
export async function runDailyNotificationChecks() {
  const today = startOfDay(new Date());
  const tomorrow = addDays(today, 1);
  const in3Days = addDays(today, 3);
  const in4Days = addDays(today, 4);

  let notificationsSent = 0;

  // ---------- PRAZOS ----------
  const openDeadlines = await prisma.deadline.findMany({
    where: { isCompleted: false },
    include: { case: { select: { id: true, caseNumber: true, responsibleId: true } } },
  });

  for (const deadline of openDeadlines) {
    const due = startOfDay(deadline.dueDate);
    const responsibleId = deadline.case?.responsibleId;
    if (!responsibleId) continue;

    if (due < today) {
      await notifyUser(responsibleId, {
        title: 'Prazo vencido',
        message: `O prazo "${deadline.title}" do processo ${deadline.case.caseNumber} está vencido.`,
        type: 'PRAZO_VENCIDO',
        link: '/prazos',
      });
      await notifySocios({
        title: 'Processo crítico (prazo vencido)',
        message: `O processo ${deadline.case.caseNumber} tem um prazo vencido: "${deadline.title}".`,
        type: 'PROCESSO_CRITICO',
        link: '/prazos',
      });
      notificationsSent += 2;
    } else if (due.getTime() === today.getTime()) {
      await notifyUser(responsibleId, {
        title: 'Prazo vence hoje',
        message: `O prazo "${deadline.title}" do processo ${deadline.case.caseNumber} vence hoje.`,
        type: 'PRAZO_HOJE',
        link: '/prazos',
      });
      notificationsSent += 1;
    } else if (due.getTime() === tomorrow.getTime()) {
      await notifyUser(responsibleId, {
        title: 'Prazo vence amanhã',
        message: `O prazo "${deadline.title}" do processo ${deadline.case.caseNumber} vence amanhã.`,
        type: 'PRAZO_AMANHA',
        link: '/prazos',
      });
      notificationsSent += 1;
    } else if (due.getTime() === in3Days.getTime()) {
      await notifyUser(responsibleId, {
        title: 'Prazo vence em 3 dias',
        message: `O prazo "${deadline.title}" do processo ${deadline.case.caseNumber} vence em 3 dias.`,
        type: 'PRAZO_3_DIAS',
        link: '/prazos',
      });
      notificationsSent += 1;
    }
  }

  // ---------- AUDIÊNCIAS ----------
  const upcomingHearings = await prisma.hearing.findMany({
    where: { status: 'AGENDADA', date: { gte: today, lt: in4Days } },
    include: { case: { select: { id: true, caseNumber: true, responsibleId: true } } },
  });

  for (const hearing of upcomingHearings) {
    const day = startOfDay(hearing.date);
    const responsibleId = hearing.case?.responsibleId;
    if (!responsibleId) continue;

    if (day.getTime() === today.getTime()) {
      await notifyUser(responsibleId, {
        title: 'Audiência hoje',
        message: `Audiência "${hearing.title}" do processo ${hearing.case.caseNumber} é hoje.`,
        type: 'AUDIENCIA_HOJE',
        link: '/agenda',
      });
      notificationsSent += 1;
    } else if (day.getTime() === tomorrow.getTime()) {
      await notifyUser(responsibleId, {
        title: 'Audiência amanhã',
        message: `Audiência "${hearing.title}" do processo ${hearing.case.caseNumber} é amanhã.`,
        type: 'AUDIENCIA_AMANHA',
        link: '/agenda',
      });
      notificationsSent += 1;
    }
  }

  // ---------- PROCESSOS PARADOS HÁ 30+ DIAS ----------
  const stalledThreshold = addDays(today, -30);
  const stalledCases = await prisma.case.findMany({
    where: { status: 'ATIVO', updatedAt: { lt: stalledThreshold } },
    select: { id: true, caseNumber: true, updatedAt: true },
  });

  for (const stalledCase of stalledCases) {
    const daysSinceUpdate = Math.floor((today.getTime() - stalledCase.updatedAt.getTime()) / (1000 * 60 * 60 * 24));
    await notifySocios({
      title: 'Processo parado',
      message: `O processo ${stalledCase.caseNumber} está sem movimentação há ${daysSinceUpdate} dias.`,
      type: 'PROCESSO_PARADO',
      link: `/processos`,
    });
    notificationsSent += 1;
  }

  // ---------- HONORÁRIOS EM ATRASO ----------
  const overdueFees = await prisma.fee.findMany({
    where: { status: 'PENDENTE', dueDate: { lt: today } },
  });

  if (overdueFees.length > 0) {
    await prisma.fee.updateMany({
      where: { id: { in: overdueFees.map((f) => f.id) } },
      data: { status: 'ATRASADO' },
    });

    await notifySocios({
      title: 'Honorários em atraso',
      message: `${overdueFees.length} honorário(s) venceram e ainda não foram pagos.`,
      type: 'HONORARIO_ATRASADO',
      link: '/honorarios',
    });
    notificationsSent += 1;
  }

  logger.info(`🔔 Verificação diária de notificações concluída — ${notificationsSent} notificação(ões) geradas`);
  return notificationsSent;
}
