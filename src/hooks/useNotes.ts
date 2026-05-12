import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { Note } from '../types/database';
import { useAuth } from './useAuth';

export function useNotes(courseId: string | undefined) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['notes', courseId],
    enabled: !!user && !!courseId,
    queryFn: async (): Promise<Note[]> => {
      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .eq('course_id', courseId!)
        .order('updated_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useCreateNote(courseId: string) {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { title?: string; content?: string }) => {
      if (!user) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from('notes')
        .insert({ course_id: courseId, user_id: user.id, ...input })
        .select()
        .single();
      if (error) throw error;
      return data as Note;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notes', courseId] }),
  });
}

export function useUpdateNote(courseId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Note> & { id: string }) => {
      const { data, error } = await supabase.from('notes').update(updates).eq('id', id).select().single();
      if (error) throw error;
      return data as Note;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notes', courseId] }),
  });
}

export function useDeleteNote(courseId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('notes').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notes', courseId] }),
  });
}
