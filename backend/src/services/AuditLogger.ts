import winston from 'winston';
import AuditLog from '../models/AuditLog';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
  ],
});

export class AuditLogger {
  static async log(userId: string, action: string, details: any, ipAddress?: string): Promise<void> {
    try {
      await AuditLog.create({
        userId,
        action,
        details,
        ipAddress,
      });

      logger.info({
        message: `AUDIT: ${action}`,
        userId,
        action,
        details,
        ipAddress,
      });
    } catch (error) {
      console.error('Failed to write audit log:', error);
    }
  }
}
