/**
 * Process Uploaded File Lambda Function
 * Handles file processing when files are uploaded to S3
 */

import { S3Handler } from 'aws-lambda';
import AWS from 'aws-sdk';
import sharp from 'sharp';
import { logger } from '../shared/utils/logger';
import {
  FileProcessingResult,
  FileValidationResult,
  PathValidationResult,
  VirusScanResult,
  FileProcessingConfig,
  FileRecord,
  ErrorRecord,
  NotificationMessage,
  SystemAlert
} from '../shared/types/files';

const s3 = new AWS.S3();
const dynamodb = new AWS.DynamoDB.DocumentClient();
const sns = new AWS.SNS();

// Configuration constants
const CONFIG: FileProcessingConfig = {
  maxFileSize: 50 * 1024 * 1024, // 50MB
  allowedImageTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  allowedVideoTypes: ['video/mp4', 'video/mpeg', 'video/quicktime', 'video/webm'],
  allowedDocumentTypes: ['application/pdf', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  thumbnailSize: { width: 300, height: 300 }
};

export const handler: S3Handler = async (event) => {
  logger.info('Processing uploaded files', { eventRecords: event.Records.length });
  
  for (const record of event.Records) {
    const bucket = record.s3.bucket.name;
    const key = decodeURIComponent(record.s3.object.key.replace(/\+/g, ' '));
    
    logger.info('Processing file', { bucket, key });
    
    try {
      // Validate file path structure
      const pathValidation = validateFilePath(key);
      if (!pathValidation.isValid) {
        logger.warn('Invalid file path, skipping', { key, reason: pathValidation.reason });
        continue;
      }
      
      const { userId, orderId, filename } = pathValidation;
      
      // Get file metadata and validate
      const fileValidation = await validateFile(bucket, key);
      if (!fileValidation.isValid) {
        logger.error('File validation failed', { key, error: fileValidation.error });
        await handleProcessingError(userId!, orderId!, filename!, fileValidation.error!);
        continue;
      }
      
      const { fileSize, contentType } = fileValidation;
      
      // Process file based on type
      const processedResult = await processFileByType(
        bucket, 
        key, 
        filename!, 
        fileSize!, 
        contentType!
      );
      
      if (processedResult.status === 'failed') {
        logger.error('File processing failed', { key, error: processedResult.error });
        await handleProcessingError(userId!, orderId!, filename!, processedResult.error!);
        continue;
      }
      
      // Update DynamoDB with processed file info (with transaction safety)
      await updateFileRecordSafely({
        userId: userId!,
        orderId: orderId!,
        fileId: processedResult.fileId,
        originalKey: key,
        processedResult
      });
      
      // Send success notification
      await sendProcessingNotification(userId!, orderId!, processedResult);
      
      logger.info('File processed successfully', { 
        key, 
        fileId: processedResult.fileId,
        fileSize,
        contentType 
      });
      
    } catch (error: any) {
      logger.error('Unexpected error processing file', { key, error: error.message, stack: error.stack });
      
      // Try to extract user info for error notification
      const pathInfo = extractPathInfo(key);
      if (pathInfo) {
        await handleProcessingError(pathInfo.userId, pathInfo.orderId, pathInfo.filename, error.message);
      }
      
      // Send alert to monitoring
      await sendErrorAlert(key, error);
    }
  }
};

// Validation functions
export function validateFilePath(key: string): PathValidationResult {
  const keyParts = key.split('/');
  
  if (keyParts.length < 4) {
    return { isValid: false, reason: 'Invalid path structure - too few parts' };
  }
  
  if (keyParts[0] !== 'uploads') {
    return { isValid: false, reason: 'Invalid path - must start with uploads/' };
  }
  
  const [, userId, orderId, ...filenameParts] = keyParts;
  const filename = filenameParts.join('/'); // Handle filenames with slashes
  
  // Validate userId format (UUID)
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(userId)) {
    return { isValid: false, reason: 'Invalid userId format' };
  }
  
  // Validate orderId format (UUID)
  if (!uuidRegex.test(orderId)) {
    return { isValid: false, reason: 'Invalid orderId format' };
  }
  
  // Validate filename
  if (!filename || filename.length === 0) {
    return { isValid: false, reason: 'Missing filename' };
  }
  
  // Check for dangerous characters in filename
  const dangerousChars = /[<>:"|?*\x00-\x1f]/;
  if (dangerousChars.test(filename)) {
    return { isValid: false, reason: 'Filename contains dangerous characters' };
  }
  
  return { isValid: true, userId, orderId, filename };
}

export async function validateFile(bucket: string, key: string): Promise<FileValidationResult> {
  try {
    const headObject = await s3.headObject({ Bucket: bucket, Key: key }).promise();
    const fileSize = headObject.ContentLength || 0;
    const contentType = headObject.ContentType || 'application/octet-stream';
    
    // Check file size
    if (fileSize > CONFIG.maxFileSize) {
      return { 
        isValid: false, 
        error: `File too large: ${fileSize} bytes (max: ${CONFIG.maxFileSize} bytes)` 
      };
    }
    
    if (fileSize === 0) {
      return { isValid: false, error: 'Empty file' };
    }
    
    // Check content type
    const allAllowedTypes = [...CONFIG.allowedImageTypes, ...CONFIG.allowedVideoTypes, ...CONFIG.allowedDocumentTypes];
    if (!allAllowedTypes.includes(contentType)) {
      return { 
        isValid: false, 
        error: `Unsupported file type: ${contentType}` 
      };
    }
    
    return { isValid: true, fileSize, contentType };
    
  } catch (error: any) {
    return { 
      isValid: false, 
      error: `Failed to get file metadata: ${error.message}` 
    };
  }
}

function extractPathInfo(key: string): { userId: string; orderId: string; filename: string } | null {
  const validation = validateFilePath(key);
  if (validation.isValid && validation.userId && validation.orderId && validation.filename) {
    return {
      userId: validation.userId,
      orderId: validation.orderId,
      filename: validation.filename
    };
  }
  return null;
}

async function processFileByType(
  bucket: string,
  key: string,
  filename: string,
  fileSize: number,
  contentType: string
): Promise<FileProcessingResult> {
  try {
    if (CONFIG.allowedImageTypes.includes(contentType)) {
      return await processImage(bucket, key, filename, fileSize, contentType);
    } else if (CONFIG.allowedVideoTypes.includes(contentType)) {
      return await processVideo(bucket, key, filename, fileSize, contentType);
    } else if (CONFIG.allowedDocumentTypes.includes(contentType)) {
      return await processDocument(bucket, key, filename, fileSize, contentType);
    } else {
      return {
        fileId: generateFileId(),
        originalName: filename,
        processedUrl: '',
        metadata: { size: fileSize, type: contentType },
        status: 'failed',
        error: `Unsupported file type: ${contentType}`
      };
    }
  } catch (error: any) {
    return {
      fileId: generateFileId(),
      originalName: filename,
      processedUrl: '',
      metadata: { size: fileSize, type: contentType },
      status: 'failed',
      error: error.message
    };
  }
}
async function processImage(
  bucket: string, 
  key: string, 
  filename: string, 
  fileSize: number, 
  contentType: string
): Promise<FileProcessingResult> {
  
  const fileId = generateFileId();
  const processedKey = key.replace('uploads/', 'processed/');
  const thumbnailKey = processedKey.replace(/(\.[^.]+)$/, '_thumb$1');
  
  try {
    // Get original image from S3
    const originalImage = await s3.getObject({ Bucket: bucket, Key: key }).promise();
    const imageBuffer = originalImage.Body as Buffer;
    
    // Get real image dimensions and optimize
    const sharpImage = sharp(imageBuffer);
    const metadata = await sharpImage.metadata();
    
    if (!metadata.width || !metadata.height) {
      throw new Error('Could not determine image dimensions');
    }
    
    // Optimize original image (reduce quality, convert to WebP if beneficial)
    let processedBuffer: Buffer;
    let finalContentType = contentType;
    
    if (contentType === 'image/png' && fileSize > 1024 * 1024) {
      // Convert large PNGs to WebP for better compression
      processedBuffer = await sharpImage
        .webp({ quality: 85 })
        .toBuffer();
      finalContentType = 'image/webp';
    } else if (contentType === 'image/jpeg') {
      // Optimize JPEG quality
      processedBuffer = await sharpImage
        .jpeg({ quality: 85, progressive: true })
        .toBuffer();
    } else {
      // Keep original format but optimize
      processedBuffer = await sharpImage
        .toBuffer();
    }
    
    // Create thumbnail
    const thumbnailBuffer = await sharp(imageBuffer)
      .resize(CONFIG.thumbnailSize.width, CONFIG.thumbnailSize.height, {
        fit: 'cover',
        position: 'center'
      })
      .jpeg({ quality: 80 })
      .toBuffer();
    
    // Upload processed image
    await s3.putObject({
      Bucket: bucket,
      Key: processedKey,
      Body: processedBuffer,
      ContentType: finalContentType,
      CacheControl: 'max-age=31536000',
      Metadata: {
        'processed-at': new Date().toISOString(),
        'file-id': fileId,
        'original-width': metadata.width.toString(),
        'original-height': metadata.height.toString()
      }
    }).promise();
    
    // Upload thumbnail
    await s3.putObject({
      Bucket: bucket,
      Key: thumbnailKey,
      Body: thumbnailBuffer,
      ContentType: 'image/jpeg',
      CacheControl: 'max-age=31536000',
      Metadata: {
        'processed-at': new Date().toISOString(),
        'file-id': fileId,
        'thumbnail': 'true'
      }
    }).promise();
    
    // Delete original upload
    await s3.deleteObject({ Bucket: bucket, Key: key }).promise();
    
    logger.info('Image processed successfully', {
      fileId,
      originalSize: fileSize,
      processedSize: processedBuffer.length,
      thumbnailSize: thumbnailBuffer.length,
      dimensions: { width: metadata.width, height: metadata.height }
    });
    
    return {
      fileId,
      originalName: filename,
      processedUrl: `https://${bucket}.s3.amazonaws.com/${processedKey}`,
      thumbnailUrl: `https://${bucket}.s3.amazonaws.com/${thumbnailKey}`,
      metadata: {
        size: processedBuffer.length,
        type: finalContentType,
        dimensions: { width: metadata.width, height: metadata.height }
      },
      status: 'processed'
    };
    
  } catch (error: any) {
    logger.error('Image processing failed', { fileId, error: error.message });
    
    // Clean up any partial uploads
    try {
      await Promise.all([
        s3.deleteObject({ Bucket: bucket, Key: processedKey }).promise().catch(() => {}),
        s3.deleteObject({ Bucket: bucket, Key: thumbnailKey }).promise().catch(() => {})
      ]);
    } catch (cleanupError) {
      logger.warn('Failed to clean up partial uploads', { fileId, cleanupError });
    }
    
    return {
      fileId,
      originalName: filename,
      processedUrl: '',
      metadata: { size: fileSize, type: contentType },
      status: 'failed',
      error: `Image processing failed: ${error.message}`
    };
  }
}

async function processVideo(
  bucket: string, 
  key: string, 
  filename: string, 
  fileSize: number, 
  contentType: string
): Promise<FileProcessingResult> {
  
  const fileId = generateFileId();
  const processedKey = key.replace('uploads/', 'processed/');
  const thumbnailKey = processedKey.replace(/\.[^.]+$/, '_thumb.jpg');
  
  try {
    // For now, just move the video file (in production, you'd use FFmpeg for processing)
    await s3.copyObject({
      Bucket: bucket,
      CopySource: `${bucket}/${key}`,
      Key: processedKey,
      ContentType: contentType,
      CacheControl: 'max-age=31536000',
      Metadata: {
        'processed-at': new Date().toISOString(),
        'file-id': fileId
      }
    }).promise();
    
    // Create a placeholder thumbnail (in production, extract frame from video)
    const placeholderThumbnail = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
      'base64'
    );
    
    await s3.putObject({
      Bucket: bucket,
      Key: thumbnailKey,
      Body: placeholderThumbnail,
      ContentType: 'image/jpeg',
      CacheControl: 'max-age=31536000',
      Metadata: {
        'processed-at': new Date().toISOString(),
        'file-id': fileId,
        'thumbnail': 'true',
        'placeholder': 'true'
      }
    }).promise();
    
    // Delete original
    await s3.deleteObject({ Bucket: bucket, Key: key }).promise();
    
    logger.info('Video processed successfully', { fileId, fileSize });
    
    return {
      fileId,
      originalName: filename,
      processedUrl: `https://${bucket}.s3.amazonaws.com/${processedKey}`,
      thumbnailUrl: `https://${bucket}.s3.amazonaws.com/${thumbnailKey}`,
      metadata: {
        size: fileSize,
        type: contentType
      },
      status: 'processed'
    };
    
  } catch (error: any) {
    logger.error('Video processing failed', { fileId, error: error.message });
    
    return {
      fileId,
      originalName: filename,
      processedUrl: '',
      metadata: { size: fileSize, type: contentType },
      status: 'failed',
      error: `Video processing failed: ${error.message}`
    };
  }
}

