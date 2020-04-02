import { ICPT } from "./";

export interface IEntity {
  id: string;
  states: string[];
  deps?: IEntity[];
  cpt?: ICPT;
}
