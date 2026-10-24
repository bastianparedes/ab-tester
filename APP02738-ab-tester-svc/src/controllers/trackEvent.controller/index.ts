import type { TypeApiTrackEvents } from '@ab-tester/constants/types/api/trackEvents';
import { type AssertEqual } from '@ab-tester/constants/types/utils';
import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  NotFoundException,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { z } from 'zod';
import { AuthGuard } from '../../guards/auth.guard';
import { ZodResponse } from '../../interceptors/zod-response.interceptor';
import { getStringPermission } from '../../libs/auth/permissions';
import { DbService } from '../../services/db.service';
import { type Request } from '../../types/request';
import { copyTrackEventSchema, getTrackEventQuerySchema, trackEventSchema } from './request.schema';
import { trackEventResponseSchemas } from './response.schema';

/* ---------- CONTROLLER ---------- */

@Controller('tenants/:tenantId/track-events')
export class TrackEventController {
  constructor(private readonly dbService: DbService) {}

  @ZodResponse(trackEventResponseSchemas.getMany)
  @UseGuards(AuthGuard({ action: 'read', feature: 'track-event' }))
  @Get()
  async getMany(
    @Param('tenantId', ParseIntPipe) tenantId: number,
    @Query({ schema: getTrackEventQuerySchema }) query: AssertEqual<z.infer<typeof getTrackEventQuerySchema>, TypeApiTrackEvents['getMany']['request']['queryParams']>,
  ): Promise<TypeApiTrackEvents['getMany']['response']> {
    const trackEvents = await this.dbService.trackEvents.getMany({
      params: query,
      tenantId,
    });

    return trackEvents;
  }

  @ZodResponse(trackEventResponseSchemas.getAllForAudience)
  @UseGuards(AuthGuard({ action: 'read', feature: 'track-event' }))
  @Get('getAllForAudience')
  async getAllForAudience(@Param('tenantId', ParseIntPipe) tenantId: number): Promise<TypeApiTrackEvents['getAllForAudience']['response']> {
    const trackEvents = await this.dbService.trackEvents.getAllForAudience({ tenantId });
    return { trackEvents };
  }

  @ZodResponse(trackEventResponseSchemas.get)
  @UseGuards(AuthGuard({ action: 'read', feature: 'track-event' }))
  @Get(':trackEventId')
  async get(@Param('tenantId', ParseIntPipe) tenantId: number, @Param('trackEventId', ParseIntPipe) trackEventId: number): Promise<TypeApiTrackEvents['get']['response']> {
    const trackEvent = await this.dbService.trackEvents.get({
      tenantId,
      trackEventId,
    });

    if (!trackEvent) throw new NotFoundException();
    return { trackEvent };
  }

  @ZodResponse(trackEventResponseSchemas.create)
  @UseGuards(AuthGuard({ action: 'create', feature: 'track-event' }))
  @Post()
  async create(
    @Param('tenantId', ParseIntPipe) tenantId: number,
    @Body({ schema: trackEventSchema }) body: AssertEqual<z.infer<typeof trackEventSchema>, TypeApiTrackEvents['create']['request']['body']>,
    @Req() req: Request,
  ): Promise<TypeApiTrackEvents['create']['response']> {
    const user = req.user;
    if (!user) throw new UnauthorizedException();

    await this.dbService.trackEvents.create({
      tenantId,
      userId: user.id,
      values: body,
    });

    return {};
  }

  @ZodResponse(trackEventResponseSchemas.copy)
  @UseGuards(AuthGuard({ action: 'read', feature: 'track-event' }))
  @Post(':trackEventId/copy')
  async copy(
    @Param('tenantId', ParseIntPipe) tenantId: number,
    @Param('trackEventId', ParseIntPipe) trackEventId: number,
    @Body({ schema: copyTrackEventSchema }) body: AssertEqual<z.infer<typeof copyTrackEventSchema>, TypeApiTrackEvents['copy']['request']['body']>,
    @Req() req: Request,
  ): Promise<TypeApiTrackEvents['copy']['response']> {
    const user = req.user;
    if (!user) throw new UnauthorizedException();

    const targetCreatePermission = getStringPermission({
      action: 'create',
      feature: 'track-event',
      tenantId: body.targetTenantId,
    });
    if (!user.roles.some((role) => role.permissions.includes(targetCreatePermission))) {
      throw new ForbiddenException('Insufficient permissions');
    }

    const trackEvent = await this.dbService.trackEvents.get({ tenantId, trackEventId });
    if (!trackEvent) throw new NotFoundException();

    await this.dbService.trackEvents.create({
      tenantId: body.targetTenantId,
      userId: user.id,
      values: {
        javascript: trackEvent.javascript,
        multipleTimes: trackEvent.multipleTimes,
        name: trackEvent.name,
        status: trackEvent.status,
      },
    });

    return {};
  }

  @ZodResponse(trackEventResponseSchemas.update)
  @UseGuards(AuthGuard({ action: 'update', feature: 'track-event' }))
  @Put(':trackEventId')
  async update(
    @Param('tenantId', ParseIntPipe) tenantId: number,
    @Param('trackEventId', ParseIntPipe) trackEventId: number,
    @Body({ schema: trackEventSchema }) body: AssertEqual<z.infer<typeof trackEventSchema>, TypeApiTrackEvents['update']['request']['body']>,
    @Req() req: Request,
  ): Promise<TypeApiTrackEvents['update']['response']> {
    const user = req.user;
    if (!user) throw new UnauthorizedException();
    await this.dbService.trackEvents.update({
      tenantId,
      trackEventId,
      userId: user.id,
      values: body,
    });

    return {};
  }

  @ZodResponse(trackEventResponseSchemas.remove)
  @UseGuards(AuthGuard({ action: 'delete', feature: 'track-event' }))
  @Delete(':trackEventId')
  async remove(
    @Param('tenantId', ParseIntPipe) tenantId: number,
    @Param('trackEventId', ParseIntPipe) trackEventId: number,
  ): Promise<TypeApiTrackEvents['update']['response']> {
    await this.dbService.trackEvents.remove({
      tenantId,
      trackEventId,
    });

    return {};
  }
}
