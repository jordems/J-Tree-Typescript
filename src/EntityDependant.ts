export default class EntityDependant {
  private entity: string;
  private dependants: Array<string>;

  constructor(entity: string, dependants: Array<string>) {
    this.entity = entity;
    this.dependants = dependants;
  }

  public getEntity(): string {
    return this.entity;
  }

  public getDependants(): Array<string> {
    return this.dependants;
  }
}
