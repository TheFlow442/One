
'use client';

import { useEffect, useRef } from 'react';
import { deriveMetrics } from '@/ai/flows/derive-metrics-flow';

// This is a server-side check that gets passed to the client
const isApiKeySet = process.env.NEXT_PUBLIC_IS_GEMINI_API_KEY_SET === 'true';

interface AiAlertEngineProps {
  communityId: string;
  sensorData: any | null;
}

/**
 * An invisible component that runs in the background to power the AI alert system.
 * It listens for new sensor data and triggers the `deriveMetrics` flow to
 * analyze the data for potential issues and create alerts.
 */
export function AiAlertEngine({ communityId, sensorData }: AiAlertEngineProps) {
  // Use a ref to track the timestamp of the last processed data
  const lastProcessedTimestampRef = useRef<number | null>(null);

  useEffect(() => {
    // Do nothing if the Gemini API key isn't set, if there's no data,
    // or if the data doesn't have a valid timestamp.
    if (!isApiKeySet || !sensorData || !sensorData.timestamp?.seconds) {
      return;
    }

    const currentTimestamp = sensorData.timestamp.seconds;

    // Only process the data if it's newer than the last one we processed.
    // This prevents re-processing the same data on re-renders.
    if (currentTimestamp === lastProcessedTimestampRef.current) {
      return;
    }

    // Update the ref to the current timestamp
    lastProcessedTimestampRef.current = currentTimestamp;

    // Define the async function to call the AI flow
    const runAnalysis = async () => {
      try {
        // We only need to pass the specific fields required by the AI flow.
        const input = {
          communityId: communityId,
          inverterV: sensorData.inverterV ?? 0,
          inverterI: sensorData.inverterI ?? 0,
          batteryV: sensorData.batteryV ?? 0,
          batteryI: sensorData.batteryI ?? 0,
          batteryTemp: sensorData.batteryTemp ?? 0,
          irradiance: sensorData.irradiance ?? 0,
        };

        // Call the flow but don't wait for it or use its return value.
        // The flow will independently save any generated alerts to Firestore.
        // We use a console.log to show in the browser that it was triggered.
        console.log(`[AI Alert Engine] Analyzing data for ${communityId}...`, input);
        await deriveMetrics(input);

      } catch (error) {
        // Log any errors from the AI flow, but don't crash the app.
        // This could be network errors or issues with the AI model itself.
        console.error('[AI Alert Engine] Error during analysis:', error);
      }
    };

    // Run the analysis.
    runAnalysis();

  }, [sensorData, communityId]); // Effect runs whenever sensorData or communityId changes

  // This component renders nothing.
  return null;
}
