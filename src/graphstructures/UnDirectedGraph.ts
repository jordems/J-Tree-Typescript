import IGeneralGraph from "../types/IGeneralGraph";
import DirectedGraph from "./DirectedGraph";

interface GenericType {
  id: string;
}

/**
 * @class UnDirected GarphGraph
 *
 */
export default class UnDirectedGraph<T extends GenericType>
  extends DirectedGraph<T>
  implements IGeneralGraph<T> {
  constructor() {
    super();
  }
  // @Overriding addEdge to make Undirected
  public addEdge(entityA: T, entityB: T): void {
    if (entityA.id !== entityB.id) {
      this.get(entityA).addDirectEdge(entityB);
      this.get(entityB).addDirectEdge(entityA);
    }
  }

  // @Overriding removeEdge to make Undirected
  public removeEdge(entityA: T, entityB: T): void {
    if (entityA.id !== entityB.id) {
      this.get(entityA).removeDirectEdge(entityB);
      this.get(entityB).removeDirectEdge(entityA);
    }
  }
}
