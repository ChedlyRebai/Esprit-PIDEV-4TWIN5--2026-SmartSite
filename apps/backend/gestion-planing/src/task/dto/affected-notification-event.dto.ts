export interface AffectedNotificationEventDto {
  title: string;
  message: string;
  recipients: string[];
  priority?: 'LOW' | 'MEDIUM' | 'HIGH';
  type?: 'INFO' | 'WARNING' | 'CRITICAL' | 'SUCCESS';
  source: string;
  taskId: string;
}
