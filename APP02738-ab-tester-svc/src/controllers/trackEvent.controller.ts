import type { TypeApiTrackEvents } from '@ab-tester/constants/types/api/trackEvents';
import { type AssertEqual } from '@ab-tester/constants/types/utils';
import { Body, Controller, Delete, Get, NotFoundException, Param, ParseIntPipe, Post, Put, Query, Req, UnauthorizedException, UseGuards } from '@nestjs/common';
import { z } from 'zod';
import { AuthGuard } from '../guards/auth.guard';
import { jsCodeHasCorrectSyntax } from '../libs/jsCode';
import commonConstants from '../libs/sharedConstants';
import { ZodValidationPipe } from '../pipes/zod';
import { DbService } from '../services/db.service';
import { type Request } from '../types/request';

/* ---------- QUERY SCHEMA ---------- */

const getTrackEventQuerySchema = z
  .object({
    orderBy: z.enum(['status', 'name', 'id', 'updatedAt']),
    orderDirection: z.enum(commonConstants.orderDirectionArray),
    page: z.coerce.number().int(),
    quantity: z.coerce.number().int(),
    statusList: z.preprocess(
      (val) => {
        if (!val) return [];
        if (typeof val === 'string') return [val];
        return val;
      },
      z.array(z.enum(commonConstants.arrayStatusArray)),
    ),
    textSearch: z.string(),
  })
  .strip();

/* ---------- BODY SCHEMA ---------- */

const trackEventSchema = z
  .object({
    getData: z.string().refine((value) => jsCodeHasCorrectSyntax(value), {
      message: 'Invalid JavaScript code',
    }),
    multipleTimes: z.boolean(),
    name: z.string(),
    status: z.enum(commonConstants.arrayStatusArray),
  })
  .strip();

/* ---------- CONTROLLER ---------- */

@Controller('tenants/:tenantId/track-events')
export class TrackEventController {
  constructor(private readonly dbService: DbService) {}

  @UseGuards(AuthGuard({ action: 'read', feature: 'track-event' }))
  @Get()
  async getMany(
    @Param('tenantId', ParseIntPipe) tenantId: number,
    @Query(new ZodValidationPipe(getTrackEventQuerySchema)) query: AssertEqual<
      z.infer<typeof getTrackEventQuerySchema>,
      TypeApiTrackEvents['getMany']['request']['queryParams']
    >,
  ): Promise<TypeApiTrackEvents['getMany']['response']> {
    const trackEvents = await this.dbService.trackEvents.getMany({
      params: query,
      tenantId,
    });

    return trackEvents;
  }

  @UseGuards(AuthGuard({ action: 'read', feature: 'track-event' }))
  @Get('getAllForAudience')
  async getAllForAudience(@Param('tenantId', ParseIntPipe) tenantId: number): Promise<TypeApiTrackEvents['getAllForAudience']['response']> {
    const trackEvents = await this.dbService.trackEvents.getAllForAudience({ tenantId });
    return { trackEvents };
  }

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

  @UseGuards(AuthGuard({ action: 'create', feature: 'track-event' }))
  @Post()
  async create(
    @Param('tenantId', ParseIntPipe) tenantId: number,
    @Body(new ZodValidationPipe(trackEventSchema)) body: AssertEqual<z.infer<typeof trackEventSchema>, TypeApiTrackEvents['create']['request']['body']>,
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

  @UseGuards(AuthGuard({ action: 'update', feature: 'track-event' }))
  @Put(':trackEventId')
  async update(
    @Param('tenantId', ParseIntPipe) tenantId: number,
    @Param('trackEventId', ParseIntPipe) trackEventId: number,
    @Body(new ZodValidationPipe(trackEventSchema)) body: AssertEqual<z.infer<typeof trackEventSchema>, TypeApiTrackEvents['update']['request']['body']>,
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
