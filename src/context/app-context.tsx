
'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import type { SheetData } from '@/lib/types';
import { getSheetData, GetSheetDataOutput } from '@/ai/flows/get-sheet-data';
import { useAuth } from './auth-context';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface AppContextType {
  sheetData: SheetData | null;
  setSheetData: (data: SheetData | null) => void;
  filteredSheetData: SheetData | null;
  setFilteredSheetData: (data: SheetData | null) => void;
  isSheetDataLoading: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const { user, loading: authLoading } = useAuth();
  const [sheetData, setSheetData] = useState<SheetData | null>(null);
  const [filteredSheetData, setFilteredSheetData] = useState<SheetData | null>(null);
  const [isSheetDataLoading, setIsSheetDataLoading] = useState(true);

  useEffect(() => {
    const fetchInitialData = async () => {
      if (user) {
        setIsSheetDataLoading(true);
        const docRef = doc(db, 'userPreferences', user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists() && docSnap.data().sheetUrl) {
          const savedUrl = docSnap.data().sheetUrl;
          try {
            const result: GetSheetDataOutput = await getSheetData({ sheetUrl: savedUrl });
            if (result.sheetData) {
              setSheetData(result.sheetData);
            }
          } catch (error) {
            console.error("Failed to fetch sheet data on load:", error);
          }
        }
        setIsSheetDataLoading(false);
      } else {
        // For guest users, don't automatically fetch.
        // Data will be provided from the homepage.
        setIsSheetDataLoading(false);
      }
    };
    
    if (!authLoading) {
      // Only fetch if there is a user and no data is already present.
      if (user && !sheetData) {
        fetchInitialData();
      } else {
        setIsSheetDataLoading(false);
      }
    }
  }, [user, authLoading, sheetData]);


  return (
    <AppContext.Provider value={{ sheetData, setSheetData, filteredSheetData, setFilteredSheetData, isSheetDataLoading }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
