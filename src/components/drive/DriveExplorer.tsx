import { useEffect, useRef, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { FolderIcon, DocumentIcon, PlusIcon, ChevronUpIcon, ArrowPathIcon, PencilIcon, TrashIcon, EyeIcon, ChevronRightIcon, HomeIcon } from '@heroicons/react/24/outline';

interface FileItem {
  id: string;
  name: string;
  type: 'file' | 'folder';
  parent_id: string | null;
  mimetype?: string;
  size?: number;
  url?: string;
  created_at?: string;
}

export default function DriveExplorer() {
  const [currentFolder, setCurrentFolder] = useState<string | null>(null);
  const [showNewMenu, setShowNewMenu] = useState(false);
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [showUploadFile, setShowUploadFile] = useState(false);
  const [folderName, setFolderName] = useState('');
  const [uploading, setUploading] = useState(false);
  const [items, setItems] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [renameId, setRenameId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [previewFile, setPreviewFile] = useState<FileItem | null>(null);
  const [breadcrumbs, setBreadcrumbs] = useState<{ id: string | null; name: string }[]>([{ id: null, name: 'My Drive' }]);
  const newMenuRef = useRef<HTMLDivElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
  const [uploadError, setUploadError] = useState<string | null>(null);
  const ALLOWED_MIME_TYPES = [
    'image/*',
    'application/pdf',
    'text/*',
    'video/*'
  ];
  const ALLOWED_TYPE_PREFIXES = [
    'image/',
    'application/pdf',
    'text/',
    'video/'
  ];
  const [selectedFileNames, setSelectedFileNames] = useState<string[]>([]);

  // Drag and drop state
  const [dragActive, setDragActive] = useState(false);

  // Fetch user and files/folders
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setUserId(data.user.id);
    });
  }, []);

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    let query = supabase.from('files').select('*').eq('user_id', userId);
    if (currentFolder) query = query.eq('parent_id', currentFolder);
    else query = query.is('parent_id', null);
    query.order('type', { ascending: false }).order('name', { ascending: true })
      .then(({ data, error }) => {
        if (error) setError(error.message);
        else setItems(data as FileItem[]);
        setLoading(false);
      });
  }, [userId, currentFolder]);

  // Breadcrumbs
  useEffect(() => {
    if (!currentFolder) {
      setBreadcrumbs([{ id: null, name: 'My Drive' }]);
      return;
    }
    // Build breadcrumbs by traversing up
    const build = async (folderId: string, acc: { id: string | null; name: string }[]) => {
      const { data } = await supabase.from('files').select('id, name, parent_id').eq('id', folderId).single();
      if (data) {
        acc.unshift({ id: data.id, name: data.name });
        if (data.parent_id) {
          await build(data.parent_id, acc);
        } else {
          acc.unshift({ id: null, name: 'My Drive' });
        }
      }
      return acc;
    };
    build(currentFolder, []).then(setBreadcrumbs);
  }, [currentFolder]);

  // Create folder
  const handleCreateFolder = async () => {
    if (!folderName.trim() || !userId) return;
    setLoading(true);
    await supabase.from('files').insert([
      {
        name: folderName,
        type: 'folder',
        user_id: userId,
        parent_id: currentFolder,
      },
    ]);
    setShowCreateFolder(false);
    setFolderName('');
    setLoading(false);
    refreshItems();
  };

  // Upload files
  const handleUploadFile = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploadError(null);
    if (!fileInputRef.current?.files?.length || !userId) return;
    const files = Array.from(fileInputRef.current.files);
    if (files.length > 5) {
      setUploadError('You can only upload up to 5 files at once.');
      return;
    }
    setUploading(true);
    setError(null);
    let anyError = false;
    for (const file of files) {
      if (file.size > MAX_FILE_SIZE) {
        setUploadError('File size exceeds 10 MB limit.');
        anyError = true;
        break;
      }
      const isAllowed = ALLOWED_TYPE_PREFIXES.some(type => file.type.startsWith(type));
      if (!isAllowed) {
        setUploadError('Only image, PDF, text, and video files are supported.');
        anyError = true;
        break;
      }
    }
    if (anyError) {
      setUploading(false);
      return;
    }
    // Upload each file
    for (const file of files) {
      // Sanitize file name and folder path
      const safeFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const folderPath = currentFolder ? currentFolder.toString().replace(/[^a-zA-Z0-9._-]/g, '_') : 'root';
      const ext = safeFileName.includes('.') ? '.' + safeFileName.split('.').pop() : '';
      const base = safeFileName.replace(ext, '');
      const uniqueFileName = `${base}_${Date.now()}${ext}`;
      const filePath = `${userId}/${folderPath}/${uniqueFileName}`;
      const upload = supabase.storage.from('user-files').upload(filePath, file);
      const { data, error } = await upload;
      if (error) {
        setError(error.message);
        continue;
      }
      // Insert metadata
      const { error: metaError } = await supabase.from('files').insert([
        {
          name: file.name,
          type: 'file',
          user_id: userId,
          parent_id: currentFolder,
          mimetype: file.type,
          size: file.size,
          url: data?.path,
        },
      ]);
      if (metaError) setError(metaError.message);
    }
    setUploading(false);
    setShowUploadFile(false);
    setSelectedFileNames([]);
    if (fileInputRef.current) fileInputRef.current.value = '';
    refreshItems();
  };

  // Refresh items
  const refreshItems = async () => {
    if (!userId) return;
    let query = supabase.from('files').select('*').eq('user_id', userId);
    if (currentFolder) query = query.eq('parent_id', currentFolder);
    else query = query.is('parent_id', null);
    const { data } = await query.order('type', { ascending: false }).order('name', { ascending: true });
    setItems(data as FileItem[]);
  };

  // Navigation
  const handleEnterFolder = (id: string) => setCurrentFolder(id);
  const handleGoUp = () => {
    if (!currentFolder) return;
    // Find parent of current folder
    const folder = items.find(i => i.id === currentFolder);
    setCurrentFolder(folder?.parent_id || null);
  };

  // Rename
  const handleRename = (item: FileItem) => {
    setRenameId(item.id);
    setRenameValue(item.name);
  };
  const handleRenameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!renameId || !renameValue.trim()) return;
    await supabase.from('files').update({ name: renameValue }).eq('id', renameId);
    setRenameId(null);
    setRenameValue('');
    refreshItems();
  };

  // Delete
  const handleDelete = async (item: FileItem) => {
    if (item.type === 'file' && item.url) {
      await supabase.storage.from('user-files').remove([item.url]);
    }
    await supabase.from('files').delete().eq('id', item.id);
    refreshItems();
  };

  // Preview
  const handlePreview = (item: FileItem) => setPreviewFile(item);

  // Close New menu on outside click
  useEffect(() => {
    if (!showNewMenu) return;
    const handleClick = (e: MouseEvent) => {
      if (newMenuRef.current && !newMenuRef.current.contains(e.target as Node)) {
        setShowNewMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showNewMenu]);

  // Close Create Folder/Upload File popups on outside click
  useEffect(() => {
    if (!showCreateFolder && !showUploadFile) return;
    const handleClick = (e: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
        setShowCreateFolder(false);
        setShowUploadFile(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showCreateFolder, showUploadFile]);

  // File input change handler
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError(null);
    const files = e.target.files ? Array.from(e.target.files) : [];
    if (files.length > 5) {
      setUploadError('You can only upload up to 5 files at once.');
      setSelectedFileNames([]);
      fileInputRef.current!.value = '';
      return;
    }
    let anyInvalid = false;
    for (const file of files) {
      const isAllowed = ALLOWED_TYPE_PREFIXES.some(type => file.type.startsWith(type));
      if (!isAllowed) {
        setUploadError('Only image, PDF, text, and video files are supported.');
        setSelectedFileNames([]);
        fileInputRef.current!.value = '';
        anyInvalid = true;
        break;
      }
    }
    if (!anyInvalid) {
      setSelectedFileNames(files.map(f => f.name));
    }
  };

  // Drag and drop handlers
  const handleDrag = (e: React.DragEvent<HTMLLabelElement | HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    else if (e.type === 'dragleave') setDragActive(false);
  };
  const handleDrop = (e: React.DragEvent<HTMLLabelElement | HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    setUploadError(null);
    if (e.dataTransfer.files && e.dataTransfer.files.length) {
      const files = Array.from(e.dataTransfer.files);
      if (files.length > 5) {
        setUploadError('You can only upload up to 5 files at once.');
        setSelectedFileNames([]);
        fileInputRef.current!.value = '';
        return;
      }
      let anyInvalid = false;
      for (const file of files) {
        const isAllowed = ALLOWED_TYPE_PREFIXES.some(type => file.type.startsWith(type));
        if (!isAllowed) {
          setUploadError('Only image, PDF, text, and video files are supported.');
          setSelectedFileNames([]);
          fileInputRef.current!.value = '';
          anyInvalid = true;
          break;
        }
      }
      if (!anyInvalid) {
        setSelectedFileNames(files.map(f => f.name));
        // Set files to input
        const dataTransfer = new DataTransfer();
        files.forEach(f => dataTransfer.items.add(f));
        fileInputRef.current!.files = dataTransfer.files;
      }
    }
  };

  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [signedUrlLoading, setSignedUrlLoading] = useState(false);

  // Fetch signed URL for preview
  useEffect(() => {
    if (previewFile?.url) {
      setSignedUrl(null);
      setSignedUrlLoading(true);
      supabase.storage.from('user-files').createSignedUrl(previewFile.url, 60 * 60)
        .then(({ data }) => {
          setSignedUrl(data?.signedUrl || null);
          setSignedUrlLoading(false);
        });
    } else {
      setSignedUrl(null);
      setSignedUrlLoading(false);
    }
  }, [previewFile]);

  return (
    <div className="bg-white/80 rounded-xl shadow-lg p-4">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-2 mb-4 text-sm text-purple-700">
        {breadcrumbs.map((bc, idx) => (
          <span key={bc.id || 'root'} className="flex items-center gap-1">
            {idx > 0 && <ChevronRightIcon className="w-4 h-4" />}
            <button
              className={idx === breadcrumbs.length - 1 ? 'font-bold' : 'hover:underline'}
              onClick={() => setCurrentFolder(bc.id)}
              disabled={idx === breadcrumbs.length - 1}
            >
              {bc.id === null ? <HomeIcon className="w-4 h-4 inline" /> : bc.name}
            </button>
          </span>
        ))}
      </nav>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="font-bold text-lg text-purple-700">My Drive</span>
        </div>
        <div className="relative" ref={newMenuRef}>
          <button
            className="flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-pink-400 to-purple-500 text-white rounded shadow hover:scale-105 transition-transform"
            onClick={() => setShowNewMenu(v => !v)}
          >
            <PlusIcon className="w-5 h-5" /> New
          </button>
          {showNewMenu && (
            <div className="absolute right-0 mt-2 w-40 bg-white rounded-xl shadow-xl py-2 z-20 animate-fade-in">
              <button className="w-full text-left px-4 py-2 hover:bg-pink-50" onClick={() => { setShowNewMenu(false); setShowCreateFolder(true); }}>
                Create Folder
              </button>
              <button className="w-full text-left px-4 py-2 hover:bg-pink-50" onClick={() => { setShowNewMenu(false); setShowUploadFile(true); }}>
                Upload File
              </button>
            </div>
          )}
        </div>
      </div>
      {loading ? (
        <div className="flex items-center gap-2 text-purple-500"><ArrowPathIcon className="w-5 h-5 animate-spin" /> Loading...</div>
      ) : error ? (
        <div className="text-pink-600">{error}</div>
      ) : (
        <ul className="divide-y divide-gray-200">
          {currentFolder && (
            <li
              className="flex items-center gap-3 py-2 cursor-pointer hover:bg-purple-50 rounded transition text-purple-600 font-semibold"
              onClick={handleGoUp}
            >
              <ChevronUpIcon className="w-6 h-6" />
              .. Up
            </li>
          )}
          {items.map(item => (
            <li
              key={item.id}
              className="flex items-center gap-3 py-2 group cursor-pointer hover:bg-purple-50 rounded transition"
              onClick={() => item.type === 'folder' ? handleEnterFolder(item.id) : undefined}
            >
              {item.type === 'folder' ? (
                <FolderIcon className="w-6 h-6 text-yellow-500" />
              ) : (
                <DocumentIcon className="w-6 h-6 text-blue-500" />
              )}
              {renameId === item.id ? (
                <form onSubmit={handleRenameSubmit} className="flex items-center gap-2 w-full">
                  <input
                    className="border px-2 py-1 rounded w-32"
                    value={renameValue}
                    onChange={e => setRenameValue(e.target.value)}
                    autoFocus
                  />
                  <button type="submit" className="text-green-600 font-bold">Save</button>
                  <button type="button" className="text-gray-400" onClick={() => setRenameId(null)}>Cancel</button>
                </form>
              ) : (
                <span className="font-medium text-gray-800 flex-1 truncate">{item.name}</span>
              )}
              {/* Actions */}
              <div className="flex gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition">
                <button className="hover:text-purple-600" onClick={e => { e.stopPropagation(); handleRename(item); }} title="Rename"><PencilIcon className="w-4 h-4" /></button>
                <button className="hover:text-pink-600" onClick={e => { e.stopPropagation(); handleDelete(item); }} title="Delete"><TrashIcon className="w-4 h-4" /></button>
                {item.type === 'file' && (
                  <button className="hover:text-blue-600" onClick={e => { e.stopPropagation(); handlePreview(item); }} title="Preview"><EyeIcon className="w-4 h-4" /></button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
      {/* Create Folder Popup */}
      {showCreateFolder && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/30 z-30">
          <div className="bg-white rounded-xl shadow-xl p-6 w-80 flex flex-col gap-4" ref={popupRef}>
            <h2 className="text-lg font-bold text-purple-700">Create Folder</h2>
            <input
              className="border px-2 py-1 rounded"
              placeholder="Folder name"
              value={folderName}
              onChange={e => setFolderName(e.target.value)}
              autoFocus
            />
            <div className="flex gap-2 justify-end">
              <button className="px-3 py-1 rounded bg-gray-100" onClick={() => setShowCreateFolder(false)}>Cancel</button>
              <button className="px-3 py-1 rounded bg-gradient-to-r from-pink-400 to-purple-500 text-white font-bold" onClick={handleCreateFolder} disabled={!folderName.trim()}>Create</button>
            </div>
          </div>
        </div>
      )}
      {/* Upload File Popup */}
      {showUploadFile && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/30 z-30">
          <form className="bg-white rounded-xl shadow-xl p-6 w-80 flex flex-col gap-4" onSubmit={handleUploadFile}>
            <h2 className="text-lg font-bold text-purple-700">Upload File</h2>
            <div className="text-xs text-gray-500 mb-1">Max file size: 10 MB. Only image, PDF, text, and video files are supported.</div>
            <label
              htmlFor="file-upload"
              className={
                `flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-6 cursor-pointer transition-all ${dragActive ? 'border-pink-500 bg-pink-50' : 'border-purple-300 bg-purple-50 hover:border-pink-400'}`
              }
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
            >
              <span className="text-lg font-semibold text-purple-700 mb-2">Drag & Drop or Click to Select</span>
              <span className="text-xs text-gray-500 mb-2">(Only image, PDF, text, and video files. Max 10 MB.)</span>
              <input
                id="file-upload"
                type="file"
                ref={fileInputRef}
                required
                className="hidden"
                accept={ALLOWED_MIME_TYPES.join(',')}
                onChange={handleFileChange}
                multiple
              />
              <span className="text-sm text-gray-700 truncate max-w-[180px]">
                {selectedFileNames.length > 0 ? selectedFileNames.join(', ') : ''}
              </span>
              <div className="text-xs text-pink-600">You can upload up to 5 files at once.</div>
            </label>
            {uploadError && <div className="text-pink-600 text-sm">{uploadError}</div>}
            {uploading && (
              <div className="flex items-center gap-2 text-purple-500">
                <ArrowPathIcon className="w-5 h-5 animate-spin" /> Uploading...
              </div>
            )}
            {error && <div className="text-pink-600 text-sm">{error}</div>}
            <div className="flex gap-2 justify-end">
              <button className="px-3 py-1 rounded bg-gray-100" type="button" onClick={() => setShowUploadFile(false)}>Cancel</button>
              <button className="px-3 py-1 rounded bg-gradient-to-r from-pink-400 to-purple-500 text-white font-bold" type="submit" disabled={uploading}>Upload</button>
            </div>
          </form>
        </div>
      )}
      {/* File Preview Popup */}
      {previewFile && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-40">
          <div className="bg-white rounded-xl shadow-xl p-6 w-[90vw] max-w-2xl flex flex-col gap-4 relative">
            <button className="absolute top-2 right-2 text-gray-400 hover:text-pink-500" onClick={() => setPreviewFile(null)}>&times;</button>
            <h2 className="text-lg font-bold text-purple-700 mb-2">Preview: {previewFile.name}</h2>
            {signedUrlLoading ? (
              <div className="flex items-center gap-2 text-purple-500"><ArrowPathIcon className="w-5 h-5 animate-spin" /> Loading preview...</div>
            ) : previewFile.mimetype?.startsWith('image/') ? (
              <img src={signedUrl || ''} alt={previewFile.name} className="max-h-96 rounded shadow" />
            ) : previewFile.mimetype?.includes('pdf') ? (
              <iframe src={signedUrl || ''} title={previewFile.name} className="w-full h-96 rounded shadow" />
            ) : (
              <div className="flex flex-col gap-2 items-center justify-center text-gray-700">
                <div className="text-2xl font-bold text-purple-700 flex items-center gap-2">
                  <DocumentIcon className="w-8 h-8 text-blue-500" />
                  {previewFile.name}
                </div>
                <div className="flex flex-col gap-1 mt-2 text-sm">
                  <div><span className="font-semibold">Type:</span> {previewFile.mimetype || 'Unknown'}</div>
                  <div><span className="font-semibold">Size:</span> {previewFile.size ? (previewFile.size / 1024).toFixed(2) + ' KB' : 'Unknown'}</div>
                  <div>
                    <span className="font-semibold">Uploaded:</span> {'created_at' in previewFile && previewFile.created_at ? new Date(previewFile.created_at).toLocaleString() : 'Unknown'}
                  </div>
                </div>
                <div className="mt-4 text-gray-400">No preview available for this file type.</div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
} 