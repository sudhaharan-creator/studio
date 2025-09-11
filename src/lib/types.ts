
export type CellStyle = {
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  color?: string;
  backgroundColor?: string;
  borderRight?: string;
};

export type CellData = {
  value: string;
  style?: CellStyle;
  colSpan?: number;
  rowSpan?: number;
};

export type SheetData = CellData[][];

export type AttendanceStatus = 'present' | 'absent';

export type AttendanceRecord = {
  id: string;
  userId: string;
  sessionId: string;
  date: string;
  time: string;
  courseName: string;
  status: AttendanceStatus;
  sessionNumber: number;
};
