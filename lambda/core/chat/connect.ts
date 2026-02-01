// WebSocket connection handler

import type { APIGatewayProxyWebsocketEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { handleConnect } from './websocket-handler';

export const handler = handleConnect;
