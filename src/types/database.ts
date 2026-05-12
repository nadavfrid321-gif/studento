// Hand-written DB types mirroring supabase/migrations/0001_init.sql.
// Regenerate from project with: supabase gen types typescript --linked > src/types/database.ts

export type Faculty = 'law' | 'economics';
export type TaskType = 'reading' | 'assignment' | 'exam' | 'quiz' | 'event';
export type TaskStatus = 'pending' | 'in_progress' | 'done' | 'late';

export interface Profile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  year: number | null;
  seeded: boolean;
  created_at: string;
}

export interface Course {
  id: string;
  user_id: string;
  name: string;
  code: string | null;
  faculty: Faculty;
  color: string;
  icon: string;
  professor: string | null;
  semester: string | null;
  created_at: string;
}

export interface Task {
  id: string;
  course_id: string;
  user_id: string;
  type: TaskType;
  title: string;
  description: string | null;
  due_date: string | null;
  weight: number | null;
  status: TaskStatus;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface FileRow {
  id: string;
  course_id: string;
  task_id: string | null;
  user_id: string;
  name: string;
  storage_path: string;
  mime_type: string | null;
  size_bytes: number | null;
  created_at: string;
}

export interface Note {
  id: string;
  course_id: string;
  user_id: string;
  title: string | null;
  content: string | null;
  created_at: string;
  updated_at: string;
}

export interface PushSubscriptionRow {
  id: string;
  user_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  created_at: string;
}

export interface ReminderSent {
  id: string;
  task_id: string;
  offset_days: number;
  sent_at: string;
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Partial<Profile> & { id: string };
        Update: Partial<Profile>;
        Relationships: [];
      };
      courses: {
        Row: Course;
        Insert: Partial<Course> & { user_id: string; name: string; faculty: Faculty };
        Update: Partial<Course>;
        Relationships: [];
      };
      tasks: {
        Row: Task;
        Insert: Partial<Task> & { course_id: string; user_id: string; type: TaskType; title: string };
        Update: Partial<Task>;
        Relationships: [];
      };
      files: {
        Row: FileRow;
        Insert: Partial<FileRow> & { course_id: string; user_id: string; name: string; storage_path: string };
        Update: Partial<FileRow>;
        Relationships: [];
      };
      notes: {
        Row: Note;
        Insert: Partial<Note> & { course_id: string; user_id: string };
        Update: Partial<Note>;
        Relationships: [];
      };
      push_subscriptions: {
        Row: PushSubscriptionRow;
        Insert: Partial<PushSubscriptionRow> & {
          user_id: string;
          endpoint: string;
          p256dh: string;
          auth: string;
        };
        Update: Partial<PushSubscriptionRow>;
        Relationships: [];
      };
      reminders_sent: {
        Row: ReminderSent;
        Insert: Partial<ReminderSent> & { task_id: string; offset_days: number };
        Update: Partial<ReminderSent>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      faculty: Faculty;
      task_type: TaskType;
      task_status: TaskStatus;
    };
    CompositeTypes: Record<string, never>;
  };
}
