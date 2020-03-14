import BayesianNetwork from "./BayesianNetwork";

export default class JunctionTree {
  private bnet: BayesianNetwork;
  constructor(bnet: BayesianNetwork) {
    this.bnet = bnet;
  }

  private transformfromBayesNetwork(): void {}

  private initialize(): void {}

  private propogate(): void {}

  private marginalize(): void {}
}
