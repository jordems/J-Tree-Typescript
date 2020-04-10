import GraphEntity from "../GraphicalStructures/lib/GraphEntity";

export interface IGeneralGraph<T extends { id: string }> {
  set(entity: T): void;

  get(entity: T | string): GraphEntity<T>;

  exists(entity: T | string): boolean;

  addEdge(entityA: T, entityB: T): void;

  removeEdge(entityA: T, entityB: T): void;

  getNeighboringEntities(entity: T): T[];

  getValues(): GraphEntity<T>[];

  getIDs(): string[];
}
