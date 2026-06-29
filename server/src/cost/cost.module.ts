import { Module } from '@nestjs/common';
import { CostService } from './cost.service';
import { CostController } from './cost.controller';
import { PrismaService } from '../prisma/prisma.service';
import { CodingRuleService } from '../common/services/coding-rule.service';

@Module({
  controllers: [CostController],
  providers: [CostService, PrismaService, CodingRuleService],
  exports: [CostService],
})
export class CostModule {}
