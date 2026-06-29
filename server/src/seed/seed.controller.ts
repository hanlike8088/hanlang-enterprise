import { Controller, Post } from '@nestjs/common';
import { SeedService } from './seed.service';
import { Public } from '../common/decorators/public.decorator';

@Controller('seed')
export class SeedController {
  constructor(private seedService: SeedService) {}

  @Public()
  @Post('init-admin')
  initAdmin() { return this.seedService.initAdmin(); }

  @Public()
  @Post('init-rules')
  initRules() { return this.seedService.initCodingRules(); }

  @Public()
  @Post('init-all')
  initAll() { return this.seedService.initAll(); }
}
