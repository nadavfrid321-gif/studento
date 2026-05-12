import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { Task, TaskStatus, TaskType } from '../types/database';
import { useAuth } from './useAuth';

export function useTasks(courseId?: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['tasks', user?.id, courseId ?? 'all'],
    enabled: !!user,
    queryFn: async (): Promise<Task[]> => {
      let q = supabase.from('tasks').select('*').order('due_date', { ascending: true, nullsFirst: false });
      if (courseId) q = q.eq('course_id', courseId);
      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useTask(taskId: string | undefined) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['task', taskId],
    enabled: !!user && !!taskId,
    queryFn: async (): Promise<Task | null> => {
      const { data, error } = await supabase.from('tasks').select('*').eq('id', taskId!).maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export interface CreateTaskInput {
  course_id: string;
  type: TaskType;
  title: string;
  description?: string;
  due_date?: string | null;
  weight?: number | null;
}

export function useCreateTask() {
  const qc = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (input: CreateTaskInput): Promise<Task> => {
      if (!user) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from('tasks')
        .insert({ ...input, user_id: user.id })
        .select()
        .single();
      if (error) throw error;
      return data as Task;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks'] }),
  });
}

export function useUpdateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Task> & { id: string }) => {
      const { data, error } = await supabase.from('tasks').update(updates).eq('id', id).select().single();
      if (error) throw error;
      return data as Task;
    },
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ['tasks'] });
      qc.invalidateQueries({ queryKey: ['task', id] });
    },
  });
}

export function useDeleteTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('tasks').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks'] }),
  });
}

export function useSetTaskStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: TaskStatus }) => {
      const completed_at = status === 'done' ? new Date().toISOString() : null;
      const { data, error } = await supabase
        .from('tasks')
        .update({ status, completed_at })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as Task;
    },
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ['tasks'] });
      qc.invalidateQueries({ queryKey: ['task', id] });
    },
  });
}
