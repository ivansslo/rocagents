import { CognitiveMemory } from '../types.js';

// ============================================================
// MemoryManager - Real memory CRUD with validation
// ============================================================

export class MemoryManager {
  private memories: Map<string, CognitiveMemory> = new Map();
  private changeLog: { action: string; key: string; timestamp: string }[] = [];

  constructor(initialMemories: CognitiveMemory[] = []) {
    for (const memory of initialMemories) {
      this.memories.set(memory.key, { ...memory });
    }
  }

  // --- CRUD Operations ---

  store(key: string, value: string, category: string): CognitiveMemory {
    if (!key || key.trim().length === 0) {
      throw new Error('Memory key cannot be empty');
    }
    if (value.trim().length === 0) {
      throw new Error('Memory value cannot be empty');
    }
    if (!category || category.trim().length === 0) {
      throw new Error('Memory category cannot be empty');
    }

    const memory: CognitiveMemory = {
      key: key.trim(),
      value: value.trim(),
      category: category.trim(),
      updatedAt: new Date().toISOString(),
    };

    const action = this.memories.has(key) ? 'update' : 'create';
    this.memories.set(key, memory);
    this.changeLog.push({ action, key, timestamp: memory.updatedAt });

    return { ...memory };
  }

  retrieve(key: string): CognitiveMemory | null {
    const memory = this.memories.get(key);
    return memory ? { ...memory } : null;
  }

  list(category?: string): CognitiveMemory[] {
    const all = Array.from(this.memories.values());
    if (category) {
      return all.filter((m) => m.category === category);
    }
    return all;
  }

  remove(key: string): boolean {
    const existed = this.memories.delete(key);
    if (existed) {
      this.changeLog.push({ action: 'delete', key, timestamp: new Date().toISOString() });
    }
    return existed;
  }

  // --- Query Helpers ---

  search(query: string): CognitiveMemory[] {
    const lowerQuery = query.toLowerCase();
    return Array.from(this.memories.values()).filter(
      (m) =>
        m.key.toLowerCase().includes(lowerQuery) ||
        m.value.toLowerCase().includes(lowerQuery) ||
        m.category.toLowerCase().includes(lowerQuery)
    );
  }

  getCategories(): string[] {
    const categories = new Set<string>();
    for (const m of this.memories.values()) {
      categories.add(m.category);
    }
    return Array.from(categories).sort();
  }

  // --- Integrity ---

  validate(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    for (const [key, memory] of this.memories) {
      if (!memory.key || memory.key !== key) {
        errors.push(`Memory key mismatch: ${key}`);
      }
      if (!memory.value) {
        errors.push(`Empty value for key: ${key}`);
      }
      if (!memory.category) {
        errors.push(`Missing category for key: ${key}`);
      }
      if (isNaN(Date.parse(memory.updatedAt))) {
        errors.push(`Invalid timestamp for key: ${key}`);
      }
    }
    return { valid: errors.length === 0, errors };
  }

  getChangeLog(): readonly { action: string; key: string; timestamp: string }[] {
    return [...this.changeLog];
  }

  get size(): number {
    return this.memories.size;
  }

  export(): CognitiveMemory[] {
    return Array.from(this.memories.values()).map((m) => ({ ...m }));
  }
}
