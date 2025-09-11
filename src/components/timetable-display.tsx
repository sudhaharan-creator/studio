
'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import type { SheetData, CellStyle, AttendanceStatus } from '@/lib/types';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/auth-context';
import { Button } from './ui/button';
import { db } from '@/lib/firebase';
import { collection, deleteDoc, doc, getDocs, query, setDoc, where } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

interface TimetableDisplayProps {
  data: SheetData;
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

export function TimetableDisplay({ data }: TimetableDisplayProps) {
  const [isMounted, setIsMounted] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const [attendance, setAttendance] = useState<Record<string, AttendanceStatus | undefined>>({});

  const generateSessionId = (date: string, time: string, courseName: string, sessionNumber: number) => {
    return `${date}-${time}-${courseName}-${sessionNumber}`.replace(/[^a-zA-Z0-9-]/g, '');
  };

  const fetchAttendance = useCallback(async () => {
    if (!user || !data) return;

    const q = query(collection(db, 'attendance'), where('userId', '==', user.uid));
    const querySnapshot = await getDocs(q);
    const attendanceData: Record<string, AttendanceStatus> = {};
    querySnapshot.forEach((doc) => {
      const docData = doc.data();
      attendanceData[docData.sessionId] = docData.status as AttendanceStatus;
    });
    setAttendance(attendanceData);
  }, [user, data]);

  useEffect(() => {
    setIsMounted(true);
    fetchAttendance();
  }, [data, fetchAttendance]);

  const handleAttendance = async (sessionId: string, date: string, time: string, course: string, sessionNumber: number, status: AttendanceStatus) => {
    if (!user) return;

    const docId = `${user.uid}_${sessionId}`;
    const currentStatus = attendance[sessionId];

    if (currentStatus === status) {
      try {
        await deleteDoc(doc(db, 'attendance', docId));
        setAttendance(prev => {
          const newAttendance = { ...prev };
          delete newAttendance[sessionId];
          return newAttendance;
        });
        toast({
          title: 'Success',
          description: 'Attendance record removed.',
        });
      } catch (error) {
        console.error('Error removing attendance:', error);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to remove attendance.',
        });
      }
    } else {
      try {
        await setDoc(doc(db, 'attendance', docId), {
          userId: user.uid,
          sessionId,
          date,
          time,
          courseName: course,
          status,
          sessionNumber: sessionNumber,
        });
        setAttendance(prev => ({ ...prev, [sessionId]: status }));
        toast({
          title: 'Success',
          description: `Attendance marked as ${status}.`,
        });
      } catch (error) {
        console.error('Error updating attendance:', error);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to update attendance.',
        });
      }
    }
  };
  
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
              {bodyRows.map((row, rowIndex) => {
                const date = row[0]?.value;
                return (
                <TableRow key={rowIndex} className="transition-colors">
                  {row.map((cell, cellIndex) => {
                    const { className, style, colSpan, rowSpan } = getCellProps(cell);
                    
                    if (user && cellIndex > 1 && cell.value.trim() !== '') {
                      const time = headerRows[1][cellIndex]?.value;
                      const fullCourseText = cell.value.trim();
                      
                      const match = fullCourseText.match(/^(.*?)\s*(\d+)$/);

                      if (!match) {
                        return (
                          <TableCell
                            key={cellIndex}
                            className={cn('text-center align-middle', className)}
                            style={style}
                            colSpan={colSpan}
                            rowSpan={rowSpan}
                          >
                            {cell.value}
                          </TableCell>
                        );
                      }
                      
                      const courseName = match[1].trim();
                      const sessionNumber = parseInt(match[2], 10);
                      
                      if (!courseName || isNaN(sessionNumber)) {
                        return (
                          <TableCell
                            key={cellIndex}
                            className={cn('text-center align-middle', className)}
                            style={style}
                            colSpan={colSpan}
                            rowSpan={rowSpan}
                          >
                            {cell.value}
                          </TableCell>
                        );
                      }

                      const sessionId = generateSessionId(date, time, courseName, sessionNumber);
                      const currentStatus = attendance[sessionId];

                      return (
                        <TableCell
                          key={cellIndex}
                          className={cn('text-center align-middle', className)}
                          style={style}
                          colSpan={colSpan}
                          rowSpan={rowSpan}
                        >
                          <div className='flex flex-col items-center gap-2'>
                            <span>{cell.value}</span>
                            <div className='flex gap-1'>
                              <Button
                                size="sm"
                                variant={currentStatus === 'present' ? 'default' : 'outline'}
                                onClick={() => handleAttendance(sessionId, date, time, courseName, sessionNumber, 'present')}
                                className='h-6 px-2 text-xs'
                              >
                                P
                              </Button>
                              <Button
                                size="sm"
                                variant={currentStatus === 'absent' ? 'destructive' : 'outline'}
                                onClick={() => handleAttendance(sessionId, date, time, courseName, sessionNumber, 'absent')}
                                className='h-6 px-2 text-xs'
                              >
                                A
                              </Button>
                            </div>
                          </div>
                        </TableCell>
                      );
                    }

                    return (
                      <TableCell
                        key={cellIndex}
                        className={cn('text-center align-middle', className)}
                        style={style}
                        colSpan={colSpan}
                        rowSpan={rowSpan}
                      >
                        {cell.value}
                      </TableCell>
                    );
                  })}
                </TableRow>
              )})}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
