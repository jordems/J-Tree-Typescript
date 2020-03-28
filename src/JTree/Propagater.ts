import IEntity from "../types/IEntity";
import ISepSet from "../types/ISepSet";
import IClique from "../types/IClique";
import { Forest, TreeEntity } from "../Tree";
import IForestEntity from "../types/IForestEntity";
import IPotential from "../types/IPotential";

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
    // Global Propagation

    // 1. Choose an arbitrary cluster X
    const clusterX = inconsistentJunctionTree.getRandomCluster() as TreeEntity<
      IClique
    >;
    console.log("Chose arbitrary cluster", clusterX);
    // 2. Unmark all clusters. Call Collect-Evidence(X)
    inconsistentJunctionTree.unmarkAll();
    this.collectEvidence(inconsistentJunctionTree, clusterX);

    // 3. Unmark all clusters. Call Distrubite-Evidence(X).
    inconsistentJunctionTree.unmarkAll();
    this.distrubuteEvidence(inconsistentJunctionTree, clusterX);

    return inconsistentJunctionTree;
  }

  private passMessage(
    clusterX: TreeEntity<IClique>,
    sepsetR: TreeEntity<ISepSet>,
    clusterY: TreeEntity<IClique>
  ): void {
    const sigmaX = clusterX.getPotentials();
    const sigmaY = clusterY.getPotentials();
    const sigmaR = sepsetR.getPotentials();

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

    sepsetR.setPotentials(projPotential);

    let absorbPotential: IPotential[] = [];

    //TODO Absorption. Assign a new table to Y, using both the old and the new tables of R.
    const sigR = sepsetR.getPotentials();
    const oldsigR = sepsetR.getOldPotentials();
    const sigY = clusterY.getPotentials();

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
    });

    clusterY.setPotentials(absorbPotential);
  }

  private collectEvidence(
    jTree: Forest<IClique | ISepSet>,
    clusterX: TreeEntity<IClique>
  ) {
    console.log("collectEvidence", clusterX);
    // Mark X
    clusterX.mark();
    // Call collectEvidence recursively on X's unmarked neighboring clusters, if any
    const neighboringClusters = jTree.getNeighboringClusters(
      clusterX.getEntity()
    );

    neighboringClusters.forEach(({ neighborCluster, fromSepset }) => {
      if (!neighborCluster.getEntity().marked) {
        this.collectEvidence(jTree, neighborCluster as TreeEntity<IClique>);

        // Pass a message from X to the cluster which invoked collectEvidence
        this.passMessage(
          clusterX,
          fromSepset as TreeEntity<ISepSet>,
          neighborCluster as TreeEntity<IClique>
        );
      }
    });
  }
  private distrubuteEvidence(
    jTree: Forest<IClique | ISepSet>,
    clusterX: TreeEntity<IClique>
  ) {
    // Mark X
    clusterX.mark();
    // Pass a message from X to each of its unmarked neighboring clusters, if any
    const neighboringClusters = jTree.getNeighboringClusters(
      clusterX.getEntity()
    );

    neighboringClusters.forEach(({ neighborCluster, fromSepset }) => {
      if (!neighborCluster.getEntity().marked) {
        // Pass a message from X to the cluster which invoked collectEvidence
        this.passMessage(
          clusterX,
          fromSepset as TreeEntity<ISepSet>,
          neighborCluster as TreeEntity<IClique>
        );

        // call distrubuteEvidence recursively on X's unmarked neighboring clusters, if any
        this.distrubuteEvidence(jTree, neighborCluster as TreeEntity<IClique>);
      }
    });
  }

  public getConsistentJunctionTree(): Forest<IClique | ISepSet> {
    return this.consistentJunctionTree;
  }
}
