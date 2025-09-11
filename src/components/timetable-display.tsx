'use client';

import React, { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import type { SheetData, CellStyle } from '@/lib/types';
import { cn } from '@/lib/utils';

interface TimetableDisplayProps {
  data: SheetData;
}

const getCellProps = (cell: { style?: CellStyle; colSpan?: number }) => {
  const style = cell.style;
  if (!style && !cell.colSpan) return { className: '', style: {} };

  const classNames: string[] = [];
  if (style?.bold) classNames.push('font-bold');
  if (style?.italic) classNames.push('italic');
  if (style?.underline) classNames.push('underline');

  const inlineStyles: React.CSSProperties = {};
  if (style?.color) inlineStyles.color = style.color;
  if (style?.backgroundColor) inlineStyles.backgroundColor = style.backgroundColor;
  if (style?.borderRight) inlineStyles.borderRight = style.borderRight;

  return { className: classNames.join(' '), style: inlineStyles, colSpan: cell.colSpan };
};

export function TimetableDisplay({ data }: TimetableDisplayProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!data || data.length === 0) {
    return null;
  }

  const headerRows = data.slice(0, 2);
  const bodyRows = data.slice(2);

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
                        className={cn('text-sm text-center', className)}
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
                    const { className, style, colSpan } = getCellProps(cell);
                    return (
                      <TableCell
                        key={cellIndex}
                        className={cn('text-center', className)}
                        style={style}
                        colSpan={colSpan}
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

    