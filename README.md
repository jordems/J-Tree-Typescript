## Junction Tree Inference Algorithm

### COSC 419C Project

##### By Jordan Emslie | 20600152

[Video Running Through Test Cases](https://drive.google.com/file/d/1n_4oQqi2IWnhxmfSb_UwsssbGQ0--9HJ/view?usp=sharing)

### Installation/Run Process

_NOTE: All testcases have cmd logs in [src/testcases/testcaseoutputs](src/testcases/testcaseoutputs)_

_Requires node at least v12.10.0 [NODEJS](https://nodejs.org/en/)_

```js
// In base Directory
// Install Packages from npm
$ npm i

// Install Typescript (if not already installed)
$ npm install -g typescript

// Each Test Case
$ npm run simplecase
$ npm run A4case
$ npm run Huangcase
```

### Introduction

In this document I will display a basic overview of my Junction Tree Inference Algorithm. To keep the understanding fairly simple, I'm not showing the low-level function code. If you wish to find it, I do link the files in each step.

### Step by Step Description

_Throughout the step by step guide we are following the [src/testcases/simplecase.ts](src/testcases/simplecase.ts) test case_

1.  **Creating Entities, Dependencies, and CPTs**
    I Attempt to make this as understandable as possible. Although I was required to add an entityMap that would require me to have access to all entities by ID at once.

    [src/testcases/simplecase.ts](src/testcases/simplecase.ts)

    ```ts
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
    ```

2.  **Building the DAG**
    For Building the DAG, I use the DagBuilder to place all the entities from the entityMap into a DirectedGraph, and also add the edges from the dependancies.

    [src/testcases/simplecase.ts](src/testcases/simplecase.ts)

    ```ts
    // Build Dag with Entity Relationships
    const dagBuilder = new DagBuilder();

    const dag = dagBuilder.buildDag(entityMap);

    // Display Dag
    console.log("\n\n----Directed Acyclic Graph----\n");
    dag.displayMatrix();
    ```

    _Results_

    ```
    ----Directed Acyclic Graph----

    Displaying Graph Matrix
      B S C
    B 0 0 1
    S 0 0 1
    C 0 0 0
    ```

3.  **Building the Bayes Net**
    My implementation involves just storing the entitiyMap and Dag into the BayesianNetwork, The Graphical Transformation is done in the JunctionTree

    [src/testcases/simplecase.ts](src/testcases/simplecase.ts)

    ```ts
    const bnet = new BayesianNetwork(entityMap, dag);
    ```

4.  **Building the Junction Tree**
    Construct the Junction tree with the Bayes Net (More Detail in sub-steps Below)

    [src/testcases/simplecase.ts](src/testcases/simplecase.ts)
    [src/JunctionTree/JunctionTree.ts](src/JunctionTree/JunctionTree.ts)

    ```ts
    //`simplecase.ts`
    const jtree = new JunctionTree(bnet);

    //`JunctionTree.ts`
     constructor(bnet: BayesianNetwork) {
         this.entityMap = bnet.getEntityMap();

         // Graphical Transformation of bayesnet into Optimized Junction Tree
         const optimizedJunctionTree = this.transform(bnet);

         // Initialization to create an Inconsistent Junction Tree
         const inconsistentJunctionTree = this.initialize(optimizedJunctionTree);

         // Propagation to create a Consistent Junction Tree
         this.consistentJunctionTree = this.propogate(inconsistentJunctionTree);
     }
    ```

    i. **Graphical Transformation**
    Within the Graphical Transformation Step, our goal is to create the Optimized Junction Tree, however todo so we must first generate a moral graph with the bayes net's DAG, build the triangulated graph to find the induced clusters and cliques. Finally, with the cliques we can build the Optimized Junction Tree.

    [src/JunctionTree/lib/GraphicalTransformer.ts](src/JunctionTree/lib/GraphicalTransformer.ts)

    ```ts
    const moralGraph = this.buildMoralGraph(bnet);

    console.log("\n\n--Starting Graphical Triangulation--\n");
    const cliques = this.buildTriangulatedGraph(moralGraph);
    console.log("\n--Finished Graphical Triangulation--\n");

    console.log("\n\n--Starting J Tree Optimization--\n");
    this.optimizedJunctionTree = this.buildOptimizedJunctionTree(bnet, cliques);

    console.log(this.optimizedJunctionTree.toString());
    console.log("\n--Finished J Tree Optimization--\n");
    ```

    _Graphical Transformation Results_

    ```
    ----Moral Graph----

    Displaying Graph Matrix
      B S C
    B 0 1 1
    S 1 0 1
    C 1 1 0

    --Starting Graphical Triangulation--

    Triangulation Removeing idx S
    Triangulation Removeing idx C
    Triangulation Removeing idx B

    --Triangulated Graph--
    Displaying Graph Matrix
      B S C
    B 0 1 1
    S 1 0 1
    C 1 1 0

    Found InducedClusters:
    Cluster[S,C,B]
    Cluster[C,B]
    Cluster[B]

    Found Cliques:
    Cluster[S,C,B]

    --Finished Graphical Triangulation--

    --Starting J Tree Optimization--

    --Forest Printout--
    Cluster[S,C,B] HAS Edges: (None)

    --Finished J Tree Optimization--
    ```

    ii. **Initialization**
    The general idea of initialization is to generate the belief potentials into the Junction Tree, making it Inconsistent. This had given me quite a few issues when developing it. But, once I realized how to setup all the variable-state comparisons I found a solution. The code is not very friendly for the viewer, with extra time I would refactor this feature.

    [src/JunctionTree/lib/Initializer.ts](src/JunctionTree/lib/Initializer.ts)

    ```ts
    this.inconsistentJunctionTree = this.initialize(optimizedJunctionTree);
    ```

    _Results of Initialization_

    ```
     ----Started Initialization----

     Initializing Cluster[S,C,B]
     P(C=false|B=false,S=false,) x P(S=false,C=false,B=false,) = 1
     P(C=false|B=true,S=false,) = 0
     P(C=true|B=false,S=false,) = 0
     P(C=true|B=true,S=false,) x P(S=false,C=true,B=true,) = 1
     P(C=false|B=false,S=true,) = 0
     P(C=false|B=true,S=true,) = 0
     P(C=true|B=false,S=true,) x P(S=true,C=true,B=false,) = 1
     P(C=true|B=true,S=true,) x P(S=true,C=true,B=true,) = 1

     ----Finished Initialization----

    ```

    iii. **Propagation**
    Propagation is a fairly complex feature that is used to make the inconsistent Junction Tree locally Consistent. I've tested this feature a fair amount, however I don't believe it is perfect.

    [src/JunctionTree/lib/Propagater.ts](src/JunctionTree/lib/Propagater.ts)

    ```ts
    // Global Propagation

    // 1. Choose an arbitrary cluster X
    let clusterX = inconsistentJunctionTree.getRandomCluster() as GraphEntity<
      IClique
    >;
    console.log("Chose arbitrary cluster: ", clusterX.getEntity().id);
    // 2. Unmark all clusters. Call Collect-Evidence(X)
    inconsistentJunctionTree.unmarkAll();
    this.collectEvidence(clusterX, inconsistentJunctionTree);

    // 3. Unmark all clusters. Call Distrubite-Evidence(X).
    inconsistentJunctionTree.unmarkAll();
    this.distrubuteEvidence(clusterX, inconsistentJunctionTree);

    // Normalize results to fit with sum probability of 1
    this.normalize(inconsistentJunctionTree);
    ```

    _Results of Propagation_

    ```
    ----Started Propagation----

     Chose arbitrary cluster:  SCB
     collectEvidence: SCB
     distrubute Evidence: SCB

     ----Finished Propagation----
    ```

5) **Build the Marginalizer**
   Computing P(V) given Entity V, using the Consistent JunctionTree. In this case the marginalizer is getting the marginalized values from each entity in the entityMap, if I had more time I would of implemented the the ability of handling evidence so more advanced inference would be possible.

   [src/Marginalizer/Marginalizer.ts](src/Marginalizer/Marginalizer.ts)

   ```ts
   const marginalizer = new Marginalizer(jtree);

   console.log("\n\n----Started Marginalization----\n");
   // Marginalize Each Entity to see marginalized values
   entityMap.forEach((entity, id) => {
     console.log(`${id}:`, marginalizer.marginalize(entity));
   });
   console.log("\n----Finished Marginalization----\n");
   ```

   _Results of Marginalization (Checked these results against MatLab bnet lib and they are Correct)_


    ```
    ----Started Marginalization----

    B: [ { if: { B: 'false' }, then: 0.5 }, { if: { B: 'true' }, then: 0.5 } ]
    S: [ { if: { S: 'false' }, then: 0.5 }, { if: { S: 'true' }, then: 0.5 } ]
    C: [ { if: { C: 'false' }, then: 0.25 }, { if: { C: 'true' }, then: 0.75 } ]

    ----Finished Marginalization----
    ```

### Notes:

**Use Graphical structures**

These files can be found in [src/GraphicalStructures](src/GraphicalStructures). When developing the graphical transformation step I realized, that I was going to need an undirected graph structure aswell, so I built off the [DirectGraph.ts](src/GraphicalStructures/DirectGraph.ts) and developed the [UnDirectGraph.ts](src/GraphicalStructures/UnDirectGraph.ts). Also, Similiarly when creating the Junction Tree I realized I was going to need some extra utility in my graph strucutre, so I expanded the UnDirectedGraph.ts into the [Forest.ts](src/GraphicalStructures/Forest.ts) datastructure.

**References**
A significant amount of my time researching the concept was through this paper [Inference in Belief Networks: A Procedural Guide](https://people.ok.ubc.ca/bowenhui/analytics/readings/Huang1996.pdf) by Cecil Huang and Adnan Darwiche. Which I ended up following through most of the development.

Huang, Cecil, and Adnan Darwiche. “Inference in Belief Networks: A Procedural Guide.” _International Journal of Approximate Reasoning_, vol. 15, no. 3, Jan. 1996, pp. 225–263., doi:10.1016/s0888-613x(96)00069-2.
