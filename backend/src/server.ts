import app from './app';
import dotenv from 'dotenv';
import cron from 'node-cron';
import { logger } from './utils/logger';
import { runDailyNotificationChecks } from './jobs/notificationScheduler';

dotenv.config();


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

