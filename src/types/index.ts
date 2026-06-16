export type Stage = 'Confirmed' | 'Crafting' | 'Out' | 'Done';
export type Payment = 'Unpaid' | 'DP' | 'Lunas';
export type Effort = 'Low' | 'Med' | 'High';

export interface Order {
  id: string;
  name: string;
  phone: string;
  design: string;
  eff: Effort;
  qty: number;
  price: number;
  date: string;
  time: string;
  addr: string;
  pay: Payment;
  stage: Stage;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface DesignPreset {
  name: string;
  eff: Effort;
  price: number;
}

export interface Settings {
  cap: number;
  lead: number;
  designs: DesignPreset[];
  icon: string;
}

export type ViewMode = 'days' | 'board';
