import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { progressService } from '../../services/progressService';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import Toast from '../../components/ui/Toast';
import useToast from '../../hooks/useToast';
import Spinner from '../../components/ui/Spinner';

const ProgressSheetPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [sheet, setSheet] = useState(null);
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  const [formValue, setFormValue] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [valueError, setValueError] = useState('');
  const [saving, setSaving] = useState(false);

  const [editTarget, setEditTarget] = useState(null); // entry object being edited
  const [editValue, setEditValue] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editError, setEditError] = useState('');
  const [editSaving, setEditSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null); // entry id
  const [deleting, setDeleting] = useState(false);

  const { toast, showToast, hideToast } = useToast();

  const fetchSheet = () => {
    setLoading(true);
    progressService.getSheet(id)
      .then((res) => {
        setSheet(res.data.sheet);
        setEntries(res.data.sheet.entries);
      })
      .catch((err) => {
        const status = err.response?.status;
        if (status === 404 || status === 403) {
          showToast('Fișa nu a fost găsită. Vei fi redirecționat înapoi.', 'error');
          setTimeout(() => navigate('/progress'), 1500);
        } else {
          showToast('Eroare la încărcarea fișei.', 'error');
        }
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchSheet(); }, [id]);

  const handleAddEntry = async (e) => {
    e.preventDefault();
    setValueError('');

    if (!formValue.trim()) {
      setValueError('Trebuie să introduci o valoare pentru a salva progresul.');
      return;
    }

    const numeric = parseFloat(formValue);

    if (isNaN(numeric) || numeric < 0) {
      setValueError('Valoarea introdusă este invalidă. Introdu un număr pozitiv.');
      return;
    }

    setSaving(true);
    try {
      const res = await progressService.addEntry(id, {
        value: numeric,
        notes: formNotes.trim(),
      });

      setEntries((prev) => [res.data.entry, ...prev]);
      setFormValue('');
      setFormNotes('');
      showToast('Progres adăugat!', 'success');
    } catch (err) {
      const status = err.response?.status;
      const code = err.response?.data?.code;
      const msg = err.response?.data?.message;

      if (status === 404 && code === 'SHEET_NOT_FOUND') {
        showToast(msg || 'Fișa nu mai există. Vei fi redirecționat înapoi.', 'error');
        setTimeout(() => navigate('/progress'), 1800);
        return;
      }
      if (status === 400) {
        setValueError(msg || 'Date invalide.');
        return;
      }
      showToast(msg || 'Eroare la salvarea intrării.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const openEdit = (entry) => {
    setEditTarget(entry);
    setEditValue(String(entry.value));
    setEditNotes(entry.notes || '');
    setEditError('');
  };

  const handleEditSave = async (e) => {
    e.preventDefault();
    setEditError('');

    if (!editValue.trim()) {
      setEditError('Trebuie să introduci o valoare.');
      return;
    }
    const numeric = parseFloat(editValue);
    if (isNaN(numeric) || numeric < 0) {
      setEditError('Valoarea introdusă este invalidă. Introdu un număr pozitiv.');
      return;
    }

    setEditSaving(true);
    try {
      const res = await progressService.updateEntry(editTarget.id, {
        value: numeric,
        notes: editNotes.trim(),
      });
      setEntries((prev) => prev.map((e) => e.id === editTarget.id ? res.data.entry : e));
      setEditTarget(null);
      showToast('Intrarea a fost actualizată.', 'success');
    } catch (err) {
      const msg = err.response?.data?.message;
      if (err.response?.status === 400) { setEditError(msg || 'Date invalide.'); return; }
      if (err.response?.status === 404) {
        setEntries((prev) => prev.filter((e) => e.id !== editTarget.id));
        setEditTarget(null);
        showToast('Intrarea nu mai există în sistem.', 'error');
        return;
      }
      showToast(msg || 'Eroare la actualizare.', 'error');
    } finally {
      setEditSaving(false);
    }
  };

  const handleDeleteEntry = async () => {
    setDeleting(true);
    try {
      await progressService.deleteEntry(deleteTarget);
      setEntries((prev) => prev.filter((e) => e.id !== deleteTarget));
      setDeleteTarget(null);
      showToast('Intrarea a fost ștearsă.', 'success');
    } catch (err) {
      if (err.response?.status === 404) {
        setEntries((prev) => prev.filter((e) => e.id !== deleteTarget));
        setDeleteTarget(null);
        showToast('Intrarea nu mai există în sistem.', 'error');
        return;
      }
      showToast(err.response?.data?.message || 'Eroare la ștergere. Încearcă din nou.', 'error');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner />
      </div>
    );
  }

  if (!sheet) return null;

  return (
    <div className="min-h-screen bg-dark-900">
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}

      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Șterge intrarea"
        message="Ești sigur că vrei să ștergi această înregistrare? Acțiunea este ireversibilă."
        confirmLabel={deleting ? 'Se șterge...' : 'Da'}
        onConfirm={handleDeleteEntry}
        onCancel={() => setDeleteTarget(null)}
      />

      {editTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
          <div className="bg-dark-800 border border-dark-600 rounded-2xl p-6 w-full max-w-sm">
            <h3 className="text-white font-semibold text-lg mb-4">Edit Entry</h3>
            <form onSubmit={handleEditSave} className="space-y-3">
              <div>
                <label className="block text-gray-400 text-xs mb-1.5 uppercase tracking-wider">
                  Value <span className="text-red-400">*</span>
                </label>
                <input
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="any"
                  value={editValue}
                  onChange={(e) => { setEditValue(e.target.value); setEditError(''); }}
                  className="input-field"
                  autoFocus
                />
                {editError && <p className="text-red-400 text-xs mt-1.5">{editError}</p>}
              </div>
              <div>
                <label className="block text-gray-400 text-xs mb-1.5 uppercase tracking-wider">
                  Notes <span className="text-gray-600">(optional)</span>
                </label>
                <input
                  type="text"
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  className="input-field"
                />
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setEditTarget(null)} className="btn-secondary flex-1">
                  Cancel
                </button>
                <button type="submit" disabled={editSaving} className="btn-primary flex-1 disabled:opacity-50">
                  {editSaving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="flex items-center gap-3 px-4 py-4 border-b border-dark-600">
        <button
          onClick={() => navigate('/progress')}
          className="text-gray-400 hover:text-white transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-white font-bold truncate">{sheet.name}</h1>
          {sheet.description && (
            <p className="text-gray-500 text-xs truncate mt-0.5">{sheet.description}</p>
          )}
        </div>
      </div>

      <div className="px-4 pt-4 space-y-5 pb-8">
        <div className="card space-y-4">
          <h2 className="text-white font-semibold text-sm uppercase tracking-wider">Add Progress</h2>
          <form onSubmit={handleAddEntry} className="space-y-3">
            <div>
              <label className="block text-gray-400 text-xs mb-1.5 uppercase tracking-wider">
                Value (kg / reps / sec…) <span className="text-red-400">*</span>
              </label>
              <input
                type="number"
                inputMode="decimal"
                min="0"
                step="any"
                placeholder="e.g. 80.5"
                value={formValue}
                onChange={(e) => { setFormValue(e.target.value); setValueError(''); }}
                className="input-field"
              />
              {valueError && (
                <p className="text-red-400 text-xs mt-1.5">{valueError}</p>
              )}
            </div>
            <div>
              <label className="block text-gray-400 text-xs mb-1.5 uppercase tracking-wider">
                Notes <span className="text-gray-600">(optional)</span>
              </label>
              <input
                type="text"
                placeholder="e.g. 3 sets × 5 reps, felt strong"
                value={formNotes}
                onChange={(e) => setFormNotes(e.target.value)}
                className="input-field"
              />
            </div>
            <button
              type="submit"
              disabled={saving}
              className="btn-primary disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Add Progress'}
            </button>
          </form>
        </div>

        <div>
          <h2 className="text-white font-semibold text-sm uppercase tracking-wider mb-3">History</h2>
          {entries.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 text-sm">No entries yet. Add your first progress above.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {entries.map((entry) => (
                <EntryRow
                  key={entry.id}
                  entry={entry}
                  onEdit={() => openEdit(entry)}
                  onDelete={() => setDeleteTarget(entry.id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const EntryRow = ({ entry, onEdit, onDelete }) => {
  const dateStr = new Date(entry.date).toLocaleDateString('ro-RO', {
    day: 'numeric', month: 'short', year: 'numeric',
  });

  return (
    <div className="card flex items-center gap-3">
      {/* Valoare */}
      <div className="w-14 h-14 bg-brand-600/20 rounded-xl flex flex-col items-center justify-center shrink-0">
        <span className="text-brand-400 font-bold text-lg leading-none">{entry.value}</span>
      </div>
      <div className="flex-1 min-w-0">
        {entry.notes ? (
          <p className="text-white text-sm truncate">{entry.notes}</p>
        ) : (
          <p className="text-gray-600 text-sm italic">No notes</p>
        )}
        <p className="text-gray-600 text-xs mt-0.5">{dateStr}</p>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <button
          onClick={onEdit}
          className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-brand-400 transition-colors"
          aria-label="Editează intrarea"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </button>
        <button
          onClick={onDelete}
          className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-red-400 transition-colors"
          aria-label="Șterge intrarea"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default ProgressSheetPage;

