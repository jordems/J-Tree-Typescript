import { IEntity } from "../types";
import DagBuilder from "../BayesianNetwork/lib/DagBuilder";
import BayesianNetwork from "../BayesianNetwork/BayesianNetwork";
import JunctionTree from "../JunctionTree/JunctionTree";
import Marginalizer from "../Marginalizer/Marginalizer";

// Create all Entities
let B: IEntity = { id: "B", states: ["false", "true"] };
let S: IEntity = { id: "S", states: ["false", "true"] };
let C: IEntity = { id: "C", states: ["false", "true"] };

// Set Entity Dependants
B.deps = [C];
S.deps = [C];

// Set Entity CPT's
B.cpt = [{ if: {}, then: { false: 0.5, true: 0.5 } }];
S.cpt = [{ if: {}, then: { false: 0.5, true: 0.5 } }];
C.cpt = [
  { if: { B: "false", S: "false" }, then: { false: 1, true: 0 } },
  { if: { B: "true", S: "false" }, then: { false: 0, true: 1 } },
  { if: { B: "false", S: "true" }, then: { false: 0, true: 1 } },
  { if: { B: "true", S: "true" }, then: { false: 0, true: 1 } },
];

// Place Entities into entityMap
let entityMap: Map<string, IEntity> = new Map();
entityMap.set(B.id, B);
entityMap.set(S.id, S);
entityMap.set(C.id, C);

// Build Dag with Entity Relationships
const dagBuilder = new DagBuilder();

const dag = dagBuilder.buildDag(entityMap);

// Display Dag
console.log("\n\n----Directed Acyclic Graph----\n");
dag.displayMatrix();

const bnet = new BayesianNetwork(entityMap, dag);

const jtree = new JunctionTree(bnet);

const marginalizer = new Marginalizer(jtree);

console.log("\n\n----Started Marginalization----\n");
// Marginalize Each Entity to see marginalized values
entityMap.forEach((entity, id) => {
  console.log(`${id}:`, marginalizer.marginalize(entity));
});
console.log("\n----Finished Marginalization----\n");
