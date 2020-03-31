import IPotential from "../types/IPotential";
import IForestEntity from "../types/IForestEntity";
import UnDirectedGraph from "./UnDirectedGraph";
import GraphEntity from "./GraphEntity";

/**
 * @class Forest
 * Extends the Graph class to Create a Forest with additional helper methods
 */
export default class Forest<T extends IForestEntity> extends UnDirectedGraph<
  T
> {
  constructor() {
    super();
  }

  public getRandomCluster(): GraphEntity<T> {
    let possibleClusterIDs: string[] = [];
    this.getIDs().forEach(treeEntityID => {
      if (!this.get(treeEntityID).getEntity().isSepSet) {
        possibleClusterIDs.push(treeEntityID);
      }
    });

    const randomIdx = Math.round(
      Math.random() * (possibleClusterIDs.length - 1)
    );

    return this.get(possibleClusterIDs[randomIdx]);
  }

  public getNeighboringClusters(
    entity: T
  ): { neighborCluster: GraphEntity<T>; fromSepset: GraphEntity<T> }[] {
    let neighboringClusters: {
      neighborCluster: GraphEntity<T>;
      fromSepset: GraphEntity<T>;
    }[] = [];

    const treeEntity = this.get(entity);
    if (!treeEntity) {
      throw new Error("Attempting to Get neighbors from nonexisting node");
    }
    const sepSetEntityies = treeEntity.getEdges();

    sepSetEntityies?.forEach(sepSet => {
      const sepSetTreeEntity = this.get(sepSet);
      if (sepSetTreeEntity) {
        const posneighbors = sepSetTreeEntity.getEdges();

        posneighbors?.forEach(posneighbor => {
          if (posneighbor !== entity) {
            const neighbor = this.get(posneighbor);
            if (neighbor) {
              neighboringClusters.push({
                neighborCluster: neighbor,
                fromSepset: sepSetTreeEntity
              });
            }
          }
        });
      }
    });

    return neighboringClusters;
  }

  public addPotentials(entity: T | string, potentials: IPotential[]): void {
    let currentEntity = this.get(entity).getEntity();
    currentEntity.oldPotentials = currentEntity.potentials;
    currentEntity.potentials = potentials;
    this.get(entity).setEntity(currentEntity);
  }

  public markEntity(entity: T | string): void {
    let currentEntity = this.get(entity).getEntity();
    currentEntity.marked = true;
    this.get(entity).setEntity(currentEntity);
  }

  public unmarkAll(): void {
    this.getIDs().forEach(entityKey => {
      let currentEntity = this.get(entityKey).getEntity();
      currentEntity.marked = false;
      this.get(entityKey).setEntity(currentEntity);
    });
  }

  public isOnSameTree(entityA: T, entityB: T): boolean {
    let entitysChecked: T[] = [];
    const edgesOnTreeEntityA = this.get(entityA.id).getEdges();
    edgesOnTreeEntityA?.forEach(entity => {
      if (entity.id === entityB.id) {
        return true;
      } else {
        if (entitysChecked.indexOf(entity) !== -1) {
          this.isOnSameTree(entity, entityB); // Recursively check if any entities from entity A contain entityB
          entitysChecked.push(entity);
        }
      }
    });

    return false;
  }
}
