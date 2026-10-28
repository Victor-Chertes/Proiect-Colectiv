import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { progressService } from '../../services/progressService';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import Toast from '../../components/ui/Toast';
import useToast from '../../hooks/useToast';
import Spinner from '../../components/ui/Spinner';

const ProgressPage = () => {
  const navigate = useNavigate();

  const [sheets, setSheets] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [formName, setFormName] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null); 
  const [deleting, setDeleting] = useState(false);

  const { toast, showToast, hideToast } = useToast();

  const fetchSheets = () => {
    setLoading(true);
    progressService.getSheets()
      .then((res) => setSheets(res.data.sheets))
      .catch(() => showToast('Eroare la încărcarea fișelor de progres.', 'error'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchSheets(); }, []);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await progressService.deleteSheet(deleteTarget);

      setSheets((prev) => prev.filter((s) => s.id !== deleteTarget));
      setDeleteTarget(null);
      showToast('Fișa a fost ștearsă.', 'success');
    } catch (err) {
      const status = err.response?.status;
      const code = err.response?.data?.code;
      const msg = err.response?.data?.message;

      if (status === 404 && code === 'SHEET_NOT_FOUND') {
        setSheets((prev) => prev.filter((s) => s.id !== deleteTarget));
        setDeleteTarget(null);
        showToast('Fișa nu mai există în sistem. Lista a fost actualizată.', 'error');
        return;
      }
      showToast(msg || 'Nu am putut șterge fișa. Te rugăm să încerci din nou.', 'error');
    } finally {
      setDeleting(false);
    }
  };

  const openModal = () => {
    setFormName('');
    setFormDesc('');
    setFormError('');
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!formName.trim()) {
      setFormError('Te rugăm să introduci un nume pentru fișă.');
      return;
    }

    setSaving(true);
    try {
      const res = await progressService.createSheet({
        name: formName.trim(),
        description: formDesc.trim(),
      });

      setSheets((prev) => [res.data.sheet, ...prev]);
      setShowModal(false);
      showToast('Fișa de progres a fost creată!', 'success');
    } catch (err) {
      const status = err.response?.status;
      const msg = err.response?.data?.message;

      if (status === 400 || status === 409) {
        setFormError(msg || 'Date invalide.');
        return;
      }
      showToast(msg || 'Eroare la crearea fișei. Încearcă din nou.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark-900">
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}

      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Șterge fișa de progres"
        message="Ești sigur că vrei să ștergi această fișă și tot istoricul ei? Acțiunea este ireversibilă."
        confirmLabel={deleting ? 'Se șterge...' : 'Da'}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
          <div className="bg-dark-800 border border-dark-600 rounded-2xl p-6 w-full max-w-sm">
            <h3 className="text-white font-semibold text-lg mb-4">New Progress Sheet</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-gray-400 text-xs mb-1.5 uppercase tracking-wider">
                  Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Bench Press Progress"
                  value={formName}
                  onChange={(e) => { setFormName(e.target.value); setFormError(''); }}
                  className="input-field"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-gray-400 text-xs mb-1.5 uppercase tracking-wider">
                  Description
                </label>
                <textarea
                  placeholder="e.g. Tracking my chest press evolution"
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  rows={3}
                  className="input-field resize-none"
                />
              </div>
              {formError && (
                <p className="text-red-400 text-sm">{formError}</p>
              )}
              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="btn-primary flex-1 disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="px-4 pt-4 pb-2">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-white text-xl font-bold uppercase tracking-wider">PROGRESS</h1>
          <button
            onClick={openModal}
            className="flex items-center gap-1.5 text-brand-400 hover:text-brand-300 text-sm font-semibold transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
            New Sheet
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Spinner /></div>
      ) : sheets.length === 0 ? (
        <div className="flex flex-col items-center py-16 px-8 text-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-16 h-16 text-dark-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-gray-500 mb-2">No progress sheets yet.</p>
          <p className="text-gray-600 text-sm mb-6">Create your first sheet to start tracking your progress.</p>
          <button onClick={openModal} className="btn-primary w-auto px-8">
            Create First Sheet
          </button>
        </div>
      ) : (
        <div className="px-4 space-y-3">
          {sheets.map((sheet) => (
            <SheetCard
              key={sheet.id}
              sheet={sheet}
              onClick={() => navigate(`/progress/${sheet.id}`)}
              onDelete={(e) => { e.stopPropagation(); setDeleteTarget(sheet.id); }}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const SheetCard = ({ sheet, onClick, onDelete }) => {
  const dateStr = new Date(sheet.createdAt).toLocaleDateString('ro-RO', {
    day: 'numeric', month: 'short', year: 'numeric',
  });

  return (
    <div className="card flex items-center gap-4 hover:border-brand-500 transition-colors">
      <div className="w-12 h-12 bg-brand-600/20 rounded-xl flex items-center justify-center shrink-0">
        <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      </div>
      <button onClick={onClick} className="flex-1 min-w-0 text-left">
        <p className="text-white font-semibold truncate">{sheet.name}</p>
        {sheet.description && (
          <p className="text-gray-500 text-xs truncate mt-0.5">{sheet.description}</p>
        )}
        <p className="text-gray-600 text-xs mt-1">
          {sheet._count?.entries ?? 0} entr{(sheet._count?.entries ?? 0) !== 1 ? 'ies' : 'y'} · {dateStr}
        </p>
      </button>
      <button
        onClick={onDelete}
        className="w-8 h-8 flex items-center justify-center text-gray-600 hover:text-red-400 transition-colors shrink-0"
        aria-label="Șterge fișa"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </button>
    </div>
  );
};

export default ProgressPage;

