import Dag from "./Dag";
import IEntity from "./types/IEntity";

export default class BayesianNetwork {
  private dag: Dag;
  private entityMap: Map<string, IEntity>;

  constructor(entityMap: Map<string, IEntity>, dag: Dag) {
    this.entityMap = entityMap;
    this.dag = dag;
  }

  public getDag(): Dag {
    return this.dag;
  }

  public getEntityMap(): Map<string, IEntity> {
    return this.entityMap;
  }
}
