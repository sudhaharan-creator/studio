
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { XIcon } from 'lucide-react';
import { TimetableSkeleton } from '@/components/timetable-skeleton';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useAppContext } from '@/context/app-context';
import { useAuth } from '@/context/auth-context';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';

export default function ViewPage() {
  const { sheetData, setFilteredSheetData } = useAppContext();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [uniqueCourses, setUniqueCourses] = useState<string[]>([]);
  const [selectedCourses, setSelectedCourses] = useState<string[]>([]);
  const router = useRouter();

  useEffect(() => {
    if (!sheetData) {
      router.push('/');
      return;
    }

    const courses = new Set<string>();
    sheetData.slice(2).forEach(row => {
      row.slice(2).forEach(cell => {
        const courseName = cell.value.replace(/\s*\d+\s*$/, '').trim();
        if (courseName && !/^\(Lunch\)$/i.test(courseName) && !/Registration/i.test(courseName) && isNaN(parseInt(courseName))) {
          courses.add(courseName);
        }
      });
    });
    setUniqueCourses(Array.from(courses).sort());

    const fetchPreferences = async () => {
      if (user) {
        const docRef = doc(db, 'userPreferences', user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setSelectedCourses(docSnap.data().courses || []);
        }
      }
      setIsLoading(false);
    };

    fetchPreferences();
  }, [sheetData, router, user]);

  const handleCourseSelection = (course: string, checked: boolean) => {
    setSelectedCourses(prev =>
      checked
        ? [...prev, course]
        : prev.filter(c => c !== course)
    );
  };
  
  const handleViewTimetableClick = async () => {
    if (!sheetData) return;

    if (user) {
      try {
        const docRef = doc(db, 'userPreferences', user.uid);
        await setDoc(docRef, { courses: selectedCourses });
      } catch (error) {
        console.error("Error saving preferences: ", error);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Could not save your course preferences.',
        });
      }
    }

    let dataToFilter = sheetData;
    if (selectedCourses.length > 0) {
        const headerRows = sheetData.slice(0, 2);
        const bodyRows = sheetData.slice(2);

        const newFilteredData = bodyRows.map(row => {
            const newRow = row.slice(0, 2); // Keep Date and Classroom No.
            row.slice(2).forEach(cell => {
                const courseName = cell.value.replace(/\s*\d+\s*$/, '').trim();
                if (selectedCourses.includes(courseName)) {
                    newRow.push(cell);
                } else {
                    newRow.push({ value: '' });
                }
            });
            return newRow;
        });
        dataToFilter = [...headerRows, ...newFilteredData];
    } else {
        dataToFilter = sheetData;
    }

    setFilteredSheetData(dataToFilter);
    router.push('/view/timetable');
  };

  if (isLoading || !sheetData) {
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
        <Card className="mb-8 shadow-lg border-none">
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="font-headline">Filter Courses</CardTitle>
                  <CardDescription>
                    {user ? 'Select courses to view. Your selections will be saved.' : 'Select courses to view on the timetable or view all.'}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
               <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {uniqueCourses.map(course => (
                  <div key={course} className="flex items-center space-x-2">
                    <Checkbox
                      id={course}
                      checked={selectedCourses.includes(course)}
                      onCheckedChange={(checked) => handleCourseSelection(course, !!checked)}
                    />
                    <Label htmlFor={course} className="cursor-pointer">{course}</Label>
                  </div>
                ))}
              </div>
              
              {selectedCourses.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-4 border-t mt-4">
                  <span className="text-sm font-medium text-muted-foreground">Selected:</span>
                  {selectedCourses.map(course => (
                    <Badge key={course} variant="secondary" className="flex items-center gap-2">
                      {course}
                      <button onClick={() => handleCourseSelection(course, false)} className="appearance-none border-none bg-transparent p-0">
                        <XIcon className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
               <div className="flex flex-wrap gap-2 pt-4 border-t mt-4">
                <Button onClick={handleViewTimetableClick}>
                  {selectedCourses.length > 0 ? 'View Filtered Timetable' : 'View Full Timetable'}
                </Button>
              </div>
            </CardContent>
        </Card>
      </main>
    </div>
  );
}
