import IEntity from "./IEntity";
import Dag from "./Dag";
import BayesianNetwork from "./BayesianNetwork";
import { CPTBuilder } from "./CPTBuilder";
import JunctionTree from "./JunctionTree";

// Create all Test Entities
let entityA: IEntity = { name: "A", states: ["low", "high"] };
let entityB: IEntity = { name: "B", states: ["low", "high"] };
let entityC: IEntity = { name: "C", states: ["low", "high"] };
let entityD: IEntity = { name: "D", states: ["low", "high"] };
let entityE: IEntity = { name: "E", states: ["low", "high"] };
let entityF: IEntity = { name: "F", states: ["low", "high"] };
let entityG: IEntity = { name: "G", states: ["low", "high"] };
let entityH: IEntity = { name: "H", states: ["low", "high"] };

// Set Entity Dependants
entityA.deps = [entityB, entityC];
entityB.deps = [entityD];
entityC.deps = [entityE, entityG];
entityD.deps = [entityF];
entityE.deps = [entityF, entityH];
entityG.deps = [entityH];

// Place Entities into entityMap
let entityMap: Map<string, IEntity> = new Map();
entityMap.set(entityA.name, entityA);
entityMap.set(entityB.name, entityB);
entityMap.set(entityC.name, entityC);
entityMap.set(entityD.name, entityD);
entityMap.set(entityE.name, entityE);
entityMap.set(entityF.name, entityF);
entityMap.set(entityG.name, entityG);
entityMap.set(entityH.name, entityH);

// Build Dag with Entity Relationships
const dag = new Dag(entityMap);

// Display Dag
console.log(dag.getMatrix());

const cptBuilder = new CPTBuilder();

cptBuilder.buildCPTsForMap(entityMap);

//console.log(entityMap.get("A")?.cpt);

const bnet = new BayesianNetwork(entityMap, dag);

const jtree = new JunctionTree(bnet);