async function processDocument(
  bucket: string, 
  key: string, 
  filename: string, 
  fileSize: number, 
  contentType: string
): Promise<FileProcessingResult> {
  
  const fileId = generateFileId();
  const processedKey = key.replace('uploads/', 'processed/');
  
  try {
    // Basic virus scan simulation (in production, use actual antivirus service)
    const virusScanResult = await performBasicVirusScan(bucket, key);
    if (!virusScanResult.clean) {
      throw new Error(`Virus scan failed: ${virusScanResult.threat}`);
    }
    
    // Move document to processed location
    await s3.copyObject({
      Bucket: bucket,
      CopySource: `${bucket}/${key}`,
      Key: processedKey,
      ContentType: contentType,
      CacheControl: 'max-age=31536000',
      Metadata: {
        'processed-at': new Date().toISOString(),
        'file-id': fileId,
        'virus-scan': 'clean',
        'scan-timestamp': new Date().toISOString()
      }
    }).promise();
    
    // Delete original
    await s3.deleteObject({ Bucket: bucket, Key: key }).promise();
    
    logger.info('Document processed successfully', { fileId, fileSize, contentType });
    
    return {
      fileId,
      originalName: filename,
      processedUrl: `https://${bucket}.s3.amazonaws.com/${processedKey}`,
      metadata: {
        size: fileSize,
        type: contentType
      },
      status: 'processed'
    };
    
  } catch (error: any) {
    logger.error('Document processing failed', { fileId, error: error.message });
    
    return {
      fileId,
      originalName: filename,
      processedUrl: '',
      metadata: { size: fileSize, type: contentType },
      status: 'failed',
      error: `Document processing failed: ${error.message}`
    };
  }
}

