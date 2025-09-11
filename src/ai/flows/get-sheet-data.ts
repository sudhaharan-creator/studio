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
  apiKey: z.string().optional().describe('Google API Key for accessing the sheet.'),
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
      throw new Error('Invalid Google Sheet URL.');
    }

    const { spreadsheetId } = details;
    const apiKey = input.apiKey || process.env.GOOGLE_API_KEY;

    if (!apiKey) {
      console.error('Google API Key not found.');
      throw new Error('Google API Key not found. Please provide it.');
    }

    try {
      // First, fetch spreadsheet metadata to get the sheet names
      const metadataUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?key=${apiKey}`;
      const metadataResponse = await fetch(metadataUrl);
      const metadata = await metadataResponse.json();

      if (!metadataResponse.ok) {
        const errorMessage = metadata?.error?.message || `HTTP error! status: ${metadataResponse.status}`;
        console.error('Failed to fetch sheet metadata:', errorMessage);
        throw new Error(errorMessage);
      }

      const firstSheetName = metadata.sheets?.[0]?.properties?.title;

      if (!firstSheetName) {
        throw new Error('No sheets found in the spreadsheet.');
      }
      
      const range = `${firstSheetName}!A1:Z1000`;
      const valuesUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?key=${apiKey}`;
      
      const response = await fetch(valuesUrl);
      const data = await response.json();

      if (!response.ok) {
        const errorMessage = data?.error?.message || `HTTP error! status: ${response.status}`;
        console.error('Failed to fetch from Google Sheets API:', errorMessage);
        throw new Error(errorMessage);
      }
      
      const allRows = data.values || [];

      if (allRows.length === 0) {
        return { sheetData: [] };
      }
      
      const sheetData: SheetData = allRows.map((row: string[]) => {
        const fullRow = [...row];
        // Ensure all rows have the same number of columns for table consistency
        const maxCols = Math.max(...allRows.map(r => r.length));
        while (fullRow.length < maxCols) {
            fullRow.push('');
        }
        return fullRow.map((cellValue: string) => ({ value: cellValue }));
      });
      
      return { sheetData };
    } catch (error: any) {
      console.error('Error fetching or processing sheet data:', error.message);
      // Re-throw the original error to be caught by the UI
      throw error;
    }
  }
);
