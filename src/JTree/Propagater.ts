import IEntity from "../types/IEntity";
import ISepSet from "../types/ISepSet";
import IClique from "../types/IClique";
import { Forest } from "../Tree";

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
    //Single Message PASS
    // Projection. Assign a new table to R, saving the old table
    // Absorption. Assign a new table to Y, using both the old and new tables of R
    //Coordinating Multi Messages
    // Global Propagation
    // 1. Choose an arbitrary cluster X
    // 2. Unmark all clusters. Call Collect-Evidence(X)
    // 3. Unmark all clusters. Call Distrubite-Evidence(X).
    // Where
    // Collect-Evidence(X):
    // 1. Mark X
    // 2. Call Collect-Evidence recursively on X's unmarked neighboring clusters, if any
    // 3. Pass a message from X to the cluster which invoked Collect-Evidence(X)
    // Distrubite-Evidence(X):
    // 1. Mark X
    // 2. Pass a message from X to each of its unmarked neighboring clusters, if any
    // 3. Call Distrubite-Evidence recursively on X's unmarked neighboring clusters, if any
    // returns consistent Join Tree
    return inconsistentJunctionTree;
  }

  public getConsistentJunctionTree(): Forest<IClique | ISepSet> {
    return this.consistentJunctionTree;
  }
}
