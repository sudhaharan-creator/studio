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
});
export type GetSheetDataInput = z.infer<typeof GetSheetDataInputSchema>;

const GetSheetDataOutputSchema = z.object({
  sheetData: SheetDataSchema.describe('The data from the sheet.'),
});
export type GetSheetDataOutput = z.infer<typeof GetSheetDataOutputSchema>;

export async function getSheetData(input: GetSheetDataInput): Promise<GetSheetDataOutput> {
  return getSheetDataFlow(input);
}

const getSheetDataFlow = ai.defineFlow(
  {
    name: 'getSheetDataFlow',
    inputSchema: GetSheetDataInputSchema,
    outputSchema: GetSheetDataOutputSchema,
  },
  async (input) => {
    // In a real app, you would use the Google Sheets API to fetch data.
    // For this example, we're returning mock data.
    // The prompt could be used to transform the raw sheet data into the desired format.
    
    console.log(`Getting data from sheet: ${input.sheetUrl}`);
    
    // This is a placeholder. You would need to implement the actual Google Sheet fetching logic.
    // For now, we will return the updated mock data.
    const sheetData: SheetData = mockTimetableData;

    return { sheetData };
  }
);

    