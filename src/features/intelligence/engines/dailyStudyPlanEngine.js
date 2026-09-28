/** Greedily fills the plan in priority order until the time budget is
 * used up. Always includes at least one action if any exist, even if it
 * alone exceeds the budget. Direct port of buildDailyStudyPlan. */
export function buildDailyStudyPlan(orderedActions, dailyMinutesBudget) {
  const items = [];
  let total = 0;
  for (const action of orderedActions) {
    if (items.length === 0) { items.push(action); total += action.estimatedMinutes; continue; }
    if (total + action.estimatedMinutes <= dailyMinutesBudget) { items.push(action); total += action.estimatedMinutes; }
  }
  return { items, estimatedMinutes: total, budgetMinutes: dailyMinutesBudget };
}
