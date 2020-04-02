import { IPotential } from "./";

export interface IForestEntity {
  id: string;
  potentials?: IPotential[];
  oldPotentials?: IPotential[];
  marked?: boolean;
  isSepSet: true | false;
}
