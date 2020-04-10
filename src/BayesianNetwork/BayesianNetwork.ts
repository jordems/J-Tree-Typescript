import { IEntity } from "../types";
import DirectedGraph from "../GraphStructures/DirectedGraph";

export default class BayesianNetwork {
  private dag: DirectedGraph<IEntity>;
  private entityMap: Map<string, IEntity>;

  constructor(entityMap: Map<string, IEntity>, dag: DirectedGraph<IEntity>) {
    this.entityMap = entityMap;
    this.dag = dag;
  }

  public getDag(): DirectedGraph<IEntity> {
    return this.dag;
  }

  public getEntityMap(): Map<string, IEntity> {
    return this.entityMap;
  }
}
