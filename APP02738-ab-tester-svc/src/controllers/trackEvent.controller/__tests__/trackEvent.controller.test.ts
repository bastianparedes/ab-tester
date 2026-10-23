import { ForbiddenException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import { TrackEventController } from '../index';

describe('TrackEventController', () => {
  it('returns track-event lists and a selected event', async () => {
    const trackEvent = { id: 6, name: 'Purchase' };
    const trackEvents = [trackEvent];
    const calls: unknown[] = [];
    const controller = new TrackEventController({
      trackEvents: {
        get: async (input: unknown) => {
          calls.push(input);
          return trackEvent;
        },
        getAllForAudience: async (input: unknown) => {
          calls.push(input);
          return trackEvents;
        },
        getMany: async (input: unknown) => {
          calls.push(input);
          return trackEvents;
        },
      },
    } as never);
    const query = { page: 1, quantity: 20, textSearch: '' };

    await expect(controller.getMany(3, query as never)).resolves.toBe(trackEvents);
    await expect(controller.getAllForAudience(3)).resolves.toEqual({ trackEvents });
    await expect(controller.get(3, 6)).resolves.toEqual({ trackEvent });
    expect(calls).toEqual([{ params: query, tenantId: 3 }, { tenantId: 3 }, { tenantId: 3, trackEventId: 6 }]);
  });

  it('throws when a track event does not exist', async () => {
    const controller = new TrackEventController({ trackEvents: { get: async () => null } } as never);

    await expect(controller.get(3, 99)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('copies an event to the target tenant with the authenticated user', async () => {
    const trackEvent = {
      id: 6,
      javascript: 'async () => { return {}; }',
      multipleTimes: true,
      name: 'Purchase',
      status: 'active',
    };
    const calls: unknown[] = [];
    const controller = new TrackEventController({
      trackEvents: {
        create: async (input: unknown) => calls.push(input),
        get: async (input: unknown) => {
          calls.push(input);
          return trackEvent;
        },
      },
    } as never);
    const request = {
      user: {
        id: 8,
        roles: [{ permissions: ['tenant.12.feature.track-event.action.create'] }],
      },
    };

    await expect(controller.copy(3, 6, { targetTenantId: 12 }, request as never)).resolves.toEqual({});
    expect(calls).toEqual([
      { tenantId: 3, trackEventId: 6 },
      {
        tenantId: 12,
        userId: 8,
        values: {
          javascript: trackEvent.javascript,
          multipleTimes: true,
          name: 'Purchase',
          status: 'active',
        },
      },
    ]);
  });

  it('requires create access to the target tenant when copying an event', async () => {
    const controller = new TrackEventController({ trackEvents: {} } as never);
    const request = { user: { id: 8, roles: [{ permissions: [] }] } };

    await expect(controller.copy(3, 6, { targetTenantId: 12 }, request as never)).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('throws when the source event to copy does not exist', async () => {
    const controller = new TrackEventController({
      trackEvents: {
        get: async () => null,
      },
    } as never);
    const request = {
      user: {
        id: 8,
        roles: [{ permissions: ['tenant.12.feature.track-event.action.create'] }],
      },
    };

    await expect(controller.copy(3, 99, { targetTenantId: 12 }, request as never)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('requires an authenticated user to create and update events', async () => {
    const controller = new TrackEventController({ trackEvents: {} } as never);
    const body = { javascript: 'async () => { return {}; }', multipleTimes: false, name: 'Purchase', status: 'active' };

    await expect(controller.create(3, body as never, {} as never)).rejects.toBeInstanceOf(UnauthorizedException);
    await expect(controller.copy(3, 6, { targetTenantId: 12 }, {} as never)).rejects.toBeInstanceOf(UnauthorizedException);
    await expect(controller.update(3, 6, body as never, {} as never)).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('creates, updates, and removes track events with tenant and user ids', async () => {
    const calls: unknown[] = [];
    const controller = new TrackEventController({
      trackEvents: {
        create: async (input: unknown) => calls.push(input),
        remove: async (input: unknown) => calls.push(input),
        update: async (input: unknown) => calls.push(input),
      },
    } as never);
    const body = { javascript: 'async () => { return {}; }', multipleTimes: false, name: 'Purchase', status: 'active' };
    const request = { user: { id: 8 } };

    await expect(controller.create(3, body as never, request as never)).resolves.toEqual({});
    await expect(controller.update(3, 6, body as never, request as never)).resolves.toEqual({});
    await expect(controller.remove(3, 6)).resolves.toEqual({});
    expect(calls).toEqual([
      { tenantId: 3, userId: 8, values: body },
      { tenantId: 3, trackEventId: 6, userId: 8, values: body },
      { tenantId: 3, trackEventId: 6 },
    ]);
  });
});
