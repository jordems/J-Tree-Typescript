import { cloneDeep } from "lodash";

import BayesianNetwork from "../../BayesianNetwork/BayesianNetwork";
import Forest from "../../GraphicalStructures/Forest";
import { IEntity, ISepSet, IClique } from "../../types";
import UnDirectedGraph from "../../GraphicalStructures/UnDirectedGraph";
import GraphMoralizer from "../../GraphicalStructures/lib/GraphMoralizer";

export default class GraphicalTransformer {
  private optimizedJunctionTree: Forest<IClique | ISepSet>;
  private entityMap: Map<string, IEntity>;

  constructor(bnet: BayesianNetwork) {
    this.entityMap = bnet.getEntityMap();

    const moralGraph = this.buildMoralGraph(bnet);

    console.log("\n\n--Starting Graphical Triangulation--\n");
    const cliques = this.buildTriangulatedGraph(moralGraph);
    console.log("\n--Finished Graphical Triangulation--\n");

    console.log("\n\n--Starting J Tree Optimization--\n");
    this.optimizedJunctionTree = this.buildOptimizedJunctionTree(bnet, cliques);

    console.log(this.optimizedJunctionTree.toString());
    console.log("\n--Finished J Tree Optimization--\n");
  }

  /**
   * Builds Moral Graph from the bayes nets Dag
   * @returns MoralGraph
   */
  private buildMoralGraph(bnet: BayesianNetwork): UnDirectedGraph<IEntity> {
    const dag = bnet.getDag();

    let undirectedGraph: UnDirectedGraph<IEntity>;

    // Generate Undirected Graph from Dag
    const graphMoralizer = new GraphMoralizer<IEntity>();
    undirectedGraph = graphMoralizer.moralize(dag);

    // Create "Moral arcs"
    // First we must find each of the parents
    const entityMap = bnet.getEntityMap();
    const entityParents: { [entityID: string]: string[] } = {};
    entityMap.forEach((entity) => {
      if (entity.deps) {
        entity.deps.forEach((depEntity) => {
          if (!(depEntity.id in entityParents)) {
            entityParents[depEntity.id] = [];
          }
          entityParents[depEntity.id].push(entity.id);
        });
      }
    });

    // Check if each entity has more than one parent, if so connect all parents

    Object.keys(entityParents).forEach((entityChildKey) => {
      const entitiesParents = entityParents[entityChildKey];

      if (entitiesParents.length > 1) {
        for (let x = 0; x < entitiesParents.length; x++) {
          for (let y = 0; y < entitiesParents.length; y++) {
            const p1IDX = dag.get(entitiesParents[x]).getEntity();
            const p2IDX = dag.get(entitiesParents[y]).getEntity();
            if (p1IDX !== p2IDX) {
              undirectedGraph.addEdge(p1IDX, p2IDX);
            }
          }
        }
      }
    });

    console.log("\n\n----Moral Graph----\n");
    undirectedGraph.displayMatrix();
    return undirectedGraph;
  }

