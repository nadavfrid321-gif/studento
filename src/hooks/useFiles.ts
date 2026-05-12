import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { FileRow } from '../types/database';
import { useAuth } from './useAuth';

const BUCKET = 'course-files';

export function useFiles(courseId: string | undefined) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['files', courseId],
    enabled: !!user && !!courseId,
    queryFn: async (): Promise<FileRow[]> => {
      const { data, error } = await supabase
        .from('files')
        .select('*')
        .eq('course_id', courseId!)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useUploadFile(courseId: string) {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (file: File) => {
      if (!user) throw new Error('Not authenticated');
      const path = `${user.id}/${courseId}/${Date.now()}-${file.name}`;
      const { error: upErr } = await supabase.storage.from(BUCKET).upload(path, file, {
        contentType: file.type || 'application/octet-stream',
      });
      if (upErr) throw upErr;
      const { error: insErr, data } = await supabase
        .from('files')
        .insert({
          course_id: courseId,
          user_id: user.id,
          name: file.name,
          storage_path: path,
          mime_type: file.type || null,
          size_bytes: file.size,
        })
        .select()
        .single();
      if (insErr) throw insErr;
      return data as FileRow;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['files', courseId] }),
  });
}

export function useDeleteFile(courseId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (file: FileRow) => {
      await supabase.storage.from(BUCKET).remove([file.storage_path]);
      const { error } = await supabase.from('files').delete().eq('id', file.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['files', courseId] }),
  });
}

export async function downloadFile(file: FileRow): Promise<void> {
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(file.storage_path, 60);
  if (error) throw error;
  window.open(data.signedUrl, '_blank', 'noopener');
}
