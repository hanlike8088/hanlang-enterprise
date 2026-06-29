import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface TransitionDef {
  from: string;
  to: string;
  guard?: string;
  action?: string;
  requireRole?: string;
}

interface TransitionCache { defs: TransitionDef[]; ts: number; }

@Injectable()
export class StatusMachineService {
  private transitionCache = new Map<string, TransitionCache>();

  constructor(private prisma: PrismaService) {}

  validateTransition(transitions: TransitionDef[], from: string, to: string): void {
    const valid = transitions.some(t => t.from === from && t.to === to);
    if (!valid) {
      const allowed = transitions.filter(t => t.from === from).map(t => t.to);
      throw new BadRequestException(
        'Invalid status transition: \'' + from + '\' -> \'' + to + '\'. ' +
        'Allowed from \'' + from + '\': ' + (allowed.length ? allowed.join(', ') : 'none'),
      );
    }
  }

  /** Load transitions from DB for a module. Returns empty array if none found. */
  async loadTransitions(module: string): Promise<TransitionDef[]> {
    const cached = this.transitionCache.get(module);
    if (cached && Date.now() - cached.ts < 60000) return cached.defs;
    const rows = await this.prisma.adminWorkflowTransition.findMany({ where: { module } });
    const defs = rows.map(r => ({ from: r.fromStatus, to: r.toStatus }));
    this.transitionCache.set(module, { defs, ts: Date.now() });
    return defs;
  }

  /** Validate a transition using DB-loaded rules. Falls back to hardcoded if DB empty. */
  async validateByModule(module: string, from: string, to: string, hardcodedFallback?: TransitionDef[]): Promise<void> {
    let transitions = await this.loadTransitions(module);
    if (transitions.length === 0 && hardcodedFallback) {
      transitions = hardcodedFallback;
    }
    this.validateTransition(transitions, from, to);
  }

  clearCache(module?: string) {
    if (module) this.transitionCache.delete(module);
    else this.transitionCache.clear();
  }

  getAvailableTransitions(transitions: TransitionDef[], from: string): string[] {
    return transitions.filter(t => t.from === from).map(t => t.to);
  }

  canTransition(transitions: TransitionDef[], from: string, to: string): boolean {
    return transitions.some(t => t.from === from && t.to === to);
  }
}
