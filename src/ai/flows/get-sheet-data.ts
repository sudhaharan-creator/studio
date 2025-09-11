'use server';
/**
 * @fileOverview A flow to get data from a Google Sheet.
 *
 * - getSheetData - A function that handles getting data from a Google Sheet.
 * - GetSheetDataInput - The input type for the getSheetData function.
 * - GetSheetDataOutput - The return type for the getSheetData function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { SheetData } from '@/lib/types';
import { mockTimetableData } from '@/lib/mock-data';
import { format, parse } from 'date-fns';

const CellStyleSchema = z.object({
  bold: z.boolean().optional(),
  italic: z.boolean().optional(),
  underline: z.boolean().optional(),
  color: z.string().optional(),
  backgroundColor: z.string().optional(),
  borderRight: z.string().optional(),
});

const CellDataSchema = z.object({
  value: z.string(),
  style: CellStyleSchema.optional(),
  colSpan: z.number().optional(),
});

const SheetDataSchema = z.array(z.array(CellDataSchema));

const GetSheetDataInputSchema = z.object({
  sheetUrl: z.string().describe('The URL of the Google Sheet to get data from.'),
  date: z.string().optional().describe('The date to get data for, in YYYY-MM-DD format.'),
});
export type GetSheetDataInput = z.infer<typeof GetSheetDataInputSchema>;

const GetSheetDataOutputSchema = z.object({
  sheetData: SheetDataSchema.describe('The data from the sheet.'),
});
export type GetSheetDataOutput = z.infer<typeof GetSheetDataOutputSchema>;

export async function getSheetData(input: GetSheetDataInput): Promise<GetSheetDataOutput> {
  return getSheetDataFlow(input);
}

// Helper to extract spreadsheet ID and sheet name from URL
function getSheetDetails(url: string) {
    const regex = /spreadsheets\/d\/([a-zA-Z0-9-_]+)\/(?:edit|htmlview)?(?:#gid=([0-9]+))?/;
    const matches = url.match(regex);
    if (matches) {
        return {
            spreadsheetId: matches[1],
            sheetId: matches[2] || '0', // Default to first sheet if no gid
        };
    }
    return null;
}

const getSheetDataFlow = ai.defineFlow(
  {
    name: 'getSheetDataFlow',
    inputSchema: GetSheetDataInputSchema,
    outputSchema: GetSheetDataOutputSchema,
  },
  async (input) => {
    const details = getSheetDetails(input.sheetUrl);
    if (!details) {
      console.error('Invalid Google Sheet URL');
      return { sheetData: mockTimetableData };
    }

    const { spreadsheetId } = details;
    const apiKey = process.env.GOOGLE_API_KEY;

    if (!apiKey || apiKey === 'YOUR_API_KEY_HERE') {
      console.error('Google API Key not found in .env.local. Returning mock data.');
      return { sheetData: mockTimetableData };
    }

    try {
      const sheetName = 'Sheet1'; // Assuming the data is on 'Sheet1'
      const range = `${sheetName}!A1:Z1000`; // Fetch a large range
      const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?key=${apiKey}`;
      
      const response = await fetch(url);
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Failed to fetch from Google Sheets API:', errorData);
        throw new Error('API request failed');
      }
      const data = await response.json();
      const allRows = data.values || [];

      if (allRows.length === 0) {
        return { sheetData: [] };
      }

      const headerRows = allRows.slice(0, 2).map(row => row.map((cell: string) => ({ value: cell })));
      const dataRows = allRows.slice(2);
      let filteredRows: any[] = [];

      if(input.date) {
        const selectedDate = parse(input.date, 'yyyy-MM-dd', new Date());
        
        filteredRows = dataRows.filter(row => {
          if (row[0]) {
            try {
              // Assuming date is in 'Day, Month Day, Year' format
              const rowDate = parse(row[0], 'EEEE, MMMM d, yyyy', new Date());
              return format(rowDate, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd');
            } catch(e) {
              return false;
            }
          }
          return false;
        });

      } else {
        filteredRows = dataRows;
      }

      const sheetData: SheetData = [...headerRows, ...filteredRows.map(row => row.map((cell: string) => ({ value: cell })))];

      // A simple transformation to demonstrate a potential use of an LLM.
      // In a real app, you might use a prompt to format, translate, or analyze the data.
      const transformedSheetData = sheetData.map(row => {
          return row.map(cell => {
              // For demonstration, let's just use the mock data styling logic for now.
              const mockRow = mockTimetableData.flat().find(c => c.value === cell.value);
              return { ...cell, style: mockRow?.style, colSpan: mockRow?.colSpan };
          });
      });


      return { sheetData: transformedSheetData };
    } catch (error) {
      console.error('Error fetching or processing sheet data:', error);
      return { sheetData: mockTimetableData };
    }
  }
);
