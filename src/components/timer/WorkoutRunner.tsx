import { useState, useCallback, useEffect, useRef, useMemo } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import type { Exercise, WorkoutPhase } from '../../types'
import CircularTimer from './CircularTimer'
import ExercisePreview from './ExercisePreview'
import WorkoutComplete from './WorkoutComplete'
import { useTimer } from '../../hooks/useTimer'
import { useAudio } from '../../hooks/useAudio'
import { useSpeech } from '../../hooks/useSpeech'
import { useVibration } from '../../hooks/useVibration'
import { useWakeLock } from '../../hooks/useWakeLock'

interface WorkoutRunnerProps {
  exercises: Exercise[]
  dayTitle: string
  weekNumber: number
  onComplete: (data: {
    exercisesCompleted: number
    exercisesTotal: number
    duration: number
    skippedExercises: string[]
    note: string
    feeling: 1 | 2 | 3 | 4 | 5
  }) => void
  onExit: () => void
}

export default function WorkoutRunner({ exercises, dayTitle, onComplete, onExit }: WorkoutRunnerProps) {
  const [phase, setPhase] = useState<WorkoutPhase>('preview')
  const [exerciseIndex, setExerciseIndex] = useState(0)
  const [currentSet, setCurrentSet] = useState(1)
  const [currentRep, setCurrentRep] = useState(1)
  const [skippedExercises, setSkippedExercises] = useState<string[]>([])
  const [completedExercises, setCompletedExercises] = useState(0)
  const [wasPausedPhase, setWasPausedPhase] = useState<WorkoutPhase>('hanging')
  const [overrides, setOverrides] = useState<Record<number, { sets: number; repsPerSet: number; hangTime: number }>>({})

  const startTimeRef = useRef(Date.now())
  const lastCountdownRef = useRef(0)

  const { beepStart, beepEnd, beepCountdown, beepComplete } = useAudio()
  const { speak } = useSpeech()
  const { vibrateShort, vibrateMedium, vibrateLong } = useVibration()
  const { request: wakeLockRequest, release: wakeLockRelease } = useWakeLock()

  const baseExercise = exercises[exerciseIndex]
  const exerciseOverride = overrides[exerciseIndex]
  const exercise = useMemo(() => {
    return baseExercise && exerciseOverride
      ? { ...baseExercise, ...exerciseOverride }
      : baseExercise
  }, [baseExercise, exerciseOverride])

  const handleTimerComplete = useCallback(() => {
    if (!exercise) return

    if (phase === 'hanging') {
      beepEnd()
      vibrateShort()

      const isLastRep = currentRep >= exercise.repsPerSet
      const isLastSet = currentSet >= exercise.sets

      if (isLastRep && isLastSet) {
        setCompletedExercises((c) => c + 1)
        speak('Esercizio completato!')
        vibrateMedium()

        if (exerciseIndex < exercises.length - 1) {
          setPhase('exercise_complete')
          setTimeout(() => {
            setExerciseIndex((i) => i + 1)
            setCurrentSet(1)
            setCurrentRep(1)
            setPhase('preview')
          }, 2000)
        } else {
          setPhase('workout_complete')
          beepComplete()
          vibrateLong()
          speak('Allenamento completato! Grande lavoro!')
          wakeLockRelease()
        }
      } else if (isLastRep) {
        speak('Riposo tra le serie')
        setPhase('set_rest')
      } else {
        if (exercise.restBetweenReps > 0) {
          speak('Riposa')
          setPhase('resting')
        } else {
          setCurrentRep((r) => r + 1)
          speak('Tieni!')
          beepStart()
        }
      }
    } else if (phase === 'resting') {
      setCurrentRep((r) => r + 1)
      setPhase('hanging')
      speak('Tieni!')
      beepStart()
      vibrateShort()
    } else if (phase === 'set_rest') {
      setCurrentSet((s) => s + 1)
      setCurrentRep(1)
      setPhase('hanging')
      speak(`Serie ${currentSet + 1}. Tieni!`)
      beepStart()
      vibrateShort()
    }
  }, [phase, exercise, currentRep, currentSet, exerciseIndex, exercises.length,
      beepStart, beepEnd, beepComplete, speak, vibrateShort, vibrateMedium, vibrateLong, wakeLockRelease])

  const timer = useTimer(handleTimerComplete)

  const isRepsExercise = exercise?.type === 'reps'

  useEffect(() => {
    if (!exercise) return

    if (phase === 'hanging') {
      if (!isRepsExercise) {
        timer.start(exercise.hangTime)
        lastCountdownRef.current = 0
      }
    } else if (phase === 'resting') {
      timer.start(exercise.restBetweenReps)
      lastCountdownRef.current = 0
    } else if (phase === 'set_rest') {
      timer.start(exercise.restBetweenSets)
      lastCountdownRef.current = 0
    }
  }, [phase, exercise, exerciseIndex, currentSet, currentRep, isRepsExercise]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (phase !== 'hanging' && phase !== 'resting' && phase !== 'set_rest') return
    const remaining = Math.ceil(timer.timeRemaining)
    if (remaining <= 3 && remaining > 0 && remaining !== lastCountdownRef.current) {
      lastCountdownRef.current = remaining
      beepCountdown()
    }
  }, [timer.timeRemaining, phase, beepCountdown])

  const handleStartExercise = useCallback((params: { sets: number; repsPerSet: number; hangTime: number }) => {
    setOverrides((prev) => ({ ...prev, [exerciseIndex]: params }))
    wakeLockRequest()
    setPhase('hanging')
    speak('Tieni!')
    beepStart()
    vibrateShort()
  }, [exerciseIndex, wakeLockRequest, speak, beepStart, vibrateShort])

  const handleSkipExercise = useCallback(() => {
    if (!exercise) return
    setSkippedExercises((s) => [...s, exercise.id])

    if (exerciseIndex < exercises.length - 1) {
      setExerciseIndex((i) => i + 1)
      setCurrentSet(1)
      setCurrentRep(1)
      setPhase('preview')
    } else {
      setPhase('workout_complete')
      wakeLockRelease()
    }
  }, [exercise, exerciseIndex, exercises.length, wakeLockRelease])

  const handleRepsSetDone = useCallback(() => {
    if (!exercise) return

    const isLastSet = currentSet >= exercise.sets

    if (isLastSet) {
      setCompletedExercises((c) => c + 1)
      speak('Esercizio completato!')
      vibrateMedium()

      if (exerciseIndex < exercises.length - 1) {
        setPhase('exercise_complete')
        setTimeout(() => {
          setExerciseIndex((i) => i + 1)
          setCurrentSet(1)
          setCurrentRep(1)
          setPhase('preview')
        }, 2000)
      } else {
        setPhase('workout_complete')
        beepComplete()
        vibrateLong()
        speak('Allenamento completato! Grande lavoro!')
        wakeLockRelease()
      }
    } else {
      speak('Riposo tra le serie')
      setPhase('set_rest')
    }
  }, [exercise, currentSet, exerciseIndex, exercises.length,
      beepComplete, speak, vibrateMedium, vibrateLong, wakeLockRelease])

  const handlePause = useCallback(() => {
    timer.pause()
    setWasPausedPhase(phase)
    setPhase('paused')
  }, [timer, phase])

  const handleResume = useCallback(() => {
    setPhase(wasPausedPhase)
    timer.resume()
  }, [timer, wasPausedPhase])

  const handleSave = useCallback(
    (note: string, feeling: 1 | 2 | 3 | 4 | 5) => {
      const duration = Math.floor((Date.now() - startTimeRef.current) / 1000)
      onComplete({
        exercisesCompleted: completedExercises,
        exercisesTotal: exercises.length,
        duration,
        skippedExercises,
        note,
        feeling,
      })
    },
    [completedExercises, exercises.length, skippedExercises, onComplete],
  )

  if (phase === 'workout_complete') {
    return (
      <WorkoutComplete
        dayTitle={dayTitle}
        exercisesCompleted={completedExercises}
        exercisesTotal={exercises.length}
        duration={Math.floor((Date.now() - startTimeRef.current) / 1000)}
        skippedExercises={skippedExercises}
        onSave={handleSave}
        onClose={onExit}
      />
    )
  }

  if (phase === 'preview' && exercise) {
    return (
      <ExercisePreview
        key={exercise.id}
        exercise={exercise}
        exerciseIndex={exerciseIndex}
        totalExercises={exercises.length}
        onStart={handleStartExercise}
        onSkip={handleSkipExercise}
      />
    )
  }

  const phaseLabel =
    phase === 'hanging' ? 'TIENI' :
    phase === 'resting' ? 'RIPOSA' :
    phase === 'set_rest' ? 'RIPOSO TRA SERIE' :
    phase === 'paused' ? 'PAUSA' :
    phase === 'exercise_complete' ? 'COMPLETATO' : ''

  const currentTotalTime =
    phase === 'hanging' || phase === 'paused' && wasPausedPhase === 'hanging'
      ? exercise?.hangTime ?? 0
      : phase === 'resting' || phase === 'paused' && wasPausedPhase === 'resting'
        ? exercise?.restBetweenReps ?? 0
        : exercise?.restBetweenSets ?? 0

  if (isRepsExercise && phase === 'hanging') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70dvh] px-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={`${exerciseIndex}-reps`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center"
          >
            <p className="text-xs font-semibold uppercase tracking-widest text-text-muted mb-1">
              {exercise?.name}
            </p>

            <div className="mb-6">
              <CircularTimer
                timeRemaining={0}
                totalTime={0}
                phase="hanging"
                label={`${exercise?.repsPerSet ?? 0} REP`}
                subLabel={`Serie ${currentSet}/${exercise?.sets ?? 0}`}
              />
            </div>

            {exercise?.weight && exercise.weight !== 'corpo libero' && (
              <p className="text-sm text-violet font-semibold mb-5">{exercise.weight}</p>
            )}

            <motion.button
              whileTap={{ scale: 0.93 }}
              onClick={handleRepsSetDone}
              className="w-20 h-20 rounded-full bg-primary flex items-center justify-center shadow-lg shadow-primary/30 mb-4"
            >
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#F5F5F7" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </motion.button>
            <p className="text-xs text-text-muted uppercase tracking-wider">Fatto</p>

            <button
              onClick={handleSkipExercise}
              className="mt-6 w-10 h-10 rounded-full bg-surface-elevated border border-border flex items-center justify-center"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8E8EA0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="5 4 15 12 5 20" />
                <line x1="19" y1="5" x2="19" y2="19" />
              </svg>
            </button>
          </motion.div>
        </AnimatePresence>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[70dvh] px-4">
      <AnimatePresence mode="wait">
        <motion.div
          key={`${exerciseIndex}-${phase}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="flex flex-col items-center"
        >
          <p className="text-xs font-semibold uppercase tracking-widest text-text-muted mb-1">
            {exercise?.name}
          </p>

          <div className="mb-6">
            <CircularTimer
              timeRemaining={timer.timeRemaining}
              totalTime={currentTotalTime}
              phase={phase === 'paused' ? wasPausedPhase : phase}
              label={phaseLabel}
              subLabel={`Serie ${currentSet}/${exercise?.sets ?? 0}  •  Rep ${currentRep}/${exercise?.repsPerSet ?? 0}`}
            />
          </div>

          <div className="flex items-center gap-4">
            {phase === 'paused' ? (
              <button
                onClick={handleResume}
                className="w-16 h-16 rounded-full bg-accent flex items-center justify-center"
              >
                <svg width="28" height="28" viewBox="0 0 24 24" fill="#0A0A12">
                  <polygon points="5 3 19 12 5 21" />
                </svg>
              </button>
            ) : (
              <button
                onClick={handlePause}
                className="w-16 h-16 rounded-full bg-surface-elevated border border-border flex items-center justify-center"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="#F5F5F7">
                  <rect x="6" y="4" width="4" height="16" rx="1" />
                  <rect x="14" y="4" width="4" height="16" rx="1" />
                </svg>
              </button>
            )}

            <button
              onClick={handleSkipExercise}
              className="w-12 h-12 rounded-full bg-surface-elevated border border-border flex items-center justify-center"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8E8EA0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="5 4 15 12 5 20" />
                <line x1="19" y1="5" x2="19" y2="19" />
              </svg>
            </button>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
