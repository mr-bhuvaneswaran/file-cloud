import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

// Allowed file types and max size
const ALLOWED_TYPE_PREFIXES = ['image/', 'application/pdf', 'text/', 'video/'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const MAX_FILES = 5;

export async function POST(req: NextRequest) {
  // Parse form data
  const formData = await req.formData();
  const files = formData.getAll('file');
  const parent_id = formData.get('parent_id') as string | null;

  // Check file count
  if (files.length === 0) {
    return NextResponse.json({ error: 'No files uploaded.' }, { status: 400 });
  }
  if (files.length > MAX_FILES) {
    return NextResponse.json({ error: 'You can only upload up to 5 files at once.' }, { status: 400 });
  }

  // Get Supabase session from cookies (or Authorization header)
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  }
  const userId = user.id;

  // Process each file
  const results = [];
  for (const file of files) {
    if (!(file instanceof File)) {
      results.push({ error: 'Invalid file.' });
      continue;
    }
    if (file.size > MAX_FILE_SIZE) {
      results.push({ name: file.name, error: 'File size exceeds 10 MB limit.' });
      continue;
    }
    const isAllowed = ALLOWED_TYPE_PREFIXES.some(type => file.type.startsWith(type));
    if (!isAllowed) {
      results.push({ name: file.name, error: 'Only image, PDF, text, and video files are supported.' });
      continue;
    }
    // Sanitize file name and folder path
    const safeFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const folderPath = parent_id ? parent_id.replace(/[^a-zA-Z0-9._-]/g, '_') : 'root';
    const ext = safeFileName.includes('.') ? '.' + safeFileName.split('.').pop() : '';
    const base = safeFileName.replace(ext, '');
    const uniqueFileName = `${base}_${Date.now()}${ext}`;
    const filePath = `${userId}/${folderPath}/${uniqueFileName}`;
    // Upload to Supabase Storage
    const { data, error } = await supabase.storage.from('user-files').upload(filePath, file);
    if (error) {
      results.push({ name: file.name, error: error.message });
      continue;
    }
    // Insert metadata
    const { error: metaError } = await supabase.from('files').insert([
      {
        name: file.name,
        type: 'file',
        user_id: userId,
        parent_id: parent_id || null,
        mimetype: file.type,
        size: file.size,
        url: data?.path,
      },
    ]);
    if (metaError) {
      results.push({ name: file.name, error: metaError.message });
      continue;
    }
    results.push({ name: file.name, success: true });
  }
  return NextResponse.json({ results });
} 