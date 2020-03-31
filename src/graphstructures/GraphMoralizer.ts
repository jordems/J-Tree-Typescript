import { cloneDeep } from "lodash";

import UnDirectedGraph from "./UnDirectedGraph";
import DirectedGraph from "./DirectedGraph";

export default class GraphMoralizer<T extends { id: string }> {
  public moralize(directedGraph: DirectedGraph<T>): UnDirectedGraph<T> {
    let directGraph = cloneDeep(directedGraph);
    let unDirectedGraph = new UnDirectedGraph<T>();

    // Add all entities into unDirectedGraph
    directGraph.getIDs().forEach(entityID => {
      const entity = directGraph.get(entityID).getEntity();
      unDirectedGraph.set(entity);
    });

    // Add all edges in unDirectedGraph
    directGraph.getIDs().forEach(entityID => {
      const graphentity = directGraph.get(entityID);
      graphentity.getEdges()?.forEach(edge => {
        unDirectedGraph.addEdge(graphentity.getEntity(), edge);
      });
    });

    return unDirectedGraph;
  }
}
