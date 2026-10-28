import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { workoutService } from '../../services/workoutService';
import Toast from '../../components/ui/Toast';
import useToast from '../../hooks/useToast';

const CreatePublicWorkoutPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user && user.role !== 'ADMIN') {
      navigate('/workouts', { replace: true });
    }
  }, [user, navigate]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [restTime, setRestTime] = useState(60);
  const [selectedExercises, setSelectedExercises] = useState([]);

  const [availableExercises, setAvailableExercises] = useState([]);
  const [exercisesLoading, setExercisesLoading] = useState(true);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { toast, showToast, hideToast } = useToast();

  useEffect(() => {
    workoutService.getExercises()
      .then((res) => setAvailableExercises(res.data.exercises))
      .catch(() => setAvailableExercises([]))
      .finally(() => setExercisesLoading(false));
  }, []);

  const addExerciseRow = () => {
    setSelectedExercises((prev) => [
      ...prev,
      { exerciseId: '', sets: 3, reps: 10 },
    ]);
  };

  const removeExerciseRow = (index) => {
    setSelectedExercises((prev) => prev.filter((_, i) => i !== index));
  };

  const updateExerciseRow = (index, field, value) => {
    setSelectedExercises((prev) =>
      prev.map((ex, i) => (i === index ? { ...ex, [field]: value } : ex))
    );
  };

  const handleSubmit = async (e) => {
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

    setLoading(true);
    try {
      await workoutService.createPublicWorkout({
        name: name.trim(),
        description: description.trim(),
        restTime: Number(restTime),
        exercises: selectedExercises.map((ex) => ({
          exerciseId: Number(ex.exerciseId),
          sets: Number(ex.sets),
          reps: Number(ex.reps),
        })),
      });

      showToast('Antrenament public creat cu succes!', 'success');

      setTimeout(() => navigate('/workouts', { state: { initialTab: 'OUR' }, replace: true }), 800);
    } catch (err) {
      const msg = err.response?.data?.message || 'Eroare la salvare. Încearcă din nou.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/workouts', { state: { initialTab: 'OUR' } });
  };

  const exercisesByGroup = availableExercises.reduce((acc, ex) => {
    if (!acc[ex.muscleGroup]) acc[ex.muscleGroup] = [];
    acc[ex.muscleGroup].push(ex);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-dark-900">
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}

      <div className="flex items-center gap-3 px-4 py-4 border-b border-dark-600">
        <button
          onClick={handleCancel}
          className="text-gray-400 hover:text-white transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="flex items-center gap-2">
          <h1 className="text-white text-lg font-bold">New Public Workout</h1>
          <span className="bg-brand-600 text-white text-xs font-semibold px-2 py-0.5 rounded-full uppercase tracking-wide">
            Public
          </span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="px-4 py-4 space-y-5">

        <div>
          <label className="text-gray-400 text-sm mb-1 block">Workout Name *</label>
          <input
            type="text"
            placeholder="e.g. Full Body Beginner"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="input-field"
          />
        </div>

        <div>
          <label className="text-gray-400 text-sm mb-1 block">Description</label>
          <input
            type="text"
            placeholder="e.g. Antrenament recomandat pentru incepatori"
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

          {exercisesLoading ? (
            <div className="flex justify-center py-4">
              <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="space-y-3">
              {selectedExercises.map((ex, index) => (
                <div key={index} className="card space-y-3">
                  {/* Step 4: Selectare exercitiu */}
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
                className="w-full py-3 border-2 border-dashed border-dark-500 rounded-xl text-gray-400 hover:border-brand-500 hover:text-brand-400 transition-colors text-sm flex items-center justify-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Exercise
              </button>
            </div>
          )}
        </div>

        {error && (
          <div className="bg-red-900/30 border border-red-700 rounded-xl px-4 py-3 text-red-400 text-sm">
            {error}
          </div>
        )}

        <div className="flex gap-3 pb-8">
          <button
            type="button"
            onClick={handleCancel}
            className="flex-1 py-3 rounded-xl bg-dark-700 text-gray-300 font-semibold hover:bg-dark-600 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 btn-primary py-3 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Saving...
              </span>
            ) : (
              'Save Public Workout'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreatePublicWorkoutPage;
