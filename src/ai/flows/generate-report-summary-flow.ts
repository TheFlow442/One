'use server';
/**
 * @fileOverview An AI flow to generate a natural language summary of microgrid performance reports.
 *
 * - generateReportSummary - Analyzes a time series of grid data and generates a text summary.
 * - GenerateReportSummaryInput - The input schema for the grid data.
 * - GenerateReportSummaryOutput - The output schema for the text summary.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const DailyMetricSchema = z.object({
  day: z.string(),
  communityA: z.number(),
  communityB: z.number(),
  communityC: z.number(),
  generation: z.number(),
});

export const GenerateReportSummaryInputSchema = z.object({
  timeframe: z.string().describe('The time period for the report (e.g., "Last 14 days").'),
  data: z.array(DailyMetricSchema).describe('An array of daily generation and load data for each community.'),
});
export type GenerateReportSummaryInput = z.infer<typeof GenerateReportSummaryInputSchema>;

export const GenerateReportSummaryOutputSchema = z.object({
  summary: z.string().describe('A concise, analytical summary of the provided grid performance data. Should be formatted as a single block of text with paragraphs separated by newline characters.'),
});
export type GenerateReportSummaryOutput = z.infer<typeof GenerateReportSummaryOutputSchema>;

export async function generateReportSummary(input: GenerateReportSummaryInput): Promise<GenerateReportSummaryOutput> {
  return generateReportSummaryFlow(input);
}

const generateReportSummaryPrompt = ai.definePrompt({
  name: 'generateReportSummaryPrompt',
  input: { schema: GenerateReportSummaryInputSchema },
  output: { schema: GenerateReportSummaryOutputSchema },
  prompt: `You are a microgrid performance analyst. Your task is to generate a concise, analytical summary based on the provided JSON data. The data represents daily energy generation and consumption (in kWh) for three communities over a specific timeframe.

Data Timeframe: {{{timeframe}}}

Data:
{{{json data}}}

Analyze the data and provide a summary that includes:
1.  An overview of the period, mentioning total generation vs. total consumption.
2.  Identification of the day with the highest and lowest net energy (generation minus consumption).
3.  Which community was the highest consumer on average.
4.  Any notable trends, like increasing generation or a specific community's consumption pattern.

Format the output as a single block of text, with paragraphs separated by a newline character. Be professional and insightful.
`,
});

const generateReportSummaryFlow = ai.defineFlow(
  {
    name: 'generateReportSummaryFlow',
    inputSchema: GenerateReportSummaryInputSchema,
    outputSchema: GenerateReportSummaryOutputSchema,
  },
  async (input) => {
    const { output } = await generateReportSummaryPrompt(input);
    if (!output) {
      throw new Error('Failed to generate report summary from AI.');
    }
    return output;
  }
);
