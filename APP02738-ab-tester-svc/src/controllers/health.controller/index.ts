import fs from 'node:fs';
import { Controller, Get } from '@nestjs/common';
import { ZodResponse } from '../../interceptors/zod-response.interceptor';
import { getScriptLocation } from '../../libs/script';
import { healthResponseSchema } from './response.schema';

@Controller('health')
export class HealthController {
  @ZodResponse(healthResponseSchema)
  @Get()
  async get() {
    const fileExists = fs.existsSync(getScriptLocation());
    return {
      deployed: true,
      fileExists,
    };
  }
}
