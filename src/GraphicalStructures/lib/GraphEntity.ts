interface GenericType {
  id: string;
}

export default class GraphEntity<T extends GenericType> {
  private entity: T;
  private edges: { [entityid: string]: T };

  constructor(entity: T) {
    this.entity = entity;
    this.edges = {};
  }

  public getID(): string {
    return this.entity.id;
  }

  public getEdges(): T[] {
    return Object.values(this.edges);
  }

  public hasEdge(entity: T) {
    return entity.id in this.edges;
  }

  public addDirectEdge(entity: T): void {
    this.edges[entity.id] = entity;
  }

  public removeDirectEdge(entity: T): void {
    delete this.edges[entity.id];
  }

  public getEntity(): T {
    return this.entity;
  }

  public setEntity(entity: T): void {
    this.entity = entity;
  }

  public toString = (): string => {
    return `GraphEntity: ${JSON.stringify(
      this.entity,
      null,
      " "
    )} \nEdges: ${JSON.stringify(this.edges, null, " ")}\n`;
  };
}
