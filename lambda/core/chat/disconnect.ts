// WebSocket disconnection handler

import type { APIGatewayProxyWebsocketEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { handleDisconnect } from './websocket-handler';

export const handler = handleDisconnect;
