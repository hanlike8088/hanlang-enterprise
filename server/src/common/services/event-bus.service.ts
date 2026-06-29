import { Injectable } from '@nestjs/common';
import { CrossModuleEvent } from './event-types';

@Injectable()
export class EventBusService {
  private handlers = new Map<string, Array<(event: CrossModuleEvent) => Promise<void> | void>>();

  /**
   * Register a handler for the given event type. Handlers persist for the lifetime
   * of the process; call this in onModuleInit().
   */
  on(
    eventType: string,
    handler: (event: CrossModuleEvent) => Promise<void> | void,
  ): void {
    const list = this.handlers.get(eventType);
    if (list) {
      list.push(handler);
    } else {
      this.handlers.set(eventType, [handler]);
    }
  }

  /**
   * Emit an event asynchronously. Errors in individual handlers are caught and
   * logged - they never propagate to the caller, so a single broken subscriber
   * cannot take down the emitting request.
   */
  async emit(
    eventType: string,
    data: any,
    source: string = 'system',
  ): Promise<void> {
    const handlers = this.handlers.get(eventType);
    if (!handlers || handlers.length === 0) return;

    const event: CrossModuleEvent = {
      type: eventType,
      source,
      data,
      timestamp: new Date(),
    };

    for (const handler of handlers) {
      try {
        await handler(event);
      } catch (error) {
        console.error(
          `[EventBus] Handler error for "${eventType}" (source=${source}):`,
          error,
        );
        // Swallow - event failures must not block the caller.
      }
    }
  }

  /** Remove all handlers (useful during testing). */
  clear(): void {
    this.handlers.clear();
  }
}
