import type { Faculty, TaskStatus, TaskType } from '../types/database';

export const facultyLabel: Record<Faculty, string> = {
  law: 'משפטים',
  economics: 'כלכלה',
};

export const taskTypeLabel: Record<TaskType, string> = {
  reading: 'קריאה',
  assignment: 'מטלה / עבודה',
  exam: 'מבחן',
  quiz: 'בוחן',
  event: 'אירוע',
};

export const taskTypeIcon: Record<TaskType, string> = {
  reading: 'menu_book',
  assignment: 'assignment',
  exam: 'school',
  quiz: 'quiz',
  event: 'event',
};

export const taskStatusLabel: Record<TaskStatus, string> = {
  pending: 'ממתין',
  in_progress: 'בעבודה',
  done: 'הושלם',
  late: 'באיחור',
};
