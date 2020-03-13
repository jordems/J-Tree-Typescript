import ICPT from "./ICPT";

export default interface IEntity {
  name: string;
  states: Array<string>;
  cpt?: ICPT;
}
