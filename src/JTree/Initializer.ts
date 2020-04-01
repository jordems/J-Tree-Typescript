import { cloneDeep } from "lodash";

import Forest from "../graphstructures/Forest";
import IClique from "../types/IClique";
import ISepSet from "../types/ISepSet";
import IPotential from "../types/IPotential";
import IEntity from "../types/IEntity";
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

      optimizedJunctionTree.addPotentials(entity, potentials);
    });

    // For each variable V, perform the following: Assign to V a cluster X that contains Fv; call X the parent cluster of Fv.
    // Multiply sigmax by P(V|PIv):
    // returns inconsistent Join Tree

    //console.log("inConsistent Tree", optimizedJunctionTree.toString());
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
                  if (
                    entity.id in cptcondition.if ||
                    Object.keys(cptcondition.if).length === 0
                  ) {
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
        then: Math.abs(potential)
      });
    });

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
