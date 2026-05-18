import React, { useState, useEffect, useRef, useMemo } from 'react'
import {
  ArrowLeft,
  Plus,
  Trash2,
  StickyNote,
  Clock,
  Activity,
  Dumbbell,
  Award,
  History,
  BarChart3,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  Flame,
  Check,
  X,
  TrendingUp,
  Play,
  Settings,
  Download,
  Upload,
  Pencil,
  Timer,
  RotateCcw,
  Pause,
  SkipForward,
  Target,
  Sun,
  Sparkles,
} from 'lucide-react'

// ============================================================
// CONSTANTS
// ============================================================

const STORAGE = {
  workouts: 'liftlog:workouts',
  sessions: 'liftlog:sessions',
  active: 'liftlog:active',
}

const MUSCLE_GROUPS = ['Chest', 'Back', 'Shoulders', 'Arms', 'Legs', 'Core']

const EXERCISES = {
  Chest: [
    'Bench Press',
    'Incline Bench Press',
    'Dumbbell Bench Press',
    'Incline Dumbbell Press',
    'Dumbbell Fly',
    'Cable Fly',
    'Push-Up',
    'Dip',
  ],
  Back: [
    'Deadlift',
    'Pull-Up',
    'Barbell Row',
    'Bent-Over Row',
    'Lat Pulldown',
    'Seated Cable Row',
    'T-Bar Row',
    'Face Pull',
  ],
  Shoulders: [
    'Overhead Press',
    'Dumbbell Shoulder Press',
    'Lateral Raise',
    'Front Raise',
    'Rear Delt Fly',
    'Arnold Press',
    'Upright Row',
    'Shrug',
  ],
  Arms: [
    'Barbell Curl',
    'Dumbbell Curl',
    'Hammer Curl',
    'Preacher Curl',
    'Tricep Pushdown',
    'Skull Crusher',
    'Overhead Tricep Extension',
    'Close-Grip Bench',
  ],
  Legs: [
    'Squat',
    'Front Squat',
    'Leg Press',
    'Romanian Deadlift',
    'Lunge',
    'Leg Curl',
    'Leg Extension',
    'Calf Raise',
  ],
  Core: [
    'Plank',
    'Hanging Leg Raise',
    'Russian Twist',
    'Ab Wheel Rollout',
    'Cable Crunch',
    'Sit-Up',
    'Mountain Climber',
    'Hollow Hold',
  ],
}

const LOWER_BODY_EXTRAS = new Set(['Deadlift', 'Romanian Deadlift'])

const FEEL_LABELS = ['DRAINED', '', 'AVG', '', 'PRIMED']
const FASTING_STATES = ['FASTED', 'PARTIAL', 'FED']
const ENERGY_SOURCES = ['NONE', 'COFFEE', 'PRE-WO', 'MEAL']

const SCORE_TIERS = [
  { min: 90, label: 'ELITE' },
  { min: 75, label: 'STRONG' },
  { min: 60, label: 'SOLID' },
  { min: 45, label: 'OK' },
  { min: 0, label: 'LIGHT' },
]

const LIFT_GOAL = 10

// PPL planner constants
// PUSH = Chest + Arms (triceps emphasis)
// PULL = Back + Arms (biceps emphasis)
// LEGS = Legs + Core
const DAY_TYPES = ['PUSH', 'PULL', 'LEGS']
const DAY_FOCUS = {
  PUSH: ['Chest', 'Arms'],
  PULL: ['Back', 'Arms'],
  LEGS: ['Legs', 'Core'],
}

// Anchor compound exercises for each muscle group, in preference order
const ANCHOR_EXERCISES = {
  Chest: ['Bench Press', 'Incline Bench Press', 'Dumbbell Bench Press'],
  Back: ['Deadlift', 'Pull-Up', 'Barbell Row', 'Bent-Over Row'],
  Shoulders: ['Overhead Press', 'Dumbbell Shoulder Press'],
  Arms: ['Close-Grip Bench', 'Barbell Curl', 'Tricep Pushdown'],
  Legs: ['Squat', 'Romanian Deadlift', 'Front Squat'],
  Core: ['Hanging Leg Raise', 'Ab Wheel Rollout', 'Cable Crunch'],
}

// For PUSH/PULL we want the Arms accessory to bias triceps vs biceps
const TRICEP_EXERCISES = new Set([
  'Tricep Pushdown',
  'Skull Crusher',
  'Overhead Tricep Extension',
  'Close-Grip Bench',
])
const BICEP_EXERCISES = new Set([
  'Barbell Curl',
  'Dumbbell Curl',
  'Hammer Curl',
  'Preacher Curl',
])

// ============================================================
// HELPERS
// ============================================================

const uid = () =>
  Math.random().toString(36).slice(2, 10) + Date.now().toString(36)

function loadJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

function saveJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* quota — swallow */
  }
}

function clearKey(key) {
  try {
    localStorage.removeItem(key)
  } catch {
    /* swallow */
  }
}

const isLowerBody = (exercise, muscleGroup) =>
  muscleGroup === 'Legs' || LOWER_BODY_EXTRAS.has(exercise)

const workoutVolume = (w) =>
  (w.sets || []).reduce(
    (sum, s) => sum + (Number(s.weight) || 0) * (Number(s.reps) || 0),
    0,
  )

const bestSetWeight = (w) =>
  (w.sets || []).reduce(
    (best, s) =>
      Math.max(best, (Number(s.weight) || 0) * (Number(s.reps) || 0)),
    0,
  )

const heaviestWeight = (w) =>
  (w.sets || []).reduce((best, s) => Math.max(best, Number(s.weight) || 0), 0)

const scoreLabel = (score) =>
  SCORE_TIERS.find((t) => score >= t.min)?.label || 'LIGHT'

const daysSince = (ts) =>
  ts ? Math.floor((Date.now() - ts) / 86400000) : Infinity

function formatElapsed(ms) {
  const s = Math.max(0, Math.floor(ms / 1000))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  if (h > 0) return `${h}H ${String(m).padStart(2, '0')}M`
  return `${m}M`
}

function formatDuration(startTime, endTime) {
  return formatElapsed((endTime || Date.now()) - startTime)
}

function formatDateShort(t) {
  return new Date(t)
    .toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    .toUpperCase()
}

function formatDateLong(t) {
  return new Date(t)
    .toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
    .toUpperCase()
}

function formatTimeOfDay(t) {
  return new Date(t).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  })
}

function formatVolume(v) {
  if (v >= 10000) return `${(v / 1000).toFixed(0)}K`
  if (v >= 1000) return `${(v / 1000).toFixed(1)}K`
  return String(v)
}

// Find the most recent occurrence of an exercise (optionally before some time)
function lastOccurrence(exercise, workouts, before = Infinity) {
  let latest = null
  for (const w of workouts) {
    if (w.exercise !== exercise) continue
    if (w.date >= before) continue
    if (!latest || w.date > latest.date) latest = w
  }
  return latest
}

// Get recommendation for next time doing an exercise
function getRecommendation(exercise, muscleGroup, workouts) {
  const last = lastOccurrence(exercise, workouts)
  if (!last)
    return { type: 'first', text: 'FIRST TIME — START LIGHT', weight: 0, reps: 10 }

  const sets = last.sets || []
  if (sets.length === 0) return null

  const weights = sets.map((s) => Number(s.weight) || 0)
  const reps = sets.map((s) => Number(s.reps) || 0)
  const lastWeight = Math.max(...weights)
  const minReps = Math.min(...reps)
  const maxReps = Math.max(...reps)
  const allHit12 = reps.every((r) => r >= 12)

  const gap = daysSince(last.date)
  const groupFromLast = last.muscleGroup || muscleGroup
  const lower = isLowerBody(exercise, groupFromLast)
  const bump = lower ? 10 : 5

  if (gap > 14) {
    const w = Math.max(5, Math.round((lastWeight * 0.9) / 5) * 5)
    return {
      type: 'deload',
      text: `${gap}D OFF — DELOAD TO ${w}LB`,
      weight: w,
      reps: 10,
    }
  }
  if (allHit12) {
    return {
      type: 'increase',
      text: `+${bump}LB → ${lastWeight + bump} × 10`,
      weight: lastWeight + bump,
      reps: 10,
    }
  }
  if (minReps >= 10) {
    return {
      type: 'push',
      text: `STAY ${lastWeight}LB — PUSH PAST ${maxReps}`,
      weight: lastWeight,
      reps: maxReps + 1,
    }
  }
  return {
    type: 'repeat',
    text: `REPEAT ${lastWeight}LB × ${reps[0] || 10}`,
    weight: lastWeight,
    reps: reps[0] || 10,
  }
}

// ----- SESSION PLANNER (hybrid PPL with staleness tiebreaker) -----

// Most recent date a muscle group was trained (or null)
function lastByMuscleGroup(workouts) {
  const map = {}
  for (const g of MUSCLE_GROUPS) map[g] = null
  for (const w of workouts) {
    if (!MUSCLE_GROUPS.includes(w.muscleGroup)) continue
    if (!map[w.muscleGroup] || w.date > map[w.muscleGroup])
      map[w.muscleGroup] = w.date
  }
  return map
}

// Custom exercises the user has logged under a given muscle group
function customInGroup(group, workouts) {
  const standard = new Set(EXERCISES[group] || [])
  const seen = new Set()
  const list = []
  for (const w of workouts) {
    if (w.muscleGroup !== group) continue
    if (standard.has(w.exercise) || seen.has(w.exercise)) continue
    seen.add(w.exercise)
    list.push(w.exercise)
  }
  return list
}

// Score a day type by how stale its primary focus group is.
// Higher = more overdue.
function scoreDayType(type, lastMap) {
  const [primary] = DAY_FOCUS[type]
  return daysSince(lastMap[primary])
}

// Pick the day type for today: stalest primary group wins.
// Tiebreaker order: LEGS > PULL > PUSH (recomp bias toward big compounds).
function pickDayType(workouts) {
  const lastMap = lastByMuscleGroup(workouts)
  const priority = { LEGS: 0, PULL: 1, PUSH: 2 }
  return DAY_TYPES.slice().sort((a, b) => {
    const diff = scoreDayType(b, lastMap) - scoreDayType(a, lastMap)
    if (diff !== 0) return diff
    return priority[a] - priority[b]
  })[0]
}

function buildPlanItem(exercise, muscleGroup, workouts, isAnchor) {
  const rec = getRecommendation(exercise, muscleGroup, workouts)
  return {
    exercise,
    muscleGroup,
    sets: isAnchor ? 4 : 3,
    reps: rec?.reps || 10,
    weight: rec?.weight || 0,
    isAnchor,
  }
}

// Pick `count` exercises for a muscle group: optionally lead with an anchor
// compound, then fill with accessories preferring those with history (oldest
// first) so the user rotates through variations.
function pickExercisesForGroup(group, workouts, count, includeAnchor, filter) {
  const all = [...(EXERCISES[group] || []), ...customInGroup(group, workouts)]
    .filter((e) => (filter ? filter(e) : true))
  if (all.length === 0) return []

  const picks = []
  const used = new Set()

  if (includeAnchor) {
    for (const a of ANCHOR_EXERCISES[group] || []) {
      if (all.includes(a)) {
        picks.push(buildPlanItem(a, group, workouts, true))
        used.add(a)
        break
      }
    }
  }

  const candidates = all
    .filter((e) => !used.has(e))
    .map((e) => ({ exercise: e, last: lastOccurrence(e, workouts) }))
    .sort((a, b) => {
      if (a.last && !b.last) return -1
      if (!a.last && b.last) return 1
      if (a.last && b.last) return a.last.date - b.last.date
      return 0
    })

  for (const c of candidates) {
    if (picks.length >= count) break
    picks.push(buildPlanItem(c.exercise, group, workouts, false))
    used.add(c.exercise)
  }

  return picks
}

function suggestSessionPlan(workouts) {
  const dayType = pickDayType(workouts)
  const [primary, secondary] = DAY_FOCUS[dayType]
  const lastMap = lastByMuscleGroup(workouts)

  // PUSH biases secondary toward triceps, PULL toward biceps
  let secondaryFilter = null
  if (secondary === 'Arms') {
    if (dayType === 'PUSH') secondaryFilter = (e) => TRICEP_EXERCISES.has(e)
    else if (dayType === 'PULL') secondaryFilter = (e) => BICEP_EXERCISES.has(e)
  }

  const exercises = [
    ...pickExercisesForGroup(primary, workouts, 3, true),
    ...pickExercisesForGroup(secondary, workouts, 2, true, secondaryFilter),
  ]

  // Always add 1 core movement on non-LEGS days
  if (primary !== 'Core' && secondary !== 'Core') {
    exercises.push(...pickExercisesForGroup('Core', workouts, 1, false))
  }

  const primaryGap = daysSince(lastMap[primary])
  const rationale =
    primaryGap === Infinity
      ? 'FRESH START — COMPOUND FOCUS'
      : `${primary.toUpperCase()} STALE ${primaryGap}D`

  const estimatedMinutes = exercises.reduce(
    (sum, e) => sum + (e.isAnchor ? 8 : 5),
    0,
  )

  return {
    dayType,
    focus: [primary, secondary],
    exercises,
    rationale,
    estimatedMinutes,
  }
}

// ----- PLATE CALCULATOR -----
// Standard imperial plates, largest first
const PLATES = [45, 35, 25, 10, 5, 2.5]
const BAR_WEIGHT = 45

