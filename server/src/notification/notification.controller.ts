import { Controller, Get, Post, Put, Delete, Param, Body, Query } from '@nestjs/common';
import { NotificationService } from './notification.service';

@Controller('api/notifications')
export class NotificationController {
  constructor(private readonly svc: NotificationService) {}

  @Get()
  async list(@Query('userId') userId: string, @Query('unread') unread: string) {
    return this.svc.findByUser(userId, unread === 'true');
  }

  @Get('unread-count')
  async unreadCount(@Query('userId') userId: string) {
    return { count: await this.svc.countUnread(userId) };
  }

  @Post()
  async create(@Body() body: any) {
    return this.svc.create(body);
  }

  @Post('broadcast')
  async broadcast(@Body() body: { title: string; body: string; type?: string }) {
    return this.svc.broadcast(body.title, body.body, body.type);
  }

  @Put(':id/read')
  async markRead(@Param('id') id: string) {
    return this.svc.markRead(id);
  }

  @Put('read-all')
  async markAllRead(@Body() body: { userId: string }) {
    return this.svc.markAllRead(body.userId);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.svc.delete(id);
  }

  @Delete('read/cleanup')
  async deleteRead(@Query('userId') userId: string) {
    return this.svc.deleteRead(userId);
  }
}
