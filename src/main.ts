import EntityDependant from "./EntityDependant";
import Dag from "./Dag";

const entityRelationships = [
  new EntityDependant("a", ["b", "c"]),
  new EntityDependant("b", ["d"]),
  new EntityDependant("c", ["d"]),
  new EntityDependant("d", ["e"])
];
const dag = new Dag(entityRelationships);

console.log(dag.getMatrix());
