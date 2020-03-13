import IEntity from "./IEntity";

export default class EntityDependant {
  private entity: IEntity;
  private dependants: Array<IEntity>;

  constructor(entity: IEntity, dependants: Array<IEntity> | IEntity) {
    this.entity = entity;

    // Allow passing single dependant
    if (Array.isArray(dependants)) {
      this.dependants = dependants;
    } else {
      this.dependants = [dependants];
    }
  }

  public getEntity(): IEntity {
    return this.entity;
  }

  public getDependants(): Array<IEntity> {
    return this.dependants;
  }
}
