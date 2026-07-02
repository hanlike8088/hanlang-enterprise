import { Module, Global } from '@nestjs/common';
import { WecomService } from './wecom.service';

@Global()
@Module({
  providers: [WecomService],
  exports: [WecomService],
})
export class WecomModule {}
