import type { SheetData } from './types';

export const mockTimetableData: SheetData = [
  // Header Row
  [
    { value: 'Time', style: { bold: true, backgroundColor: '#e2e8f0', color: '#1e293b' } },
    { value: 'Monday', style: { bold: true, backgroundColor: '#e2e8f0', color: '#1e293b' } },
    { value: 'Tuesday', style: { bold: true, backgroundColor: '#e2e8f0', color: '#1e293b' } },
    { value: 'Wednesday', style: { bold: true, backgroundColor: '#e2e8f0', color: '#1e293b' } },
    { value: 'Thursday', style: { bold: true, backgroundColor: '#e2e8f0', color: '#1e293b' } },
    { value: 'Friday', style: { bold: true, backgroundColor: '#e2e8f0', color: '#1e293b' } },
  ],
  // 9:00 - 10:00
  [
    { value: '9:00 - 10:00', style: { bold: true, color: '#475569' } },
    { value: 'Mathematics', style: { backgroundColor: '#c8e6c9' } },
    { value: 'History', style: { backgroundColor: '#ffccbc' } },
    { value: 'Mathematics', style: { backgroundColor: '#c8e6c9' } },
    { value: 'English', style: { backgroundColor: '#bbdefb' } },
    { value: 'Physics', style: { backgroundColor: '#d1c4e9' } },
  ],
  // 10:00 - 11:00
  [
    { value: '10:00 - 11:00', style: { bold: true, color: '#475569' } },
    { value: 'English', style: { backgroundColor: '#bbdefb' } },
    { value: 'Geography', style: { backgroundColor: '#fff9c4' } },
    { value: 'English', style: { backgroundColor: '#bbdefb' } },
    { value: 'History', style: { backgroundColor: '#ffccbc' } },
    { value: 'Chemistry', style: { backgroundColor: '#b2dfdb' } },
  ],
  // 11:00 - 12:00
  [
    { value: '11:00 - 12:00', style: { bold: true, color: '#475569' } },
    { value: 'Physics', style: { backgroundColor: '#d1c4e9' } },
    { value: 'Mathematics', style: { backgroundColor: '#c8e6c9' } },
    { value: 'Physical Ed.', style: { backgroundColor: '#f0f4c3' } },
    { value: 'Biology', style: { backgroundColor: '#dcedc8' } },
    { value: 'Mathematics', style: { backgroundColor: '#c8e6c9' } },
  ],
  // 12:00 - 13:00
  [
    { value: '12:00 - 13:00', style: { bold: true, color: '#008080', backgroundColor: '#ADD8E6', italic: true } },
    { value: 'L', style: { bold: true, backgroundColor: '#e2e8f0' } },
    { value: 'U', style: { bold: true, backgroundColor: '#e2e8f0' } },
    { value: 'N', style: { bold: true, backgroundColor: '#e2e8f0' } },
    { value: 'C', style: { bold: true, backgroundColor: '#e2e8f0' } },
    { value: 'H', style: { bold: true, backgroundColor: '#e2e8f0' } },
  ],
  // 13:00 - 14:00
  [
    { value: '13:00 - 14:00', style: { bold: true, color: '#475569' } },
    { value: 'Chemistry', style: { backgroundColor: '#b2dfdb' } },
    { value: 'Physics', style: { backgroundColor: '#d1c4e9' } },
    { value: 'Geography', style: { backgroundColor: '#fff9c4' } },
    { value: 'Art', style: { backgroundColor: '#f8bbd0' } },
    { value: 'History', style: { backgroundColor: '#ffccbc' } },
  ],
  // 14:00 - 15:00
  [
    { value: '14:00 - 15:00', style: { bold: true, color: '#475569' } },
    { value: 'Biology', style: { backgroundColor: '#dcedc8' } },
    { value: 'English', style: { backgroundColor: '#bbdefb' } },
    { value: 'Music', style: { backgroundColor: '#e1bee7' } },
    { value: 'Mathematics', style: { backgroundColor: '#c8e6c9' } },
    { value: '', style: {} },
  ],
];
