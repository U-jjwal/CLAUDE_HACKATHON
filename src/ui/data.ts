import csvRaw from '../../data/bhopal_ghats_2023_2025.csv?raw';
import { parseReadings } from '../core/clean';
import type { Reading } from '../core/types';

export function getRawCsv(): string {
  return csvRaw;
}

export function parseAllReadings(raw: string = csvRaw): Reading[] {
  return parseReadings(raw);
}
