import { cloneDeep } from "lodash";

import BayesianNetwork from "./BayesianNetwork";
import IEntity from "./IEntity";
import { printMatrix } from "./PrintTools";

export default class JunctionTree {
  private bnet: BayesianNetwork;
  private moralGraph: number[][];
  private triangulatedGraph: number[][];
  private cliques: string[][];

  constructor(bnet: BayesianNetwork) {
    this.bnet = bnet;
    this.moralGraph = this.buildMoralGraph();

    [this.triangulatedGraph, this.cliques] = this.buildTriangulatedGraph();

    this.buildJunctionTree();
  }

  /**
   * Builds Moral Graph from the bayes nets Dag
   */
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

    Object.keys(entityParents).forEach(entityChildKey => {
      const entitiesParents = entityParents[entityChildKey];

      if (entitiesParents.length > 1) {
        for (let x = 0; x < entitiesParents.length; x++) {
          for (let y = 0; y < entitiesParents.length; y++) {
            const p1IDX = this.bnet.getDag().getIdxbyLabel(entitiesParents[x]);
            const p2IDX = this.bnet.getDag().getIdxbyLabel(entitiesParents[y]);
            if (p1IDX !== p2IDX) {
              undirectedGraph[p1IDX][p2IDX] = 1;
            }
          }
        }
      }
    });
    console.log("Moral Graph");
    printMatrix(undirectedGraph);
    return undirectedGraph;
  }

  /**
   * Builds Triangulated Graph from Moral Graph and also finds Cliques
   */
  private buildTriangulatedGraph(): [number[][], string[][]] {
    let moralGraphCopy = cloneDeep(this.moralGraph); // Create Deep Copy of moralGraph
    let triangulatedGraph = cloneDeep(this.moralGraph); // Create Deep Copy of moralGraph
    let moralIdxTracker = Array.from(Array(moralGraphCopy.length).keys()); // Array to keep track of original idxs

    let inducedClusters: string[][] = []; // report induced Clusters for when building Clinques

    const entityMap = this.bnet.getEntityMap();

    // While moralGraphCopy is not empty
    while (moralGraphCopy.length > 0) {
      let idxToRemove = -1;
      //    Select a entity V from moralGraphCopy according to:
      //      Weight of entity V  is the number of values of V. IN our case number of elements in CPT array.
      //      Weight of cluster is the product of the weights of the entites with
      //      **When selecting entities to remove: Choose the entity that causes the least number of edges to be added in the next step,
      let entityEdgesAdded: number[] = [];
      for (let x = 0; x < moralGraphCopy.length; x++) {
        // init
        if (!(x in entityEdgesAdded)) {
          entityEdgesAdded[x] = 0;
        }

        // Get Neighbors
        const neighboridxs: number[] = [];
        for (let y = 0; y < moralGraphCopy[x].length; y++) {
          if (moralGraphCopy[x][y] === 1) {
            neighboridxs.push(y);
          }
        }

        // Count how many edges would be added
        for (let i = 0; i < neighboridxs.length; i++) {
          for (let j = 0; j < neighboridxs.length; j++) {
            const n1 = neighboridxs[i];
            const n2 = neighboridxs[j];
            if (n1 !== n2 && moralGraphCopy[n1][n2] !== 1) {
              entityEdgesAdded[x] += 1;
            }
          }
        }
      }

      // Get Entites with lows amount of edges added
      const lowestEdgeCountIdxs: number[] = [];
      const minEdgeCount = Math.min(...entityEdgesAdded);
      for (let x = 0; x < entityEdgesAdded.length; x++) {
        if (minEdgeCount === entityEdgesAdded[x]) {
          lowestEdgeCountIdxs.push(x);
        }
      }

      //      breaking ties by choosing the entity that induces the cluster with the smallest weight.
      if (lowestEdgeCountIdxs.length === 1) {
        idxToRemove = lowestEdgeCountIdxs[0];
        console.log(
          this.bnet
            .getDag()
            .getLabelbyIdx(moralIdxTracker[lowestEdgeCountIdxs[0]])
        );
      } else {
        let minWeight = Infinity;
        for (let x = 0; x < lowestEdgeCountIdxs.length; x++) {
          const idx = lowestEdgeCountIdxs[x];
          const entity = entityMap.get(
            this.bnet.getDag().getLabelbyIdx(moralIdxTracker[idx])
          );

          if (entity) {
            const entityWeight =
              entity.cpt && entity.cpt.length !== 0
                ? entity.cpt.length * entity.states.length
                : entity.states.length;

            let clusterWeights: number[] = [entityWeight];
            // Get Neighbors
            for (let y = 0; y < moralGraphCopy[idx].length; y++) {
              if (moralGraphCopy[idx][y] === 1) {
                const neighborEntity = entityMap.get(
                  this.bnet.getDag().getLabelbyIdx(moralIdxTracker[y])
                );
                if (neighborEntity) {
                  clusterWeights.push(
                    neighborEntity.cpt && neighborEntity.cpt.length !== 0
                      ? neighborEntity.cpt.length * neighborEntity.states.length
                      : neighborEntity.states.length
                  );
                }
              }
            }
            // Get Weight of Cluster
            const weight = clusterWeights.reduce((a, b) => a * b);
            console.log(
              this.bnet.getDag().getLabelbyIdx(moralIdxTracker[idx]),
              weight
            );
            if (weight <= minWeight) {
              minWeight = weight;
              idxToRemove = idx;
            }
          }
        }
      }
      console.log("cycle");
      //    With the entity V selected
      //    Get its neighbors and, this forms a cluster
      let neighboridxs: number[] = [];
      let inducedCluster: string[] = [
        this.bnet.getDag().getLabelbyIdx(moralIdxTracker[idxToRemove])
      ];
      for (let x = 0; x < moralGraphCopy[idxToRemove].length; x++) {
        if (moralGraphCopy[idxToRemove][x] === 1) {
          neighboridxs.push(x);
          inducedCluster.push(
            this.bnet.getDag().getLabelbyIdx(moralIdxTracker[x])
          );
        }
      }

      // Add to inducedClusters
      inducedClusters.push(inducedCluster);

      //    Connect all nodes in this cluster, for each new edge added to moralGraphCopy add this edge to the triangulatedGraph
      for (let x = 0; x < neighboridxs.length; x++) {
        for (let y = 0; y < neighboridxs.length; y++) {
          const n1 = neighboridxs[x];
          const n2 = neighboridxs[y];

          if (n1 !== n2) {
            moralGraphCopy[n1][n2] = 1;

            triangulatedGraph[moralIdxTracker[n1]][moralIdxTracker[n2]] = 1;
          }
        }
      }

      //    Remove Entity V from moralGraphCopy and sync moralIdxTracker
      for (let x = 0; x < moralGraphCopy.length; x++) {
        moralGraphCopy[x].splice(idxToRemove, 1);
      }

      moralGraphCopy.splice(idxToRemove, 1);
      moralIdxTracker.splice(idxToRemove, 1);
    }

    console.log("triangulatedGraph");
    printMatrix(triangulatedGraph);
    console.log("inducedClusters", inducedClusters);
    return [triangulatedGraph, inducedClusters];
  }

  /**
   * Using Cliques from Graph Triangulation Builds Optimized Join Tree
   */
  private buildJunctionTree(): void {}
}
