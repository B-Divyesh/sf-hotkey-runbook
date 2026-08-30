export const FREE_RUNBOOK_LIMIT = 3;
export const FREE_HISTORY_LIMIT = 10;
export const FULL_HISTORY_LIMIT = 100;

export function visibleFreeItems<T>(items: T[], limit: number, unlocked: boolean): T[] {
  return unlocked ? items : items.slice(0, limit);
}

