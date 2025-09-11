
'use client';

import React from 'react';
import type { SheetData } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ClockIcon, HomeIcon, BookOpenIcon } from 'lucide-react';

interface TodayScheduleCardsProps {
  data: SheetData;
}

type ScheduleItem = {
  course: string;
  time: string;
  classroom: string;
};

export function TodayScheduleCards({ data }: TodayScheduleCardsProps) {
  if (!data || data.length < 3) {
    return <p>No schedule available for today.</p>;
  }

  const headerRow = data[1]; 
  const bodyRows = data.slice(2);
  const scheduleItems: ScheduleItem[] = [];

  bodyRows.forEach(row => {
    const classroom = row[1]?.value || 'N/A';
    row.slice(2).forEach((cell, index) => {
      const courseName = cell.value.trim();
      if (courseName && !/^\(Lunch\)$/i.test(courseName) && !/Registration/i.test(courseName)) {
        const time = headerRow[index + 2]?.value || 'N/A';
        scheduleItems.push({
          course: courseName,
          time: time,
          classroom: classroom,
        });
      }
    });
  });

  if (scheduleItems.length === 0) {
    return <p>No classes scheduled for today.</p>;
  }
  
  // Sort items by time
  scheduleItems.sort((a, b) => {
    const timeA = a.time.split('-')[0].trim();
    const timeB = b.time.split('-')[0].trim();
    
    const convertTo24Hour = (time: string) => {
        let [hours, minutesPart] = time.split(':');
        let minutes = minutesPart.slice(0, 2);
        const ampm = time.toLowerCase().includes('pm') ? 'pm' : 'am';
        let hour = parseInt(hours, 10);
        
        if (ampm === 'pm' && hour < 12) {
            hour += 12;
        }
        if (ampm === 'am' && hour === 12) {
            hour = 0;
        }
        return hour * 60 + parseInt(minutes, 10);
    };

    return convertTo24Hour(timeA) - convertTo24Hour(timeB);
  });

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {scheduleItems.map((item, index) => (
        <Card key={index} className="shadow-lg border-none">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-headline">
              <BookOpenIcon className="h-6 w-6 text-primary" />
              {item.course}
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2">
            <div className="flex items-center gap-2 text-muted-foreground">
              <ClockIcon className="h-5 w-5" />
              <span>{item.time}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <HomeIcon className="h-5 w-5" />
              <span>{item.classroom}</span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
