import { Forest } from "../Tree";
import IClique from "../types/IClique";
import ISepSet from "../types/ISepSet";
import IPotential from "../types/IPotential";
import IEntity from "../types/IEntity";
import ICPT from "../types/ICPT";
import { DependancyContitions } from "../types/ICPT";

export default class Initializer {
  private inconsistentJunctionTree: Forest<IClique | ISepSet>;
  private entityMap: Map<string, IEntity>;
  constructor(
    optimizedJunctionTree: Forest<IClique | ISepSet>,
    entityMap: Map<string, IEntity>
  ) {
    this.entityMap = entityMap;
    this.inconsistentJunctionTree = this.initialize(optimizedJunctionTree);
  }

  private initialize(
    optimizedJunctionTree: Forest<IClique | ISepSet>
  ): Forest<IClique | ISepSet> {
    // For each cluster and sepset X, set each sigmax(x) to 1

    optimizedJunctionTree.getIDs().forEach(id => {
      const entity = optimizedJunctionTree.get(id).getEntity();
      let potentials: IPotential[] = [];

      if (entity.isSepSet) {
        const entitiesforPotentials = entity.intersectingentityIDs;
        potentials = this.getEntityPotentials(entitiesforPotentials);
      } else {
        // Page 16 Get match potentalsACE with new CPT values
        const entitiesforPotentials = entity.entityIDs;
        potentials = this.getEntityPotentials(entitiesforPotentials);
      }
      console.log(potentials);
      //console.log(potentials);
      optimizedJunctionTree.get(id).setPotentials(potentials);
    });

    // For each variable V, perform the following: Assign to V a cluster X that contains Fv; call X the parent cluster of Fv.
    // Multiply sigmax by P(V|PIv):
    // returns inconsistent Join Tree

    console.log("inConsistent Tree", optimizedJunctionTree.toString());
    return optimizedJunctionTree;
  }

  private getEntityPotentials(entityIDsForPotentials: string[]): IPotential[] {
    let potentials: IPotential[] = [];

    let entities: IEntity[] = [];

    entityIDsForPotentials.forEach(entityID => {
      const entity = this.entityMap.get(entityID);
      if (entity) {
        entities.push(entity);
      }
    });

    let entityStatePairs = this.getEntityStatePairs(entities);

    entityStatePairs.forEach(esPair => {
      let dif: DependancyContitions = {};
      let potential = 1;

      esPair.forEach(es => {
        const entity = es.entity;
        dif = {
          ...dif,
          [entity.id]: es.state
        };

        esPair.forEach(esd => {
          const depEntity = esd.entity;
          if (depEntity.id !== entity.id) {
            if (entity.deps?.includes(depEntity)) {
              const depEntityCPT = depEntity.cpt;
              if (depEntityCPT) {
                let CPTprob = -1;
                depEntityCPT.forEach(cptcondition => {
                  if (entity.id in cptcondition.if) {
                    if (cptcondition.if[entity.id] === es.state) {
                      CPTprob = cptcondition.then[esd.state];
                    }
                  }
                });

                potential *= CPTprob;
              } else {
                console.log("CPT Not built Correctly");
              }
            }
          }
        });
      });

      potentials.push({
        if: dif,
        then: potential
      });
    });

    // for (let x = 0; x < entityIDsForPotentials.length; x++) {
    //     for (let y = 0; y < entityIDsForPotentials.length; y++) {
    //       if (x !== y) {
    //         const entityX = entityIDsForPotentials[x];
    //         const entityY = entityIDsForPotentials[y];

    //         // For each pair of states
    //         const entityXStates = this.entityMap.get(entityX)?.states as string[];
    //         const entityYStates = this.entityMap.get(entityY)?.states as string[];

    //         for (let xs = 0; xs < entityXStates.length; xs++) {
    //           for (let ys = 0; ys < entityYStates.length; ys++) {
    //             let potential = 1;
    //             let pairs: Array<[string, string]> = [];
    //             for (let xp = 0; xp < entityIDsForPotentials.length; xp++) {
    //               for (let yp = 0; yp < entityIDsForPotentials.length; yp++) {
    //                 const entityidXP = entityIDsForPotentials[xp];
    //                 const entityidYP = entityIDsForPotentials[yp];

    //                 const entityXP = this.entityMap.get(entityidXP);

    //                 const entityXPDeps = entityXP ? entityXP.deps : [];
    //                 if (entityXPDeps) {
    //                   entityXPDeps.forEach(dep => {
    //                     if (dep.id === entityidYP) {
    //                       pairs.push([entityidXP, entityidYP]);
    //                     }
    //                   });
    //                 }
    //               }
    //             }

    //             pairs.forEach(pair => {
    //               const entityXC = pair[0];
    //               const entityYC = pair[1];
    //               // Grab CPT's for later
    //               const entityYCPTs = this.entityMap.get(entityYC)?.cpt as ICPT;
    //               console.log(pair, entityYCPTs, entityXC);
    //               let CPTprob = -1;
    //               entityYCPTs.forEach(cptcondition => {
    //                 if (entityXC in cptcondition.if) {
    //                   if (cptcondition.if[entityXC] === entityXStates[xs]) {
    //                     CPTprob = cptcondition.then[entityYStates[ys]];
    //                   }
    //                 }
    //               });

    //               potential *= CPTprob;
    //             });

    //             potentials.push({
    //               if: {
    //                 [entityX]: entityXStates[xs],
    //                 [entityY]: entityYStates[ys]
    //               },
    //               then: potential
    //             });
    //           }
    //         }
    //       }
    //     }
    //   }

    return potentials;
  }

  /**
   *
   * @param entityIDsForPotentials
   *
   * Concept Concieved from https://www.geeksforgeeks.org/combinations-from-n-arrays-picking-one-element-from-each-array/
   */
  private getEntityStatePairs(
    entityIDsForPotentials: IEntity[]
  ): { entity: IEntity; state: string }[][] {
    const n = entityIDsForPotentials.length;

    let indices: number[] = new Array(n).fill(0);

    let combinations: { entity: IEntity; state: string }[][] = [];

    while (true) {
      let pair: { entity: IEntity; state: string }[] = [];

      // Current comb
      for (let x = 0; x < n; x++) {
        const comb = {
          entity: entityIDsForPotentials[x],
          state: entityIDsForPotentials[x].states[indices[x]]
        };
        pair.push(comb);
      }
      combinations.push(pair);
      // find right most array that has more elements
      let next = n - 1;
      while (
        next >= 0 &&
        indices[next] + 1 >= entityIDsForPotentials[next].states.length
      ) {
        next--;
      }

      // no such array is found so no more
      // combinations left
      if (next < 0) {
        break;
      }

      // if found move to next element in that
      // array
      indices[next]++;

      // for all arrays to the right of this
      // array current index again points to
      // first element
      for (let x = next + 1; x < n; x++) {
        indices[x] = 0;
      }
    }
    return combinations;
  }

  public getInconsistentJunctionTree() {
    return this.inconsistentJunctionTree;
  }
}
