import BayesianNetwork from "../BayesianNetwork";

import GraphicalTransformer from "./GraphicalTransformer";
import Initializer from "./Initializer";
import Forest from "../graphstructures/Forest";
import IClique from "../types/IClique";
import ISepSet from "../types/ISepSet";
import IEntity from "../types/IEntity";
import IPotential from "../types/IPotential";
import ICPT from "../types/ICPT";
import Propagater from "./Propagater";

export default class JunctionTree {
  private entityMap: Map<string, IEntity>;
  constructor(bnet: BayesianNetwork) {
    this.entityMap = bnet.getEntityMap();

    // Graphical Transformation of bayesnet into Optimized Junction Tree
    const graphicalTransformer = new GraphicalTransformer(bnet);
    const optimizedJunctionTree = graphicalTransformer.getOptimizedJunctionTree();

    // Initialization to create an Inconsistent Junction Tree
    const inconsistentJunctionTree = this.initialize(optimizedJunctionTree);

    // Propagation to create a Consistent Junction Tree
    const consistentJunctionTree = this.propogate(inconsistentJunctionTree);
  }

  private initialize(
    optimizedJunctionTree: Forest<IClique | ISepSet>
  ): Forest<IClique | ISepSet> {
    const initializer = new Initializer(optimizedJunctionTree, this.entityMap);

    return initializer.getInconsistentJunctionTree();
  }

  private propogate(inconsistentJunctionTree: Forest<IClique | ISepSet>) {
    const propagater = new Propagater(inconsistentJunctionTree, this.entityMap);

    return propagater.getConsistentJunctionTree();
  }

  private marginalize() {
    // Compute P(V) for each variable of intrest V as follows
    // 1. Identify a cluster (or subset) X that contains V
    // 2. Compute P(V) by marginalizing sigmax according to equation (3.3), P(V) = sum(...)
  }
}
