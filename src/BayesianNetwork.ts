import Dag from "./Dag";

export default class BayesianNetwork {
  private dag: Dag;
  private ns: Array<number>;

  constructor(dag: Dag, ns: Array<number>) {
    this.dag = dag;
    this.ns = ns;
    this.buildNetwork(dag, ns);
  }

  private buildNetwork(dag: Dag, ns: Array<number>): void {}

  public getDag() {
    return this.dag;
  }

  public getNS() {
    return this.ns;
  }
}
