import fs from 'node:fs';
import { Controller, Get, Header, Param, ParseIntPipe } from '@nestjs/common';
import { ZodResponse } from '../../../common/interceptors/zod-response.interceptor';
import { ScriptService } from '../../services/script.service';
import { scriptResponseSchema } from './response.schema';

@Controller('script')
export class ScriptController {
  constructor(private readonly scriptService: ScriptService) {}

  @ZodResponse(scriptResponseSchema)
  @Get()
  @Header('Content-Type', 'text/javascript; charset=utf-8')
  @Header('Access-Control-Allow-Origin', '*')
  async get(@Param('tenantId', ParseIntPipe) tenantId: number): Promise<string> {
    const script = await this.scriptService.getScript({ tenantId });
    return script;
  }

  @ZodResponse(scriptResponseSchema)
  @Get('debug-panel')
  @Header('Content-Type', 'text/javascript; charset=utf-8')
  @Header('Access-Control-Allow-Origin', '*')
  getScript() {
    const filePath = require.resolve('@ab-tester/debug-panel');
    return fs.readFileSync(filePath, 'utf-8');
  }
}
