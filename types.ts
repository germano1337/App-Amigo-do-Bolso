
export enum GoalStatus {
  TODO = 'TODO',
  IN_PROGRESS = 'IN_PROGRESS',
  DONE = 'DONE',
}

export interface Goal {
  id: string;
  title: string;
  amount: number; // Target amount
  saved: number; // Currently saved
  deadline: string;
  status: GoalStatus;
}

export interface Expense {
  id: string;
  title: string;
  amount: number;
  category: string;
  isRecurring: boolean;
  date?: string; // ISO Date string
}

export interface Column {
  id: GoalStatus;
  title: string;
}

export const COLUMNS: Column[] = [
  { id: GoalStatus.TODO, title: 'Planejamento' },
  { id: GoalStatus.IN_PROGRESS, title: 'Juntando' },
  { id: GoalStatus.DONE, title: 'Conquistas' },
];

export const DEFAULT_CATEGORIES = [
  'Moradia',
  'Alimentação',
  'Transporte',
  'Lazer',
  'Saúde',
  'Educação',
  'Investimentos',
  'Outros'
];
