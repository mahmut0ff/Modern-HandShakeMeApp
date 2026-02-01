// Health checks service for various system components

import { DynamoDBClient, DescribeTableCommand } from '@aws-sdk/client-dynamodb';
import { S3Client, HeadBucketCommand, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { SNSClient, GetTopicAttributesCommand } from '@aws-sdk/client-sns';
import { SESClient, GetSendQuotaCommand } from '@aws-sdk/client-ses';
import { HealthStatus, HealthCheckConfig } from '../types/health';
import { HealthUtils } from '../utils/health';
import { logger } from '../utils/logger';

export class HealthChecksService {
  private dynamoClient: DynamoDBClient;
  private s3Client: S3Client;
  private snsClient: SNSClient;
  private sesClient: SESClient;
  private config: HealthCheckConfig;

  constructor(config?: HealthCheckConfig) {
    this.config = config || HealthUtils.getDefaultConfig();
    
    const region = process.env.AWS_REGION || 'us-east-1';
    this.dynamoClient = new DynamoDBClient({ region });
    this.s3Client = new S3Client({ region });
    this.snsClient = new SNSClient({ region });
    this.sesClient = new SESClient({ region });
  }

  /**
   * Check DynamoDB table health
   */
  async checkDatabase(): Promise<HealthStatus> {
    const startTime = Date.now();
    
    try {
      const tableName = process.env.DYNAMODB_TABLE_NAME;
      
      if (!tableName) {
        return {
          status: 'fail',
          message: 'DYNAMODB_TABLE_NAME environment variable not set',
          lastChecked: new Date().toISOString()
        };
      }

      const result = await HealthUtils.executeWithTimeout(
        async () => {
          const command = new DescribeTableCommand({ TableName: tableName });
          return await this.dynamoClient.send(command);
        },
        this.config.timeouts.database,
        'database'
      );

      const responseTime = Date.now() - startTime;
      const table = result.Table;

      if (!table) {
        return {
          status: 'fail',
          responseTime,
          message: `Table ${tableName} not found`,
          lastChecked: new Date().toISOString()
        };
      }

      const isActive = table.TableStatus === 'ACTIVE';
      const hasGSI = table.GlobalSecondaryIndexes?.every(gsi => gsi.IndexStatus === 'ACTIVE') ?? true;
      
      let status: 'pass' | 'warn' | 'fail' = 'pass';
      let message = `Table ${tableName} is ${table.TableStatus}`;

      if (!isActive) {
        status = 'fail';
        message += ' (not active)';
      } else if (!hasGSI) {
        status = 'warn';
        message += ' (GSI not ready)';
      } else if (responseTime > this.config.thresholds.responseTimeCritical) {
        status = 'fail';
        message += ' (slow response)';
      } else if (responseTime > this.config.thresholds.responseTimeWarning) {
        status = 'warn';
        message += ' (slow response)';
      }

      return {
        status,
        responseTime,
        message,
        lastChecked: new Date().toISOString(),
        details: {
          tableName,
          tableStatus: table.TableStatus,
          itemCount: table.ItemCount,
          tableSize: table.TableSizeBytes,
          gsiCount: table.GlobalSecondaryIndexes?.length || 0,
          provisionedThroughput: table.ProvisionedThroughput
        }
      };

    } catch (error: any) {
      const responseTime = Date.now() - startTime;
      
      return {
        status: 'fail',
        responseTime,
        message: `Database check failed: ${error.message}`,
        lastChecked: new Date().toISOString(),
        details: {
          errorCode: error.name,
          errorMessage: error.message
        }
      };
    }
  }

  /**
   * Check S3 storage health with actual read/write test
   */
  async checkStorage(): Promise<HealthStatus> {
    const startTime = Date.now();
    
    try {
      const bucketName = process.env.AWS_S3_BUCKET;
      
      if (!bucketName) {
        return {
          status: 'fail',
          message: 'AWS_S3_BUCKET environment variable not set',
          lastChecked: new Date().toISOString()
        };
      }

      await HealthUtils.executeWithTimeout(
        async () => {
          // 1. Check bucket accessibility
          const headCommand = new HeadBucketCommand({ Bucket: bucketName });
          await this.s3Client.send(headCommand);

          // 2. Test write operation
          const testKey = `health-check/${Date.now()}.txt`;
          const putCommand = new PutObjectCommand({
            Bucket: bucketName,
            Key: testKey,
            Body: 'health-check-test',
            ContentType: 'text/plain'
          });
          await this.s3Client.send(putCommand);

          // 3. Clean up test file
          const deleteCommand = new DeleteObjectCommand({
            Bucket: bucketName,
            Key: testKey
          });
          await this.s3Client.send(deleteCommand);
        },
        this.config.timeouts.storage,
        'storage'
      );

      const responseTime = Date.now() - startTime;
      
      let status: 'pass' | 'warn' | 'fail' = 'pass';
      let message = `S3 bucket ${bucketName} is accessible and writable`;

      if (responseTime > this.config.thresholds.responseTimeCritical) {
        status = 'fail';
        message += ' (slow response)';
      } else if (responseTime > this.config.thresholds.responseTimeWarning) {
        status = 'warn';
        message += ' (slow response)';
      }

      return {
        status,
        responseTime,
        message,
        lastChecked: new Date().toISOString(),
        details: {
          bucketName,
          region: process.env.AWS_REGION,
          testPerformed: 'read/write'
        }
      };

    } catch (error: any) {
      const responseTime = Date.now() - startTime;
      
      return {
        status: 'fail',
        responseTime,
        message: `Storage check failed: ${error.message}`,
        lastChecked: new Date().toISOString(),
        details: {
          errorCode: error.name,
          errorMessage: error.message
        }
      };
    }
  }

  /**
   * Check SNS notifications health
   */
  async checkNotifications(): Promise<HealthStatus> {
    const startTime = Date.now();
    
    try {
      const topicArn = process.env.SNS_PUSH_TOPIC_ARN;
      
      if (!topicArn) {
        return {
          status: 'warn', // Not critical for basic functionality
          message: 'SNS_PUSH_TOPIC_ARN environment variable not set',
          lastChecked: new Date().toISOString()
        };
      }

      if (!HealthUtils.isValidAwsArn(topicArn)) {
        return {
          status: 'fail',
          message: 'Invalid SNS topic ARN format',
          lastChecked: new Date().toISOString()
        };
      }

      await HealthUtils.executeWithTimeout(
        async () => {
          const command = new GetTopicAttributesCommand({ TopicArn: topicArn });
          return await this.snsClient.send(command);
        },
        this.config.timeouts.notifications,
        'notifications'
      );

      const responseTime = Date.now() - startTime;
      
      let status: 'pass' | 'warn' | 'fail' = 'pass';
      let message = 'SNS notifications service is accessible';

      if (responseTime > this.config.thresholds.responseTimeWarning) {
        status = 'warn';
        message += ' (slow response)';
      }

      return {
        status,
        responseTime,
        message,
        lastChecked: new Date().toISOString(),
        details: {
          topicArn,
          service: 'SNS'
        }
      };

    } catch (error: any) {
      const responseTime = Date.now() - startTime;
      
      return {
        status: 'warn', // SNS failure is not critical
        responseTime,
        message: `Notifications check failed: ${error.message}`,
        lastChecked: new Date().toISOString(),
        details: {
          errorCode: error.name,
          errorMessage: error.message
        }
      };
    }
  }

  /**
   * Check email service (SES) health
   */
  async checkEmailService(): Promise<HealthStatus> {
    const startTime = Date.now();
    
    try {
      const fromEmail = process.env.FROM_EMAIL;
      
      if (!fromEmail) {
        return {
          status: 'warn',
          message: 'FROM_EMAIL environment variable not set',
          lastChecked: new Date().toISOString()
        };
      }

      const result = await HealthUtils.executeWithTimeout(
        async () => {
          const command = new GetSendQuotaCommand({});
          return await this.sesClient.send(command);
        },
        this.config.timeouts.notifications,
        'email'
      );

      const responseTime = Date.now() - startTime;
      const quota = result.Max24HourSend || 0;
      const sent24h = result.SentLast24Hours || 0;
      const usagePercent = quota > 0 ? (sent24h / quota) * 100 : 0;
      
      let status: 'pass' | 'warn' | 'fail' = 'pass';
      let message = `SES email service accessible (${sent24h}/${quota} daily quota used)`;

      if (usagePercent > 90) {
        status = 'warn';
        message += ' (quota nearly exhausted)';
      }

      return {
        status,
        responseTime,
        message,
        lastChecked: new Date().toISOString(),
        details: {
          fromEmail,
          sendQuota: quota,
          sentLast24Hours: sent24h,
          usagePercent: Math.round(usagePercent),
          maxSendRate: result.MaxSendRate
        }
      };

    } catch (error: any) {
      const responseTime = Date.now() - startTime;
      
      return {
        status: 'warn',
        responseTime,
        message: `Email service check failed: ${error.message}`,
        lastChecked: new Date().toISOString(),
        details: {
          errorCode: error.name,
          errorMessage: error.message
        }
      };
    }
  }

  /**
   * Check Telegram Bot API health
   */
  async checkTelegramBot(): Promise<HealthStatus> {
    const startTime = Date.now();
    
    try {
      const botToken = process.env.TELEGRAM_BOT_TOKEN;
      
      if (!botToken) {
        return {
          status: 'warn',
          message: 'TELEGRAM_BOT_TOKEN environment variable not set',
          lastChecked: new Date().toISOString()
        };
      }

      // Simple check to Telegram Bot API
      const response: any = await HealthUtils.executeWithTimeout(
        async () => {
          const url = `https://api.telegram.org/bot${botToken}/getMe`;
          const response = await fetch(url);
          
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
          
          return await response.json();
        },
        this.config.timeouts.external,
        'telegram'
      );

      const responseTime = Date.now() - startTime;
      
      if (!response.ok) {
        return {
          status: 'fail',
          responseTime,
          message: `Telegram Bot API error: ${response.description}`,
          lastChecked: new Date().toISOString()
        };
      }

      return {
        status: 'pass',
        responseTime,
        message: `Telegram Bot API accessible (bot: ${response.result.username})`,
        lastChecked: new Date().toISOString(),
        details: {
          botUsername: response.result.username,
          botId: response.result.id,
          canJoinGroups: response.result.can_join_groups,
          canReadAllGroupMessages: response.result.can_read_all_group_messages
        }
      };

    } catch (error: any) {
      const responseTime = Date.now() - startTime;
      
      return {
        status: 'warn',
        responseTime,
        message: `Telegram Bot check failed: ${error.message}`,
        lastChecked: new Date().toISOString(),
        details: {
          errorMessage: error.message
        }
      };
    }
  }

  /**
   * Check Yandex Maps API health
   */
  async checkYandexMaps(): Promise<HealthStatus> {
    const startTime = Date.now();
    
    try {
      const apiKey = process.env.YANDEX_MAPS_API_KEY;
      
      if (!apiKey) {
        return {
          status: 'warn',
          message: 'YANDEX_MAPS_API_KEY environment variable not set',
          lastChecked: new Date().toISOString()
        };
      }

      // Simple geocoding request to test API
      const response: any = await HealthUtils.executeWithTimeout(
        async () => {
          const url = `https://geocode-maps.yandex.ru/1.x/?apikey=${apiKey}&geocode=Москва&format=json&results=1`;
          const response = await fetch(url);
          
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
          
          return await response.json();
        },
        this.config.timeouts.external,
        'yandexMaps'
      );

      const responseTime = Date.now() - startTime;
      
      const found = response.response?.GeoObjectCollection?.metaDataProperty?.GeocoderResponseMetaData?.found;
      
      if (found === undefined) {
        return {
          status: 'fail',
          responseTime,
          message: 'Yandex Maps API returned unexpected response format',
          lastChecked: new Date().toISOString()
        };
      }

      return {
        status: 'pass',
        responseTime,
        message: 'Yandex Maps API accessible',
        lastChecked: new Date().toISOString(),
        details: {
          testQuery: 'Москва',
          resultsFound: found
        }
      };

    } catch (error: any) {
      const responseTime = Date.now() - startTime;
      
      return {
        status: 'warn',
        responseTime,
        message: `Yandex Maps check failed: ${error.message}`,
        lastChecked: new Date().toISOString(),
        details: {
          errorMessage: error.message
        }
      };
    }
  }
}