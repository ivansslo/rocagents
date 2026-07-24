import { CognitiveMemory, OptimizationRecommendation } from '../types.js';

// ============================================================
// SystemOptimizer - Real analysis & recommendations
// ============================================================

export class SystemOptimizer {
  private recIdCounter = 0;

  analyze(memories: CognitiveMemory[]): OptimizationRecommendation[] {
    const recommendations: OptimizationRecommendation[] = [];

    // Check for duplicate memories
    const duplicates = this.findDuplicates(memories);
    if (duplicates.length > 0) {
      recommendations.push({
        id: this.nextId(),
        category: 'Memory',
        title: `${duplicates.length} duplicate memory keys detected`,
        description: `Keys found: ${duplicates.join(', ')}. Remove duplicates to save storage and avoid stale data.`,
        impact: 'medium',
        actionable: true,
      });
    }

    // Check for stale memories (> 7 days old)
    const stale = this.findStale(memories, 7);
    if (stale.length > 0) {
      recommendations.push({
        id: this.nextId(),
        category: 'Memory',
        title: `${stale.length} memories older than 7 days`,
        description: `Keys: ${stale.join(', ')}. Review and update or archive stale memories.`,
        impact: 'low',
        actionable: true,
      });
    }

    // Check for oversized values
    const oversized = this.findOversized(memories, 5000);
    if (oversized.length > 0) {
      recommendations.push({
        id: this.nextId(),
        category: 'Memory',
        title: `${oversized.length} memories with values > 5000 chars`,
        description: `Keys: ${oversized.join(', ')}. Large values slow search and increase storage.`,
        impact: 'medium',
        actionable: true,
      });
    }

    // Check for sensitive data patterns
    const sensitive = this.findSensitivePatterns(memories);
    if (sensitive.length > 0) {
      recommendations.push({
        id: this.nextId(),
        category: 'Security',
        title: `${sensitive.length} memories may contain sensitive data`,
        description: `Keys: ${sensitive.join(', ')}. Detected patterns: API keys, IPs, or credentials.`,
        impact: 'high',
        actionable: true,
      });
    }

    // Check category distribution
    const categories = this.analyzeCategories(memories);
    if (categories.uncategorized > 0) {
      recommendations.push({
        id: this.nextId(),
        category: 'Organization',
        title: `${categories.uncategorized} memories with generic categories`,
        description: 'Assign specific categories for better organization and retrieval.',
        impact: 'low',
        actionable: true,
      });
    }

    return recommendations;
  }

  // --- Private Helpers ---

  private findDuplicates(memories: CognitiveMemory[]): string[] {
    const seen = new Map<string, number>();
    for (const m of memories) {
      seen.set(m.key, (seen.get(m.key) || 0) + 1);
    }
    return Array.from(seen.entries())
      .filter(([, count]) => count > 1)
      .map(([key]) => key);
  }

  private findStale(memories: CognitiveMemory[], daysThreshold: number): string[] {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - daysThreshold);

    return memories
      .filter((m) => new Date(m.updatedAt) < cutoff)
      .map((m) => m.key);
  }

  private findOversized(memories: CognitiveMemory[], charThreshold: number): string[] {
    return memories
      .filter((m) => m.value.length > charThreshold)
      .map((m) => m.key);
  }

  private findSensitivePatterns(memories: CognitiveMemory[]): string[] {
    const patterns = [
      /api[_-]?key/i,
      /token/i,
      /password/i,
      /secret/i,
      /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/, // IP addresses
      /sk-[a-zA-Z0-9]+/, // OpenAI API keys
      /Bearer\s/i,
    ];

    return memories
      .filter((m) => patterns.some((p) => p.test(m.value) || p.test(m.key)))
      .map((m) => m.key);
  }

  private analyzeCategories(memories: CognitiveMemory[]): { total: number; uncategorized: number } {
    const genericCategories = ['default', 'general', 'misc', 'other', 'unknown', 'uncategorized'];
    return {
      total: memories.length,
      uncategorized: memories.filter((m) =>
        genericCategories.includes(m.category.toLowerCase())
      ).length,
    };
  }

  private nextId(): string {
    return `opt_${Date.now()}_${++this.recIdCounter}`;
  }
}
