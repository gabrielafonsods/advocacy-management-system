import app from './app';
import dotenv from 'dotenv';
import cron from 'node-cron';
import { logger } from './utils/logger';
import { runDailyNotificationChecks } from './jobs/notificationScheduler';

dotenv.config();

// Aviso de segurança: segredos JWT curtos são mais fáceis de quebrar por
// força bruta. Recomenda-se 32+ caracteres aleatórios em produção.
['JWT_SECRET', 'JWT_REFRESH_SECRET'].forEach((key) => {
  const value = process.env[key];
  if (!value || value.length < 32) {
    logger.warn(
      `⚠️  ${key} tem menos de 32 caracteres — recomendado usar uma chave mais longa e aleatória em produção.`
    );
  }
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  logger.info(`🚀 Server running on port ${PORT}`);
  logger.info(`📝 Environment: ${process.env.NODE_ENV}`);
});

// Verificação diária de prazos, audiências, processos parados e honorários
// em atraso — roda todo dia às 07:00 (horário do servidor).
cron.schedule('0 7 * * *', () => {
  runDailyNotificationChecks().catch((error) => {
    logger.error('Erro ao rodar verificação diária de notificações:', error);
  });
});

export default app;

