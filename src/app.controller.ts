import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { RootHealthResponse } from './app.service';
import { AppService } from './app.service';

@ApiTags('Health')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({ summary: 'Smoke test — API is running (no auth)' })
  getRoot(): RootHealthResponse {
    return this.appService.getRootHealth();
  }
}
