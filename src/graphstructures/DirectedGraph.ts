import { IGeneralGraph } from "../types";
import GraphEntity from "./GraphEntity";

interface GenericType {
  id: string;
}

/**
 * @class Directed GarphGraph
 *
 */
export default class DirectedGraph<T extends GenericType>
  implements IGeneralGraph<T> {
  private graphEntities: { [id: string]: GraphEntity<T> };
  constructor() {
    this.graphEntities = {};
  }

  public set(entity: T): void {
    this.graphEntities[entity.id] = new GraphEntity(entity);
  }

  public get(entity: T | string): GraphEntity<T> {
    if (typeof entity === "string") {
      return this.graphEntities[entity];
    }
    return this.graphEntities[entity.id];
  }

  public remove(entity: T): void {
    delete this.graphEntities[entity.id];

    this.getValues().forEach(graphEntity => {
      if (graphEntity.hasEdge(entity)) {
        graphEntity.removeDirectEdge(entity);
      }
    });
  }

  public exists(entity: T | string): boolean {
    return this.get(entity) !== undefined;
  }

  public addEdge(entityA: T, entityB: T): void {
    if (entityA.id !== entityB.id) {
      this.get(entityA).addDirectEdge(entityB);
    }
  }

  public removeEdge(entityA: T, entityB: T): void {
    if (entityA.id !== entityB.id) {
      this.get(entityA).removeDirectEdge(entityB);
    }
  }

  public getNeighboringEntities(entity: T): T[] {
    const graphEntity = this.get(entity);
    if (!graphEntity) {
      throw new Error("Attempting to Get neighbors from nonexisting node");
    }
    let neighboringEntities = graphEntity.getEdges();

    return !neighboringEntities ? [] : neighboringEntities;
  }

  public getValues(): GraphEntity<T>[] {
    return Object.values(this.graphEntities);
  }

  public getIDs(): string[] {
    return Object.keys(this.graphEntities);
  }

  public toString = (): string => {
    let string = "Graph Printout:\n\n";

    Object.keys(this.graphEntities).forEach(treeKey => {
      string += this.graphEntities[treeKey] + "\n";
    });

    return string;
  };

  // Only displays correctly if entity id's are 1 character in length
  public displayMatrix(): void {
    console.log("Displaying Graph Matrix");
    let col = "  ";
    let res = "";
    this.getValues().forEach(r => {
      col += r.getID() + " ";
      let row = r.getID() + " ";
      this.getValues().forEach(c => {
        row += r.hasEdge(c.getEntity()) ? "1 " : "0 ";
      });
      res += row + "\n";
    });
    console.log(col);
    console.log(res);
  }
}
