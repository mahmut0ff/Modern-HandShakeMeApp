// WebSocket message handler

import type { APIGatewayProxyWebsocketEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { handleMessage } from './websocket-handler';

export const handler = handleMessage;
