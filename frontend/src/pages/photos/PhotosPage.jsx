import { useState, useEffect, useRef } from 'react';
import { photoService } from '../../services/photoService';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import Toast from '../../components/ui/Toast';
import useToast from '../../hooks/useToast';
import Spinner from '../../components/ui/Spinner';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

const PhotosPage = () => {
  const [view, setView] = useState('folders');
  const [folders, setFolders] = useState([]);
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [photosLoading, setPhotosLoading] = useState(false);

  const [showFolderModal, setShowFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [folderError, setFolderError] = useState('');

  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const fileInputRef = useRef(null);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [lightboxPhoto, setLightboxPhoto] = useState(null);

  const { toast, showToast, hideToast } = useToast();

  const fetchFolders = () => {
    setLoading(true);
    photoService.getFolders()
      .then((res) => setFolders(res.data.folders))
      .catch(() => showToast('Eroare la încărcarea folderelor.', 'error'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchFolders(); }, []);

  const openFolder = (folder) => {
    setSelectedFolder(folder);
    setView('photos');
    setUploadError('');
    setPhotosLoading(true);
    photoService.getFolderPhotos(folder.id)
      .then((res) => setPhotos(res.data.folder.photos))
      .catch(() => showToast('Eroare la încărcarea pozelor.', 'error'))
      .finally(() => setPhotosLoading(false));
  };

  const goBack = () => {
    setView('folders');
    setSelectedFolder(null);
    setPhotos([]);
    setUploadError('');
    fetchFolders(); 
  };

  const openFolderModal = () => {
    setFolderError('');
    setNewFolderName('');
    setShowFolderModal(true);
  };

  const handleCreateFolder = async (e) => {
    e.preventDefault();
    setFolderError('');
    if (!newFolderName.trim()) {
      setFolderError('Introduceți un nume pentru folder.');
      return;
    }
    setCreatingFolder(true);
    try {
      const res = await photoService.createFolder(newFolderName.trim());
      setFolders((prev) => [...prev, { ...res.data.folder, _count: { photos: 0 } }]);
      setNewFolderName('');
      setShowFolderModal(false);
      showToast('Folder creat cu succes!', 'success');
    } catch (err) {
      const msg = err.response?.data?.message || 'Eroare la crearea folderului.';
      setFolderError(msg);
    } finally {
      setCreatingFolder(false);
    }
  };

  const handleUploadClick = () => {
    setUploadError('');
    fileInputRef.current?.click();
  };

  const handleFileSelected = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = ''; 
    if (!file) return;

    if (file.size > MAX_FILE_SIZE) {
      setUploadError('Fișierul depășește limita de 5MB. Te rugăm să încarci o imagine mai mică.');
      return;
    }

    setUploading(true);
    setUploadError('');
    try {
      const formData = new FormData();
      formData.append('photo', file);

      const res = await photoService.uploadPhoto(selectedFolder.id, formData);

      setPhotos((prev) => [res.data.photo, ...prev]);
      setFolders((prev) =>
        prev.map((f) =>
          f.id === selectedFolder.id
            ? { ...f, _count: { photos: (f._count?.photos || 0) + 1 } }
            : f
        )
      );
      showToast('Poza a fost încărcată cu succes!', 'success');
    } catch (err) {
      const status = err.response?.status;
      const msg = err.response?.data?.message || 'Eroare la încărcarea pozei. Încearcă din nou.';

      if (status === 507) {
        setUploadError(msg);
        showToast(msg, 'error');
        return;
      }
      setUploadError(msg);
    } finally {
      setUploading(false);
    }
  };

  const handleDeletePhoto = async () => {
    try {
      await photoService.deletePhoto(deleteTarget);
      setPhotos((prev) => prev.filter((p) => p.id !== deleteTarget));
      setFolders((prev) =>
        prev.map((f) =>
          f.id === selectedFolder?.id
            ? { ...f, _count: { photos: Math.max(0, (f._count?.photos || 1) - 1) } }
            : f
        )
      );
      showToast('Poza a fost ștearsă.', 'success');
      setDeleteTarget(null);
    } catch (err) {
      if (err.response?.status === 404) {
        setPhotos((prev) => prev.filter((p) => p.id !== deleteTarget));
        showToast('Poza nu mai există în sistem.', 'error');
      } else {
        showToast(err.response?.data?.message || 'Eroare la ștergere.', 'error');
      }
      setDeleteTarget(null);
    }
  };

  return (
    <div className="min-h-screen bg-dark-900">
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}

      {lightboxPhoto && (
        <Lightbox photo={lightboxPhoto} onClose={() => setLightboxPhoto(null)} />
      )}

      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Șterge poza"
        message="Ești sigur că vrei să ștergi această poză? Acțiunea este ireversibilă."
        onConfirm={handleDeletePhoto}
        onCancel={() => setDeleteTarget(null)}
      />

      {showFolderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
          <div className="bg-dark-800 border border-dark-600 rounded-2xl p-6 w-full max-w-sm">
            <h3 className="text-white font-semibold text-lg mb-4">New Folder</h3>
            <form onSubmit={handleCreateFolder} className="space-y-4">
              <input
                type="text"
                placeholder="e.g. Back, Arms, Legs..."
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                className="input-field"
                autoFocus
              />
              {folderError && (
                <p className="text-red-400 text-sm">{folderError}</p>
              )}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowFolderModal(false)}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingFolder}
                  className="btn-primary flex-1 disabled:opacity-50"
                >
                  {creatingFolder ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileSelected}
      />

      {view === 'folders' && (
        <>
          <div className="px-4 pt-4 pb-2">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-white text-xl font-bold uppercase tracking-wider">MY PHOTOS</h1>
              <button
                onClick={openFolderModal}
                className="flex items-center gap-1.5 text-brand-400 hover:text-brand-300 text-sm font-semibold transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                </svg>
                New Folder
              </button>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-12"><Spinner /></div>
          ) : folders.length === 0 ? (
            <div className="flex flex-col items-center py-16 px-8 text-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-16 h-16 text-dark-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7a2 2 0 012-2h3.586a1 1 0 01.707.293l1.414 1.414A1 1 0 0011.414 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
              </svg>
              <p className="text-gray-500 mb-2">No folders yet.</p>
              <p className="text-gray-600 text-sm mb-6">Create a folder to start organizing your progress photos.</p>
              <button onClick={openFolderModal} className="btn-primary w-auto px-8">
                Create First Folder
              </button>
            </div>
          ) : (
            <div className="px-4 space-y-3">
              {folders.map((folder) => (
                <FolderCard key={folder.id} folder={folder} onClick={() => openFolder(folder)} />
              ))}
            </div>
          )}


        </>
      )}

      {view === 'photos' && selectedFolder && (
        <>
          <div className="flex items-center gap-3 px-4 py-4 border-b border-dark-600 shrink-0">
            <button
              onClick={goBack}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div className="flex-1 min-w-0">
              <h1 className="text-white font-bold truncate">{selectedFolder.name}</h1>
              <p className="text-gray-600 text-xs">
                {photos.length} photo{photos.length !== 1 ? 's' : ''}
              </p>
            </div>
            <button
              onClick={handleUploadClick}
              disabled={uploading}
              className="flex items-center gap-1.5 text-brand-400 hover:text-brand-300 disabled:opacity-50 text-sm font-semibold transition-colors"
              aria-label="Încărcă poză"
            >
              {uploading ? (
                <span className="w-4 h-4 border-2 border-brand-400 border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              )}
              Upload
            </button>
          </div>

          {uploadError && (
            <div className="mx-4 mt-3 bg-red-900/30 border border-red-700 rounded-xl px-4 py-3 text-red-400 text-sm flex items-start gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{uploadError}</span>
            </div>
          )}

          {photosLoading ? (
            <div className="flex justify-center py-12"><Spinner /></div>
          ) : photos.length === 0 ? (
            <div className="flex flex-col items-center py-16 px-8 text-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-16 h-16 text-dark-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="text-gray-500 mb-2">No photos yet.</p>
              <p className="text-gray-600 text-sm mb-6">Upload your first progress photo to this folder.</p>
              <button
                onClick={handleUploadClick}
                disabled={uploading}
                className="btn-primary w-auto px-8 disabled:opacity-50"
              >
                Upload Photo
              </button>
            </div>
          ) : (
            <div className="px-4 pt-3 pb-28 grid grid-cols-3 gap-2">
              {photos.map((photo) => (
                <PhotoThumbnail
                  key={photo.id}
                  photo={photo}
                  onView={() => setLightboxPhoto(photo)}
                  onDelete={() => setDeleteTarget(photo.id)}
                />
              ))}
            </div>
          )}

        </>
      )}
    </div>
  );
};

