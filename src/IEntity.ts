import ICPT from "./ICPT";

export default interface IEntity {
  name: string;
  states: Array<string>;
  deps?: IEntity[];
  cpt?: ICPT;
}
