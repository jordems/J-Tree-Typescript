import BayesianNetwork from "./BayesianNetwork";
import IClique from "./types/IClique";
import { Forest } from "./Tree";
import { printMatrix } from "./PrintTools";
import { cloneDeep } from "lodash";
import ISepSet from "./types/ISepSet";
import IEntity from "./types/IEntity";

export default class GraphicalTransformer {
  private bnet: BayesianNetwork;
  private moralGraph: number[][];
  private triangulatedGraph: number[][];
  private cliques: IClique[];
  private optimizedJunctionTree: Forest<IClique | ISepSet>;

  constructor(bnet: BayesianNetwork) {
    this.bnet = bnet;
    this.moralGraph = this.buildMoralGraph();

    [this.triangulatedGraph, this.cliques] = this.buildTriangulatedGraph();

    this.optimizedJunctionTree = this.buildOptimizedJunctionTree();
  }

  /**
   * Builds Moral Graph from the bayes nets Dag
   * @returns MoralGraph
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
    const entityParents: { [entityID: string]: string[] } = {};
    entityMap.forEach(entity => {
      if (entity.deps) {
        entity.deps.forEach(depEntity => {
          if (!(depEntity.id in entityParents)) {
            entityParents[depEntity.id] = [];
          }
          entityParents[depEntity.id].push(entity.id);
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
   * @returns  [TriangulatedGraph, Cliques]
   */
  private buildTriangulatedGraph(): [number[][], IClique[]] {
    let moralGraphCopy = cloneDeep(this.moralGraph); // Create Deep Copy of moralGraph
    let triangulatedGraph = cloneDeep(this.moralGraph); // Create Deep Copy of moralGraph
    let moralIdxTracker = Array.from(Array(moralGraphCopy.length).keys()); // Array to keep track of original idxs

    let inducedClusters: IClique[] = []; // report induced Clusters for when building Clinques

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
      const labelOfIdxtoRemove = this.bnet
        .getDag()
        .getLabelbyIdx(moralIdxTracker[idxToRemove]);

      let neighboridxs: number[] = [];
      let inducedCluster: IClique = {
        id: labelOfIdxtoRemove,
        entityIDs: [labelOfIdxtoRemove],
        isSepSet: false
      };
      for (let x = 0; x < moralGraphCopy[idxToRemove].length; x++) {
        if (moralGraphCopy[idxToRemove][x] === 1) {
          neighboridxs.push(x);

          const labelOfInducedClusterNeighbors = this.bnet
            .getDag()
            .getLabelbyIdx(moralIdxTracker[x]);
          inducedCluster.id += labelOfInducedClusterNeighbors;
          inducedCluster.entityIDs.push(labelOfInducedClusterNeighbors);
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

    // Remove any subset induced Clusters and generate cliques
    let cliques: IClique[] = [];

    for (let x = 0; x < inducedClusters.length; x++) {
      let isSubset = false;
      for (let y = 0; y < inducedClusters.length; y++) {
        let simCount = 0;
        const entitiesinX = inducedClusters[x].entityIDs;
        const entitiesinY = inducedClusters[y].entityIDs;
        entitiesinX.forEach(entity => {
          if (entitiesinY.includes(entity)) {
            simCount++;
          }
        });
        isSubset = simCount >= entitiesinX.length - 1; // TODO Maybe Fix (IDK)
      }
      if (!isSubset) {
        cliques.push(inducedClusters[x]);
      }
    }

    console.log("cliques", cliques);

    return [triangulatedGraph, cliques];
  }

  /**
   * Using Cliques from Graph Triangulation Build to create Optimized Join Tree
   * @returns OptimizedJunctionTree
   */
  private buildOptimizedJunctionTree(): Forest<IClique | ISepSet> {
    const { cliques } = this;
    const entityMap = this.bnet.getEntityMap();

    // Begin with a set of n trees, each consisting of a single clique, and an empty set cliqueTree
    let cliqueForest = new Forest<IClique | ISepSet>();

    cliques.forEach(clique => {
      cliqueForest.set(clique);
    });

    let cliqueTree: { [cliqueID: string]: { [cliqueID: string]: number } } = {};
    let Petha: ISepSet[] = [];

    // For each distinct pair of cliques X and Y:
    //  a) create a candidate sepset, Labeled X intersection Y with backpointers to the cliques X and Y. Refer to this sepset as S(XY)
    //  b) Insert S(XY) into Petha
    // Repeat until n-1 sepsets have been inserted into the forest
    for (let x = 0; x < cliques.length; x++) {
      for (let y = 0; y < cliques.length; y++) {
        // Init Object
        if (!(cliques[x].id in cliqueTree)) {
          cliqueTree[cliques[x].id] = {};
        }
        if (!(cliques[y].id in cliqueTree[cliques[x].id])) {
          cliqueTree[cliques[x].id][cliques[y].id] = 0;
        }

        if (x !== y) {
          // Find intersecting Entities Between cliques X and Y
          let intersectingentityIDs: string[] = [];
          for (let z = 0; z < cliques[y].entityIDs.length; z++) {
            if (cliques[x].entityIDs.includes(cliques[y].entityIDs[z])) {
              intersectingentityIDs.push(cliques[y].entityIDs[z]);
            }
          }

          if (intersectingentityIDs.length > 0) {
            // Makes Distinct Pairs
            if (
              !(
                cliques[y].id in cliqueTree &&
                cliques[x].id in cliqueTree[cliques[y].id] &&
                cliqueTree[cliques[y].id][cliques[x].id] === 1
              )
            ) {
              cliqueTree[cliques[x].id][cliques[y].id] = 1;

              //cliqueForest.set(new TreeEntity(cliques[x], [cliques[y]]));

              Petha.push({
                id: cliques[x].id + cliques[y].id,
                cliqueXID: cliques[x].id,
                cliqueYID: cliques[y].id,
                intersectingentityIDs: intersectingentityIDs,
                isSepSet: true
              });
            }
          }
        }
      }
    }
    // console.log(cliqueTree);
    // console.log(Petha);

    const nextFromPetha = (
      Petha: ISepSet[],
      cliques: IClique[],
      entityMap: Map<string, IEntity>
    ): ISepSet => {
      //   a) Select a sepset S(xy) from Petha, according to the criterion specified in section 4.42. Delete S(xy) from Petha
      //    4.42 Mass and Cost
      //      Mass: of a sepset S(xy) is the number of variables it contains or number of variables in X intersection Y

      // Choose Sepsets with smalls number of intersecting Entities
      let maxMass = 0;
      let possibleSepSets: ISepSet[] = [];
      for (let x = 0; x < Petha.length; x++) {
        const nIntersections = Petha[x].intersectingentityIDs.length;
        if (nIntersections > maxMass) {
          maxMass = nIntersections;
          possibleSepSets = [Petha[x]];
        } else if (nIntersections === maxMass) {
          possibleSepSets.push(Petha[x]);
        }
      }
      //console.log("PossibleSubseds", possibleSepSets);

      //      Cost: of a sepset S(xy) is the weight of X Plus the weight of Y, where weight is defined as follows:
      //          The weight of a variable V is the number of values of V
      //          The weight of a set of variables X is the product of weights of the variables in X
      //     When selecting next candidate sepset from Petha:
      //        Choose candidate sepset with the largest mass
      //        If more than one have same mass, Choose candidate with the smallest cost.

      // Choose Sepsets with Smallest Cost
      let minWeight = Infinity;
      let possibleSepSetsWeighted: ISepSet[] = [];
      for (let x = 0; x < possibleSepSets.length; x++) {
        // Get Product Weight of CliqueA
        let weightA = 1;
        const cliqueA = cliques.filter(
          clique => clique.id === possibleSepSets[x].cliqueXID
        )[0];
        cliqueA.entityIDs.forEach(entityid => {
          const entity = entityMap.get(entityid);
          if (entity) {
            weightA *=
              entity.cpt && entity.cpt.length !== 0
                ? entity.cpt.length * entity.states.length
                : entity.states.length;
          }
        });
        // Get Product Weight of CliqueB
        let weightB = 1;
        const cliqueB = cliques.filter(
          clique => clique.id === possibleSepSets[x].cliqueYID
        )[0];
        cliqueB.entityIDs.forEach(entityid => {
          const entity = entityMap.get(entityid);
          if (entity) {
            weightB *=
              entity.cpt && entity.cpt.length !== 0
                ? entity.cpt.length * entity.states.length
                : entity.states.length;
          }
        });
        // Sum of Cliques Weights
        const weight = weightA + weightB;
        if (weight < minWeight) {
          possibleSepSetsWeighted = [possibleSepSets[x]];
        } else if (weight === minWeight) {
          possibleSepSetsWeighted.push(possibleSepSets[x]);
        }
      }

      //console.log("PossibleSepSetsWeighted", possibleSepSetsWeighted);
      return possibleSepSetsWeighted[0];
    };

    for (let x = 0; x < Petha.length - 1; x++) {
      const sepSet = nextFromPetha(Petha, cliques, entityMap);

      const idxOfsepSet = Petha.indexOf(sepSet);
      Petha.splice(idxOfsepSet, 1);
      //   b) Insert the sepset S(xy) between the cliques X and Y only if X and Y are on different trees in the forest.
      //    (Note the insertion of such a sepset will merge two trees into a larger tree)

      const cliqueX = cliques.filter(cliq => cliq.id === sepSet.cliqueXID)[0];

      const cliqueY = cliques.filter(cliq => cliq.id === sepSet.cliqueYID)[0];

      if (!cliqueForest.isOnSameTree(cliqueX, cliqueY)) {
        console.log("Inserting ssClique", sepSet, cliqueX, cliqueY);
        cliqueForest.set(sepSet);
        cliqueForest.addEdge(cliqueX, sepSet);
        cliqueForest.addEdge(cliqueY, sepSet);
      }
    }
    console.log(cliqueForest.toString());
    return cliqueForest;
  }

  public getOptimizedJunctionTree(): Forest<IClique | ISepSet> {
    return this.optimizedJunctionTree;
  }
}
