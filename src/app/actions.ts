'use server';

import { intelligentSwitchControl, IntelligentSwitchControlInput } from '@/ai/flows/intelligent-switch-control';
import { predictEnergyConsumption, PredictEnergyConsumptionOutput } from '@/ai/flows/predict-energy-consumption';
import { HISTORICAL_DATA } from '@/lib/data';
import { initializeFirebase } from '@/firebase';
import { ref, set, get } from 'firebase/database';
import { randomUUID } from 'crypto';

export async function runIntelligentSwitchControl(input: IntelligentSwitchControlInput) {
  try {
    const result = await intelligentSwitchControl(input);
    return { success: true, data: result };
  } catch (error) {
    console.error('Error in intelligentSwitchControl:', error);
    return { success: false, error: 'Failed to get intelligent recommendations.' };
  }
}

export async function runEnergyPrediction() {
  try {
    const historicalDataString = JSON.stringify(HISTORICAL_DATA);
    const result = await predictEnergyConsumption({
      historicalData: historicalDataString,
      modelName: 'energy_consumption_v1',
    });
    return { success: true, data: result as PredictEnergyConsumptionOutput };
  } catch (error) {
    console.error('Error in predictEnergyConsumption:', error);
    return { success: false, error: 'Failed to predict energy consumption.' };
  }
}

export async function generateApiKey() {
  try {
    const apiKey = randomUUID();
    const { database } = initializeFirebase();
    const appRef = ref(database, 'app/apiKey');
    await set(appRef, apiKey);
    return { success: true, data: { apiKey } };
  } catch (error: any) {
    console.error('Error generating API key:', error);
    return { success: false, error: error.message || 'Failed to generate API key.' };
  }
}

export async function getApiKey() {
  try {
    const { database } = initializeFirebase();
    const appRef = ref(database, 'app/apiKey');
    const snapshot = await get(appRef);
    const apiKey = snapshot.exists() ? snapshot.val() : null;
    return { success: true, data: { apiKey } };
  } catch (error: any) {
    console.error('Error fetching API key:', error);
    return { success: false, error: error.message || 'Failed to fetch API key.' };
  }
}

export async function updateSwitchState(switchId: number, name: string, state: boolean) {
  try {
    const { database } = initializeFirebase();
    const switchRef = ref(database, `app/switchStates/${switchId}`);
    await set(switchRef, { name, state });
    return { success: true };
  } catch (error: any) {
    console.error(`Error updating switch ${switchId}:`, error);
    return { success: false, error: error.message || `Failed to update switch ${switchId}.` };
  }
}

export async function getSwitchStates() {
  try {
    const { database } = initializeFirebase();
    const switchesRef = ref(database, 'app/switchStates');
    const snapshot = await get(switchesRef);
    const switchStates = snapshot.exists() ? snapshot.val() : null;
    return { success: true, data: switchStates };
  } catch (error: any) {
    console.error('Error fetching switch states:', error);
    return { success: false, error: error.message || 'Failed to fetch switch states.' };
  }
}
