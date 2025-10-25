"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { runEnergyPrediction, runIntelligentSwitchControl, updateSwitchState, getSwitchStates } from '@/app/actions';
import { INITIAL_ENERGY_DATA, INITIAL_SWITCHES } from '@/lib/data';
import type { EnergyData, SwitchState } from '@/lib/types';
import { EnergyMetrics } from './energy-metrics';
import { SwitchControl } from './switch-control';
import { UsageHistory } from './usage-history';
import { PredictionAnalytics } from './prediction-analytics';
import type { PredictEnergyConsumptionOutput } from '@/ai/flows/predict-energy-consumption';
import { useDatabase, useMemoFirebase } from '@/firebase';
import { onValue, ref } from 'firebase/database';

export function Dashboard() {
  const [energyData, setEnergyData] = useState<EnergyData>(INITIAL_ENERGY_DATA);
  const [switches, setSwitches] = useState<SwitchState[]>(INITIAL_SWITCHES);
  const [userPreferences, setUserPreferences] = useState('Prioritize extending battery life and reducing cost. Only turn on essential appliances if battery is below 40%.');
  const [prediction, setPrediction] = useState<PredictEnergyConsumptionOutput | null>(null);
  const [isPredictionLoading, setIsPredictionLoading] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [aiReasoning, setAiReasoning] = useState('');
  const { toast } = useToast();
  const database = useDatabase();

  useEffect(() => {
    handlePrediction(); // Initial prediction on load

    const initialFetch = async () => {
      const result = await getSwitchStates();
      if (result.success && result.data) {
        const dbSwitches = Object.entries(result.data).map(([id, s]: [string, any]) => ({
          id: parseInt(id, 10),
          name: s.name,
          state: s.state,
        }));
        // sync with initial switches
        const syncedSwitches = INITIAL_SWITCHES.map(is => {
            const dbSwitch = dbSwitches.find(dbs => dbs.id === is.id);
            return dbSwitch ? dbSwitch : is;
        });

        setSwitches(syncedSwitches);
      }
    };
    initialFetch();

  }, []);

  const energyDataRef = useMemoFirebase(() => database ? ref(database, 'app/energyData') : null, [database]);
  const switchStatesRef = useMemoFirebase(() => database ? ref(database, 'app/switchStates') : null, [database]);

  useEffect(() => {
    if (!energyDataRef) return;
    const unsubscribe = onValue(energyDataRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        // Get the latest entry
        const latestKey = Object.keys(data).sort().pop();
        if (latestKey) {
            const latestData = data[latestKey];
             setEnergyData(prev => ({
                ...prev, // keep fields not sent by device
                voltage: latestData.voltage ?? prev.voltage,
                current: latestData.current ?? prev.current,
                batteryLevel: latestData.batteryLevel ?? prev.batteryLevel,
                power: (latestData.voltage && latestData.current) ? latestData.voltage * latestData.current : prev.power,
                temperature: latestData.temperature ?? prev.temperature,
                humidity: latestData.humidity ?? prev.humidity,
             }));
        }
      }
    });
    return () => unsubscribe();
  }, [energyDataRef]);

   useEffect(() => {
    if (!switchStatesRef) return;
    const unsubscribe = onValue(switchStatesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setSwitches(prevSwitches => {
          const updatedSwitches = [...prevSwitches];
          let hasChanged = false;
          Object.entries(data).forEach(([id, s]: [string, any]) => {
            const switchId = parseInt(id, 10);
            const switchIndex = updatedSwitches.findIndex(sw => sw.id === switchId);
            if (switchIndex !== -1 && updatedSwitches[switchIndex].state !== s.state) {
              updatedSwitches[switchIndex] = { ...updatedSwitches[switchIndex], name: s.name, state: s.state };
              hasChanged = true;
            }
          });
          return hasChanged ? updatedSwitches : prevSwitches;
        });
      }
    });
    return () => unsubscribe();
  }, [switchStatesRef]);

  const handlePrediction = async () => {
    setIsPredictionLoading(true);
    setAiReasoning('');
    const result = await runEnergyPrediction();
    if (result.success && result.data) {
      setPrediction(result.data);
      toast({
        title: "Prediction Ready",
        description: "Future energy consumption has been forecasted.",
      });
    } else {
      toast({
        variant: "destructive",
        title: "Prediction Failed",
        description: result.error,
      });
    }
    setIsPredictionLoading(false);
  };
  
  const updateAllSwitches = useCallback(async (newSwitchStates: boolean[]) => {
    const updatedSwitches = switches.map((s, i) => ({
      ...s,
      state: newSwitchStates[i],
    }));

    // Optimistically update UI
    setSwitches(updatedSwitches);

    // Call server action for each switch
    for (const s of updatedSwitches) {
      // no need to await, fire and forget
      updateSwitchState(s.id, s.name, s.state);
    }
  }, [switches]);


  const handleOptimization = async () => {
    if (!prediction) {
      toast({
        variant: "destructive",
        title: "Cannot Optimize",
        description: "Please predict energy consumption first.",
      });
      return;
    }
    setIsOptimizing(true);
    const result = await runIntelligentSwitchControl({
      ...energyData,
      powerConsumption: energyData.power,
      predictedUsage: prediction.predictedConsumption,
      userPreferences,
      userUsagePatterns: prediction.userUsagePatterns,
    });

    if (result.success && result.data) {
      const { switch1State, switch2State, switch3State, switch4State, switch5State, reasoning } = result.data;
      const newSwitchStates = [switch1State, switch2State, switch3State, switch4State, switch5State];
      
      await updateAllSwitches(newSwitchStates);
      
      setAiReasoning(reasoning);
      toast({
        title: "Optimization Complete",
        description: "Switches have been adjusted intelligently.",
      });
    } else {
      toast({
        variant: "destructive",
        title: "Optimization Failed",
        description: result.error,
      });
    }
    setIsOptimizing(false);
  };

  const handleSwitchChange = async (id: number, checked: boolean) => {
    const targetSwitch = switches.find(s => s.id === id);
    if (!targetSwitch) return;

    // Optimistic UI update
    setSwitches(prev => prev.map(s => s.id === id ? { ...s, state: checked } : s));
    setAiReasoning('');

    const result = await updateSwitchState(id, targetSwitch.name, checked);
    if (!result.success) {
      toast({
        variant: 'destructive',
        title: 'Update Failed',
        description: result.error,
      });
      // Revert UI on failure
      setSwitches(prev => prev.map(s => s.id === id ? { ...s, state: !checked } : s));
    }
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
      <div className="lg:col-span-8 xl:col-span-9 space-y-6">
        <EnergyMetrics energyData={energyData} />
        <SwitchControl
          switches={switches}
          userPreferences={userPreferences}
          aiReasoning={aiReasoning}
          isOptimizing={isOptimizing}
          isPredictionAvailable={!!prediction}
          onSwitchChange={handleSwitchChange}
          onPreferencesChange={setUserPreferences}
          onOptimize={handleOptimization}
        />
      </div>

      <div className="lg:col-span-4 xl:col-span-3 space-y-6">
         <PredictionAnalytics
          prediction={prediction}
          isLoading={isPredictionLoading}
          onPredict={handlePrediction}
        />
        <UsageHistory />
      </div>
    </div>
  );
}
