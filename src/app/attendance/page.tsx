
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import type { AttendanceRecord } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { TimetableSkeleton } from '@/components/timetable-skeleton';
import { Button } from '@/components/ui/button';
import { ArrowLeftIcon } from 'lucide-react';

type AttendanceMatrix = {
  [courseName: string]: {
    [sessionNumber: number]: 'present' | 'absent';
  };
};

const MAX_SESSIONS = 30;

export default function AttendancePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [attendanceMatrix, setAttendanceMatrix] = useState<AttendanceMatrix>({});
  const [isLoading, setIsLoading] = useState(true);

  const fetchAttendance = useCallback(async () => {
    if (!user) {
        setIsLoading(false);
        return;
    };
    
    try {
      const q = query(
        collection(db, 'attendance'),
        where('userId', '==', user.uid)
      );
      const querySnapshot = await getDocs(q);
      const records: AttendanceRecord[] = [];
      querySnapshot.forEach((doc) => {
        records.push({ id: doc.id, ...doc.data() } as AttendanceRecord);
      });
      
      // Process records into a matrix
      const matrix: AttendanceMatrix = {};
      records.forEach(record => {
        if (!matrix[record.courseName]) {
          matrix[record.courseName] = {};
        }
        if (record.sessionNumber) {
          matrix[record.courseName][record.sessionNumber] = record.status;
        }
      });
      setAttendanceMatrix(matrix);

    } catch (error) {
      console.error('Error fetching attendance records:', error);
    } finally {
        setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/');
      } else {
        fetchAttendance();
      }
    }
  }, [authLoading, user, router, fetchAttendance]);
  
  const courseNames = useMemo(() => Object.keys(attendanceMatrix).sort(), [attendanceMatrix]);
  const sessionHeaders = Array.from({ length: MAX_SESSIONS }, (_, i) => i + 1);


  if (isLoading || authLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground font-body">
        <main className="container mx-auto p-4 sm:p-6 md:p-8">
          <TimetableSkeleton />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground font-body">
      <main className="container mx-auto p-4 sm:p-6 md:p-8">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Attendance History</CardTitle>
              <Button variant="outline" onClick={() => router.back()}>
                <ArrowLeftIcon className="mr-2 h-4 w-4" /> Go Back
              </Button>
            </div>
            <CardDescription>
              Here is a complete record of your attendance across all sessions.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {courseNames.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[150px] sticky left-0 bg-background z-10">Course</TableHead>
                    {sessionHeaders.map(num => (
                      <TableHead key={num} className="text-center">{num}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                    {courseNames.map((courseName) => (
                      <TableRow key={courseName}>
                        <TableCell className="font-medium sticky left-0 bg-background z-10">{courseName}</TableCell>
                        {sessionHeaders.map(sessionNum => {
                          const status = attendanceMatrix[courseName]?.[sessionNum];
                          return (
                            <TableCell key={sessionNum} className="text-center">
                              {status && (
                                <Badge
                                  variant={status === 'present' ? 'default' : 'destructive'}
                                  className="capitalize w-5 h-5 flex items-center justify-center p-0"
                                  title={`${courseName} - Session ${sessionNum}: ${status}`}
                                >
                                  {status.charAt(0).toUpperCase()}
                                </Badge>
                              )}
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </div>
            ) : (
              <div className="text-center py-8">
                  No attendance records found.
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
