import { MILESTONE_BONUS, MILESTONES } from './constants'

const FIRST_GM_SCORE = 5
const EXTRA_GM_SCORE = 1

export interface GmCalculation {
  newStreak: number
  scoreEarned: number
  milestoneBonus: number
  isFirstToday: boolean
}

/**
 * Pure function — no side effects, no DB access.
 * Computes all GM outcomes from current state.
 */
export function calculateGM({
  isFirstToday,
  currentStreak,
  lastDateWasYesterday,
}: {
  isFirstToday: boolean
  currentStreak: number
  lastDateWasYesterday: boolean
}): GmCalculation {
  if (!isFirstToday) {
    return {
      newStreak: currentStreak,
      scoreEarned: EXTRA_GM_SCORE,
      milestoneBonus: 0,
      isFirstToday: false,
    }
  }

  const newStreak = lastDateWasYesterday ? currentStreak + 1 : 1
  const milestoneBonus = MILESTONE_BONUS[newStreak] ?? 0
  const scoreEarned = FIRST_GM_SCORE + milestoneBonus

  return { newStreak, scoreEarned, milestoneBonus, isFirstToday: true }
}

/** Returns the ordered list of milestone days with their bonuses. */
export function getMilestones(): Array<{ day: number; bonus: number }> {
  return MILESTONES.map(day => ({ day, bonus: MILESTONE_BONUS[day] }))
}

/** Returns the next milestone above the given streak, or null if at/beyond max. */
export function getNextMilestone(streak: number): { day: number; daysLeft: number; bonus: number } | null {
  const next = MILESTONES.find(m => m > streak)
  if (!next) return null
  return { day: next, daysLeft: next - streak, bonus: MILESTONE_BONUS[next] }
}
