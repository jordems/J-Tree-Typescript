import EntityDependant from "./EntityDependant";

export default class Dag {
  private matrix: number[][];
  private entityLabelPairs: { [entity: string]: number };
  private numPairs = 0;
  /**
   *
   * @param entityRelationships Contains all entity relationships to build DAG
   *
   * @example
   * const entityRelationships = [{'a': ['b', 'c']},{'b':['d']}, {'c':['d']}, {'d': ['e']}];
   * const dag = new Dag(entityRelationships);
   */
  constructor(entityRelationships: EntityDependant[]) {
    this.entityLabelPairs = this.assignLabels(entityRelationships);
    this.matrix = this.buildMatrix(entityRelationships);
  }

  private assignLabels(
    entityRelationships: EntityDependant[]
  ): { [entity: string]: number } {
    // Find all seperate Entities and assign a number
    let idxCount = 0;
    let entityLabelPairs: { [entity: string]: number } = {};

    entityRelationships.forEach(entRel => {
      const entity = entRel.getEntity();
      const dependants = entRel.getDependants();

      if (!(entity in entityLabelPairs)) {
        entityLabelPairs[entity] = idxCount;
        idxCount++;
      }

      dependants.forEach(dep => {
        if (!(dep in entityLabelPairs)) {
          entityLabelPairs[dep] = idxCount;
          idxCount++;
        }
      });
    });
    this.numPairs = idxCount;
    return entityLabelPairs;
  }

  private buildMatrix(entityRelationships: EntityDependant[]): number[][] {
    let matrix: number[][] = Array(this.numPairs)
      .fill(0)
      .map(() => Array(this.numPairs).fill(0));

    entityRelationships.forEach(entRel => {
      const entityidx = this.entityLabelPairs[entRel.getEntity()];
      const dependants = entRel.getDependants();

      dependants.forEach(dep => {
        const depidx = this.entityLabelPairs[dep];
        matrix[entityidx][depidx] = 1;
      });
    });

    return matrix;
  }

  public getMatrix() {
    return this.matrix;
  }
}
