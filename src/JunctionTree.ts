import { cloneDeep } from "lodash";

import BayesianNetwork from "./BayesianNetwork";
import IEntity from "./IEntity";

export default class JunctionTree {
  private bnet: BayesianNetwork;
  private moralGraph: number[][];
  private triangulatedGraph: number[][];

  constructor(bnet: BayesianNetwork) {
    this.bnet = bnet;
    this.moralGraph = this.buildMoralGraph();
    this.triangulatedGraph = this.buildTriangulatedGraph();
    this.buildCliques();
    this.buildJunctionTree();
  }

  private buildMoralGraph(): number[][] {
    const dagMatrix = this.bnet.getDag().getMatrix();

    let undirectedGraph: number[][] = new Array(dagMatrix.length)
      .fill(0)
      .map(() => new Array(dagMatrix.length).fill(0));

    // Generate Undirected Graph from Dag
    for (let x = 0; x < dagMatrix.length; x++) {
      for (let y = 0; y < dagMatrix[x].length; y++) {
        if (dagMatrix[x][y] === 1) {
          undirectedGraph[x][y] = 1;
          undirectedGraph[y][x] = 1;
        }
      }
    }

    // Create "Moral arcs"
    // First we must find each of the parents
    const entityMap = this.bnet.getEntityMap();
    const entityParents: { [entityName: string]: string[] } = {};
    entityMap.forEach(entity => {
      if (entity.deps) {
        entity.deps.forEach(depEntity => {
          if (!(depEntity.name in entityParents)) {
            entityParents[depEntity.name] = [];
          }
          entityParents[depEntity.name].push(entity.name);
        });
      }
    });

    // Check if each entity has more than one parent, if so connect all parents
    const idxLabels = this.bnet.getDag().getLabels();
    Object.keys(entityParents).forEach(entityChildKey => {
      const entitiesParents = entityParents[entityChildKey];

      if (entitiesParents.length > 1) {
        for (let x = 0; x < entitiesParents.length; x++) {
          for (let y = 0; y < entitiesParents.length; y++) {
            const p1IDX = idxLabels[entitiesParents[x]];
            const p2IDX = idxLabels[entitiesParents[y]];
            if (p1IDX !== p2IDX) {
              undirectedGraph[p1IDX][p2IDX] = 1;
              undirectedGraph[p2IDX][p1IDX] = 1;
            }
          }
        }
      }
    });
    console.log("Undirected Graph", undirectedGraph);
    return undirectedGraph;
  }

  private buildTriangulatedGraph(): number[][] {
    let moralGraphCopy = cloneDeep(this.moralGraph); // Create Deep Copy of moralGraph

    let triangulatedGraph = cloneDeep(this.moralGraph); // Create Deep Copy of moralGraph

    // While nodes still in copy
    while (moralGraphCopy.length > 0) {
      let idxofEntityToDelete = 0; // Default to idx 0
      // step a: Find Node that will "cause the least number of edges to be added in step b,
      // breaking ties by choosing the node that includes the cluster with the smallest weight
      let minNeighbors = Infinity;
      for (let x = 0; x < moralGraphCopy.length; x++) {
        const entityNeightborSum = moralGraphCopy[x].reduce((a, b) => {
          return a + b;
        }, 0);
        if (entityNeightborSum < minNeighbors) {
          minNeighbors = entityNeightborSum;
          idxofEntityToDelete = x;
        }
      }

      // step b:
      // Get Neighbors of `idxofEntityToDelete`
      let neighborIdxs: number[] = [];
      for (let x = 0; x < moralGraphCopy[idxofEntityToDelete].length; x++) {
        if (moralGraphCopy[idxofEntityToDelete][x] === 1) {
          neighborIdxs.push(x);
        }
      }

      // Connect all nodes in cluster, for each edge added to moralGraphCopy, add the same corresponding edge to trangulatedGraph
      for (let x = 0; x < neighborIdxs.length; x++) {
        for (let y = 0; y < neighborIdxs.length; y++) {
          const n1 = neighborIdxs[x];
          const n2 = neighborIdxs[y];

          if (n1 !== n2) {
            // If no edge between neighbors exist
            if (moralGraphCopy[n1][n2] === 0) {
              moralGraphCopy[n1][n2] = 1;
              moralGraphCopy[n2][n1] = 1;

              triangulatedGraph[n1][n2] = 1;
              triangulatedGraph[n2][n1] = 1;
            }
          }
        }
      }

      // step c:
      // Remove idxofEntityToDelete from moralGraphCopy
      for (let x = 0; x < moralGraphCopy.length; x++) {
        moralGraphCopy[x].splice(idxofEntityToDelete, 1);
      }
      moralGraphCopy.splice(idxofEntityToDelete, 1);
    }
    console.log("triangulatedGraph", triangulatedGraph);
    return triangulatedGraph;
  }

  private buildCliques(): void {}

  private buildJunctionTree(): void {}
}
