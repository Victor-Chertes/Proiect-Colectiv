import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const DashboardPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="px-4 py-6 space-y-5">
      <div>
        <h1 className="text-white text-2xl font-bold">
          Hello, {user?.name?.split(' ')[0]}!
        </h1>
      </div>

      <div className="card text-center py-6">
        <p className="text-gray-500 text-xs uppercase tracking-widest mb-2">Active Workout</p>
        <p className="text-gray-400 font-semibold">Not Started</p>
        <button
          onClick={() => navigate('/workouts')}
          className="mt-4 px-6 py-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold rounded-xl transition-colors"
        >
          Go to Workouts
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => navigate('/workouts/new')}
          className="card flex flex-col items-center py-5 gap-2 hover:border-brand-500 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span className="text-white text-sm font-semibold">New Workout</span>
        </button>
        <button
          onClick={() => navigate('/progress')}
          className="card flex flex-col items-center py-5 gap-2 hover:border-brand-500 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
          <span className="text-white text-sm font-semibold">Track Progress</span>
        </button>
      </div>
    </div>
  );
};

export default DashboardPage;
