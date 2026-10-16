import { ConnectedSocket, MessageBody, OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import * as cookie from 'cookie';
import { Server, Socket } from 'socket.io';
import { AuthService } from '../services/auth.service';

@WebSocketGateway({
  cors: { origin: '*' },
  namespace: '/gateways/campaigns',
})
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  constructor(private readonly authService: AuthService) {}

  @WebSocketServer()
  server!: Server;

  getRoomId({ tenantId, campaignId }: { tenantId: number; campaignId: number }) {
    return `tenantId:${tenantId}-campaignId:${campaignId}`;
  }

  async handleConnection(client: Socket) {
    const { tenantId, campaignId } = client.handshake.auth;

    const cookies = cookie.parse(client.handshake.headers.cookie || '');
    const user = await this.authService.getUserFromToken(cookies);
    if (!user) {
      client.disconnect(true);
      return;
    }

    client.data.user = {
      email: user.email,
      id: user.id,
      name: user.name,
    };

    const roomId = this.getRoomId({ campaignId, tenantId });
    await client.join(roomId);
    const sockets = await this.server.in(roomId).fetchSockets();

    const users = sockets.map((s) => ({
      id: s.data.user.id,
      name: s.data.user.name,
    }));

    this.server.to(roomId).emit('update-users-watching-campaign', users);
  }

  @SubscribeMessage('user-updated-campaign')
  async handleCampaignMessage(
    @MessageBody()
    payload: { tenantId: number; campaignId: number; user: { id: string; name: string; email: string } },
    @ConnectedSocket() client: Socket,
  ) {
    const user = client.data.user;
    const { tenantId, campaignId } = payload;
    const roomId = this.getRoomId({ campaignId, tenantId });
    this.server.to(roomId).emit('user-updated-campaign', user);
  }

  async handleDisconnect(client: Socket) {
    const { tenantId, campaignId } = client.handshake.auth;
    const roomId = this.getRoomId({ campaignId, tenantId });
    await client.leave(roomId);

    const sockets = await this.server.in(roomId).fetchSockets();

    const users = sockets.map((s) => ({
      id: s.data.user.id,
      name: s.data.user.name,
    }));

    this.server.to(roomId).emit('update-users-watching-campaign', users);
  }
}