const Lightbox = ({ photo, onClose }) => {
  const dateStr = new Date(photo.uploadedAt).toLocaleDateString('ro-RO', {
    day: 'numeric', month: 'long', year: 'numeric',
  });

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 w-9 h-9 bg-dark-700/80 hover:bg-dark-600 rounded-full flex items-center justify-center transition-colors"
        aria-label="Închide"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      <img
        src={photo.url}
        alt={`Progress photo – ${dateStr}`}
        className="max-w-full max-h-[80vh] object-contain rounded-xl shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      />

      <p className="text-gray-400 text-sm mt-4">{dateStr}</p>
    </div>
  );
};

const FolderCard = ({ folder, onClick }) => (
  <button
    onClick={onClick}
    className="card w-full flex items-center gap-4 hover:border-brand-500 transition-colors text-left"
  >
    <div className="w-12 h-12 bg-brand-600/20 rounded-xl flex items-center justify-center shrink-0">
      <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7a2 2 0 012-2h3.586a1 1 0 01.707.293l1.414 1.414A1 1 0 0011.414 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
      </svg>
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-white font-semibold truncate">{folder.name}</p>
      <p className="text-gray-500 text-xs mt-0.5">
        {folder._count?.photos ?? 0} photo{(folder._count?.photos ?? 0) !== 1 ? 's' : ''}
      </p>
    </div>
    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-gray-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  </button>
);

const PhotoThumbnail = ({ photo, onView, onDelete }) => {
  const dateStr = new Date(photo.uploadedAt).toLocaleDateString('ro-RO', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return (
    <div className="relative group aspect-square">
      <button
        className="block w-full h-full focus:outline-none focus:ring-2 focus:ring-brand-500 rounded-xl"
        onClick={onView}
        aria-label="Mărește poza"
      >
        <img
          src={photo.url}
          alt={`Progress photo – ${dateStr}`}
          className="w-full h-full object-cover rounded-xl bg-dark-700"
          loading="lazy"
        />
      </button>
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent rounded-b-xl px-1 pb-1 pointer-events-none">
        <p className="text-white text-xs text-center leading-tight">{dateStr}</p>
      </div>
      <button
        onClick={(e) => { e.stopPropagation(); onDelete(); }}
        className="absolute top-1 right-1 w-7 h-7 bg-red-600/80 hover:bg-red-600 rounded-lg flex items-center justify-center transition-colors z-10"
        aria-label="Șterge poza"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </button>
    </div>
  );
};

export default PhotosPage;

