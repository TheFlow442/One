import type { SwitchState, HistoricalDataPoint, EnergyData } from '@/lib/types';

export const INITIAL_ENERGY_DATA: EnergyData = {
  voltage: 230.5,
  current: 5.2,
  batteryLevel: 85,
  power: 1198.6,
  temperature: 25.5,
  humidity: 60,
  totalConsumption: 1234.5,
  energyRemain: 45.2,
};

export const INITIAL_SWITCHES: SwitchState[] = [
  { id: 1, name: 'Living Room Lights', state: true },
  { id: 2, name: 'Air Conditioner', state: false },
  { id: 3, name: 'Water Heater', state: false },
  { id: 4, name: 'Kitchen Appliances', state: true },
  { id: 5, name: 'Outdoor Lighting', state: false },
];

export const HISTORICAL_DATA: HistoricalDataPoint[] = [
  { month: 'Jan', "Energy Consumption (kWh)": 186 },
  { month: 'Feb', "Energy Consumption (kWh)": 205 },
  { month: 'Mar', "Energy Consumption (kWh)": 237 },
  { month: 'Apr', "Energy Consumption (kWh)": 173 },
  { month: 'May', "Energy Consumption (kWh)": 209 },
  { month: 'Jun', "Energy Consumption (kWh)": 250 },
  { month: 'Jul', "Energy Consumption (kWh)": 280 },
  { month: 'Aug', "Energy Consumption (kWh)": 260 },
  { month: 'Sep', "Energy Consumption (kWh)": 220 },
  { month: 'Oct', "Energy Consumption (kWh)": 190 },
  { month: 'Nov', "Energy Consumption (kWh)": 170 },
  { month: 'Dec', "Energy Consumption (kWh)": 210 },
];
