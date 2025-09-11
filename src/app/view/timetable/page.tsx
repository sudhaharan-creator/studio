
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeftIcon, Loader2 } from 'lucide-react';
import { TimetableDisplay } from '@/components/timetable-display';
import { TimetableSkeleton } from '@/components/timetable-skeleton';
import { useAppContext } from '@/context/app-context';
import type { SheetData } from '@/lib/types';
import { TodayScheduleCards } from '@/components/today-schedule-cards';
import { useAuth } from '@/context/auth-context';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function TimetablePage() {
  const { sheetData, filteredSheetData, setFilteredSheetData, isSheetDataLoading } = useAppContext();
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  
  const [view, setView] = useState<'full' | 'today'>('full');
  const [dailySchedule, setDailySchedule] = useState<SheetData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const applyFilter = useCallback((data: SheetData, courses: string[]) => {
    if (courses.length > 0) {
        const headerRows = data.slice(0, 2);
        const bodyRows = data.slice(2);

        const newFilteredData = bodyRows.map(row => {
            const newRow = row.slice(0, 2); // Keep Date and Classroom No.
            row.slice(2).forEach(cell => {
                const courseName = cell.value.trim();
                if (courses.includes(courseName)) {
                    newRow.push(cell);
                } else {
                    newRow.push({ value: '' });
                }
            });
            return newRow;
        });
        return [...headerRows, ...newFilteredData];
    }
    return data;
  }, []);

  useEffect(() => {
    const initializeTimetable = async () => {
      // If data is already filtered, we're good.
      if (filteredSheetData) {
        setIsLoading(false);
        return;
      }
      
      // If there's no sheet data at all, user needs to go back.
      if (!isSheetDataLoading && !sheetData) {
        router.replace('/view');
        return;
      }

      // If sheet data is loading, wait.
      if (isSheetDataLoading || authLoading) {
        return;
      }

      // If we have sheetData but no filteredData, create it.
      if (sheetData && !filteredSheetData) {
        if (user) {
          const docRef = doc(db, 'userPreferences', user.uid);
          const docSnap = await getDoc(docRef);
          
          if (docSnap.exists() && docSnap.data().courses) {
            const savedCourses = docSnap.data().courses;
            const autoFilteredData = applyFilter(sheetData, savedCourses);
            setFilteredSheetData(autoFilteredData);
          } else {
            // No saved preferences, use full data
            setFilteredSheetData(sheetData);
          }
        } else {
          // Guest user, use full data
          setFilteredSheetData(sheetData);
        }
      }
      setIsLoading(false);
    };

    initializeTimetable();
  }, [sheetData, filteredSheetData, isSheetDataLoading, authLoading, user, router, setFilteredSheetData, applyFilter]);


  const handleBack = () => {
    // Always go to /view which acts as the filter hub
    router.push('/view');
  };
  
  const toggleView = () => {
    const data = filteredSheetData;
    if (!data) return;

    if (view === 'full') {
      const today = new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
      
      const headerRows = data.slice(0, 2);
      const todayRows = data.slice(2).filter(row => row[0].value === today);
      
      if (todayRows.length > 0) {
        setDailySchedule([...headerRows, ...todayRows]);
      } else {
        setDailySchedule([...headerRows]); // Show header even if no schedule
      }
      setView('today');
    } else {
      setView('full');
    }
  };

  const currentData = view === 'today' ? dailySchedule : filteredSheetData;

  if (isLoading || isSheetDataLoading || authLoading) {
    return (
        <div className="min-h-screen bg-background text-foreground font-body">
            <main className="container mx-auto p-4 sm:p-6 md:p-8">
            <TimetableSkeleton />
            </main>
        </div>
    );
  }

  if (!filteredSheetData) {
     return (
        <div className="min-h-screen bg-background text-foreground font-body flex items-center justify-center -mt-16">
          <div className="text-center">
            <p className="mb-4">Timetable data not found. You may need to sync your sheet first.</p>
            <Button onClick={() => router.push('/')}>Go to Homepage</Button>
          </div>
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground font-body">
      <main className="container mx-auto p-4 sm:p-6 md:p-8">
        <header className="flex items-center justify-between gap-3 mb-8">
            <h1 className="text-3xl font-bold font-headline text-slate-800 dark:text-slate-200">
              {view === 'today' ? "Today's Schedule" : 'Your Timetable'}
            </h1>
            <div className="flex gap-2">
              <Button variant="outline" onClick={toggleView}>
                {view === 'full' ? "Show Today's Schedule" : 'Show Full Timetable'}
              </Button>
              <Button variant="outline" onClick={handleBack}><ArrowLeftIcon /> Back to Filters</Button>
            </div>
        </header>

        <div className="transition-opacity duration-500">
          {view === 'today' ? (
            dailySchedule && dailySchedule.length > 2 ? (
              <TodayScheduleCards data={dailySchedule} />
            ) : (
              <p>No classes scheduled for today.</p>
            )
          ) : (
            currentData && <TimetableDisplay data={currentData} />
          )}
        </div>
        
      </main>
    </div>
  );
}
