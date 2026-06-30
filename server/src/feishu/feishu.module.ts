import { Module, Global } from '@nestjs/common';
import { FeishuService } from './feishu.service';
import { FeishuController } from './feishu.controller';

@Global()
@Module({
  controllers: [FeishuController],
  providers: [FeishuService],
  exports: [FeishuService],
})
export class FeishuModule {}
