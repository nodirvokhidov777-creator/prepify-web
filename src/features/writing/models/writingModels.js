export const WritingTaskType = { ACADEMIC_TASK1: 'academicTask1', GENERAL_TASK1: 'generalTask1', ESSAY_TASK2: 'essayTask2' };
export function writingTaskLabel(type) { return type === WritingTaskType.ESSAY_TASK2 ? 'TASK 2' : 'TASK 1'; }
export function writingTaskBadge(type) {
  switch (type) {
    case WritingTaskType.ACADEMIC_TASK1: return 'Academic';
    case WritingTaskType.GENERAL_TASK1: return 'General Training';
    case WritingTaskType.ESSAY_TASK2: return 'Academic + General';
    default: return '';
  }
}
