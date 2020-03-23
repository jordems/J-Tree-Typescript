import IPotential from "./types/IPotential";

interface GenericInterface {
  id: string;
  potentials?: IPotential[];
  isSepSet: boolean;
}

/**
 * @class Forest
 * This class will act as a datastruture for the forest
 */
export class Forest<T extends GenericInterface> {
  private treeEntities: { [id: string]: TreeEntity<T> } = {};

  public set(entity: T): void {
    // If treeEntity Already Exists, add new Edges if they exist
    if (!this.exists(entity.id)) {
      this.treeEntities[entity.id] = new TreeEntity(entity);
    }
  }

  public get(entity: T | string): TreeEntity<T> {
    if (typeof entity === "string") {
      return this.treeEntities[entity];
    }
    return this.treeEntities[entity.id];
  }

  public exists(entity: T | string): boolean {
    return this.get(entity) !== undefined;
  }

  public addEdge(entityA: T, entityB: T): void {
    if (entityA !== entityB) {
      this.get(entityA).addDirectEdge(entityB);
      this.get(entityB).addDirectEdge(entityA);
    }
  }

  public removeEdge(entityA: T, entityB: T): void {
    if (entityA !== entityB) {
      this.get(entityA).removeDirectEdge(entityB);
      this.get(entityB).removeDirectEdge(entityA);
    }
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

  public getValues(): TreeEntity<T>[] {
    return Object.values(this.treeEntities);
  }

  public getIDs(): string[] {
    return Object.keys(this.treeEntities);
  }

  public toString = (): string => {
    let string = "Tree Printout:\n\n";

    Object.keys(this.treeEntities).forEach(treeKey => {
      string += this.treeEntities[treeKey] + "\n";
    });

    return string;
  };
}

class TreeEntity<T extends GenericInterface> {
  private entity: T;
  private edges: T[] = [];

  constructor(entity: T) {
    this.entity = entity;
    this.edges = [];
  }

  public getID(): string {
    return this.entity.id;
  }

  public getEdges(): T[] | undefined {
    return this.edges;
  }

  public addDirectEdge(entity: T): void {
    if (this.edges.indexOf(entity) === -1) {
      this.edges.push(entity);
    }
  }

  public removeDirectEdge(entity: T): void {
    this.edges = this.edges.filter(edge => edge.id != entity.id);
  }

  public getEntity(): T {
    return this.entity;
  }

  public setPotentials(potentials: IPotential[]): void {
    this.entity.potentials = potentials;
  }

  public toString = (): string => {
    if (this.entity.isSepSet) {
      return `SepSet: ${JSON.stringify(this.entity)} \nEdges: ${JSON.stringify(
        this.edges
      )}\n`;
    } else {
      return `Entity: ${JSON.stringify(this.entity)} \nEdges: ${JSON.stringify(
        this.edges
      )}\n`;
    }
  };
}
