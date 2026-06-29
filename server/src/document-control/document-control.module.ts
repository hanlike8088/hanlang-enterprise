import { Module } from '@nestjs/common';
import { DocumentControlController } from './document-control.controller';
import { DocumentControlService } from './document-control.service';
import { PrismaModule } from '../prisma/prisma.module';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [PrismaModule, CommonModule],
  controllers: [DocumentControlController],
  providers: [DocumentControlService],
  exports: [DocumentControlService],
})
export class DocumentControlModule {}
