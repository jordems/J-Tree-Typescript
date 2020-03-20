import IEntity from "./types/IEntity";
import Dag from "./Dag";
import BayesianNetwork from "./BayesianNetwork";
import { CPTBuilder } from "./CPTBuilder";
import JunctionTree from "./JunctionTree";

// Create all Test Entities
let entityA: IEntity = { id: "A", states: ["low", "high"] };
let entityB: IEntity = { id: "B", states: ["low", "high"] };
let entityC: IEntity = { id: "C", states: ["low", "high"] };
let entityD: IEntity = { id: "D", states: ["low", "high"] };
let entityE: IEntity = { id: "E", states: ["low", "high"] };
let entityF: IEntity = { id: "F", states: ["low", "high"] };
let entityG: IEntity = { id: "G", states: ["low", "high"] };
let entityH: IEntity = { id: "H", states: ["low", "high"] };

// Set Entity Dependants
entityA.deps = [entityB, entityC];
entityB.deps = [entityD];
entityC.deps = [entityE, entityG];
entityD.deps = [entityF];
entityE.deps = [entityF, entityH];
entityG.deps = [entityH];

// Place Entities into entityMap
let entityMap: Map<string, IEntity> = new Map();
entityMap.set(entityA.id, entityA);
entityMap.set(entityB.id, entityB);
entityMap.set(entityC.id, entityC);
entityMap.set(entityD.id, entityD);
entityMap.set(entityE.id, entityE);
entityMap.set(entityF.id, entityF);
entityMap.set(entityG.id, entityG);
entityMap.set(entityH.id, entityH);

// Build Dag with Entity Relationships
const dag = new Dag(entityMap);

// Display Dag
console.log(dag.getMatrix());

const cptBuilder = new CPTBuilder();

cptBuilder.buildCPTsForMap(entityMap);

//console.log(entityMap.get("A")?.cpt);

const bnet = new BayesianNetwork(entityMap, dag);

const jtree = new JunctionTree(bnet);
