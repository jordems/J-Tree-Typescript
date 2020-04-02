import { IEntity } from "./types";
import DagBuilder from "./DagBuilder";
import BayesianNetwork from "./BayesianNetwork";
import { CPTBuilder } from "./CPTBuilder";
import JunctionTree from "./jtree/JunctionTree";

// Create all Test Entities
let entityA: IEntity = { id: "A", states: ["on", "off"] };
let entityB: IEntity = { id: "B", states: ["on", "off"] };
let entityC: IEntity = { id: "C", states: ["on", "off"] };
let entityD: IEntity = { id: "D", states: ["on", "off"] };
let entityE: IEntity = { id: "E", states: ["on", "off"] };
let entityF: IEntity = { id: "F", states: ["on", "off"] };
let entityG: IEntity = { id: "G", states: ["on", "off"] };
let entityH: IEntity = { id: "H", states: ["on", "off"] };

// Set Entity Dependants
entityA.deps = [entityB, entityC];
entityB.deps = [entityD];
entityC.deps = [entityE, entityG];
entityD.deps = [entityF];
entityE.deps = [entityF, entityH];
entityG.deps = [entityH];

// Set Entity CPT's
entityA.cpt = [{ if: {}, then: { on: 0.5, off: 0.5 } }];
entityB.cpt = [
  { if: { A: "on" }, then: { on: 0.5, off: 0.5 } },
  { if: { A: "off" }, then: { on: 0.4, off: 0.6 } }
];
entityC.cpt = [
  { if: { A: "on" }, then: { on: 0.7, off: 0.3 } },
  { if: { A: "off" }, then: { on: 0.2, off: 0.8 } }
];
entityD.cpt = [
  { if: { B: "on" }, then: { on: 0.9, off: 0.1 } },
  { if: { B: "off" }, then: { on: 0.5, off: 0.5 } }
];
entityE.cpt = [
  { if: { C: "on" }, then: { on: 0.3, off: 0.7 } },
  { if: { C: "off" }, then: { on: 0.6, off: 0.4 } }
];
entityF.cpt = [
  { if: { D: "on", E: "on" }, then: { on: 0.01, off: 0.99 } },
  { if: { D: "on", E: "off" }, then: { on: 0.01, off: 0.99 } },
  { if: { D: "off", E: "on" }, then: { on: 0.01, off: 0.99 } },
  { if: { D: "off", E: "off" }, then: { on: 0.99, off: 0.01 } }
];
entityG.cpt = [
  { if: { C: "on" }, then: { on: 0.8, off: 0.2 } },
  { if: { C: "off" }, then: { on: 0.1, off: 0.9 } }
];
entityH.cpt = [
  { if: { G: "on", H: "on" }, then: { on: 0.05, off: 0.95 } },
  { if: { G: "on", H: "off" }, then: { on: 0.95, off: 0.05 } },
  { if: { G: "off", H: "on" }, then: { on: 0.95, off: 0.05 } },
  { if: { G: "off", H: "off" }, then: { on: 0.95, off: 0.05 } }
];

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
const dagBuilder = new DagBuilder();

const dag = dagBuilder.buildDag(entityMap);

// Display Dag
dag.displayMatrix();

// IF CPT's Arn't given, this function will create Required CPT's that need to be filled (inital values sum to 1: ex: low, med, high = .3 .3 .3)
//const cptBuilder = new CPTBuilder();
//cptBuilder.buildCPTsForMap(entityMap);

const bnet = new BayesianNetwork(entityMap, dag);

const jtree = new JunctionTree(bnet);

jtree.marginalize(entityA);
jtree.marginalize(entityB);
jtree.marginalize(entityC);
jtree.marginalize(entityD);
jtree.marginalize(entityE);
jtree.marginalize(entityF);
jtree.marginalize(entityG);
jtree.marginalize(entityH);
