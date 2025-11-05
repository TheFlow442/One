
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
import { getFirestore, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase/client';

const DeriveMetricsInputSchema = z.object({
  communityId: z.string().describe('The ID of the community (e.g., "Community A").'),
  inverterV: z.number().describe('The inverter AC output voltage (in Volts).'),
  inverterI: z.number().describe('The inverter AC output current (in Amperes).'),
  batteryV: z.number().describe('The current battery voltage (in Volts).'),
  batteryI: z.number().describe('The current flowing into/out of the battery (in Amperes). Positive values indicate charging, negative values indicate discharging.'),
  batteryTemp: z.number().describe('The battery temperature (in Celsius).'),
  irradiance: z.number().describe('The solar irradiance reading, from 0 to 1000 (W/m^2). This represents solar intensity.'),
});
export type DeriveMetricsInput = z.infer<typeof DeriveMetricsInputSchema>;

// Internal schema that includes the pre-calculated power
const InternalPromptInputSchema = DeriveMetricsInputSchema.extend({
    power: z.number().describe('Calculated power in Watts (Voltage * Current).'),
});
type InternalPromptInput = z.infer<typeof InternalPromptInputSchema>;


const DeriveMetricsOutputSchema = z.object({
  power: z.number().describe('Calculated power in Watts (Voltage * Current).'),
  batteryHealth: z.number().min(0).max(100).describe("The estimated health of the battery as a percentage. Base it on batteryTemp; optimal health is between 15-25°C. Health degrades significantly outside this range."),
  batteryState: z.enum(['Charging', 'Discharging', 'Idle']).describe("The current state of the battery. 'Charging' if batteryI is positive, 'Discharging' if negative, and 'Idle' if zero."),
  timeToFull: z.string().describe("An estimated time to fully charge the battery, formatted as 'Xh Ym'. If not charging, this should be '--'. The AI should reason about a standard battery capacity (e.g., 5kWh) to make an estimation based on the current charging rate (batteryV * batteryI)."),
  maintenanceAlerts: z.array(z.object({
    id: z.string(),
    title: z.string(),
    description: z.string(),
  })).describe("A list of predictive maintenance alerts. Generate alerts for conditions like high battery temperature (> 40°C), unusual inverter voltage spikes (> 240V), or if the inverter should be online (daylight, high irradiance > 300) but is not producing power (inverterI is near zero)."),
});
export type DeriveMetricsOutput = z.infer<typeof DeriveMetricsOutputSchema>;

const deriveMetricsPrompt = ai.definePrompt({
    name: 'deriveMetricsPrompt',
    input: { schema: InternalPromptInputSchema },
    output: { schema: DeriveMetricsOutputSchema },
    prompt: `You are an expert microgrid analyst. Based on the following real-time sensor data from a solar installation, derive the specified output metrics.

    Sensor Data:
    - Community: {{{communityId}}}
    - Inverter Voltage: {{{inverterV}}} V
    - Inverter Current: {{{inverterI}}} A
    - Total Power Output: {{{power}}} W
    - Battery Voltage: {{{batteryV}}} V
    - Battery Current: {{{batteryI}}} A
    - Battery Temperature: {{{batteryTemp}}} °C
    - Solar Irradiance: {{{irradiance}}} W/m^2

    Your task is to analyze this data and return a structured JSON object with the derived metrics as defined in the output schema.
    - The 'power' value is the total output power, already calculated for you. Include it in your output.
    - Estimate 'batteryHealth' based on 'batteryTemp'.
    - Determine 'batteryState' from the direction of 'batteryI'.
    - Estimate 'timeToFull' if the battery is charging, assuming a standard 5kWh battery capacity for your calculation.
    - Generate relevant 'maintenanceAlerts' based on the rules described in the schema.
    `,
});

// Function to save alerts to Firestore
async function saveAlertsToFirestore(alerts: DeriveMetricsOutput['maintenanceAlerts'], communityId: string) {
    try {
        const { firestore } = initializeFirebase();
        const alertsCollection = collection(firestore, 'alerts');

        for (const alert of alerts) {
            await addDoc(alertsCollection, {
                ...alert,
                communityId,
                timestamp: serverTimestamp(),
                status: 'new', // or 'acknowledged'
            });
        }
    } catch (error) {
        console.error("Failed to save alerts to Firestore:", error);
        // We don't re-throw here to avoid failing the whole flow if only Firestore write fails.
    }
}


const deriveMetricsFlow = ai.defineFlow(
  {
    name: 'deriveMetricsFlow',
    inputSchema: DeriveMetricsInputSchema,
    outputSchema: DeriveMetricsOutputSchema,
  },
  async (input) => {
    // Calculate power deterministically.
    const power = input.inverterV * input.inverterI;
    
    // Create the input for the AI prompt, including the calculated power.
    const promptInput: InternalPromptInput = {
      ...input,
      power: power,
    };

    const { output } = await deriveMetricsPrompt(promptInput);
    if (!output) {
      throw new Error('Failed to get derived metrics from AI.');
    }

    // Ensure the output power is the one we calculated, overriding any AI hallucination.
    output.power = power;

    // Asynchronously save any generated alerts to Firestore without blocking the response.
    if (output.maintenanceAlerts && output.maintenanceAlerts.length > 0) {
        saveAlertsToFirestore(output.maintenanceAlerts, input.communityId);
    }

    return output;
  }
);

export async function deriveMetrics(input: DeriveMetricsInput): Promise<DeriveMetricsOutput> {
  return deriveMetricsFlow(input);
}
