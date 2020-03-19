export type ICPT = CPTCondition[];

export interface CPTCondition {
  if: DependancyContitions;
  then: StateProbabilities;
}

export interface DependancyContitions {
  [entityid: string]: string;
}

export interface StateProbabilities {
  [state: string]: number;
}

export default ICPT;
