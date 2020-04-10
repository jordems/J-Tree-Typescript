import BayesianNetwork from "../BayesianNetwork/BayesianNetwork";

import GraphicalTransformer from "./lib/GraphicalTransformer";
import Initializer from "./lib/Initializer";
import Forest from "../GraphicalStructures/Forest";
import { IClique, ISepSet, IEntity, IPotential } from "../types";
import Propagater from "./lib/Propagater";

export default class JunctionTree {
  private entityMap: Map<string, IEntity>;
  private consistentJunctionTree: Forest<IClique | ISepSet>;

  constructor(bnet: BayesianNetwork) {
    this.entityMap = bnet.getEntityMap();

    // Graphical Transformation of bayesnet into Optimized Junction Tree
    const optimizedJunctionTree = this.transform(bnet);

    // Initialization to create an Inconsistent Junction Tree
    const inconsistentJunctionTree = this.initialize(optimizedJunctionTree);

    // Propagation to create a Consistent Junction Tree
    this.consistentJunctionTree = this.propogate(inconsistentJunctionTree);
  }

  private transform(bnet: BayesianNetwork): Forest<IClique | ISepSet> {
    const graphicalTransformer = new GraphicalTransformer(bnet);
    return graphicalTransformer.getOptimizedJunctionTree();
  }

  private initialize(
    optimizedJunctionTree: Forest<IClique | ISepSet>
  ): Forest<IClique | ISepSet> {
    const initializer = new Initializer(optimizedJunctionTree, this.entityMap);
    return initializer.getInconsistentJunctionTree();
  }

  private propogate(inconsistentJunctionTree: Forest<IClique | ISepSet>) {
    const propagater = new Propagater(inconsistentJunctionTree);
    return propagater.getConsistentJunctionTree();
  }

  public getConsistentJunctionTree(): Forest<IClique | ISepSet> {
    return this.consistentJunctionTree;
  }
}
