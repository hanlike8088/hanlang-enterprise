import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { AuditLogService } from '../services/audit-log.service';

@Injectable()
export class AuditLogInterceptor implements NestInterceptor {
  constructor(private readonly auditLogService: AuditLogService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, ip, headers } = request;
    const user = request.user as any;

    // Only log write operations
    if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
      return next.handle();
    }

    return next.handle().pipe(
      tap({
        next: (responseBody: any) => {
          const entityId = responseBody?.id || responseBody?.result?.id || undefined;
          this.auditLogService.log({
            userId: user?.id,
            username: user?.name || user?.username || 'anonymous',
            action: method,
            entity: url,
            entityId: entityId,
            detail: entityId ? JSON.stringify({ id: entityId }) : undefined,
            ip: ip,
            userAgent: headers?.['user-agent'],
          });
        },
        error: () => {
          // Could log errors too, but keeping it simple for now
        },
      }),
    );
  }
}
