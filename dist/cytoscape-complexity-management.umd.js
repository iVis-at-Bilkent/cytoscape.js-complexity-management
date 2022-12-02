(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, global["cytoscape-complexity-management"] = factory());
})(this, (function () { 'use strict';

  function _toConsumableArray(arr) {
    return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _unsupportedIterableToArray(arr) || _nonIterableSpread();
  }
  function _arrayWithoutHoles(arr) {
    if (Array.isArray(arr)) return _arrayLikeToArray(arr);
  }
  function _iterableToArray(iter) {
    if (typeof Symbol !== "undefined" && iter[Symbol.iterator] != null || iter["@@iterator"] != null) return Array.from(iter);
  }
  function _unsupportedIterableToArray(o, minLen) {
    if (!o) return;
    if (typeof o === "string") return _arrayLikeToArray(o, minLen);
    var n = Object.prototype.toString.call(o).slice(8, -1);
    if (n === "Object" && o.constructor) n = o.constructor.name;
    if (n === "Map" || n === "Set") return Array.from(o);
    if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen);
  }
  function _arrayLikeToArray(arr, len) {
    if (len == null || len > arr.length) len = arr.length;
    for (var i = 0, arr2 = new Array(len); i < len; i++) arr2[i] = arr[i];
    return arr2;
  }
  function _nonIterableSpread() {
    throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
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

    // NodeId to NodeObject map.
    nodesMap;
    edgesMap;
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
      this.nodesMap = new Map();
      this.edgesMap = new Map();
      this.addRoot(); // Add root graph
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
      if (!(sourceGraph != null && sourceGraph.owner == this)) {
        throw "Source not in this graph mgr!";
      }
      if (!(targetGraph != null && targetGraph.owner == this)) {
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

        // Set owner of the edge
        newEdge.owner = this;
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

      if (!(edge.source.owner != null && edge.source.owner.owner != null)) {
        throw "Edge owner graph or owner graph manager is null!";
      }
      if (edge.source.owner.owner.edges.indexOf(edge) == -1) {
        throw "Not in owner graph manager's edge list!";
      }
      index = edge.source.owner.owner.edges.indexOf(edge);
      edge.source.owner.owner.edges.splice(index, 1);
    }

    /**
     * This method returns all descendants of the input node together with their incident edges.
     * The output does not include the input node, but includes its incident edges
     */
    getDescendantsInorder(node) {
      let descendants = {
        edges: new Set(),
        simpleNodes: [],
        compoundNodes: []
      };
      let childGraph = node.child;
      if (childGraph) {
        let childGraphNodes = childGraph.nodes;
        childGraphNodes.forEach(childNode => {
          let childDescendents = this.getDescendantsInorder(childNode);
          for (var id in childDescendents) {
            descendants[id] = [...(descendants[id] || []), ...childDescendents[id]];
          }
          descendants['edges'] = new Set(descendants['edges']);
          if (childNode.child) {
            descendants.compoundNodes.push(childNode);
          } else {
            descendants.simpleNodes.push(childNode);
          }
          let nodeEdges = childNode.edges;
          nodeEdges.forEach(item => descendants['edges'].add(item));
        });
      }
      return descendants;
    }
  }
  class Auxiliary {
    static lastID = 0;
    static createUniqueID() {
      let newID = "Object#" + this.lastID + "";
      this.lastID++;
      return newID;
    }
    static removeEdgeFromGraph(edgeToRemove) {
      if (edgeToRemove.owner instanceof GraphManager) {
        edgeToRemove.owner.removeInterGraphEdge(edgeToRemove);
      } else {
        edgeToRemove.owner.removeEdge(edgeToRemove);
      }
    }
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

  /* This class defines properties specific to an edge. */

  /**
   * This class represents an edge. An edge maintains
   * its source, its target and the information of whether 
   * it is inter-graph or not together with the properties 
   * that are inherited from GraphObject class.
   */
  class Edge extends GraphObject {
    // Source node of the edge
    #source;

    // Target node of the edge
    #target;

    // Whether the edge is inter-graph
    #isInterGraph;

    /**
     * Constructor
     * @param {String} ID - ID of the edge 
     * @param {Node} source - source node of the edge 
     * @param {Node} target - target node of the edge 
     */
    constructor(ID, source, target) {
      super(ID);
      this.#source = source;
      this.#target = target;
      this.#isInterGraph = false;
    }

    // get methods
    get source() {
      return this.#source;
    }
    get target() {
      return this.#target;
    }
    get isInterGraph() {
      return this.#isInterGraph;
    }

    // set methods
    set source(source) {
      this.#source = source;
    }
    set target(target) {
      this.#target = target;
    }
    set isInterGraph(isInterGraph) {
      this.#isInterGraph = isInterGraph;
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
      if (!(this.#nodes.indexOf(sourceNode) > -1 && this.#nodes.indexOf(targetNode) > -1)) {
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

      // set the owner 
      newEdge.owner = this;

      // add to graph edge list
      this.#edges.push(newEdge);

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
      // Requires further invesitgations.
      const edgesToBeRemoved = node.edges.slice();
      edgesToBeRemoved.forEach(edge => {
        if (edge.isInterGraph) {
          this.owner.removeInterGraphEdge(edge);
        } else {
          edge.source.owner.removeEdge(edge);
        }
      });

      // now the node itself
      const index = this.#nodes.indexOf(node);
      if (index == -1) {
        throw "Node not in owner node list!";
      }
      this.nodes.splice(index, 1);
      return node;
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

      const index = edge.source.owner.edges.indexOf(edge);
      if (index == -1) {
        throw "Not in owner's edge list!";
      }
      edge.source.owner.edges.splice(index, 1);
      return edge;
    }
  }

  /**
   * This class represents a meta edge. A meta edge maintains 
   * the original edges it represents together with the properties 
   * that are inherited from Edge class.
   */
  class MetaEdge extends Edge {
    // The original edges this meta edge represents
    #originalEdges;

    /**
     * Constructor
     * @param {Stirng} ID - ID of the meta edge 
     * @param {Node} source - source node of the meta edge 
     * @param {*} target - target node of the meta edge
     */
    constructor(source, target) {
      let ID = Auxiliary.createUniqueID();
      super(ID, source, target);
      this.#originalEdges = [];
    }

    // get methods
    get originalEdges() {
      return this.#originalEdges;
    }

    // set methods
    set originalEdges(originalEdges) {
      this.#originalEdges = originalEdges;
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
  class Topology {
    static addNode(nodeID, parentID, visibleGM, invisibleGM) {
      let graphToAdd;
      let graphToAddInvisible;
      if (parentID) {
        let parentNode = visibleGM.nodesMap.get(parentID);
        if (parentNode.child) {
          graphToAdd = parentNode.child;
        } else {
          graphToAdd = visibleGM.addGraph(new Graph(null, visibleGM), parentNode);
        }
      } else {
        graphToAdd = visibleGM.rootGraph;
      }
      let node = new Node(nodeID);
      graphToAdd.addNode(node);
      visibleGM.nodesMap.set(nodeID, node);
      let nodeForInvisible = new Node(nodeID);
      if (graphToAdd.siblingGraph) {
        graphToAdd.siblingGraph.addNode(nodeForInvisible);
      } else {
        if (parentID) {
          let parentNodeInvisible = invisibleGM.nodesMap.get(parentID);
          if (parentNodeInvisible.child) {
            graphToAddInvisible = parentNodeInvisible.child;
          } else {
            graphToAddInvisible = invisibleGM.addGraph(new Graph(null, invisibleGM), parentNodeInvisible);
          }
        } else {
          graphToAddInvisible = invisibleGM.rootGraph;
        }
        graphToAddInvisible.addNode(nodeForInvisible);
        graphToAdd.siblingGraph = graphToAddInvisible;
        graphToAddInvisible.siblingGraph = graphToAdd;
      }
      invisibleGM.nodesMap.set(nodeID, nodeForInvisible);
    }
    static addEdge(edgeID, sourceID, targetID, visibleGM, invisibleGM) {
      let sourceNode = visibleGM.nodesMap.get(sourceID);
      let targetNode = visibleGM.nodesMap.get(targetID);
      let edge = new Edge(edgeID, sourceNode, targetNode);
      let sourceNodeInvisible = invisibleGM.nodesMap.get(sourceID);
      let targetNodeInvisible = invisibleGM.nodesMap.get(targetID);
      let edgeInvisible = new Edge(edgeID, sourceNodeInvisible, targetNodeInvisible);
      if (sourceNode.owner === targetNode.owner) {
        sourceNode.owner.addEdge(edge, sourceNode, targetNode);
        sourceNodeInvisible.owner.addEdge(edgeInvisible, sourceNodeInvisible, targetNodeInvisible);
      } else {
        visibleGM.addInterGraphEdge(edge, sourceNode, targetNode);
        invisibleGM.addInterGraphEdge(edgeInvisible, sourceNodeInvisible, targetNodeInvisible);
      }
      visibleGM.edgesMap.set(edgeID, edge);
      invisibleGM.edgesMap.set(edgeID, edgeInvisible);
    }
    removeNestedEdges(nestedEdges, invisibleGM) {
      nestedEdges.forEach(edgeInInvisibleItem => {
        if (typeof edgeInInvisibleItem === "string") {
          let edgeInInvisible = invisibleGM.edgesMap.get(edgeInInvisibleItem);
          invisibleGM.edgesMap.delete(edgeInInvisible);
          Auxiliary.removeEdgeFromGraph(edgeInInvisible);
        } else {
          removeNestedEdges(edgeInInvisibleItem, invisibleGM);
        }
      });
    }
    static updateMetaEdge(nestedEdges, targetEdge) {
      let updatedMegaEdges = [];
      nestedEdges.forEach((nestedEdge, index) => {
        if (typeof nestedEdge === "string") {
          if (nestedEdge != targetEdge.ID) {
            updatedMegaEdges.push(nestedEdge);
          }
        } else {
          update, newStatus = updateMetaEdge(nestedEdge, targetEdge);
          updatedMegaEdges.push(update);
        }
      });
      return updatedMegaEdges.length == 1 ? updatedMegaEdges[0] : updatedMegaEdges;
    }
    static removeEdge(edgeID, visibleGM, invisibleGM) {
      let edgeToRemove = visibleGM.edgesMap.get(edgeID);
      let edgeToRemoveInvisible = invisibleGM.edgesMap.get(edgeID);
      if (edgeToRemove) {
        // meta edges
        if (edgeToRemove instanceof MetaEdge) {
          // Returns the array of edge IDs. Needs more investigation on structure.
          actualEdgesInInvisble = edgeToRemove.originalEdges();
          visibleGM.edgesMap.delete(edgeToRemove.ID);
          Auxiliary.removeEdgeFromGraph(edgeToRemove);
          removeNestedEdges(actualEdgesInInvisble, invisibleGM);
        } else {
          // Go through each meta edge and update the orignal ends if updatedoriginalEdges does not match.
          let found = false;
          visibleGM.edgesMap.forEach(visibleEdge => {
            if (visibleEdge instanceof MetaEdge) {
              // updateMetaEdge function returns updated version of originalEdges without key of edgeTo Remove
              updatedOrignalEdges = updateMetaEdge(visibleEdge.originalEdges(), edgeToRemove);
              // updatedOrignalEdges will be same as originalEdges if edge to remove is not part of the meta edge
              if (updatedOrignalEdges != visibleEdge.originalEdges()) {
                visibleEdge.originalEdges(updatedOrignalEdges);
                found = true;
              }
            }
          });
          if (!found) {
            visibleGM.edgesMap.delete(edgeToRemove.ID);
            Auxiliary.removeEdgeFromGraph(edgeToRemove);
          }
          invisibleGM.edgesMap.delete(edgeToRemoveInvisible.ID);
          Auxiliary.removeEdgeFromGraph(edgeToRemoveInvisible);
        }
      } else {
        invisibleGM.edgesMap.delete(edgeToRemoveInvisible.ID);
        Auxiliary.removeEdgeFromGraph(edgeToRemoveInvisible);
      }
    }
    static removeNode(nodeID, visibleGM, invisibleGM) {
      let nodeToRemove = visibleGM.nodesMap.get(nodeID);
      let nodeToRemoveInvisible = invisibleGM.nodesMap.get(nodeID);
      if (nodeToRemove) {
        // Removing nodes from Visible Graph Manager
        let nodeToRemoveDescendants = visibleGM.getDescendantsInorder(nodeToRemove);
        nodeToRemoveDescendants.edges.forEach(nodeToRemoveEdge => {
          Topology.removeEdge(nodeToRemoveEdge.ID, visibleGM, invisibleGM);
        });
        nodeToRemoveDescendants.simpleNodes.forEach(nodeToRemoveSimpleNode => {
          nodeToRemoveSimpleNode.owner.removeNode(nodeToRemoveSimpleNode);
          visibleGM.nodesMap.delete(nodeToRemoveSimpleNode.ID);
        });
        nodeToRemoveDescendants.compoundNodes.forEach(nodeToRemoveCompoundNode => {
          nodeToRemoveCompoundNode.owner.removeNode(nodeToRemoveCompoundNode);
          visibleGM.nodesMap.delete(nodeToRemoveCompoundNode.ID);
        });
        // Removing nodes from Invisible Graph Manager
        let nodeToRemoveDescendantsInvisible = invisibleGM.getDescendantsInorder(nodeToRemoveInvisible);
        nodeToRemoveDescendantsInvisible.edges.forEach(nodeToRemoveEdgeInvisible => {
          Topology.removeEdge(nodeToRemoveEdgeInvisible.ID, visibleGM, invisibleGM);
        });
        nodeToRemoveDescendantsInvisible.simpleNodes.forEach(nodeToRemoveSimpleNodeInvisible => {
          nodeToRemoveSimpleNodeInvisible.owner.removeNode(nodeToRemoveSimpleNodeInvisible);
          invisibleGM.nodesMap.delete(nodeToRemoveSimpleNodeInvisible.ID);
        });
        nodeToRemoveDescendantsInvisible.compoundNodes.forEach(nodeToRemoveCompoundNodeInvisible => {
          nodeToRemoveCompoundNodeInvisible.owner.removeNode(nodeToRemoveCompoundNodeInvisible);
          invisibleGM.nodesMap.delete(nodeToRemoveCompoundNodeInvisible.ID);
        });
        nodeToRemove.owner.removeNode(nodeToRemove);
        visibleGM.nodesMap.delete(nodeID);
        nodeToRemoveInvisible.owner.removeNode(nodeToRemoveInvisible);
        invisibleGM.nodesMap.delete(nodeID);
      } else {
        if (nodeToRemoveInvisible) {
          nodeToRemoveInvisible.owner.removeNode(nodeToRemoveInvisible);
          invisibleGM.nodesMap.delete(nodeID);
        }
      }
      visibleGM.graphs.forEach((graph, index) => {
        if (graph.nodes.length == 0 && graph != visibleGM.rootGraph) {
          visibleGM.graphs.splice(index, 1);
        }
      });
      invisibleGM.graphs.forEach((graph, index) => {
        if (graph.nodes.length == 0 && graph != invisibleGM.rootGraph) {
          invisibleGM.graphs.splice(index, 1);
        }
      });
    }
    static reconnect(edgeID, newSourceID, newTargetID, visibleGM, invisibleGM) {
      let edgeToRemove = visibleGM.edgesMap.get(edgeID);
      if (newSourceID == undefined) {
        newSourceID = edgeToRemove.source.ID;
      } else if (newTargetID == undefined) {
        newTargetID = edgeToRemove.taget.ID;
      }
      if (edgeToRemove) {
        visibleGM.edgesMap.delete(edgeToRemove.ID);
        Auxiliary.removeEdgeFromGraph(edgeToRemove);
      }
      let edgeToRemoveInvisible = invisibleGM.edgesMap.get(edgeID);
      let edgeToAddForInvisible = new Edge(edgeID, newSourceID, newTargetID);
      edgeToAddForInvisible.isVisible(edgeToRemoveInvisible.isVisible);
      edgeToAddForInvisible.isHidden(edgeToRemoveInvisible.isHidden);
      if (edgeToAddForInvisible.isFiltered == false && edgeToAddForInvisible.isHidden == false && visibleGM.nodesMap.get(newSourceID).isVisible && visibleGM.nodesMap.get(newTargetID).isVisible) {
        edgeToAddForInvisible.isVisible(true);
      } else {
        edgeToAddForInvisible.isVisible(false);
      }
      if (edgeToAddForInvisible.isVisible == true) {
        addEdge(edgeID, newSourceID, newSourceID, visibleGM, invisibleGM);
      } else {
        if (edgeToAddForInvisible.source.owner == edgeToAddForInvisible.target.owner) {
          edgeToAddForInvisible.source.owner.addEdge(edgeToAddForInvisible, edgeToAddForInvisible.source, edgeToAddForInvisible.target);
        } else {
          invisibleGM.addInterGraphEdge(edgeToAddForInvisible, edgeToAddForInvisible.source, edgeToAddForInvisible.target);
        }
      }
    }
    static changeParent(nodeID, newParentID, visibleGM, invisibleGM) {
      let nodeToRemove = visibleGM.nodesMap.get(nodeID);
      if (nodeToRemove) {
        let newParent = visibleGM.nodesMap.get(newParentID);
        let removedNode = nodeToRemove.owner.removeNode(nodeToRemove);
        if (newParent.child == undefined) {
          newParent.child = new Graph(newParent, visibleGM);
        }
        newParent.child.addNode(removedNode);
      }
      let nodeToRemoveInvisible = invisibleGM.nodesMap.get(nodeID);
      let newParentInInvisible = invisibleGM.nodesMap.get(newParentID);
      let removedNodeInvisible = nodeToRemoveInvisible.owner.removeNode(nodeToRemoveInvisible);
      newParentInInvisible.child.addNode(removedNodeInvisible);
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
      // Set sibling graph managers
      this.#visibleGraphManager.siblingGraphManager = this.#invisibleGraphManager;
      this.#invisibleGraphManager.siblingGraphManager = this.#visibleGraphManager;
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
      let visibleGM = this.#visibleGraphManager;
      let invisibleGM = this.#invisibleGraphManager;
      Topology.addNode(nodeID, parentID, visibleGM, invisibleGM);
    }
    addEdge(edgeID, sourceID, targetID) {
      let visibleGM = this.#visibleGraphManager;
      let invisibleGM = this.#invisibleGraphManager;
      Topology.addEdge(edgeID, sourceID, targetID, visibleGM, invisibleGM);
    }
    removeNode(nodeID) {
      let visibleGM = this.#visibleGraphManager;
      let invisibleGM = this.#invisibleGraphManager;
      Topology.removeNode(nodeID, visibleGM, invisibleGM);
    }
    removeEdge(edgeID) {
      let visibleGM = this.#visibleGraphManager;
      let invisibleGM = this.#invisibleGraphManager;
      Topology.removeEdge(edgeID, visibleGM, invisibleGM);
    }
    reconnect(edgeID, newSourceID, newTargetID) {
      let visibleGM = this.#visibleGraphManager;
      let invisibleGM = this.#invisibleGraphManager;
      Topology.reconnect(edgeID, newSourceID, newTargetID, visibleGM, invisibleGM);
    }
    changeParent(nodeID, newParentID) {
      let visibleGM = this.#visibleGraphManager;
      let invisibleGM = this.#invisibleGraphManager;
      Topology.changeParent(nodeID, newParentID, visibleGM, invisibleGM);
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
    /** Transfer cytoscape graph to complexity management model */

    // This function finds and returns the top-level nodes in the graph
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

    // This function processes nodes to add them into both visible and invisible graphs
    var processChildrenList = function processChildrenList(children, compMgr) {
      var size = children.length;
      for (var i = 0; i < size; i++) {
        var theChild = children[i];
        var children_of_children = theChild.children();
        compMgr.addNode(theChild.id(), theChild.parent().id());
        if (children_of_children != null && children_of_children.length > 0) {
          processChildrenList(children_of_children, compMgr);
        }
      }
    };

    // This function processes edges to add them into both visible and invisible graphs
    var processEdges = function processEdges(edges, compMgr) {
      for (var i = 0; i < edges.length; i++) {
        var edge = edges[i];
        compMgr.addEdge(edge.id(), edge.source().id(), edge.target().id());
      }
    };
    var compMgrInstance = new ComplexityManager();
    var nodes = cy.nodes();
    var edges = cy.edges();

    // Add nodes to both visible and invisible graphs
    processChildrenList(getTopMostNodes(nodes), compMgrInstance);

    // Add edges to both visible and invisible graphs
    processEdges(edges, compMgrInstance);

    /** Topology related event handling */

    //  Action functions

    var actOnAdd = function actOnAdd(evt) {
      var elementToBeAdded = evt.target;

      // Add new node to both visible and invisible graphs
      if (elementToBeAdded.isNode()) {
        compMgrInstance.addNode(elementToBeAdded.id(), elementToBeAdded.parent().id());
      } else {
        // Add new edge to both visible and invisible graphs
        compMgrInstance.addEdge(elementToBeAdded.id(), elementToBeAdded.source().id(), elementToBeAdded.target().id());
      }

      // Update filtered elements because new eles added may change the list
      updateFilteredElements();
    };
    var actOnRemove = function actOnRemove(evt) {
      var elementToBeRemoved = evt.target;

      // Remove node from both visible and invisible graphs
      if (elementToBeRemoved.isNode()) {
        compMgrInstance.removeNode(elementToBeRemoved.id());
      } else {
        // Remove edge from both visible and invisible graphs
        compMgrInstance.removeEdge(elementToBeRemoved.id());
      }

      // Update filtered elements because removed eles may change the list
      updateFilteredElements();
    };
    var actOnReconnect = function actOnReconnect(evt) {
      var edgeToReconnect = evt.target;

      // Change the source and/or target of the edge
      compMgrInstance.reconnect(edgeToReconnect.id(), edgeToReconnect.source().id(), edgeToReconnect.target().id());

      // Update filtered elements because changed eles may change the list
      updateFilteredElements();
    };
    var actOnParentChange = function actOnParentChange(evt) {
      var nodeToChangeParent = evt.target;

      // Change the parent of the node
      compMgrInstance.changeParent(nodeToChangeParent.id(), nodeToChangeParent.parent().id());

      // Update filtered elements because changed eles may change the list
      updateFilteredElements();
    };

    // Events - register action functions to events

    // When new element(s) added
    cy.on('add', actOnAdd);

    // When some element(s) removed
    cy.on('remove', actOnRemove);

    // When source and/or target of an edge changed
    cy.on('move', 'edge', actOnReconnect);

    // When parent of a node changed
    cy.on('move', 'node', actOnParentChange);

    /** Filter related operations */

    // Keeps the IDs of the currently filtered elements
    var filteredElements = new Set();
    var getFilterRule = function getFilterRule() {
      return cy.scratch('cyComplexityManagement').options.filterRule;
    };
    var getDifference = function getDifference(setA, setB) {
      return new Set(_toConsumableArray(setA).filter(function (element) {
        return !setB.has(element);
      }));
    };
    function updateFilteredElements() {
      var filterRuleFunc = getFilterRule();
      // Keeps IDs of the new filtered elements that should be filtered based on applying filter rule
      var newFilteredElements = new Set();

      // Find elements that should be filtered, first trace currently visible elements in cy
      cy.elements().forEach(function (ele) {
        if (filterRuleFunc(ele)) {
          newFilteredElements.add(ele.id());
        }
      });

      // Then trace the temporarily removed elements
      cy.scratch('cyComplexityManagement').removedEles.forEach(function (ele) {
        if (filterRuleFunc(ele)) {
          newFilteredElements.add(ele.id());
        }
      });

      // diff between filteredElements and newFilteredElements should be removed from filteredElements
      var diffToBeUnfiltered = getDifference(filteredElements, newFilteredElements);
      diffToBeUnfiltered.forEach(function (id) {
        filteredElements.delete(id);
      });

      // diff between newFilteredElements and filteredElements should be added to filteredElements
      var diffToBeFiltered = getDifference(newFilteredElements, filteredElements);
      diffToBeFiltered.forEach(function (id) {
        filteredElements.add(id);
      });
      var edgeIDListToBeFiltered = [];
      var nodeIDListToBeUnfiltered = [];
      var edgeIDListToBeUnfiltered = [];
      diffToBeFiltered.forEach(function (id) {
        if (cy.getElementById(id).isNode()) ; else {
          edgeIDListToBeFiltered.push(id);
        }
      });
      diffToBeUnfiltered.forEach(function (id) {
        if (cy.getElementById(id).isNode()) {
          nodeIDListToBeUnfiltered.push(id);
        } else {
          edgeIDListToBeUnfiltered.push(id);
        }
      });

      // Filter toBeFiltered elements
      compMgrInstance.filter(nodeIDListToBeUnfiltered, edgeIDListToBeFiltered);

      // Unfilter toBeUnfiltered elements
      compMgrInstance.unfilter(nodeIDListToBeUnfiltered, edgeIDListToBeUnfiltered);
    }

    // API to be returned
    var api = {};
    api.getCompMgrInstance = function () {
      return compMgrInstance;
    };
    api.updateFilterRule = function (newFilterRuleFunc) {
      cy.scratch('cyComplexityManagement').options.filterRule = newFilterRuleFunc;

      // Update filtered elements based on the new filter rule
      updateFilteredElements();
    };
    return api;
  }

  function register(cytoscape) {
    // register with cytoscape.js
    cytoscape("core", "complexityManagement", function (opts) {
      var cy = this;
      var options = {
        filterRule: function filterRule(ele) {
          return false;
        }
      };

      // If opts is not 'get' that is it is a real options object then initilize the extension
      if (opts !== 'get') {
        options = extendOptions(options, opts);
        var api = complexityManagement(cy);

        // Keeps the temporarily removed elements (because of the complexity management operations)
        var tempRemovedEles = new Set();
        setScratch(cy, 'options', options);
        setScratch(cy, 'api', api);
        setScratch(cy, 'removedEles', tempRemovedEles);
      }

      // Expose the API to the users
      return getScratch(cy, 'api');
    });

    // Get the whole scratchpad reserved for this extension (on an element or core) or get a single property of it
    function getScratch(cyOrEle, name) {
      if (cyOrEle.scratch('cyComplexityManagement') === undefined) {
        cyOrEle.scratch('cyComplexityManagement', {});
      }
      var scratch = cyOrEle.scratch('cyComplexityManagement');
      var retVal = name === undefined ? scratch : scratch[name];
      return retVal;
    }

    // Set a single property on scratchpad of an element or the core
    function setScratch(cyOrEle, name, val) {
      getScratch(cyOrEle)[name] = val;
    }
    function extendOptions(options, extendBy) {
      var tempOpts = {};
      for (var key in options) {
        tempOpts[key] = options[key];
      }
      for (var key in extendBy) {
        if (tempOpts.hasOwnProperty(key)) tempOpts[key] = extendBy[key];
      }
      return tempOpts;
    }
  }
  if (typeof window.cytoscape !== 'undefined') {
    // expose to global cytoscape (i.e. window.cytoscape)
    register(window.cytoscape);
  }

  return register;

}));
