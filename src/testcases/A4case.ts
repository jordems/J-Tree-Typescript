import { IEntity } from "../types";
import DagBuilder from "../BayesianNetwork/lib/DagBuilder";
import BayesianNetwork from "../BayesianNetwork/BayesianNetwork";
import JunctionTree from "../jtree/JunctionTree";
import Marginalizer from "../Marginalizer/Marginalizer";

// Create all Test Entities
let Difficulty: IEntity = { id: "Difficulty", states: ["easy", "hard"] };
let Accuracy: IEntity = { id: "Accuracy", states: ["wrong", "right"] };
let TaskTime: IEntity = { id: "TaskTime", states: ["slow", "fast"] };
let NeedHelp: IEntity = { id: "NeedHelp", states: ["false", "true"] };
let DisplayTime: IEntity = {
  id: "DisplayTime",
  states: ["short", "average", "long"],
};

// Set Entity Dependants
Difficulty.deps = [Accuracy, TaskTime];
Accuracy.deps = [NeedHelp];
TaskTime.deps = [NeedHelp];
NeedHelp.deps = [DisplayTime];

// Set Entity CPT's
Difficulty.cpt = [{ if: {}, then: { easy: 0.5, hard: 0.5 } }];
Accuracy.cpt = [
  { if: { Difficulty: "easy" }, then: { wrong: 0.04, right: 0.96 } },
  { if: { Difficulty: "hard" }, then: { wrong: 0.11, right: 0.89 } },
];
TaskTime.cpt = [
  { if: { Difficulty: "easy" }, then: { slow: 0.37, fast: 0.63 } },
  { if: { Difficulty: "hard" }, then: { slow: 0.4, fast: 0.6 } },
];
NeedHelp.cpt = [
  {
    if: { Accuracy: "wrong", TaskTime: "slow" },
    then: { false: 0.2, true: 0.8 },
  },
  {
    if: { Accuracy: "wrong", TaskTime: "fast" },
    then: { false: 0.4, true: 0.6 },
  },
  {
    if: { Accuracy: "right", TaskTime: "slow" },
    then: { false: 0.7, true: 0.3 },
  },
  {
    if: { Accuracy: "right", TaskTime: "fast" },
    then: { false: 0.05, true: 0.95 },
  },
];
DisplayTime.cpt = [
  {
    if: { NeedHelp: "false" },
    then: { short: 0.75, average: 0.2, long: 0.05 },
  },
  { if: { NeedHelp: "true" }, then: { short: 0.2, average: 0.5, long: 3 } },
];

// Place Entities into entityMap
let entityMap: Map<string, IEntity> = new Map();
entityMap.set(Difficulty.id, Difficulty);
entityMap.set(Accuracy.id, Accuracy);
entityMap.set(TaskTime.id, TaskTime);
entityMap.set(NeedHelp.id, NeedHelp);
entityMap.set(DisplayTime.id, DisplayTime);

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
