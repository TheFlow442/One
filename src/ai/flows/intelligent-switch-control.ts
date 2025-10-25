'use server';

/**
 * @fileOverview An AI agent for intelligently managing five switches based on real-time parameters, predicted energy consumption, and user preferences, utilizing a deployed Firebase ML model.
 *
 * - intelligentSwitchControl - A function that handles the intelligent switch control process.
 * - IntelligentSwitchControlInput - The input type for the intelligentSwitchControl function.
 * - IntelligentSwitchControlOutput - The return type for the intelligentSwitchControl function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const IntelligentSwitchControlInputSchema = z.object({
  voltage: z.number().describe('The current voltage of the solar system.'),
  current: z.number().describe('The current current of the solar system.'),
  batteryLevel: z.number().describe('The current battery level of the solar system (0-100).'),
  powerConsumption: z.number().describe("The current power consumption in Watts."),
  predictedUsage: z.number().describe('The predicted energy consumption for the next period from the Firebase ML model.'),
  userPreferences: z.string().describe('The user preferences for energy usage and switch control.'),
  userUsagePatterns: z.string().describe('Analysis of historical user usage patterns from the Firebase ML model.')
});
export type IntelligentSwitchControlInput = z.infer<typeof IntelligentSwitchControlInputSchema>;

const IntelligentSwitchControlOutputSchema = z.object({
  switch1State: z.boolean().describe('The recommended state of switch 1 (true for on, false for off).'),
  switch2State: z.boolean().describe('The recommended state of switch 2 (true for on, false for off).'),
  switch3State: z.boolean().describe('The recommended state of switch 3 (true for on, false for off).'),
  switch4State: z.boolean().describe('The recommended state of switch 4 (true for on, false for off).'),
  switch5State: z.boolean().describe('The recommended state of switch 5 (true for on, false for off).'),
  reasoning: z.string().describe('The reasoning behind the switch state recommendations.'),
});
export type IntelligentSwitchControlOutput = z.infer<typeof IntelligentSwitchControlOutputSchema>;

export async function intelligentSwitchControl(input: IntelligentSwitchControlInput): Promise<IntelligentSwitchControlOutput> {
  return intelligentSwitchControlFlow(input);
}

const prompt = ai.definePrompt({
  name: 'intelligentSwitchControlPrompt',
  input: {schema: IntelligentSwitchControlInputSchema},
  output: {schema: IntelligentSwitchControlOutputSchema},
  prompt: `You are an AI assistant designed to intelligently manage five switches in a smart solar system, using insights from a deployed Firebase ML model.

  Based on the current voltage ({{{voltage}}}V), current ({{{current}}}A), battery level ({{{batteryLevel}}}%), current power consumption ({{{powerConsumption}}}W), ML-predicted energy consumption ({{{predictedUsage}}} units), user preferences ("{{{userPreferences}}}"), and ML-derived user usage patterns ("{{{userUsagePatterns}}}"), determine the optimal state for each of the five switches.

  Provide a clear reasoning for your recommendations. The reasoning must incorporate the user usage patterns and prioritize energy optimization and battery health while respecting user preferences.

  Output the recommended state for each switch (true for on, false for off) and your reasoning in the JSON format specified by the output schema. Make sure the reasoning is easily understandable by a non-expert user.
  `,
});

const intelligentSwitchControlFlow = ai.defineFlow(
  {
    name: 'intelligentSwitchControlFlow',
    inputSchema: IntelligentSwitchControlInputSchema,
    outputSchema: IntelligentSwitchControlOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
