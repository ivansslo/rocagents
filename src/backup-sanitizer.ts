import { BackupData, CognitiveMemory } from './types.js';
import { Redactor, RedactionResult } from './redactor.js';
import { writeFileSync, readFileSync } from 'fs';
import { basename } from 'path';

// ============================================================
// BackupSanitizer - Clean sensitive data from backup files
// ============================================================

export interface SanitizationReport {
  inputFile: string;
  outputFile: string;
  memoriesScanned: number;
  memoriesRedacted: number;
  totalRedactions: number;
  redactionDetails: { key: string; redactions: { match: string; type: string }[] }[];
}

export class BackupSanitizer {
  private redactor: Redactor;

  constructor() {
    this.redactor = new Redactor();
  }

  // Sanitize a backup file in-place (creates new file with -sanitized suffix)
  sanitizeFile(inputPath: string, outputPath?: string): SanitizationReport {
    const data = JSON.parse(readFileSync(inputPath, 'utf-8')) as BackupData;
    const result = this.sanitizeData(data);

    const outFile = outputPath || inputPath.replace('.json', '-sanitized.json');
    writeFileSync(outFile, JSON.stringify(result.data, null, 2));

    return {
      inputFile: inputPath,
      outputFile: outFile,
      memoriesScanned: result.memoriesScanned,
      memoriesRedacted: result.memoriesRedacted,
      totalRedactions: result.totalRedactions,
      redactionDetails: result.redactionDetails,
    };
  }

  // Sanitize backup data in memory
  sanitizeData(data: BackupData): {
    data: BackupData;
    memoriesScanned: number;
    memoriesRedacted: number;
    totalRedactions: number;
    redactionDetails: { key: string; redactions: { match: string; type: string }[] }[];
  } {
    const redactionDetails: { key: string; redactions: { match: string; type: string }[] }[] = [];
    let memoriesRedacted = 0;
    let totalRedactions = 0;

    const sanitizedMemories: CognitiveMemory[] = data.data.cognitiveMemories.map((memory) => {
      const combined = `${memory.key} ${memory.value}`;
      const result = this.redactor.redact(combined);

      if (result.redactions.length > 0) {
        memoriesRedacted++;
        totalRedactions += result.redactions.length;
        redactionDetails.push({ key: memory.key, redactions: result.redactions });

        // Split the redacted text back into key/value
        const redactedParts = result.redacted.split(' ');
        const redactedKey = redactedParts[0] || memory.key;
        const redactedValue = redactedParts.slice(1).join(' ') || memory.value;

        return {
          ...memory,
          key: redactedKey,
          value: redactedValue,
        };
      }

      return { ...memory };
    });

    return {
      data: {
        ...data,
        data: {
          ...data.data,
          cognitiveMemories: sanitizedMemories,
        },
      },
      memoriesScanned: data.data.cognitiveMemories.length,
      memoriesRedacted,
      totalRedactions,
      redactionDetails,
    };
  }

  // Scan only, without modifying
  scanFile(inputPath: string): {
    totalMemories: number;
    sensitiveMemories: { key: string; findings: string[] }[];
  } {
    const data = JSON.parse(readFileSync(inputPath, 'utf-8')) as BackupData;
    const sensitiveMemories: { key: string; findings: string[] }[] = [];

    for (const memory of data.data.cognitiveMemories) {
      const combined = `${memory.key} ${memory.value}`;
      const result = this.redactor.redact(combined);
      if (result.redactions.length > 0) {
        sensitiveMemories.push({
          key: memory.key,
          findings: result.redactions.map((r) => r.type),
        });
      }
    }

    return {
      totalMemories: data.data.cognitiveMemories.length,
      sensitiveMemories,
    };
  }
}
