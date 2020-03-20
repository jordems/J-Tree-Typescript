import ICPT from "./ICPT";

export default interface IEntity {
  id: string;
  states: string[];
  deps?: IEntity[];
  cpt?: ICPT;
}
