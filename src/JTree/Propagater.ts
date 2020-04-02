import { IEntity, ISepSet, IClique, IPotential } from "../types";
import Forest from "../graphstructures/Forest";
import GraphEntity from "../graphstructures/GraphEntity";

export default class Propagater {
  private entityMap: Map<string, IEntity>;
  private inconsistentJunctionTree: Forest<IClique | ISepSet>;
  private consistentJunctionTree: Forest<IClique | ISepSet>;
  constructor(
    inconsistentJunctionTree: Forest<IClique | ISepSet>,
    entityMap: Map<string, IEntity>
  ) {
    this.entityMap = entityMap;
    this.inconsistentJunctionTree = inconsistentJunctionTree;
    this.consistentJunctionTree = this.propagate();
  }

  private propagate(): Forest<IClique | ISepSet> {
    // Global Propagation

    // 1. Choose an arbitrary cluster X
    let clusterX = this.inconsistentJunctionTree.getRandomCluster() as GraphEntity<
      IClique
    >;
    console.log("Chose arbitrary cluster", clusterX);
    // 2. Unmark all clusters. Call Collect-Evidence(X)
    this.inconsistentJunctionTree.unmarkAll();
    this.collectEvidence(clusterX);

    // 3. Unmark all clusters. Call Distrubite-Evidence(X).
    this.inconsistentJunctionTree.unmarkAll();
    this.distrubuteEvidence(clusterX);

    // Normalize results to fit with sum probability of 1

    //this.normalize(this.inconsistentJunctionTree);

    //console.log("consistentJTRee", inconsistentJunctionTree.toString());

    return this.inconsistentJunctionTree;
  }

  private passMessage(
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

    this.inconsistentJunctionTree.addPotentials(
      sepsetR.getEntity(),
      projPotential
    );

    let absorbPotential: IPotential[] = [];

    // Absorption. Assign a new table to Y, using both the old and the new tables of R.
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
      //absorbPotentials = SigY * Sig divRpotentials
      const entities = Object.keys(sY.if);

      let newPotential: number = sY.then;
      sigR.forEach(sR => {
        let isIntersect = true;
        entities.forEach(entity => {
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

    this.inconsistentJunctionTree.addPotentials(
      clusterY.getEntity(),
      absorbPotential
    );
  }

  private collectEvidence(clusterX: GraphEntity<IClique>) {
    console.log("collectEvidence", clusterX);
    // Mark X
    this.inconsistentJunctionTree.markEntity(clusterX.getEntity());
    // Call collectEvidence recursively on X's unmarked neighboring clusters, if any
    const neighboringClusters = this.inconsistentJunctionTree.getNeighboringClusters(
      clusterX.getEntity()
    );

    for (const { neighborCluster, fromSepset } of neighboringClusters) {
      if (!neighborCluster.getEntity().marked) {
        this.collectEvidence(neighborCluster as GraphEntity<IClique>);

        // Pass a message from X to the cluster which invoked collectEvidence
        this.passMessage(
          clusterX,
          fromSepset as GraphEntity<ISepSet>,
          neighborCluster as GraphEntity<IClique>
        );
      }
    }
  }
  private distrubuteEvidence(clusterX: GraphEntity<IClique>) {
    // Mark X
    this.inconsistentJunctionTree.markEntity(clusterX.getEntity());
    // Pass a message from X to each of its unmarked neighboring clusters, if any
    const neighboringClusters = this.inconsistentJunctionTree.getNeighboringClusters(
      clusterX.getEntity()
    );

    neighboringClusters.forEach(({ neighborCluster, fromSepset }) => {
      if (!neighborCluster.getEntity().marked) {
        // Pass a message from X to the cluster which invoked collectEvidence
        this.passMessage(
          clusterX,
          fromSepset as GraphEntity<ISepSet>,
          neighborCluster as GraphEntity<IClique>
        );

        // call distrubuteEvidence recursively on X's unmarked neighboring clusters, if any
        this.distrubuteEvidence(neighborCluster as GraphEntity<IClique>);
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
