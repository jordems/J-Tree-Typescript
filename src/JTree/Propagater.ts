import { cloneDeep } from "lodash";

import IEntity from "../types/IEntity";
import ISepSet from "../types/ISepSet";
import IClique from "../types/IClique";
import Forest from "../graphstructures/Forest";
import IPotential from "../types/IPotential";
import GraphEntity from "../graphstructures/GraphEntity";

export default class Propagater {
  private entityMap: Map<string, IEntity>;
  private consistentJunctionTree: Forest<IClique | ISepSet>;
  constructor(
    inconsistentJunctionTree: Forest<IClique | ISepSet>,
    entityMap: Map<string, IEntity>
  ) {
    this.entityMap = entityMap;

    this.consistentJunctionTree = this.propagate(inconsistentJunctionTree);
  }

  private propagate(
    inconsistentJunctionTree: Forest<IClique | ISepSet>
  ): Forest<IClique | ISepSet> {
    // Deep Copy of inconsistent Junction Tree
    let consistentJunctionTree: Forest<IClique | ISepSet> = cloneDeep(
      inconsistentJunctionTree
    );

    // Global Propagation

    // 1. Choose an arbitrary cluster X
    const clusterX = consistentJunctionTree.getRandomCluster() as GraphEntity<
      IClique
    >;
    console.log("Chose arbitrary cluster", clusterX);
    // 2. Unmark all clusters. Call Collect-Evidence(X)
    consistentJunctionTree.unmarkAll();
    this.collectEvidence(consistentJunctionTree, clusterX);

    // 3. Unmark all clusters. Call Distrubite-Evidence(X).
    consistentJunctionTree.unmarkAll();
    this.distrubuteEvidence(consistentJunctionTree, clusterX);

    // Normalize results to fit

    this.normalize(consistentJunctionTree);

    console.log("consistentJTRee", consistentJunctionTree.toString());
    return consistentJunctionTree;
  }

  private passMessage(
    jTree: Forest<IClique | ISepSet>,
    clusterX: GraphEntity<IClique>,
    sepsetR: GraphEntity<ISepSet>,
    clusterY: GraphEntity<IClique>
  ): void {
    const sigmaX = clusterX.getEntity().potentials;
    const sigmaY = clusterY.getEntity().potentials;
    const sigmaR = sepsetR.getEntity().potentials;

    if (sigmaX === undefined || sigmaY === undefined || sigmaR === undefined) {
      throw new Error("Potentials Not assigned.");
    }

    let projPotential: IPotential[] = [];

    // Projection: Assign a new table to R saveing the old table.
    sigmaR.forEach(vX => {
      const entities = Object.keys(vX);

      let newPotential: number = 0;
      sigmaX.forEach((sigX, idx) => {
        let isIntersect = true;
        entities.forEach(entity => {
          if (!(entity in sigX.if)) {
            isIntersect = false;
          }
        });
        if (isIntersect) {
          newPotential += sigX.then;
        }
      });
      projPotential.push({ if: vX.if, then: newPotential });
    });

    jTree.addPotentials(sepsetR.getEntity(), projPotential);

    let absorbPotential: IPotential[] = [];

    //TODO Absorption. Assign a new table to Y, using both the old and the new tables of R.
    const sigR = sepsetR.getEntity().potentials;
    const oldsigR = sepsetR.getEntity().oldPotentials;
    const sigY = clusterY.getEntity().potentials;

    if (sigR === undefined || oldsigR === undefined || sigY === undefined) {
      throw new Error("Potentials Not assigned.");
    }

    let divRpotentials: IPotential[] = [];

    sigR.forEach((sR, idx) => {
      divRpotentials.push({
        if: sR.if,
        then: oldsigR[idx].then === 0 ? 0 : sR.then / oldsigR[idx].then
      });
    });

    sigY.forEach(sY => {
      //TODO absorbPotentials = SigY * Sig divRpotentials
      const entities = Object.keys(sY);

      let newPotential: number = sY.then;
      sigR.forEach(sR => {
        let isIntersect = true;
        entities.forEach(entity => {
          if (!(entity in sR.if)) {
            isIntersect = false;
          }
        });
        if (isIntersect) {
          newPotential *= sY.then;
        }
      });
      absorbPotential.push({ if: sY.if, then: newPotential });
    });

    jTree.addPotentials(clusterY.getEntity(), absorbPotential);
  }

  private collectEvidence(
    jTree: Forest<IClique | ISepSet>,
    clusterX: GraphEntity<IClique>
  ) {
    console.log("collectEvidence", clusterX);
    // Mark X
    jTree.markEntity(clusterX.getEntity());
    // Call collectEvidence recursively on X's unmarked neighboring clusters, if any
    const neighboringClusters = jTree.getNeighboringClusters(
      clusterX.getEntity()
    );

    neighboringClusters.forEach(({ neighborCluster, fromSepset }) => {
      if (!neighborCluster.getEntity().marked) {
        this.collectEvidence(jTree, neighborCluster as GraphEntity<IClique>);

        // Pass a message from X to the cluster which invoked collectEvidence
        this.passMessage(
          jTree,
          clusterX,
          fromSepset as GraphEntity<ISepSet>,
          neighborCluster as GraphEntity<IClique>
        );
      }
    });
  }
  private distrubuteEvidence(
    jTree: Forest<IClique | ISepSet>,
    clusterX: GraphEntity<IClique>
  ) {
    // Mark X
    jTree.markEntity(clusterX.getEntity());
    // Pass a message from X to each of its unmarked neighboring clusters, if any
    const neighboringClusters = jTree.getNeighboringClusters(
      clusterX.getEntity()
    );

    neighboringClusters.forEach(({ neighborCluster, fromSepset }) => {
      if (!neighborCluster.getEntity().marked) {
        // Pass a message from X to the cluster which invoked collectEvidence
        this.passMessage(
          jTree,
          clusterX,
          fromSepset as GraphEntity<ISepSet>,
          neighborCluster as GraphEntity<IClique>
        );

        // call distrubuteEvidence recursively on X's unmarked neighboring clusters, if any
        this.distrubuteEvidence(jTree, neighborCluster as GraphEntity<IClique>);
      }
    });
  }

  private normalize(jTree: Forest<IClique | ISepSet>): void {
    jTree.getValues().forEach(graphEntity => {
      let entity = graphEntity.getEntity();
      let newPotentials: IPotential[] = [];
      entity.potentials?.forEach(potential => {
        newPotentials.push({ if: potential.if, then: potential.then / 2 });
      });
      jTree.addPotentials(entity, newPotentials);
    });
  }

  public getConsistentJunctionTree(): Forest<IClique | ISepSet> {
    return this.consistentJunctionTree;
  }
}
