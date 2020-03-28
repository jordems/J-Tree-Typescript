import IForestEntity from "./IForestEntity";

export default interface ISepSet extends IForestEntity {
  id: string;
  cliqueXID: string;
  cliqueYID: string;
  intersectingentityIDs: string[];
  isSepSet: true;
}
