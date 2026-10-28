// UC-3: Deconecteaza Utilizatorul
// Corespunde obiectului «boundary» NavbarMenu din diagrama de secventa
// Diagrama:
//   1. Utilizator apasa Logout (din meniu)
//   2. handleLogout() → POST /api/auth/logout (AuthController)
//   3. AuthController → SessionService.destroySession()
//   4. sesiune invalidata ← SessionService
//   5. redirect login ← AuthController → NavbarMenu primeste raspunsul

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { authService } from '../../services/authService';
import Toast from '../ui/Toast';
import useToast from '../../hooks/useToast';

const NavbarMenu = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { toast, showToast, hideToast } = useToast();

  const handleLogout = async () => {
    setMenuOpen(false);
    try {
      await authService.logout();
    } catch (err) {
      if (!err.response) {
        showToast('Nu există conexiune la rețea. Deconectarea locală a fost efectuată.', 'error');
        logout();
        navigate('/login', { replace: true });
        return;
      }
    } finally {
      logout();
      navigate('/login', { replace: true });
    }
  };

  return (
    <div className="relative">
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
      {/* Buton deschidere meniu */}
      <button
        onClick={() => setMenuOpen((prev) => !prev)}
        className="w-9 h-9 rounded-full bg-brand-600 flex items-center justify-center text-white font-semibold text-sm"
        aria-label="Meniu utilizator"
      >
        {user?.name?.charAt(0).toUpperCase() ?? 'U'}
      </button>

      {menuOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setMenuOpen(false)}
          />
          <div className="absolute right-0 top-11 z-50 bg-dark-700 border border-dark-500 rounded-xl shadow-xl w-44 overflow-hidden">
            <div className="px-4 py-3 border-b border-dark-500">
              <p className="text-white text-sm font-semibold truncate">{user?.name}</p>
              <p className="text-gray-500 text-xs truncate">{user?.email}</p>
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-dark-600 transition-colors text-sm"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Logout
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default NavbarMenu;
