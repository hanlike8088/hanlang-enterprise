import { Module } from '@nestjs/common';
import { MrpController } from './mrp.controller';
import { MrpService } from './mrp.service';
import { PrismaModule } from '../prisma/prisma.module';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [PrismaModule, CommonModule],
  controllers: [MrpController],
  providers: [MrpService],
  exports: [MrpService],
})
export class MrpModule {}
