import { DependancyContitions } from "./ICPT";

export interface IPotential {
  if: DependancyContitions;
  then: number; // Probaility
}

export default IPotential;
