import ICPT from "./ICPT";

export default interface IEntity {
  name: string;
  states: string[];
  deps?: IEntity[];
  cpt?: ICPT;
}
