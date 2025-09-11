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
import type { SheetData } from '@/lib/types';
import { mockTimetableData } from '@/lib/mock-data';

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
  apiKey: z.string().optional().describe('The Google API key.'),
});
export type GetSheetDataInput = z.infer<typeof GetSheetDataInputSchema>;

const GetSheetDataOutputSchema = z.object({
  sheetData: SheetDataSchema.optional().describe('The data from the sheet.'),
});
export type GetSheetDataOutput = z.infer<typeof GetSheetDataOutputSchema>;

export async function getSheetData(input: GetSheetDataInput): Promise<GetSheetDataOutput> {
  return getSheetDataFlow(input);
}

// Helper to extract spreadsheet ID from URL
function getSheetDetails(url: string) {
    const regex = /spreadsheets\/d\/([a-zA-Z0-9-_]+)\//;
    const matches = url.match(regex);
    if (matches) {
        return {
            spreadsheetId: matches[1],
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
      // Using mock data as a fallback for invalid URLs, but you could throw an error.
      return { sheetData: mockTimetableData };
    }

    const { spreadsheetId } = details;
    const apiKey = input.apiKey || process.env.GOOGLE_API_KEY;

    if (!apiKey || apiKey === 'YOUR_API_KEY_HERE') {
      console.error('Google API Key not found.');
      throw new Error('API_KEY_MISSING');
    }

    try {
      const sheetName = 'Sheet1'; 
      const range = `${sheetName}!A1:Z1000`;
      const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?key=${apiKey}`;
      
      const response = await fetch(url);
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Failed to fetch from Google Sheets API:', errorData);
        throw new Error(`API request failed: ${errorData.error.message}`);
      }
      const data = await response.json();
      const allRows = data.values || [];

      if (allRows.length === 0) {
        return { sheetData: [] };
      }
      
      const sheetData: SheetData = allRows.map((row: string[]) => {
        const fullRow = [...row];
        while (fullRow.length < (allRows[0]?.length || 0)) {
            fullRow.push('');
        }
        return fullRow.map((cellValue: string) => ({ value: cellValue }));
      });
      
      return { sheetData };
    } catch (error: any) {
      // Re-throw the specific API key error to be caught by the client
      if (error.message === 'API_KEY_MISSING') {
          throw error;
      }
      console.error('Error fetching or processing sheet data:', error);
      throw new Error('Failed to retrieve or process sheet data.');
    }
  }
);
