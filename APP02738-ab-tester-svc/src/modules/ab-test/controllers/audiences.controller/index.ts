import type { TypeApiAudiences } from '@ab-tester/constants/types/api/audiences';
import type { TypeNodeRequirement } from '@ab-tester/constants/types/audience';
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
import { getStringPermission } from '../../../../libs/auth/permissions';
import { type Request } from '../../../../types/request';
import { AuthGuard } from '../../../common/guards/auth.guard';
import { ZodResponse } from '../../../common/interceptors/zod-response.interceptor';
import { DbService } from '../../../common/services/db.service';
import { audienceSchema, copyAudienceSchema, getAudiencesQuerySchema } from './request.schema';
import { audienceResponseSchemas } from './response.schema';

const getTrackEventIds = (requirements: TypeNodeRequirement): number[] => {
  const trackEventIds = new Set<number>();
  const visit = (node: TypeNodeRequirement) => {
    for (const requirement of node.data.children) {
      if (requirement.type === 'node') {
        visit(requirement);
      } else {
        trackEventIds.add(requirement.data.trackEventId);
      }
    }
  };

  visit(requirements);
  return [...trackEventIds];
};

@Controller('audiences')
export class AudiencesController {
  constructor(private readonly dbService: DbService) {}

  @ZodResponse(audienceResponseSchemas.getMany)
  @UseGuards(AuthGuard({ action: 'read', feature: 'audience' }))
  @Get()
  async getMany(
    @Param('tenantId', ParseIntPipe) tenantId: number,
    @Query({ schema: getAudiencesQuerySchema }) query: AssertEqual<z.infer<typeof getAudiencesQuerySchema>, TypeApiAudiences['getMany']['request']['pathParams']>,
  ): Promise<TypeApiAudiences['getMany']['response']> {
    const audiences = await this.dbService.audiences.getMany({ params: query, tenantId });
    return audiences;
  }

  @ZodResponse(audienceResponseSchemas.getAllForCampaign)
  @UseGuards(AuthGuard({ action: 'read', feature: 'audience' }))
  @Get('getAllForCampaign')
  async getAllForCampaign(@Param('tenantId', ParseIntPipe) tenantId: number): Promise<TypeApiAudiences['getAllForCampaign']['response']> {
    const audiences = await this.dbService.audiences.getAllForCampaign({ tenantId });
    return { audiences };
  }

  @ZodResponse(audienceResponseSchemas.get)
  @UseGuards(AuthGuard({ action: 'read', feature: 'audience' }))
  @Get(':audienceId')
  async get(@Param('tenantId', ParseIntPipe) tenantId: number, @Param('audienceId', ParseIntPipe) audienceId: number): Promise<TypeApiAudiences['get']['response']> {
    const result = await this.dbService.audiences.get({ audienceId, tenantId });
    if (!result) throw new NotFoundException();
    return result;
  }

  @ZodResponse(audienceResponseSchemas.create)
  @UseGuards(AuthGuard({ action: 'create', feature: 'audience' }))
  @Post()
  async create(
    @Param('tenantId', ParseIntPipe) tenantId: number,
    @Body({ schema: audienceSchema }) body: AssertEqual<z.infer<typeof audienceSchema>, TypeApiAudiences['create']['request']['body']>,
    @Req() req: Request,
  ): Promise<TypeApiAudiences['create']['response']> {
    const user = req.user;
    if (!user) throw new UnauthorizedException();

    await this.dbService.audiences.create({ tenantId, userId: user.id, values: body });
    return {};
  }

  @ZodResponse(audienceResponseSchemas.copy)
  @UseGuards(AuthGuard({ action: 'read', feature: 'audience' }))
  @Post(':audienceId/copy')
  async copy(
    @Param('tenantId', ParseIntPipe) tenantId: number,
    @Param('audienceId', ParseIntPipe) audienceId: number,
    @Body({ schema: copyAudienceSchema }) body: AssertEqual<z.infer<typeof copyAudienceSchema>, TypeApiAudiences['copy']['request']['body']>,
    @Req() req: Request,
  ): Promise<TypeApiAudiences['copy']['response']> {
    const user = req.user;
    if (!user) throw new UnauthorizedException();

    const audience = await this.dbService.audiences.get({ audienceId, tenantId });
    if (!audience) throw new NotFoundException();

    const trackEventIds = getTrackEventIds(audience.requirements);
    const requiredPermissions = [
      getStringPermission({ action: 'create', feature: 'audience', tenantId: body.targetTenantId }),
      ...(trackEventIds.length > 0
        ? [
            getStringPermission({ action: 'read', feature: 'track-event', tenantId }),
            getStringPermission({ action: 'create', feature: 'track-event', tenantId: body.targetTenantId }),
          ]
        : []),
    ];
    if (!requiredPermissions.every((permission) => user.roles.some((role) => role.permissions.includes(permission)))) {
      throw new ForbiddenException('Insufficient permissions');
    }

    await this.dbService.audiences.copy({
      audienceId,
      sourceTenantId: tenantId,
      targetTenantId: body.targetTenantId,
      userId: user.id,
    });
    return {};
  }

  @ZodResponse(audienceResponseSchemas.update)
  @UseGuards(AuthGuard({ action: 'update', feature: 'audience' }))
  @Put(':audienceId')
  async update(
    @Param('tenantId', ParseIntPipe) tenantId: number,
    @Param('audienceId', ParseIntPipe) audienceId: number,
    @Body({ schema: audienceSchema }) body: AssertEqual<z.infer<typeof audienceSchema>, TypeApiAudiences['update']['request']['body']>,
    @Req() req: Request,
  ): Promise<TypeApiAudiences['update']['response']> {
    const user = req.user;
    if (!user) throw new UnauthorizedException();

    await this.dbService.audiences.update({ audienceId, tenantId, updates: body, userId: user.id });
    return {};
  }

  @ZodResponse(audienceResponseSchemas.remove)
  @UseGuards(AuthGuard({ action: 'delete', feature: 'audience' }))
  @Delete(':audienceId')
  async remove(@Param('tenantId', ParseIntPipe) tenantId: number, @Param('audienceId', ParseIntPipe) audienceId: number): Promise<TypeApiAudiences['delete']['response']> {
    await this.dbService.audiences.remove({ audienceId, tenantId });
    return {};
  }
}