// Returns the per-side plate breakdown for `weight`. Null if weight <= bar.
function platesPerSide(weight) {
  const total = Number(weight) || 0
  if (total < BAR_WEIGHT + 2.5) return null
  const perSide = (total - BAR_WEIGHT) / 2
  if (perSide <= 0) return null
  const picked = []
  let remaining = perSide
  for (const p of PLATES) {
    while (remaining + 0.001 >= p) {
      picked.push(p)
      remaining -= p
    }
  }
  if (remaining > 0.01) return null // can't make exact change with standard plates
  return picked
}

// ----- WEEKLY AGGREGATION (for charts) -----
function startOfWeek(t) {
  const d = new Date(t)
  d.setHours(0, 0, 0, 0)
  // Make Monday the first day
  const dow = (d.getDay() + 6) % 7
  d.setDate(d.getDate() - dow)
  return d.getTime()
}

function weeksBack(n) {
  const now = startOfWeek(Date.now())
  const weeks = []
  for (let i = n - 1; i >= 0; i--) {
    weeks.push(now - i * 7 * 86400000)
  }
  return weeks
}

function weeklyAgg(sessions, workouts, nWeeks = 8) {
  const buckets = weeksBack(nWeeks).map((start) => ({
    start,
    sessions: 0,
    volume: 0,
    scoreSum: 0,
    scoreCount: 0,
  }))
  const startTimes = buckets.map((b) => b.start)
  for (const s of sessions) {
    if (!s.endTime) continue
    const sow = startOfWeek(s.startTime)
    const idx = startTimes.indexOf(sow)
    if (idx < 0) continue
    buckets[idx].sessions += 1
    if (typeof s.score === 'number') {
      buckets[idx].scoreSum += s.score
      buckets[idx].scoreCount += 1
    }
    const vol = (s.workouts || [])
      .map((id) => workouts.find((w) => w.id === id))
      .filter(Boolean)
      .reduce((sum, w) => sum + workoutVolume(w), 0)
    buckets[idx].volume += vol
  }
  return buckets.map((b) => ({
    start: b.start,
    sessions: b.sessions,
    volume: b.volume,
    avgScore: b.scoreCount > 0 ? b.scoreSum / b.scoreCount : null,
  }))
}

// ----- READINESS & DIFFICULTY -----

// 0 = wrecked, 1 = peak. Feels weighted highest because subjective signal
// integrates fatigue/CNS load that the other inputs miss.
function computeReadiness({ feel, fastingState, sleepHours }) {
  const feelScore = Math.max(0, (Number(feel || 3) - 1) / 4)
  const fastingScore =
    fastingState === 'FED'
      ? 1.0
      : fastingState === 'PARTIAL'
        ? 0.7
        : fastingState === 'FASTED'
          ? 0.4
          : 0.7

  const sleep = Number(sleepHours) || 0
  let sleepScore
  if (sleep === 0) sleepScore = 0.7 // unspecified — assume average
  else if (sleep < 5) sleepScore = 0.0
  else if (sleep < 6) sleepScore = 0.4
  else if (sleep < 7) sleepScore = 0.7
  else sleepScore = 1.0

  return Math.max(
    0,
    Math.min(1, feelScore * 0.5 + fastingScore * 0.2 + sleepScore * 0.3),
  )
}

function difficultyTier(readiness) {
  if (readiness >= 0.75) return 'HARD'
  if (readiness >= 0.45) return 'STEADY'
  return 'LIGHT'
}

function difficultyColor(tier) {
  if (tier === 'HARD') return 'text-emerald-500'
  if (tier === 'STEADY') return 'text-zinc-300'
  return 'text-orange-400'
}

// Scale a base plan by difficulty tier:
// - HARD: +1 set on anchor compounds, accessories unchanged
// - STEADY: leave as-is
// - LIGHT: -1 set everywhere, drop the last accessory if plan has >= 4 exercises
function applyDifficulty(basePlan, readiness) {
  const tier = difficultyTier(readiness)
  let exercises = basePlan.exercises.map((e) => ({ ...e }))

  if (tier === 'HARD') {
    exercises = exercises.map((e) =>
      e.isAnchor ? { ...e, sets: e.sets + 1 } : e,
    )
  } else if (tier === 'LIGHT') {
    // Drop one accessory if we can
    if (exercises.length >= 4) {
      for (let i = exercises.length - 1; i >= 0; i--) {
        if (!exercises[i].isAnchor) {
          exercises.splice(i, 1)
          break
        }
      }
    }
    exercises = exercises.map((e) => ({
      ...e,
      sets: Math.max(2, e.sets - 1),
    }))
  }

  const estimatedMinutes = exercises.reduce(
    (sum, e) => sum + (e.isAnchor ? 8 : 5),
    0,
  )

  return {
    ...basePlan,
    difficulty: tier,
    readiness: Math.round(readiness * 100),
    exercises,
    estimatedMinutes,
  }
}

// Score a session against history
function calculateScore(session, allSessions, allWorkouts) {
  const sessionWorkouts = (session.workouts || [])
    .map((id) => allWorkouts.find((w) => w.id === id))
    .filter(Boolean)

  // VOLUME (40)
  const totalVolume = sessionWorkouts.reduce(
    (s, w) => s + workoutVolume(w),
    0,
  )
  const prior = allSessions
    .filter((s) => s.endTime && s.id !== session.id)
    .slice(-4)
  const avgVolume =
    prior.length > 0
      ? prior.reduce((sum, s) => {
          const wks = (s.workouts || [])
            .map((id) => allWorkouts.find((w) => w.id === id))
            .filter(Boolean)
          return sum + wks.reduce((ss, w) => ss + workoutVolume(w), 0)
        }, 0) / prior.length
      : 0
  // No prior sessions: scale against an absolute baseline of 15,000 lb-reps
  // (a fair full-session target for a beginner/intermediate) instead of giving
  // a flat 35 for any non-zero volume. After the first session, the relative
  // comparison takes over.
  const volumePts =
    avgVolume > 0
      ? Math.min(40, (totalVolume / avgVolume) * 35)
      : totalVolume > 0
        ? Math.min(40, (totalVolume / 15000) * 40)
        : 0

  // PROGRESSIVE OVERLOAD (25)
  let beaten = 0
  let comparable = 0
  sessionWorkouts.forEach((w) => {
    const priorBest = allWorkouts
      .filter(
        (x) => x.exercise === w.exercise && x.id !== w.id && x.date < w.date,
      )
      .reduce((best, p) => Math.max(best, bestSetWeight(p)), 0)
    if (priorBest > 0) {
      comparable++
      if (bestSetWeight(w) > priorBest) beaten++
    }
  })
  // No comparable history means you didn't actually beat anything — score 0,
  // not the half-credit consolation prize the old fallback handed out.
  const overloadPts =
    comparable > 0 ? (beaten / sessionWorkouts.length) * 25 : 0

  // ACTIVITY COUNT (20) — sigmoid centered at 5 lifts:
  //   0 lifts = 0, 3 ≈ 3, 5 = 10, 7 ≈ 17, 10+ ≈ 20.
  // Punishes low counts harder than linear; plateaus near the goal.
  const lifts = sessionWorkouts.length
  const activityPts =
    lifts === 0
      ? 0
      : Math.min(20, 20 / (1 + Math.exp(-0.9 * (lifts - 5))))

  // REP RANGE (15)
  let totalSets = 0
  let inRange = 0
  sessionWorkouts.forEach((w) =>
    (w.sets || []).forEach((s) => {
      totalSets++
      const r = Number(s.reps) || 0
      if (r >= 10 && r <= 12) inRange++
    }),
  )
  // Weight by sample size so a single perfect set doesn't earn full credit.
  // Full weight kicks in at 6+ sets (roughly a real session).
  const sampleFactor = Math.min(1, totalSets / 6)
  const repPts =
    totalSets > 0 ? (inRange / totalSets) * 15 * sampleFactor : 0

  return {
    total: Math.round(volumePts + overloadPts + activityPts + repPts),
    breakdown: {
      volume: { value: Math.round(volumePts), max: 40, label: 'VOLUME' },
      overload: {
        value: Math.round(overloadPts),
        max: 25,
        label: 'PROGRESSIVE OVERLOAD',
      },
      activity: {
        value: Math.round(activityPts),
        max: 20,
        label: 'ACTIVITY COUNT',
      },
      repRange: { value: Math.round(repPts), max: 15, label: 'REP RANGE' },
    },
  }
}

// ----- COACH WRAP-UP -----
// Turn a completed session into trainer-style observations.

function generateCoachWrapUp(session, allWorkouts, allSessions) {
  const sessionWorkouts = (session.workouts || [])
    .map((id) => allWorkouts.find((w) => w.id === id))
    .filter(Boolean)

  const totalSets = sessionWorkouts.reduce(
    (s, w) => s + (w.sets?.length || 0),
    0,
  )
  const inRangeSets = sessionWorkouts.reduce(
    (s, w) =>
      s + (w.sets || []).filter((set) => set.reps >= 10 && set.reps <= 12)
        .length,
    0,
  )
  const lowRepSets = sessionWorkouts.reduce(
    (s, w) => s + (w.sets || []).filter((set) => set.reps < 10).length,
    0,
  )
  const highRepSets = totalSets - inRangeSets - lowRepSets
  const totalVol = sessionWorkouts.reduce(
    (s, w) => s + workoutVolume(w),
    0,
  )

  // PRs hit this session
  const prs = []
  for (const w of sessionWorkouts) {
    const priorBest = allWorkouts
      .filter(
        (x) => x.exercise === w.exercise && x.id !== w.id && x.date < w.date,
      )
      .reduce((b, p) => Math.max(b, bestSetWeight(p)), 0)
    if (priorBest > 0 && bestSetWeight(w) > priorBest) {
      const best = (w.sets || []).reduce(
        (acc, s) =>
          Number(s.weight) * Number(s.reps) >
          Number(acc.weight) * Number(acc.reps)
            ? s
            : acc,
        w.sets[0],
      )
      prs.push({ exercise: w.exercise, reps: best.reps, weight: best.weight })
    }
  }

  const priorSessions = allSessions
    .filter((s) => s.endTime && s.id !== session.id)
    .slice(-4)
  const avgPriorVol =
    priorSessions.length > 0
      ? priorSessions.reduce((sum, s) => {
          const wks = (s.workouts || [])
            .map((id) => allWorkouts.find((w) => w.id === id))
            .filter(Boolean)
          return sum + wks.reduce((ss, w) => ss + workoutVolume(w), 0)
        }, 0) / priorSessions.length
      : 0

  const wins = []
  const pushes = []
  const advice = []

  // ===== WINS =====

  if (prs.length > 0) {
    const list = prs
      .slice(0, 3)
      .map((p) => `${p.exercise} ${p.reps}×${p.weight}`)
      .join(', ')
    wins.push({
      title: `${prs.length} personal best${prs.length > 1 ? 's' : ''}`,
      detail:
        list + (prs.length > 3 ? ` (+${prs.length - 3} more)` : '') +
        '. Strength is moving.',
    })
  }

  if (sessionWorkouts.length >= LIFT_GOAL) {
    wins.push({
      title: 'Full activity day',
      detail: `${sessionWorkouts.length} lifts hit the daily target — max activity points.`,
    })
  }

  if (avgPriorVol > 0 && totalVol > avgPriorVol * 1.1) {
    const pct = Math.round((totalVol / avgPriorVol - 1) * 100)
    wins.push({
      title: 'Above-average volume',
      detail: `${pct}% over your recent 4-session average. Real workload.`,
    })
  }

  if (
    typeof session.readiness === 'number' &&
    session.readiness < 50 &&
    sessionWorkouts.length >= 4
  ) {
    wins.push({
      title: 'Trained tired',
      detail: `Readiness was ${session.readiness}%. Showing up on rough days is what builds the habit.`,
    })
  }

  if (totalSets >= 8 && inRangeSets / totalSets >= 0.75) {
    wins.push({
      title: 'Dialed-in rep range',
      detail: `${inRangeSets} of ${totalSets} sets in the 10–12 sweet spot — peak hypertrophy zone.`,
    })
  }

  // Floor for empty wins — give them something
  if (wins.length === 0 && sessionWorkouts.length > 0) {
    wins.push({
      title: 'You showed up',
      detail: 'Most lifters skip the rough days. You logged the session anyway — that\'s the work.',
    })
  }

  // ===== PUSHES =====

  if (sessionWorkouts.length < LIFT_GOAL && sessionWorkouts.length < 8) {
    const needed = LIFT_GOAL - sessionWorkouts.length
    pushes.push({
      title: `Add ${needed} more lift${needed > 1 ? 's' : ''} next time`,
      detail: `Activity points peak at ${LIFT_GOAL} lifts. You logged ${sessionWorkouts.length}.`,
    })
  }

  if (
    prs.length === 0 &&
    sessionWorkouts.length >= 3 &&
    priorSessions.length > 0
  ) {
    pushes.push({
      title: 'No PRs today',
      detail:
        'Try +2.5 to +5 lb or one extra rep on your anchor compound next session. Small jumps compound.',
    })
  }

  if (totalSets >= 6) {
    if (lowRepSets > inRangeSets && lowRepSets >= 3) {
      pushes.push({
        title: `${lowRepSets} sets ended under 10 reps`,
        detail:
          'Weight is too heavy for the 10–12 range goal. Drop 5–10 lb to push past 10.',
      })
    } else if (highRepSets > inRangeSets && highRepSets >= 3) {
      pushes.push({
        title: `${highRepSets} sets ran past 12 reps`,
        detail:
          'Weight is too light — you should fail before 13. Bump 5–10 lb next session.',
      })
    }
  }

  if (session.plan?.exercises) {
    const planned = session.plan.exercises.map((e) => e.exercise)
    const done = new Set(sessionWorkouts.map((w) => w.exercise))
    const skipped = planned.filter((e) => !done.has(e))
    if (skipped.length > 0 && skipped.length < planned.length) {
      pushes.push({
        title: `${skipped.length} planned lift${skipped.length > 1 ? 's' : ''} skipped`,
        detail: `Missed: ${skipped.slice(0, 2).join(', ')}${skipped.length > 2 ? `, +${skipped.length - 2}` : ''}. Reshuffle next session if equipment was the issue.`,
      })
    }
  }

  if (
    typeof session.score === 'number' &&
    session.score < 60 &&
    typeof session.readiness === 'number' &&
    session.readiness >= 60
  ) {
    pushes.push({
      title: 'Left points on the table',
      detail: `You had ${session.readiness}% readiness but scored ${session.score}. Either go heavier, add lifts, or stay in the 10–12 zone next time.`,
    })
  }

  // ===== ADVICE — time-of-day aware =====

  const hour = new Date(session.endTime || Date.now()).getHours()
  const muscleGroups = [...new Set(sessionWorkouts.map((w) => w.muscleGroup))]

  // Hydration always
  advice.push({
    title: 'Hydrate',
    detail: '20–30 oz of water in the next hour. More if it was hot.',
  })

  // Protein
  advice.push({
    title: 'Protein within 2 hours',
    detail:
      '30–40 g of quality protein — eggs, lean meat, Greek yogurt, whey shake. Opens the repair window.',
  })

  // Fasted refuel
  if (session.fastingState === 'FASTED') {
    advice.push({
      title: 'Real refuel — not just protein',
      detail:
        'You trained fasted, glycogen is depleted. A full meal (protein + carbs) in the next 2 hours.',
    })
  }

  // Stretch by muscle
  if (muscleGroups.includes('Legs')) {
    advice.push({
      title: 'Loosen the legs',
      detail:
        'Quad + hamstring stretch, 60s each side. Walk later — keeps tomorrow from being brutal.',
    })
  } else if (muscleGroups.includes('Back')) {
    advice.push({
      title: 'Decompress the spine',
      detail:
        'Cat-cows, doorway lat stretch. Hang from a pull-up bar for 30s if you can — instant relief.',
    })
  } else if (
    muscleGroups.includes('Chest') ||
    muscleGroups.includes('Shoulders')
  ) {
    advice.push({
      title: 'Open up the chest',
      detail:
        'Doorway pec stretch + band pull-aparts. Counteracts the forward-shoulder posture.',
    })
  }

  // Time-of-day specific
  if (hour < 11) {
    advice.push({
      title: 'Anchor the day with a real breakfast',
      detail:
        'Carbs + protein + fat. Sets you up to keep moving and not crash by 2pm.',
    })
  } else if (hour < 14) {
    advice.push({
      title: 'Solid lunch — not a snack',
      detail:
        'You earned the calories. Whole foods over processed — recomp lives in the kitchen.',
    })
  } else if (hour < 19) {
    advice.push({
      title: 'Dinner is your recovery meal',
      detail:
        'Front-load the protein here. Avoid the late carb-loaded snack — let sleep do the work.',
    })
  } else {
    advice.push({
      title: 'Wind down — don\'t crash on the couch',
      detail:
        'Light meal, dim lights, no screens within an hour of bed. Recovery happens tonight.',
    })
  }

  // Sleep
  const sleep = Number(session.sleepHours) || 0
  if (sleep > 0 && sleep < 7) {
    advice.push({
      title: 'Bank sleep tonight',
      detail: `${sleep}h last night isn't enough. Aim for 7+ — that's when real muscle gain happens.`,
    })
  } else {
    advice.push({
      title: 'Protect tonight\'s sleep',
      detail:
        '7–9 hours. CNS rebuilds in deep sleep; cutting it short blunts the work you just did.',
    })
  }

  // ===== HEADLINE =====

  let headline
  const sc = session.score || 0
  if (sc >= 90) headline = 'Elite session. Banked.'
  else if (sc >= 75) headline = 'Strong work today.'
  else if (sc >= 60) headline = 'Solid day at the gym.'
  else if (sc >= 45) headline = 'Got the work in.'
  else headline = 'Showed up — that counts.'

  return { headline, wins, pushes, advice, prs }
}

