import { IForestEntity } from "./";

export interface ISepSet extends IForestEntity {
  id: string;
  cliqueXID: string;
  cliqueYID: string;
  intersectingentityIDs: string[];
  isSepSet: true;
}
