import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { workoutService } from '../../services/workoutService';
import Toast from '../../components/ui/Toast';
import useToast from '../../hooks/useToast';
import Spinner from '../../components/ui/Spinner';

const EditWorkoutPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast, showToast, hideToast } = useToast();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [restTime, setRestTime] = useState(60);
  const [selectedExercises, setSelectedExercises] = useState([]);

  const [availableExercises, setAvailableExercises] = useState([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      workoutService.getWorkout(id),
      workoutService.getExercises(),
    ])
      .then(([workoutRes, exercisesRes]) => {
        const w = workoutRes.data.workout;
        setName(w.name);
        setDescription(w.description || '');
        setRestTime(w.restTime);
        setSelectedExercises(
          w.exercises.map((we) => ({
            exerciseId: String(we.exerciseId),
            sets: we.sets,
            reps: we.reps,
          }))
        );
        setAvailableExercises(exercisesRes.data.exercises);
      })
      .catch((err) => {
        if (err.response?.status === 404) {
          showToast('Antrenamentul nu mai este disponibil.', 'error');
          setTimeout(() => navigate('/workouts', { replace: true }), 1500);
        } else {
          showToast('Eroare la încărcarea antrenamentului.', 'error');
        }
      })
      .finally(() => setPageLoading(false));
  }, [id]);

  const addExerciseRow = () => {
    setSelectedExercises((prev) => [...prev, { exerciseId: '', sets: 3, reps: 10 }]);
  };

  const removeExerciseRow = (index) => {
    setSelectedExercises((prev) => prev.filter((_, i) => i !== index));
  };

  const updateExerciseRow = (index, field, value) => {
    setSelectedExercises((prev) =>
      prev.map((ex, i) => (i === index ? { ...ex, [field]: value } : ex))
    );
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Numele antrenamentului este obligatoriu.');
      return;
    }
    if (selectedExercises.length === 0) {
      setError('Adaugă cel puțin un exercițiu.');
      return;
    }
    const incomplete = selectedExercises.some(
      (ex) => !ex.exerciseId || ex.sets < 1 || ex.reps < 1
    );
    if (incomplete) {
      setError('Completează exercițiul, seriile și repetările pentru fiecare rând.');
      return;
    }

    setSaving(true);
    try {
      await workoutService.updateWorkout(id, {
        name: name.trim(),
        description: description.trim(),
        restTime: Number(restTime),
        exercises: selectedExercises.map((ex) => ({
          exerciseId: Number(ex.exerciseId),
          sets: Number(ex.sets),
          reps: Number(ex.reps),
        })),
      });

      showToast('Antrenament actualizat!', 'success');

      setTimeout(() => navigate('/workouts', { replace: true }), 800);
    } catch (err) {
      if (err.response?.status === 404) {
        showToast('Antrenamentul nu mai este disponibil.', 'error');
        setTimeout(() => navigate('/workouts', { replace: true }), 1500);
        return;
      }
      const msg = err.response?.data?.message || 'Eroare la salvare.';
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  const exercisesByGroup = availableExercises.reduce((acc, ex) => {
    if (!acc[ex.muscleGroup]) acc[ex.muscleGroup] = [];
    acc[ex.muscleGroup].push(ex);
    return acc;
  }, {});

  if (pageLoading) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-900">
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}

      <div className="flex items-center gap-3 px-4 py-4 border-b border-dark-600">
        <button
          onClick={() => navigate('/workouts')}
          className="text-gray-400 hover:text-white transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-white text-lg font-bold">Edit Workout</h1>
      </div>

      <form onSubmit={handleUpdate} className="px-4 py-4 space-y-5">

        <div>
          <label className="text-gray-400 text-sm mb-1 block">Workout Name *</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="input-field"
          />
        </div>

        <div>
          <label className="text-gray-400 text-sm mb-1 block">Description</label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="input-field"
          />
        </div>

        <div>
          <label className="text-gray-400 text-sm mb-1 block">Rest between sets (seconds)</label>
          <input
            type="number"
            min={10}
            max={300}
            value={restTime}
            onChange={(e) => setRestTime(e.target.value)}
            className="input-field"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-gray-400 text-sm">Exercises *</label>
            <span className="text-gray-500 text-xs">{selectedExercises.length} added</span>
          </div>

          <div className="space-y-3">
            {selectedExercises.map((ex, index) => (
              <div key={index} className="card space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-500 text-xs font-semibold">Exercise {index + 1}</span>
                  <button
                    type="button"
                    onClick={() => removeExerciseRow(index)}
                    className="text-red-400 hover:text-red-300 transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <select
                  value={ex.exerciseId}
                  onChange={(e) => updateExerciseRow(index, 'exerciseId', e.target.value)}
                  className="input-field"
                >
                  <option value="">Select exercise...</option>
                  {Object.entries(exercisesByGroup).map(([group, exList]) => (
                    <optgroup key={group} label={group}>
                      {exList.map((e) => (
                        <option key={e.id} value={e.id}>{e.name}</option>
                      ))}
                    </optgroup>
                  ))}
                </select>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-gray-500 text-xs mb-1 block">Sets</label>
                    <input
                      type="number"
                      min={1}
                      max={20}
                      value={ex.sets}
                      onChange={(e) => updateExerciseRow(index, 'sets', e.target.value)}
                      className="input-field text-center"
                    />
                  </div>
                  <div>
                    <label className="text-gray-500 text-xs mb-1 block">Reps per set</label>
                    <input
                      type="number"
                      min={1}
                      max={100}
                      value={ex.reps}
                      onChange={(e) => updateExerciseRow(index, 'reps', e.target.value)}
                      className="input-field text-center"
                    />
                  </div>
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={addExerciseRow}
              className="w-full py-3 border-2 border-dashed border-dark-500 rounded-xl text-gray-400 hover:border-brand-500 hover:text-brand-500 transition-colors text-sm font-medium flex items-center justify-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Exercise
            </button>
          </div>
        </div>

        {error && (
          <p className="text-red-400 text-sm text-center">{error}</p>
        )}

        <button
          type="submit"
          disabled={saving}
          className="btn-primary flex items-center justify-center gap-2"
        >
          {saving ? (
            <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            'Save Changes'
          )}
        </button>
      </form>
    </div>
  );
};

export default EditWorkoutPage;
