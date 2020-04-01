import { cloneDeep } from "lodash";

import IEntity from "../types/IEntity";
import ISepSet from "../types/ISepSet";
import IClique from "../types/IClique";
import Forest from "../graphstructures/Forest";
import IPotential from "../types/IPotential";
import GraphEntity from "../graphstructures/GraphEntity";

export default class Marginalizer {
  private consistentJunctionTree: Forest<IClique | ISepSet>;
  constructor(consistentJunctionTree: Forest<IClique | ISepSet>) {
    this.consistentJunctionTree = consistentJunctionTree;
  }

  public marginalize(entity: IEntity): IPotential[] {
    // Marginalization

    // Identify a cluster or sepset X that contains V
    const csofEntity = this.getClusterwithEntity(entity);

    let margPotentials: IPotential[] = [];
    entity.states.forEach(state => {
      let pot = 0;
      csofEntity.potentials?.forEach(tablepotential => {
        if (tablepotential.if[entity.id] === state) {
          pot += tablepotential.then;
        }
      });

      margPotentials.push({ if: { [entity.id]: state }, then: pot });
    });

    return margPotentials;
  }

  private getClusterwithEntity(entity: IEntity): IClique | ISepSet {
    let cluster: IClique | ISepSet | undefined;
    this.consistentJunctionTree.getValues().forEach(graphEntity => {
      const gentity = graphEntity.getEntity();
      if (!gentity.isSepSet) {
        if (gentity.entityIDs.includes(entity.id) && !cluster) {
          cluster = gentity;
        }
      } else {
        if (gentity.intersectingentityIDs.includes(entity.id) && !cluster) {
          cluster = gentity;
        }
      }
    });
    if (!cluster) {
      throw new Error("Marginalization: Entity not Found in Consistent JTree");
    } else {
      return cluster;
    }
  }
}
