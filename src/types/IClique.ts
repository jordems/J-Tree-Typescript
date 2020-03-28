import IForestEntity from "./IForestEntity";

export default interface IClique extends IForestEntity {
  id: string;
  entityIDs: string[];
  isSepSet: false;
}
