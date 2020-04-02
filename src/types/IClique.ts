import { IForestEntity } from "./";

export interface IClique extends IForestEntity {
  id: string;
  entityIDs: string[];
  isSepSet: false;
}
