import { Injectable, ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async register(dto: { username: string; email: string; password: string; name: string }) {
    const existing = await this.prisma.user.findFirst({
      where: { OR: [{ username: dto.username }, { email: dto.email }] },
    });
    if (existing) throw new ConflictException('用户名或邮箱已存在');

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const user = await this.prisma.user.create({
      data: { ...dto, password: hashedPassword },
    });

    const token = this.jwtService.sign({ sub: user.id, username: user.username, role: user.role, name: user.name });
    const { password, ...result } = user;
    return { user: result, access_token: token };
  }

  async login(dto: { username: string; password: string }) {
    if (!dto?.username) throw new UnauthorizedException('缺少用户名和密码');
    const user = await this.prisma.user.findUnique({ where: { username: dto.username } });
    if (!user) throw new UnauthorizedException('用户名或密码错误');

    const valid = await bcrypt.compare(dto.password, user.password);
    if (!valid) throw new UnauthorizedException('用户名或密码错误');

    const token = this.jwtService.sign({ sub: user.id, username: user.username, role: user.role, name: user.name });
    const { password, ...result } = user;
    return { user: result, access_token: token };
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('用户不存在');
    const { password, ...result } = user;
    return result;
  }

  async getUsers() {
    const users = await this.prisma.user.findMany({
      select: { id: true, username: true, email: true, name: true, role: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    });
    return users;
  }

  async getMyPermissions(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) return [];
    if (user.role === 'admin') return ['*'];

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
                        rolePermissions: { include: { permission: true } }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!employee) return [];

    const perms = new Set<string>();
    for (const ep of employee.positions) {
      for (const pr of ep.position.positionRoles) {
        for (const rp of pr.role.rolePermissions) {
          perms.add(rp.permission.permCode);
        }
      }
    }
    return [...perms];
  }

}