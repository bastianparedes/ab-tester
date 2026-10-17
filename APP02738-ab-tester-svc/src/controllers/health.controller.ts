import fs from 'node:fs';
import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { getScriptLocation } from '../libs/script';

@ApiTags('health')
@Controller('health')
export class HealthController {
  @Get()
  async get() {
    const fileExists = fs.existsSync(getScriptLocation());
    return {
      deployed: true,
      fileExists,
    };
  }
}
