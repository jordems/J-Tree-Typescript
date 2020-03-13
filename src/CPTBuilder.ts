import IEntity from "./IEntity";
import EntityDependant from "./EntityDependant";
import { ICPT, DependancyContitions, StateProbabilities } from "./ICPT";

export class CPTBuilder {
  public buildCPTsForMap(
    entityMap: Map<string, IEntity>,
    entityRelationships: EntityDependant[]
  ): void {
    entityRelationships.forEach(entityDependant => {
      const cpt = this.buildCPT(entityDependant);
      const currentEntity = entityDependant.getEntity();

      const mapEntity = entityMap.get(currentEntity.name);
      if (mapEntity) {
        mapEntity.cpt = cpt;
        entityMap.set(mapEntity.name, mapEntity);
      }
    });
  }

  /**
   * TODO Currently only works for 1 or 2 Dependants
   */
  public buildCPT(entityDependant: EntityDependant): ICPT {
    const entityStates = entityDependant.getEntity().states;
    const entityDependants = entityDependant.getDependants();
    let CPT: ICPT = [];
    if (entityDependants.length === 1) {
      const singleDependant = entityDependants[0];
      for (var i = 0; i < singleDependant.states.length; i++) {
        // Build Dependancy Conditions
        const depConditions: DependancyContitions = {
          [singleDependant.name]: singleDependant.states[i]
        };

        // Build Inital State Probabilities
        let stateprobs: StateProbabilities = {};
        entityStates.forEach(entityState => {
          stateprobs[entityState] = 1 / entityStates.length;
        });

        // Add CPTCondition to CPT
        CPT.push({
          if: depConditions,
          then: stateprobs
        });
      }
    } else if (entityDependants.length > 1) {
      // Build Dependancy Pairs
      let depPairs: Array<[IEntity, IEntity]> = [];
      for (var i = 0; i < entityDependants.length - 1; i++) {
        for (var j = i; j < entityDependants.length - 1; j++) {
          depPairs.push([entityDependants[i], entityDependants[j + 1]]);
        }
      }

      // Build Base CPT
      depPairs.forEach(depPair => {
        for (var i = 0; i < depPair[0].states.length; i++) {
          for (var j = 0; j < depPair[1].states.length; j++) {
            // Build Dependancy Conditions
            const depConditions: DependancyContitions = {
              [depPair[0].name]: depPair[0].states[i],
              [depPair[1].name]: depPair[1].states[j]
            };

            // Build Inital State Probabilities
            let stateprobs: StateProbabilities = {};
            entityStates.forEach(entityState => {
              stateprobs[entityState] = 1 / entityStates.length;
            });

            // Add CPTCondition to CPT
            CPT.push({
              if: depConditions,
              then: stateprobs
            });
          }
        }
      });
    }

    return CPT;
  }
}
