import IEntity from "./IEntity";
import EntityDependant from "./EntityDependant";
import Dag from "./Dag";
import BayesianNetwork from "./BayesianNetwork";
import { CPTBuilder } from "./CPTBuilder";

// Create all Test Entities
const entityA: IEntity = { name: "A", states: ["low", "high"] };
const entityB: IEntity = { name: "B", states: ["low", "high"] };
const entityC: IEntity = { name: "C", states: ["low", "high"] };
const entityD: IEntity = { name: "D", states: ["low", "high"] };
const entityE: IEntity = { name: "E", states: ["low", "high"] };

// Place Entities into entityMap
let entityMap: Map<string, IEntity> = new Map();
entityMap.set(entityA.name, entityA);
entityMap.set(entityB.name, entityB);
entityMap.set(entityC.name, entityC);
entityMap.set(entityD.name, entityD);
entityMap.set(entityE.name, entityE);

// Setup Entity Dependants for Dag
const entityRelationships = [
  new EntityDependant(entityA, [entityB, entityC]),
  new EntityDependant(entityB, entityD),
  new EntityDependant(entityC, entityD),
  new EntityDependant(entityD, entityE)
];

// Build Dag with Entity Relationships
const dag = new Dag(entityRelationships);

// Display Dag
console.log(dag.getMatrix());

const cptBuilder = new CPTBuilder();

cptBuilder.buildCPTsForMap(entityMap, entityRelationships);

entityMap.forEach(entity => {
  console.log(JSON.stringify(entity, null, "  "));
});

//const bnet = new BayesianNetwork(dag);
