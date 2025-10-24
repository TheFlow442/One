
'use server';
/**
 * @fileOverview An AI flow to derive complex microgrid metrics from raw sensor data.
 *
 * - deriveMetrics - Analyzes sensor data to determine system status, battery health, and other derived values.
 * - DeriveMetricsInput - The input schema for the raw sensor data.
 * - DeriveMetricsOutput - The output schema for the derived metrics.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const DeriveMetricsInputSchema = z.object({
  voltage: z.number().describe('The current voltage reading from the sensor (in Volts).'),
  current: z.number().describe('The current reading from the sensor (in Amperes). Positive values indicate charging, negative values indicate discharging.'),
  temperature: z.number().describe('The ambient temperature reading from the sensor (in Celsius).'),
  ldr: z.number().describe('The light dependent resistor (LDR) reading, from 0 (dark) to 1023 (bright). This represents solar intensity.'),
});
export type DeriveMetricsInput = z.infer<typeof DeriveMetricsInputSchema>;

const DeriveMetricsOutputSchema = z.object({
  power: z.number().describe('Calculated power in Watts (Voltage * Current).'),
  inverterStatus: z.enum(['Online', 'Offline', 'Error']).describe("The operational status of the inverter. Should be 'Online' if power is being generated, 'Offline' if not, and 'Error' if readings are anomalous (e.g., very high temperature)."),
  batteryHealth: z.number().min(0).max(100).describe("The estimated health of the battery as a percentage. Base it on temperature; optimal health is between 15-25°C. Health degrades significantly outside this range."),
  batteryState: z.enum(['Charging', 'Discharging', 'Idle']).describe("The current state of the battery. 'Charging' if current is positive, 'Discharging' if negative, and 'Idle' if zero."),
  timeToFull: z.string().describe("An estimated time to fully charge the battery, formatted as 'Xh Ym'. If not charging, this should be '--'. The AI should reason about a standard battery capacity (e.g., 5kWh) to make an estimation based on the current charging rate (power)."),
  solarIrradiance: z.number().describe("The estimated solar irradiance in W/m², converted from the LDR value. Assume a linear scale where 0 LDR is 0 W/m² and 1023 LDR is ~1000 W/m²."),
  maintenanceAlerts: z.array(z.object({
    id: z.string(),
    title: z.string(),
    description: z.string(),
  })).describe("A list of predictive maintenance alerts. Generate alerts for conditions like high temperature (> 40°C), unusual voltage spikes (> 240V), or if the inverter should be online (daylight) but is not producing power."),
});
export type DeriveMetricsOutput = z.infer<typeof DeriveMetricsOutputSchema>;

const deriveMetricsPrompt = ai.definePrompt({
    name: 'deriveMetricsPrompt',
    input: { schema: DeriveMetricsInputSchema },
    output: { schema: DeriveMetricsOutputSchema },
    prompt: `You are an expert microgrid analyst. Based on the following real-time sensor data, derive the specified output metrics.

    Sensor Data:
    - Voltage: {{{voltage}}} V
    - Current: {{{current}}} A
    - Temperature: {{{temperature}}} °C
    - LDR Reading: {{{ldr}}}

    Your task is to analyze this data and return a structured JSON object with the derived metrics as defined in the output schema.
    - Calculate power.
    - Determine inverter status based on power and potential anomalies.
    - Estimate battery health based on temperature.
    - Determine battery state from the current's direction.
    - Estimate time-to-full if the battery is charging, assuming a standard 5kWh battery capacity for your calculation.
    - Convert the LDR value to solar irradiance.
    - Generate relevant maintenance alerts based on the rules described in the schema.
    `,
});

const deriveMetricsFlow = ai.defineFlow(
  {
    name: 'deriveMetricsFlow',
    inputSchema: DeriveMetricsInputSchema,
    outputSchema: DeriveMetricsOutputSchema,
  },
  async (input) => {
    const { output } = await deriveMetricsPrompt(input);
    if (!output) {
      throw new Error('Failed to get derived metrics from AI.');
    }
    return output;
  }
);

export async function deriveMetrics(input: DeriveMetricsInput): Promise<DeriveMetricsOutput> {
  return deriveMetricsFlow(input);
}
