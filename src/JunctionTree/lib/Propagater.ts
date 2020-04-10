import { IEntity, ISepSet, IClique, IPotential } from "../../types";
import Forest from "../../GraphicalStructures/Forest";
import GraphEntity from "../../GraphicalStructures/lib/GraphEntity";

export default class Propagater {
  private consistentJunctionTree: Forest<IClique | ISepSet>;
  constructor(inconsistentJunctionTree: Forest<IClique | ISepSet>) {
    console.log("\n----Started Propagation----\n");
    this.consistentJunctionTree = this.propagate(inconsistentJunctionTree);
    console.log("\n----Finished Propagation----\n");
  }

  private propagate(
    inconsistentJunctionTree: Forest<IClique | ISepSet>
  ): Forest<IClique | ISepSet> {
    // Global Propagation

    // 1. Choose an arbitrary cluster X
    let clusterX = inconsistentJunctionTree.getRandomCluster() as GraphEntity<
      IClique
    >;
    console.log("Chose arbitrary cluster: ", clusterX.getEntity().id);
    // 2. Unmark all clusters. Call Collect-Evidence(X)
    inconsistentJunctionTree.unmarkAll();
    this.collectEvidence(clusterX, inconsistentJunctionTree);

    // 3. Unmark all clusters. Call Distrubite-Evidence(X).
    inconsistentJunctionTree.unmarkAll();
    this.distrubuteEvidence(clusterX, inconsistentJunctionTree);

    // Normalize results to fit with sum probability of 1

    this.normalize(inconsistentJunctionTree);

    //console.log("consistentJTRee", inconsistentJunctionTree.toString());

    return inconsistentJunctionTree;
  }

  private passMessage(
    clusterX: GraphEntity<IClique>,
    sepsetR: GraphEntity<ISepSet>,
    clusterY: GraphEntity<IClique>,
    inconsistentJunctionTree: Forest<IClique | ISepSet>
  ): void {
    console.log(
      `Passing Message: ${clusterX.getEntity().id} - [${
        sepsetR.getEntity().intersectingentityIDs
      }] - ${clusterY.getEntity().id}`
    );
    const sigmaX = clusterX.getEntity().potentials;
    const sigmaY = clusterY.getEntity().potentials;
    const sigmaR = sepsetR.getEntity().potentials;

    if (sigmaX === undefined || sigmaY === undefined || sigmaR === undefined) {
      throw new Error("Potentials Not assigned.");
    }

    let projPotential: IPotential[] = [];

    // Projection: Assign a new table to R saveing the old table.
    for (const vX of sigmaR) {
      const entities = Object.keys(vX.if);

      let newPotential: number = 0;
      for (const sigX of sigmaX) {
        let isIntersect = true;
        for (const entity of entities) {
          if (!(entity in sigX.if) || !(sigX.if[entity] === vX.if[entity])) {
            isIntersect = false;
          }
        }
        if (isIntersect) {
          newPotential += sigX.then;
        }
      }
      projPotential.push({ if: vX.if, then: newPotential });
    }

    inconsistentJunctionTree.addPotentials(sepsetR.getEntity(), projPotential);

    let absorbPotential: IPotential[] = [];

    // Absorption. Assign a new table to Y, using both the old and the new tables of R.
    const sigR = sepsetR.getEntity().potentials;
    const oldsigR = sepsetR.getEntity().oldPotentials;
    const sigY = clusterY.getEntity().potentials;

    //console.log("Pass: sigR", sigR, "oldSigR", oldsigR, "sigY", sigY);

    if (sigR === undefined || oldsigR === undefined || sigY === undefined) {
      throw new Error("Potentials Not assigned.");
    }

    let divRpotentials: IPotential[] = [];

    sigR.forEach((sR, idx) => {
      divRpotentials.push({
        if: sR.if,
        then: oldsigR[idx].then === 0 ? 0 : sR.then / oldsigR[idx].then,
      });
    });

    sigY.forEach((sY) => {
      //absorbPotentials = SigY * Sig divRpotentials
      const entities = Object.keys(sY.if);

      let newPotential: number = sY.then;
      sigR.forEach((sR) => {
        let isIntersect = true;
        entities.forEach((entity) => {
          if (!(entity in sR.if) || !(sY.if[entity] === sR.if[entity])) {
            isIntersect = false;
          }
        });
        if (isIntersect) {
          newPotential *= sY.then;
        }
      });
      absorbPotential.push({ if: sY.if, then: newPotential });
    });

    inconsistentJunctionTree.addPotentials(
      clusterY.getEntity(),
      absorbPotential
    );
  }

  private collectEvidence(
    clusterX: GraphEntity<IClique>,
    inconsistentJunctionTree: Forest<IClique | ISepSet>
  ) {
    console.log("collectEvidence:", clusterX.getEntity().id);
    // Mark X
    inconsistentJunctionTree.markEntity(clusterX.getEntity());
    // Call collectEvidence recursively on X's unmarked neighboring clusters, if any
    const neighboringClusters = inconsistentJunctionTree.getNeighboringClusters(
      clusterX.getEntity()
    );

    for (const { neighborCluster, fromSepset } of neighboringClusters) {
      if (!neighborCluster.getEntity().marked) {
        this.collectEvidence(
          neighborCluster as GraphEntity<IClique>,
          inconsistentJunctionTree
        );

        // Pass a message from X to the cluster which invoked collectEvidence
        this.passMessage(
          clusterX,
          fromSepset as GraphEntity<ISepSet>,
          neighborCluster as GraphEntity<IClique>,
          inconsistentJunctionTree
        );
      }
    }
  }
  private distrubuteEvidence(
    clusterX: GraphEntity<IClique>,
    inconsistentJunctionTree: Forest<IClique | ISepSet>
  ) {
    console.log("distrubute Evidence:", clusterX.getEntity().id);
    // Mark X
    inconsistentJunctionTree.markEntity(clusterX.getEntity());
    // Pass a message from X to each of its unmarked neighboring clusters, if any
    const neighboringClusters = inconsistentJunctionTree.getNeighboringClusters(
      clusterX.getEntity()
    );

    neighboringClusters.forEach(({ neighborCluster, fromSepset }) => {
      if (!neighborCluster.getEntity().marked) {
        // Pass a message from X to the cluster which invoked collectEvidence
        this.passMessage(
          clusterX,
          fromSepset as GraphEntity<ISepSet>,
          neighborCluster as GraphEntity<IClique>,
          inconsistentJunctionTree
        );

        // call distrubuteEvidence recursively on X's unmarked neighboring clusters, if any
        this.distrubuteEvidence(
          neighborCluster as GraphEntity<IClique>,
          inconsistentJunctionTree
        );
      }
    });
  }

  private normalize(jTree: Forest<IClique | ISepSet>): void {
    jTree.getValues().forEach((graphEntity) => {
      let entity = graphEntity.getEntity();
      let newPotentials: IPotential[] = [];
      let sumPotential = 0;
      entity.potentials?.forEach((potential) => {
        sumPotential += potential.then;
      });
      entity.potentials?.forEach((potential) => {
        newPotentials.push({
          if: potential.if,
          then: potential.then / sumPotential,
        });
      });
      jTree.addPotentials(entity, newPotentials);
    });
  }

  public getConsistentJunctionTree(): Forest<IClique | ISepSet> {
    return this.consistentJunctionTree;
  }
}
