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
  Star,
  Heart,
  Bike,
} from 'lucide-react'

// ============================================================
// CONSTANTS
// ============================================================

const STORAGE = {
  workouts: 'liftlog:workouts',
  sessions: 'liftlog:sessions',
  active: 'liftlog:active',
  bodyWeight: 'liftlog:bodyWeight',
  planDraft: 'liftlog:planDraft',
  favorites: 'liftlog:favorites',
  thumbs: 'liftlog:thumbs',
  units: 'liftlog:units',
  apiKey: 'liftlog:apiKey',
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

// Equipment types
const EQUIPMENT_TYPES = [
  'barbell',
  'dumbbell',
  'cable',
  'machine',
  'bodyweight',
]
const EQUIPMENT_LABEL = {
  barbell: 'Barbell',
  dumbbell: 'Dumbbell',
  cable: 'Cable',
  machine: 'Machine',
  bodyweight: 'Bodyweight',
  unspecified: 'Other',
}

// Default equipment type per built-in exercise
const EXERCISE_META = {
  // Chest
  'Bench Press': { equip: 'barbell' },
  'Incline Bench Press': { equip: 'barbell' },
  'Dumbbell Bench Press': { equip: 'dumbbell' },
  'Incline Dumbbell Press': { equip: 'dumbbell' },
  'Dumbbell Fly': { equip: 'dumbbell' },
  'Cable Fly': { equip: 'cable' },
  'Push-Up': { equip: 'bodyweight' },
  Dip: { equip: 'bodyweight' },
  // Back
  Deadlift: { equip: 'barbell' },
  'Pull-Up': { equip: 'bodyweight' },
  'Barbell Row': { equip: 'barbell' },
  'Bent-Over Row': { equip: 'barbell' },
  'Lat Pulldown': { equip: 'cable' },
  'Seated Cable Row': { equip: 'cable' },
  'T-Bar Row': { equip: 'machine' },
  'Face Pull': { equip: 'cable' },
  // Shoulders
  'Overhead Press': { equip: 'barbell' },
  'Dumbbell Shoulder Press': { equip: 'dumbbell' },
  'Lateral Raise': { equip: 'dumbbell' },
  'Front Raise': { equip: 'dumbbell' },
  'Rear Delt Fly': { equip: 'dumbbell' },
  'Arnold Press': { equip: 'dumbbell' },
  'Upright Row': { equip: 'barbell' },
  Shrug: { equip: 'barbell' },
  // Arms
  'Barbell Curl': { equip: 'barbell' },
  'Dumbbell Curl': { equip: 'dumbbell' },
  'Hammer Curl': { equip: 'dumbbell' },
  'Preacher Curl': { equip: 'barbell' },
  'Tricep Pushdown': { equip: 'cable' },
  'Skull Crusher': { equip: 'barbell' },
  'Overhead Tricep Extension': { equip: 'dumbbell' },
  'Close-Grip Bench': { equip: 'barbell' },
  // Legs
  Squat: { equip: 'barbell' },
  'Front Squat': { equip: 'barbell' },
  'Leg Press': { equip: 'machine' },
  'Romanian Deadlift': { equip: 'barbell' },
  Lunge: { equip: 'dumbbell' },
  'Leg Curl': { equip: 'machine' },
  'Leg Extension': { equip: 'machine' },
  'Calf Raise': { equip: 'machine' },
  // Core
  Plank: { equip: 'bodyweight', unit: 'seconds' },
  'Hanging Leg Raise': { equip: 'bodyweight' },
  'Russian Twist': { equip: 'bodyweight' },
  'Ab Wheel Rollout': { equip: 'bodyweight' },
  'Cable Crunch': { equip: 'cable' },
  'Sit-Up': { equip: 'bodyweight' },
  'Mountain Climber': { equip: 'bodyweight', unit: 'seconds' },
  'Hollow Hold': { equip: 'bodyweight', unit: 'seconds' },
}

// Muscle-group accent colors used in thumbnails and chips.
const MUSCLE_COLORS = {
  Chest: { bg: 'bg-rose-950/50', ring: 'ring-rose-900/40', text: 'text-rose-300' },
  Back: { bg: 'bg-sky-950/50', ring: 'ring-sky-900/40', text: 'text-sky-300' },
  Shoulders: {
    bg: 'bg-amber-950/50',
    ring: 'ring-amber-900/40',
    text: 'text-amber-300',
  },
  Arms: {
    bg: 'bg-violet-950/50',
    ring: 'ring-violet-900/40',
    text: 'text-violet-300',
  },
  Legs: {
    bg: 'bg-emerald-950/50',
    ring: 'ring-emerald-900/40',
    text: 'text-emerald-300',
  },
  Core: { bg: 'bg-zinc-900', ring: 'ring-zinc-700/50', text: 'text-zinc-300' },
}

const MUSCLE_FALLBACK_COLOR = MUSCLE_COLORS.Core

function exerciseEquip(name, override) {
  if (override) return override
  return EXERCISE_META[name]?.equip || 'unspecified'
}

// Per-exercise unit: 'reps' (default) or 'seconds'. User-set overrides live in
// the `units` map (keyed by exercise name) and beat the built-in defaults.
function exerciseUnit(name, unitsMap) {
  const override = unitsMap?.[name]
  if (override === 'reps' || override === 'seconds') return override
  return EXERCISE_META[name]?.unit || 'reps'
}

const isBodyweight = (equip) => equip === 'bodyweight'
const isBarbell = (equip) => equip === 'barbell'

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

// Descriptions surfaced when the user taps a row in the score breakdown.
const SCORE_DESCRIPTIONS = {
  volume:
    'Total weight × work units across every set. Compared to your recent 4-session average — being above your average pushes this toward full credit.',
  overload:
    "Of the muscle groups you trained with prior history, how many got beaten today (best estimated 1RM). Swapping exercises within a group doesn't hurt — beating any prior best in that group counts.",
  activity:
    'How many lifts you logged. Sigmoid centered at 5 lifts — 3 lifts ≈ 3 pts, 5 lifts = 10 pts, the goal of 10 lifts pegs the meter.',
  repRange:
    'Share of working sets in the 10–12 hypertrophy zone. Weighted by sample size so a single perfect set doesn\'t earn full credit — full weight kicks in at 6+ sets.',
}

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

// Total reps for a set, summing both sides if unilateral
const setReps = (s) => (Number(s.reps) || 0) + (Number(s.repsLeft) || 0)

// "Work units" for a set. For rep-based sets it's just reps. For time-based sets
// (planks etc.) we treat 5 seconds as roughly 1 rep so volume is comparable.
const SECONDS_PER_REP_EQUIV = 5
function setWorkUnits(s) {
  if (s.duration && (!s.reps || Number(s.reps) === 0)) {
    return (Number(s.duration) || 0) / SECONDS_PER_REP_EQUIV
  }
  return setReps(s)
}

// Effective per-rep weight. For Bodyweight exercises, multiply by (bodyWeight
// + addedLoad) so push-ups and pull-ups actually contribute volume.
function setEffectiveWeight(s, equip, bodyWeight) {
  const w = Number(s.weight) || 0
  if (isBodyweight(equip)) {
    const bw = Number(bodyWeight) || 0
    return bw > 0 ? bw + w : Math.max(1, w) // 1 keeps reps countable when BW unset
  }
  return w
}

function workoutVolume(w, bodyWeight = 0) {
  const equip = exerciseEquip(w.exercise, w.equipment)
  return (w.sets || []).reduce(
    (sum, s) => sum + setEffectiveWeight(s, equip, bodyWeight) * setWorkUnits(s),
    0,
  )
}

function bestSetWeight(w, bodyWeight = 0) {
  const equip = exerciseEquip(w.exercise, w.equipment)
  return (w.sets || []).reduce(
    (best, s) =>
      Math.max(best, setEffectiveWeight(s, equip, bodyWeight) * setWorkUnits(s)),
    0,
  )
}

const heaviestWeight = (w) =>
  (w.sets || []).reduce((best, s) => Math.max(best, Number(s.weight) || 0), 0)

// Epley 1RM estimate: weight × (1 + reps / 30)
function epley1RM(weight, reps) {
  if (weight <= 0 || reps <= 0) return 0
  if (reps === 1) return weight
  return weight * (1 + reps / 30)
}

function workoutBest1RM(w, bodyWeight = 0) {
  const equip = exerciseEquip(w.exercise, w.equipment)
  let best = 0
  for (const s of w.sets || []) {
    const ew = setEffectiveWeight(s, equip, bodyWeight)
    const r = setWorkUnits(s)
    const e = epley1RM(ew, r)
    if (e > best) best = e
  }
  return best
}

// Human-readable summary of one set:
//   reps mode  → "10×135", "8R/7L×50", "12 · BW"
//   time mode  → "45s · BW", "30s×25"
function formatSet(set, equip) {
  if (set.duration && (!set.reps || Number(set.reps) === 0)) {
    const d = `${Number(set.duration) || 0}s`
    if (isBodyweight(equip) && (!set.weight || Number(set.weight) === 0)) {
      return `${d} · BW`
    }
    return `${d}×${set.weight}`
  }
  const repsPart =
    set.repsLeft !== undefined && set.repsLeft !== null
      ? `${set.reps}R/${set.repsLeft}L`
      : `${set.reps}`
  if (isBodyweight(equip) && (!set.weight || Number(set.weight) === 0)) {
    return `${repsPart} · BW`
  }
  return `${repsPart}×${set.weight}`
}

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

// Last N workouts for an exercise, most recent first
function recentWorkoutsFor(exercise, workouts, n = 3) {
  return workouts
    .filter((w) => w.exercise === exercise)
    .sort((a, b) => b.date - a.date)
    .slice(0, n)
}

// Last date a muscle group (any exercise) was trained
function lastGroupTrainingDate(muscleGroup, workouts) {
  let latest = 0
  for (const w of workouts) {
    if (w.muscleGroup !== muscleGroup) continue
    if (w.date > latest) latest = w.date
  }
  return latest || null
}

const round5 = (n) => Math.max(0, Math.round(n / 5) * 5)

// Get recommendation for next time doing an exercise.
// Considers: last result, trend across recent workouts, days since the muscle
// group was trained, and (optionally) today's readiness (0..1 from feel).
function getRecommendation(exercise, muscleGroup, workouts, opts = {}) {
  const { readiness = null } = opts
  const last = lastOccurrence(exercise, workouts)
  if (!last)
    return {
      type: 'first',
      text: 'FIRST TIME — START LIGHT',
      weight: 0,
      reps: 10,
    }

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

  // Trend signal: have we already increased the top weight across the last 3
  // sessions? Used to throttle further jumps so we don't compound too fast.
  const recent = recentWorkoutsFor(exercise, workouts, 3)
  const tops = recent
    .slice()
    .reverse()
    .map((w) => Math.max(0, ...w.sets.map((s) => Number(s.weight) || 0)))
  const trendingUp =
    tops.length >= 3 && tops[2] > tops[1] && tops[1] > tops[0]

  // Group recency: if a muscle group is overdue (5+ days), we can push a bit
  // harder; if trained yesterday, hold.
  const lastGroupDate = lastGroupTrainingDate(groupFromLast, workouts)
  const groupGap = daysSince(lastGroupDate)
  const overdue = groupGap !== Infinity && groupGap >= 5
  const freshHit = groupGap === 0

  // Readiness multiplier on the bump: 1 = avg, scales 0.4 → 1.4
  const readinessMult =
    typeof readiness === 'number'
      ? Math.max(0.4, Math.min(1.4, 0.4 + readiness * 1.2))
      : 1

  // Long lay-off → deload
  if (gap > 14) {
    const w = round5(lastWeight * 0.9)
    return {
      type: 'deload',
      text: `${gap}D OFF — DELOAD TO ${w}LB`,
      weight: w,
      reps: 10,
    }
  }

  // Low readiness day → repeat last weight, target middle of rep range
  if (readiness !== null && readiness < 0.35 && lastWeight > 0) {
    return {
      type: 'hold',
      text: `LOW READINESS — REPEAT ${lastWeight}LB × 10`,
      weight: lastWeight,
      reps: 10,
    }
  }

  // Hit 12 across the board → push the weight up, scaled by readiness/recency
  if (allHit12) {
    let adjusted = bump * readinessMult
    if (overdue) adjusted *= 1.1
    if (trendingUp) adjusted *= 0.7
    if (freshHit) adjusted *= 0.7
    const targetBump = Math.max(2.5, round5(adjusted) || 5)
    const next = lastWeight + targetBump
    return {
      type: 'increase',
      text: `+${targetBump}LB → ${next} × 10`,
      weight: next,
      reps: 10,
    }
  }

  if (minReps >= 10) {
    const repTarget =
      readiness !== null && readiness >= 0.65 ? maxReps + 1 : maxReps
    return {
      type: 'push',
      text: `STAY ${lastWeight}LB — PUSH PAST ${repTarget - 1}`,
      weight: lastWeight,
      reps: repTarget,
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
function pickExercisesForGroup(
  group,
  workouts,
  count,
  includeAnchor,
  filter,
  favorites = [],
) {
  const all = [...(EXERCISES[group] || []), ...customInGroup(group, workouts)]
    .filter((e) => (filter ? filter(e) : true))
  if (all.length === 0) return []

  const favSet = new Set(favorites)
  const picks = []
  const used = new Set()

  if (includeAnchor) {
    // Prefer a favorited anchor if there is one
    const anchors = ANCHOR_EXERCISES[group] || []
    const favAnchor = anchors.find((a) => all.includes(a) && favSet.has(a))
    const anchor = favAnchor || anchors.find((a) => all.includes(a))
    if (anchor) {
      picks.push(buildPlanItem(anchor, group, workouts, true))
      used.add(anchor)
    }
  }

  const candidates = all
    .filter((e) => !used.has(e))
    .map((e) => ({
      exercise: e,
      last: lastOccurrence(e, workouts),
      fav: favSet.has(e),
    }))
    .sort((a, b) => {
      // Favorites first
      if (a.fav !== b.fav) return a.fav ? -1 : 1
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

function suggestSessionPlan(workouts, favorites = []) {
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
    ...pickExercisesForGroup(primary, workouts, 3, true, null, favorites),
    ...pickExercisesForGroup(
      secondary,
      workouts,
      2,
      true,
      secondaryFilter,
      favorites,
    ),
  ]

  // Always add 1 core movement on non-LEGS days
  if (primary !== 'Core' && secondary !== 'Core') {
    exercises.push(
      ...pickExercisesForGroup('Core', workouts, 1, false, null, favorites),
    )
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

// 0 = wrecked, 1 = peak. Driven by self-reported feel only; fasting/sleep/energy
// inputs were dropped from check-in (cross-reference from external apps instead).
function computeReadiness({ feel }) {
  return Math.max(0, Math.min(1, (Number(feel || 3) - 1) / 4))
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
  // Compare against best 1RM in the same muscle group, not just the same
  // exercise — swapping dumbbell press for bench press shouldn't be penalized.
  // Denominator is comparable (not session length) so first-time movements
  // don't drag the ratio down.
  let beaten = 0
  let comparable = 0
  sessionWorkouts.forEach((w) => {
    const priorBest = allWorkouts
      .filter(
        (x) =>
          x.muscleGroup === w.muscleGroup &&
          x.id !== w.id &&
          x.date < w.date,
      )
      .reduce((best, p) => Math.max(best, workoutBest1RM(p)), 0)
    if (priorBest > 0) {
      comparable++
      if (workoutBest1RM(w) >= priorBest) beaten++
    }
  })
  const overloadPts = comparable > 0 ? (beaten / comparable) * 25 : 0

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

// ----- CARDIO -----

const CARDIO_TYPES = [
  'Bike',
  'Treadmill',
  'Elliptical',
  'Rowing',
  'Swimming',
  'Stairs',
  'Walking',
  'Other',
]
const CARDIO_INTENSITIES = ['Easy', 'Average', 'Intense']
const CARDIO_INTENSITY_MULT = { Easy: 1.5, Average: 2.5, Intense: 4 }

// Bonus points for cardio attached to a session. Cap +15.
function cardioBonus(entries) {
  if (!entries || entries.length === 0) return 0
  let bonus = 0
  for (const e of entries) {
    const dur = Number(e.durationMin) || 0
    const durFactor = Math.min(2, dur / 30)
    const mult = CARDIO_INTENSITY_MULT[e.intensity] || 1.5
    bonus += durFactor * mult
  }
  return Math.min(15, Math.round(bonus))
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

  // PRs hit this session — a PR is beating any prior best for that exact
  // exercise (still want exact match here since beating "your bench" is a
  // meaningful headline; cross-exercise wins live in the overload score).
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

  // Cardio added on top
  if (session.cardio && session.cardio.length > 0) {
    const totalMin = session.cardio.reduce(
      (s, c) => s + (Number(c.durationMin) || 0),
      0,
    )
    const types = [...new Set(session.cardio.map((c) => c.type))]
      .slice(0, 2)
      .join(' + ')
    wins.push({
      title: 'Added cardio',
      detail: `${totalMin} min of ${types}. Bonus +${cardioBonus(session.cardio)} for the recomp goal.`,
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

  // Sleep (generic — sleepHours no longer captured at check-in)
  advice.push({
    title: 'Protect tonight\'s sleep',
    detail:
      '7–9 hours. CNS rebuilds in deep sleep; cutting it short blunts the work you just did.',
  })

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

// Compact ring + center number for stats with a target (e.g. Lifts toward goal).
function DonutStat({ label, current, goal }) {
  const pct = goal > 0 ? Math.min(1, current / goal) : 0
  const size = 56
  const stroke = 5
  const radius = (size - stroke) / 2
  const c = 2 * Math.PI * radius
  const offset = c * (1 - pct)
  return (
    <div className="rounded-xl bg-zinc-900/60 px-3 py-3 flex flex-col">
      <div className="text-[11px] text-zinc-500 font-medium">{label}</div>
      <div className="relative mt-1 mx-auto" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90 block">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="rgb(39 39 42)"
            strokeWidth={stroke}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="rgb(16 185 129)"
            strokeWidth={stroke}
            strokeDasharray={c}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-[stroke-dashoffset] duration-500"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center leading-none">
          <span className="font-mono tabular-nums text-lg font-bold text-zinc-100">
            {current}
          </span>
          <span className="text-[9px] text-zinc-500 mt-0.5 tabular-nums">
            /{goal}
          </span>
        </div>
      </div>
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

// Visual thumbnail for an exercise — user photo if set, otherwise an
// equipment-icon tile colored by muscle group. Pass `size` for fixed-square,
// or `fill` to stretch into a parent (caller controls width/height).
function ExerciseThumbnail({
  exercise,
  muscleGroup,
  thumbs,
  size = 64,
  fill = false,
  iconSize,
  className = '',
}) {
  const photo = thumbs?.[exercise]
  const color = MUSCLE_COLORS[muscleGroup] || MUSCLE_FALLBACK_COLOR
  const equip = exerciseEquip(exercise)
  const Icon =
    equip === 'cable' || equip === 'machine'
      ? Activity
      : equip === 'bodyweight'
        ? Heart
        : Dumbbell

  const dimStyle = fill ? undefined : { width: size, height: size }

  if (photo) {
    return (
      <div
        className={`overflow-hidden bg-zinc-900 ${fill ? '' : 'rounded-xl ring-1 ring-zinc-800'} ${className}`}
        style={dimStyle}
      >
        <img
          src={photo}
          alt=""
          className="w-full h-full object-cover"
          loading="lazy"
        />
      </div>
    )
  }

  return (
    <div
      className={`flex items-center justify-center ${fill ? '' : 'rounded-xl ring-1'} ${color.bg} ${fill ? '' : color.ring} ${className}`}
      style={dimStyle}
    >
      <Icon
        size={iconSize || size * 0.42}
        className={color.text}
        strokeWidth={1.75}
      />
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
  const [bodyWeight, setBodyWeight] = useState(0)
  const [planDraft, setPlanDraft] = useState(null)
  const [favorites, setFavorites] = useState([])
  const [thumbs, setThumbs] = useState({})
  const [units, setUnits] = useState({})
  const [apiKey, setApiKey] = useState('')

  // Load from localStorage on mount
  useEffect(() => {
    setWorkouts(loadJSON(STORAGE.workouts, []))
    setSessions(loadJSON(STORAGE.sessions, []))
    setActive(loadJSON(STORAGE.active, null))
    setBodyWeight(Number(loadJSON(STORAGE.bodyWeight, 0)) || 0)
    setPlanDraft(loadJSON(STORAGE.planDraft, null))
    setFavorites(loadJSON(STORAGE.favorites, []))
    setThumbs(loadJSON(STORAGE.thumbs, {}))
    setUnits(loadJSON(STORAGE.units, {}))
    setApiKey(loadJSON(STORAGE.apiKey, '') || '')
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
  useEffect(() => {
    if (!loaded) return
    saveJSON(STORAGE.bodyWeight, bodyWeight)
  }, [bodyWeight, loaded])
  useEffect(() => {
    if (!loaded) return
    if (planDraft) saveJSON(STORAGE.planDraft, planDraft)
    else clearKey(STORAGE.planDraft)
  }, [planDraft, loaded])
  useEffect(() => {
    if (!loaded) return
    saveJSON(STORAGE.favorites, favorites)
  }, [favorites, loaded])
  useEffect(() => {
    if (!loaded) return
    saveJSON(STORAGE.thumbs, thumbs)
  }, [thumbs, loaded])
  useEffect(() => {
    if (!loaded) return
    saveJSON(STORAGE.units, units)
  }, [units, loaded])
  useEffect(() => {
    if (!loaded) return
    if (apiKey) saveJSON(STORAGE.apiKey, apiKey)
    else clearKey(STORAGE.apiKey)
  }, [apiKey, loaded])

  function setThumb(exercise, dataUrl) {
    setThumbs((prev) => {
      if (!dataUrl) {
        const { [exercise]: _, ...rest } = prev
        return rest
      }
      return { ...prev, [exercise]: dataUrl }
    })
  }

  function setUnit(exercise, unit) {
    setUnits((prev) => {
      if (!unit || unit === EXERCISE_META[exercise]?.unit) {
        const { [exercise]: _, ...rest } = prev
        return rest
      }
      return { ...prev, [exercise]: unit }
    })
  }

  function renameOrMergeExercise(oldName, newName) {
    const target = (newName || '').trim()
    if (!target || target === oldName) return
    setWorkouts((prev) =>
      prev.map((w) =>
        w.exercise === oldName ? { ...w, exercise: target } : w,
      ),
    )
    // Carry thumbnails / units / favorites along if the target is empty
    setThumbs((prev) => {
      if (!prev[oldName]) return prev
      const { [oldName]: photo, ...rest } = prev
      return { ...rest, [target]: rest[target] || photo }
    })
    setUnits((prev) => {
      if (!prev[oldName]) return prev
      const { [oldName]: u, ...rest } = prev
      return { ...rest, [target]: rest[target] || u }
    })
    setFavorites((prev) => {
      const set = new Set(prev.filter((e) => e !== oldName))
      if (prev.includes(oldName)) set.add(target)
      return Array.from(set)
    })
  }

  function toggleFavorite(exerciseName) {
    setFavorites((prev) =>
      prev.includes(exerciseName)
        ? prev.filter((e) => e !== exerciseName)
        : [...prev, exerciseName],
    )
  }
  const isFavorite = (name) => favorites.includes(name)

  // Timer tick while in active session
  useEffect(() => {
    if (!active || view !== 'session') return
    const id = setInterval(() => setNow(Date.now()), 30000)
    return () => clearInterval(id)
  }, [active, view])

  // Today's suggested plan — recomputed when workouts or favorites change.
  // A draft (user-edited plan) overrides this until session start.
  const todaysPlan = useMemo(
    () => suggestSessionPlan(workouts, favorites),
    [workouts, favorites],
  )
  const resolvedPlan = planDraft || todaysPlan

  // -------------- handlers --------------

  function startSession(checkin) {
    // Snapshot the plan into the session so it doesn't shift mid-session
    // as workouts get logged. Prefer the user's edited draft if present.
    const snapshot = planDraft || suggestSessionPlan(workouts, favorites)
    const readiness = computeReadiness(checkin)
    const adjustedPlan = applyDifficulty(snapshot, readiness)
    const s = {
      id: uid(),
      startTime: Date.now(),
      endTime: null,
      feel: checkin.feel,
      focus: checkin.focus,
      readiness: Math.round(readiness * 100),
      plan: adjustedPlan,
      notes: '',
      workouts: [],
      cardio: [],
    }
    setActive(s)
    setPlanDraft(null) // draft is now baked into the session
    setNow(Date.now())
    setView('session')
  }

  function logWorkout(exercise, muscleGroup, sets, equipment) {
    const filteredSets = sets
      .filter(
        (s) =>
          Number(s.weight) >= 0 &&
          (Number(s.reps) > 0 ||
            Number(s.repsLeft) > 0 ||
            Number(s.duration) > 0),
      )
      .map((s) => {
        const set = {
          weight: Number(s.weight) || 0,
          reps: Number(s.reps) || 0,
        }
        if (s.time) set.time = s.time
        if (s.duration && Number(s.duration) > 0) {
          set.duration = Number(s.duration)
        }
        if (s.repsLeft !== undefined && s.repsLeft !== '' && s.repsLeft !== null) {
          set.repsLeft = Number(s.repsLeft) || 0
        }
        return set
      })
    if (filteredSets.length === 0) {
      setView('session')
      return
    }
    const w = {
      id: uid(),
      date: Date.now(),
      exercise,
      muscleGroup,
      equipment: equipment || exerciseEquip(exercise),
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

  // End session is now a two-step flow: cardio entry → finalize.
  function endSession() {
    if (!active) return
    setView('cardio-entry')
  }

  function finalizeSession(cardioEntries) {
    if (!active) return
    const ended = {
      ...active,
      endTime: Date.now(),
      cardio: cardioEntries || [],
    }
    const { total, breakdown } = calculateScore(ended, sessions, workouts)
    const bonus = cardioBonus(ended.cardio)
    const finalScore = Math.min(100, total + bonus)
    const final = {
      ...ended,
      score: finalScore,
      scoreBreakdown: breakdown,
      scoreBase: total,
      cardioBonusPoints: bonus,
    }
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

  function deleteSession(id) {
    const s = sessions.find((x) => x.id === id)
    if (!s) return
    const workoutIds = new Set(s.workouts || [])
    setSessions((prev) => prev.filter((x) => x.id !== id))
    setWorkouts((prev) => prev.filter((w) => !workoutIds.has(w.id)))
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
        plan={resolvedPlan}
        planIsDraft={!!planDraft}
        thumbs={thumbs}
        hasApiKey={!!apiKey}
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
        onEditPlan={() => setView('plan-editor')}
        onPlanChat={() => setView('plan-chat')}
      />
    )

  if (view === 'plan-editor')
    return (
      <PlanEditorScreen
        plan={resolvedPlan}
        isDraft={!!planDraft}
        onBack={() => setView('home')}
        onSave={(edited) => {
          setPlanDraft(edited)
          setView('home')
        }}
        onReset={() => {
          setPlanDraft(null)
          setView('home')
        }}
      />
    )

  if (view === 'checkin')
    return (
      <CheckInScreen
        defaultFocus={resolvedPlan.focus}
        plan={resolvedPlan}
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
        favorites={favorites}
        thumbs={thumbs}
        onToggleFavorite={toggleFavorite}
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
        bodyWeight={bodyWeight}
        active={active}
        units={units}
        readiness={
          typeof active?.readiness === 'number'
            ? active.readiness / 100
            : null
        }
        onBack={() => {
          setEntryExercise(null)
          setView('log-picker')
        }}
        onFinish={(sets, equipment, finalExerciseName) =>
          logWorkout(
            finalExerciseName || entryExercise.exercise,
            entryExercise.muscleGroup,
            sets,
            equipment,
          )
        }
      />
    )

  if (view === 'cardio-entry' && active)
    return (
      <CardioEntryScreen
        onCancel={() => setView('session')}
        onContinue={(entries) => finalizeSession(entries)}
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
        onDelete={() => {
          deleteSession(session.id)
          setViewingSessionId(null)
          setView('scoreboard')
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
        bodyWeight={bodyWeight}
        isFavorite={isFavorite(viewingExercise)}
        thumb={thumbs[viewingExercise]}
        unit={exerciseUnit(viewingExercise, units)}
        onSetThumb={(d) => setThumb(viewingExercise, d)}
        onSetUnit={(u) => setUnit(viewingExercise, u)}
        onRename={(newName) => {
          renameOrMergeExercise(viewingExercise, newName)
          setViewingExercise(newName)
        }}
        onToggleFavorite={() => toggleFavorite(viewingExercise)}
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
        bodyWeight={bodyWeight}
        apiKey={apiKey}
        onChangeApiKey={setApiKey}
        onChangeBodyWeight={setBodyWeight}
        onRenameExercise={renameOrMergeExercise}
        onBack={() => setView('home')}
        onImport={importData}
        onReset={resetAllData}
      />
    )

  if (view === 'plan-chat')
    return (
      <PlanChatScreen
        plan={resolvedPlan}
        workouts={workouts}
        sessions={sessions}
        apiKey={apiKey}
        onOpenSettings={() => setView('settings')}
        onBack={() => setView('home')}
        onApply={(edited) => {
          setPlanDraft(edited)
          setView('home')
        }}
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
  planIsDraft,
  thumbs = {},
  hasApiKey = false,
  onStart,
  onResume,
  onSessions,
  onAllLifts,
  onExercise,
  onSettings,
  onEditPlan,
  onPlanChat,
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
        <PlanCard
          plan={plan}
          title={planIsDraft ? "Today's plan · edited" : "Today's plan"}
          onEdit={onEditPlan}
          onChat={onPlanChat}
          chatLabel={hasApiKey ? 'Chat' : 'Chat (setup)'}
        />
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
  onEdit = null,
  onChat = null,
  chatLabel = 'Chat',
}) {
  const interactive = typeof onPickExercise === 'function'
  const day = titleCase(plan.dayType)
  const tier = plan.difficulty ? titleCase(plan.difficulty) : null
  return (
    <div className="mt-7">
      <div className="flex items-center justify-between">
        <div className="text-xs text-zinc-500 font-medium">{title}</div>
        <div className="flex items-center gap-2">
          <div className="text-xs text-zinc-500 tabular-nums">
            ~{plan.estimatedMinutes} min
          </div>
          {onChat && (
            <button
              onClick={onChat}
              className="px-2 py-1 text-xs font-medium text-emerald-300 bg-emerald-950/60 rounded-md active:bg-emerald-900/60 flex items-center gap-1 ring-1 ring-emerald-900/40"
              aria-label="Chat to adjust plan"
            >
              <Sparkles size={11} />
              {chatLabel}
            </button>
          )}
          {onEdit && (
            <button
              onClick={onEdit}
              className="px-2 py-1 text-xs font-medium text-zinc-300 bg-zinc-900/60 rounded-md active:bg-zinc-800/60 flex items-center gap-1"
              aria-label="Edit plan"
            >
              <Pencil size={11} />
              Edit
            </button>
          )}
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
  const [focus, setFocus] = useState(defaultFocus)

  const readiness = computeReadiness({ feel })
  const difficulty = difficultyTier(readiness)

  const toggleFocus = (g) =>
    setFocus((prev) =>
      prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g],
    )

  return (
    <Shell>
      <SleekBackBar onBack={onBack} title="Check-in" />

      <h1 className="text-4xl font-extrabold tracking-tight leading-none">
        Pre-flight
      </h1>
      <p className="mt-1 text-sm text-zinc-500">
        Quick check before you lift.
      </p>

      {/* Feel */}
      <div className="mt-6">
        <div className="text-xs text-zinc-500 font-medium">How do you feel?</div>
        <div className="mt-2 grid grid-cols-5 gap-2">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              onClick={() => setFeel(n)}
              className={`py-4 rounded-xl text-xl font-bold tabular-nums ${
                feel === n
                  ? 'bg-emerald-600 text-zinc-950'
                  : 'bg-zinc-900/60 text-zinc-300 active:bg-zinc-800/60'
              }`}
            >
              {n}
            </button>
          ))}
        </div>
        <div className="mt-2 grid grid-cols-5 text-[10px] text-zinc-500 text-center uppercase tracking-wide">
          <span>Drained</span>
          <span />
          <span>Avg</span>
          <span />
          <span>Primed</span>
        </div>
      </div>

      {/* Focus */}
      <div className="mt-7">
        <div className="flex items-center justify-between">
          <div className="text-xs text-zinc-500 font-medium">Focus</div>
          {plan && (
            <div
              className={`text-xs ${difficultyColor(difficulty)}`}
            >
              {titleCase(plan.dayType)} · {titleCase(difficulty)}
            </div>
          )}
        </div>
        <div className="mt-2 grid grid-cols-3 gap-2">
          {MUSCLE_GROUPS.map((g) => (
            <button
              key={g}
              onClick={() => toggleFocus(g)}
              className={`py-3 rounded-xl text-sm font-medium ${
                focus.includes(g)
                  ? 'bg-emerald-600 text-zinc-950'
                  : 'bg-zinc-900/60 text-zinc-300 active:bg-zinc-800/60'
              }`}
            >
              {g}
            </button>
          ))}
        </div>
      </div>

      {/* Begin */}
      <button
        onClick={() => onBegin({ feel, focus })}
        className="mt-8 w-full py-5 rounded-2xl bg-emerald-600 text-zinc-950 text-xl font-bold tracking-tight active:bg-emerald-500 flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20"
      >
        <Play size={22} strokeWidth={2.5} />
        Begin session
      </button>
    </Shell>
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
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2">
        <DonutStat
          label="Lifts"
          current={sessionWorkouts.length}
          goal={LIFT_GOAL}
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
                      {formatSet(s, exerciseEquip(w.exercise, w.equipment))}
                    </span>
                  ))}
                </div>
              </button>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => onEditWorkout(w.id)}
                  className="px-2.5 py-1.5 text-xs font-medium text-zinc-300 bg-zinc-800/60 rounded-md active:bg-zinc-700/60 flex items-center gap-1"
                  aria-label="Edit"
                >
                  <Pencil size={12} />
                  Edit
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

function LogPickerScreen({
  muscleGroup,
  workouts,
  favorites = [],
  thumbs = {},
  onToggleFavorite,
  onBack,
  onPick,
}) {
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

  // Sort: favorites first (in original order), then the rest
  const all = [...list, ...customExercises]
  const favSet = new Set(favorites)
  const sorted = [
    ...all.filter((e) => favSet.has(e)),
    ...all.filter((e) => !favSet.has(e)),
  ]

  function lastSummary(exercise) {
    const last = lastOccurrence(exercise, workouts)
    if (!last) return null
    const equip = exerciseEquip(exercise, last.equipment)
    return last.sets.map((s) => formatSet(s, equip)).join(' / ')
  }

  function submitCustom() {
    const name = customName.trim()
    if (!name) return
    onPick(name)
  }

  return (
    <Shell>
      <SleekBackBar onBack={onBack} title={muscleGroup} />

      <h1 className="text-4xl font-extrabold tracking-tight leading-none">
        {muscleGroup}
      </h1>
      <p className="mt-1 text-sm text-zinc-500">Pick an exercise</p>

      <div className="mt-5 grid grid-cols-2 gap-2.5">
        {sorted.map((ex) => {
          const last = lastSummary(ex)
          const fav = favSet.has(ex)
          return (
            <div
              key={ex}
              className="relative bg-zinc-900/60 rounded-2xl overflow-hidden ring-1 ring-zinc-800/60 active:bg-zinc-800/60"
            >
              <button
                onClick={() => onPick(ex)}
                className="w-full text-left"
              >
                <div className="w-full h-28 relative">
                  <ExerciseThumbnail
                    exercise={ex}
                    muscleGroup={muscleGroup}
                    thumbs={thumbs}
                    fill
                    iconSize={40}
                    className="w-full h-full"
                  />
                </div>
                <div className="px-3 py-2.5">
                  <div className="text-sm font-semibold leading-tight line-clamp-2 min-h-[2.4em]">
                    {ex}
                  </div>
                  <div className="text-[11px] text-zinc-500 mt-1 truncate">
                    {last ? `Last: ${last}` : 'Never logged'}
                  </div>
                </div>
              </button>
              <button
                onClick={() => onToggleFavorite?.(ex)}
                className="absolute top-1.5 right-1.5 p-1.5 rounded-full bg-zinc-950/60 active:opacity-70"
                aria-label={fav ? 'Unstar' : 'Star'}
              >
                <Star
                  size={14}
                  className={
                    fav ? 'text-amber-400 fill-amber-400' : 'text-zinc-400'
                  }
                />
              </button>
            </div>
          )
        })}
      </div>

      {!customMode && (
        <button
          onClick={() => setCustomMode(true)}
          className="mt-4 w-full py-4 rounded-2xl border border-dashed border-zinc-700 text-zinc-300 flex items-center justify-center gap-2 active:bg-zinc-900/40"
        >
          <Plus size={16} />
          <span className="text-sm font-medium">Custom exercise</span>
        </button>
      )}

      {customMode && (
        <div className="mt-4 bg-zinc-900/60 rounded-2xl p-3">
          <div className="text-xs text-zinc-500 font-medium">
            Custom exercise name
          </div>
          <input
            type="text"
            value={customName}
            onChange={(e) => setCustomName(e.target.value)}
            placeholder="e.g. Cable press"
            className="mt-2 w-full bg-zinc-950/60 rounded-xl px-3 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-zinc-600 placeholder:text-zinc-600 ring-1 ring-zinc-800/50"
            autoFocus
          />
          <div className="mt-2 grid grid-cols-2 gap-2">
            <button
              onClick={() => {
                setCustomMode(false)
                setCustomName('')
              }}
              className="py-3 rounded-xl bg-zinc-800/60 text-sm font-medium"
            >
              Cancel
            </button>
            <button
              onClick={submitCustom}
              className="py-3 rounded-xl bg-emerald-600 text-zinc-950 text-sm font-bold active:bg-emerald-500"
            >
              Continue
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
  bodyWeight,
  active,
  units,
  readiness = null,
  onBack,
  onFinish,
}) {
  const rec = getRecommendation(exercise, muscleGroup, workouts, { readiness })
  const lastWorkout = lastOccurrence(exercise, workouts)
  const lastSets = lastWorkout?.sets || []

  // Equipment: previous workout's equipment, else metadata default, else barbell
  const initialEquipment =
    lastWorkout?.equipment ||
    EXERCISE_META[exercise]?.equip ||
    'barbell'
  const [equipment, setEquipment] = useState(initialEquipment)

  // Per-exercise mode (reps vs seconds). Defaults from metadata/user override.
  const exerciseDefaultUnit = exerciseUnit(exercise, units)
  const [unit, setUnitLocal] = useState(exerciseDefaultUnit)
  const isTime = unit === 'seconds'

  // L/R toggle — auto-on if the previous workout had repsLeft
  const initialUnilateral = lastSets.some(
    (s) => s.repsLeft !== undefined && s.repsLeft !== null,
  )
  const [unilateral, setUnilateral] = useState(initialUnilateral)

  const [completed, setCompleted] = useState([])

  const bw = isBodyweight(equipment)
  const showVariant = equipment === 'machine' || equipment === 'cable'
  const [variant, setVariant] = useState('')

  // Goal-based defaults: weight/reps reflect the recommendation, not the
  // previous result. Falls back to last only when there's no rec at all.
  const goalWeight = rec?.weight ?? lastSets[0]?.weight ?? 0
  const goalReps = rec?.reps ?? 10
  const goalDuration = isTime ? lastSets[0]?.duration || 30 : 0

  const [weight, setWeight] = useState(bw ? 0 : goalWeight)
  const [reps, setReps] = useState(goalReps)
  const [repsLeft, setRepsLeft] = useState(goalReps)
  const [duration, setDuration] = useState(goalDuration || 30)

  // Rest timer
  const [restEndTime, setRestEndTime] = useState(null)
  const [restDuration, setRestDuration] = useState(DEFAULT_REST_SECONDS)
  const [now, setNow] = useState(Date.now())
  const vibratedRef = useRef(false)

  // Tick at 1Hz when either the rest timer is running or there's an active
  // session — this drives the live stats banner.
  useEffect(() => {
    if (!restEndTime && !active) return
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [restEndTime, active])

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
    if (isTime) {
      const d = Number(duration) || 0
      if (d <= 0) return
      const newSet = { weight: w, reps: 0, duration: d, time: Date.now() }
      setCompleted((prev) => [...prev, newSet])
    } else {
      const r = Number(reps) || 0
      const rL = Number(repsLeft) || 0
      if (r <= 0 && rL <= 0) return
      const newSet = { weight: w, reps: r, time: Date.now() }
      if (unilateral) newSet.repsLeft = rL
      setCompleted((prev) => [...prev, newSet])
    }
    // Defaults for the next set: stay on the goal — don't drift back to the
    // previous workout's matching set (which is what caused weight to "reset"
    // between sets before).
    if (!bw) setWeight(goalWeight)
    setReps(goalReps)
    setRepsLeft(goalReps)
    if (isTime) setDuration(goalDuration || duration)
    startTimer(restDuration)
  }

  function adjustWeight(delta) {
    setWeight((prev) => Math.max(0, (Number(prev) || 0) + delta))
  }

  function adjustDuration(delta) {
    setDuration((prev) => Math.max(5, (Number(prev) || 0) + delta))
  }

  function finish() {
    // Bake the machine variant into the exercise name so history splits per
    // machine. Only applies when the user typed something AND equipment is
    // machine/cable.
    const trimmed = (variant || '').trim()
    const finalName =
      showVariant && trimmed ? `${exercise} — ${trimmed}` : null
    onFinish(completed, equipment, finalName)
  }

  function removeCompletedSet(idx) {
    setCompleted((prev) => prev.filter((_, i) => i !== idx))
  }

  const plates = isBarbell(equipment) ? platesPerSide(Number(weight)) : null
  const weightLabel = bw ? 'Added (lb)' : 'Weight (lb)'

  // Session stats banner — combines the session-so-far with this in-progress
  // exercise's completed sets and a projected volume contribution.
  const sessionWorkouts = active
    ? active.workouts
        .map((id) => workouts.find((w) => w.id === id))
        .filter(Boolean)
    : []
  const sessionLifts = sessionWorkouts.length
  const sessionSets =
    sessionWorkouts.reduce((s, w) => s + (w.sets?.length || 0), 0) +
    completed.length
  const sessionVol =
    sessionWorkouts.reduce((s, w) => s + workoutVolume(w), 0) +
    completed.reduce(
      (s, st) =>
        s + setEffectiveWeight(st, equipment, bodyWeight) * setWorkUnits(st),
      0,
    )
  const elapsedMs = active ? now - active.startTime : 0

  return (
    <Shell>
      <SleekBackBar onBack={onBack} title={muscleGroup} />

      <h1 className="text-3xl font-extrabold tracking-tight leading-none">
        {exercise}
      </h1>

      {/* Live session stats — only if we're in an active session */}
      {active && (
        <div className="mt-3 bg-zinc-900/60 rounded-xl px-3 py-2.5 flex items-center justify-between text-xs">
          <span className="flex items-center gap-1.5 text-emerald-400">
            <Clock size={12} />
            <span className="font-mono tabular-nums">
              {formatElapsed(elapsedMs)}
            </span>
          </span>
          <span className="text-zinc-500">
            <span className="text-zinc-200 font-semibold tabular-nums">
              {sessionLifts}
            </span>{' '}
            lifts
          </span>
          <span className="text-zinc-500">
            <span className="text-zinc-200 font-semibold tabular-nums">
              {sessionSets}
            </span>{' '}
            sets
          </span>
          <span className="text-zinc-500">
            <span className="text-zinc-200 font-semibold tabular-nums">
              {formatVolume(Math.round(sessionVol))}
            </span>{' '}
            vol
          </span>
        </div>
      )}

      {/* Equipment + unit pickers */}
      <div className="mt-3 flex flex-wrap gap-1.5">
        {EQUIPMENT_TYPES.map((e) => (
          <button
            key={e}
            onClick={() => {
              setEquipment(e)
              if (e === 'bodyweight' && Number(weight) === 0) setWeight(0)
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
              equipment === e
                ? 'bg-emerald-600 text-zinc-950'
                : 'bg-zinc-900/60 text-zinc-400 active:bg-zinc-800/60'
            }`}
          >
            {EQUIPMENT_LABEL[e]}
          </button>
        ))}
        <button
          onClick={() => setUnitLocal(isTime ? 'reps' : 'seconds')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
            isTime
              ? 'bg-amber-600 text-zinc-950'
              : 'bg-zinc-900/60 text-zinc-400 active:bg-zinc-800/60'
          }`}
          title="Switch between reps and time"
        >
          {isTime ? 'Time' : 'Reps'}
        </button>
      </div>

      {/* Optional machine variant */}
      {showVariant && (
        <div className="mt-3 bg-zinc-900/60 rounded-xl p-3">
          <div className="text-[10px] text-zinc-500 font-medium tracking-wide uppercase">
            Machine / brand <span className="opacity-60">— optional</span>
          </div>
          <input
            type="text"
            value={variant}
            onChange={(e) => setVariant(e.target.value)}
            placeholder="e.g. Hammer Strength"
            className="mt-1.5 w-full bg-zinc-950/60 rounded-lg px-2.5 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-zinc-600 placeholder:text-zinc-600 ring-1 ring-zinc-800/50"
          />
          <p className="mt-1.5 text-[11px] text-zinc-500 leading-snug">
            Different machines won't translate weight-for-weight — naming the
            machine keeps history separate per piece of equipment.
          </p>
        </div>
      )}

      {rec && !bw && !isTime && (
        <div
          className={`mt-3 rounded-xl px-3 py-2 text-xs font-medium ${
            rec.type === 'increase'
              ? 'bg-emerald-950/40 text-emerald-400 ring-1 ring-emerald-900/40'
              : rec.type === 'deload' || rec.type === 'hold'
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

      {/* Set number + L/R toggle */}
      <div className="mt-4 flex items-center justify-between">
        <div className="text-2xl font-bold tracking-tight">
          Set {setIndex}
        </div>
        <div className="flex items-center gap-3">
          {lastSets[setIndex - 1] && (
            <div className="text-xs text-zinc-500 font-mono tabular-nums">
              Last:{' '}
              {formatSet(
                lastSets[setIndex - 1],
                exerciseEquip(exercise, lastWorkout?.equipment),
              )}
            </div>
          )}
          {!isTime && (
            <button
              onClick={() => setUnilateral((v) => !v)}
              className={`px-2 py-1 rounded-md text-[11px] font-semibold ${
                unilateral
                  ? 'bg-emerald-600 text-zinc-950'
                  : 'bg-zinc-900/60 text-zinc-400'
              }`}
            >
              L/R
            </button>
          )}
        </div>
      </div>

      {/* Inputs */}
      {isTime ? (
        <div className="mt-3 grid grid-cols-2 gap-2">
          <BigField label={weightLabel} value={weight} onChange={setWeight} />
          <BigField label="Time (s)" value={duration} onChange={setDuration} />
        </div>
      ) : unilateral ? (
        <div className="mt-3 grid grid-cols-3 gap-2">
          <BigField label={weightLabel} value={weight} onChange={setWeight} />
          <BigField label="Right" value={reps} onChange={setReps} />
          <BigField label="Left" value={repsLeft} onChange={setRepsLeft} />
        </div>
      ) : (
        <div className="mt-3 grid grid-cols-2 gap-2">
          <BigField label={weightLabel} value={weight} onChange={setWeight} />
          <BigField label="Reps" value={reps} onChange={setReps} />
        </div>
      )}

      {/* Plate calculator (barbell only) */}
      <div className="mt-2 min-h-[18px] text-center">
        {plates && plates.length > 0 ? (
          <div className="text-xs text-zinc-500 font-mono tabular-nums">
            Per side: {plates.join(' · ')}
          </div>
        ) : isBarbell(equipment) && Number(weight) >= BAR_WEIGHT ? (
          <div className="text-xs text-zinc-600 font-mono tabular-nums">
            45 lb bar only
          </div>
        ) : bw && Number(bodyWeight) > 0 ? (
          <div className="text-xs text-zinc-600">
            Body weight {bodyWeight} lb + added{' '}
            {Number(weight) > 0 ? `${weight} lb` : '0'}
          </div>
        ) : bw ? (
          <div className="text-xs text-zinc-600">
            Set body weight in Settings for accurate volume
          </div>
        ) : null}
      </div>

      {/* Weight / duration quick adjust */}
      <div className="mt-2 grid grid-cols-4 gap-2">
        {(isTime ? [-15, -5, 5, 15] : [-10, -5, 5, 10]).map((d) => (
          <button
            key={d}
            onClick={() => (isTime ? adjustDuration(d) : adjustWeight(d))}
            className="py-3 rounded-xl bg-zinc-900/60 text-sm font-medium active:bg-zinc-800/60 tabular-nums"
          >
            {d > 0 ? `+${d}` : d}
            {isTime && <span className="text-[10px] text-zinc-500">s</span>}
          </button>
        ))}
      </div>

      {/* Completed chips — tap to remove */}
      <div className="mt-3 min-h-[28px] flex flex-wrap gap-1">
        {completed.map((s, i) => (
          <button
            key={i}
            onClick={() => removeCompletedSet(i)}
            className="text-xs px-2 py-1 rounded-md bg-emerald-950/40 text-emerald-400 flex items-center gap-1 ring-1 ring-emerald-900/40 active:bg-emerald-900/40"
            aria-label={`Remove set ${i + 1}`}
          >
            <Check size={10} />
            <span className="font-mono tabular-nums">
              Set {i + 1} · {formatSet(s, equipment)}
            </span>
            <X size={10} className="ml-0.5 opacity-60" />
          </button>
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
          {session.cardioBonusPoints > 0 && (
            <div className="mt-1 text-[11px] text-emerald-400/80 font-mono tabular-nums">
              {session.scoreBase} base + {session.cardioBonusPoints} cardio
            </div>
          )}
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

      {/* Cardio entries */}
      {session.cardio && session.cardio.length > 0 && (
        <div className="mt-4">
          <div className="text-xs text-zinc-500 font-medium flex items-center gap-1.5">
            <Bike size={12} />
            Cardio
          </div>
          <div className="mt-2 bg-zinc-900/60 rounded-2xl divide-y divide-zinc-800/60 overflow-hidden">
            {session.cardio.map((c) => (
              <div
                key={c.id}
                className="px-4 py-2.5 flex items-center justify-between text-sm"
              >
                <span className="font-medium">
                  {c.type}{' '}
                  <span className="text-zinc-500 font-normal">
                    · {c.intensity}
                  </span>
                </span>
                <span className="font-mono tabular-nums text-zinc-400">
                  {c.durationMin} min
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

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
        <div className="mt-2 bg-zinc-900/60 rounded-2xl p-4 space-y-2">
          {Object.entries(session.scoreBreakdown).map(([key, b]) => (
            <ExpandableScoreBar
              key={key}
              label={titleCase(b.label.toLowerCase())}
              value={b.value}
              max={b.max}
              description={SCORE_DESCRIPTIONS[key]}
            />
          ))}
          <p className="text-[11px] text-zinc-600 leading-snug pt-1">
            Tap a row for what it measures and how it's scored.
          </p>
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

function ExpandableScoreBar({ label, value, max, description }) {
  const [open, setOpen] = useState(false)
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0
  return (
    <div>
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full text-left py-1 active:opacity-70"
      >
        <div className="flex items-center justify-between text-xs">
          <span className="text-zinc-400 flex items-center gap-1">
            {label}
            {description && (
              <ChevronDown
                size={11}
                className={`text-zinc-600 transition-transform ${
                  open ? 'rotate-180' : ''
                }`}
              />
            )}
          </span>
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
      </button>
      {open && description && (
        <p className="mt-1.5 mb-1 text-[11px] text-zinc-500 leading-relaxed">
          {description}
        </p>
      )}
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
  onDelete,
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

      {/* Cardio (if logged) */}
      {session.cardio && session.cardio.length > 0 && (
        <div className="mt-4">
          <Label>CARDIO</Label>
          <div className="mt-2 border border-zinc-800 divide-y divide-zinc-800">
            {session.cardio.map((c) => (
              <div
                key={c.id}
                className="px-3 py-2 flex items-center justify-between text-xs"
              >
                <span>
                  {c.type.toUpperCase()} · {c.intensity.toUpperCase()}
                </span>
                <span className="tabular-nums text-zinc-400">
                  {c.durationMin} MIN
                </span>
              </div>
            ))}
            {session.cardioBonusPoints > 0 && (
              <div className="px-3 py-2 bg-emerald-950/30 text-[10px] tracking-[0.2em] text-emerald-400 flex items-center justify-between">
                <span>CARDIO BONUS</span>
                <span className="tabular-nums font-bold">
                  +{session.cardioBonusPoints}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

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
            {Object.entries(session.scoreBreakdown).map(([key, b]) => (
              <ExpandableScoreBar
                key={key}
                label={b.label}
                value={b.value}
                max={b.max}
                description={SCORE_DESCRIPTIONS[key]}
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
                {formatTimeOfDay(w.date)} · {w.muscleGroup.toUpperCase()} ·{' '}
                {(EQUIPMENT_LABEL[exerciseEquip(w.exercise, w.equipment)] || 'OTHER').toUpperCase()}
              </div>
              <div className="mt-1 flex flex-wrap gap-1">
                {w.sets.map((s, i) => (
                  <span
                    key={i}
                    className="text-[11px] px-1.5 py-0.5 border border-zinc-800 text-zinc-300"
                  >
                    {formatSet(s, exerciseEquip(w.exercise, w.equipment))}
                  </span>
                ))}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Delete session */}
      {onDelete && (
        <button
          onClick={() => {
            const ok = confirm(
              `Delete this session? ${sessionWorkouts.length} workout${sessionWorkouts.length === 1 ? '' : 's'} logged during it will also be removed. This can't be undone.`,
            )
            if (ok) onDelete()
          }}
          className="mt-6 w-full py-3 rounded-xl text-sm text-red-400 ring-1 ring-red-900/50 bg-red-950/20 active:bg-red-950/40 font-medium flex items-center justify-center gap-2"
        >
          <Trash2 size={14} />
          Delete this session
        </button>
      )}
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
                    className="px-2.5 py-1.5 mr-1 text-xs font-medium text-zinc-300 bg-zinc-800/60 rounded-md active:bg-zinc-700/60 flex items-center gap-1"
                    aria-label="Edit"
                  >
                    <Pencil size={12} />
                    Edit
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

function ExerciseDetailScreen({
  exercise,
  workouts,
  bodyWeight = 0,
  isFavorite = false,
  thumb,
  unit = 'reps',
  onSetThumb,
  onSetUnit,
  onRename,
  onToggleFavorite,
  onBack,
}) {
  const matches = workouts.filter((w) => w.exercise === exercise)
  const sorted = [...matches].sort((a, b) => b.date - a.date)
  const muscleGroup = sorted[0]?.muscleGroup || ''
  const fileRef = useRef(null)
  const [renaming, setRenaming] = useState(false)
  const [newName, setNewName] = useState(exercise)

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

  // Series for the 1RM chart (chronological, best 1RM per workout)
  const oneRMSeries = [...matches]
    .sort((a, b) => a.date - b.date)
    .map((w) => ({ date: w.date, oneRM: workoutBest1RM(w, bodyWeight) }))
    .filter((p) => p.oneRM > 0)
  const latestOneRM =
    oneRMSeries.length > 0
      ? Math.round(oneRMSeries[oneRMSeries.length - 1].oneRM)
      : null

  const rec = getRecommendation(exercise, muscleGroup, workouts)

  // Resize + compress on upload to keep localStorage manageable
  function handlePhoto(file) {
    if (!file) return
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        const max = 512
        const scale = Math.min(1, max / Math.max(img.width, img.height))
        const w = Math.round(img.width * scale)
        const h = Math.round(img.height * scale)
        const canvas = document.createElement('canvas')
        canvas.width = w
        canvas.height = h
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0, w, h)
        try {
          const dataUrl = canvas.toDataURL('image/jpeg', 0.78)
          onSetThumb?.(dataUrl)
        } catch {
          onSetThumb?.(e.target.result)
        }
      }
      img.src = e.target.result
    }
    reader.readAsDataURL(file)
  }

  return (
    <Shell>
      <TopBar onBack={onBack} title="EXERCISE" />

      <div className="flex items-start gap-3">
        <button
          onClick={() => fileRef.current?.click()}
          className="shrink-0 active:opacity-80"
          aria-label="Set thumbnail"
        >
          <ExerciseThumbnail
            exercise={exercise}
            muscleGroup={muscleGroup}
            thumbs={thumb ? { [exercise]: thumb } : {}}
            size={72}
            iconSize={30}
          />
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => handlePhoto(e.target.files?.[0])}
        />
        <div className="min-w-0 flex-1">
          {renaming ? (
            <div className="flex items-center gap-1">
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="flex-1 bg-zinc-950/60 rounded-lg px-2 py-1.5 text-sm font-semibold ring-1 ring-zinc-800/60 focus:outline-none focus:ring-zinc-600"
                autoFocus
              />
              <button
                onClick={() => {
                  if (newName.trim() && newName.trim() !== exercise) {
                    onRename?.(newName.trim())
                  }
                  setRenaming(false)
                }}
                className="px-2 py-1.5 rounded-md text-xs font-semibold bg-emerald-600 text-zinc-950 active:bg-emerald-500"
              >
                Save
              </button>
              <button
                onClick={() => {
                  setRenaming(false)
                  setNewName(exercise)
                }}
                className="px-2 py-1.5 rounded-md text-xs text-zinc-500"
              >
                Cancel
              </button>
            </div>
          ) : (
            <div className="font-display text-2xl tracking-tight leading-tight break-words">
              {exercise.toUpperCase()}
            </div>
          )}
          {muscleGroup && !renaming && (
            <div className="mt-1 text-[11px] tracking-[0.2em] text-zinc-500">
              {muscleGroup.toUpperCase()}
            </div>
          )}
          <div className="mt-2 flex items-center flex-wrap gap-1.5 text-[11px]">
            <button
              onClick={() => fileRef.current?.click()}
              className="px-2 py-1 rounded-md bg-zinc-900/60 text-zinc-300 active:bg-zinc-800/60"
            >
              {thumb ? 'Change photo' : 'Add photo'}
            </button>
            {thumb && (
              <button
                onClick={() => onSetThumb?.(null)}
                className="px-2 py-1 rounded-md text-zinc-500 active:text-red-400"
              >
                Remove
              </button>
            )}
            {onRename && (
              <button
                onClick={() => setRenaming((v) => !v)}
                className="px-2 py-1 rounded-md bg-zinc-900/60 text-zinc-300 active:bg-zinc-800/60 flex items-center gap-1"
              >
                <Pencil size={11} /> Rename / merge
              </button>
            )}
            {onSetUnit && (
              <button
                onClick={() => onSetUnit(unit === 'seconds' ? 'reps' : 'seconds')}
                className={`px-2 py-1 rounded-md ${
                  unit === 'seconds'
                    ? 'bg-amber-600 text-zinc-950'
                    : 'bg-zinc-900/60 text-zinc-300'
                } active:opacity-80`}
              >
                {unit === 'seconds' ? 'Time mode' : 'Reps mode'}
              </button>
            )}
          </div>
        </div>
        {onToggleFavorite && (
          <button
            onClick={onToggleFavorite}
            className="p-2 -mt-1 -mr-2 active:opacity-70"
            aria-label={isFavorite ? 'Unstar' : 'Star'}
          >
            <Star
              size={22}
              className={
                isFavorite
                  ? 'text-amber-400 fill-amber-400'
                  : 'text-zinc-600'
              }
            />
          </button>
        )}
      </div>

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

      {oneRMSeries.length >= 2 && (
        <div className="mt-4">
          <ExerciseProgressChart
            series={oneRMSeries}
            latest={latestOneRM}
          />
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
                    {formatSet(s, exerciseEquip(w.exercise, w.equipment))}
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

function SettingsScreen({
  workouts,
  sessions,
  bodyWeight,
  apiKey = '',
  onChangeApiKey,
  onChangeBodyWeight,
  onRenameExercise,
  onBack,
  onImport,
  onReset,
}) {
  const [importText, setImportText] = useState('')
  const [importStatus, setImportStatus] = useState(null)
  const [pasteOpen, setPasteOpen] = useState(false)
  const [csvRange, setCsvRange] = useState(30) // days; 0 = all
  const [bwInput, setBwInput] = useState(String(bodyWeight || ''))
  const [keyInput, setKeyInput] = useState(apiKey || '')
  const [keyVisible, setKeyVisible] = useState(false)
  const [libraryOpen, setLibraryOpen] = useState(false)
  const [renamingExercise, setRenamingExercise] = useState(null)
  const [renameValue, setRenameValue] = useState('')
  const fileInputRef = useRef(null)

  useEffect(() => {
    setKeyInput(apiKey || '')
  }, [apiKey])

  // Distinct exercises in history with counts
  const exerciseStats = useMemo(() => {
    const map = new Map()
    for (const w of workouts) {
      const cur = map.get(w.exercise) || { count: 0, muscleGroup: w.muscleGroup }
      cur.count += 1
      map.set(w.exercise, cur)
    }
    return Array.from(map.entries())
      .map(([name, info]) => ({ name, ...info }))
      .sort((a, b) => b.count - a.count)
  }, [workouts])

  useEffect(() => {
    setBwInput(String(bodyWeight || ''))
  }, [bodyWeight])

  function commitBodyWeight() {
    const n = Number(bwInput) || 0
    if (n !== bodyWeight) onChangeBodyWeight(n)
  }

  function csvEscape(s) {
    const str = String(s ?? '')
    if (/[,"\n]/.test(str)) return `"${str.replace(/"/g, '""')}"`
    return str
  }

  function buildAndDownloadCSV() {
    const cutoff = csvRange > 0 ? Date.now() - csvRange * 86400000 : 0

    // Map workout id → session for attaching header info to each row
    const workoutToSession = new Map()
    for (const s of sessions) {
      for (const wid of s.workouts || []) {
        workoutToSession.set(wid, s)
      }
    }
    // Map session id → session for cardio rows
    const sessionsById = new Map(sessions.map((s) => [s.id, s]))

    const header = [
      'session_id',
      'session_start',
      'session_feel',
      'session_focus',
      'session_readiness',
      'session_score',
      'session_cardio_bonus',
      'kind',
      'workout_date',
      'set_time',
      'exercise',
      'muscle_group',
      'equipment',
      'set_index',
      'weight',
      'reps',
      'reps_left',
      'cardio_type',
      'cardio_duration_min',
      'cardio_intensity',
    ]
    const lines = [header.join(',')]

    function sessionCols(s) {
      if (!s)
        return ['', '', '', '', '', '', '']
      return [
        csvEscape(s.id),
        new Date(s.startTime).toISOString(),
        s.feel ?? '',
        csvEscape((s.focus || []).join('|')),
        s.readiness ?? '',
        s.score ?? '',
        s.cardioBonusPoints ?? '',
      ]
    }

    // Lift rows
    const filteredWorkouts = workouts
      .filter((w) => w.date >= cutoff)
      .sort((a, b) => a.date - b.date)
    for (const w of filteredWorkouts) {
      const s = workoutToSession.get(w.id)
      const equip = exerciseEquip(w.exercise, w.equipment)
      const dateStr = new Date(w.date).toISOString()
      ;(w.sets || []).forEach((set, i) => {
        lines.push(
          [
            ...sessionCols(s),
            'lift',
            dateStr,
            set.time ? new Date(set.time).toISOString() : '',
            csvEscape(w.exercise),
            csvEscape(w.muscleGroup),
            equip,
            i + 1,
            set.weight ?? 0,
            set.reps ?? 0,
            set.repsLeft ?? '',
            '',
            '',
            '',
          ].join(','),
        )
      })
    }

    // Cardio rows
    const filteredSessions = sessions
      .filter((s) => s.endTime && s.endTime >= cutoff)
      .sort((a, b) => a.startTime - b.startTime)
    for (const s of filteredSessions) {
      for (const c of s.cardio || []) {
        lines.push(
          [
            ...sessionCols(s),
            'cardio',
            new Date(s.startTime).toISOString(),
            c.time ? new Date(c.time).toISOString() : '',
            csvEscape(c.type),
            '',
            'cardio',
            1,
            '',
            '',
            '',
            csvEscape(c.type),
            c.durationMin ?? 0,
            csvEscape(c.intensity),
          ].join(','),
        )
      }
    }

    const csv = lines.join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    const rangeLabel = csvRange === 0 ? 'all' : `${csvRange}d`
    a.href = url
    a.download = `liftlog-${rangeLabel}-${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

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

      {/* Body weight */}
      <div className="mt-6 bg-zinc-900/60 rounded-2xl p-4">
        <div className="text-xs text-zinc-500 font-medium">Body weight</div>
        <div className="mt-2 flex items-center gap-3">
          <input
            type="number"
            inputMode="decimal"
            value={bwInput}
            onChange={(e) => setBwInput(e.target.value)}
            onBlur={commitBodyWeight}
            placeholder="0"
            className="flex-1 bg-zinc-950/60 rounded-lg px-3 py-3 text-center font-mono tabular-nums text-2xl font-semibold ring-1 ring-zinc-800/60 focus:outline-none focus:ring-zinc-600"
          />
          <span className="text-sm text-zinc-500">lb</span>
        </div>
        <p className="mt-2 text-xs text-zinc-500 leading-relaxed">
          Used to estimate volume for bodyweight exercises (push-ups, planks,
          pull-ups). Update if your weight changes.
        </p>
      </div>

      <div className="mt-4 bg-zinc-900/60 rounded-2xl p-4">
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

      {/* CSV export */}
      <div className="mt-8 text-xs text-zinc-500 font-medium">
        Export to CSV
      </div>
      <div className="mt-2 bg-zinc-900/40 rounded-2xl p-3">
        <div className="grid grid-cols-4 gap-2">
          {[
            { d: 7, l: '7d' },
            { d: 30, l: '30d' },
            { d: 90, l: '90d' },
            { d: 0, l: 'All' },
          ].map((opt) => (
            <button
              key={opt.l}
              onClick={() => setCsvRange(opt.d)}
              className={`py-2 rounded-lg text-xs font-medium tabular-nums ${
                csvRange === opt.d
                  ? 'bg-emerald-600 text-zinc-950'
                  : 'bg-zinc-900/60 text-zinc-400 active:bg-zinc-800/60'
              }`}
            >
              {opt.l}
            </button>
          ))}
        </div>
        <button
          onClick={buildAndDownloadCSV}
          className="mt-2 w-full py-3 rounded-xl bg-zinc-100/95 text-zinc-950 font-semibold flex items-center justify-center gap-2 active:bg-zinc-200"
        >
          <Download size={16} />
          Download CSV
        </button>
        <p className="mt-2 text-xs text-zinc-500">
          One row per set. Opens cleanly in Excel and Google Sheets.
        </p>
      </div>

      {/* Exercise library — rename + merge */}
      <div className="mt-8 text-xs text-zinc-500 font-medium">
        Exercise library
      </div>
      <button
        onClick={() => setLibraryOpen((v) => !v)}
        className="mt-2 w-full py-3 rounded-xl bg-zinc-900/60 text-sm font-semibold flex items-center justify-between px-4 active:bg-zinc-800/60"
      >
        <span>
          {exerciseStats.length} exercise{exerciseStats.length === 1 ? '' : 's'}{' '}
          tracked
        </span>
        {libraryOpen ? (
          <ChevronUp size={16} className="text-zinc-500" />
        ) : (
          <ChevronDown size={16} className="text-zinc-500" />
        )}
      </button>
      {libraryOpen && (
        <div className="mt-2 bg-zinc-900/40 rounded-2xl divide-y divide-zinc-800/60 overflow-hidden">
          {exerciseStats.length === 0 && (
            <div className="px-4 py-4 text-sm text-zinc-500">
              No exercises logged yet.
            </div>
          )}
          {exerciseStats.map((e) => (
            <div key={e.name} className="px-3 py-2.5">
              {renamingExercise === e.name ? (
                <div>
                  <div className="text-xs text-zinc-500 font-medium">
                    Rename {e.name}
                  </div>
                  <input
                    value={renameValue}
                    onChange={(ev) => setRenameValue(ev.target.value)}
                    placeholder="New name (matching existing = merge)"
                    className="mt-1.5 w-full bg-zinc-950/60 rounded-lg px-2.5 py-2 text-sm ring-1 ring-zinc-800/60 focus:outline-none focus:ring-zinc-600"
                    autoFocus
                  />
                  <p className="mt-1.5 text-[11px] text-zinc-500 leading-snug">
                    Typing an existing name (e.g. "Deadlift") will merge all{' '}
                    {e.count} entries into it — history is preserved.
                  </p>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <button
                      onClick={() => {
                        setRenamingExercise(null)
                        setRenameValue('')
                      }}
                      className="py-2 rounded-lg bg-zinc-900/60 text-xs font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => {
                        const v = renameValue.trim()
                        if (v && v !== e.name) {
                          onRenameExercise?.(e.name, v)
                        }
                        setRenamingExercise(null)
                        setRenameValue('')
                      }}
                      className="py-2 rounded-lg bg-emerald-600 text-zinc-950 text-xs font-bold active:bg-emerald-500"
                    >
                      Save
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-sm font-semibold truncate">
                      {e.name}
                    </div>
                    <div className="text-[11px] text-zinc-500 mt-0.5 tabular-nums">
                      {e.count} entr{e.count === 1 ? 'y' : 'ies'}
                      {e.muscleGroup ? ` · ${e.muscleGroup}` : ''}
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setRenamingExercise(e.name)
                      setRenameValue(e.name)
                    }}
                    className="px-2.5 py-1.5 text-xs font-medium text-zinc-300 bg-zinc-800/60 rounded-md active:bg-zinc-700/60 flex items-center gap-1 shrink-0"
                  >
                    <Pencil size={11} />
                    Rename
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Anthropic API key (for the LLM pre-session chat) */}
      <div className="mt-8 text-xs text-zinc-500 font-medium">
        Plan chat (Anthropic API key)
      </div>
      <div className="mt-2 bg-zinc-900/60 rounded-2xl p-4">
        <div className="flex items-center gap-2">
          <input
            type={keyVisible ? 'text' : 'password'}
            value={keyInput}
            onChange={(e) => setKeyInput(e.target.value)}
            onBlur={() => {
              if (keyInput !== apiKey) onChangeApiKey?.(keyInput.trim())
            }}
            placeholder="sk-ant-..."
            className="flex-1 bg-zinc-950/60 rounded-lg px-3 py-2.5 text-sm font-mono ring-1 ring-zinc-800/60 focus:outline-none focus:ring-zinc-600 placeholder:text-zinc-600"
          />
          <button
            onClick={() => setKeyVisible((v) => !v)}
            className="px-2.5 py-2 rounded-lg bg-zinc-900/60 text-xs"
          >
            {keyVisible ? 'Hide' : 'Show'}
          </button>
        </div>
        <p className="mt-2 text-[11px] text-zinc-500 leading-relaxed">
          Enables the pre-session "Adjust plan" chat. Key is stored only in this
          browser's localStorage and sent directly to Anthropic from your
          device. Get one at console.anthropic.com.
        </p>
        {apiKey && (
          <button
            onClick={() => {
              onChangeApiKey?.('')
              setKeyInput('')
            }}
            className="mt-2 text-[11px] text-zinc-500 active:text-red-400"
          >
            Remove key
          </button>
        )}
      </div>

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
      time: s.time, // preserve original timestamp
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
        time: Date.now(),
      },
    ])
  }

  function removeSet(i) {
    setSets((prev) => prev.filter((_, idx) => idx !== i))
  }

  function save() {
    const cleaned = sets
      .map((s) => {
        const out = {
          weight: Number(s.weight) || 0,
          reps: Number(s.reps) || 0,
        }
        if (s.time) out.time = s.time
        return out
      })
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

// ============================================================
// EXERCISE PROGRESS CHART (1RM line)
// ============================================================

function ExerciseProgressChart({ series, latest }) {
  if (!series || series.length < 2) return null

  const width = 320
  const height = 130
  const padX = 14
  const padTop = 14
  const padBottom = 22
  const innerW = width - padX * 2
  const innerH = height - padTop - padBottom

  const ys = series.map((p) => p.oneRM)
  const yMin = Math.min(...ys) * 0.9
  const yMax = Math.max(...ys) * 1.05
  const yRange = Math.max(1, yMax - yMin)
  const dateRange = series[series.length - 1].date - series[0].date
  const startDate = series[0].date

  const points = series.map((p, i) => {
    const xT =
      dateRange > 0
        ? (p.date - startDate) / dateRange
        : i / Math.max(1, series.length - 1)
    return {
      x: padX + xT * innerW,
      y: padTop + (1 - (p.oneRM - yMin) / yRange) * innerH,
      oneRM: p.oneRM,
      date: p.date,
    }
  })

  return (
    <div className="bg-zinc-900/60 rounded-2xl p-4">
      <div className="flex items-center justify-between mb-2">
        <div>
          <div className="text-sm font-semibold">Progress</div>
          <div className="text-xs text-zinc-500">
            Estimated 1RM over time
          </div>
        </div>
        {latest !== null && (
          <div className="text-right">
            <div className="text-[10px] text-zinc-500 font-medium">
              Latest
            </div>
            <div className="font-mono tabular-nums text-lg font-semibold text-emerald-400">
              {latest} lb
            </div>
          </div>
        )}
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full block">
        {/* Reference gridlines (3 horizontal) */}
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
        <polyline
          points={points.map((p) => `${p.x},${p.y}`).join(' ')}
          fill="none"
          stroke="rgb(16 185 129)"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {points.map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r="2.5"
            fill="rgb(16 185 129)"
          />
        ))}
        <text
          x={padX}
          y={height - 5}
          fontSize="9"
          fill="rgb(113 113 122)"
          fontFamily="JetBrains Mono, monospace"
        >
          {new Date(points[0].date).toLocaleDateString('en-US', {
            month: 'numeric',
            day: 'numeric',
          })}
        </text>
        <text
          x={width - padX}
          y={height - 5}
          textAnchor="end"
          fontSize="9"
          fill="rgb(113 113 122)"
          fontFamily="JetBrains Mono, monospace"
        >
          {new Date(points[points.length - 1].date).toLocaleDateString(
            'en-US',
            {
              month: 'numeric',
              day: 'numeric',
            },
          )}
        </text>
      </svg>
    </div>
  )
}

// ============================================================
// PLAN EDITOR
// ============================================================

function PlanEditorScreen({ plan, isDraft, onBack, onSave, onReset }) {
  const [exercises, setExercises] = useState(() =>
    plan.exercises.map((e) => ({ ...e })),
  )
  const [adding, setAdding] = useState(false)
  const [addGroup, setAddGroup] = useState(plan.focus?.[0] || 'Chest')
  const [addExercise, setAddExercise] = useState(EXERCISES['Chest']?.[0] || '')
  const [addSets, setAddSets] = useState('3')
  const [addReps, setAddReps] = useState('10')

  function updateRow(i, field, value) {
    setExercises((prev) =>
      prev.map((e, idx) =>
        idx === i ? { ...e, [field]: Number(value) || 0 } : e,
      ),
    )
  }

  function removeRow(i) {
    setExercises((prev) => prev.filter((_, idx) => idx !== i))
  }

  function addRow() {
    const name = addExercise.trim()
    if (!name) return
    setExercises((prev) => [
      ...prev,
      {
        exercise: name,
        muscleGroup: addGroup,
        sets: Math.max(1, Number(addSets) || 3),
        reps: Math.max(1, Number(addReps) || 10),
        weight: 0,
        isAnchor: false,
      },
    ])
    setAdding(false)
  }

  function save() {
    const edited = {
      ...plan,
      exercises,
      estimatedMinutes: exercises.reduce(
        (sum, e) => sum + (e.isAnchor ? 8 : 5),
        0,
      ),
    }
    onSave(edited)
  }

  // When the muscle group changes in the add form, reset exercise to first
  useEffect(() => {
    const list = EXERCISES[addGroup] || []
    if (list.length > 0) setAddExercise(list[0])
  }, [addGroup])

  return (
    <Shell>
      <SleekBackBar onBack={onBack} title="Plan" />

      <h1 className="text-4xl font-extrabold tracking-tight leading-none">
        Edit plan
      </h1>
      <p className="mt-1 text-sm text-zinc-500">
        {titleCase(plan.dayType)} day · {plan.focus.join(' + ')}
      </p>

      <div className="mt-5 text-xs text-zinc-500 font-medium">Exercises</div>
      <div className="mt-2 space-y-2">
        {exercises.map((e, i) => (
          <div
            key={i}
            className="bg-zinc-900/60 rounded-xl px-3 py-3"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold">
                  {e.exercise}
                  {e.isAnchor && (
                    <span className="ml-2 text-[10px] text-emerald-500 font-medium">
                      COMPOUND
                    </span>
                  )}
                </div>
                <div className="text-xs text-zinc-500 mt-0.5">
                  {e.muscleGroup}
                </div>
              </div>
              <button
                onClick={() => removeRow(i)}
                className="p-1.5 text-zinc-500 active:text-red-400"
                aria-label="Remove"
              >
                <X size={16} />
              </button>
            </div>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <label className="block">
                <div className="text-[10px] text-zinc-500 font-medium">
                  Sets
                </div>
                <input
                  type="number"
                  inputMode="numeric"
                  value={e.sets}
                  onChange={(ev) => updateRow(i, 'sets', ev.target.value)}
                  className="mt-0.5 w-full bg-zinc-950/60 rounded-lg px-2 py-2 text-center font-mono tabular-nums text-base ring-1 ring-zinc-800/60 focus:outline-none focus:ring-zinc-600"
                />
              </label>
              <label className="block">
                <div className="text-[10px] text-zinc-500 font-medium">
                  Reps
                </div>
                <input
                  type="number"
                  inputMode="numeric"
                  value={e.reps}
                  onChange={(ev) => updateRow(i, 'reps', ev.target.value)}
                  className="mt-0.5 w-full bg-zinc-950/60 rounded-lg px-2 py-2 text-center font-mono tabular-nums text-base ring-1 ring-zinc-800/60 focus:outline-none focus:ring-zinc-600"
                />
              </label>
            </div>
          </div>
        ))}
        {exercises.length === 0 && (
          <div className="bg-zinc-900/40 rounded-xl px-3 py-4 text-sm text-zinc-500 text-center">
            No exercises — add some below.
          </div>
        )}
      </div>

      {!adding && (
        <button
          onClick={() => setAdding(true)}
          className="mt-3 w-full py-3 rounded-xl border border-dashed border-zinc-700 text-zinc-300 flex items-center justify-center gap-2 active:bg-zinc-900/40"
        >
          <Plus size={16} />
          <span className="text-sm">Add exercise</span>
        </button>
      )}

      {adding && (
        <div className="mt-3 bg-zinc-900/40 rounded-2xl p-3">
          <div className="text-xs text-zinc-500 font-medium">Add exercise</div>
          <div className="mt-2 space-y-2">
            <label className="block">
              <div className="text-[10px] text-zinc-500 font-medium">
                Muscle group
              </div>
              <select
                value={addGroup}
                onChange={(e) => setAddGroup(e.target.value)}
                className="mt-0.5 w-full bg-zinc-950/60 rounded-lg px-2 py-2 text-sm ring-1 ring-zinc-800/60 focus:outline-none focus:ring-zinc-600"
              >
                {MUSCLE_GROUPS.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <div className="text-[10px] text-zinc-500 font-medium">
                Exercise
              </div>
              <select
                value={addExercise}
                onChange={(e) => setAddExercise(e.target.value)}
                className="mt-0.5 w-full bg-zinc-950/60 rounded-lg px-2 py-2 text-sm ring-1 ring-zinc-800/60 focus:outline-none focus:ring-zinc-600"
              >
                {(EXERCISES[addGroup] || []).map((ex) => (
                  <option key={ex} value={ex}>
                    {ex}
                  </option>
                ))}
              </select>
            </label>
            <div className="grid grid-cols-2 gap-2">
              <label className="block">
                <div className="text-[10px] text-zinc-500 font-medium">
                  Sets
                </div>
                <input
                  type="number"
                  inputMode="numeric"
                  value={addSets}
                  onChange={(e) => setAddSets(e.target.value)}
                  className="mt-0.5 w-full bg-zinc-950/60 rounded-lg px-2 py-2 text-center font-mono tabular-nums text-base ring-1 ring-zinc-800/60 focus:outline-none focus:ring-zinc-600"
                />
              </label>
              <label className="block">
                <div className="text-[10px] text-zinc-500 font-medium">
                  Reps
                </div>
                <input
                  type="number"
                  inputMode="numeric"
                  value={addReps}
                  onChange={(e) => setAddReps(e.target.value)}
                  className="mt-0.5 w-full bg-zinc-950/60 rounded-lg px-2 py-2 text-center font-mono tabular-nums text-base ring-1 ring-zinc-800/60 focus:outline-none focus:ring-zinc-600"
                />
              </label>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                onClick={() => setAdding(false)}
                className="py-2.5 rounded-lg bg-zinc-900/60 text-xs font-medium active:bg-zinc-800/60"
              >
                Cancel
              </button>
              <button
                onClick={addRow}
                className="py-2.5 rounded-lg bg-emerald-600 text-zinc-950 text-xs font-semibold active:bg-emerald-500"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="mt-6 grid grid-cols-2 gap-2">
        {isDraft && (
          <button
            onClick={onReset}
            className="py-3 rounded-xl text-sm font-medium text-zinc-400 ring-1 ring-zinc-800 bg-zinc-900/40 active:bg-zinc-900/80"
          >
            Reset to suggested
          </button>
        )}
        <button
          onClick={save}
          className={`py-3 rounded-xl text-sm bg-emerald-600 text-zinc-950 font-semibold active:bg-emerald-500 ${isDraft ? '' : 'col-span-2'}`}
        >
          Save plan
        </button>
      </div>
    </Shell>
  )
}

// ============================================================
// PLAN CHAT (LLM)
// ============================================================

const PLAN_CHAT_SYSTEM = `You are an in-app fitness coach helping the user adjust today's strength workout plan before they start training. The user follows a hybrid push/pull/legs split and uses this app to log lifts.

You will be given:
- Today's currently-suggested plan (exercises, sets, reps, muscle groups)
- A summary of recent training (last 14 days, grouped by muscle group)
- The catalog of exercises available in the app for each muscle group

When the user asks to adjust the plan, you MUST use the propose_plan tool to return the full replacement exercise list (in order). Do not omit exercises the user wants to keep — return the entire ordered list every time.

Rules for proposing a plan:
- Only use exercise names that already exist in the app catalog OR that the user explicitly names (custom names are OK if they're specific, e.g. "Cable Chest Press — Hammer Strength").
- Honor any restrictions the user mentions (soreness, time available, equipment unavailable). If they say their lower back is tight, avoid Deadlift and Bent-Over Row.
- Keep total exercises in 4–7 range unless the user explicitly wants more/fewer.
- Lead each muscle group with a compound when one fits.
- Reps default to 10. Sets default to 3 (4 for anchor compounds).
- Set muscleGroup to one of: Chest, Back, Shoulders, Arms, Legs, Core.

Tone: concise, practical, no fluff. After proposing changes, give a short (1–2 sentence) rationale describing what changed and why. When the user is just chatting or asking questions, answer briefly without calling the tool.`

const PLAN_TOOL = {
  name: 'propose_plan',
  description:
    "Replace the workout plan with a new ordered list of exercises. Always return the FULL list, not a diff.",
  input_schema: {
    type: 'object',
    properties: {
      exercises: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            exercise: {
              type: 'string',
              description: 'Exercise name (use catalog names when possible).',
            },
            muscleGroup: {
              type: 'string',
              enum: ['Chest', 'Back', 'Shoulders', 'Arms', 'Legs', 'Core'],
            },
            sets: { type: 'integer', minimum: 1, maximum: 6 },
            reps: { type: 'integer', minimum: 1, maximum: 30 },
            isAnchor: { type: 'boolean' },
          },
          required: ['exercise', 'muscleGroup', 'sets', 'reps'],
        },
      },
      rationale: {
        type: 'string',
        description: 'One short sentence describing what changed.',
      },
    },
    required: ['exercises'],
  },
}

function buildPlanChatContext(plan, workouts) {
  const cutoff = Date.now() - 14 * 86400000
  const recent = workouts.filter((w) => w.date >= cutoff)
  const byGroup = {}
  for (const g of MUSCLE_GROUPS) byGroup[g] = []
  for (const w of recent) {
    if (!byGroup[w.muscleGroup]) continue
    const top = w.sets.reduce(
      (b, s) => (Number(s.weight) || 0) > b ? Number(s.weight) || 0 : b,
      0,
    )
    byGroup[w.muscleGroup].push({
      date: daysSince(w.date),
      exercise: w.exercise,
      sets: w.sets.length,
      topWeight: top,
    })
  }
  const recentSummary = MUSCLE_GROUPS.map((g) => {
    const items = byGroup[g] || []
    if (items.length === 0) return `${g}: nothing in 14d`
    const list = items
      .slice(0, 4)
      .map((i) => `${i.exercise} ${i.sets}×${i.topWeight || '-'} (${i.date}d)`)
      .join(', ')
    return `${g}: ${list}`
  }).join('\n')

  const catalog = MUSCLE_GROUPS.map(
    (g) => `${g}: ${(EXERCISES[g] || []).join(', ')}`,
  ).join('\n')

  const planText = plan.exercises
    .map(
      (e, i) =>
        `${i + 1}. ${e.exercise} (${e.muscleGroup}) — ${e.sets} × ${e.reps}${e.isAnchor ? ' [anchor]' : ''}`,
    )
    .join('\n')

  return `Today's plan (${titleCase(plan.dayType)}, focus: ${plan.focus.join(' + ')}):
${planText}

Recent training (last 14d):
${recentSummary}

Exercise catalog:
${catalog}`
}

async function callPlanChat(apiKey, history, plan, workouts) {
  const context = buildPlanChatContext(plan, workouts)
  const system = [
    { type: 'text', text: PLAN_CHAT_SYSTEM },
    {
      type: 'text',
      text: context,
      cache_control: { type: 'ephemeral' },
    },
  ]
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      system,
      tools: [PLAN_TOOL],
      messages: history,
    }),
  })
  if (!res.ok) {
    let detail = ''
    try {
      detail = await res.text()
    } catch {
      /* ignore */
    }
    throw new Error(`Anthropic API ${res.status}: ${detail.slice(0, 240)}`)
  }
  return res.json()
}

function PlanChatScreen({
  plan,
  workouts,
  apiKey,
  onOpenSettings,
  onBack,
  onApply,
}) {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const [proposed, setProposed] = useState(null)
  const [rationale, setRationale] = useState('')
  const scrollerRef = useRef(null)

  useEffect(() => {
    // Scroll to bottom on new message
    if (scrollerRef.current) {
      scrollerRef.current.scrollTop = scrollerRef.current.scrollHeight
    }
  }, [messages, busy, proposed])

  // Strip tool_use blocks out of stored assistant history before sending the
  // next request — tool_use without a matching tool_result is a 400. The
  // user-visible state of the proposed plan is enough context for the model.
  function historyForApi(history) {
    return history.map((m) => {
      if (m.role !== 'assistant') {
        return { role: 'user', content: m.content }
      }
      const text = m.displayText
        ? m.displayText
        : Array.isArray(m.content)
          ? m.content
              .filter((b) => b.type === 'text')
              .map((b) => b.text)
              .join('\n')
          : ''
      return {
        role: 'assistant',
        content: text || '(proposed a plan update)',
      }
    })
  }

  async function send() {
    const text = input.trim()
    if (!text || busy) return
    if (!apiKey) {
      setError('Add your Anthropic API key in Settings first.')
      return
    }
    setError(null)
    const userMsg = { role: 'user', content: text }
    const next = [...messages, userMsg]
    setMessages(next)
    setInput('')
    setBusy(true)
    try {
      const result = await callPlanChat(
        apiKey,
        historyForApi(next),
        plan,
        workouts,
      )
      const blocks = result.content || []
      const textOut = blocks
        .filter((b) => b.type === 'text')
        .map((b) => b.text)
        .join('\n')
        .trim()
      const toolUse = blocks.find((b) => b.type === 'tool_use')

      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: blocks, displayText: textOut },
      ])

      if (toolUse && toolUse.input?.exercises) {
        setProposed(toolUse.input.exercises)
        setRationale(toolUse.input.rationale || '')
      }
    } catch (e) {
      setError(e.message || 'Something went wrong.')
    } finally {
      setBusy(false)
    }
  }

  function applyProposed() {
    if (!proposed) return
    const exercises = proposed.map((e) => ({
      exercise: e.exercise,
      muscleGroup: e.muscleGroup,
      sets: Math.max(1, Number(e.sets) || 3),
      reps: Math.max(1, Number(e.reps) || 10),
      weight: 0,
      isAnchor: !!e.isAnchor,
    }))
    const focus = Array.from(new Set(exercises.map((e) => e.muscleGroup))).slice(
      0,
      2,
    )
    onApply({
      ...plan,
      exercises,
      focus: focus.length > 0 ? focus : plan.focus,
      estimatedMinutes: exercises.reduce(
        (sum, e) => sum + (e.isAnchor ? 8 : 5),
        0,
      ),
      rationale: rationale || plan.rationale,
    })
  }

  return (
    <Shell>
      <SleekBackBar onBack={onBack} title="Plan chat" />

      <h1 className="text-4xl font-extrabold tracking-tight leading-none">
        Adjust plan
      </h1>
      <p className="mt-1 text-sm text-zinc-500">
        Tell the coach about target areas, soreness, or time you have.
      </p>

      {!apiKey && (
        <div className="mt-5 bg-amber-950/30 ring-1 ring-amber-900/40 rounded-2xl p-4">
          <div className="text-sm font-semibold text-amber-300">
            API key required
          </div>
          <p className="mt-1 text-xs text-amber-200/70">
            This screen sends a message to the Anthropic API. Add a key in
            Settings → Plan chat to enable.
          </p>
          <button
            onClick={onOpenSettings}
            className="mt-3 w-full py-2.5 rounded-xl bg-amber-600 text-zinc-950 text-sm font-bold active:bg-amber-500"
          >
            Open settings
          </button>
        </div>
      )}

      {/* Chat scroller */}
      <div
        ref={scrollerRef}
        className="mt-4 bg-zinc-900/40 rounded-2xl p-3 max-h-[40vh] overflow-y-auto space-y-2"
      >
        {messages.length === 0 && (
          <div className="text-xs text-zinc-500 px-2 py-1.5 leading-relaxed">
            Try: "My shoulders are tight, go easier there" or "Add more chest,
            drop arms" or "I only have 30 minutes".
          </div>
        )}
        {messages.map((m, i) => {
          const text =
            m.role === 'assistant'
              ? m.displayText || ''
              : typeof m.content === 'string'
                ? m.content
                : ''
          if (!text && m.role === 'assistant') {
            // Assistant turn was pure tool use — show a stub
            return (
              <div
                key={i}
                className="self-start max-w-[85%] px-3 py-2 rounded-xl bg-zinc-900/80 ring-1 ring-zinc-800/60 text-xs text-zinc-400 italic"
              >
                (proposed a plan update — see below)
              </div>
            )
          }
          return (
            <div
              key={i}
              className={`max-w-[85%] px-3 py-2 rounded-xl text-sm whitespace-pre-wrap ${
                m.role === 'user'
                  ? 'ml-auto bg-emerald-600 text-zinc-950'
                  : 'bg-zinc-900/80 text-zinc-100 ring-1 ring-zinc-800/60'
              }`}
            >
              {text}
            </div>
          )
        })}
        {busy && (
          <div className="px-3 py-2 rounded-xl bg-zinc-900/80 text-xs text-zinc-500 italic">
            Thinking…
          </div>
        )}
      </div>

      {error && (
        <div className="mt-2 text-xs text-orange-400 px-2">{error}</div>
      )}

      {/* Proposed plan preview */}
      {proposed && (
        <div className="mt-4 bg-emerald-950/40 ring-1 ring-emerald-900/40 rounded-2xl p-4">
          <div className="text-xs text-emerald-400 font-bold tracking-wide uppercase">
            Proposed plan
          </div>
          {rationale && (
            <p className="mt-1 text-xs text-zinc-300">{rationale}</p>
          )}
          <div className="mt-3 space-y-1.5">
            {proposed.map((e, i) => (
              <div
                key={i}
                className="flex items-center justify-between text-xs"
              >
                <span className="text-zinc-100">
                  {i + 1}. {e.exercise}
                  <span className="text-zinc-500 ml-1">· {e.muscleGroup}</span>
                </span>
                <span className="font-mono tabular-nums text-zinc-300">
                  {e.sets} × {e.reps}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button
              onClick={() => {
                setProposed(null)
                setRationale('')
              }}
              className="py-2.5 rounded-lg bg-zinc-900/60 text-xs font-medium active:bg-zinc-800/60"
            >
              Dismiss
            </button>
            <button
              onClick={applyProposed}
              className="py-2.5 rounded-lg bg-emerald-600 text-zinc-950 text-xs font-bold active:bg-emerald-500"
            >
              Apply to today
            </button>
          </div>
        </div>
      )}

      {/* Composer */}
      <div className="mt-4 flex items-end gap-2">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Tell the coach what to change"
          rows={2}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              send()
            }
          }}
          className="flex-1 bg-zinc-900/60 rounded-xl px-3 py-2 text-sm placeholder:text-zinc-600 ring-1 ring-zinc-800/60 focus:outline-none focus:ring-zinc-600 resize-none"
        />
        <button
          onClick={send}
          disabled={busy || !input.trim() || !apiKey}
          className={`px-4 py-3 rounded-xl text-sm font-bold ${
            busy || !input.trim() || !apiKey
              ? 'bg-zinc-900/60 text-zinc-600'
              : 'bg-emerald-600 text-zinc-950 active:bg-emerald-500'
          }`}
        >
          Send
        </button>
      </div>
    </Shell>
  )
}

// ============================================================
// CARDIO ENTRY (at end of session, before scoring)
// ============================================================

function CardioEntryScreen({ onCancel, onContinue }) {
  const [entries, setEntries] = useState([])
  const [type, setType] = useState('Bike')
  const [duration, setDuration] = useState('')
  const [intensity, setIntensity] = useState('Average')

  function addEntry() {
    const dur = Number(duration) || 0
    if (dur <= 0) return
    setEntries((prev) => [
      ...prev,
      { id: uid(), type, durationMin: dur, intensity, time: Date.now() },
    ])
    setDuration('')
  }

  function removeEntry(id) {
    setEntries((prev) => prev.filter((e) => e.id !== id))
  }

  const bonus = cardioBonus(entries)

  return (
    <Shell>
      <SleekBackBar onBack={onCancel} title="Cardio" />

      <h1 className="text-4xl font-extrabold tracking-tight leading-none">
        Cardio?
      </h1>
      <p className="mt-1 text-sm text-zinc-500">
        Did you also do cardio today? Optional — adds a small bonus to your
        score.
      </p>

      {/* Existing entries */}
      {entries.length > 0 && (
        <div className="mt-5 bg-zinc-900/40 rounded-2xl divide-y divide-zinc-800/60 overflow-hidden">
          {entries.map((e) => (
            <div
              key={e.id}
              className="px-4 py-3 flex items-center justify-between gap-2"
            >
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold">
                  {e.type} · {e.intensity}
                </div>
                <div className="text-xs text-zinc-500 mt-0.5 tabular-nums">
                  {e.durationMin} min
                </div>
              </div>
              <button
                onClick={() => removeEntry(e.id)}
                className="p-2 text-zinc-600 active:text-red-400"
                aria-label="Remove"
              >
                <X size={14} />
              </button>
            </div>
          ))}
          {bonus > 0 && (
            <div className="px-4 py-2.5 bg-emerald-950/30 text-xs text-emerald-400 flex items-center justify-between">
              <span className="font-medium">Cardio bonus</span>
              <span className="font-mono tabular-nums font-bold">
                +{bonus}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Add entry */}
      <div className="mt-5 bg-zinc-900/60 rounded-2xl p-4 space-y-4">
        <div>
          <div className="text-xs text-zinc-500 font-medium">Type</div>
          <div className="mt-2 grid grid-cols-4 gap-2">
            {CARDIO_TYPES.map((t) => (
              <button
                key={t}
                onClick={() => setType(t)}
                className={`py-2 rounded-lg text-xs font-medium ${
                  type === t
                    ? 'bg-emerald-600 text-zinc-950'
                    : 'bg-zinc-950/40 text-zinc-300 active:bg-zinc-800/60'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="text-xs text-zinc-500 font-medium">Intensity</div>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {CARDIO_INTENSITIES.map((i) => (
              <button
                key={i}
                onClick={() => setIntensity(i)}
                className={`py-3 rounded-lg text-sm font-medium ${
                  intensity === i
                    ? 'bg-emerald-600 text-zinc-950'
                    : 'bg-zinc-950/40 text-zinc-300 active:bg-zinc-800/60'
                }`}
              >
                {i}
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="text-xs text-zinc-500 font-medium">
            Duration (minutes)
          </div>
          <div className="mt-2 flex items-center gap-2">
            <input
              type="number"
              inputMode="numeric"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              placeholder="30"
              className="flex-1 bg-zinc-950/60 rounded-xl px-3 py-3 text-center font-mono tabular-nums text-xl font-bold ring-1 ring-zinc-800/60 focus:outline-none focus:ring-zinc-600"
            />
            <button
              onClick={addEntry}
              disabled={!duration || Number(duration) <= 0}
              className={`px-4 py-3 rounded-xl text-sm font-bold flex items-center gap-1 ${
                duration && Number(duration) > 0
                  ? 'bg-emerald-600 text-zinc-950 active:bg-emerald-500'
                  : 'bg-zinc-800/60 text-zinc-600'
              }`}
            >
              <Plus size={14} />
              Add
            </button>
          </div>
        </div>
      </div>

      {/* Continue */}
      <button
        onClick={() => onContinue(entries)}
        className="mt-6 w-full py-5 rounded-2xl bg-emerald-600 text-zinc-950 text-xl font-bold tracking-tight active:bg-emerald-500 shadow-lg shadow-emerald-600/20"
      >
        {entries.length === 0 ? 'Skip — no cardio' : 'Continue to score'}
      </button>
    </Shell>
  )
}
