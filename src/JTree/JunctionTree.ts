import BayesianNetwork from "../BayesianNetwork";

import GraphicalTransformer from "./GraphicalTransformer";
import Initializer from "./Initializer";
import Forest from "../graphstructures/Forest";
import { IClique, ISepSet, IEntity } from "../types";
import Propagater from "./Propagater";
import Marginalizer from "./Marginalizer";

export default class JunctionTree {
  private entityMap: Map<string, IEntity>;
  private marginalizer: Marginalizer;
  constructor(bnet: BayesianNetwork) {
    this.entityMap = bnet.getEntityMap();

    // Graphical Transformation of bayesnet into Optimized Junction Tree
    const optimizedJunctionTree = this.transform(bnet);

    // Initialization to create an Inconsistent Junction Tree
    const inconsistentJunctionTree = this.initialize(optimizedJunctionTree);

    // Propagation to create a Consistent Junction Tree
    const consistentJunctionTree = this.propogate(inconsistentJunctionTree);

    // Set up Marginalizer
    this.marginalizer = new Marginalizer(consistentJunctionTree);
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
    const propagater = new Propagater(inconsistentJunctionTree, this.entityMap);
    return propagater.getConsistentJunctionTree();
  }

  public marginalize(entity: IEntity) {
    const margPotentials = this.marginalizer.marginalize(entity);
    console.log(margPotentials);
  }
}
