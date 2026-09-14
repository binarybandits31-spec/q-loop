export interface CircuitData {
  gates: CircuitGateData[];
  numQubits: number;
}

export interface CircuitGateData {
  id: string;
  type: string;
  qubit: number;
  targetQubit?: number;
  controlQubit?: number;
  control2Qubit?: number;
  parameter?: number;
}
