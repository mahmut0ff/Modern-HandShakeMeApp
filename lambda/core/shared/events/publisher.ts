// EventBridge event publisher

import { logger } from '../utils/logger';
import type { DomainEvent, EventType } from '../types';

// Lazy load EventBridge client to avoid import errors if not needed
let eventBridgeClient: any = null;
let PutEventsCommandClass: any = null;

async function getEventBridgeClient() {
  if (!eventBridgeClient) {
    try {
      // @ts-ignore - @aws-sdk/client-eventbridge is an optional dependency
      const eventBridgeModule = await import('@aws-sdk/client-eventbridge');
      const { EventBridgeClient, PutEventsCommand } = eventBridgeModule;
      PutEventsCommandClass = PutEventsCommand;
      eventBridgeClient = new EventBridgeClient({
        region: process.env.AWS_REGION || 'us-east-1',
      });
    } catch (error) {
      logger.warn('EventBridge client not available, events will be logged only');
      return null;
    }
  }
  return eventBridgeClient;
}

const EVENT_BUS_NAME = process.env.EVENT_BUS_NAME || 'default';

export class EventPublisher {
  static async publish<T>(
    type: EventType,
    userId: string,
    data: T,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    return publishEvent(type, userId, data, metadata);
  }
}

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
    const client = await getEventBridgeClient();
    
    if (!client || !PutEventsCommandClass) {
      // Log event if EventBridge is not available
      logger.info('Event (local)', { type, userId, data });
      return;
    }

    const command = new PutEventsCommandClass({
      Entries: [
        {
          Source: 'handshakeme.app',
          DetailType: type,
          Detail: JSON.stringify(event),
          EventBusName: EVENT_BUS_NAME,
        },
      ],
    });

    const response = await client.send(command);

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
    // Don't throw - event publishing should not break the main flow
  }
}
