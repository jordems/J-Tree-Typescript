import IEntity from "./types/IEntity";
import { ICPT, DependancyContitions, StateProbabilities } from "./types/ICPT";

export class CPTBuilder {
  public buildCPTsForMap(entityMap: Map<string, IEntity>): void {
    const entityParentsMap = this.getParents(entityMap);

    entityMap.forEach(entity => {
      const entityParents = entityParentsMap[entity.id];

      const cpt = this.buildCPT(entity, entityParents);

      const mapEntity = entityMap.get(entity.id);
      if (mapEntity) {
        mapEntity.cpt = cpt;
        entityMap.set(mapEntity.id, mapEntity);
      }
    });
  }

  /**
   * TODO Currently only works for 1 or 2 Dependants
   */
  public buildCPT(entity: IEntity, entityParents: IEntity[]): ICPT {
    const entityStates = entity.states;

    let CPT: ICPT = [];
    if (entityParents && entityParents.length === 1) {
      const singleDependant = entityParents[0];
      for (var i = 0; i < singleDependant.states.length; i++) {
        // Build Dependancy Conditions
        const depConditions: DependancyContitions = {
          [singleDependant.id]: singleDependant.states[i]
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
    } else if (entityParents && entityParents.length > 1) {
      // Build Dependancy Pairs
      let depPairs: Array<[IEntity, IEntity]> = [];
      for (var i = 0; i < entityParents.length - 1; i++) {
        for (var j = i; j < entityParents.length - 1; j++) {
          depPairs.push([entityParents[i], entityParents[j + 1]]);
        }
      }

      // Build Base CPT
      depPairs.forEach(depPair => {
        for (var i = 0; i < depPair[0].states.length; i++) {
          for (var j = 0; j < depPair[1].states.length; j++) {
            // Build Dependancy Conditions
            const depConditions: DependancyContitions = {
              [depPair[0].id]: depPair[0].states[i],
              [depPair[1].id]: depPair[1].states[j]
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

  private getParents(
    entityMap: Map<string, IEntity>
  ): { [entityName: string]: IEntity[] } {
    const entityParents: { [entityName: string]: IEntity[] } = {};

    entityMap.forEach(entity => {
      if (entity.deps) {
        entity.deps.forEach(depEntity => {
          if (!(depEntity.id in entityParents)) {
            entityParents[depEntity.id] = [];
          }
          entityParents[depEntity.id].push(entity);
        });
      }
    });
    return entityParents;
  }
}
