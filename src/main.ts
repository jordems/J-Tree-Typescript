import IEntity from "./IEntity";
import Dag from "./Dag";
import BayesianNetwork from "./BayesianNetwork";
import { CPTBuilder } from "./CPTBuilder";

// Create all Test Entities
let entityA: IEntity = { name: "A", states: ["low", "high"] };
let entityB: IEntity = { name: "B", states: ["low", "high"] };
let entityC: IEntity = { name: "C", states: ["low", "high"] };
let entityD: IEntity = { name: "D", states: ["low", "high"] };
let entityE: IEntity = { name: "E", states: ["low", "high"] };

// Set Entity Dependants
entityA.deps = [entityB, entityC];
entityB.deps = [entityD];
entityC.deps = [entityD];
entityD.deps = [entityE];

// Place Entities into entityMap
let entityMap: Map<string, IEntity> = new Map();
entityMap.set(entityA.name, entityA);
entityMap.set(entityB.name, entityB);
entityMap.set(entityC.name, entityC);
entityMap.set(entityD.name, entityD);
entityMap.set(entityE.name, entityE);

// Build Dag with Entity Relationships
const dag = new Dag(entityMap);

// Display Dag
console.log(dag.getMatrix());

const cptBuilder = new CPTBuilder();

cptBuilder.buildCPTsForMap(entityMap);

console.log(entityMap);

const bnet = new BayesianNetwork(entityMap, dag);
