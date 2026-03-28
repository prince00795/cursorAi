/**
 * Typed helpers for node:sqlite prepared statements.
 *
 * node:sqlite's SQLInputValue is: null | number | bigint | string | Uint8Array
 * Our query params are always one of those (or undefined→null), so these
 * thin wrappers cast safely and keep all call-sites clean.
 */
import type { StatementSync } from 'node:sqlite';

type Param = null | number | bigint | string | Uint8Array | boolean | undefined;

function toInput(v: unknown): null | number | bigint | string | Uint8Array {
  if (v === undefined || v === null) return null;
  if (typeof v === 'boolean') return v ? 1 : 0;
  return v as null | number | bigint | string | Uint8Array;
}

export function runStmt(stmt: StatementSync, ...params: unknown[]): { lastInsertRowid: number | bigint; changes: number } {
  return stmt.run(...params.map(toInput)) as { lastInsertRowid: number | bigint; changes: number };
}

export function allStmt<T = Record<string, unknown>>(stmt: StatementSync, ...params: unknown[]): T[] {
  return stmt.all(...params.map(toInput)) as unknown as T[];
}

export function getStmt<T = Record<string, unknown>>(stmt: StatementSync, ...params: unknown[]): T | undefined {
  return stmt.get(...params.map(toInput)) as unknown as T | undefined;
}
