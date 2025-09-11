
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeftIcon } from 'lucide-react';
import { TimetableDisplay } from '@/components/timetable-display';
import { TimetableSkeleton } from '@/components/timetable-skeleton';
import { useAppContext } from '@/context/app-context';

export default function TimetablePage() {
  const { filteredSheetData } = useAppContext();
  const router = useRouter();

  useEffect(() => {
    // If there's no data, maybe the user refreshed the page. Send them back.
    if (!filteredSheetData) {
      router.replace('/view');
    }
  }, [filteredSheetData, router]);

  const handleBack = () => {
    router.back();
  };

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
            <h1 className="text-3xl font-bold font-headline text-slate-800 dark:text-slate-200">Your Timetable</h1>
            <Button variant="outline" onClick={handleBack}><ArrowLeftIcon /> Back to Filters</Button>
        </header>

        <div className="transition-opacity duration-500">
          <TimetableDisplay data={filteredSheetData} />
        </div>
        
      </main>
    </div>
  );
}
