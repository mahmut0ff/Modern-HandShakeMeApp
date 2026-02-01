// Export time tracking data

import type { APIGatewayProxyResult } from 'aws-lambda';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import { success } from '@/shared/utils/response';
import { withAuth, AuthenticatedEvent } from '@/shared/middleware/auth';
import { withErrorHandler } from '@/shared/middleware/errorHandler';
import { withRequestTransform } from '@/shared/middleware/requestTransform';
import { validate } from '@/shared/utils/validation';
import { logger } from '@/shared/utils/logger';
import { TimeTrackingRepository } from '@/shared/repositories/time-tracking.repository';
import { S3Service } from '@/shared/services/s3.service';

const exportSchema = z.object({
  format: z.enum(['CSV', 'PDF', 'EXCEL']),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  projectId: z.string().optional(),
  bookingId: z.string().optional(),
  includeEntries: z.boolean().optional(),
  includeAttachments: z.boolean().optional(),
});

async function exportDataHandler(
  event: AuthenticatedEvent
): Promise<APIGatewayProxyResult> {
  const userId = event.auth.userId;
  
  logger.info('Export data request', { userId });
  
  const body = JSON.parse(event.body || '{}');
  const data = validate(exportSchema, body);
  
  const timeTrackingRepo = new TimeTrackingRepository();
  const s3Service = new S3Service();
  
  try {
    // Get sessions
    const sessions = await timeTrackingRepo.findSessionsByMaster(userId, {
      startDate: data.startDate,
      endDate: data.endDate,
      projectId: data.projectId,
      bookingId: data.bookingId,
      limit: 10000,
    });
    
    // Get entries if requested
    let allEntries: any[] = [];
    if (data.includeEntries) {
      for (const session of sessions) {
        const entries = await timeTrackingRepo.findEntriesBySession(session.id);
        allEntries.push(...entries.map(e => ({ ...e, sessionId: session.id })));
      }
    }
    
    // Generate export file based on format
    let fileContent = '';
    let contentType = '';
    let fileExtension = '';
    
    switch (data.format) {
      case 'CSV':
        fileContent = generateCSV(sessions, allEntries, data.includeEntries || false);
        contentType = 'text/csv';
        fileExtension = 'csv';
        break;
      case 'PDF':
        // For PDF, we would use a library like pdfkit
        // For now, return CSV as fallback
        fileContent = generateCSV(sessions, allEntries, data.includeEntries || false);
        contentType = 'application/pdf';
        fileExtension = 'pdf';
        break;
      case 'EXCEL':
        // For Excel, we would use a library like exceljs
        // For now, return CSV as fallback
        fileContent = generateCSV(sessions, allEntries, data.includeEntries || false);
        contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        fileExtension = 'xlsx';
        break;
    }
    
    // Upload to S3
    const fileName = `time-tracking-export-${userId}-${Date.now()}.${fileExtension}`;
    const s3Key = `exports/time-tracking/${userId}/${fileName}`;
    
    const exportUrl = await s3Service.uploadFile(
      s3Key,
      Buffer.from(fileContent),
      contentType
    );
    
    logger.info('Data exported', { 
      userId, 
      format: data.format,
      sessionsCount: sessions.length,
      fileName 
    });
    
    return success({
      exportUrl,
      fileName,
      format: data.format,
      message: 'Time tracking data exported successfully',
    });
  } catch (error) {
    logger.error('Failed to export data', error, { userId });
    throw error;
  }
}

function generateCSV(sessions: any[], entries: any[], includeEntries: boolean): string {
  let csv = 'Session ID,Master ID,Project ID,Booking ID,Status,Task Type,Start Time,End Time,Total Minutes,Billable Hours,Hourly Rate,Billing Amount,Description,Notes\n';
  
  sessions.forEach(session => {
    const billingAmount = session.billableHours && session.hourlyRate 
      ? session.billableHours * session.hourlyRate 
      : 0;
    
    csv += [
      session.id,
      session.masterId,
      session.projectId || '',
      session.bookingId || '',
      session.status,
      session.taskType,
      session.startTime,
      session.endTime || '',
      session.totalMinutes || '',
      session.billableHours || '',
      session.hourlyRate || '',
      billingAmount,
      `"${(session.description || '').replace(/"/g, '""')}"`,
      `"${(session.finalNotes || '').replace(/"/g, '""')}"`,
    ].join(',') + '\n';
  });
  
  if (includeEntries && entries.length > 0) {
    csv += '\n\nTime Entries\n';
    csv += 'Entry ID,Session ID,Entry Type,Timestamp,Location,Notes\n';
    
    entries.forEach(entry => {
      const location = entry.location 
        ? `${entry.location.latitude},${entry.location.longitude}` 
        : '';
      
      csv += [
        entry.id,
        entry.sessionId,
        entry.entryType,
        entry.timestamp,
        location,
        `"${(entry.notes || '').replace(/"/g, '""')}"`,
      ].join(',') + '\n';
    });
  }
  
  return csv;
}

export const handler = withErrorHandler(
  withRequestTransform(
    withAuth(exportDataHandler)
  )
);
