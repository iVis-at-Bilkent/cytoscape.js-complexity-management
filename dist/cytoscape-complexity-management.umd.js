(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, global["cytoscape-complexity-management"] = factory());
})(this, (function () { 'use strict';

  class Auxiliary {
    static lastID = 0;
    static createUniqueID() {
      let newID = "Object#" + this.lastID + "";
      this.lastID++;
      return newID;
    }
    static removeEdgeFromGraph(edgeToRemove, visibleGM, invisibleGM) {}
    static moveNodeToVisible(node, visibleGM, invisibleGM) {}
    static moveEdgeToVisible(node, visibleGM, invisibleGM) {}
  }
  class ExpandCollapse {
    #collapseNode(node, visibleGM, invisibleGM) {}
    #expandNode(node, isRecursive, visibleGM, invisibleGM) {}
    static collpaseNodes(nodeIDList, isRecursive, visibleGM, invisibleGM) {}
    static expandNodes(nodeIDList, isRecursive, visibleGM, invisibleGM) {}
    static collapseAllNodes(visibleGM, invisibleGM) {}
    static expandAllNodes(visibleGM, invisibleGM) {}
    static collapseEdges(edgeIDList, visibleGM, invisibleGM) {}
    static expandEdges(edgeIDList, visibleGM, invisibleGM) {}
    static collapseEdgesBetweenNodes(nodeIDList, visibleGM, invisibleGM) {}
    static expandEdgesBetweenNodes(nodeIDList, isRecursive, visibleGM, invisibleGM) {}
    static collapseAllEdges(visibleGM, invisibleGM) {}
  }

  /**
   * This class represents a graph manager for complexity management purposes. A graph
   * manager maintains a collection of graphs, forming a compound graph structure
   * through inclusion, and maintains its owner complexity manager, its root graph, 
   * its inter-graph edges, its sibling graph manager and the information of whether 
   * it is visible or not.
   */
  class GraphManager {
    // Complexity manager that owns this graph manager
    #owner;

    // Graphs maintained by this graph manager, including the root of the nesting hierarchy
    #graphs;

    /*
    * Inter-graph edges in this graph manager. Notice that all inter-graph
    * edges go here, not in any of the edge lists of individual graphs (either
    * source or target node's owner graph).
    */
    #edges;

    // The root of the inclusion/nesting hierarchy of this compound structure
    #rootGraph;

    /**
     * Sibling graph manager of this graph manager. If this graph manager is managing the visible 
     * graph, then siblingGraphManager manages the invisible graph or vice versa.
     */
    #siblingGraphManager;

    // Whether this graph manager manages the visible graph or not
    #isVisible;

    /**
     * Constructor
     * @param {ComplexityManager} owner - owner complexity manager 
     * @param {bool} isVisible - whether the graph manager manages visible graph or not
     */
    constructor(owner, isVisible) {
      this.#owner = owner;
      this.#graphs = [];
      this.#edges = [];
      this.#rootGraph = null;
      this.#siblingGraphManager = null;
      this.#isVisible = isVisible;
    }

    // get methods
    get owner() {
      return this.#owner;
    }
    get graphs() {
      return this.#graphs;
    }
    get edges() {
      return this.#edges;
    }
    get rootGraph() {
      return this.#rootGraph;
    }
    get siblingGraphManager() {
      return this.#siblingGraphManager;
    }
    get isVisible() {
      return this.#isVisible;
    }

    // set methods
    set owner(owner) {
      this.#owner = owner;
    }
    set graphs(graphs) {
      this.#graphs = graphs;
    }
    set edges(edges) {
      this.#edges = edges;
    }
    set rootGraph(rootGraph) {
      if (rootGraph.owner != this) {
        throw "Root not in this graph mgr!";
      }
      this.#rootGraph = rootGraph;

      // root graph must have a root node associated with it for convenience
      if (rootGraph.parent == null) {
        rootGraph.parent = this.owner.newNode("Root node");
      }
    }
    set siblingGraphManager(siblingGraphManager) {
      this.#siblingGraphManager = siblingGraphManager;
    }
    set isVisible(isVisible) {
      this.#isVisible = isVisible;
    }

    /**
     * This method adds a new graph to this graph manager and sets as the root.
     * It also creates the root node as the parent of the root graph.
     */
    addRoot() {
      let newGraph = this.#owner.newGraph(this);
      let newNode = this.#owner.newNode();
      let root = this.addGraph(newGraph, newNode);
      this.#rootGraph = root;
      return this.#rootGraph;
    }

    /**
     * This method adds the input graph into this graph manager. The new graph
     * is associated as the child graph of the input parent node. If the parent
     * node is null, then the graph is set to be the root.
     */
    addGraph(newGraph, parentNode) {
      if (newGraph == null) {
        throw "Graph is null!";
      }
      if (parentNode == null) {
        throw "Parent node is null!";
      }
      if (this.#graphs.indexOf(newGraph) > -1) {
        throw "Graph already in this graph mgr!";
      }
      this.#graphs.push(newGraph);
      if (newGraph.parent != null) {
        throw "Already has a parent!";
      }
      if (parentNode.child != null) {
        throw "Already has a child!";
      }
      newGraph.parent = parentNode;
      parentNode.child = newGraph;
      return newGraph;
    }

    /**
     * This method adds the input edge between specified nodes into this graph
     * manager. We assume both source and target nodes to be already in this
     * graph manager.
     */
    addInterGraphEdge(newEdge, sourceNode, targetNode) {
      const sourceGraph = sourceNode.owner;
      const targetGraph = targetNode.owner;
      if (!(sourceGraph != null && sourceGraph.getGraphManager() == this)) {
        throw "Source not in this graph mgr!";
      }
      if (!(targetGraph != null && targetGraph.getGraphManager() == this)) {
        throw "Target not in this graph mgr!";
      }
      if (sourceGraph == targetGraph) {
        newEdge.isInterGraph = false;
        return sourceGraph.add(newEdge, sourceNode, targetNode);
      } else {
        newEdge.isInterGraph = true;

        // set source and target
        newEdge.source = sourceNode;
        newEdge.target = targetNode;

        // add edge to inter-graph edge list
        if (this.#edges.indexOf(newEdge) > -1) {
          throw "Edge already in inter-graph edge list!";
        }
        this.#edges.push(newEdge);

        // add edge to source and target incidency lists
        if (!(newEdge.source != null && newEdge.target != null)) {
          throw "Edge source and/or target is null!";
        }
        if (!(newEdge.source.edges.indexOf(newEdge) == -1 && newEdge.target.edges.indexOf(newEdge) == -1)) {
          throw "Edge already in source and/or target incidency list!";
        }
        newEdge.source.edges.push(newEdge);
        newEdge.target.edges.push(newEdge);
        return newEdge;
      }
    }

    /**
     * This method removes the input graph from this graph manager. 
     */
    removeGraph(graph) {
      if (graph.getGraphManager() != this) {
        throw "Graph not in this graph mgr";
      }
      if (!(graph == this.rootGraph || graph.parent != null && graph.parent.graphManager == this)) {
        throw "Invalid parent node!";
      }

      // first the edges (make a copy to do it safely)
      let edgesToBeRemoved = [];
      edgesToBeRemoved = edgesToBeRemoved.concat(graph.edges);
      edgesToBeRemoved.forEach(edge => {
        graph.remove(edge);
      });

      // then the nodes (make a copy to do it safely)
      let nodesToBeRemoved = [];
      nodesToBeRemoved = nodesToBeRemoved.concat(graph.nodes);
      nodesToBeRemoved.forEach(node => {
        graph.remove(mode);
      });

      // check if graph is the root
      if (graph == this.#rootGraph) {
        this.#rootGraph = null;
      }

      // now remove the graph itself
      this.graphs.remove(graph);

      // also reset the parent of the graph
      graph.parent = null;
    }

    /**
     * This method removes the input inter-graph edge from this graph manager.
     */
    removeInterGraphEdge(edge) {
      if (edge == null) {
        throw "Edge is null!";
      }
      if (!edge.isInterGraph) {
        throw "Not an inter-graph edge!";
      }
      if (!(edge.source != null && edge.target != null)) {
        throw "Source and/or target is null!";
      }

      // remove edge from source and target nodes' incidency lists      

      if (!(edge.source.edges.indexOf(edge) != -1 && edge.target.edges.indexOf(edge) != -1)) {
        throw "Source and/or target doesn't know this edge!";
      }
      let index = edge.source.edges.indexOf(edge);
      edge.source.edges.splice(index, 1);
      index = edge.target.edges.indexOf(edge);
      edge.target.edges.splice(index, 1);

      // remove edge from owner graph manager's inter-graph edge list

      if (!(edge.source.owner != null && edge.source.owner.getGraphManager() != null)) {
        throw "Edge owner graph or owner graph manager is null!";
      }
      if (edge.source.owner.getGraphManager().edges.indexOf(edge) == -1) {
        throw "Not in owner graph manager's edge list!";
      }
      index = edge.source.owner.getGraphManager().edges.indexOf(edge);
      edge.source.owner.getGraphManager().edges.splice(index, 1);
    }
  }

  /**
   * This class represents a graph. A graph maintains
   * its owner graph manager, its nodes, its intra-graph edges,
   * its parent node and its sibling graph. A graph is always
   * a child of a compound node. The root of the compound graph
   * structure is a child of the root node, which is the only node
   * in compound structure without an owner graph.
   */
  class Graph {
    /** 
     * Parent node of the graph. This should never be null (the parent of the
     * root graph is the root node) when this graph is part of a compound
     * structure (i.e. a graph manager).
     */
    #parent;

    // Graph manager that owns this graph
    #owner;

    // Nodes maintained by the graph
    #nodes;

    // Edges whose source and target nodes are in this graph (intra-graph edge)
    #edges;

    /**
     * Sibling graph of this graph. If this graph is owned by the visible 
     * graph manager, then siblingGraph must be owned by the invisible
     * graph manager or vice versa.
     */
    #siblingGraph;

    /**
     * Constructor
     * @param {Node} parent - parent node of the graph
     * @param {GraphManager} owner - owner graph manager of the graph
     */
    constructor(parent, owner) {
      this.#parent = parent;
      this.#owner = owner;
      this.#nodes = [];
      this.#edges = [];
      this.#siblingGraph = null;
    }

    // get methods
    get parent() {
      return this.#parent;
    }
    get owner() {
      return this.#owner;
    }
    get nodes() {
      return this.#nodes;
    }
    get edges() {
      return this.#edges;
    }
    get siblingGraph() {
      return this.#siblingGraph;
    }

    // set methods
    set parent(parent) {
      this.#parent = parent;
    }
    set owner(owner) {
      this.#owner = owner;
    }
    set nodes(nodes) {
      this.#nodes = nodes;
    }
    set edges(edges) {
      this.#edges = edges;
    }
    set siblingGraph(siblingGraph) {
      this.#siblingGraph = siblingGraph;
    }

    /**
     * This methods adds the given node to this graph. We assume 
     * this graph has a proper graph manager.
     */
    addNode(newNode) {
      if (this.#owner == null) {
        throw "Graph has no graph manager!";
      }
      if (this.#nodes.indexOf(newNode) > -1) {
        throw "Node already in graph!";
      }
      newNode.owner = this;
      this.#nodes.push(newNode);
      return newNode;
    }

    /**
     * This methods adds the given edge to this graph with 
     * specified nodes as source and target.
     */
    addEdge(newEdge, sourceNode, targetNode) {
      if (!(this.#nodes.indexOf(sourceNode) > -1 && this.#nodes().indexOf(targetNode) > -1)) {
        throw "Source or target not in graph!";
      }
      if (!(sourceNode.owner == targetNode.owner && sourceNode.owner == this)) {
        throw "Both owners must be this graph!";
      }
      if (sourceNode.owner != targetNode.owner) {
        return null;
      }

      // set source and target
      newEdge.source = sourceNode;
      newEdge.target = targetNode;

      // set as intra-graph edge
      newEdge.isInterGraph = false;

      // add to graph edge list
      this.#edges().push(newEdge);

      // add to incidency lists
      sourceNode.edges.push(newEdge);
      if (targetNode != sourceNode) {
        targetNode.edges.push(newEdge);
      }
      return newEdge;
    }

    /**
     * This method removes the input node from this graph. If the node has any
     * incident edges, they are removed from the graph (the graph manager for
     * inter-graph edges) as well.
     */
    removeNode(node) {
      if (node == null) {
        throw "Node is null!";
      }
      if (!(node.owner != null && node.owner == this)) {
        throw "Owner graph is invalid!";
      }
      if (this.owner == null) {
        throw "Owner graph manager is invalid!";
      }

      // remove incident edges first (make a copy to do it safely)
      const edgesToBeRemoved = node.edges.slice();
      edgesToBeRemoved.forEach(edge => {
        if (edge.isInterGraph) {
          this.owner.remove(edge);
        } else {
          edge.source.owner.remove(edge);
        }
      });

      // now the node itself
      const index = this.#nodes.indexOf(node);
      if (index == -1) {
        throw "Node not in owner node list!";
      }
      this.nodes.splice(index, 1);
    }

    /**
     * This method removes the input edge from this graph. 
     * Should not be used for inter-graph edges.
     */
    removeEdge(edge) {
      if (edge == null) {
        throw "Edge is null!";
      }
      if (!(edge.source != null && edge.target != null)) {
        throw "Source and/or target is null!";
      }
      if (!(edge.source.owner != null && edge.target.owner != null && edge.source.owner == this && edge.target.owner == this)) {
        throw "Source and/or target owner is invalid!";
      }

      // remove edge from source and target nodes' incidency lists

      const sourceIndex = edge.source.edges.indexOf(edge);
      const targetIndex = edge.target.edges.indexOf(edge);
      if (!(sourceIndex > -1 && targetIndex > -1)) {
        throw "Source and/or target doesn't know this edge!";
      }
      edge.source.edges.splice(sourceIndex, 1);
      if (edge.target != edge.source) {
        edge.target.edges.splice(targetIndex, 1);
      }

      // remove edge from owner graph's edge list

      const index = edge.source.owner.getEdges().indexOf(edge);
      if (index == -1) {
        throw "Not in owner's edge list!";
      }
      edge.source.owner.edges.splice(index, 1);
    }
  }

  /**
   * This class represents a graph object which 
   * can be either a  node or an edge.
   */
  class GraphObject {
    // ID of the graph object; must be unique
    #ID;

    // Owner graph or graph manager of the graph object
    #owner;

    // Whether the graph object is visible or not
    #isVisible;

    // Whether the graph object is filtered or not
    #isFiltered;

    // Whether the graph object is hidden or not
    #isHidden;

    /**
     * Constuctor
     * @param {String} ID - ID of the graph object
     */
    constructor(ID) {
      this.#ID = ID;
      this.#owner = null;
      this.#isVisible = true;
      this.#isFiltered = false;
      this.#isHidden = false;
    }

    // get methods
    get ID() {
      return this.#ID;
    }
    get owner() {
      if (this.#owner == null) {
        throw "Owner graph of a node cannot be null";
      }
      return this.#owner;
    }
    get isVisible() {
      return this.#isVisible;
    }
    get isFiltered() {
      return this.#isFiltered;
    }
    get isHidden() {
      return this.#isHidden;
    }

    // set methods
    set ID(newID) {
      this.#ID = newID;
    }
    set owner(newOwner) {
      this.#owner = newOwner;
    }
    set isVisible(isVisible) {
      this.#isVisible = isVisible;
    }
    set isFiltered(isFiltered) {
      this.#isFiltered = isFiltered;
    }
    set isHidden(isHidden) {
      this.#isHidden = isHidden;
    }
  }

  /**
   * This class represents a node. A node maintains
   * its child graph if exists, a list of its incident 
   * edges and the information of whether it is collapsed
   * or not together with the properties that are 
   * inherited from GraphObject class.
   */
  class Node extends GraphObject {
    // Child graph of the node
    #child;

    // List of edges incident with the node 
    #edges;

    // Whether the node is collapsed or not
    #isCollapsed;

    /**
     * Constuctor
     * @param {String} ID - ID of the node
     */
    constructor(ID) {
      super(ID);
      this.#child = null;
      this.#edges = [];
      this.#isCollapsed = false;
    }

    // get methods
    get child() {
      return this.#child;
    }
    get edges() {
      return this.#edges;
    }
    get isCollapsed() {
      return this.#isCollapsed;
    }

    // set methods
    set child(child) {
      this.#child = child;
    }
    set edges(edges) {
      this.#edges = edges;
    }
    set isCollapsed(isCollapsed) {
      this.#isCollapsed = isCollapsed;
    }
  }

  /**
   * This class is responsible for the communication between CMGM core 
   * and the outside world via API functions. These API functions include
   * both the ones used to synchronize CMGM with the graph model of Rendering
   * Library (RL) when any topological changes occur on the renderer’s side
   * and the ones related to the complexity management operations.
   */
  class ComplexityManager {
    // Graph manager that is responsible from visible compound graph
    #visibleGraphManager;

    // Graph manager that is responsible from invisible compound graph
    #invisibleGraphManager;

    /**
     * Constructor
     */
    constructor() {
      this.#visibleGraphManager = this.#newGraphManager(true);
      this.#invisibleGraphManager = this.#newGraphManager(false);
    }

    // Get methods
    get visibleGraphManager() {
      return this.#visibleGraphManager;
    }
    get invisibleGraphManager() {
      return this.#invisibleGraphManager;
    }

    /*
      * This method creates a new graph manager responsible for either
      * visible or invisible graph based on the input and returns it.
      */
    #newGraphManager(isVisible) {
      let gm = new GraphManager(this, isVisible);
      return gm;
    }

    /**
     * This method creates a new graph in the graph manager associated with the input.
     */
    newGraph(graphManager) {
      return new Graph(null, graphManager);
    }

    /**
     * This method creates a new node associated with the input view node.
     */
    newNode(ID) {
      let nodeID = ID ? ID : Auxiliary.createUniqueID();
      return new Node(nodeID);
    }

    // Topology related API methods

    addNode(nodeID, parentID) {
      this.#visibleGraphManager;
      this.#invisibleGraphManager;
    }
    addEdge(edgeID, sourceID, targetID) {
      this.#visibleGraphManager;
      this.#invisibleGraphManager;
    }
    removeNode(nodeID) {
      this.#visibleGraphManager;
      this.#invisibleGraphManager;
    }
    removeEdge(edgeID) {
      this.#visibleGraphManager;
      this.#invisibleGraphManager;
    }
    reconnect(edgeID, newSourceID, newTargetID) {
      this.#visibleGraphManager;
      this.#invisibleGraphManager;
    }
    changeParent(nodeID, newParentID) {
      this.#visibleGraphManager;
      this.#invisibleGraphManager;
    }

    // Complexity management related API methods

    // filter/unfilter methods

    filter(nodeIDList, edgeIDList) {
      this.#visibleGraphManager;
      this.#invisibleGraphManager;
    }
    unfilter(nodeIDList, edgeIDList) {
      this.#visibleGraphManager;
      this.#invisibleGraphManager;
    }

    // hide/show methods

    hide(nodeIDList, edgeIDList) {
      this.#visibleGraphManager;
      this.#invisibleGraphManager;
    }
    show(nodeIDList, edgeIDList) {
      this.#visibleGraphManager;
      this.#invisibleGraphManager;
    }
    showAll() {
      this.#visibleGraphManager;
      this.#invisibleGraphManager;
    }

    // expand/collapse methods

    collapseNodes(nodeIDList, isRecursive) {
      let visibleGM = this.#visibleGraphManager;
      let invisibleGM = this.#invisibleGraphManager;
      ExpandCollapse.collpaseNodes(nodeIDList, isRecursive, visibleGM, invisibleGM);
    }
    expandNodes(nodeIDList, isRecursive) {
      let visibleGM = this.#visibleGraphManager;
      let invisibleGM = this.#invisibleGraphManager;
      ExpandCollapse.expandNodes(nodeIDList, isRecursive, visibleGM, invisibleGM);
    }
    collapseAllNodes() {
      let visibleGM = this.#visibleGraphManager;
      let invisibleGM = this.#invisibleGraphManager;
      ExpandCollapse.collapseAllNodes(visibleGM, invisibleGM);
    }
    expandAllNodes() {
      let visibleGM = this.#visibleGraphManager;
      let invisibleGM = this.#invisibleGraphManager;
      ExpandCollapse.expandAllNodes(visibleGM, invisibleGM);
    }
    collapseEdges(edgeIDList) {
      let visibleGM = this.#visibleGraphManager;
      let invisibleGM = this.#invisibleGraphManager;
      ExpandCollapse.collapseEdges(edgeIDList, visibleGM, invisibleGM);
    }
    expandEdges(edgeIDList, isRecursive) {
      let visibleGM = this.#visibleGraphManager;
      let invisibleGM = this.#invisibleGraphManager;
      ExpandCollapse.expandEdges(edgeIDList, isRecursive, visibleGM, invisibleGM);
    }
    collapseEdgesBetweenNodes(nodeIDList) {
      let visibleGM = this.#visibleGraphManager;
      let invisibleGM = this.#invisibleGraphManager;
      ExpandCollapse.collapseEdgesBetweenNodes(nodeIDList, visibleGM, invisibleGM);
    }
    expandEdgesBetweenNodes(nodeIDList, isRecursive) {
      let visibleGM = this.#visibleGraphManager;
      let invisibleGM = this.#invisibleGraphManager;
      ExpandCollapse.expandEdgesBetweenNodes(nodeIDList, isRecursive, visibleGM, invisibleGM);
    }
    collapseAllEdges() {
      let visibleGM = this.#visibleGraphManager;
      let invisibleGM = this.#invisibleGraphManager;
      ExpandCollapse.collapseAllEdges(visibleGM, invisibleGM);
    }
    expandAllEdges() {
      let visibleGM = this.#visibleGraphManager;
      let invisibleGM = this.#invisibleGraphManager;
      ExpandCollapse.expandAllEdges(visibleGM, invisibleGM);
    }
  }

  function complexityManagement(cy) {
    var getTopMostNodes = function getTopMostNodes(nodes) {
      var nodesMap = {};
      nodes.forEach(function (node) {
        nodesMap[node.id()] = true;
      });
      var roots = nodes.filter(function (ele, i) {
        if (typeof ele === "number") {
          ele = i;
        }
        var parent = ele.parent()[0];
        while (parent != null) {
          if (nodesMap[parent.id()]) {
            return false;
          }
          parent = parent.parent()[0];
        }
        return true;
      });
      return roots;
    };

    // This function processes nodes to add them into input graph
    var processChildrenList = function processChildrenList(parent, children, compMgr, isVisible) {
      var size = children.length;
      for (var i = 0; i < size; i++) {
        var theChild = children[i];
        var children_of_children = theChild.children();
        var theNode = void 0;
        theNode = parent.addNode(compMgr.newNode(theChild.id()));
        if (children_of_children != null && children_of_children.length > 0) {
          var theNewGraph = void 0;
          theNewGraph = parent.owner.add(compMgr.newGraph(isVisible), theNode);
          this.processChildrenList(theNewGraph, children_of_children, compMgr, isVisible);
        }
      }
    };
    var compMgrInstance = new ComplexityManager();
    var visibleGM = compMgrInstance.visibleGraphManager;
    var invisibleGM = compMgrInstance.invisibleGraphManager;
    var nodes = cy.nodes();
    cy.edges();
    var rootGraphForVisible = visibleGM.addRoot();
    var rootGraphForInvisible = invisibleGM.addRoot();

    // Add nodes to visible graph
    processChildrenList(rootGraphForVisible, getTopMostNodes(nodes), compMgrInstance, true);

    // Add nodes to invisible graph
    processChildrenList(rootGraphForInvisible, getTopMostNodes(nodes), compMgrInstance, false);
    console.log(visibleGM);
    console.log(invisibleGM);
  }

  function register(cytoscape) {
    // register with cytoscape.js
    cytoscape("core", "complexityManagement", function (opts) {
      var cy = this;
      return complexityManagement(cy);
    });
  }
  if (typeof window.cytoscape !== 'undefined') {
    // expose to global cytoscape (i.e. window.cytoscape)
    register(window.cytoscape);
  }

  return register;

}));
