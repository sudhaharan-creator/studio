'use client';

import React, { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import type { SheetData, CellStyle, CellData } from '@/lib/types';
import { cn } from '@/lib/utils';

interface TimetableDisplayProps {
  data: SheetData;
  highlightedCourses?: string[];
}

const getCellProps = (
  cell: { value: string; style?: CellStyle; colSpan?: number, rowSpan?: number },
  isHighlighted?: boolean
) => {
  const style = cell.style || {};

  const classNames: string[] = [];
  if (style?.bold) classNames.push('font-bold');
  if (style?.italic) classNames.push('italic');
  if (style?.underline) classNames.push('underline');

  const inlineStyles: React.CSSProperties = {};
  if (style?.color) inlineStyles.color = style.color;
  if (style?.borderRight) inlineStyles.borderRight = style.borderRight;

  if (isHighlighted) {
    inlineStyles.backgroundColor = 'hsl(var(--accent))';
    inlineStyles.color = 'hsl(var(--accent-foreground))';
  } else {
    if (style?.backgroundColor) inlineStyles.backgroundColor = style.backgroundColor;
  }

  return { className: classNames.join(' '), style: inlineStyles, colSpan: cell.colSpan, rowSpan: cell.rowSpan };
};

const processDataForMerging = (data: SheetData): SheetData => {
  if (!data || data.length <= 2) {
    return data;
  }
  
  const bodyRows = data.slice(2);
  const processedBodyRows: CellData[][] = [];
  
  let i = 0;
  while (i < bodyRows.length) {
    const currentDate = bodyRows[i][0].value;
    let rowSpan = 1;
    let j = i + 1;
    while (j < bodyRows.length && bodyRows[j][0].value === currentDate) {
      rowSpan++;
      j++;
    }
    
    // First row of the merged group
    const firstRowOfGroup = [...bodyRows[i]];
    if (rowSpan > 1) {
      firstRowOfGroup[0] = { ...firstRowOfGroup[0], rowSpan: rowSpan };
    }
    processedBodyRows.push(firstRowOfGroup);

    // Subsequent rows of the merged group
    for (let k = i + 1; k < i + rowSpan; k++) {
      const subsequentRow = [...bodyRows[k]];
      // Remove the date cell
      processedBodyRows.push(subsequentRow.slice(1));
    }
    
    i += rowSpan;
  }

  return [...data.slice(0, 2), ...processedBodyRows];
};


export function TimetableDisplay({ data }: TimetableDisplayProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [processedData, setProcessedData] = useState<SheetData>([]);

  useEffect(() => {
    setIsMounted(true);
    if(data) {
        setProcessedData(processDataForMerging(data));
    }
  }, [data]);

  if (!processedData || processedData.length === 0) {
    return null;
  }

  const headerRows = processedData.slice(0, 2);
  const bodyRows = processedData.slice(2);

  return (
    <Card
      className={cn(
        'shadow-lg border-none transition-all duration-500 ease-in-out',
        isMounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      )}
      aria-live="polite"
    >
      <CardContent className="p-0">
        <div className="overflow-x-auto rounded-lg">
          <Table>
            <TableHeader>
              {headerRows.map((row, rowIndex) => (
                <TableRow key={rowIndex} className="hover:bg-transparent">
                  {row.map((cell, index) => {
                    const { className, style, colSpan } = getCellProps(cell);
                    return (
                      <TableHead
                        key={index}
                        className={cn('text-sm text-center align-middle', className)}
                        style={style}
                        colSpan={colSpan}
                      >
                        {cell.value}
                      </TableHead>
                    );
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {bodyRows.map((row, rowIndex) => (
                <TableRow key={rowIndex} className="transition-colors">
                  {row.map((cell, cellIndex) => {
                    const { className, style, colSpan, rowSpan } = getCellProps(cell);
                    // The first cell might have a rowSpan
                    const isFirstCell = cellIndex === 0 && row.length === bodyRows[0].length;
                    return (
                      <TableCell
                        key={cellIndex}
                        className={cn('text-center align-middle', className)}
                        style={style}
                        colSpan={colSpan}
                        rowSpan={isFirstCell ? rowSpan : undefined}
                      >
                        {cell.value}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
