import IEntity from "./IEntity";

export default class Dag {
  private matrix: number[][];
  private idxLabels: { [entityname: string]: number };

  /**
   *
   */
  constructor(entityMap: Map<string, IEntity>) {
    this.idxLabels = this.generateIdxes(entityMap);
    this.matrix = this.buildMatrix(entityMap);
  }

  private generateIdxes(
    entityMap: Map<string, IEntity>
  ): { [entityname: string]: number } {
    let idxLabels: { [entityname: string]: number } = {};
    let idxCount = 0;
    entityMap.forEach((_entity, key) => {
      idxLabels[key] = idxCount;
      idxCount++;
    });
    return idxLabels;
  }

  private buildMatrix(entityMap: Map<string, IEntity>): number[][] {
    let matrix: number[][] = new Array(entityMap.size)
      .fill(0)
      .map(() => new Array(entityMap.size).fill(0));
    entityMap.forEach(entity => {
      const entityidx = this.idxLabels[entity.name];

      if (entity.deps) {
        entity.deps.forEach(dep => {
          const depidx = this.idxLabels[dep.name];
          matrix[entityidx][depidx] = 1;
        });
      } else {
      }
    });

    return matrix;
  }

  public getMatrix(): number[][] {
    return this.matrix;
  }

  public getLabels(): { [entityname: string]: number } {
    return this.idxLabels;
  }
}
