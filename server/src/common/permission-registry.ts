// Permission code self-registration mechanism.
// Modules register their permission codes here; the seed script reads from this registry.

export interface PermissionDef {
  permCode: string;
  permName: string;
  resource: string;
  action: string;
  description: string;
}

export class PermissionRegistry {
  private static permissions: PermissionDef[] = [];

  static register(def: PermissionDef): void {
    // Avoid duplicates by permCode
    if (!this.permissions.some(p => p.permCode === def.permCode)) {
      this.permissions.push(def);
    }
  }

  static registerBatch(defs: PermissionDef[]): void {
    for (const d of defs) {
      this.register(d);
    }
  }

  static getAll(): PermissionDef[] {
    return [...this.permissions];
  }

  static clear(): void {
    this.permissions = [];
  }
}
