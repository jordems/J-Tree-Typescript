import Dag from "./Dag";

export default class BayesianNetwork {
  private dag: Dag;

  constructor(dag: Dag) {
    this.dag = dag;
  }
}
