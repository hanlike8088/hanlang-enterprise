import { SetMetadata } from '@nestjs/common';

export const PERMISSION_KEY = 'permissions';
export const RequirePermission = (resource: string, action: string) =>
  SetMetadata(PERMISSION_KEY, { resource, action });
