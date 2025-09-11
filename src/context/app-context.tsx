
'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import type { SheetData } from '@/lib/types';

interface AppContextType {
  sheetData: SheetData | null;
  setSheetData: (data: SheetData | null) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [sheetData, setSheetData] = useState<SheetData | null>(null);

  return (
    <AppContext.Provider value={{ sheetData, setSheetData }}>
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
