import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { Course, Faculty } from '../types/database';
import { useAuth } from './useAuth';

export function useCourses() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['courses', user?.id],
    enabled: !!user,
    queryFn: async (): Promise<Course[]> => {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .order('faculty', { ascending: true })
        .order('name', { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useCourse(courseId: string | undefined) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['course', courseId],
    enabled: !!user && !!courseId,
    queryFn: async (): Promise<Course | null> => {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('id', courseId!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export interface CreateCourseInput {
  name: string;
  faculty: Faculty;
  code?: string;
  professor?: string;
  icon?: string;
  color?: string;
  semester?: string;
}

export function useCreateCourse() {
  const qc = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (input: CreateCourseInput): Promise<Course> => {
      if (!user) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from('courses')
        .insert({ ...input, user_id: user.id })
        .select()
        .single();
      if (error) throw error;
      return data as Course;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['courses'] }),
  });
}

export function useUpdateCourse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Course> & { id: string }) => {
      const { data, error } = await supabase
        .from('courses')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as Course;
    },
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ['courses'] });
      qc.invalidateQueries({ queryKey: ['course', id] });
    },
  });
}

export function useDeleteCourse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('courses').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['courses'] }),
  });
}