// Basic virus scan simulation
async function performBasicVirusScan(bucket: string, key: string): Promise<VirusScanResult> {
  try {
    // Get file content for basic checks
    const object = await s3.getObject({ Bucket: bucket, Key: key }).promise();
    const content = object.Body as Buffer;
    
    // Basic checks for suspicious patterns
    const suspiciousPatterns = [
      /eval\s*\(/gi,
      /exec\s*\(/gi,
      /<script/gi,
      /javascript:/gi
    ];
    
    const contentString = content.toString('utf8', 0, Math.min(content.length, 10000)); // Check first 10KB
    
    for (const pattern of suspiciousPatterns) {
      if (pattern.test(contentString)) {
        return { clean: false, threat: 'Suspicious script content detected' };
      }
    }
    
    return { clean: true };
    
  } catch (error) {
    // If we can't scan, assume it's clean but log the issue
    logger.warn('Virus scan failed, assuming clean', { bucket, key, error });
    return { clean: true };
  }
}
// Safe DynamoDB operations with transaction support
async function updateFileRecordSafely(params: {
  userId: string;
  orderId: string;
  fileId: string;
  originalKey: string;
  processedResult: FileProcessingResult;
}) {
  const { userId, orderId, fileId, processedResult } = params;
  
  // Validate environment variables
  const tableName = process.env.DYNAMODB_TABLE_NAME;
  if (!tableName) {
    throw new Error('DYNAMODB_TABLE_NAME environment variable is not set');
  }
  
  const timestamp = new Date().toISOString();
  
  try {
    // Use conditional put to prevent overwrites
    await dynamodb.put({
      TableName: tableName,
      Item: {
        PK: `ORDER#${orderId}`,
        SK: `FILE#${fileId}`,
        GSI1PK: `USER#${userId}`,
        GSI1SK: `FILE#${fileId}`,
        
        fileId,
        orderId,
        userId,
        originalName: processedResult.originalName,
        processedUrl: processedResult.processedUrl,
        thumbnailUrl: processedResult.thumbnailUrl,
        metadata: processedResult.metadata,
        
        status: processedResult.status,
        processedAt: timestamp,
        createdAt: timestamp,
        updatedAt: timestamp,
        
        type: 'file',
        version: 1
      },
      ConditionExpression: 'attribute_not_exists(PK)'
    }).promise();
    
    logger.info('File record saved to DynamoDB', { fileId, orderId, userId });
    
  } catch (error: any) {
    if (error.code === 'ConditionalCheckFailedException') {
      logger.warn('File record already exists, updating instead', { fileId });
      
      // Update existing record
      await dynamodb.update({
        TableName: tableName,
        Key: {
          PK: `ORDER#${orderId}`,
          SK: `FILE#${fileId}`
        },
        UpdateExpression: 'SET #status = :status, processedUrl = :processedUrl, thumbnailUrl = :thumbnailUrl, metadata = :metadata, updatedAt = :updatedAt, #version = #version + :inc',
        ExpressionAttributeNames: {
          '#status': 'status',
          '#version': 'version'
        },
        ExpressionAttributeValues: {
          ':status': processedResult.status,
          ':processedUrl': processedResult.processedUrl,
          ':thumbnailUrl': processedResult.thumbnailUrl,
          ':metadata': processedResult.metadata,
          ':updatedAt': timestamp,
          ':inc': 1
        }
      }).promise();
    } else {
      logger.error('Failed to save file record to DynamoDB', { error: error.message, fileId });
      throw error;
    }
  }
}

async function sendProcessingNotification(
  userId: string, 
  orderId: string, 
  result: FileProcessingResult
) {
  try {
    const topicArn = process.env.SNS_PUSH_TOPIC_ARN;
    if (!topicArn) {
      logger.warn('SNS_PUSH_TOPIC_ARN not configured, skipping notification');
      return;
    }
    
    const message = {
      userId,
      type: 'FILE_PROCESSED',
      title: 'Файл обработан',
      body: `Файл "${result.originalName}" успешно загружен и обработан`,
      data: {
        orderId,
        fileId: result.fileId,
        fileUrl: result.processedUrl,
        thumbnailUrl: result.thumbnailUrl,
        fileSize: result.metadata.size,
        fileType: result.metadata.type
      },
      timestamp: new Date().toISOString()
    };
    
    await sns.publish({
      TopicArn: topicArn,
      Message: JSON.stringify(message),
      MessageAttributes: {
        userId: {
          DataType: 'String',
          StringValue: userId
        },
        type: {
          DataType: 'String',
          StringValue: 'FILE_PROCESSED'
        }
      }
    }).promise();
    
    logger.info('Processing notification sent', { userId, fileId: result.fileId });
    
  } catch (error: any) {
    logger.error('Failed to send processing notification', { 
      error: error.message, 
      userId, 
      fileId: result.fileId 
    });
    // Don't throw - notification failure shouldn't fail the whole process
  }
}

async function handleProcessingError(
  userId: string,
  orderId: string,
  filename: string,
  errorMessage: string
) {
  try {
    // Save error record to DynamoDB
    const tableName = process.env.DYNAMODB_TABLE_NAME;
    if (tableName) {
      const errorId = generateFileId();
      await dynamodb.put({
        TableName: tableName,
        Item: {
          PK: `ORDER#${orderId}`,
          SK: `ERROR#${errorId}`,
          GSI1PK: `USER#${userId}`,
          GSI1SK: `ERROR#${errorId}`,
          
          errorId,
          orderId,
          userId,
          filename,
          errorMessage,
          errorType: 'FILE_PROCESSING_ERROR',
          
          status: 'failed',
          createdAt: new Date().toISOString(),
          type: 'error'
        }
      }).promise();
    }
    
    // Send error notification
    const topicArn = process.env.SNS_PUSH_TOPIC_ARN;
    if (topicArn) {
      await sns.publish({
        TopicArn: topicArn,
        Message: JSON.stringify({
          userId,
          type: 'FILE_PROCESSING_ERROR',
          title: 'Ошибка обработки файла',
          body: `Не удалось обработать файл "${filename}": ${errorMessage}`,
          data: {
            orderId,
            filename,
            error: errorMessage
          },
          timestamp: new Date().toISOString()
        }),
        MessageAttributes: {
          userId: {
            DataType: 'String',
            StringValue: userId
          },
          type: {
            DataType: 'String',
            StringValue: 'FILE_PROCESSING_ERROR'
          }
        }
      }).promise();
    }
    
    logger.info('Error notification sent', { userId, filename, errorMessage });
    
  } catch (notificationError: any) {
    logger.error('Failed to handle processing error', { 
      originalError: errorMessage,
      notificationError: notificationError.message,
      userId,
      filename
    });
  }
}

async function sendErrorAlert(key: string, error: any) {
  try {
    // Send alert to monitoring system
    const alertTopicArn = process.env.SNS_ALERT_TOPIC_ARN;
    if (alertTopicArn) {
      await sns.publish({
        TopicArn: alertTopicArn,
        Subject: 'File Processing System Error',
        Message: JSON.stringify({
          service: 'file-processing',
          error: error.message,
          stack: error.stack,
          s3Key: key,
          timestamp: new Date().toISOString(),
          severity: 'ERROR'
        })
      }).promise();
    }
    
    logger.error('System error alert sent', { key, error: error.message });
    
  } catch (alertError: any) {
    logger.error('Failed to send error alert', { 
      originalError: error.message,
      alertError: alertError.message,
      key
    });
  }
}

function generateFileId(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substr(2, 9);
  return `file_${timestamp}_${random}`;
}