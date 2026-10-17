import { afterEach, describe, expect, it, vi } from 'vitest';
import { EventsGateway } from '../campaigns.gateway';

const createClient = ({ user, cookie }: { user?: { id: number; name: string; email: string } | null; cookie?: string }) => {
  const client = {
    data: {} as Record<string, unknown>,
    disconnect: vi.fn(),
    handshake: { auth: { campaignId: 5, tenantId: 3 }, headers: { cookie } },
    join: vi.fn().mockResolvedValue(undefined),
    leave: vi.fn().mockResolvedValue(undefined),
  };
  const fetchSockets = vi.fn().mockResolvedValue(user ? [{ data: { user: { id: user.id, name: user.name } } }] : []);
  const emit = vi.fn();
  const gateway = new EventsGateway({ getUserFromToken: vi.fn().mockResolvedValue(user) } as never);
  gateway.server = {
    in: vi.fn(() => ({ fetchSockets })),
    to: vi.fn(() => ({ emit })),
  } as never;

  return { client, emit, fetchSockets, gateway, user };
};

describe('EventsGateway', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('creates a room id from tenant and campaign identifiers', () => {
    const { gateway } = createClient({ user: null });

    expect(gateway.getRoomId({ campaignId: 5, tenantId: 3 })).toBe('tenantId:3-campaignId:5');
  });

  it('disconnects clients with invalid sessions', async () => {
    const { client, gateway, fetchSockets } = createClient({ user: null });

    await gateway.handleConnection(client as never);

    expect(client.disconnect).toHaveBeenCalledWith(true);
    expect(client.join).not.toHaveBeenCalled();
    expect(fetchSockets).not.toHaveBeenCalled();
  });

  it('joins authenticated users and broadcasts the updated room membership', async () => {
    const user = { email: 'ada@example.test', id: 7, name: 'Ada' };
    const { client, emit, fetchSockets, gateway } = createClient({ cookie: 'accessToken=valid-token', user });

    await gateway.handleConnection(client as never);

    expect(client.data.user).toEqual({ email: user.email, id: user.id, name: user.name });
    expect(client.join).toHaveBeenCalledWith('tenantId:3-campaignId:5');
    expect(fetchSockets).toHaveBeenCalledOnce();
    expect(emit).toHaveBeenCalledWith('update-users-watching-campaign', [{ id: user.id, name: user.name }]);
  });

  it('broadcasts campaign updates and refreshes room membership on disconnect', async () => {
    const user = { email: 'ada@example.test', id: 7, name: 'Ada' };
    const { client, emit, gateway } = createClient({ cookie: '', user });
    client.data.user = { email: user.email, id: user.id, name: user.name };

    await gateway.handleCampaignMessage({ campaignId: 5, tenantId: 3, user } as never, client as never);
    expect(emit).toHaveBeenCalledWith('user-updated-campaign', client.data.user);

    emit.mockClear();
    await gateway.handleDisconnect(client as never);

    expect(client.leave).toHaveBeenCalledWith('tenantId:3-campaignId:5');
    expect(emit).toHaveBeenCalledWith('update-users-watching-campaign', [{ id: user.id, name: user.name }]);
  });
});
