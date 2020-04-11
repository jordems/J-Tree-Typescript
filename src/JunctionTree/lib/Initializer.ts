import Forest from "../../GraphicalStructures/Forest";
import {
  IClique,
  ISepSet,
  IPotential,
  IEntity,
  DependancyContitions,
} from "../../types";

export default class Initializer {
  private inconsistentJunctionTree: Forest<IClique | ISepSet>;
  private entityMap: Map<string, IEntity>;
  constructor(
    optimizedJunctionTree: Forest<IClique | ISepSet>,
    entityMap: Map<string, IEntity>
  ) {
    this.entityMap = entityMap;
    console.log("\n----Started Initialization----\n");
    this.inconsistentJunctionTree = this.initialize(optimizedJunctionTree);
    console.log("\n----Finished Initialization----\n");
  }

  private initialize(
    optimizedJunctionTree: Forest<IClique | ISepSet>
  ): Forest<IClique | ISepSet> {
    // For each cluster and sepset X, set each sigmax(x) to 1

    optimizedJunctionTree.getIDs().forEach((id) => {
      const entity = optimizedJunctionTree.get(id).getEntity();
      let potentials: IPotential[] = [];

      if (entity.isSepSet) {
        console.log(`\nInitializing SepSet[${entity.intersectingentityIDs}]`);
        const entitiesforPotentials = entity.intersectingentityIDs;
        potentials = this.getEntityPotentials(entitiesforPotentials, true);
      } else {
        console.log(`\nInitializing Cluster[${entity.entityIDs}]`);
        const entitiesforPotentials = entity.entityIDs;
        potentials = this.getEntityPotentials(entitiesforPotentials, false);
      }

      optimizedJunctionTree.addPotentials(entity, potentials);
    });

    // For each variable V, perform the following: Assign to V a cluster X that contains Fv; call X the parent cluster of Fv.
    // Multiply sigmax by P(V|PIv):
    // returns inconsistent Join Tree

    //console.log("inConsistent Tree", optimizedJunctionTree.toString());
    return optimizedJunctionTree;
  }

  private getEntityPotentials(
    entityIDsForPotentials: string[],
    isSepSet: boolean
  ): IPotential[] {
    let potentials: IPotential[] = [];

    let entities: IEntity[] = [];

    entityIDsForPotentials.forEach((entityID) => {
      const entity = this.entityMap.get(entityID);
      if (entity) {
        entities.push(entity);
      }
    });

    let entityStatePairs = this.getEntityStatePairs(entities);

    // Only parent elements will have cpt data
    let parentEntities = this.getParents(entities);
    //console.log("Parent entities", parentEntities);

    entityStatePairs.forEach((esPair) => {
      let dif: DependancyContitions = {};
      let potential = 1;
      let propstring: string[] = [];

      //FIX needs to be fore each depending entity like P(C|B AND S) currently P(C| B) and P(C | S)
      if (!isSepSet) {
        for (const parentKey of Object.keys(parentEntities)) {
          const parentState = esPair.filter(
            (esp) => esp.entity.id === parentKey
          )[0].state;
          const parentMatch = parentEntities[parentKey];
          const parentEntity = this.entityMap.get(parentKey);

          if (!parentEntity || !parentEntity.cpt) {
            throw new Error("Parent assigned that doesn't exist");
          }

          dif = {
            ...dif,
            [parentEntity.id]: parentState,
          };

          let Pparams: {
            entity: IEntity;
            state: string;
          }[] = [];
          // add
          for (const child of parentMatch) {
            const cPair = esPair.filter((esp) => esp.entity.id === child.id);
            if (cPair.length > 0) {
              Pparams.push(cPair[0]);
              dif = {
                ...dif,
                [child.id]: cPair[0].state,
              };
            }
          }

          // This means the match has been found and we can now multiply the potential
          if (Pparams.length === parentMatch.length) {
            const parentCPT = parentEntity.cpt;

            for (const cptLayer of parentCPT) {
              let isMatch = true;
              let pMatchstring = "";
              for (const depent of Object.keys(cptLayer.if)) {
                const param = Pparams.filter(
                  (ppam) => ppam.entity.id === depent
                );
                if (
                  param.length === 0 ||
                  cptLayer.if[depent] !== param[0].state
                ) {
                  isMatch = false;
                } else {
                  pMatchstring += `${depent}=${param[0].state},`;
                }
              }
              if (isMatch) {
                propstring.push(
                  `P(${parentEntity.id}=${parentState}|${pMatchstring})`
                );
                potential *= cptLayer.then[parentState];
              }
            }
          }
        }
        if (potential === 1) {
          let printString = "P(";
          esPair.forEach((esp) => {
            printString += `${esp.entity.id}=${esp.state},`;
            dif = {
              ...dif,
              [esp.entity.id]: esp.state,
            };
          });
          propstring.push(printString + ")");
        }
      } else {
        let printString = "P(";
        esPair.forEach((esp) => {
          printString += `${esp.entity.id}=${esp.state},`;
          dif = {
            ...dif,
            [esp.entity.id]: esp.state,
          };
        });
        propstring.push(printString + ")");
      }

      // Printing Proability Values to check Manually
      if (propstring.length > 1) {
        let propPrintString = "";
        for (let x = 0; x < propstring.length - 1; x++) {
          propPrintString += propstring[x] + " x ";
        }
        propPrintString +=
          propstring[propstring.length - 1] + " = " + potential;
        console.log(propPrintString);
      } else if (propstring.length === 1) {
        console.log(propstring[0] + " = " + potential);
      }

      potentials.push({
        if: dif,
        then: potential,
      });
    });

    return potentials;
  }

  /**
   *
   * @param entityIDsForPotentials
   * Used do create a set of all posible pairs of states, for all entity dependants
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
          state: entityIDsForPotentials[x].states[indices[x]],
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

  /**
   * Gets parent elements of id's
   * @param entityMap
   */
  private getParents(
    entitiesList: IEntity[]
  ): { [entityName: string]: IEntity[] } {
    const entityParents: { [entityName: string]: IEntity[] } = {};

    this.entityMap.forEach((entity) => {
      if (entity.deps) {
        entity.deps.forEach((depEntity) => {
          if (entitiesList.includes(depEntity)) {
            if (!(depEntity.id in entityParents)) {
              entityParents[depEntity.id] = [];
            }
            entityParents[depEntity.id].push(entity);
          }
        });
      }
    });
    return entityParents;
  }

  public getInconsistentJunctionTree() {
    return this.inconsistentJunctionTree;
  }
}
