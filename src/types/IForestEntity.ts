import IPotential from "./IPotential";

export default interface IForestEntity {
  id: string;
  potentials?: IPotential[];
  oldPotentials?: IPotential[];
  marked?: boolean;
  isSepSet: true | false;
}
