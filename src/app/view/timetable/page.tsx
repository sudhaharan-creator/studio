
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeftIcon } from 'lucide-react';
import { TimetableDisplay } from '@/components/timetable-display';
import { TimetableSkeleton } from '@/components/timetable-skeleton';
import { useAppContext } from '@/context/app-context';
import type { SheetData } from '@/lib/types';
import { TodayScheduleCards } from '@/components/today-schedule-cards';

export default function TimetablePage() {
  const { filteredSheetData } = useAppContext();
  const router = useRouter();
  const [view, setView] = useState<'full' | 'today'>('full');
  const [dailySchedule, setDailySchedule] = useState<SheetData | null>(null);

  useEffect(() => {
    // If there's no data, maybe the user refreshed the page. Send them back.
    if (!filteredSheetData) {
      router.replace('/view');
    }
  }, [filteredSheetData, router]);

  const handleBack = () => {
    router.back();
  };
  
  const toggleView = () => {
    if (view === 'full') {
      if (!filteredSheetData) return;

      const today = new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
      
      const headerRows = filteredSheetData.slice(0, 2);
      const todayRows = filteredSheetData.slice(2).filter(row => row[0].value === today);
      
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

  if (!filteredSheetData) {
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
