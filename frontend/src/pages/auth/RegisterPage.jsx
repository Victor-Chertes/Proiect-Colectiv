import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../../services/authService';
import Toast from '../../components/ui/Toast';
import useToast from '../../hooks/useToast';

const RegisterPage = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const navigate = useNavigate();
  const { toast, showToast, hideToast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!name.trim() || !email.trim() || !password.trim()) {
      setError('Toate câmpurile sunt obligatorii.');
      return;
    }

    if (password.length < 6) {
      setError('Parola trebuie să aibă cel puțin 6 caractere.');
      return;
    }

    setLoading(true);
    try {
      await authService.register(name, email, password);

      showToast('Cont creat cu succes!', 'success');

      setTimeout(() => navigate('/login', { replace: true }), 1200);
    } catch (err) {
      const msg = err.response?.data?.message || 'A apărut o eroare. Încearcă din nou.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark-900 flex items-center justify-center px-4">
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}

      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="text-brand-500 mb-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold tracking-widest text-white">FITFLOW</h1>
        </div>

        <div className="flex bg-dark-800 rounded-xl p-1 mb-6 border border-dark-600">
          <Link
            to="/login"
            className="flex-1 py-2 rounded-lg text-gray-400 text-sm font-semibold text-center hover:text-gray-200 transition-colors"
          >
            LOGIN
          </Link>
          <button className="flex-1 py-2 rounded-lg bg-brand-600 text-white text-sm font-semibold transition-colors">
            REGISTER
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </span>
            <input
              type="text"
              placeholder="Full Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input-field pl-12"
              autoComplete="name"
              required
            />
          </div>

          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </span>
            <input
              type="email"
              placeholder="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-field pl-12"
              autoComplete="email"
              required
            />
          </div>

          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </span>
            <input
              type="password"
              placeholder="Password (min. 6 characters)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-field pl-12"
              autoComplete="new-password"
              required
            />
          </div>

          {error && (
            <p className="text-red-400 text-sm text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary mt-2 flex items-center justify-center gap-2"
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              'REGISTER'
            )}
          </button>
        </form>

        <p className="text-center mt-6 text-gray-500 text-sm">
          Already have an account?{' '}
          <Link to="/login" className="text-brand-500 font-semibold hover:underline">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;
