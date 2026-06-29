import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NotificationService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: { userId: string; title: string; body: string; type?: string; relatedEntity?: string; relatedId?: string }) {
    return this.prisma.notification.create({
      data: {
        userId: dto.userId,
        title: dto.title,
        body: dto.body,
        type: dto.type || 'info',
        relatedEntity: dto.relatedEntity,
        relatedId: dto.relatedId,
      },
    });
  }

  async findByUser(userId: string, onlyUnread = false) {
    const where: any = { userId };
    if (onlyUnread) where.isRead = false;
    return this.prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  async countUnread(userId: string) {
    return this.prisma.notification.count({ where: { userId, isRead: false } });
  }

  async markRead(id: string) {
    return this.prisma.notification.update({
      where: { id },
      data: { isRead: true, readAt: new Date() },
    });
  }

  async markAllRead(userId: string) {
    return this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });
  }

  async delete(id: string) {
    return this.prisma.notification.delete({ where: { id } });
  }

  async deleteRead(userId: string) {
    return this.prisma.notification.deleteMany({ where: { userId, isRead: true } });
  }

  // broadcast to all users (admin action)
  async broadcast(title: string, body: string, type = 'announcement') {
    const users = await this.prisma.user.findMany({ select: { id: true },  });
    const data = users.map(u => ({ userId: u.id, title, body, type }));
    if (data.length === 0) return { count: 0 };
    await this.prisma.notification.createMany({ data });
    return { count: data.length };
  }
}
