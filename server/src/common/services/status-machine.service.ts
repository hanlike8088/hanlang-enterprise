import { Injectable, BadRequestException } from '@nestjs/common';

/**
 * Transition definition for the unified document status machine.
 *
 * - from: current status
 * - to: target status
 * - guard: optional guard name (reserved for P5 approval flow)
 * - action: optional side-effect action (reserved for P6 module events)
 * - requireRole: optional role requirement (reserved for P5)
 */
export interface TransitionDef {
  from: string;
  to: string;
  guard?: string;
  action?: string;
  requireRole?: string;
}

@Injectable()
export class StatusMachineService {
  /**
   * Validate that a transition from currentStatus to targetStatus is allowed.
   * Throws BadRequestException if the transition is not in the defined set.
   */
  validateTransition(transitions: TransitionDef[], from: string, to: string): void {
    const valid = transitions.some(t => t.from === from && t.to === to);
    if (!valid) {
      const allowed = transitions
        .filter(t => t.from === from)
        .map(t => t.to);
      throw new BadRequestException(
        `Invalid status transition: '${from}' -> '${to}'. ` +
        `Allowed from '${from}': ${allowed.length ? allowed.join(', ') : 'none'}`,
      );
    }
  }

  /**
   * Return all valid target statuses reachable from the given current status.
   */
  getAvailableTransitions(transitions: TransitionDef[], from: string): string[] {
    return transitions
      .filter(t => t.from === from)
      .map(t => t.to);
  }

  /**
   * Check whether a transition exists without throwing.
   */
  canTransition(transitions: TransitionDef[], from: string, to: string): boolean {
    return transitions.some(t => t.from === from && t.to === to);
  }
}
