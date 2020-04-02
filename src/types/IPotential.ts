import { DependancyContitions } from "./";

export interface IPotential {
  if: DependancyContitions;
  then: number; // Probaility
}
