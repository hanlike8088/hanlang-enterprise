import { Module } from '@nestjs/common';
import { SpcController } from './spc.controller';
import { SpcService } from './spc.service';
import { PrismaModule } from '../prisma/prisma.module';
import { PermissionRegistry } from '../common/permission-registry';

PermissionRegistry.registerBatch([
  { permCode: 'spc:read', permName: '查看SPC控制图', resource: 'spc', action: 'read', description: '查看SPC统计过程控制图表' },
  { permCode: 'spc:write', permName: '管理SPC研究', resource: 'spc', action: 'write', description: '创建/编辑/删除SPC研究和测量数据' },
]);

@Module({
  imports: [PrismaModule],
  controllers: [SpcController],
  providers: [SpcService],
})
export class SpcModule {}
