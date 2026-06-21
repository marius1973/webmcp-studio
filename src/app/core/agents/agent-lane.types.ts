/** Carril de un agente en ejecución multi-agente paralela (serializada por CommandBus). */
export type AgentLane = 'A' | 'B';

export const LANE_COLORS: Record<AgentLane, string> = {
  A: '#4a9eff',
  B: '#f0a030',
};

export const LANE_LABELS: Record<AgentLane, string> = {
  A: 'Agente A',
  B: 'Agente B',
};
