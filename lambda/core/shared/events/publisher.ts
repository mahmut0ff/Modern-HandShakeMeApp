// EventBridge event publisher

import { EventBridgeClient, PutEventsCommand } from '@aws-sdk/client-eventbridge';
import { logger } from '../utils/logger';
import type { DomainEvent, EventType } from '../types';

const eventBridge = new EventBridgeClient({
  region: process.env.AWS_REGION || 'us-east-1',
});

const EVENT_BUS_NAME = process.env.EVENT_BUS_NAME || 'default';

export async function publishEvent<T>(
  type: EventType,
  userId: string,
  data: T,
  metadata?: Record<string, unknown>
): Promise<void> {
  const event: DomainEvent<T> = {
    type,
    timestamp: new Date().toISOString(),
    userId,
    data,
    metadata,
  };

  try {
    const command = new PutEventsCommand({
      Entries: [
        {
          Source: 'handshakeme.app',
          DetailType: type,
          Detail: JSON.stringify(event),
          EventBusName: EVENT_BUS_NAME,
        },
      ],
    });

    const response = await eventBridge.send(command);

    if (response.FailedEntryCount && response.FailedEntryCount > 0) {
      logger.error('Failed to publish event', undefined, {
        type,
        userId,
        failures: response.Entries,
      });
      throw new Error('Failed to publish event');
    }

    logger.info('Event published', { type, userId });
  } catch (error) {
    logger.error('Error publishing event', error, { type, userId });
    throw error;
  }
}
