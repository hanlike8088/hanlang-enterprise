import { Module } from '@nestjs/common';
import { BatchTraceController } from './batch-trace.controller';
import { BatchTraceService } from './batch-trace.service';
import { PrismaModule } from '../prisma/prisma.module';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [PrismaModule, CommonModule],
  controllers: [BatchTraceController],
  providers: [BatchTraceService],
  exports: [BatchTraceService],
})
export class BatchTraceModule {}