// ============================================================
// SHARED UI PRIMITIVES
// ============================================================

function Shell({ children }) {
  return (
    <div
      className="min-h-screen bg-zinc-950 text-zinc-100"
      style={{
        paddingTop: 'env(safe-area-inset-top)',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      <div className="mx-auto max-w-md px-4 pb-8">{children}</div>
    </div>
  )
}

function Brand() {
  return (
    <div className="flex items-center justify-between pt-6 pb-5">
      <div className="text-2xl font-bold tracking-tight">Lift.Log</div>
      <div className="w-2 h-2 rounded-full bg-emerald-500/70" />
    </div>
  )
}

// Sleek stat card used on the redesigned Home + Active Session screens.
// Stat (below) is the older bordered version still used by other screens.
function StatTile({ label, value, accent = false }) {
  return (
    <div
      className={`rounded-xl px-3 py-3 ${
        accent ? 'bg-emerald-950/40' : 'bg-zinc-900/60'
      }`}
    >
      <div className="text-[11px] text-zinc-500 font-medium">{label}</div>
      <div
        className={`mt-1 font-mono text-2xl font-semibold tabular-nums tracking-tight ${
          accent ? 'text-emerald-400' : 'text-zinc-100'
        }`}
      >
        {value}
      </div>
    </div>
  )
}

const titleCase = (s) =>
  typeof s === 'string' && s.length > 0
    ? s[0].toUpperCase() + s.slice(1).toLowerCase()
    : s

function TopBar({ onBack, title, right }) {
  return (
    <div className="flex items-center justify-between pt-5 pb-4">
      <button
        onClick={onBack}
        className="flex items-center gap-2 -ml-2 px-2 py-2 text-zinc-400 active:text-zinc-100"
      >
        <ArrowLeft size={20} />
        <span className="text-[11px] tracking-[0.2em]">BACK</span>
      </button>
      <div className="text-[11px] tracking-[0.2em] text-zinc-400">{title}</div>
      <div className="min-w-[60px] text-right">{right}</div>
    </div>
  )
}

function Card({ children, className = '' }) {
  return (
    <div
      className={`border border-zinc-800 bg-zinc-900/40 ${className}`}
    >
      {children}
    </div>
  )
}

function Label({ children, className = '' }) {
  return (
    <div className={`text-[10px] tracking-[0.2em] text-zinc-500 ${className}`}>
      {children}
    </div>
  )
}

// ============================================================
// NOTES EDITOR (debounced)
// ============================================================

function NotesEditor({ value, onCommit, placeholder = 'NO NOTES YET' }) {
  const [draft, setDraft] = useState(value || '')
  const initialized = useRef(false)

  useEffect(() => {
    // When the canonical value changes from outside, sync down — but not on first render
    if (!initialized.current) {
      initialized.current = true
      return
    }
    if (value !== draft) setDraft(value || '')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  useEffect(() => {
    if ((value || '') === (draft || '')) return
    const t = setTimeout(() => onCommit(draft), 500)
    return () => clearTimeout(t)
  }, [draft, value, onCommit])

  return (
    <textarea
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      placeholder={placeholder}
      className="w-full min-h-[120px] bg-zinc-950/60 rounded-xl px-3 py-2 text-sm placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-600 resize-none ring-1 ring-zinc-800/50"
    />
  )
}

// ============================================================
// ROOT COMPONENT
// ============================================================

export default function LiftLog() {
  const [view, setView] = useState('home')
  const [workouts, setWorkouts] = useState([])
  const [sessions, setSessions] = useState([])
  const [active, setActive] = useState(null)
  const [now, setNow] = useState(Date.now())
  const [loaded, setLoaded] = useState(false)

  // Navigation state
  const [pickerMuscle, setPickerMuscle] = useState(null)
  const [entryExercise, setEntryExercise] = useState(null) // { exercise, muscleGroup }
  const [completedSession, setCompletedSession] = useState(null)
  const [viewingSessionId, setViewingSessionId] = useState(null)
  const [viewingExercise, setViewingExercise] = useState(null)
  const [editingWorkoutId, setEditingWorkoutId] = useState(null)
  const [editReturnView, setEditReturnView] = useState('session')

  // Load from localStorage on mount
  useEffect(() => {
    setWorkouts(loadJSON(STORAGE.workouts, []))
    setSessions(loadJSON(STORAGE.sessions, []))
    setActive(loadJSON(STORAGE.active, null))
    setLoaded(true)
  }, [])

  // Persist on change — but only after initial load (otherwise we'd wipe storage on mount)
  useEffect(() => {
    if (!loaded) return
    saveJSON(STORAGE.workouts, workouts)
  }, [workouts, loaded])
  useEffect(() => {
    if (!loaded) return
    saveJSON(STORAGE.sessions, sessions)
  }, [sessions, loaded])
  useEffect(() => {
    if (!loaded) return
    if (active) saveJSON(STORAGE.active, active)
    else clearKey(STORAGE.active)
  }, [active, loaded])

  // Timer tick while in active session
  useEffect(() => {
    if (!active || view !== 'session') return
    const id = setInterval(() => setNow(Date.now()), 30000)
    return () => clearInterval(id)
  }, [active, view])

  // Today's suggested plan — recomputed when workouts change
  const todaysPlan = useMemo(() => suggestSessionPlan(workouts), [workouts])

  // -------------- handlers --------------

  function startSession(checkin) {
    // Snapshot the plan into the session so it doesn't shift mid-session
    // as workouts get logged
    const snapshot = suggestSessionPlan(workouts)
    const readiness = computeReadiness(checkin)
    const adjustedPlan = applyDifficulty(snapshot, readiness)
    const s = {
      id: uid(),
      startTime: Date.now(),
      endTime: null,
      feel: checkin.feel,
      fastingState: checkin.fastingState,
      hoursFasted: checkin.hoursFasted,
      sleepHours: checkin.sleepHours,
      energy: checkin.energy,
      focus: checkin.focus,
      readiness: Math.round(readiness * 100),
      plan: adjustedPlan,
      notes: '',
      workouts: [],
    }
    setActive(s)
    setNow(Date.now())
    setView('session')
  }

  function logWorkout(exercise, muscleGroup, sets) {
    const filteredSets = sets
      .filter((s) => Number(s.weight) >= 0 && Number(s.reps) > 0)
      .map((s) => ({
        weight: Number(s.weight) || 0,
        reps: Number(s.reps) || 0,
      }))
    if (filteredSets.length === 0) {
      // Nothing to log
      setView('session')
      return
    }
    const w = {
      id: uid(),
      date: Date.now(),
      exercise,
      muscleGroup,
      sets: filteredSets,
    }
    setWorkouts((prev) => [...prev, w])
    setActive((prev) =>
      prev ? { ...prev, workouts: [...prev.workouts, w.id] } : prev,
    )
    setEntryExercise(null)
    setPickerMuscle(null)
    setView('session')
  }

  function commitActiveNotes(notes) {
    setActive((prev) => (prev ? { ...prev, notes } : prev))
  }

  function endSession() {
    if (!active) return
    const ended = { ...active, endTime: Date.now() }
    const { total, breakdown } = calculateScore(ended, sessions, workouts)
    const final = { ...ended, score: total, scoreBreakdown: breakdown }
    setSessions((prev) => [...prev, final])
    setActive(null)
    setCompletedSession(final)
    setView('session-complete')
  }

  function deleteWorkout(id) {
    setWorkouts((prev) => prev.filter((w) => w.id !== id))
    setSessions((prev) =>
      prev.map((s) => ({
        ...s,
        workouts: (s.workouts || []).filter((wid) => wid !== id),
      })),
    )
    if (active) {
      setActive((prev) =>
        prev
          ? {
              ...prev,
              workouts: (prev.workouts || []).filter((wid) => wid !== id),
            }
          : prev,
      )
    }
  }

  function commitSessionNotes(sessionId, notes) {
    setSessions((prev) =>
      prev.map((s) => (s.id === sessionId ? { ...s, notes } : s)),
    )
  }

  function saveEditedWorkout(id, sets) {
    setWorkouts((prev) =>
      prev.map((w) => (w.id === id ? { ...w, sets } : w)),
    )
  }

  function importData(nextWorkouts, nextSessions) {
    setWorkouts(nextWorkouts)
    setSessions(nextSessions)
    setActive(null)
  }

  function resetAllData() {
    setWorkouts([])
    setSessions([])
    setActive(null)
  }

  // -------------- render switch --------------

  if (view === 'home')
    return (
      <HomeScreen
        active={active}
        workouts={workouts}
        sessions={sessions}
        plan={todaysPlan}
        onStart={() => setView('checkin')}
        onResume={() => {
          setNow(Date.now())
          setView('session')
        }}
        onSessions={() => setView('scoreboard')}
        onAllLifts={() => setView('all-lifts')}
        onExercise={(ex) => {
          setViewingExercise(ex)
          setView('exercise-detail')
        }}
        onSettings={() => setView('settings')}
      />
    )

  if (view === 'checkin')
    return (
      <CheckInScreen
        defaultFocus={todaysPlan.focus}
        plan={todaysPlan}
        onBack={() => setView('home')}
        onBegin={startSession}
      />
    )

  if (view === 'session' && active)
    return (
      <SessionScreen
        active={active}
        workouts={workouts}
        now={now}
        onPickMuscle={(g) => {
          setPickerMuscle(g)
          setView('log-picker')
        }}
        onPickPlannedExercise={(exercise, muscleGroup) => {
          setPickerMuscle(muscleGroup)
          setEntryExercise({ exercise, muscleGroup })
          setView('log-entry')
        }}
        onCommitNotes={commitActiveNotes}
        onEnd={endSession}
        onDeleteWorkout={deleteWorkout}
        onEditWorkout={(id) => {
          setEditingWorkoutId(id)
          setEditReturnView('session')
          setView('edit-workout')
        }}
      />
    )

  if (view === 'log-picker' && pickerMuscle)
    return (
      <LogPickerScreen
        muscleGroup={pickerMuscle}
        workouts={workouts}
        onBack={() => {
          setPickerMuscle(null)
          setView('session')
        }}
        onPick={(exercise) => {
          setEntryExercise({ exercise, muscleGroup: pickerMuscle })
          setView('log-entry')
        }}
      />
    )

  if (view === 'log-entry' && entryExercise)
    return (
      <LogEntryScreen
        exercise={entryExercise.exercise}
        muscleGroup={entryExercise.muscleGroup}
        workouts={workouts}
        onBack={() => {
          setEntryExercise(null)
          setView('log-picker')
        }}
        onFinish={(sets) =>
          logWorkout(entryExercise.exercise, entryExercise.muscleGroup, sets)
        }
      />
    )

  if (view === 'session-complete' && completedSession)
    return (
      <SessionCompleteScreen
        session={completedSession}
        workouts={workouts}
        sessions={sessions}
        onCommitNotes={(notes) =>
          commitSessionNotes(completedSession.id, notes)
        }
        onDone={() => {
          setCompletedSession(null)
          setView('home')
        }}
      />
    )

  if (view === 'scoreboard')
    return (
      <ScoreboardScreen
        sessions={sessions}
        workouts={workouts}
        onBack={() => setView('home')}
        onOpen={(id) => {
          setViewingSessionId(id)
          setView('session-detail')
        }}
      />
    )

  if (view === 'session-detail' && viewingSessionId) {
    const session = sessions.find((s) => s.id === viewingSessionId)
    if (!session) {
      setView('scoreboard')
      return null
    }
    return (
      <SessionDetailScreen
        session={session}
        workouts={workouts}
        onBack={() => setView('scoreboard')}
        onCommitNotes={(notes) => commitSessionNotes(session.id, notes)}
        onOpenExercise={(ex) => {
          setViewingExercise(ex)
          setView('exercise-detail')
        }}
      />
    )
  }

  if (view === 'all-lifts')
    return (
      <AllLiftsScreen
        workouts={workouts}
        onBack={() => setView('home')}
        onDelete={deleteWorkout}
        onOpenExercise={(ex) => {
          setViewingExercise(ex)
          setView('exercise-detail')
        }}
        onEdit={(id) => {
          setEditingWorkoutId(id)
          setEditReturnView('all-lifts')
          setView('edit-workout')
        }}
      />
    )

  if (view === 'exercise-detail' && viewingExercise)
    return (
      <ExerciseDetailScreen
        exercise={viewingExercise}
        workouts={workouts}
        onBack={() => {
          setViewingExercise(null)
          // Try to go back to the most useful prior view
          setView('all-lifts')
        }}
      />
    )

  if (view === 'settings')
    return (
      <SettingsScreen
        workouts={workouts}
        sessions={sessions}
        onBack={() => setView('home')}
        onImport={importData}
        onReset={resetAllData}
      />
    )

  if (view === 'edit-workout' && editingWorkoutId) {
    const w = workouts.find((x) => x.id === editingWorkoutId)
    if (!w) {
      setEditingWorkoutId(null)
      setView(editReturnView)
      return null
    }
    return (
      <EditWorkoutScreen
        workout={w}
        onCancel={() => {
          setEditingWorkoutId(null)
          setView(editReturnView)
        }}
        onSave={(sets) => {
          saveEditedWorkout(w.id, sets)
          setEditingWorkoutId(null)
          setView(editReturnView)
        }}
        onDelete={() => {
          deleteWorkout(w.id)
          setEditingWorkoutId(null)
          setView(editReturnView)
        }}
      />
    )
  }

  // Fallback
  return (
    <Shell>
      <Brand />
      <div className="text-zinc-500 text-sm tracking-[0.2em]">
        UNKNOWN VIEW
      </div>
      <button
        onClick={() => setView('home')}
        className="mt-4 w-full py-3 bg-emerald-600 text-zinc-950 font-display tracking-tight"
      >
        HOME
      </button>
    </Shell>
  )
}

// ============================================================
// HOME SCREEN
// ============================================================

function HomeScreen({
  active,
  workouts,
  sessions,
  plan,
  onStart,
  onResume,
  onSessions,
  onAllLifts,
  onExercise,
  onSettings,
}) {
  const weekAgo = Date.now() - 7 * 86400000
  const weekWorkouts = workouts.filter((w) => w.date >= weekAgo)
  const weekSessions = sessions.filter(
    (s) => s.endTime && s.endTime >= weekAgo,
  )
  const weekAvg =
    weekSessions.length > 0
      ? Math.round(
          weekSessions.reduce((s, x) => s + (x.score || 0), 0) /
            weekSessions.length,
        )
      : null
  const lastScore =
    [...sessions].reverse().find((s) => s.endTime)?.score ?? null

  // Recent exercises (most recent per exercise, top 5)
  const seen = new Set()
  const recent = []
  for (const w of [...workouts].sort((a, b) => b.date - a.date)) {
    if (seen.has(w.exercise)) continue
    seen.add(w.exercise)
    recent.push(w)
    if (recent.length >= 5) break
  }

  return (
    <Shell>
      <div className="flex items-center justify-between pt-6 pb-5">
        <div className="text-2xl font-bold tracking-tight">Lift.Log</div>
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-emerald-500/70" />
          <button
            onClick={onSettings}
            className="p-1.5 -mr-1.5 text-zinc-400 active:text-zinc-100"
            aria-label="Settings"
          >
            <Settings size={18} />
          </button>
        </div>
      </div>

      <div className="mt-1">
        <h1 className="text-5xl font-extrabold tracking-tight leading-[1.05]">
          {active ? 'In session' : 'Ready'}
        </h1>
        <p className="mt-2 text-sm text-zinc-500">
          {active
            ? `Started ${formatTimeOfDay(active.startTime)} · ${active.workouts.length} lift${active.workouts.length === 1 ? '' : 's'}`
            : 'Load the bar'}
        </p>
      </div>

      {/* Week stats */}
      <div className="mt-6 grid grid-cols-3 gap-2">
        <StatTile label="Week" value={weekWorkouts.length} />
        <StatTile label="Avg" value={weekAvg ?? '—'} />
        <StatTile label="Last" value={lastScore ?? '—'} />
      </div>

      {/* Big CTA */}
      <button
        onClick={active ? onResume : onStart}
        className="mt-5 w-full py-5 rounded-2xl bg-emerald-600 text-zinc-950 text-xl font-bold tracking-tight active:bg-emerald-500 flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20"
      >
        <Play size={22} strokeWidth={2.5} />
        {active ? 'Resume session' : 'Start session'}
      </button>

      {/* Today's plan */}
      {!active && plan && plan.exercises.length > 0 && (
        <PlanCard plan={plan} title="Today's plan" />
      )}

      {/* Recent exercises */}
      <div className="mt-7">
        <div className="text-xs text-zinc-500 font-medium">Recent exercises</div>
        <div className="mt-2 bg-zinc-900/40 rounded-2xl divide-y divide-zinc-800/60 overflow-hidden">
          {recent.length === 0 && (
            <div className="px-4 py-4 text-sm text-zinc-500">
              No lifts logged yet
            </div>
          )}
          {recent.map((w) => {
            const rec = getRecommendation(w.exercise, w.muscleGroup, workouts)
            const gap = daysSince(w.date)
            return (
              <button
                key={w.exercise}
                onClick={() => onExercise(w.exercise)}
                className="w-full px-4 py-3 flex items-center justify-between text-left active:bg-zinc-800/40"
              >
                <div className="min-w-0 flex-1 pr-2">
                  <div className="text-sm font-semibold truncate">
                    {w.exercise}
                  </div>
                  <div className="text-xs text-zinc-500 mt-0.5 tabular-nums">
                    {gap === 0 ? 'Today' : `${gap}d ago`} · {w.muscleGroup}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div
                    className={`text-[11px] font-medium tabular-nums ${
                      rec?.type === 'increase'
                        ? 'text-emerald-400'
                        : rec?.type === 'deload'
                          ? 'text-orange-400'
                          : 'text-zinc-400'
                    }`}
                  >
                    {rec?.text || ''}
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Nav */}
      <div className="mt-5 grid grid-cols-2 gap-3">
        <button
          onClick={onSessions}
          className="bg-zinc-900/60 rounded-2xl py-4 flex flex-col items-center gap-1.5 active:bg-zinc-800/60"
        >
          <BarChart3 size={18} className="text-zinc-300" />
          <span className="text-sm text-zinc-300 font-medium">Sessions</span>
        </button>
        <button
          onClick={onAllLifts}
          className="bg-zinc-900/60 rounded-2xl py-4 flex flex-col items-center gap-1.5 active:bg-zinc-800/60"
        >
          <History size={18} className="text-zinc-300" />
          <span className="text-sm text-zinc-300 font-medium">All lifts</span>
        </button>
      </div>
    </Shell>
  )
}

function Stat({ label, value, border }) {
  return (
    <div className={`px-3 py-3 ${border ? 'border-l border-zinc-800' : ''}`}>
      <div className="text-[9px] tracking-[0.2em] text-zinc-500">{label}</div>
      <div className="mt-1 font-display text-2xl tracking-tight">{value}</div>
    </div>
  )
}

// Display the suggested plan. When `onPickExercise` is provided each row
// can be tapped to jump to set entry and shows a check when already done.
function PlanCard({
  plan,
  title = 'Plan',
  completedExercises = null,
  onPickExercise = null,
}) {
  const interactive = typeof onPickExercise === 'function'
  const day = titleCase(plan.dayType)
  const tier = plan.difficulty ? titleCase(plan.difficulty) : null
  return (
    <div className="mt-7">
      <div className="flex items-center justify-between">
        <div className="text-xs text-zinc-500 font-medium">{title}</div>
        <div className="text-xs text-zinc-500 tabular-nums">
          ~{plan.estimatedMinutes} min
        </div>
      </div>
      <div className="mt-2 bg-emerald-950/40 rounded-2xl overflow-hidden ring-1 ring-emerald-900/40">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="min-w-0">
            <div className="flex items-baseline gap-2 flex-wrap">
              <span className="text-xl font-bold tracking-tight text-emerald-300">
                {day} day
              </span>
              {tier && (
                <span
                  className={`text-xs font-medium ${difficultyColor(plan.difficulty)}`}
                >
                  · {tier}
                </span>
              )}
            </div>
            <div className="text-xs text-zinc-400 mt-0.5">
              {plan.focus.join(' + ')}
              {plan.rationale && (
                <> · {plan.rationale.toLowerCase()}</>
              )}
              {typeof plan.readiness === 'number' && (
                <span className="tabular-nums"> · {plan.readiness}% ready</span>
              )}
            </div>
          </div>
          <Dumbbell size={18} className="text-emerald-500 shrink-0" />
        </div>
        <div className="border-t border-emerald-900/40 divide-y divide-emerald-900/30">
          {plan.exercises.map((e, i) => {
            const done =
              completedExercises &&
              completedExercises.some((w) => w.exercise === e.exercise)
            const row = (
              <>
                <div className="min-w-0 flex-1 pr-2">
                  <div
                    className={`text-sm font-semibold ${done ? 'line-through text-zinc-500' : 'text-zinc-100'}`}
                  >
                    {e.exercise}
                  </div>
                  <div className="text-xs text-zinc-500 mt-0.5">
                    <span>{e.muscleGroup}</span>
                    <span className="tabular-nums">
                      {' · '}
                      {e.sets} × {e.reps}
                      {e.weight > 0 ? ` · ${e.weight} lb` : ''}
                    </span>
                    {e.isAnchor && (
                      <span className="text-emerald-500/80"> · compound</span>
                    )}
                  </div>
                </div>
                {done ? (
                  <Check size={14} className="text-emerald-400 shrink-0" />
                ) : interactive ? (
                  <ChevronRight
                    size={14}
                    className="text-zinc-500 shrink-0"
                  />
                ) : null}
              </>
            )
            return interactive ? (
              <button
                key={i}
                onClick={() => onPickExercise(e.exercise, e.muscleGroup)}
                className="w-full px-4 py-3 flex items-center justify-between text-left active:bg-emerald-900/20"
              >
                {row}
              </button>
            ) : (
              <div
                key={i}
                className="px-4 py-3 flex items-center justify-between"
              >
                {row}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ============================================================
// CHECK-IN SCREEN
// ============================================================

function CheckInScreen({ defaultFocus = [], plan, onBack, onBegin }) {
  const [feel, setFeel] = useState(3)
  const [fastingState, setFastingState] = useState('FED')
  const [hoursFasted, setHoursFasted] = useState('')
  const [sleepHours, setSleepHours] = useState('')
  const [energy, setEnergy] = useState('NONE')
  const [focus, setFocus] = useState(defaultFocus)

  const readiness = computeReadiness({ feel, fastingState, sleepHours })
  const difficulty = difficultyTier(readiness)

  const toggleFocus = (g) =>
    setFocus((prev) =>
      prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g],
    )

  return (
    <Shell>
      <TopBar onBack={onBack} title="CHECK-IN" />

      <div className="font-display text-4xl tracking-tight leading-none">
        PRE-FLIGHT
      </div>
      <div className="mt-1 text-[11px] tracking-[0.2em] text-zinc-500">
        LOG STATE BEFORE YOU LIFT
      </div>

      {/* Feel */}
      <div className="mt-6">
        <Label>HOW DO YOU FEEL?</Label>
        <div className="mt-2 grid grid-cols-5 gap-2">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              onClick={() => setFeel(n)}
              className={`py-4 border font-display text-xl tracking-tight ${
                feel === n
                  ? 'bg-emerald-600 border-emerald-600 text-zinc-950'
                  : 'border-zinc-800 text-zinc-300'
              }`}
            >
              {n}
            </button>
          ))}
        </div>
        <div className="mt-2 grid grid-cols-5 text-[10px] tracking-[0.2em] text-zinc-500 text-center">
          <span>DRAINED</span>
          <span />
          <span>AVG</span>
          <span />
          <span>PRIMED</span>
        </div>
      </div>

      {/* Fasting */}
      <div className="mt-6">
        <Label>FASTING STATE</Label>
        <div className="mt-2 grid grid-cols-3 gap-2">
          {FASTING_STATES.map((s) => (
            <button
              key={s}
              onClick={() => setFastingState(s)}
              className={`py-3 border text-xs tracking-[0.2em] ${
                fastingState === s
                  ? 'bg-emerald-600 border-emerald-600 text-zinc-950'
                  : 'border-zinc-800 text-zinc-300'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Numeric inputs */}
      <div className="mt-6 grid grid-cols-2 gap-2">
        <NumField label="HOURS FASTED" value={hoursFasted} onChange={setHoursFasted} />
        <NumField label="SLEEP HRS" value={sleepHours} onChange={setSleepHours} />
      </div>

      {/* Energy */}
      <div className="mt-6">
        <Label>ENERGY SOURCE</Label>
        <div className="mt-2 grid grid-cols-4 gap-2">
          {ENERGY_SOURCES.map((s) => (
            <button
              key={s}
              onClick={() => setEnergy(s)}
              className={`py-3 border text-[11px] tracking-[0.2em] ${
                energy === s
                  ? 'bg-emerald-600 border-emerald-600 text-zinc-950'
                  : 'border-zinc-800 text-zinc-300'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Focus */}
      <div className="mt-6">
        <div className="flex items-center justify-between">
          <Label>FOCUS</Label>
          {plan && (
            <div className={`text-[10px] tracking-[0.2em] ${difficultyColor(difficulty)}`}>
              {plan.dayType} · {difficulty} · {Math.round(readiness * 100)}%
            </div>
          )}
        </div>
        <div className="mt-2 grid grid-cols-3 gap-2">
          {MUSCLE_GROUPS.map((g) => (
            <button
              key={g}
              onClick={() => toggleFocus(g)}
              className={`py-3 border text-[11px] tracking-[0.2em] ${
                focus.includes(g)
                  ? 'bg-emerald-600 border-emerald-600 text-zinc-950'
                  : 'border-zinc-800 text-zinc-300'
              }`}
            >
              {g.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Begin */}
      <button
        onClick={() =>
          onBegin({
            feel,
            fastingState,
            hoursFasted: Number(hoursFasted) || 0,
            sleepHours: Number(sleepHours) || 0,
            energy,
            focus,
          })
        }
        className="mt-8 w-full py-5 bg-emerald-600 text-zinc-950 font-display text-2xl tracking-tight active:bg-emerald-500 flex items-center justify-center gap-2"
      >
        <Play size={22} strokeWidth={2.5} />
        BEGIN SESSION
      </button>
    </Shell>
  )
}

function NumField({ label, value, onChange, placeholder }) {
  return (
    <label className="block">
      <Label>{label}</Label>
      <input
        type="number"
        inputMode="decimal"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-1 w-full bg-zinc-950 border border-zinc-800 px-2 py-3 text-center font-display text-xl tracking-tight focus:outline-none focus:border-zinc-600"
      />
    </label>
  )
}

// ============================================================
// ACTIVE SESSION SCREEN
// ============================================================

function SessionScreen({
  active,
  workouts,
  now,
  onPickMuscle,
  onPickPlannedExercise,
  onCommitNotes,
  onEnd,
  onDeleteWorkout,
  onEditWorkout,
}) {
  const [notesOpen, setNotesOpen] = useState(false)
  const sessionWorkouts = active.workouts
    .map((id) => workouts.find((w) => w.id === id))
    .filter(Boolean)
  const totalSets = sessionWorkouts.reduce(
    (s, w) => s + (w.sets?.length || 0),
    0,
  )
  const totalVolume = sessionWorkouts.reduce(
    (s, w) => s + workoutVolume(w),
    0,
  )

  // Build last-trained map for each muscle group (excluding active session workouts)
  const activeIds = new Set(active.workouts)
  const lastByGroup = {}
  for (const g of MUSCLE_GROUPS) lastByGroup[g] = null
  for (const w of workouts) {
    if (activeIds.has(w.id)) continue
    const g = w.muscleGroup
    if (!g) continue
    if (!lastByGroup[g] || w.date > lastByGroup[g]) lastByGroup[g] = w.date
  }

  function muscleColor(group) {
    const isFocus = active.focus?.includes(group)
    const last = lastByGroup[group]
    const gap = daysSince(last)
    let base = ''
    if (gap === Infinity) base = 'border-zinc-800 text-zinc-300'
    else if (gap <= 1) base = 'border-amber-600/60 text-amber-400'
    else if (gap <= 4) base = 'border-emerald-700/60 text-emerald-400'
    else base = 'border-orange-600/60 text-orange-400'
    if (isFocus) base = 'border-emerald-600 bg-emerald-600 text-zinc-950'
    return base
  }

  function muscleTileClass(group) {
    const isFocus = active.focus?.includes(group)
    if (isFocus) return 'bg-emerald-600 text-zinc-950 font-semibold ring-0'
    const gap = daysSince(lastByGroup[group])
    if (gap === Infinity)
      return 'bg-zinc-900/60 text-zinc-300 ring-1 ring-zinc-800/60'
    if (gap <= 1)
      return 'bg-zinc-900/60 text-amber-400 ring-1 ring-amber-700/30'
    if (gap <= 4)
      return 'bg-zinc-900/60 text-emerald-400 ring-1 ring-emerald-800/30'
    return 'bg-zinc-900/60 text-orange-400 ring-1 ring-orange-700/30'
  }

  return (
    <Shell>
      {/* Header */}
      <div className="flex items-center justify-between pt-6 pb-4">
        <div className="text-2xl font-bold tracking-tight">Lift.Log</div>
        <div className="flex items-center gap-2 text-xs text-zinc-400">
          <span className="flex items-center gap-1">
            <Clock size={12} className="text-emerald-500" />
            <span className="font-mono tabular-nums">
              {formatElapsed(now - active.startTime)}
            </span>
          </span>
          <span className="text-zinc-700">·</span>
          <span className="tabular-nums">Feel {active.feel}</span>
          <span className="text-zinc-700">·</span>
          <span>{titleCase(active.fastingState)}</span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2">
        <StatTile
          label="Lifts"
          value={`${sessionWorkouts.length}/${LIFT_GOAL}`}
        />
        <StatTile label="Sets" value={totalSets} />
        <StatTile label="Volume" value={formatVolume(totalVolume)} />
      </div>

      {/* Notes */}
      <div className="mt-4 bg-zinc-900/60 rounded-2xl overflow-hidden">
        <button
          onClick={() => setNotesOpen((v) => !v)}
          className="w-full flex items-center justify-between px-4 py-3 active:bg-zinc-800/40"
        >
          <div className="flex items-center gap-2 min-w-0">
            <StickyNote size={14} className="text-zinc-400 shrink-0" />
            <span className="text-xs text-zinc-500 shrink-0 font-medium">
              Notes
            </span>
            {!notesOpen && (
              <span className="text-xs text-zinc-400 truncate ml-2">
                {active.notes
                  ? active.notes.split('\n')[0]
                  : 'Tap to add'}
              </span>
            )}
          </div>
          {notesOpen ? (
            <ChevronUp size={16} className="text-zinc-500" />
          ) : (
            <ChevronDown size={16} className="text-zinc-500" />
          )}
        </button>
        {notesOpen && (
          <div className="px-4 pb-3">
            <NotesEditor
              value={active.notes || ''}
              onCommit={onCommitNotes}
              placeholder="How is this going? What feels good or bad?"
            />
          </div>
        )}
      </div>

      {/* Plan */}
      {active.plan && active.plan.exercises.length > 0 && (
        <PlanCard
          plan={active.plan}
          title="Session plan"
          completedExercises={sessionWorkouts}
          onPickExercise={onPickPlannedExercise}
        />
      )}

      {/* Muscle picker */}
      <div className="mt-5">
        <div className="text-xs text-zinc-500 font-medium">
          Or pick any muscle
        </div>
        <div className="mt-2 grid grid-cols-3 gap-2">
          {MUSCLE_GROUPS.map((g) => {
            const last = lastByGroup[g]
            const gap = daysSince(last)
            return (
              <button
                key={g}
                onClick={() => onPickMuscle(g)}
                className={`rounded-xl py-4 px-2 text-center active:bg-zinc-800/40 ${muscleTileClass(g)}`}
              >
                <div className="text-base font-semibold">{g}</div>
                <div className="text-xs mt-0.5 opacity-80 tabular-nums">
                  {gap === Infinity ? 'new' : gap === 0 ? 'today' : `${gap}d`}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Session log */}
      <div className="mt-5">
        <div className="text-xs text-zinc-500 font-medium">Session log</div>
        <div className="mt-2 bg-zinc-900/40 rounded-2xl divide-y divide-zinc-800/60 overflow-hidden">
          {sessionWorkouts.length === 0 && (
            <div className="px-4 py-4 text-sm text-zinc-500">
              No lifts yet — pick a muscle group
            </div>
          )}
          {sessionWorkouts.map((w) => (
            <div
              key={w.id}
              className="px-4 py-3 flex items-start justify-between gap-2"
            >
              <button
                onClick={() => onEditWorkout(w.id)}
                className="min-w-0 flex-1 text-left active:opacity-70"
              >
                <div className="text-sm font-semibold truncate">
                  {w.exercise}
                </div>
                <div className="text-xs text-zinc-500 mt-0.5">
                  <span className="tabular-nums">
                    {formatTimeOfDay(w.date)}
                  </span>
                  {' · '}
                  {w.muscleGroup}
                </div>
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {w.sets.map((s, i) => (
                    <span
                      key={i}
                      className="text-xs px-2 py-0.5 bg-zinc-800/60 rounded-md font-mono tabular-nums text-zinc-200"
                    >
                      {s.reps}×{s.weight}
                    </span>
                  ))}
                </div>
              </button>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => onEditWorkout(w.id)}
                  className="p-2 text-zinc-500 active:text-zinc-100"
                  aria-label="Edit"
                >
                  <Pencil size={14} />
                </button>
                <button
                  onClick={() => onDeleteWorkout(w.id)}
                  className="p-2 text-zinc-600 active:text-red-400"
                  aria-label="Delete"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={onEnd}
        className="mt-6 w-full py-4 rounded-2xl bg-zinc-100/95 text-zinc-950 text-base font-semibold active:bg-zinc-200"
      >
        End session
      </button>
    </Shell>
  )
}

// ============================================================
// LOG PICKER (pick exercise)
// ============================================================

function LogPickerScreen({ muscleGroup, workouts, onBack, onPick }) {
  const [customMode, setCustomMode] = useState(false)
  const [customName, setCustomName] = useState('')

  const list = EXERCISES[muscleGroup] || []

  // Build set of custom exercises ever logged under this muscle group
  const seen = new Set(list)
  const customExercises = []
  for (const w of workouts) {
    if (w.muscleGroup !== muscleGroup) continue
    if (seen.has(w.exercise)) continue
    seen.add(w.exercise)
    customExercises.push(w.exercise)
  }

  function lastSummary(exercise) {
    const last = lastOccurrence(exercise, workouts)
    if (!last) return null
    return last.sets.map((s) => `${s.reps}×${s.weight}`).join(' / ')
  }

  function submitCustom() {
    const name = customName.trim()
    if (!name) return
    onPick(name)
  }

  return (
    <Shell>
      <TopBar
        onBack={onBack}
        title={muscleGroup.toUpperCase()}
      />

      <div className="font-display text-4xl tracking-tight leading-none">
        {muscleGroup.toUpperCase()}
      </div>
      <div className="mt-1 text-[11px] tracking-[0.2em] text-zinc-500">
        PICK AN EXERCISE
      </div>

      <div className="mt-5 border border-zinc-800 divide-y divide-zinc-800">
        {[...list, ...customExercises].map((ex) => {
          const last = lastSummary(ex)
          return (
            <button
              key={ex}
              onClick={() => onPick(ex)}
              className="w-full px-3 py-3 flex items-center justify-between text-left active:bg-zinc-900"
            >
              <div className="min-w-0 flex-1 pr-2">
                <div className="text-sm font-semibold">
                  {ex.toUpperCase()}
                </div>
                <div className="text-[10px] tracking-[0.2em] text-zinc-500 mt-0.5">
                  {last ? `LAST: ${last}` : 'NEVER LOGGED'}
                </div>
              </div>
              <ChevronRight size={16} className="text-zinc-500 shrink-0" />
            </button>
          )
        })}
      </div>

      {!customMode && (
        <button
          onClick={() => setCustomMode(true)}
          className="mt-4 w-full py-4 border border-dashed border-zinc-700 text-zinc-300 flex items-center justify-center gap-2 active:bg-zinc-900"
        >
          <Plus size={16} />
          <span className="text-[11px] tracking-[0.2em]">CUSTOM EXERCISE</span>
        </button>
      )}

      {customMode && (
        <div className="mt-4 border border-zinc-800 p-3">
          <Label>CUSTOM EXERCISE NAME</Label>
          <input
            type="text"
            value={customName}
            onChange={(e) => setCustomName(e.target.value)}
            placeholder="E.G. CABLE PRESS"
            className="mt-2 w-full bg-zinc-950 border border-zinc-800 px-2 py-3 text-sm focus:outline-none focus:border-zinc-600 placeholder:text-zinc-600"
            autoFocus
          />
          <div className="mt-2 grid grid-cols-2 gap-2">
            <button
              onClick={() => {
                setCustomMode(false)
                setCustomName('')
              }}
              className="py-3 border border-zinc-800 text-[11px] tracking-[0.2em]"
            >
              CANCEL
            </button>
            <button
              onClick={submitCustom}
              className="py-3 bg-emerald-600 text-zinc-950 text-[11px] tracking-[0.2em] font-bold"
            >
              CONTINUE
            </button>
          </div>
        </div>
      )}
    </Shell>
  )
}

// ============================================================
// LOG ENTRY (set-by-set)
// ============================================================

const DEFAULT_REST_SECONDS = 90

function LogEntryScreen({
  exercise,
  muscleGroup,
  workouts,
  onBack,
  onFinish,
}) {
  const rec = getRecommendation(exercise, muscleGroup, workouts)
  const lastWorkout = lastOccurrence(exercise, workouts)
  const lastSets = lastWorkout?.sets || []

  const [completed, setCompleted] = useState([])

  const initialWeight = rec?.weight || lastSets[0]?.weight || 0
  const initialReps = rec?.reps || lastSets[0]?.reps || 10
  const [weight, setWeight] = useState(initialWeight)
  const [reps, setReps] = useState(initialReps)

  // Rest timer
  const [restEndTime, setRestEndTime] = useState(null)
  const [restDuration, setRestDuration] = useState(DEFAULT_REST_SECONDS)
  const [now, setNow] = useState(Date.now())
  const vibratedRef = useRef(false)

  useEffect(() => {
    if (!restEndTime) return
    const id = setInterval(() => setNow(Date.now()), 250)
    return () => clearInterval(id)
  }, [restEndTime])

  useEffect(() => {
    if (!restEndTime) return
    if (now < restEndTime) {
      vibratedRef.current = false
      return
    }
    if (!vibratedRef.current && typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate([200, 100, 200])
      } catch {
        /* not supported */
      }
      vibratedRef.current = true
    }
  }, [restEndTime, now])

  const restRemaining = restEndTime
    ? Math.max(0, Math.ceil((restEndTime - now) / 1000))
    : 0

  function startTimer(seconds) {
    vibratedRef.current = false
    setRestEndTime(Date.now() + seconds * 1000)
  }

  function adjustTimer(deltaSec) {
    if (!restEndTime) return
    setRestEndTime((prev) => Math.max(Date.now(), prev + deltaSec * 1000))
  }

  function skipTimer() {
    setRestEndTime(null)
    vibratedRef.current = false
  }

  const setIndex = completed.length + 1

  function recordSet() {
    const w = Number(weight) || 0
    const r = Number(reps) || 0
    if (r <= 0) return
    const next = [...completed, { weight: w, reps: r }]
    setCompleted(next)
    const nextPrev = lastSets[next.length]
    if (nextPrev) {
      setWeight(Number(nextPrev.weight) || w)
      setReps(Number(nextPrev.reps) || r)
    }
    startTimer(restDuration)
  }

  function adjustWeight(delta) {
    setWeight((prev) => Math.max(0, (Number(prev) || 0) + delta))
  }

  function finish() {
    onFinish(completed)
  }

  const plates = platesPerSide(Number(weight))

  return (
    <Shell>
      <SleekBackBar onBack={onBack} title={muscleGroup} />

      <h1 className="text-3xl font-extrabold tracking-tight leading-none">
        {exercise}
      </h1>

      {rec && (
        <div
          className={`mt-3 rounded-xl px-3 py-2 text-xs font-medium ${
            rec.type === 'increase'
              ? 'bg-emerald-950/40 text-emerald-400 ring-1 ring-emerald-900/40'
              : rec.type === 'deload'
                ? 'bg-orange-950/30 text-orange-400 ring-1 ring-orange-900/40'
                : 'bg-zinc-900/60 text-zinc-400'
          }`}
        >
          {rec.text}
        </div>
      )}

      {/* Rest timer banner */}
      {restEndTime && (
        <RestTimerBanner
          remaining={restRemaining}
          total={restDuration}
          onAdjust={adjustTimer}
          onSkip={skipTimer}
        />
      )}

      {/* Set number */}
      <div className="mt-4 flex items-center justify-between">
        <div className="text-2xl font-bold tracking-tight">
          Set {setIndex}
        </div>
        {lastSets[setIndex - 1] && (
          <div className="text-xs text-zinc-500 font-mono tabular-nums">
            Last: {lastSets[setIndex - 1].reps}×{lastSets[setIndex - 1].weight}
          </div>
        )}
      </div>

      {/* Big inputs */}
      <div className="mt-3 grid grid-cols-2 gap-2">
        <BigField label="Weight (lb)" value={weight} onChange={setWeight} />
        <BigField label="Reps" value={reps} onChange={setReps} />
      </div>

      {/* Plate calculator */}
      <div className="mt-2 min-h-[18px] text-center">
        {plates && plates.length > 0 ? (
          <div className="text-xs text-zinc-500 font-mono tabular-nums">
            Per side: {plates.join(' · ')}
          </div>
        ) : Number(weight) >= BAR_WEIGHT ? (
          <div className="text-xs text-zinc-600 font-mono tabular-nums">
            45 lb bar only
          </div>
        ) : null}
      </div>

      {/* Weight adjust buttons */}
      <div className="mt-2 grid grid-cols-4 gap-2">
        {[-10, -5, 5, 10].map((d) => (
          <button
            key={d}
            onClick={() => adjustWeight(d)}
            className="py-3 rounded-xl bg-zinc-900/60 text-sm font-medium active:bg-zinc-800/60 tabular-nums"
          >
            {d > 0 ? `+${d}` : d}
          </button>
        ))}
      </div>

      {/* Completed chips */}
      <div className="mt-3 min-h-[28px] flex flex-wrap gap-1">
        {completed.map((s, i) => (
          <span
            key={i}
            className="text-xs px-2 py-1 rounded-md bg-emerald-950/40 text-emerald-400 flex items-center gap-1 ring-1 ring-emerald-900/40"
          >
            <Check size={10} />
            <span className="font-mono tabular-nums">
              Set {i + 1} · {s.reps}×{s.weight}
            </span>
          </span>
        ))}
      </div>

      {/* Record */}
      <button
        onClick={recordSet}
        className="mt-3 w-full py-4 rounded-2xl bg-emerald-600 text-zinc-950 text-lg font-bold active:bg-emerald-500 shadow-lg shadow-emerald-600/20"
      >
        Record set
      </button>

      {/* Finish */}
      <button
        onClick={finish}
        disabled={completed.length === 0}
        className={`mt-2 w-full py-3 rounded-2xl text-sm font-semibold ${
          completed.length === 0
            ? 'bg-zinc-900/60 text-zinc-600'
            : 'bg-zinc-100/95 text-zinc-950 active:bg-zinc-200'
        }`}
      >
        Finish exercise
      </button>

      {/* Rest duration presets */}
      <div className="mt-4 flex items-center justify-center gap-2 text-xs text-zinc-500">
        <span>Rest:</span>
        {[60, 90, 120, 180].map((s) => (
          <button
            key={s}
            onClick={() => setRestDuration(s)}
            className={`px-2 py-1 rounded-md tabular-nums ${
              restDuration === s
                ? 'bg-zinc-100/10 text-zinc-200 font-semibold'
                : 'text-zinc-500 active:text-zinc-300'
            }`}
          >
            {s}s
          </button>
        ))}
      </div>
    </Shell>
  )
}

function BigField({ label, value, onChange }) {
  return (
    <label className="block">
      <div className="text-[11px] text-zinc-500 font-medium">{label}</div>
      <input
        type="number"
        inputMode="decimal"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full bg-zinc-900/60 rounded-xl px-2 py-4 text-center font-mono tabular-nums text-4xl font-bold focus:outline-none focus:ring-2 focus:ring-emerald-600/40"
      />
    </label>
  )
}

function RestTimerBanner({ remaining, total, onAdjust, onSkip }) {
  const done = remaining <= 0
  const mins = Math.floor(remaining / 60)
  const secs = remaining % 60
  const display = `${mins}:${String(secs).padStart(2, '0')}`
  const pct = total > 0 ? Math.max(0, Math.min(100, (remaining / total) * 100)) : 0

  return (
    <div
      className={`mt-3 rounded-2xl overflow-hidden ring-1 ${
        done
          ? 'bg-emerald-950/50 ring-emerald-600/60'
          : 'bg-zinc-900/60 ring-zinc-800/60'
      }`}
    >
      <div className="px-4 py-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <Timer
            size={16}
            className={done ? 'text-emerald-400' : 'text-zinc-400'}
          />
          <div className="min-w-0">
            <div className="text-[10px] text-zinc-500 font-medium uppercase tracking-wide">
              {done ? 'Rest complete' : 'Resting'}
            </div>
            <div
              className={`text-2xl font-mono tabular-nums font-semibold ${
                done ? 'text-emerald-400' : 'text-zinc-100'
              }`}
            >
              {display}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => onAdjust(-15)}
            className="px-2 py-2 rounded-lg active:bg-zinc-800/60 text-zinc-400 text-xs font-semibold tabular-nums"
          >
            −15
          </button>
          <button
            onClick={() => onAdjust(15)}
            className="px-2 py-2 rounded-lg active:bg-zinc-800/60 text-zinc-400 text-xs font-semibold tabular-nums"
          >
            +15
          </button>
          <button
            onClick={onSkip}
            className="p-2 rounded-lg active:bg-zinc-800/60 text-zinc-400"
            aria-label="Skip rest"
          >
            <SkipForward size={14} />
          </button>
        </div>
      </div>
      <div className="h-1 bg-zinc-950/50">
        <div
          className={`h-full transition-[width] duration-200 ${done ? 'bg-emerald-500' : 'bg-emerald-600'}`}
          style={{ width: `${done ? 100 : pct}%` }}
        />
      </div>
    </div>
  )
}

// ============================================================
// SESSION COMPLETE
// ============================================================

function SessionCompleteScreen({
  session,
  workouts,
  sessions,
  onCommitNotes,
  onDone,
}) {
  const sessionWorkouts = session.workouts
    .map((id) => workouts.find((w) => w.id === id))
    .filter(Boolean)
  const totalVolume = sessionWorkouts.reduce(
    (s, w) => s + workoutVolume(w),
    0,
  )

  const wrap = useMemo(
    () => generateCoachWrapUp(session, workouts, sessions),
    [session, workouts, sessions],
  )

  return (
    <Shell>
      <div className="flex items-center justify-between pt-6 pb-4">
        <div className="text-2xl font-bold tracking-tight">Lift.Log</div>
        <div className="text-xs text-zinc-500 font-medium">
          Session complete
        </div>
      </div>

      {/* Score + label */}
      <div className="mt-1 bg-emerald-950/40 rounded-2xl p-4 ring-1 ring-emerald-900/40 flex items-center justify-between">
        <div>
          <div className="text-xs text-zinc-500 font-medium">Score</div>
          <div className="font-mono tabular-nums text-5xl font-extrabold tracking-tight mt-1 text-emerald-300">
            {session.score}
            <span className="text-2xl text-emerald-700">/100</span>
          </div>
          <div className="mt-1 text-sm font-semibold text-emerald-400">
            {titleCase(scoreLabel(session.score))}
          </div>
        </div>
        <Award size={36} className="text-emerald-500/60" />
      </div>

      {/* Quick stats */}
      <div className="mt-3 grid grid-cols-3 gap-2">
        <StatTile
          label="Duration"
          value={formatDuration(session.startTime, session.endTime)}
        />
        <StatTile label="Lifts" value={sessionWorkouts.length} />
        <StatTile label="Volume" value={formatVolume(totalVolume)} />
      </div>

      {/* Headline */}
      <div className="mt-6">
        <h1 className="text-3xl font-extrabold tracking-tight leading-tight">
          {wrap.headline}
        </h1>
      </div>

      {/* Coach sections */}
      {wrap.wins.length > 0 && (
        <CoachSection
          title="What worked"
          icon={<Sparkles size={14} />}
          accent="emerald"
          items={wrap.wins}
        />
      )}

      {wrap.pushes.length > 0 && (
        <CoachSection
          title="Push next time"
          icon={<Target size={14} />}
          accent="amber"
          items={wrap.pushes}
        />
      )}

      {wrap.advice.length > 0 && (
        <CoachSection
          title="Rest of today"
          icon={<Sun size={14} />}
          accent="zinc"
          items={wrap.advice}
        />
      )}

      {/* Breakdown */}
      <div className="mt-5">
        <div className="text-xs text-zinc-500 font-medium">
          Score breakdown
        </div>
        <div className="mt-2 bg-zinc-900/60 rounded-2xl p-4 space-y-3">
          {Object.values(session.scoreBreakdown).map((b) => (
            <ScoreBar
              key={b.label}
              label={titleCase(b.label.toLowerCase())}
              value={b.value}
              max={b.max}
            />
          ))}
        </div>
      </div>

      {/* Notes */}
      <div className="mt-5">
        <div className="text-xs text-zinc-500 font-medium">Notes</div>
        <div className="mt-2">
          <NotesEditor
            value={session.notes || ''}
            onCommit={onCommitNotes}
            placeholder="How did it go?"
          />
        </div>
      </div>

      <button
        onClick={onDone}
        className="mt-6 w-full py-5 rounded-2xl bg-emerald-600 text-zinc-950 text-xl font-bold active:bg-emerald-500 shadow-lg shadow-emerald-600/20"
      >
        Done
      </button>
    </Shell>
  )
}

function CoachSection({ title, icon, accent, items }) {
  const styles = {
    emerald: {
      ring: 'ring-emerald-900/50',
      bg: 'bg-emerald-950/30',
      text: 'text-emerald-400',
      iconBg: 'bg-emerald-950/60',
    },
    amber: {
      ring: 'ring-amber-900/50',
      bg: 'bg-amber-950/20',
      text: 'text-amber-400',
      iconBg: 'bg-amber-950/40',
    },
    zinc: {
      ring: 'ring-zinc-800/60',
      bg: 'bg-zinc-900/60',
      text: 'text-zinc-300',
      iconBg: 'bg-zinc-800/60',
    },
  }[accent]

  return (
    <div className={`mt-4 rounded-2xl p-4 ring-1 ${styles.ring} ${styles.bg}`}>
      <div className={`flex items-center gap-2 ${styles.text}`}>
        <div className={`p-1.5 rounded-lg ${styles.iconBg}`}>{icon}</div>
        <div className="text-xs font-bold uppercase tracking-wider">
          {title}
        </div>
      </div>
      <div className="mt-3 space-y-3">
        {items.map((item, i) => (
          <div key={i}>
            <div className="text-sm font-semibold text-zinc-100">
              {item.title}
            </div>
            <div className="text-xs text-zinc-400 mt-1 leading-relaxed">
              {item.detail}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function ScoreBar({ label, value, max }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0
  return (
    <div>
      <div className="flex items-center justify-between text-xs">
        <span className="text-zinc-400">{label}</span>
        <span className="text-zinc-300 font-mono tabular-nums">
          {value}/{max}
        </span>
      </div>
      <div className="mt-1 h-1.5 bg-zinc-950/50 rounded-full overflow-hidden">
        <div
          className="h-full bg-emerald-500 rounded-full transition-[width] duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

// ============================================================
// WEEKLY TRENDS CHART
// ============================================================

function TrendsCard({ data }) {
  const width = 320
  const height = 120
  const padX = 14
  const padTop = 14
  const padBottom = 20
  const innerW = width - padX * 2
  const innerH = height - padTop - padBottom
  const n = data.length
  const maxVol = Math.max(1, ...data.map((d) => d.volume))
  const barW = (innerW / n) * 0.65

  const scorePoints = data
    .map((d, i) => {
      if (d.avgScore === null) return null
      const x = padX + (innerW / n) * (i + 0.5)
      const y = padTop + (1 - d.avgScore / 100) * innerH
      return { x, y, score: Math.round(d.avgScore) }
    })
    .filter(Boolean)

  const labelEvery = Math.max(1, Math.ceil(n / 4))

  return (
    <div className="mt-4 bg-zinc-900/60 rounded-2xl p-4">
      <div className="flex items-center justify-between mb-2">
        <div>
          <div className="text-sm font-semibold">Trends</div>
          <div className="text-xs text-zinc-500">
            Last {n} weeks · volume + avg score
          </div>
        </div>
        <div className="flex items-center gap-3 text-[10px] text-zinc-500">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-zinc-600 rounded-sm" />
            <span>Volume</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-0.5 bg-emerald-500" />
            <span>Score</span>
          </div>
        </div>
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full block">
        {/* Score 0/50/100 reference lines */}
        {[0, 0.5, 1].map((f, i) => (
          <line
            key={i}
            x1={padX}
            x2={width - padX}
            y1={padTop + (1 - f) * innerH}
            y2={padTop + (1 - f) * innerH}
            stroke="rgb(39 39 42 / 0.6)"
            strokeWidth="0.5"
            strokeDasharray="2 3"
          />
        ))}
        {/* Bars (volume) */}
        {data.map((d, i) => {
          const h =
            d.volume > 0 ? Math.max(2, (d.volume / maxVol) * innerH) : 0
          const x =
            padX + (innerW / n) * i + (innerW / n - barW) / 2
          const y = padTop + innerH - h
          return (
            <rect
              key={i}
              x={x}
              y={y}
              width={barW}
              height={h}
              fill="rgb(82 82 91)"
              rx="2"
            />
          )
        })}
        {/* Score line */}
        {scorePoints.length > 1 && (
          <polyline
            points={scorePoints.map((p) => `${p.x},${p.y}`).join(' ')}
            fill="none"
            stroke="rgb(16 185 129)"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}
        {scorePoints.map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r="2.5"
            fill="rgb(16 185 129)"
          />
        ))}
        {/* Week date labels */}
        {data.map((d, i) => {
          if (i % labelEvery !== 0 && i !== n - 1) return null
          const x = padX + (innerW / n) * (i + 0.5)
          const label = new Date(d.start).toLocaleDateString('en-US', {
            month: 'numeric',
            day: 'numeric',
          })
          return (
            <text
              key={i}
              x={x}
              y={height - 5}
              textAnchor="middle"
              fontSize="9"
              fill="rgb(113 113 122)"
              fontFamily="JetBrains Mono, monospace"
            >
              {label}
            </text>
          )
        })}
      </svg>
    </div>
  )
}

// ============================================================
// SCOREBOARD
// ============================================================

function ScoreboardScreen({ sessions, workouts, onBack, onOpen }) {
  const completed = sessions.filter((s) => s.endTime)
  const sorted = [...completed].sort((a, b) => b.startTime - a.startTime)
  const avg =
    completed.length > 0
      ? Math.round(
          completed.reduce((s, x) => s + (x.score || 0), 0) /
            completed.length,
        )
      : 0
  const best = completed.reduce(
    (b, x) => Math.max(b, x.score || 0),
    0,
  )

  const weekly = useMemo(
    () => weeklyAgg(sessions, workouts || [], 8),
    [sessions, workouts],
  )
  const hasTrendData = weekly.some((w) => w.sessions > 0)

  return (
    <Shell>
      <TopBar onBack={onBack} title="SCOREBOARD" />

      <div className="font-display text-4xl tracking-tight leading-none">
        SCOREBOARD
      </div>

      <div className="mt-4 grid grid-cols-3 border border-zinc-800">
        <Stat label="SESSIONS" value={completed.length} />
        <Stat label="AVG" value={avg || '—'} border />
        <Stat label="BEST" value={best || '—'} border />
      </div>

      {hasTrendData && <TrendsCard data={weekly} />}

      <div className="mt-5 space-y-2">
        {sorted.length === 0 && (
          <div className="border border-zinc-800 px-3 py-4 text-sm text-zinc-500 tracking-wide">
            NO SESSIONS YET
          </div>
        )}
        {sorted.map((s) => (
          <button
            key={s.id}
            onClick={() => onOpen(s.id)}
            className="w-full text-left border border-zinc-800 px-3 py-3 active:bg-zinc-900"
          >
            <div className="flex items-center justify-between">
              <div className="font-display text-lg tracking-tight">
                {formatDateShort(s.startTime)}
              </div>
              <div className="font-display text-2xl tracking-tight text-emerald-500">
                {s.score ?? '—'}
              </div>
            </div>
            <div className="mt-1 text-[10px] tracking-[0.2em] text-zinc-500">
              {formatDuration(s.startTime, s.endTime)} ·{' '}
              {s.workouts.length} LIFTS · FEEL {s.feel} ·{' '}
              {scoreLabel(s.score || 0)}
            </div>
            {s.notes && (
              <div className="mt-2 text-xs text-zinc-400 line-clamp-2">
                "{s.notes.split('\n')[0]}"
              </div>
            )}
          </button>
        ))}
      </div>
    </Shell>
  )
}

// ============================================================
// SESSION DETAIL
// ============================================================

function SessionDetailScreen({
  session,
  workouts,
  onBack,
  onCommitNotes,
  onOpenExercise,
}) {
  const sessionWorkouts = session.workouts
    .map((id) => workouts.find((w) => w.id === id))
    .filter(Boolean)
  const totalVolume = sessionWorkouts.reduce(
    (s, w) => s + workoutVolume(w),
    0,
  )

  return (
    <Shell>
      <TopBar onBack={onBack} title="SESSION" />

      <div className="font-display text-3xl tracking-tight leading-none">
        {formatDateLong(session.startTime)}
      </div>
      <div className="mt-1 text-[11px] tracking-[0.2em] text-zinc-500">
        {formatDuration(session.startTime, session.endTime)} ·{' '}
        {scoreLabel(session.score || 0)} · SCORE {session.score}
      </div>

      {/* Quick stats */}
      <div className="mt-4 grid grid-cols-3 border border-zinc-800">
        <Stat label="LIFTS" value={sessionWorkouts.length} />
        <Stat
          label="VOLUME"
          value={formatVolume(totalVolume)}
          border
        />
        <Stat label="FEEL" value={session.feel} border />
      </div>

      {/* Context cards */}
      <div className="mt-3 grid grid-cols-3 border border-zinc-800">
        <ContextCell
          label="FASTING"
          value={`${session.fastingState}${session.hoursFasted ? ` ${session.hoursFasted}H` : ''}`}
        />
        <ContextCell label="ENERGY" value={session.energy} border />
        <ContextCell
          label="SLEEP"
          value={session.sleepHours ? `${session.sleepHours}H` : '—'}
          border
        />
      </div>

      {/* Notes */}
      <div className="mt-5">
        <Label>NOTES</Label>
        <div className="mt-2">
          <NotesEditor
            value={session.notes || ''}
            onCommit={onCommitNotes}
            placeholder="NO NOTES"
          />
        </div>
      </div>

      {/* Score breakdown */}
      {session.scoreBreakdown && (
        <div className="mt-5">
          <Label>BREAKDOWN</Label>
          <div className="mt-2 space-y-2">
            {Object.values(session.scoreBreakdown).map((b) => (
              <ScoreBar
                key={b.label}
                label={b.label}
                value={b.value}
                max={b.max}
              />
            ))}
          </div>
        </div>
      )}

      {/* Lifts */}
      <div className="mt-5">
        <Label>LIFTS</Label>
        <div className="mt-2 border border-zinc-800 divide-y divide-zinc-800">
          {sessionWorkouts.length === 0 && (
            <div className="px-3 py-4 text-sm text-zinc-500 tracking-wide">
              NO LIFTS RECORDED
            </div>
          )}
          {sessionWorkouts.map((w) => (
            <button
              key={w.id}
              onClick={() => onOpenExercise(w.exercise)}
              className="w-full text-left px-3 py-3 active:bg-zinc-900"
            >
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold">
                  {w.exercise.toUpperCase()}
                </div>
                <ChevronRight size={14} className="text-zinc-500" />
              </div>
              <div className="text-[10px] tracking-[0.2em] text-zinc-500 mt-0.5">
                {formatTimeOfDay(w.date)} · {w.muscleGroup.toUpperCase()}
              </div>
              <div className="mt-1 flex flex-wrap gap-1">
                {w.sets.map((s, i) => (
                  <span
                    key={i}
                    className="text-[11px] px-1.5 py-0.5 border border-zinc-800 text-zinc-300"
                  >
                    {s.reps}×{s.weight}
                  </span>
                ))}
              </div>
            </button>
          ))}
        </div>
      </div>
    </Shell>
  )
}

function ContextCell({ label, value, border }) {
  return (
    <div className={`px-3 py-3 ${border ? 'border-l border-zinc-800' : ''}`}>
      <div className="text-[9px] tracking-[0.2em] text-zinc-500">{label}</div>
      <div className="mt-1 text-sm font-semibold">{value || '—'}</div>
    </div>
  )
}

// ============================================================
// ALL LIFTS HISTORY
// ============================================================

function AllLiftsScreen({ workouts, onBack, onDelete, onOpenExercise, onEdit }) {
  const sorted = [...workouts].sort((a, b) => b.date - a.date)
  // Group by date string (YYYY-MM-DD)
  const groups = {}
  for (const w of sorted) {
    const key = new Date(w.date).toISOString().slice(0, 10)
    if (!groups[key]) groups[key] = []
    groups[key].push(w)
  }

  return (
    <Shell>
      <TopBar onBack={onBack} title="ALL LIFTS" />

      <div className="flex items-end justify-between">
        <div className="font-display text-4xl tracking-tight leading-none">
          ALL LIFTS
        </div>
        <div className="text-[11px] tracking-[0.2em] text-zinc-500">
          TOTAL {workouts.length}
        </div>
      </div>

      <div className="mt-5 space-y-5">
        {Object.keys(groups).length === 0 && (
          <div className="border border-zinc-800 px-3 py-4 text-sm text-zinc-500 tracking-wide">
            NO LIFTS LOGGED YET
          </div>
        )}
        {Object.entries(groups).map(([day, items]) => (
          <div key={day}>
            <div className="text-[10px] tracking-[0.2em] text-zinc-500">
              {formatDateLong(items[0].date)}
            </div>
            <div className="mt-2 border border-zinc-800 divide-y divide-zinc-800">
              {items.map((w) => (
                <div
                  key={w.id}
                  className="flex items-center justify-between"
                >
                  <button
                    onClick={() => onOpenExercise(w.exercise)}
                    className="flex-1 min-w-0 text-left px-3 py-3 active:bg-zinc-900"
                  >
                    <div className="text-sm font-semibold truncate">
                      {w.exercise.toUpperCase()}
                    </div>
                    <div className="text-[10px] tracking-[0.2em] text-zinc-500 mt-0.5">
                      {w.sets.length} SETS · {formatVolume(workoutVolume(w))} VOL ·{' '}
                      {w.muscleGroup.toUpperCase()}
                    </div>
                  </button>
                  <button
                    onClick={() => onEdit(w.id)}
                    className="px-2 py-3 text-zinc-500 active:text-zinc-100"
                    aria-label="Edit"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() => {
                      if (
                        confirm(
                          `Delete ${w.exercise} (${formatDateLong(w.date)})?`,
                        )
                      )
                        onDelete(w.id)
                    }}
                    className="px-3 py-3 text-zinc-600 active:text-red-400"
                    aria-label="Delete"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Shell>
  )
}

// ============================================================
// EXERCISE DETAIL
// ============================================================

function ExerciseDetailScreen({ exercise, workouts, onBack }) {
  const matches = workouts.filter((w) => w.exercise === exercise)
  const sorted = [...matches].sort((a, b) => b.date - a.date)
  const muscleGroup = sorted[0]?.muscleGroup || ''

  // PR: best set weight overall (with reps), and which workout it belongs to
  let pr = { weight: 0, reps: 0, workoutId: null }
  for (const w of matches) {
    for (const s of w.sets) {
      const wt = Number(s.weight) || 0
      const r = Number(s.reps) || 0
      const score = wt * r
      const prScore = pr.weight * pr.reps
      if (score > prScore) {
        pr = { weight: wt, reps: r, workoutId: w.id }
      }
    }
  }

  const rec = getRecommendation(exercise, muscleGroup, workouts)

  return (
    <Shell>
      <TopBar onBack={onBack} title="EXERCISE" />

      <div className="font-display text-3xl tracking-tight leading-none">
        {exercise.toUpperCase()}
      </div>
      {muscleGroup && (
        <div className="mt-1 text-[11px] tracking-[0.2em] text-zinc-500">
          {muscleGroup.toUpperCase()}
        </div>
      )}

      <div className="mt-4 grid grid-cols-2 border border-zinc-800">
        <Stat
          label="PB"
          value={pr.weight ? `${pr.reps}×${pr.weight}` : '—'}
        />
        <Stat label="SESSIONS" value={matches.length} border />
      </div>

      {rec && (
        <div
          className={`mt-3 border px-3 py-3 text-[11px] tracking-[0.2em] ${
            rec.type === 'increase'
              ? 'border-emerald-700 text-emerald-400'
              : rec.type === 'deload'
                ? 'border-orange-700 text-orange-400'
                : 'border-zinc-800 text-zinc-300'
          }`}
        >
          NEXT: {rec.text}
        </div>
      )}

      <div className="mt-5">
        <Label>TIMELINE</Label>
        <div className="mt-2 border border-zinc-800 divide-y divide-zinc-800">
          {sorted.length === 0 && (
            <div className="px-3 py-4 text-sm text-zinc-500 tracking-wide">
              NO HISTORY
            </div>
          )}
          {sorted.map((w) => (
            <div key={w.id} className="px-3 py-3">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold">
                  {formatDateShort(w.date)}
                </div>
                {w.id === pr.workoutId && (
                  <span className="text-[9px] tracking-[0.2em] px-1.5 py-0.5 border border-emerald-700 text-emerald-400 flex items-center gap-1">
                    <Award size={10} />
                    PR
                  </span>
                )}
              </div>
              <div className="mt-1 flex flex-wrap gap-1">
                {w.sets.map((s, i) => (
                  <span
                    key={i}
                    className="text-[11px] px-1.5 py-0.5 border border-zinc-800 text-zinc-300"
                  >
                    {s.reps}×{s.weight}
                  </span>
                ))}
              </div>
              <div className="text-[10px] tracking-[0.2em] text-zinc-500 mt-1">
                VOL {formatVolume(workoutVolume(w))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </Shell>
  )
}

// ============================================================
// SETTINGS / DATA
// ============================================================

function SleekBackBar({ onBack, title, right }) {
  return (
    <div className="flex items-center justify-between pt-6 pb-4">
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 -ml-2 px-2 py-2 text-zinc-400 active:text-zinc-100"
      >
        <ArrowLeft size={20} />
        <span className="text-sm">Back</span>
      </button>
      <div className="text-xs text-zinc-500 font-medium">{title}</div>
      <div className="min-w-[60px] text-right">{right}</div>
    </div>
  )
}

function SettingsScreen({ workouts, sessions, onBack, onImport, onReset }) {
  const [importText, setImportText] = useState('')
  const [importStatus, setImportStatus] = useState(null)
  const [pasteOpen, setPasteOpen] = useState(false)
  const fileInputRef = useRef(null)

  function handleExport() {
    const data = {
      version: 1,
      exportedAt: new Date().toISOString(),
      workouts,
      sessions,
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `liftlog-backup-${new Date().toISOString().slice(0, 10)}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  function validateAndImport(data) {
    if (!data || typeof data !== 'object') {
      setImportStatus({
        ok: false,
        message: 'Not a valid backup object.',
      })
      return
    }
    const w = Array.isArray(data.workouts) ? data.workouts : null
    const s = Array.isArray(data.sessions) ? data.sessions : null
    if (!w || !s) {
      setImportStatus({
        ok: false,
        message: 'Missing workouts or sessions in backup.',
      })
      return
    }
    const ok = confirm(
      `Replace your current data with ${w.length} workouts + ${s.length} sessions? This wipes your current history.`,
    )
    if (!ok) return
    onImport(w, s)
    setImportStatus({
      ok: true,
      message: `Imported ${w.length} workouts + ${s.length} sessions.`,
    })
    setImportText('')
    setPasteOpen(false)
  }

  function handleFile(file) {
    if (!file) return
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        validateAndImport(JSON.parse(e.target.result))
      } catch {
        setImportStatus({
          ok: false,
          message: 'Could not parse file as JSON.',
        })
      }
    }
    reader.readAsText(file)
  }

  function handlePasteImport() {
    try {
      validateAndImport(JSON.parse(importText))
    } catch {
      setImportStatus({
        ok: false,
        message: 'Could not parse pasted text as JSON.',
      })
    }
  }

  function handleReset() {
    const ok = confirm(
      'Delete ALL workouts and sessions? This cannot be undone (consider exporting first).',
    )
    if (!ok) return
    onReset()
    setImportStatus({ ok: true, message: 'All data cleared.' })
  }

  return (
    <Shell>
      <SleekBackBar onBack={onBack} title="Data" />

      <h1 className="text-4xl font-extrabold tracking-tight leading-none">
        Data
      </h1>
      <p className="mt-1 text-sm text-zinc-500">
        Back up or restore your history.
      </p>

      <div className="mt-6 bg-zinc-900/60 rounded-2xl p-4">
        <div className="text-xs text-zinc-500 font-medium">Current data</div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <div>
            <div className="font-mono tabular-nums text-3xl font-semibold">
              {workouts.length}
            </div>
            <div className="text-xs text-zinc-500 mt-0.5">Workouts</div>
          </div>
          <div>
            <div className="font-mono tabular-nums text-3xl font-semibold">
              {sessions.length}
            </div>
            <div className="text-xs text-zinc-500 mt-0.5">Sessions</div>
          </div>
        </div>
      </div>

      <button
        onClick={handleExport}
        className="mt-4 w-full py-4 rounded-2xl bg-emerald-600 text-zinc-950 font-semibold flex items-center justify-center gap-2 active:bg-emerald-500 shadow-lg shadow-emerald-600/20"
      >
        <Download size={18} />
        Export backup
      </button>

      <div className="mt-6 text-xs text-zinc-500 font-medium">
        Import backup
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="application/json,.json"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
      <button
        onClick={() => fileInputRef.current?.click()}
        className="mt-2 w-full py-4 rounded-2xl bg-zinc-900/60 text-zinc-100 font-semibold flex items-center justify-center gap-2 active:bg-zinc-800/60"
      >
        <Upload size={18} />
        Choose backup file
      </button>

      <button
        onClick={() => setPasteOpen((v) => !v)}
        className="mt-2 w-full text-xs text-zinc-500 py-2 active:text-zinc-300"
      >
        {pasteOpen ? 'Hide paste option' : 'or paste JSON instead'}
      </button>

      {pasteOpen && (
        <div className="mt-1 bg-zinc-900/40 rounded-2xl p-3">
          <textarea
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
            placeholder="Paste backup JSON here"
            className="w-full min-h-[120px] bg-zinc-950/60 rounded-xl px-3 py-2 text-xs placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-600 resize-none ring-1 ring-zinc-800/50 font-mono"
          />
          <button
            onClick={handlePasteImport}
            disabled={!importText.trim()}
            className={`mt-2 w-full py-3 rounded-xl text-sm font-semibold ${
              importText.trim()
                ? 'bg-emerald-600 text-zinc-950 active:bg-emerald-500'
                : 'bg-zinc-800 text-zinc-500'
            }`}
          >
            Import pasted JSON
          </button>
        </div>
      )}

      {importStatus && (
        <div
          className={`mt-3 text-xs ${importStatus.ok ? 'text-emerald-400' : 'text-orange-400'}`}
        >
          {importStatus.message}
        </div>
      )}

      <div className="mt-8 text-xs text-zinc-500 font-medium">
        Danger zone
      </div>
      <button
        onClick={handleReset}
        className="mt-2 w-full py-3 rounded-xl text-sm text-red-400 ring-1 ring-red-900/50 bg-red-950/20 active:bg-red-950/40 font-medium"
      >
        Reset all data
      </button>

      <p className="mt-4 text-xs text-zinc-600 leading-relaxed">
        All data is stored only in this browser's localStorage. Clearing
        Safari data or uninstalling the home-screen app deletes everything
        unless you've exported a backup.
      </p>
    </Shell>
  )
}

// ============================================================
// EDIT WORKOUT
// ============================================================

function EditWorkoutScreen({ workout, onCancel, onSave, onDelete }) {
  const [sets, setSets] = useState(() =>
    (workout.sets || []).map((s) => ({
      weight: String(s.weight ?? ''),
      reps: String(s.reps ?? ''),
    })),
  )

  function updateSet(i, field, value) {
    setSets((prev) =>
      prev.map((s, idx) => (idx === i ? { ...s, [field]: value } : s)),
    )
  }

  function addSet() {
    const last = sets[sets.length - 1]
    setSets((prev) => [
      ...prev,
      {
        weight: last ? last.weight : '0',
        reps: last ? last.reps : '10',
      },
    ])
  }

  function removeSet(i) {
    setSets((prev) => prev.filter((_, idx) => idx !== i))
  }

  function save() {
    const cleaned = sets
      .map((s) => ({
        weight: Number(s.weight) || 0,
        reps: Number(s.reps) || 0,
      }))
      .filter((s) => s.reps > 0)
    if (cleaned.length === 0) {
      const ok = confirm(
        'No valid sets — delete this workout instead?',
      )
      if (!ok) return
      onDelete()
      return
    }
    onSave(cleaned)
  }

  return (
    <Shell>
      <SleekBackBar onBack={onCancel} title="Edit" />

      <h1 className="text-3xl font-extrabold tracking-tight leading-none">
        {workout.exercise}
      </h1>
      <p className="mt-1 text-sm text-zinc-500">
        {workout.muscleGroup} · {formatTimeOfDay(workout.date)} ·{' '}
        {formatDateShort(workout.date)}
      </p>

      <div className="mt-6 text-xs text-zinc-500 font-medium">Sets</div>
      <div className="mt-2 space-y-2">
        {sets.map((s, i) => (
          <div
            key={i}
            className="bg-zinc-900/60 rounded-xl px-3 py-2.5 flex items-center gap-2"
          >
            <span className="text-xs text-zinc-500 font-mono tabular-nums w-12 shrink-0">
              Set {i + 1}
            </span>
            <label className="flex-1 min-w-0">
              <input
                type="number"
                inputMode="decimal"
                value={s.weight}
                onChange={(e) => updateSet(i, 'weight', e.target.value)}
                placeholder="0"
                className="w-full bg-zinc-950/60 rounded-lg px-2 py-2 text-center font-mono tabular-nums text-base ring-1 ring-zinc-800/60 focus:outline-none focus:ring-zinc-600"
              />
              <div className="mt-1 text-[10px] text-zinc-600 text-center">
                lb
              </div>
            </label>
            <span className="text-zinc-600">×</span>
            <label className="flex-1 min-w-0">
              <input
                type="number"
                inputMode="numeric"
                value={s.reps}
                onChange={(e) => updateSet(i, 'reps', e.target.value)}
                placeholder="0"
                className="w-full bg-zinc-950/60 rounded-lg px-2 py-2 text-center font-mono tabular-nums text-base ring-1 ring-zinc-800/60 focus:outline-none focus:ring-zinc-600"
              />
              <div className="mt-1 text-[10px] text-zinc-600 text-center">
                reps
              </div>
            </label>
            <button
              onClick={() => removeSet(i)}
              className="p-2 text-zinc-600 active:text-red-400 shrink-0"
              aria-label="Remove set"
            >
              <X size={16} />
            </button>
          </div>
        ))}
      </div>

      <button
        onClick={addSet}
        className="mt-3 w-full py-3 rounded-xl border border-dashed border-zinc-700 text-zinc-300 flex items-center justify-center gap-2 active:bg-zinc-900/40"
      >
        <Plus size={16} />
        <span className="text-sm">Add set</span>
      </button>

      <div className="mt-6 grid grid-cols-2 gap-2">
        <button
          onClick={() => {
            const ok = confirm('Delete this workout?')
            if (ok) onDelete()
          }}
          className="py-3 rounded-xl text-sm text-red-400 ring-1 ring-red-900/50 bg-red-950/20 active:bg-red-950/40 font-medium"
        >
          Delete
        </button>
        <button
          onClick={save}
          className="py-3 rounded-xl text-sm bg-emerald-600 text-zinc-950 font-semibold active:bg-emerald-500"
        >
          Save changes
        </button>
      </div>
    </Shell>
  )
}
