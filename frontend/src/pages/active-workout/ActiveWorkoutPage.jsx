import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { workoutService } from '../../services/workoutService';
import { sessionService } from '../../services/sessionService';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import Toast from '../../components/ui/Toast';
import useToast from '../../hooks/useToast';
import Spinner from '../../components/ui/Spinner';

const buildFlatSets = (workout) =>
  workout.exercises.flatMap((we) =>
    Array.from({ length: we.sets }, (_, i) => ({
      exerciseId: we.exerciseId,
      exerciseName: we.exercise.name,
      muscleGroup: we.exercise.muscleGroup,
      setNumber: i + 1,       
      totalSets: we.sets,
      targetReps: we.reps,
    }))
  );

const ActiveWorkoutPage = () => {
  const { id: workoutId } = useParams();
  const navigate = useNavigate();

  const [workout, setWorkout] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [flatSets, setFlatSets] = useState([]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [phase, setPhase] = useState('loading');
  const [actualReps, setActualReps] = useState(0);
  const [restTimeLeft, setRestTimeLeft] = useState(0);
  const [completedSets, setCompletedSets] = useState([]);

  const [saving, setSaving] = useState(false);
  const [showAbandonDialog, setShowAbandonDialog] = useState(false);
  const { toast, showToast, hideToast } = useToast();
  const timerRef = useRef(null);

  useEffect(() => {
    const init = async () => {
      try {
        const { data: { workout: w } } = await workoutService.getWorkout(workoutId);
        const flat = buildFlatSets(w);
        if (!flat.length) {
          showToast('Antrenamentul nu are exerciții adăugate.', 'error');
          setTimeout(() => navigate('/workouts', { replace: true }), 1500);
          return;
        }
        setWorkout(w);
        setFlatSets(flat);
        const { data: { session } } = await sessionService.startSession(parseInt(workoutId));
        setSessionId(session.id);
        setActualReps(flat[0].targetReps);
        setPhase('exercising');
      } catch (err) {
        const msg = err.response?.data?.message || 'Eroare la pornirea antrenamentului.';
        showToast(msg, 'error');
        setTimeout(() => navigate('/workouts', { replace: true }), 1500);
      }
    };
    init();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [workoutId]); 

  useEffect(() => {
    if (phase === 'resting' && restTimeLeft === 0 && currentIndex + 1 < flatSets.length) {
      setCurrentIndex(currentIndex + 1);
      setActualReps(flatSets[currentIndex + 1].targetReps);
      setPhase('exercising');
    }
  }, [phase, restTimeLeft, currentIndex, flatSets]);

  const handleSetFinished = () => {
    const set = flatSets[currentIndex];

    setCompletedSets((prev) => [
      ...prev,
      {
        exerciseId: set.exerciseId,
        setNumber: set.setNumber,
        targetReps: set.targetReps,
        actualReps,
      },
    ]);

    if (currentIndex === flatSets.length - 1) {
      if (timerRef.current) clearInterval(timerRef.current);
      setPhase('done');
      return;
    }

    setRestTimeLeft(workout.restTime);
    setPhase('resting');
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setRestTimeLeft((t) => (t > 1 ? t - 1 : 0));
    }, 1000);
  };

  const handleSkipRest = () => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    const nextIdx = currentIndex + 1;
    setCurrentIndex(nextIdx);
    setActualReps(flatSets[nextIdx].targetReps);
    setPhase('exercising');
  };

  const handleFinishWorkout = async () => {
    setSaving(true);
    try {
      await sessionService.finishSession(sessionId, completedSets);
      navigate('/', { replace: true });
    } catch (err) {
      const msg = err.response?.data?.message || 'Eroare la salvarea sesiunii. Încearcă din nou.';
      showToast(msg, 'error');
      setSaving(false);
    }
  };

  const handleAbandon = async () => {
    setShowAbandonDialog(false);
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    try {
      if (sessionId) await sessionService.abandonSession(sessionId);
    } catch (_) {  }
    navigate('/workouts', { replace: true });
  };

  const formatTime = (s) =>
    `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  const uniqueExerciseIds = [...new Set(flatSets.map((s) => s.exerciseId))];
  const currentSet = flatSets[currentIndex];
  const nextSet = flatSets[currentIndex + 1];
  const currentExerciseNum = currentSet
    ? uniqueExerciseIds.indexOf(currentSet.exerciseId) + 1
    : 0;
  const totalExercises = uniqueExerciseIds.length;
  const progressPercent =
    phase === 'done' ? 100 : Math.round((currentIndex / flatSets.length) * 100);

  if (phase === 'loading') {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-900 flex flex-col">
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}

      <ConfirmDialog
        isOpen={showAbandonDialog}
        title="Abandonează antrenamentul"
        message="Ești sigur că vrei să abandonezi? Progresul curent nu va fi salvat."
        onConfirm={handleAbandon}
        onCancel={() => setShowAbandonDialog(false)}
      />

      <div className="flex items-center justify-between px-4 py-4 border-b border-dark-600 shrink-0">
        <h1 className="text-white font-bold text-base truncate flex-1 mr-3">
          {workout?.name}
        </h1>
        {phase !== 'done' && (
          <button
            onClick={() => setShowAbandonDialog(true)}
            className="shrink-0 flex items-center gap-1.5 text-red-400 hover:text-red-300 text-sm font-medium transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            Abandon
          </button>
        )}
      </div>

      <div className="px-4 pt-3 pb-1 shrink-0">
        <div className="flex justify-between text-xs text-gray-500 mb-1.5">
          <span>
            {phase === 'done'
              ? `${flatSets.length} set${flatSets.length !== 1 ? 's' : ''} completed`
              : `Set ${currentIndex + 1} of ${flatSets.length}`}
          </span>
          <span>{progressPercent}%</span>
        </div>
        <div className="w-full bg-dark-700 rounded-full h-2">
          <div
            className="bg-brand-500 h-2 rounded-full transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        {phase !== 'done' && (
          <p className="text-gray-600 text-xs mt-1.5">
            Exercise {currentExerciseNum} of {totalExercises}
          </p>
        )}
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-4 py-6 gap-7">

        {phase === 'exercising' && currentSet && (
          <>
            <div className="text-center space-y-1">
              <p className="text-brand-400 text-xs font-semibold uppercase tracking-widest">
                {currentSet.muscleGroup}
              </p>
              <h2 className="text-white text-3xl font-bold">{currentSet.exerciseName}</h2>
              <p className="text-gray-500 text-sm">
                Set {currentSet.setNumber} of {currentSet.totalSets}
              </p>
            </div>

            <div className="card w-full max-w-xs text-center py-5">
              <p className="text-gray-400 text-xs uppercase tracking-wider mb-3">
                Reps
                {actualReps !== currentSet.targetReps && (
                  <span className="text-gray-600 normal-case tracking-normal ml-1">
                    (target: {currentSet.targetReps})
                  </span>
                )}
              </p>
              <div className="flex items-center justify-center gap-6">
                <button
                  onClick={() => setActualReps((r) => Math.max(1, r - 1))}
                  className="w-12 h-12 bg-dark-600 hover:bg-dark-500 rounded-xl text-white text-2xl font-bold transition-colors flex items-center justify-center select-none"
                >
                  −
                </button>
                <span className="text-white text-5xl font-bold w-16 text-center tabular-nums">
                  {actualReps}
                </span>
                <button
                  onClick={() => setActualReps((r) => r + 1)}
                  className="w-12 h-12 bg-dark-600 hover:bg-dark-500 rounded-xl text-white text-2xl font-bold transition-colors flex items-center justify-center select-none"
                >
                  +
                </button>
              </div>
            </div>

            <button
              onClick={handleSetFinished}
              className="w-full max-w-xs btn-primary py-4 text-base font-bold"
            >
              ✓ Finished
            </button>
          </>
        )}

        {phase === 'resting' && (
          <>
            <div className="text-center space-y-3">
              <p className="text-brand-400 text-sm font-semibold uppercase tracking-widest">
                Rest
              </p>
              <div className="text-white text-8xl font-bold tabular-nums">
                {formatTime(restTimeLeft)}
              </div>
              {nextSet && (
                <p className="text-gray-500 text-sm mt-2">
                  Next:{' '}
                  <span className="text-gray-300">{nextSet.exerciseName}</span>
                  {' · '}Set {nextSet.setNumber} of {nextSet.totalSets}
                </p>
              )}
            </div>

            <button
              onClick={handleSkipRest}
              className="w-full max-w-xs py-3 rounded-xl bg-dark-700 text-gray-300 font-semibold hover:bg-dark-600 transition-colors"
            >
              Skip Rest →
            </button>
          </>
        )}

        {phase === 'done' && (
          <>
            <div className="text-center space-y-3">
              <div className="w-20 h-20 bg-brand-600/20 rounded-full flex items-center justify-center mx-auto">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-white text-2xl font-bold">Well done!</h2>
              <p className="text-gray-400 text-sm">
                {flatSets.length} set{flatSets.length !== 1 ? 's' : ''} completed
              </p>
              <p className="text-gray-600 text-xs">{workout?.name}</p>
            </div>

            <button
              onClick={handleFinishWorkout}
              disabled={saving}
              className="w-full max-w-xs btn-primary py-4 text-base font-bold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Saving...
                </span>
              ) : (
                '✓ Finish Workout'
              )}
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default ActiveWorkoutPage;

