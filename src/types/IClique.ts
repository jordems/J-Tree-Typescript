import IPotential from "./IPotential";

export default interface IClique {
  id: string;
  entityIDs: string[];
  potentials?: IPotential[];
  isSepSet: false;
}
