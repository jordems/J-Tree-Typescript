import BayesianNetwork from "./BayesianNetwork";

import GraphicalTransformer from "./GraphicalTransformer";
import { Forest } from "./Tree";
import IClique from "./types/IClique";
import ISepSet from "./types/ISepSet";
import IEntity from "./types/IEntity";
import IPotential from "./types/IPotential";

export default class JunctionTree {
  private entityMap: Map<string, IEntity>;
  private optimizedJunctionTree: Forest<IClique | ISepSet>;

  constructor(bnet: BayesianNetwork) {
    this.entityMap = bnet.getEntityMap();

    // Graphical Transformation of bayesnet into Optimized Junction Tree
    const graphicalTransformer = new GraphicalTransformer(bnet);
    this.optimizedJunctionTree = graphicalTransformer.getOptimizedJunctionTree();

    this.initialize();
  }

  private initialize() {
    // For each cluster and sepset X, set each sigmax(x) to 1
    const { optimizedJunctionTree, entityMap } = this;

    optimizedJunctionTree.getIDs().forEach(id => {
      const entity = optimizedJunctionTree.get(id).getEntity();
      let potentials: IPotential[] = [];

      if (entity.isSepSet) {
        const entitiesforPotentials = entity.intersectingentityIDs;

        // For each pair of Entities
        for (let x = 0; x < entitiesforPotentials.length; x++) {
          for (let y = 0; y < entitiesforPotentials.length; y++) {
            if (x !== y) {
              const entityX = entitiesforPotentials[x];
              const entityY = entitiesforPotentials[y];

              // For each pair of states
              const entityXStates = entityMap.get(entityX)?.states as string[];
              const entityYStates = entityMap.get(entityY)?.states as string[];
              for (let xs = 0; xs < entityXStates.length; xs++) {
                for (let ys = 0; ys < entityYStates.length; ys++) {
                  potentials.push({
                    if: {
                      [entityX]: entityXStates[xs],
                      [entityY]: entityYStates[ys]
                    },
                    then: 1
                  });
                }
              }
            }
          }
        }
      } else {
        // Page 16 Get match potentalsACE with new CPT values
      }
      console.log(potentials);
      optimizedJunctionTree.get(id).setPotentials(potentials);
    });

    // For each variable V, perform the following: Assign to V a cluster X that contains Fv; call X the parent cluster of Fv.
    // Multiply sigmax by P(V|PIv):
    // returns inconsistent Join Tree
  }

  private propogate() {
    //Single Message PASS
    // Projection. Assign a new table to R, saving the old table
    // Absorption. Assign a new table to Y, using both the old and new tables of R
    //Coordinating Multi Messages
    // Global Propagation
    // 1. Choose an arbitrary cluster X
    // 2. Unmark all clusters. Call Collect-Evidence(X)
    // 3. Unmark all clusters. Call Distrubite-Evidence(X).
    // Where
    // Collect-Evidence(X):
    // 1. Mark X
    // 2. Call Collect-Evidence recursively on X's unmarked neighboring clusters, if any
    // 3. Pass a message from X to the cluster which invoked Collect-Evidence(X)
    // Distrubite-Evidence(X):
    // 1. Mark X
    // 2. Pass a message from X to each of its unmarked neighboring clusters, if any
    // 3. Call Distrubite-Evidence recursively on X's unmarked neighboring clusters, if any
    // returns consistent Join Tree
  }

  private marginalize() {
    // Compute P(V) for each variable of intrest V as follows
    // 1. Identify a cluster (or subset) X that contains V
    // 2. Compute P(V) by marginalizing sigmax according to equation (3.3), P(V) = sum(...)
  }
}
