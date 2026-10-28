import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { workoutService } from '../../services/workoutService';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import Toast from '../../components/ui/Toast';
import useToast from '../../hooks/useToast';
import Spinner from '../../components/ui/Spinner';

const WorkoutsPage = () => {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState(
    location.state?.initialTab === 'OUR' ? 'OUR' : 'MY'
  );

  const [workouts, setWorkouts] = useState([]);
  const [publicWorkouts, setPublicWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [publicLoading, setPublicLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null); 
  const [copyingId, setCopyingId] = useState(null); 
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const { toast, showToast, hideToast } = useToast();

  const fetchWorkouts = () => {
    setLoading(true);
    workoutService.getMyWorkouts()
      .then((res) => setWorkouts(res.data.workouts))
      .catch(() => showToast('Eroare la încărcarea antrenamentelor.', 'error'))
      .finally(() => setLoading(false));
  };

  const fetchPublicWorkouts = () => {
    setPublicLoading(true);
    workoutService.getPublicWorkouts()
      .then((res) => setPublicWorkouts(res.data.workouts))
      .catch(() => showToast('Eroare la încărcarea antrenamentelor publice.', 'error'))
      .finally(() => setPublicLoading(false));
  };

  useEffect(() => {
    if (activeTab === 'MY') {
      fetchWorkouts();
    } else {
      fetchPublicWorkouts();
    }
  }, [activeTab]);

  const handleDeleteConfirm = async () => {
    try {
      await workoutService.deleteWorkout(deleteTarget.id);
      if (deleteTarget.type === 'PERSONAL') {
        setWorkouts((prev) => prev.filter((w) => w.id !== deleteTarget.id));
      } else {
        setPublicWorkouts((prev) => prev.filter((w) => w.id !== deleteTarget.id));
      }
      showToast('Antrenament șters.', 'success');
      setDeleteTarget(null);
    } catch (err) {
      if (err.response?.status === 404) {
        showToast('Antrenamentul nu mai există în sistem.', 'error');
        setDeleteTarget(null);
        if (deleteTarget?.type === 'PUBLIC') fetchPublicWorkouts(); else fetchWorkouts();
      } else {
        const msg = err.response?.data?.message || 'Eroare la ștergere. Încearcă din nou.';
        showToast(msg, 'error');
      }
    }
  };

  const handleCopy = async (workoutId) => {
    setCopyingId(workoutId);
    try {
      const res = await workoutService.copyWorkout(workoutId);
      setWorkouts((prev) => [res.data.workout, ...prev]);
      showToast('Antrenament copiat în My Workouts!', 'success');
    } catch (err) {
      const msg = err.response?.data?.message || 'Eroare la copiere. Încearcă din nou.';
      showToast(msg, 'error');
    } finally {
      setCopyingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-dark-900">
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Șterge antrenament"
        message="Ești sigur că vrei să ștergi acest antrenament?"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
      />

      <div className="px-4 pt-4 pb-2">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-white text-xl font-bold uppercase tracking-wider">
            WORKOUTS
          </h1>
          {activeTab === 'MY' && (
            <button
              onClick={() => navigate('/workouts/new')}
              className="flex items-center gap-1.5 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold px-3 py-1.5 rounded-lg transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
              </svg>
              New
            </button>
          )}
          {activeTab === 'OUR' && isAdmin && (
            <button
              onClick={() => navigate('/workouts/public/new')}
              className="flex items-center gap-1.5 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold px-3 py-1.5 rounded-lg transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
              </svg>
              New
            </button>
          )}
        </div>

        <div className="flex bg-dark-800 rounded-xl p-1 border border-dark-600">
          <button
            onClick={() => setActiveTab('MY')}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${
              activeTab === 'MY' ? 'bg-brand-600 text-white' : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            MY WORKOUTS
          </button>
          <button
            onClick={() => setActiveTab('OUR')}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${
              activeTab === 'OUR' ? 'bg-brand-600 text-white' : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            OUR WORKOUTS
          </button>
        </div>
      </div>

      <div className="px-4 py-3 space-y-3">
        {activeTab === 'MY' ? (
          loading ? (
            <div className="flex justify-center py-12"><Spinner /></div>
          ) : workouts.length === 0 ? (
            <div className="flex flex-col items-center py-16 text-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-14 h-14 text-dark-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
              <p className="text-gray-500 mb-6">No workouts yet. Create your first one!</p>
              <button onClick={() => navigate('/workouts/new')} className="btn-primary w-auto px-8">
                Create Workout
              </button>
            </div>
          ) : (
            workouts.map((workout) => (
              <WorkoutCard
                key={workout.id}
                workout={workout}
                onEdit={() => navigate(`/workouts/${workout.id}/edit`)}
                onDelete={() => setDeleteTarget({ id: workout.id, type: 'PERSONAL' })}
                onStart={() => navigate(`/workouts/${workout.id}/start`)}
              />
            ))
          )
        ) : (
          publicLoading ? (
            <div className="flex justify-center py-12"><Spinner /></div>
          ) : publicWorkouts.length === 0 ? (
            <div className="flex flex-col items-center py-16 text-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-14 h-14 text-dark-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <p className="text-gray-500 mb-2">No public workouts yet.</p>
              {isAdmin && (
                <p className="text-gray-600 text-sm mb-6">Create the first public workout for all users.</p>
              )}
              {isAdmin && (
                <button onClick={() => navigate('/workouts/public/new')} className="btn-primary w-auto px-8">
                  Create Public Workout
                </button>
              )}
            </div>
          ) : (
            publicWorkouts.map((workout) => (
              <PublicWorkoutCard
                key={workout.id}
                workout={workout}
                isAdmin={isAdmin}
                isCopying={copyingId === workout.id}
                onCopy={() => handleCopy(workout.id)}
                onDelete={() => setDeleteTarget({ id: workout.id, type: 'PUBLIC' })}
                onStart={() => navigate(`/workouts/${workout.id}/start`)}
              />
            ))
          )
        )}
      </div>
    </div>
  );
};

const WorkoutCard = ({ workout, onEdit, onDelete, onStart }) => (
  <div className="card">
    <div className="flex items-start justify-between mb-1">
      <div className="flex-1 min-w-0">
        <h3 className="text-white font-semibold truncate">{workout.name}</h3>
        {workout.description && (
          <p className="text-gray-500 text-sm truncate mt-0.5">{workout.description}</p>
        )}
        <p className="text-gray-600 text-xs mt-1">
          {workout.exercises.length} exercise{workout.exercises.length !== 1 ? 's' : ''} · {workout.restTime}s rest
        </p>
      </div>
      <div className="flex gap-2 ml-3 shrink-0">
        <button
          onClick={onStart}
          className="w-8 h-8 bg-brand-600 hover:bg-brand-700 rounded-lg flex items-center justify-center transition-colors"
          aria-label="Start"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z" />
          </svg>
        </button>
        <button
          onClick={onEdit}
          className="w-8 h-8 bg-dark-600 hover:bg-dark-500 rounded-lg flex items-center justify-center transition-colors"
          aria-label="Edit"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
        </button>
        <button
          onClick={onDelete}
          className="w-8 h-8 bg-dark-600 hover:bg-red-900 rounded-lg flex items-center justify-center transition-colors"
          aria-label="Delete"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </div>

    {workout.exercises.length > 0 && (
      <div className="mt-3 space-y-1">
        {workout.exercises.slice(0, 3).map((we) => (
          <div key={we.id} className="flex items-center justify-between text-xs">
            <span className="text-gray-400">{we.exercise.name}</span>
            <span className="text-gray-600">{we.sets} × {we.reps}</span>
          </div>
        ))}
        {workout.exercises.length > 3 && (
          <p className="text-gray-600 text-xs">+{workout.exercises.length - 3} more</p>
        )}
      </div>
    )}
  </div>
);

const PublicWorkoutCard = ({ workout, isAdmin, isCopying, onCopy, onDelete, onStart }) => (
  <div className="card">
    <div className="flex items-start justify-between mb-1">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <h3 className="text-white font-semibold truncate">{workout.name}</h3>
          <span className="shrink-0 bg-brand-600/20 text-brand-400 text-xs font-semibold px-1.5 py-0.5 rounded uppercase tracking-wide">
            Public
          </span>
        </div>
        {workout.description && (
          <p className="text-gray-500 text-sm truncate">{workout.description}</p>
        )}
        <p className="text-gray-600 text-xs mt-1">
          {workout.exercises.length} exercise{workout.exercises.length !== 1 ? 's' : ''} · {workout.restTime}s rest
        </p>
      </div>
      <div className="flex gap-2 ml-3 shrink-0">
        <button
          onClick={onStart}
          className="w-8 h-8 bg-brand-600 hover:bg-brand-700 rounded-lg flex items-center justify-center transition-colors"
          aria-label="Start"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z" />
          </svg>
        </button>
        {!isAdmin && (
          <button
            onClick={onCopy}
            disabled={isCopying}
            className="w-8 h-8 bg-dark-600 hover:bg-dark-500 rounded-lg flex items-center justify-center transition-colors disabled:opacity-50"
            aria-label="Copiaza in My Workouts"
            title="Copy to My Workouts"
          >
            {isCopying ? (
              <span className="w-3 h-3 border-2 border-gray-300 border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            )}
          </button>
        )}
        {isAdmin && (
          <button
            onClick={onDelete}
            className="w-8 h-8 bg-dark-600 hover:bg-red-900 rounded-lg flex items-center justify-center transition-colors"
            aria-label="Delete"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        )}
      </div>
    </div>

    {workout.exercises.length > 0 && (
      <div className="mt-3 space-y-1">
        {workout.exercises.slice(0, 3).map((we) => (
          <div key={we.id} className="flex items-center justify-between text-xs">
            <span className="text-gray-400">{we.exercise.name}</span>
            <span className="text-gray-600">{we.sets} × {we.reps}</span>
          </div>
        ))}
        {workout.exercises.length > 3 && (
          <p className="text-gray-600 text-xs">+{workout.exercises.length - 3} more</p>
        )}
      </div>
    )}
  </div>
);

export default WorkoutsPage;

