'use client';

import React, { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import type { SheetData, CellStyle } from '@/lib/types';
import { cn } from '@/lib/utils';

interface TimetableDisplayProps {
  data: SheetData;
}

const getCellProps = (style: CellStyle | undefined) => {
  if (!style) return { className: '', style: {} };

  const classNames: string[] = [];
  if (style.bold) classNames.push('font-bold');
  if (style.italic) classNames.push('italic');
  if (style.underline) classNames.push('underline');

  const inlineStyles: React.CSSProperties = {};
  if (style.color) inlineStyles.color = style.color;
  if (style.backgroundColor) inlineStyles.backgroundColor = style.backgroundColor;

  return { className: classNames.join(' '), style: inlineStyles };
};

export function TimetableDisplay({ data }: TimetableDisplayProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!data || data.length === 0) {
    return null;
  }

  const headerRow = data[0] || [];
  const bodyRows = data.slice(1);

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
              <TableRow className="hover:bg-transparent">
                {headerRow.map((cell, index) => {
                  const { className, style } = getCellProps(cell.style);
                  return (
                    <TableHead key={index} className={cn('text-sm', className)} style={style}>
                      {cell.value}
                    </TableHead>
                  );
                })}
              </TableRow>
            </TableHeader>
            <TableBody>
              {bodyRows.map((row, rowIndex) => (
                <TableRow key={rowIndex} className="transition-colors">
                  {row.map((cell, cellIndex) => {
                    const { className, style } = getCellProps(cell.style);
                    return (
                      <TableCell key={cellIndex} className={className} style={style}>
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
