import IEntity from "./types/IEntity";
import DirectedGraph from "./graphstructures/DirectedGraph";

export default class DagBuilder {
  public buildDag(entityMap: Map<string, IEntity>): DirectedGraph<IEntity> {
    let dag: DirectedGraph<IEntity> = new DirectedGraph();

    // Add all entities into DAG
    entityMap.forEach(entity => {
      dag.set(entity);
    });

    // Add each Edge to dag from dependencies given in entityMap
    entityMap.forEach(entity => {
      if (entity.deps) {
        entity.deps.forEach(dep => {
          dag.addEdge(entity, dep);
        });
      }
    });

    return dag;
  }
}
