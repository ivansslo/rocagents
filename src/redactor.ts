// ============================================================
// Redactor - Automatic sensitive data detection & masking
// ============================================================

export interface RedactionResult {
  original: string;
  redacted: string;
  redactions: { match: string; type: string }[];
}

export class Redactor {
  private patterns: { pattern: RegExp; type: string; replacement: string }[] = [
    {
      pattern: /sk-[a-zA-Z0-9]{20,}/g,
      type: 'OPENAI_API_KEY',
      replacement: 'sk-[REDACTED]',
    },
    {
      pattern: /ghp_[a-zA-Z0-9]{36,}/g,
      type: 'GITHUB_TOKEN',
      replacement: 'ghp_[REDACTED]',
    },
    {
      pattern: /Bearer\s+[a-zA-Z0-9_\-\.]+/g,
      type: 'BEARER_TOKEN',
      replacement: 'Bearer [REDACTED]',
    },
    {
      pattern: /password\s*[:=]\s*\S+/gi,
      type: 'PASSWORD',
      replacement: 'password: [REDACTED]',
    },
    {
      pattern: /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g,
      type: 'IP_ADDRESS',
      replacement: 'X.X.X.X',
    },
    {
      pattern: /[a-zA-Z0-9_]*secret[a-zA-Z0-9_]*\s*[:=]\s*[a-zA-Z0-9_\-\.]+/gi,
      type: 'SECRET_VALUE',
      replacement: '[REDACTED_SECRET]',
    },
    {
      pattern: /api[_-]?key\s*[:=]\s*\S+/gi,
      type: 'API_KEY_REF',
      replacement: 'api_key: [REDACTED]',
    },
    {
      pattern: /token\s*[:=]\s*[a-zA-Z0-9_\-\.]{20,}/gi,
      type: 'AUTH_TOKEN',
      replacement: 'token: [REDACTED]',
    },
    // Broad: any value containing "secret", "key", or "token" as a word
    {
      pattern: /\b(secret|apikey|api_key|access_token|auth_token)\s*[:=]?\s*[a-zA-Z0-9_\-\.]{8,}/gi,
      type: 'SENSITIVE_VALUE',
      replacement: '[REDACTED]',
    },
  ];

  redact(text: string): RedactionResult {
    let redacted = text;
    const redactions: { match: string; type: string }[] = [];

    for (const rule of this.patterns) {
      const matches = text.matchAll(new RegExp(rule.pattern.source, rule.pattern.flags));
      for (const match of matches) {
        redactions.push({ match: match[0].substring(0, 30), type: rule.type });
      }
      redacted = redacted.replace(new RegExp(rule.pattern.source, rule.pattern.flags), rule.replacement);
    }

    return { original: text, redacted, redactions };
  }

  isSensitive(text: string): boolean {
    for (const rule of this.patterns) {
      if (new RegExp(rule.pattern.source, rule.pattern.flags).test(text)) return true;
    }
    return false;
  }

  redactObject<T extends Record<string, unknown>>(obj: T): T {
    const result = { ...obj };
    for (const [key, value] of Object.entries(result)) {
      if (typeof value === 'string') {
        (result as Record<string, unknown>)[key] = this.redact(value).redacted;
      }
    }
    return result;
  }
}
