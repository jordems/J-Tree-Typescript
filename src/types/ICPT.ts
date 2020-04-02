export interface DependancyContitions {
  [entityid: string]: string;
}

export interface StateProbabilities {
  [state: string]: number;
}

export interface CPTCondition {
  if: DependancyContitions;
  then: StateProbabilities;
}

export type ICPT = CPTCondition[];
