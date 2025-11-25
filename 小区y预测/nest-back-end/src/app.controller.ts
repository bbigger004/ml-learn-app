import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('api/info')
  getApiInfo(): any {
    return this.appService.getApiInfo();
  }

  @Get('health')
  getHealthStatus(): any {
    return this.appService.getHealthStatus();
  }
}
