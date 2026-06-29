import {
  Injectable,
  CanActivate,
  ExecutionContext,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { PrismaService } from '../../prisma/prisma.service';

// -- Keys --------------------------------------------------------
export const PERMISSIONS_KEY = 'permissions';

// -- Decorators --------------------------------------------------

// Low-level: pass one or more raw permCode strings.
// Usage: @Permissions('crm:customer:read', 'crm:customer:write')
export const Permissions = (...codes: string[]) =>
  SetMetadata(PERMISSIONS_KEY, codes);

// High-level convenience: resource + action => permCode = "module:resource:action"
// Usage: @RequirePermission('crm', 'customer:read')
export const RequirePermission = (resource: string, action: string) =>
  SetMetadata(PERMISSIONS_KEY, [resource + ':' + action]);

// -- Guard -------------------------------------------------------

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const requiredCodes = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredCodes || requiredCodes.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    if (!user) return false;

    // Admin users bypass RBAC check
    if (user.role === 'admin') return true;

    const employee = await this.prisma.adminEmployee.findFirst({
      where: { name: user.name || user.username },
      include: {
        positions: {
          include: {
            position: {
              include: {
                positionRoles: {
                  include: {
                    role: {
                      include: {
                        rolePermissions: {
                          include: { permission: true },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });


    const userPerms = new Set<string>();
    for (const ep of employee.positions) {
      for (const pr of ep.position.positionRoles) {
        for (const rp of pr.role.rolePermissions) {
          userPerms.add(rp.permission.permCode);
        }
      }
    }

    const result = requiredCodes.every(c => userPerms.has(c));
    return result;
  }
}
