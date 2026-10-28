import { useEffect } from 'react';

const Toast = ({ message, type = 'success', onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const styles = {
    success: 'bg-green-600 border-green-500',
    error: 'bg-red-700 border-red-600',
    warning: 'bg-yellow-600 border-yellow-500',
  };

  return (
    <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-xl border text-white text-sm font-medium shadow-lg ${styles[type]} max-w-xs w-full text-center`}>
      {message}
    </div>
  );
};

export default Toast;
