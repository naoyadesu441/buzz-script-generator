import { PHARMACEUTICAL_WORDS } from '@/lib/ng-words/pharmaceutical';
import { SUPERLATIVE_WORDS } from '@/lib/ng-words/superlative';
import { DISCRIMINATORY_PATTERNS } from '@/lib/ng-words/discriminatory';

export interface ValidationResult {
  hasViolation: boolean;
  violations: string[];
}

export function validateText(text: string): ValidationResult {
  const violations: string[] = [];

  for (const word of PHARMACEUTICAL_WORDS) {
    if (text.includes(word)) violations.push(`薬機法違反の可能性: "${word}"`);
  }

  for (const word of SUPERLATIVE_WORDS) {
    if (text.includes(word)) violations.push(`景表法違反の可能性: "${word}"`);
  }

  for (const pattern of DISCRIMINATORY_PATTERNS) {
    if (pattern.test(text)) violations.push(`差別的表現の可能性: "${pattern.source}"`);
  }

  return { hasViolation: violations.length > 0, violations };
}
