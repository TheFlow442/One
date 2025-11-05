
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
  voltage: z.number().describe('The current voltage reading from the sensor (in Volts).'),
  current: z.number().describe('The current reading from the sensor (in Amperes). Positive values indicate charging, negative values indicate discharging.'),
  temperature: z.number().describe('The ambient temperature reading from the sensor (in Celsius).'),
  ldr: z.number().describe('The light dependent resistor (LDR) reading, from 0 (dark) to 1023 (bright). This represents solar intensity.'),
});
export type DeriveMetricsInput = z.infer<typeof DeriveMetricsInputSchema>;

// Internal schema that includes the pre-calculated power
const InternalPromptInputSchema = DeriveMetricsInputSchema.extend({
    power: z.number().describe('Calculated power in Watts (Voltage * Current).'),
});
type InternalPromptInput = z.infer<typeof InternalPromptInputSchema>;


const DeriveMetricsOutputSchema = z.object({
  power: z.number().describe('Calculated power in Watts (Voltage * Current).'),
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
    input: { schema: InternalPromptInputSchema },
    output: { schema: DeriveMetricsOutputSchema },
    prompt: `You are an expert microgrid analyst. Based on the following real-time sensor data, derive the specified output metrics.

    Sensor Data:
    - Community: {{{communityId}}}
    - Voltage: {{{voltage}}} V
    - Current: {{{current}}} A
    - Power: {{{power}}} W
    - Temperature: {{{temperature}}} °C
    - LDR Reading: {{{ldr}}}

    Your task is to analyze this data and return a structured JSON object with the derived metrics as defined in the output schema.
    - The 'power' value is already calculated for you. Include it in your output.
    - Estimate battery health based on temperature.
    - Determine battery state from the current's direction.
    - Estimate time-to-full if the battery is charging, assuming a standard 5kWh battery capacity for your calculation.
    - Convert the LDR value to solar irradiance.
    - Generate relevant maintenance alerts based on the rules described in the schema.
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
    const power = input.voltage * input.current;
    
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