  /**
   * Builds Triangulated Graph from Moral Graph and also finds Cliques
   * Considering we don't care about the triangulated graph we only return the cliques
   * @returns Cliques
   */
  private buildTriangulatedGraph(
    moralGraph: UnDirectedGraph<IEntity>
  ): IClique[] {
    let moralGraphCopy = cloneDeep(moralGraph); // Create Copy of moralGraph
    let triangulatedGraph = cloneDeep(moralGraph); // init triangulatedGraph

    let inducedClusters: IClique[] = []; // report induced Clusters for when building Clinques
    // While moralGraphCopy is not empty
    while (moralGraphCopy.getIDs().length > 0) {
      let idxToRemove: string = "";
      //    Select a entity V from moralGraphCopy according to:
      //      Choose the entity that causes the least number of edges to be added in the next step,
      //      But if tie breaker, then pick induced cluster with smallest weight
      //        Weight of entity V  is the number of values of V. IN our case number of elements in CPT array.
      //        Weight of cluster is the product of the weights of the entites with

      let entityEdgesAddedCount: { [entityid: string]: number } = {};
      for (const curGraphentity of moralGraphCopy.getValues()) {
        const curEntity = curGraphentity.getEntity();

        // init Count
        if (!(curEntity.id in entityEdgesAddedCount)) {
          entityEdgesAddedCount[curEntity.id] = 0;
        }

        // Get Neighbors
        const neightbors = curGraphentity.getEdges();

        // Count how many edges would be added
        neightbors?.forEach((n1) => {
          neightbors?.forEach((n2) => {
            if (n1.id !== n2.id && !moralGraphCopy.get(n1).hasEdge(n2)) {
              entityEdgesAddedCount[curEntity.id] += 1;
            }
          });
        });
      }

      // Get Entites with lowest amount of edges added
      const lowestEdgeCountIds: string[] = [];
      const minEdgeCount = Math.min(...Object.values(entityEdgesAddedCount));
      Object.keys(entityEdgesAddedCount).forEach((entityID) => {
        if (minEdgeCount === entityEdgesAddedCount[entityID]) {
          lowestEdgeCountIds.push(entityID);
        }
      });

      //      breaking ties by choosing the entity that induces the cluster with the smallest weight.
      if (lowestEdgeCountIds.length === 1) {
        idxToRemove = lowestEdgeCountIds[0];
      } else {
        let minWeight = Infinity;
        let valueswithMinWeight: string[] = [];
        for (let x = 0; x < lowestEdgeCountIds.length; x++) {
          const idx = lowestEdgeCountIds[x];
          const graphEntity = moralGraphCopy.get(idx);

          const entity = graphEntity.getEntity();

          // Get Neighbors Weights
          const neightbors = graphEntity.getEdges();

          let clusterWeights: number[] = [];

          for (const neighborEntity of neightbors) {
            clusterWeights.push(
              neighborEntity.cpt &&
                neighborEntity.cpt.length !== 0 &&
                Object.keys(neighborEntity.cpt[0].if).length !== 0
                ? neighborEntity.states.length *
                    Object.keys(neighborEntity.cpt[0].if).length
                : 0
            );
          }
          // Get Weight of Cluster
          const weight = clusterWeights.reduce((a, b) => a * b);

          if (weight === minWeight) {
            valueswithMinWeight.push(idx);
          } else if (weight < minWeight) {
            minWeight = weight;
            valueswithMinWeight = [idx];
          }
        }
        // Break Ties of Entities with the same weight, by grabing the entity that was placed in the graph first
        // Seems that they did this in the research paper that we are following (Inference in Belief Networks: A Procedural Guide)
        let minPlace = Infinity;
        for (let x = 0; x < valueswithMinWeight.length; x++) {
          const curPlace = this.getValueFromStart(
            moralGraphCopy.get(valueswithMinWeight[x]).getEntity()
          );
          if (curPlace <= minPlace) {
            minPlace = curPlace;
            idxToRemove = valueswithMinWeight[x];
          }
        }
      }
      console.log("Triangulation Removeing idx", idxToRemove);

      //    With the entity V selected
      const selectedGraphEntity = moralGraphCopy.get(idxToRemove);
      //    Get its neighbors and, this forms a cluster

      let inducedCluster: IClique = {
        id: idxToRemove,
        entityIDs: [idxToRemove],
        isSepSet: false,
      };

      selectedGraphEntity.getEdges()?.forEach((n) => {
        inducedCluster.id += n.id;
        inducedCluster.entityIDs.push(n.id);
      });

      // Add to inducedClusters
      inducedClusters.push(inducedCluster);

      //    Connect all nodes in this cluster, for each new edge added to moralGraphCopy add this edge to the triangulatedGraph
      selectedGraphEntity.getEdges()?.forEach((n1) => {
        selectedGraphEntity.getEdges()?.forEach((n2) => {
          if (n1.id !== n2.id) {
            moralGraphCopy.addEdge(n1, n2);

            triangulatedGraph.addEdge(n1, n2);
          }
        });
      });

      //    Remove Entity V from moralGraphCopy and sync moralIdxTracker
      moralGraphCopy.remove(moralGraphCopy.get(idxToRemove).getEntity());
    }

    console.log("\n--Triangulated Graph--");
    triangulatedGraph.displayMatrix();

    console.log("Found InducedClusters:");
    inducedClusters.forEach((inducedCluster) => {
      console.log(`Cluster[${inducedCluster.entityIDs}]`);
    });

    // Remove any subset induced Clusters and generate cliques
    let cliques: IClique[] = [];

    for (let x = 0; x < inducedClusters.length; x++) {
      let isSubset = false;
      for (let y = 0; y < inducedClusters.length; y++) {
        let simCount = 0;
        const entitiesinX = inducedClusters[x].entityIDs;
        const entitiesinY = inducedClusters[y].entityIDs;
        entitiesinX.forEach((entity) => {
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

    console.log("\nFound Cliques:");
    cliques.forEach((clique) => {
      console.log(`Cluster[${clique.entityIDs}]`);
    });

    return cliques;
  }

  /**
   * Help function for buildTriangulated Graph to
   * @param entity IEntity
   * @param count? current count
   */
  private getValueFromStart(entity: IEntity, count?: number): number {
    let tCount = count;

    if (tCount === undefined) {
      tCount = 0;
    }

    const entities = this.entityMap.values();
    for (const tent of entities) {
      if (
        tent.deps &&
        tent.deps.filter((ent) => ent.id === entity.id).length > 0
      ) {
        tCount++;
        tCount += this.getValueFromStart(tent, tCount);
      }
    }
    return tCount;
  }

  /**
   * Using Cliques from Graph Triangulation Build to create Optimized Join Tree
   * @returns OptimizedJunctionTree
   */
  private buildOptimizedJunctionTree(
    bnet: BayesianNetwork,
    cliques: IClique[]
  ): Forest<IClique | ISepSet> {
    const entityMap = bnet.getEntityMap();

    // Begin with a set of n trees, each consisting of a single clique
    let cliqueForest = new Forest<IClique | ISepSet>();
    for (const clique of cliques) {
      cliqueForest.set(clique);
    }

    // Use cliqueDistinct to make sure pairs are distinct for
    let cliqueDistinct: {
      [cliqueID: string]: { [cliqueID: string]: number };
    } = {};
    let Petha: ISepSet[] = [];

    // For each distinct pair of cliques X and Y:
    //  a) create a candidate sepset, Labeled X intersection Y with backpointers to the cliques X and Y. Refer to this sepset as S(XY)
    //  b) Insert S(XY) into Petha
    for (let x = 0; x < cliques.length; x++) {
      for (let y = 0; y < cliques.length; y++) {
        // Init Object
        if (!(cliques[x].id in cliqueDistinct)) {
          cliqueDistinct[cliques[x].id] = {};
        }
        if (!(cliques[y].id in cliqueDistinct[cliques[x].id])) {
          cliqueDistinct[cliques[x].id][cliques[y].id] = 0;
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
                cliques[y].id in cliqueDistinct &&
                cliques[x].id in cliqueDistinct[cliques[y].id] &&
                cliqueDistinct[cliques[y].id][cliques[x].id] === 1
              )
            ) {
              cliqueDistinct[cliques[x].id][cliques[y].id] = 1;

              //cliqueForest.set(new TreeEntity(cliques[x], [cliques[y]]));

              Petha.push({
                id: cliques[x].id + cliques[y].id,
                cliqueXID: cliques[x].id,
                cliqueYID: cliques[y].id,
                intersectingentityIDs: intersectingentityIDs,
                isSepSet: true,
              });
            }
          }
        }
      }
    }

    const nextFromPetha = (
      Petha: ISepSet[],
      cliques: IClique[],
      entityMap: Map<string, IEntity>
    ): ISepSet => {
      //   a) Select a sepset S(xy) from Petha, according to the criterion specified in section 4.42. Delete S(xy) from Petha
      //    4.42 Mass and Cost
      //      Mass: of a sepset S(xy) is the number of variables it contains or number of variables in X intersection Y

      // Choose Sepsets with highest mass
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
          (clique) => clique.id === possibleSepSets[x].cliqueXID
        )[0];
        cliqueA.entityIDs.forEach((entityid) => {
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
          (clique) => clique.id === possibleSepSets[x].cliqueYID
        )[0];
        cliqueB.entityIDs.forEach((entityid) => {
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

      return possibleSepSetsWeighted[0];
    };

    let sepSetInsertCount = 0;
    while (sepSetInsertCount < cliques.length - 1) {
      const sepSet = nextFromPetha(Petha, cliques, entityMap);

      const idxOfsepSet = Petha.indexOf(sepSet);
      Petha.splice(idxOfsepSet, 1);
      //   b) Insert the sepset S(xy) between the cliques X and Y only if X and Y are on different trees in the forest.
      //    (Note the insertion of such a sepset will merge two trees into a larger tree)

      const cliqueX = cliques.filter((cliq) => cliq.id === sepSet.cliqueXID)[0];

      const cliqueY = cliques.filter((cliq) => cliq.id === sepSet.cliqueYID)[0];

      if (!cliqueForest.isOnSameTree(cliqueX, cliqueY)) {
        console.log(
          `Inserting Sepset[${sepSet.intersectingentityIDs}] BETWEEN Cluster[${cliqueX.entityIDs}] and Cluster[${cliqueY.entityIDs}]`
        );
        cliqueForest.set(sepSet);
        cliqueForest.addEdge(cliqueX, sepSet);
        cliqueForest.addEdge(cliqueY, sepSet);
        sepSetInsertCount++;
      } else {
        console.log(`On Same Tree: ${cliqueX.id}:${cliqueY.id}`);
      }

      // // Repeat until n-1 sepsets have been inserted into the forest
      // if (sepSetInsertCount >= cliques.length - 1) {
      //   break;
      // }
    }
    return cliqueForest;
  }

  public getOptimizedJunctionTree(): Forest<IClique | ISepSet> {
    return this.optimizedJunctionTree;
  }
}
