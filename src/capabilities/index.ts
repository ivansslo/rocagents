import { Capability, ExecutionLog } from '../types.js';

// ============================================================
// CapabilityRegistry - Register, validate & execute capabilities
// ============================================================

export interface CapabilityHandler {
  execute(input?: unknown): Promise<unknown>;
  validate?(input?: unknown): { valid: boolean; errors: string[] };
}

export class CapabilityRegistry {
  private capabilities: Map<string, Capability> = new Map();
  private handlers: Map<string, CapabilityHandler> = new Map();
  private executionLogs: ExecutionLog[] = [];

  register(meta: Capability, handler: CapabilityHandler): void {
    this.validateMeta(meta);
    this.capabilities.set(meta.id, meta);
    this.handlers.set(meta.id, handler);
  }

  async execute(capabilityId: string, input?: unknown): Promise<ExecutionLog> {
    const meta = this.capabilities.get(capabilityId);
    const handler = this.handlers.get(capabilityId);

    if (!meta || !handler) {
      const log: ExecutionLog = {
        timestamp: new Date().toISOString(),
        capabilityId,
        input,
        output: null,
        success: false,
        error: `Capability not found: ${capabilityId}`,
        durationMs: 0,
      };
      this.executionLogs.push(log);
      return log;
    }

    if (!meta.active) {
      const log: ExecutionLog = {
        timestamp: new Date().toISOString(),
        capabilityId,
        input,
        output: null,
        success: false,
        error: `Capability disabled: ${meta.name}`,
        durationMs: 0,
      };
      this.executionLogs.push(log);
      return log;
    }

    // Validate if handler supports it
    if (handler.validate) {
      const validation = handler.validate(input);
      if (!validation.valid) {
        const log: ExecutionLog = {
          timestamp: new Date().toISOString(),
          capabilityId,
          input,
          output: null,
          success: false,
          error: `Validation failed: ${validation.errors.join(', ')}`,
          durationMs: 0,
        };
        this.executionLogs.push(log);
        return log;
      }
    }

    const start = Date.now();
    try {
      const output = await handler.execute(input);
      const log: ExecutionLog = {
        timestamp: new Date().toISOString(),
        capabilityId,
        input,
        output,
        success: true,
        durationMs: Date.now() - start,
      };
      this.executionLogs.push(log);
      return log;
    } catch (error) {
      const log: ExecutionLog = {
        timestamp: new Date().toISOString(),
        capabilityId,
        input,
        output: null,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        durationMs: Date.now() - start,
      };
      this.executionLogs.push(log);
      return log;
    }
  }

  list(): Capability[] {
    return Array.from(this.capabilities.values());
  }

  getLogs(): ExecutionLog[] {
    return [...this.executionLogs];
  }

  enable(capabilityId: string): boolean {
    const cap = this.capabilities.get(capabilityId);
    if (cap) {
      cap.active = true;
      return true;
    }
    return false;
  }

  disable(capabilityId: string): boolean {
    const cap = this.capabilities.get(capabilityId);
    if (cap) {
      cap.active = false;
      return true;
    }
    return false;
  }

  private validateMeta(meta: Capability): void {
    if (!meta.id || meta.id.trim().length === 0) {
      throw new Error('Capability id is required');
    }
    if (!meta.name || meta.name.trim().length === 0) {
      throw new Error('Capability name is required');
    }
  }
}
