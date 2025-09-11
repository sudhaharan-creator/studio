
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
    const convertTo24Hour = (time: string) => {
      if (!time || typeof time !== 'string' || !time.includes(':')) {
        return 9999; // Put invalid times at the end
      }
  
      // Extract the start time, e.g., "09:00 am" from "09:00 am - 10:15 am"
      const timePart = time.split('-')[0].trim();
  
      // Find am/pm
      const ampmMatch = timePart.match(/am|pm/i);
      const ampm = ampmMatch ? ampmMatch[0].toLowerCase() : 'am';
  
      // Extract hours and minutes
      const timeNumbers = timePart.match(/(\d+):(\d+)/);
      if (!timeNumbers) {
        return 9999;
      }
  
      let hour = parseInt(timeNumbers[1], 10);
      const minute = parseInt(timeNumbers[2], 10);
  
      if (isNaN(hour) || isNaN(minute)) {
        return 9999;
      }
  
      // Convert to 24-hour format
      if (ampm === 'pm' && hour < 12) {
        hour += 12;
      }
      // Handle midnight case (12 am)
      if (ampm === 'am' && hour === 12) {
        hour = 0;
      }
  
      return hour * 60 + minute;
    };

    return convertTo24Hour(a.time) - convertTo24Hour(b.time);
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
