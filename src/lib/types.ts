export type CellStyle = {
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  color?: string;
  backgroundColor?: string;
};

export type CellData = {
  value: string;
  style?: CellStyle;
};

export type SheetData = CellData[][];
