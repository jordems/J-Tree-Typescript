import IPotential from "./IPotential";

export default interface ISepSet {
  id: string;
  cliqueXID: string;
  cliqueYID: string;
  intersectingentityIDs: string[];
  potentials?: IPotential[];
  isSepSet: true;
}
