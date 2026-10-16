import fs from 'node:fs';
import { Controller, Get } from '@nestjs/common';
import { getScriptLocation } from '../libs/script';

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
