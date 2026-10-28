const ConfirmDialog = ({ isOpen, title, message, onConfirm, onCancel, confirmLabel = 'Da', cancelLabel = 'Anulează' }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
      <div className="bg-dark-800 border border-dark-600 rounded-2xl p-6 w-full max-w-sm">
        <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
        <p className="text-gray-400 mb-6">{message}</p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="btn-secondary flex-1">
            {cancelLabel}
          </button>
          <button onClick={onConfirm} className="btn-danger flex-1">
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
