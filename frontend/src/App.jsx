import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/layout/ProtectedRoute';

import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';

import DashboardPage from './pages/dashboard/DashboardPage';
import WorkoutsPage from './pages/workouts/WorkoutsPage';
import CreateWorkoutPage from './pages/workouts/CreateWorkoutPage';
import CreatePublicWorkoutPage from './pages/workouts/CreatePublicWorkoutPage';
import EditWorkoutPage from './pages/workouts/EditWorkoutPage';
import ActiveWorkoutPage from './pages/active-workout/ActiveWorkoutPage';
import ProgressPage from './pages/progress/ProgressPage';
import ProgressSheetPage from './pages/progress/ProgressSheetPage';
import PhotosPage from './pages/photos/PhotosPage';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/workouts" element={<WorkoutsPage />} />
            <Route path="/workouts/new" element={<CreateWorkoutPage />} />
            <Route path="/workouts/public/new" element={<CreatePublicWorkoutPage />} />
            <Route path="/workouts/:id/edit" element={<EditWorkoutPage />} />
            <Route path="/workouts/:id/start" element={<ActiveWorkoutPage />} />
            <Route path="/progress" element={<ProgressPage />} />
            <Route path="/progress/:id" element={<ProgressSheetPage />} />
            <Route path="/photos" element={<PhotosPage />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
