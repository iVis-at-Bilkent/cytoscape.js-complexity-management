(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, global["cytoscape-complexity-management"] = factory());
})(this, (function () { 'use strict';

  function _typeof(obj) {
    "@babel/helpers - typeof";

    return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (obj) {
      return typeof obj;
    } : function (obj) {
      return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
    }, _typeof(obj);
  }
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
    metaEdgesMap;
    edgeToMetaEdgeMap;
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
      this.metaEdgesMap = new Map();
      this.edgeToMetaEdgeMap = new Map();
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
        return sourceGraph.addEdge(newEdge, sourceNode, targetNode);
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
      if (graph.owner != this) {
        throw "Graph not in this graph mgr";
      }
      if (!(graph == this.rootGraph || graph.parent != null && graph.parent.owner.owner == this)) {
        throw "Invalid parent node!";
      }

      // first the edges (make a copy to do it safely)
      let edgesToBeRemoved = [];
      edgesToBeRemoved = edgesToBeRemoved.concat(graph.edges);
      edgesToBeRemoved.forEach(edge => {
        graph.removeEdge(edge);
      });

      // then the nodes (make a copy to do it safely)
      let nodesToBeRemoved = [];
      nodesToBeRemoved = nodesToBeRemoved.concat(graph.nodes);
      nodesToBeRemoved.forEach(node => {
        graph.removeNode(node);
      });

      // check if graph is the root
      if (graph == this.#rootGraph) {
        this.#rootGraph = null;
      }

      // now remove the graph itself
      let index = this.#graphs.indexOf(graph);
      this.#graphs.splice(index, 1);

      // also reset the parent of the graph
      graph.parent.child = null;
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
      node.edges.forEach(edge => {
        descendants.edges.add(edge);
      });
      return descendants;
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
      this.#edges.forEach(e => {
        if (e.ID == newEdge.ID) {
          throw "Edge Already Exist";
        }
      });
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
     * @param {Node} target - target node of the meta edge
     */
    constructor(source, target, originalEdges) {
      let ID = Auxiliary.createUniqueID();
      super(ID, source, target);
      this.#originalEdges = originalEdges;
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

  // Filter function
  class FilterUnfilter {
    static filter(nodeIDList, edgeIDList, visibleGM, invisibleGM) {
      // Lists to return back to api to indicate modified elements
      let nodeIDListPostProcess = [];
      let edgeIDListPostProcess = [];
      // looping through given list of edges to filter
      edgeIDList.forEach(edgeID => {
        // get edge from visible GM
        let edgeToFilter = visibleGM.edgesMap.get(edgeID);
        // if visible
        if (edgeToFilter) {
          if (visibleGM.edgesMap.has(edgeID)) {
            // delete from visible map
            visibleGM.edgesMap.delete(edgeToFilter.ID);
            // remove edge from graph of visibleGM
            Auxiliary.removeEdgeFromGraph(edgeToFilter);
          }
          //report edge as processed
          edgeIDListPostProcess.push(edgeID);
        } else {
          // edge is not visible
          // if edge is part of a meta edge
          if (visibleGM.edgeToMetaEdgeMap.has(edgeID)) {
            // get that meta edge
            let visibleMetaEdge = visibleGM.edgeToMetaEdgeMap.get(edgeID);
            // call updateMetaEdge function to check if all edges who are part of meta edge are filtered or hidden
            // if yes remove said meta edge
            let status = this.updateMetaEdge(visibleMetaEdge.originalEdges, edgeID, visibleGM, invisibleGM);
            // if yes remove said meta edge from visible graph
            if (status) {
              if (visibleGM.edgesMap.has(visibleMetaEdge.ID)) {
                // delete meta edge from visibleGM's map
                visibleGM.edgesMap.delete(visibleMetaEdge.ID);
                // Remove meta edge from graph
                Auxiliary.removeEdgeFromGraph(visibleMetaEdge);
              }
              // Report meta edge as processed
              edgeIDListPostProcess.push(visibleMetaEdge.ID);
            }
          }
        }
        // get corresponding edge in invisible side
        let edgeToFilterInvisible = invisibleGM.edgesMap.get(edgeID);
        // set filtered status to tru and visible status to false.
        if (edgeToFilterInvisible) {
          edgeToFilterInvisible.isFiltered = true;
          edgeToFilterInvisible.isVisible = false;
        }
      });
      // loop through list of nodes to filter
      nodeIDList.forEach(nodeID => {
        // get node from visible graph
        let nodeToFilter = visibleGM.nodesMap.get(nodeID);
        // if node is visible
        if (nodeToFilter) {
          // get all descendants of node to to filter, this will not include given node.
          // return object with 
          // descenedant edges as edges
          // descendant simple nodes and compound nodes as simpleNodes and compoundNodes respectively.
          let nodeToFilterDescendants = visibleGM.getDescendantsInorder(nodeToFilter);
          // loop through descendant edges
          nodeToFilterDescendants.edges.forEach(nodeToFilterEdge => {
            // report edge as processed
            edgeIDListPostProcess.push(nodeToFilterEdge.ID);
            // if edge is not a meta edge
            if (!(nodeToFilterEdge instanceof MetaEdge)) {
              // get corresponding edge on invisible side and set visible status false
              let nodeToFilterEdgeInvisible = invisibleGM.edgesMap.get(nodeToFilterEdge.ID);
              nodeToFilterEdgeInvisible.isVisible = false;
            }
            if (visibleGM.edgesMap.has(nodeToFilterEdge.ID)) {
              // delete edge from visible side
              visibleGM.edgesMap.delete(nodeToFilterEdge.ID);
              // delete edge from grpah
              Auxiliary.removeEdgeFromGraph(nodeToFilterEdge);
            }
          });
          // loop through descendant simple nodes
          nodeToFilterDescendants.simpleNodes.forEach(nodeToFilterSimpleNode => {
            // get corresponding node in invisible graph and set visible status to false
            let nodeToFilterSimpleNodeInvisible = invisibleGM.nodesMap.get(nodeToFilterSimpleNode.ID);
            nodeToFilterSimpleNodeInvisible.isVisible = false;
            // report node as processed
            nodeIDListPostProcess.push(nodeToFilterSimpleNode.ID);
            // remove node from visible graph and viisble nodes map
            nodeToFilterSimpleNode.owner.removeNode(nodeToFilterSimpleNode);
            visibleGM.nodesMap.delete(nodeToFilterSimpleNode.ID);
          });
          // loop through descendant compound nodes
          nodeToFilterDescendants.compoundNodes.forEach(nodeToFilterCompoundNode => {
            // get corresponding compound node in invisible graph and set visible status as false
            let nodeToFilterCompoundNodeInvisible = invisibleGM.nodesMap.get(nodeToFilterCompoundNode.ID);
            nodeToFilterCompoundNodeInvisible.isVisible = false;
            // report compoound node as processed
            nodeIDListPostProcess.push(nodeToFilterCompoundNode.ID);
            // if compound nodes has not child left set corresponding sibling grpah on invisible side as null.
            if (nodeToFilterCompoundNode.child.nodes.length == 0) {
              nodeToFilterCompoundNode.child.siblingGraph.siblingGraph = null;
            }
            //  remove child graph of the compound node
            visibleGM.removeGraph(nodeToFilterCompoundNode.child);
            // remove compound node from visible graph and nodes map
            nodeToFilterCompoundNode.owner.removeNode(nodeToFilterCompoundNode);
            visibleGM.nodesMap.delete(nodeToFilterCompoundNode.ID);
          });
          // if node has a child graph (meaning its a compound node) and there are not child nodes
          if (nodeToFilter.child && nodeToFilter.child.nodes.length == 0) {
            // set corresponding sibling graph on invisible side as null
            nodeToFilter.child.siblingGraph.siblingGraph = null;
          }
          // if node has a child graph (meaning its a compound node) 
          if (nodeToFilter.child) {
            // remove child graph from visible graph
            visibleGM.removeGraph(nodeToFilter.child);
          }
          // remove said node from visible graph and delete it from nodes map
          nodeToFilter.owner.removeNode(nodeToFilter);
          visibleGM.nodesMap.delete(nodeID);
          // report node as processed
          nodeIDListPostProcess.push(nodeID);
          // get corresponding node in invisible graph and set filtered status true and visible status false.
          let nodeToFilterInvisible = invisibleGM.nodesMap.get(nodeID);
          nodeToFilterInvisible.isFiltered = true;
          nodeToFilterInvisible.isVisible = false;
        } else {
          //  if node is not visible
          // get corresponding node from invisible graph and set filtered status true and visible status false
          let nodeToFilterInvisible = invisibleGM.nodesMap.get(nodeID);
          nodeToFilterInvisible.isFiltered = true;
          nodeToFilterInvisible.isVisible = false;
        }
      });
      // turn reported edge list to a set (to remove potential duplicates)
      edgeIDListPostProcess = new Set(edgeIDListPostProcess);
      edgeIDListPostProcess = [...edgeIDListPostProcess];
      // combine edgelist and nodelist and to return. (edge first and nodes latter)
      // if nodes are removed first it cause problem, so report all edges first.
      return edgeIDListPostProcess.concat(nodeIDListPostProcess);
    }

    // unfilter function
    static unfilter(nodeIDList, edgeIDList, visibleGM, invisibleGM) {
      // lists to report processed nodes and edges.
      let nodeIDListPostProcess = [];
      let edgeIDListPostProcess = [];
      // loop through nodes to unfilter
      nodeIDList.forEach(nodeID => {
        // get node from invisible graph and set filter status to false
        let nodeToUnfilter = invisibleGM.nodesMap.get(nodeID);
        nodeToUnfilter.isFiltered = false;
        // set status flag,  that node is allowed to be filtered, initalized as true
        let canNodeToUnfilterBeVisible = true;
        // if node is not hidden
        if (nodeToUnfilter.isHidden == false) {
          // create temporary copy for node to unfilter
          let tempNode = nodeToUnfilter;
          // following loop check node's parent and their parent and their parent to make sure that at all levels
          // there is nothing hiden, collapse or filtered.
          // infinite loop until we find that node can not be unfiltered or we reach root graph.
          while (true) {
            //if next owner graph is root gaph (meaning no more parents)
            if (tempNode.owner == invisibleGM.rootGraph) {
              break;
            } else {
              // there is another parent of current node 
              // check parent of current node is not hiden, collapse or filtered.
              // if no
              if (tempNode.owner.parent.isHidden || tempNode.owner.parent.isFiltered || tempNode.owner.parent.isCollapsed) {
                // if yes then node ot unfilter is not allowed to be unfiltered. and we break loop
                canNodeToUnfilterBeVisible = false;
                break;
              } else {
                // if yes then set current node to its parent to move up the ancestral line
                tempNode = tempNode.owner.parent;
              }
            }
          }
        } else {
          // if node is hidden then it can not be unfiltered
          canNodeToUnfilterBeVisible = false;
        }
        // if node is allowed to be unfiltered
        if (canNodeToUnfilterBeVisible) {
          // move node to visible along with all the associated edges that can be brought to visible side
          let tempList = Auxiliary.moveNodeToVisible(nodeToUnfilter, visibleGM, invisibleGM);
          // make all the descendants of the node to unfilter,visible. 
          //loop though edges returned
          tempList[0].forEach(item => {
            // report edge as processed (to be added)
            if (visibleGM.edgeToMetaEdgeMap.has(item)) {
              let topMetaEdge = Auxiliary.getTopMetaEdge(visibleGM.edgeToMetaEdgeMap.get(item), visibleGM);
              edgeIDListPostProcess.push(topMetaEdge.ID);
            } else {
              edgeIDListPostProcess.push(item);
            }
          });
          let descendants = [];
          if (!nodeToUnfilter.isCollapsed) {
            descendants = FilterUnfilter.makeDescendantNodesVisible(nodeToUnfilter, visibleGM, invisibleGM);
            // report all descendant edges, simple nodes and compound nodes as processed
            nodeIDListPostProcess = [...nodeIDListPostProcess, ...descendants.simpleNodes, ...descendants.compoundNodes];
            edgeIDListPostProcess = [...edgeIDListPostProcess, ...descendants.edges];
          }
          let nodeToFilterDescendants = visibleGM.getDescendantsInorder(nodeToUnfilter);
          // loop through descendant edges
          nodeToFilterDescendants.edges.forEach(nodeTounFilterEdge => {
            if (visibleGM.edgeToMetaEdgeMap.has(nodeTounFilterEdge.ID)) {
              let topMetaEdge = Auxiliary.getTopMetaEdge(visibleGM.edgeToMetaEdgeMap.get(nodeTounFilterEdge.ID), visibleGM);
              if (topMetaEdge.source.ID == nodeToUnfilter.ID || topMetaEdge.target.ID == nodeToUnfilter.ID) {
                edgeIDList.push(nodeTounFilterEdge.ID);
              }
            }
          });

          // report node its self as processed.
          nodeIDListPostProcess.push(nodeToUnfilter.ID);
        }
      });
      // loop through all the edges to unfilter
      edgeIDList.forEach(edgeID => {
        // get edge from invisible graph and set filtered status to false
        let edgeToUnfilter = invisibleGM.edgesMap.get(edgeID);
        edgeToUnfilter.isFiltered = false;
        // check if edge is part of a meta edge in visible graph
        if (visibleGM.edgeToMetaEdgeMap.has(edgeID)) {
          // get meta edge
          let visibleMetaEdge = visibleGM.edgeToMetaEdgeMap.get(edgeID);
          // if meta edge is visible
          if (visibleGM.edgesMap.has(visibleMetaEdge.ID)) ;else {
            // if meta edge is not visible get source and target of meta edge from visible graph
            let sourceInVisible = visibleGM.nodesMap.get(visibleMetaEdge.source.ID);
            let targetInVisible = visibleGM.nodesMap.get(visibleMetaEdge.target.ID);
            // if source and target are visible
            if (sourceInVisible != undefined && targetInVisible != undefined) {
              // get corresponding invisible edge for the orignal edge to unfilter
              let invisibleEdge = invisibleGM.edgesMap.get(edgeID);
              // if source and target of invisible side edge has same owner graph (meaning they belong in same graph and edge is not inter graph edge)
              if (invisibleEdge.source.owner == invisibleEdge.target.owner) {
                // add meta edge to the sibling side of the invisible edge's owner graph. (doing it from invisible side because there is no way to access visible graph directly)
                // (the meta edge we have is not part of any graph.)
                invisibleEdge.source.owner.siblingGraph.addEdge(visibleMetaEdge, sourceInVisible, targetInVisible);
              } else {
                // if source and target of invisible side edge does not has same owner graph (meaning it will be inter graph edge)
                // add meta edge as inter graph edge
                visibleGM.addInterGraphEdge(visibleMetaEdge, sourceInVisible, targetInVisible);
              }
              //  add meta edge to visible graphs edge map (to bring it to visible side)
              visibleGM.edgesMap.set(visibleMetaEdge.ID, visibleMetaEdge);
              // report meta edge as processed.
              edgeIDListPostProcess.push(visibleMetaEdge.ID);
            }
          }
        } else {
          // if edge is not part of any meta edge
          // check if edge is not hidden and source and target of edge are visible
          // if yes
          if (edgeToUnfilter.isHidden == false && edgeToUnfilter.source.isVisible && edgeToUnfilter.target.isVisible) {
            // bring edge to visible side
            Auxiliary.moveEdgeToVisible(edgeToUnfilter, visibleGM, invisibleGM);
            // report edge as processed.
            edgeIDListPostProcess.push(edgeToUnfilter.ID);
          }
        }
      });
      // create set of the prcessed edge (to remove duplications)
      edgeIDListPostProcess = new Set(edgeIDListPostProcess);
      // turn set back to array
      edgeIDListPostProcess = [...edgeIDListPostProcess];
      // combine node and edge list.
      // report nodes first then edges
      // (if edges are reported first they will be added first and without source and target nodes present cytoscpae will give error) 
      return nodeIDListPostProcess.concat(edgeIDListPostProcess);
    }

    // function to make all descendants of a compound node visible and report all the procesed descendants.
    static makeDescendantNodesVisible(nodeToUnfilter, visibleGM, invisibleGM) {
      // reproting object for descendants
      let descendants = {
        edges: new Set(),
        simpleNodes: [],
        compoundNodes: []
      };
      // chec if given node has child graph (meaning it is a compound node)
      if (nodeToUnfilter.child) {
        // get descendant nodes for the child graph
        let nodeToUnfilterDescendants = nodeToUnfilter.child.nodes;
        // loop through descendant nodes
        nodeToUnfilterDescendants.forEach(descendantNode => {
          // check if decendant node is not filterted and not hidden 
          if (descendantNode.isFiltered == false && descendantNode.isHidden == false) {
            // move descendant node to visible and all its incident edges
            let tempList = Auxiliary.moveNodeToVisible(descendantNode, visibleGM, invisibleGM);
            tempList[0].forEach(item => {
              // report edge as processed (to be added)
              descendants.edges.add(item);
            });
            // check if desndant node is not collapsed
            if (descendantNode.isCollapsed == false) {
              // recall this function for decendant node to get all its descendants (recursion goes until there are not more descendants) 
              let childDescendents = this.makeDescendantNodesVisible(descendantNode, visibleGM, invisibleGM);
              // loop through keys of reported child descendant object and combine values for each keys
              for (var id in childDescendents) {
                descendants[id] = [...(descendants[id] || []), ...childDescendents[id]];
              }
              // above combination convered set of the edges key to an array, so convert it back to set (removed possible duplications)
              descendants['edges'] = new Set(descendants['edges']);
              // if descendant node has child graph (meaning it is a compound node)
              if (descendantNode.child) {
                // report it as compound node
                descendants.compoundNodes.push(descendantNode.ID);
              } else {
                // report it as simple node
                descendants.simpleNodes.push(descendantNode.ID);
              }
              // get incident endge of descendant node
              let nodeEdges = descendantNode.edges;
              // loop through edges
              nodeEdges.forEach(item => {
                // if edge is not filtered or hidded and source and target both are visible report it
                if (item.isFiltered == false && item.isHidden == false && item.source.isVisible && item.target.isVisible) {
                  // report edge
                  descendants['edges'].add(item.ID);
                }
              });
            }
          }
        });
      }
      // loop thorugh incident endge of node to unfilter
      nodeToUnfilter.edges.forEach(edge => {
        // if edge is not filtered or hidded and source and target both are visible report it
        if (edge.isFiltered == false && edge.isHidden == false && edge.source.isVisible && edge.target.isVisible) {
          // report edge
          descendants.edges.add(edge.ID);
        }
      });
      // report decendant object
      return descendants;
    }
    // Function to check how to update the meta edge (wether to keep it or not)
    //check if orignal edges, has an egde who is is not filtered and not hidden other than target itself 
    // if yes keep meta edge else remove meta edge
    // Return False to report meta edge to be kept,
    // Returns True to  report meta edge to be removed,
    static updateMetaEdge(nestedEdges, targetEdgeID, visibleGM, invisibleGM) {
      // initally assuming all orignal edges are either filtered or hidden and meta edge needs to be deleted
      let status = true;
      // loop through given edge IDs
      nestedEdges.forEach((nestedEdgeID, index) => {
        // if edge ID is a meta edge ID
        if (visibleGM.metaEdgesMap.has(nestedEdgeID)) {
          // get that meta edge object
          let nestedEdge = visibleGM.metaEdgesMap.get(nestedEdgeID);
          // recall the function for this meta edge's orignal ends
          let update = this.updateMetaEdge(nestedEdge.originalEdges, targetEdgeID, visibleGM, invisibleGM);
          // combine the result from above with current one.
          // if one of them is false at any point it will become false
          status = update == false ? update : status;
        } else {
          // if edge ID is not a meta edge
          // get the simple edge from invisible graph (as this edge is part of a meta edge it will not be on visible graph)
          let nestedEdge = invisibleGM.edgesMap.get(nestedEdgeID);
          //  check if invisible edge is not filtered and not hidded and is not the given target.
          if (nestedEdge?.isFiltered == false && nestedEdge?.isHidden == false && nestedEdgeID != targetEdgeID) {
            // report meta edge to be kept. (there is an edge which fulfil requirement so we keep initial meta edge)
            status = false;
          }
        }
      });
      // return status
      return status;
    }
  }
  class Topology {
    static addNode(nodeID, parentID, visibleGM, invisibleGM) {
      let graphToAdd;
      let graphToAddInvisible;
      if (parentID) {
        // we add new node as a child node
        let parentNode = visibleGM.nodesMap.get(parentID); // we can keep an id -> node map to get the node in constant time
        if (parentNode.child) {
          graphToAdd = parentNode.child;
        } else {
          graphToAdd = visibleGM.addGraph(new Graph(null, visibleGM), parentNode);
        }
      } else {
        // new node is a top-level node
        graphToAdd = visibleGM.rootGraph;
      }
      let node = new Node(nodeID);
      graphToAdd.addNode(node);
      visibleGM.nodesMap.set(nodeID, node);
      // add new node to the invisible graph as well
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
      //get nodes from visible and invisible Graph Managers
      let sourceNode = visibleGM.nodesMap.get(sourceID);
      let targetNode = visibleGM.nodesMap.get(targetID);
      let sourceNodeInvisible = invisibleGM.nodesMap.get(sourceID);
      let targetNodeInvisible = invisibleGM.nodesMap.get(targetID);
      let edge;
      //create edge for visible and invisible Graph Managers
      if (sourceNode != undefined && targetNode != undefined) {
        edge = new Edge(edgeID, sourceNode, targetNode);
      }
      let edgeInvisible = new Edge(edgeID, sourceNodeInvisible, targetNodeInvisible);
      //if source and target owner graph is same (its an intra graph edge), then add the viible and invisible edges to the source owner
      if (sourceNodeInvisible.owner === targetNodeInvisible.owner) {
        if (sourceNode != undefined && targetNode != undefined) {
          sourceNode.owner.addEdge(edge, sourceNode, targetNode);
        }
        sourceNodeInvisible.owner.addEdge(edgeInvisible, sourceNodeInvisible, targetNodeInvisible);
      } else {
        //add inter graph edges
        if (sourceNode != undefined && targetNode != undefined) {
          visibleGM.addInterGraphEdge(edge, sourceNode, targetNode);
        }
        invisibleGM.addInterGraphEdge(edgeInvisible, sourceNodeInvisible, targetNodeInvisible);
      }
      //add edge id to edgesMap of visible and invisible Graph Managers
      if (sourceNode != undefined && targetNode != undefined) {
        visibleGM.edgesMap.set(edgeID, edge);
      }
      invisibleGM.edgesMap.set(edgeID, edgeInvisible);
    }
    static addMetaEdge(sourceID, targetID, orignalEnds, visibleGM, invisibleGM) {
      //get nodes from visible graph manager
      let sourceNode = visibleGM.nodesMap.get(sourceID);
      let targetNode = visibleGM.nodesMap.get(targetID);
      let metaEdge;
      //create edge for visible and invisible Graph Managers
      if (sourceNode != undefined && targetNode != undefined) {
        metaEdge = new MetaEdge(sourceNode, targetNode, orignalEnds);
        visibleGM.metaEdgesMap.set(metaEdge.ID, metaEdge);
        orignalEnds.forEach(edgeID => {
          visibleGM.edgeToMetaEdgeMap.set(edgeID, metaEdge);
        });
      }
      //if source and target owner graph is same (its an intra graph edge), then add the viible and invisible edges to the source owner
      if (sourceNode.owner === targetNode.owner) {
        if (sourceNode != undefined && targetNode != undefined) {
          sourceNode.owner.addEdge(metaEdge, sourceNode, targetNode);
        }
      } else {
        //add inter graph edges
        if (sourceNode != undefined && targetNode != undefined) {
          visibleGM.addInterGraphEdge(metaEdge, sourceNode, targetNode);
        }
      }
      //add edge id to edgesMap of visible graph manager
      if (sourceNode != undefined && targetNode != undefined) {
        visibleGM.edgesMap.set(metaEdge.ID, metaEdge);
      }
      return metaEdge;
    }
    static removeNestedEdges(nestedEdges, visibleGM, invisibleGM) {
      //loop through the list of nested edges
      nestedEdges.forEach(edgeInInvisibleItem => {
        // nested edge is an id and not a another meta edge
        if (visibleGM.metaEdgesMap.has(edgeInInvisibleItem)) {
          //recursively passing the nested edge
          let metaEdge = visibleGM.metaEdgesMap.get(edgeInInvisibleItem);
          Topology.removeNestedEdges(metaEdge.originalEdges, visibleGM, invisibleGM);
          visibleGM.metaEdgesMap.delete(edgeInInvisibleItem);
        } else {
          let edgeInInvisible = invisibleGM.edgesMap.get(edgeInInvisibleItem);
          invisibleGM.edgesMap.delete(edgeInInvisible.ID);
          Auxiliary.removeEdgeFromGraph(edgeInInvisible);
        }
      });
    }
    static recursivelyRemoveDescendantEdges(originalEdges, visibleGM, invisibleGM) {
      originalEdges.forEach(edgeID => {
        let edgeToRemove = visibleGM.edgesMap.get(edgeID);
        let edgeToRemoveInvisible = invisibleGM.edgesMap.get(edgeID);
        if (visibleGM.metaEdgesMap.has(edgeID)) {
          edgeToRemove = visibleGM.metaEdgesMap.get(edgeID);
          // delete from visible map
          visibleGM.edgesMap.delete(edgeToRemove.ID);
          visibleGM.metaEdgesMap.delete(edgeToRemove.ID);
          // remove edge from graph of visibleGM
          try {
            Auxiliary.removeEdgeFromGraph(edgeToRemove);
          } catch (e) {
            console.log(e);
          }
          if (visibleGM.edgeToMetaEdgeMap.has(edgeToRemove.ID)) {
            visibleGM.edgeToMetaEdgeMap.delete(edgeToRemove.ID);
          }
          this.recursivelyRemoveDescendantEdges(edgeToRemove.originalEdges, visibleGM, invisibleGM);
        } else if (visibleGM.edgesMap.has(edgeID)) {
          // delete from visible map
          visibleGM.edgesMap.delete(edgeToRemove.ID);
          // remove edge from graph of visibleGM
          try {
            Auxiliary.removeEdgeFromGraph(edgeToRemove);
          } catch (e) {
            console.log(e);
          }
          //remove edge from the invisible graph
          invisibleGM.edgesMap.delete(edgeToRemoveInvisible.ID);
          try {
            Auxiliary.removeEdgeFromGraph(edgeToRemoveInvisible);
          } catch (e) {
            console.log(e);
          }
        } else {
          if (visibleGM.edgeToMetaEdgeMap.has(edgeID)) {
            visibleGM.edgeToMetaEdgeMap.delete(edgeID);
          }
          //remove edge from the invisible graph
          invisibleGM.edgesMap.delete(edgeToRemoveInvisible.ID);
          try {
            Auxiliary.removeEdgeFromGraph(edgeToRemoveInvisible);
          } catch (e) {
            console.log(e);
          }
        }
      });
    }
    static removeEdge(edgeID, visibleGM, invisibleGM) {
      //get edges
      let edgeToRemove = visibleGM.edgesMap.get(edgeID);
      let edgeToRemoveInvisible = invisibleGM.edgesMap.get(edgeID);
      if (edgeToRemove) {
        //if edge exisit in the visible graph
        if (visibleGM.metaEdgesMap.has(edgeID)) {
          edgeToRemove = Auxiliary.getTopMetaEdge(edgeToRemove, visibleGM);
          // delete from visible map
          visibleGM.edgesMap.delete(edgeToRemove.ID);
          visibleGM.metaEdgesMap.delete(edgeToRemove.ID);
          // remove edge from graph of visibleGM
          Auxiliary.removeEdgeFromGraph(edgeToRemove);
          if (visibleGM.edgeToMetaEdgeMap.has(edgeToRemove.ID)) {
            visibleGM.edgeToMetaEdgeMap.delete(edgeToRemove.ID);
          }
          this.recursivelyRemoveDescendantEdges(edgeToRemove.originalEdges, visibleGM, invisibleGM);
        } else if (visibleGM.edgesMap.has(edgeID)) {
          // delete from visible map
          visibleGM.edgesMap.delete(edgeToRemove.ID);
          // remove edge from graph of visibleGM
          Auxiliary.removeEdgeFromGraph(edgeToRemove);

          //remove edge from the invisible graph
          invisibleGM.edgesMap.delete(edgeToRemoveInvisible.ID);
          Auxiliary.removeEdgeFromGraph(edgeToRemoveInvisible);
        }
      } else {
        if (visibleGM.edgeToMetaEdgeMap.has(edgeID)) {
          Auxiliary.recursiveMetaEdgeUpdate(edgeToRemoveInvisible, visibleGM);
        }
        //remove edge from the invisible graph
        invisibleGM.edgesMap.delete(edgeToRemoveInvisible.ID);
        Auxiliary.removeEdgeFromGraph(edgeToRemoveInvisible);
      }
    }
    static removeNode(nodeID, visibleGM, invisibleGM) {
      //get node objects from nodesMap from visible and invisible graph managers
      let nodeToRemove = visibleGM.nodesMap.get(nodeID);
      let nodeToRemoveInvisible = invisibleGM.nodesMap.get(nodeID);
      if (nodeToRemove) {
        //node might not be in the visible graph
        // Removing nodes from Visible Graph Manager
        let nodeToRemoveDescendants = visibleGM.getDescendantsInorder(nodeToRemove); //get list of descendants
        //looping through descendant edges
        nodeToRemoveDescendants.edges.forEach(nodeToRemoveEdge => {
          //removing edge
          Topology.removeEdge(nodeToRemoveEdge.ID, visibleGM, invisibleGM);
        });
        //looping through descendant simpleNodes
        nodeToRemoveDescendants.simpleNodes.forEach(nodeToRemoveSimpleNode => {
          nodeToRemoveSimpleNode.owner.removeNode(nodeToRemoveSimpleNode);
          visibleGM.nodesMap.delete(nodeToRemoveSimpleNode.ID);
        });
        //looping through descendant compoundNodes
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
        //removing nodes from visible and invisible graph managers and nodes maps
        nodeToRemove.owner.removeNode(nodeToRemove);
        visibleGM.nodesMap.delete(nodeID);
        nodeToRemoveInvisible.owner.removeNode(nodeToRemoveInvisible);
        invisibleGM.nodesMap.delete(nodeID);
      } else {
        //remove node from invisible graph manager
        if (nodeToRemoveInvisible) {
          nodeToRemoveInvisible.owner.removeNode(nodeToRemoveInvisible);
          invisibleGM.nodesMap.delete(nodeID);
        }
      }
      //reemoving graphs from visible and invisible graph managers if they have no nodes
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
      //get edge from visible graph
      let edgeToRemove = visibleGM.edgesMap.get(edgeID);
      //check if source is given
      if (newSourceID == undefined) {
        newSourceID = edgeToRemove.source.ID;
      }
      //check if target is given
      else if (newTargetID == undefined) {
        newTargetID = edgeToRemove.target.ID;
      }
      //remove existing edge from visible graph
      if (edgeToRemove) {
        visibleGM.edgesMap.delete(edgeToRemove.ID);
        Auxiliary.removeEdgeFromGraph(edgeToRemove);
      }
      //get edge from invisible graph
      let edgeToRemoveInvisible = invisibleGM.edgesMap.get(edgeID);
      //create a new edge to add between new source and target and copy values of inVisible and isHidden
      let edgeToAddForInvisible = new Edge(edgeID, newSourceID, newTargetID);
      edgeToAddForInvisible.isVisible = edgeToRemoveInvisible.isVisible;
      edgeToAddForInvisible.isHidden = edgeToRemoveInvisible.isHidden;
      Auxiliary.removeEdgeFromGraph(edgeToRemoveInvisible);
      //checking if new edge is to be visible or not
      if (edgeToAddForInvisible.isFiltered == false && edgeToAddForInvisible.isHidden == false && visibleGM.nodesMap.get(newSourceID).isVisible && visibleGM.nodesMap.get(newTargetID).isVisible) {
        edgeToAddForInvisible.isVisible = true;
      } else {
        edgeToAddForInvisible.isVisible = false;
      }
      //if new edge is visible , add the edge to visible graph
      if (edgeToAddForInvisible.isVisible == true) {
        Topology.addEdge(edgeID, newSourceID, newTargetID, visibleGM, invisibleGM);
      } else {
        //add edge to invisble graph
        if (edgeToAddForInvisible.source.owner == edgeToAddForInvisible.target.owner) {
          edgeToAddForInvisible.source.owner.addEdge(edgeToAddForInvisible, edgeToAddForInvisible.source, edgeToAddForInvisible.target);
        }
        //add inter graph edge invisible graph
        else {
          invisibleGM.addInterGraphEdge(edgeToAddForInvisible, edgeToAddForInvisible.source, edgeToAddForInvisible.target);
        }
      }
    }
    static changeParent(nodeID, newParentID, visibleGM, invisibleGM) {
      //get node from visible graph
      let nodeToRemove = visibleGM.nodesMap.get(nodeID);
      let edgesOfNodeToRemove = [...nodeToRemove.edges];
      if (nodeToRemove) {
        //node might not be in visible graph
        //get new parent node from visible graph
        let newParent = visibleGM.nodesMap.get(newParentID);
        if (newParent == undefined) {
          //if parent is not defined, parent is the root
          newParent = visibleGM.rootGraph.parent;
        }
        let removedNode = nodeToRemove.owner.removeNode(nodeToRemove); //remove the node
        if (newParent.child == undefined) {
          //if new parent doesnot has the child graph add the graph
          visibleGM.addGraph(new Graph(null, visibleGM), newParent);
        }
        //add the node to new parent node's child graph
        newParent.child.addNode(removedNode);
      }
      //same things for invisible graph
      let nodeToRemoveInvisible = invisibleGM.nodesMap.get(nodeID);
      let newParentInInvisible = invisibleGM.nodesMap.get(newParentID);
      if (newParentInInvisible == undefined) {
        newParentInInvisible = invisibleGM.rootGraph.parent;
      }
      let removedNodeInvisible = nodeToRemoveInvisible.owner.removeNode(nodeToRemoveInvisible);
      if (newParentInInvisible.child == undefined) {
        invisibleGM.addGraph(new Graph(null, invisibleGM), newParentInInvisible);
      }
      newParentInInvisible.child.addNode(removedNodeInvisible);
      edgesOfNodeToRemove.forEach(edge => {
        Topology.addEdge(edge.ID, edge.source.ID, edge.target.ID, visibleGM, invisibleGM);
        if (edge.source.isVisible && edge.target.isVisible) {
          let newEdge = invisibleGM.edgesMap.get(edge.ID);
          newEdge.isVisible = false;
        }
      });
    }
  }
  class ExpandCollapse {
    // create static objects to report elements to be removed
    static removedElements = {
      nodeIDListForInvisible: new Set(),
      edgeIDListForInvisible: new Set(),
      metaEdgeIDListForVisible: new Set()
    };
    // create static objects to report elements to be added
    static addedElements = {
      nodeIDListForVisible: new Set(),
      edgeIDListForVisible: new Set(),
      metaEdgeIDListForVisible: new Set(),
      edgeIDListToRemove: new Set()
    };
    //Double Recursive Solution 
    // collpase node function
    static #collapseNode(node, visibleGM, invisibleGM) {
      //first process the visible graph
      // traverse descdents and get list of nodes, edges and meta edges
      let [nodeIDListForInvisible, edgeIDListForInvisible, metaEdgeIDListForVisible] = this.traverseDescendants(node, node, visibleGM, invisibleGM);
      //  remove child graph of given node 
      visibleGM.removeGraph(node.child);
      // loop through descendant nodes
      nodeIDListForInvisible.forEach(nodeID => {
        // delete each descendant node from nodes map of visible graph.
        visibleGM.nodesMap.delete(nodeID);
      });
      // loop through descendant edges
      edgeIDListForInvisible.forEach(edgeID => {
        // delete each descendant edge from edges map of visible graph.
        let tempEdge = visibleGM.edgesMap.get(edgeID);
        visibleGM.edgesMap.delete(edgeID);
        try {
          Auxiliary.removeEdgeFromGraph(tempEdge);
        } catch (e) {
          console.log(e);
        }
      });
      // get corresponding node from invisible graph and set is collapsed flag true
      let nodeInInvisible = invisibleGM.nodesMap.get(node.ID);
      nodeInInvisible.isCollapsed = true;
      // loop through descendant nodes
      nodeIDListForInvisible.forEach(nodeIDInvisible => {
        // get corresponding node from invisible graph and set is visible flag false
        nodeInInvisible = invisibleGM.nodesMap.get(nodeIDInvisible);
        nodeInInvisible.isVisible = false;
      });
      // loop through descendant edges
      edgeIDListForInvisible.forEach(edgeIDInvisible => {
        // get corresponding edge from invisible graph and set is visible flag false
        let edgeInInvisible = invisibleGM.edgesMap.get(edgeIDInvisible);
        if (edgeInInvisible) {
          edgeInInvisible.isVisible = false;
        }
      });
      // loop through descendant nodes and report node to be removed
      nodeIDListForInvisible.forEach(item => this.removedElements.nodeIDListForInvisible.add(item));
      // loop through descendant edges and report edge to be removed
      edgeIDListForInvisible.forEach(item => this.removedElements.edgeIDListForInvisible.add(item));
      // loop through descendant meta edge and report meta edge to be added (brought back to visible)
      this.removedElements.metaEdgeIDListForVisible.add(metaEdgeIDListForVisible);
    }

    // traverse function for compound node and report all descendant nodes, edges and meta edges.
    static traverseDescendants(node, nodeToBeCollapsed, visibleGM, invisibleGM) {
      // iniailize arrays to report descendant nodes (to be removed), edges (to be removed) and meta edges (to be added) as processed
      let nodeIDListForInvisible = [];
      let edgeIDListForInvisible = [];
      let metaEdgeIDListForVisible = [];
      // if node has a child graph (node is a compound node)
      if (node.child) {
        // get nodes from child graph, call them childrenNodes
        let childrenNodes = node.child.nodes;
        // loop through childrenNodes
        childrenNodes.forEach(child => {
          // report child node as processed
          nodeIDListForInvisible.push(child.ID);
          // loop thorugh incident edges of child Nodes
          let edgesToBeProcessed = [...child.edges];
          edgesToBeProcessed.forEach(childEdge => {
            //  check if child edge is not a meta edge
            if (!(childEdge instanceof MetaEdge)) {
              // report child edge as edge (to be removed) as processed
              edgeIDListForInvisible.push(childEdge.ID);
            } else {
              // report child edge as meta edge (to be added) as processed
              visibleGM.edgesMap.delete(childEdge.ID);
            }
            // if child Edge is an inter graph edge
            if (childEdge.isInterGraph) {
              //initalize flag for meta edge to be created 
              let metaEdgeToBeCreated;
              // if child  is the source of child edge.
              if (childEdge.source == child) {
                // check if meta edge needs to be created or not
                metaEdgeToBeCreated = this.incidentEdgeIsOutOfScope(invisibleGM.nodesMap.get(childEdge.target.ID), invisibleGM.nodesMap.get(nodeToBeCollapsed.ID), invisibleGM);
                if (metaEdgeToBeCreated && visibleGM.metaEdgesMap.has(childEdge.ID)) {
                  if (childEdge.originalEdges.length == 1) {
                    metaEdgeToBeCreated = false;
                    let originalEnds = [...childEdge.originalEdges];
                    let target = childEdge.target;
                    // report child edge (to be removed) as processed
                    edgeIDListForInvisible.push(childEdge.ID);
                    if (visibleGM.edgesMap.has(childEdge.ID)) {
                      visibleGM.edgesMap.delete(childEdge.ID);
                      // remove edge from visible graph and visible edges map
                      Auxiliary.removeEdgeFromGraph(childEdge);
                    }
                    visibleGM.metaEdgesMap.delete(childEdge.ID);
                    originalEnds.forEach(end => {
                      visibleGM.edgeToMetaEdgeMap.delete(end);
                    });
                    let newMetaEdge = Topology.addMetaEdge(nodeToBeCollapsed.ID, target.ID, originalEnds, visibleGM, invisibleGM);
                    // report meta edge as processed in the form of object with ID, sourceID, targetID
                    metaEdgeIDListForVisible.push({
                      ID: newMetaEdge.ID,
                      sourceID: newMetaEdge.source.ID,
                      targetID: newMetaEdge.target.ID,
                      size: newMetaEdge.originalEdges.length,
                      compound: 'T'
                    });
                  }
                }
                // if meta edge is to be created
                if (metaEdgeToBeCreated) {
                  if (visibleGM.metaEdgesMap.get(childEdge.ID)) {
                    Auxiliary.removeEdgeFromGraph(childEdge);
                  }
                  // create new meta edge between node to collapse and the other target of child edge (because child is the source so we replce it with node to be collapsed)
                  let newMetaEdge = Topology.addMetaEdge(nodeToBeCollapsed.ID, childEdge.target.ID, [childEdge.ID], visibleGM, invisibleGM);
                  // report meta edge as processed in the form of object with ID, sourceID, targetID
                  metaEdgeIDListForVisible.push({
                    ID: newMetaEdge.ID,
                    sourceID: newMetaEdge.source.ID,
                    targetID: newMetaEdge.target.ID,
                    size: newMetaEdge.originalEdges.length,
                    compound: 'T'
                  });
                }
              } else {
                // if child  is the target of child edge.
                // check if meta edge needs to be created or not
                metaEdgeToBeCreated = this.incidentEdgeIsOutOfScope(invisibleGM.nodesMap.get(childEdge.source.ID), invisibleGM.nodesMap.get(nodeToBeCollapsed.ID), invisibleGM);
                if (metaEdgeToBeCreated && visibleGM.metaEdgesMap.has(childEdge.ID)) {
                  if (childEdge.originalEdges.length == 1) {
                    metaEdgeToBeCreated = false;
                    let originalEnds = [...childEdge.originalEdges];
                    let source = childEdge.source;
                    // report child edge (to be removed) as processed
                    edgeIDListForInvisible.push(childEdge.ID);
                    if (visibleGM.edgesMap.has(childEdge.ID)) {
                      visibleGM.edgesMap.delete(childEdge.ID);
                      // remove edge from visible graph and visible edges map
                      Auxiliary.removeEdgeFromGraph(childEdge);
                    }
                    visibleGM.metaEdgesMap.delete(childEdge.ID);
                    originalEnds.forEach(end => {
                      visibleGM.edgeToMetaEdgeMap.delete(end);
                    });
                    let newMetaEdge = Topology.addMetaEdge(source.ID, nodeToBeCollapsed.ID, originalEnds, visibleGM, invisibleGM);
                    // report meta edge as processed in the form of object with ID, sourceID, targetID
                    metaEdgeIDListForVisible.push({
                      ID: newMetaEdge.ID,
                      sourceID: newMetaEdge.source.ID,
                      targetID: newMetaEdge.target.ID,
                      size: newMetaEdge.originalEdges.length,
                      compound: 'T'
                    });
                  }
                }
                // if meta edge is to be created
                if (metaEdgeToBeCreated) {
                  if (visibleGM.metaEdgesMap.get(childEdge.ID)) {
                    Auxiliary.removeEdgeFromGraph(childEdge);
                  }
                  // create new meta edge between node to collapse and the other source of child edge (because child is the target so we replce it with node to be collapsed)
                  let newMetaEdge = Topology.addMetaEdge(childEdge.source.ID, nodeToBeCollapsed.ID, [childEdge.ID], visibleGM, invisibleGM);
                  // report meta edge as processed in the form of object with ID, sourceID, targetID
                  metaEdgeIDListForVisible.push({
                    ID: newMetaEdge.ID,
                    sourceID: newMetaEdge.source.ID,
                    targetID: newMetaEdge.target.ID,
                    size: newMetaEdge.originalEdges.length,
                    compound: 'T'
                  });
                }
              }
            }
          });
          // pass child back to the function to go through its descendants and report all the elements
          let [nodeIDsReturned, edgeIDsReturned, metaEdgeIDsReturned] = this.traverseDescendants(child, nodeToBeCollapsed, visibleGM, invisibleGM);
          // combine reproted nodes , edges and meta edges with the orignal ones.
          nodeIDListForInvisible = [...nodeIDListForInvisible, ...nodeIDsReturned];
          edgeIDListForInvisible = [...edgeIDListForInvisible, ...edgeIDsReturned];
          metaEdgeIDListForVisible = [...metaEdgeIDListForVisible, ...metaEdgeIDsReturned];
        });
      }
      // return arrays of nodes, edges and meta edges processed.
      return [nodeIDListForInvisible, edgeIDListForInvisible, metaEdgeIDListForVisible];
    }

    //function to check of two given nodes are part of the different graph structure or not.
    // if yes return true else false
    static incidentEdgeIsOutOfScope(interGraphEdgeTarget, nodeToBeCollapsed, invisibleGM) {
      // check if given target node is in root graph then return true.
      if (interGraphEdgeTarget.owner == invisibleGM.rootGraph) {
        return true;
      } //if parent of given node is node to be collapsed then false
      else if (interGraphEdgeTarget.owner.parent == nodeToBeCollapsed) {
        return false;
      } // last check parent and node to be collapsed are not in same structure, can be sibling or not  
      else {
        // recall the fuction and pass parent of target and node to be collapsed.
        return this.incidentEdgeIsOutOfScope(interGraphEdgeTarget.owner.parent, nodeToBeCollapsed, invisibleGM);
      }
    }

    /*
    (Does not work and not data being returned.)
    //-----------------------------------------------
    //Iterative Collapse Soltion 
    //-------------------------------------------------
    static #collapseNode(node, visibleGM, invisibleGM) {
     let nodeIDListForInvisible = [];
     let edgeIDListForInvisible = [];
     //first process the visible graph
     let descendantNodes = this.getDescendantNodes(node);
     descendantNodes.forEach(childNode => {
       nodeIDListForInvisible.push(childNode.ID);
       childNode.edges.forEach(childEdge => {
         edgeIDListForInvisible.push(childEdge.ID);
         if (childEdge.isInterGraph) {
           let metaEdgeToBeCreated;
           if (childEdge.source == childNode) {
             metaEdgeToBeCreated = [...descendantNodes, node].includes(childEdge.target);
             if (metaEdgeToBeCreated) {
               Topology.addEdge(childEdge.ID, node.ID, childEdge.target.ID, visibleGM, invisibleGM);
             }
            }
            else {
              metaEdgeToBeCreated = [...descendantNodes, node].includes(childEdge.source);
              if (metaEdgeToBeCreated) {
                Topology.addEdge(childEdge.ID, childEdge.source.ID, node.ID, visibleGM, invisibleGM);
              }
            }
         }
         visibleGM.edgesMap.delete(childEdge.ID);
       });
     });
       visibleGM.removeGraph(node.child);
     descendantNodes.forEach(node => {
       visibleGM.nodesMap.delete(node.ID)
     });
     let nodeInInvisible = invisibleGM.nodesMap.get(node.ID);
     nodeInInvisible.isCollapsed = true;
       nodeIDListForInvisible.forEach(nodeIDInvisible => {
       nodeInInvisible = invisibleGM.nodesMap.get(nodeIDInvisible);
       nodeInInvisible.isVisible = false;
     });
       edgeIDListForInvisible.forEach(edgeIDInvisible => {
       let edgeInInvisible = invisibleGM.edgesMap.get(edgeIDInvisible);
       edgeInInvisible.isVisible = false;
     });
    }
    */

    //  expand node function to expand a given node

    static #expandNode(node, isRecursive, visibleGM, invisibleGM, nodeToBeExpanded = undefined) {
      // get node from invisible graph
      let nodeInInvisible = invisibleGM.nodesMap.get(node.ID);
      if (nodeInInvisible.isCollapsed) {
        // create new grah in visible  graph as child of given node
        let newVisibleGraph = visibleGM.addGraph(new Graph(null, visibleGM), node);
        // set sibling graph pointers, pointing each other
        nodeInInvisible.child.siblingGraph = newVisibleGraph;
        newVisibleGraph.siblingGraph = nodeInInvisible.child;
        // set is collapsed flag fro invisible node false
        nodeInInvisible.isCollapsed = false;
      }

      // get childre from invisible node's child graph.
      let childrenNodesTemp = nodeInInvisible.child.nodes;
      let childrenNodesCompound = childrenNodesTemp.filter(child => child.child ? true : false);
      let childrenNodesSimple = childrenNodesTemp.filter(child => child.child ? false : true);
      let childrenNodes = [...childrenNodesCompound, ...childrenNodesSimple];
      let markCollapsedCompoundChildren = [];
      // loop through children
      childrenNodes.forEach(child => {
        // if child is collapsed and not filtered and not hidden and recussion is true (meaning collapsed child with recusion)
        // or if child is not collapsed and not filtered and not hidden (meaning no recurrion and child not collapsed)
        if (child.isCollapsed && isRecursive && !child.isFiltered && !child.isHidden || !child.isCollapsed && !child.isFiltered && !child.isHidden) {
          // bring child back to visible and all its incident edges and meta ednges
          //returns list of edges and meta edges brought back to visible graph( structure : [[edges],[meta-edges]])
          let tempList = Auxiliary.moveNodeToVisible(child, visibleGM, invisibleGM, nodeToBeExpanded == undefined ? node : nodeToBeExpanded);
          //loop though edges returned
          tempList[0].forEach(item => {
            // report edge as processed (to be added)
            try {
              this.addedElements.edgeIDListForVisible.add(item);
            } catch (e) {
              console.log(e);
            }
          });
          let tempArr = [...this.addedElements.edgeIDListForVisible].filter(edgeID => visibleGM.edgesMap.has(edgeID));
          this.addedElements.edgeIDListForVisible = new Set(tempArr);
          // loop through meta edges to be removed
          tempList[1].forEach(item => {
            // report meta edge as parocessed (to be removed)
            try {
              this.addedElements.edgeIDListToRemove.add(item.ID);
            } catch (e) {
              console.log(e);
            }
            let tempArr = [...this.addedElements.metaEdgeIDListForVisible].filter(mEdge => {
              if (mEdge.ID == item.ID) {
                return false;
              } else {
                return true;
              }
            });
            this.addedElements.metaEdgeIDListForVisible = new Set(tempArr);
          });
          // loop through meta edges to be added
          tempList[2].forEach(item => {
            // report meta edge as parocessed (to be removed)
            this.addedElements.metaEdgeIDListForVisible.add(item);
          });
          //  report child node as processed (to be added)
          this.addedElements.nodeIDListForVisible.add(child.ID);
          // if child node has a child graph (meaning it is compound node)
          if (child.child) {
            // add child node to the visible graph's nodes map
            let newNode = visibleGM.nodesMap.get(child.ID);
            //  recursively call the expansion of this child node (as it is compound node and recurssion is true)
            this.#expandNode(newNode, isRecursive, visibleGM, invisibleGM, node);
          }
        } else if (child.isCollapsed && !isRecursive && !child.isFiltered && !child.isHidden) {
          // child node is collapsed and there is no recussion (not filtered and not hidden)
          // report child node as processed (to be added)
          this.addedElements.nodeIDListForVisible.add(child.ID);
          // bring child back to visible and all its incident edges and meta ednges
          //returns list of edges and meta edges brought back to visible graph( structure : [[edges],[meta-edges]])
          let tempList = Auxiliary.moveNodeToVisible(child, visibleGM, invisibleGM, nodeToBeExpanded == undefined ? node : nodeToBeExpanded);
          //loop though edges returned
          tempList[0].forEach(item => {
            // report edge as processed (to be added)
            this.addedElements.edgeIDListForVisible.add(item);
          });
          let tempArr = [...this.addedElements.edgeIDListForVisible].filter(edgeID => visibleGM.edgesMap.has(edgeID));
          this.addedElements.edgeIDListForVisible = new Set(tempArr);
          // loop through meta edges
          tempList[1].forEach(item => {
            // report meta edge as parocessed (to be removed)
            this.addedElements.edgeIDListToRemove.add(item.ID);
            let tempArr = [...this.addedElements.metaEdgeIDListForVisible].filter(mEdge => {
              if (mEdge.ID == item.ID) {
                return false;
              } else {
                return true;
              }
            });
            this.addedElements.metaEdgeIDListForVisible = new Set(tempArr);
          });
          // loop through meta edges to be added
          tempList[2].forEach(item => {
            // report meta edge as parocessed (to be removed)
            this.addedElements.metaEdgeIDListForVisible.add(item);
          });
          markCollapsedCompoundChildren.push(child);
        }
      });
      markCollapsedCompoundChildren.forEach(makredChild => {
        let nodeDescendants = visibleGM.getDescendantsInorder(makredChild);
        // loop through descendant edges
        nodeDescendants.edges.forEach(nodeDescendantEdge => {
          if (visibleGM.edgeToMetaEdgeMap.has(nodeDescendantEdge.ID)) {
            let topMetaEdge = Auxiliary.getTopMetaEdge(visibleGM.edgeToMetaEdgeMap.get(nodeDescendantEdge.ID), visibleGM);
            let sourceNode = visibleGM.nodesMap.get(topMetaEdge.source.ID);
            let targetNode = visibleGM.nodesMap.get(topMetaEdge.target.ID);
            if (!ExpandCollapse.incidentEdgeIsOutOfScope(invisibleGM.nodesMap.get(topMetaEdge.source.ID), invisibleGM.nodesMap.get(node.ID), invisibleGM) && !ExpandCollapse.incidentEdgeIsOutOfScope(invisibleGM.nodesMap.get(topMetaEdge.target.ID), invisibleGM.nodesMap.get(node.ID), invisibleGM)) {
              if (topMetaEdge.source.ID == makredChild.ID || topMetaEdge.target.ID == makredChild.ID) {
                visibleGM.edgesMap.set(topMetaEdge.ID, topMetaEdge);
                //if source and target owner graph is same (its an intra graph edge), then add the viible and invisible edges to the source owner
                if (sourceNode.owner === targetNode.owner) {
                  if (sourceNode != undefined && targetNode != undefined) {
                    try {
                      sourceNode.owner.addEdge(topMetaEdge, sourceNode, targetNode);
                    } catch (e) {
                      console.log(e);
                    }
                  }
                } else {
                  //add inter graph edges
                  if (sourceNode != undefined && targetNode != undefined) {
                    try {
                      visibleGM.addInterGraphEdge(topMetaEdge, sourceNode, targetNode);
                    } catch (e) {
                      console.log(e);
                    }
                  }
                }
                this.addedElements.metaEdgeIDListForVisible.add({
                  ID: topMetaEdge.ID,
                  sourceID: topMetaEdge.source.ID,
                  targetID: topMetaEdge.target.ID,
                  size: topMetaEdge.originalEdges.length,
                  compound: 'T'
                });
              }
            }
          }
        });
      });
    }

    // function to get lis of all the nodes and their descendants  and their descendants 
    static getDescendantNodes(node) {
      // initalize the list
      let descendantNodes = [];
      // if node is a compound node
      if (node.child) {
        // loop through nodes of a child graph
        node.child.nodes.forEach(childNode => {
          // report the child node
          descendantNodes.push(childNode);
          // call the function again on child node
          let nodesReturned = this.getDescendantNodes(childNode);
          // append returned nodes with current list.
          descendantNodes = [...descendantNodes, ...nodesReturned];
        });
      }
      // return the list
      return descendantNodes;
    }

    // function to collapse nodes in the given list
    static collapseNodes(nodeIDList, isRecursive, visibleGM, invisibleGM) {
      // clear all elements from the object of the removed elements
      this.removedElements = {
        nodeIDListForInvisible: new Set(),
        edgeIDListForInvisible: new Set(),
        metaEdgeIDListForVisible: new Set()
      };
      // set of meta edges to keep
      let metaEdgeIDListToKeep = new Set();
      // if recussion is true.
      if (isRecursive) {
        // loop through the given list of the nodes
        nodeIDList.forEach(nodeID => {
          // clear the  meta edges set from removed Elements objects
          this.removedElements.metaEdgeIDListForVisible = new Set();
          // get node from visible graph
          let nodeInVisible = visibleGM.nodesMap.get(nodeID);
          // if node in visible graph is a compound node
          if (nodeInVisible.child) {
            // pass node to the collapseCompoundDescendantNodes function to collapse all the descendant compound nodes 
            this.collapseCompoundDescendantNodes(nodeInVisible, visibleGM, invisibleGM);
            // collpase the node by passing it to collapseNode function
            this.#collapseNode(nodeInVisible, visibleGM, invisibleGM);
            // initialize index counter to 0
            let index = 0;
            // loop through list of meta edge ids list 
            // struture list of list of objects 
            // strucute [[{meta edge object},{meta edge object}],[{meta edge object},{meta edge object}]]
            this.removedElements.metaEdgeIDListForVisible.forEach(edgeIDList => {
              // check if current meta edge list is not the last one
              if (index != this.removedElements.metaEdgeIDListForVisible.size - 1) {
                // loop through current meta edge list
                edgeIDList.forEach(edgeID => {
                  // delete each id from visible graph's edges map
                  visibleGM.edgesMap.delete(edgeID.ID);
                });
              }
              // increase index by one when one list is processed
              index = index + 1;
            });
            // get metaEdgeIDListForVisible (struture list of list of objects) as temp 1
            let temp1 = [...this.removedElements.metaEdgeIDListForVisible];
            // get the last list of objects as temp
            let temp = [...temp1[temp1.length - 1]];
            // loop through the temp list
            temp.forEach(item => {
              //  get meta edge from visible graph's meta edge map
              let metaEdge = visibleGM.metaEdgesMap.get(item.ID);
              // add meta edge to  set of meta edges to keep 
              metaEdgeIDListToKeep.add({
                ID: metaEdge.ID,
                sourceID: metaEdge.source.ID,
                targetID: metaEdge.target.ID,
                size: metaEdge.originalEdges.length,
                compound: 'T'
              });
            });
          }
        });
        //creating a temporary set 
        let tempSet = new Set();
        //looping throught set of meta edges to keep and filter out the ones that are no longer visible. (in visibleGM.edgesMap)
        metaEdgeIDListToKeep.forEach(item => {
          // if meta edge is visible
          if (visibleGM.edgesMap.has(item.ID)) {
            // add it to tempSet
            tempSet.add(item);
          }
        });
        //set filtered tempSet as the new value of metaEdgeIDListForVisible.
        this.removedElements.metaEdgeIDListForVisible = tempSet;
      } else {
        // if recusion is not true
        // loop through node id list
        nodeIDList.forEach(nodeID => {
          // get node from visible graph
          let nodeInVisible = visibleGM.nodesMap.get(nodeID);
          // if node is compound node
          if (nodeInVisible.child) {
            // pass node to collpaseNode function 
            this.#collapseNode(nodeInVisible, visibleGM, invisibleGM);
            // initialize index to 0
            let index = 0;
            // loop through list of meta edge ids list 
            // struture list of list of objects 
            // strucute [[{meta edge object},{meta edge object}],[{meta edge object},{meta edge object}]]
            this.removedElements.metaEdgeIDListForVisible.forEach(edgeIDList => {
              // check if current meta edge list is not the last one
              if (index != this.removedElements.metaEdgeIDListForVisible.size - 1) {
                // loop through current meta edge if list
                edgeIDList.forEach(edgeID => {
                  // delete meta edge from the visible graph
                  visibleGM.edgesMap.delete(edgeID.ID);
                });
              }
              // increase index by one when one list is processed
              index = index + 1;
            });
            // get metaEdgeIDListForVisible (struture list of list of objects) as temp 1
            let temp1 = [...this.removedElements.metaEdgeIDListForVisible];
            // get the last list of objects as temp
            let temp = [...temp1[temp1.length - 1]];
            //  set metaEdgeIDListForVisible as a new set
            this.removedElements.metaEdgeIDListForVisible = new Set();
            // loop through the temp list
            temp.forEach(item => {
              //  get meta edge from visible graph's meta edge map
              let metaEdge = visibleGM.metaEdgesMap.get(item.ID);

              // add meta edge to  set of meta edges to keep 
              this.removedElements.metaEdgeIDListForVisible.add({
                ID: metaEdge.ID,
                sourceID: metaEdge.source.ID,
                targetID: metaEdge.target.ID,
                size: metaEdge.originalEdges.length,
                compound: 'T'
              });
            });
          }
        });
      }
      // report  removed emelents object with keys for nodes (to be removed), edges (to be removed) and meta edges (to be added)
      return this.removedElements;
    }

    // function to collapse all the descendants of given compound node
    static collapseCompoundDescendantNodes(node, visibleGM, invisibleGM) {
      // if given node is compound node
      if (node.child) {
        // loop though children nodes of child graph
        node.child.nodes.forEach(childNode => {
          // if child node is a compound node
          if (childNode.child) {
            // pass the child node to the function again to collapse all its descendants 
            this.collapseCompoundDescendantNodes(childNode, visibleGM, invisibleGM);
            // pass the child node to collapse node function to collapse child node.
            this.#collapseNode(childNode, visibleGM, invisibleGM);
            // initilaize the index to 0
            let index = 0;
            // loop through list of meta edge ids list 
            // struture list of list of objects 
            // strucute [[{meta edge object},{meta edge object}],[{meta edge object},{meta edge object}]]
            this.removedElements.metaEdgeIDListForVisible.forEach(edgeIDList => {
              // check if current meta edge list is not the last one
              if (index != this.removedElements.metaEdgeIDListForVisible.size - 1) {
                // loop through current meta edge if list
                edgeIDList.forEach(edgeID => {
                  // delete meta edge from the visible graph
                  visibleGM.edgesMap.delete(edgeID.ID);
                });
              }
              // increase index by one when one list is processed
              index = index + 1;
            });
            // get metaEdgeIDListForVisible (struture list of list of objects) as temp 1
            let temp1 = [...this.removedElements.metaEdgeIDListForVisible];
            // get the last list of objects as temp
            let temp = [...temp1[temp1.length - 1]];
            //  set metaEdgeIDListForVisible as a new set
            this.removedElements.metaEdgeIDListForVisible = new Set();
            // create temp array
            let tempArr = [];
            // loop through the temp list
            temp.forEach(item => {
              //  get meta edge from visible graph's meta edge map
              let metaEdge = visibleGM.metaEdgesMap.get(item.ID);
              // psuh meta edge to  tempArr 
              tempArr.push({
                ID: metaEdge.ID,
                sourceID: metaEdge.source.ID,
                targetID: metaEdge.target.ID,
                size: metaEdge.originalEdges.length,
                compound: 'T'
              });
            });
            // add tempArr to the metaEdgeIDListForVisible
            this.removedElements.metaEdgeIDListForVisible.add(tempArr);
          }
        });
      }
    }

    // expand nodes function takes list of nodes to expand
    static expandNodes(nodeIDList, isRecursive, visibleGM, invisibleGM) {
      // clear addedElements object with empty sets
      this.addedElements = {
        nodeIDListForVisible: new Set(),
        edgeIDListForVisible: new Set(),
        metaEdgeIDListForVisible: new Set(),
        edgeIDListToRemove: new Set()
      };
      // loop through nodes list
      nodeIDList.forEach(nodeID => {
        // get node from visible graph (visibleNode)
        let nodeInVisible = visibleGM.nodesMap.get(nodeID);
        // get node from invisible grap (invisibleNode)
        let nodeInInvisible = invisibleGM.nodesMap.get(nodeID);
        // check if invisibleNode is compound node and is collapsed and not filtered and not hidded
        if (nodeInInvisible.child && nodeInInvisible.isCollapsed && !nodeInInvisible.isFiltered && !nodeInInvisible.isHidden) {
          // pass invisibleNode to expand node function and recursive status
          this.#expandNode(nodeInVisible, isRecursive, visibleGM, invisibleGM);
        }
      });
      // return addedElements
      return this.addedElements;
    }

    //  collapse All Nodes function
    static collapseAllNodes(visibleGM, invisibleGM) {
      // create list for nodes to collapse
      let nodeIDList = [];
      // loop through nodes of root graph (rootNodes)
      visibleGM.rootGraph.nodes.forEach(rootNode => {
        // if rootNode is a compound node
        if (rootNode.child) {
          // report it as node to be collapsed
          nodeIDList.push(rootNode.ID);
        }
      });
      // call the collapsedNodes function and pass list of nodes to be collapsed
      return {
        collapsedNodes: nodeIDList,
        ...this.collapseNodes(nodeIDList, true, visibleGM, invisibleGM)
      };
    }

    //expand all nodes function
    static expandAllNodes(visibleGM, invisibleGM) {
      //  get list of all the top level collapsed compound nodes  (takes invisible root node root node)
      let topCollapsedCompoundNodes = this.getTopCollapsedCompoundNodes(invisibleGM.rootGraph.parent);
      // all the expandNodes function will the list of all top level collapsed compound nodes
      return {
        expandedNodes: topCollapsedCompoundNodes,
        ...this.expandNodes(topCollapsedCompoundNodes, true, visibleGM, invisibleGM)
      };
    }

    // function to get thae list of all the top level collapsed compound nodes, (takes invisible root node root node) 
    static getTopCollapsedCompoundNodes(node) {
      // initialize list of descendantNodes
      let descendantNodes = [];
      // check if node is a compound node
      if (node.child) {
        // loop through nodes of child graph of top level collapsed node (as childNode)
        node.child.nodes.forEach(childNode => {
          // if child node is a compound node and is collapsed
          if (childNode.child && childNode.isCollapsed) {
            // report child node as descendant node (because its collapsed)
            descendantNodes.push(childNode.ID);
          } else if (childNode.child && !childNode.isCollapsed) {
            // if childNode is compound node and is not collapsed
            // call the function again and pass childNode
            let nodesReturned = this.getTopCollapsedCompoundNodes(childNode);
            // combine the reported nodes with current descendant nodes.
            descendantNodes = [...descendantNodes, ...nodesReturned];
          }
        });
      }
      // reprot list of descendant nodes
      return descendantNodes;
    }

    // function to collapse edges between 2 nodes (takes lis of edges)
    static collapseEdges(edgeIDList, visibleGM, invisibleGM) {
      // get first edge from the list of edges
      let firstEdge = visibleGM.edgesMap.get(edgeIDList[0]);
      // get source of the first edge (sourceNode)
      let sourceNode = firstEdge.source;
      // get target of the first node (targetNode)
      let targetNode = firstEdge.target;
      // all add meta edge function to create meta edge between source and target
      let newMetaEdge = Topology.addMetaEdge(sourceNode.ID, targetNode.ID, edgeIDList, visibleGM, invisibleGM);
      // initailize list of edge ids list
      let edgeIDListForInvisible = [];
      // loop throug the given edge id list 
      edgeIDList.forEach(edgeID => {
        // get edge from visible graph
        let edge = visibleGM.edgesMap.get(edgeID);
        //  check if visibleEge is not a meta edge
        if (!(edge instanceof MetaEdge)) {
          // report edge as processed (to be removed)
          edgeIDListForInvisible.push(edgeID);
        }
        // check if edge is visible
        if (visibleGM.edgesMap.has(edgeID)) {
          // remove edge from  visible graph
          Auxiliary.removeEdgeFromGraph(edge);
          // remove edge from visible edges map
          visibleGM.edgesMap.delete(edge.ID);
        }
      });
      // loop through removted edges
      edgeIDListForInvisible.forEach(edgeForInvisibleID => {
        // get corresponding edge from invisible graph and set visible flag false.
        let edgeInInvisible = invisibleGM.edgesMap.get(edgeForInvisibleID);
        edgeInInvisible.isVisible = false;
      });
      // return list of object with new meta edge infromation 
      // Structure = [{ID,sourceID,targetID}]
      return [{
        ID: newMetaEdge.ID,
        sourceID: newMetaEdge.source.ID,
        targetID: newMetaEdge.target.ID,
        size: newMetaEdge.originalEdges.length,
        compound: 'T'
      }];
    }

    // function to expand edges (takes list of edges to expand)
    static expandEdges(edgeIDList, isRecursive, visibleGM, invisibleGM) {
      // intialize list of 2d array with orignal edges list to report
      // Structure = [ [edges to be added] , [meta edges to be removed] , [edges to be removed]]
      let originalEdgeIDList = [[], [], []];
      edgeIDList = edgeIDList.filter(edgeID => {
        let metaEdge = visibleGM.metaEdgesMap.get(edgeID);
        if (metaEdge) {
          return metaEdge.originalEdges.length == 1 ? false : true;
        }
        return false;
      });
      originalEdgeIDList[2] = [...edgeIDList];

      // loop through given list of edges
      edgeIDList.forEach(edgeID => {
        // get meta edge  from visibleGm
        let metaEdge = visibleGM.metaEdgesMap.get(edgeID);
        // get source of meta edge
        let sourceNode = metaEdge.source;
        // get target of meta edge
        let targetNode = metaEdge.target;
        // loop through orignal Edges of meta edge
        metaEdge.originalEdges.forEach(originalEdgeID => {
          // check if orignal edge is a meta edge
          if (visibleGM.metaEdgesMap.has(originalEdgeID)) {
            //  get meta edge of the orignal edge
            let originalEdge = visibleGM.metaEdgesMap.get(originalEdgeID);
            let sourceNode = visibleGM.nodesMap.get(originalEdge.source.ID);
            let targetNode = visibleGM.nodesMap.get(originalEdge.target.ID);
            //  check if recursive and orignal meta edge is not created by node collapse
            if (isRecursive && originalEdge.originalEdges.length != 1) {
              // expand the orignal meta edge (returns edges brought back to visible graph  and meta edges to be removed)
              let returnedList = this.expandEdges([originalEdge.ID], isRecursive, visibleGM, invisibleGM);
              // remove this meta edge from meta edge map
              visibleGM.metaEdgesMap.delete(originalEdge.ID);
              // combine returned list to the cureent edge list
              originalEdgeIDList[0] = [...originalEdgeIDList[0], ...returnedList[0]];
              originalEdgeIDList[1] = [...originalEdgeIDList[1], ...returnedList[1]];
              originalEdgeIDList[2] = [...originalEdgeIDList[2], ...returnedList[2]];
            } else {
              //  check if its not recursive or orignal meta edge is created by node collapse
              // if orignalEdge source and target have same owner (not inter graph edge)
              if (sourceNode.owner == targetNode.owner) {
                // add orignal edge to the graph
                sourceNode.owner.addEdge(originalEdge, sourceNode, targetNode);
              } else {
                // if orignalEdge source and target does not have same owner (is inter graph edge)
                // add orignal edge as inter graph edge
                visibleGM.addInterGraphEdge(originalEdge, sourceNode, targetNode);
              }
              // add orignal edge to visible edges map
              visibleGM.edgesMap.set(originalEdge.ID, originalEdge);
              // report orignal edge as meta edge (to be removed)
              originalEdgeIDList[1].push({
                ID: originalEdge.ID,
                sourceID: sourceNode.ID,
                targetID: targetNode.ID,
                size: originalEdge.originalEdges.length,
                compound: 'T'
              });
            }
          } else {
            // if orignal edge is not a meta edge
            // get edge from invisible side
            let edgeInInvisible = invisibleGM.edgesMap.get(originalEdgeID);
            //  check if edge is not filtered and not hiddedn
            if (edgeInInvisible.isFiltered == false && edgeInInvisible.isHidden == false) {
              // set orignal edge visible flag true
              edgeInInvisible.isVisible = true;
              //  get source of invisible edge from visible graph
              sourceNode = visibleGM.nodesMap.get(edgeInInvisible.source.ID);
              //  get target of invisible edge from visible graph
              targetNode = visibleGM.nodesMap.get(edgeInInvisible.target.ID);
              // create new edge with same ID of invisible edge and source and target from visible graph
              let newEdge = new Edge(edgeInInvisible.ID, sourceNode, targetNode);
              // check if source and target have same owner graph (not inter graph edge)
              if (sourceNode.owner == targetNode.owner) {
                // add new edge to the owner graph of source node
                sourceNode.owner.addEdge(newEdge, sourceNode, targetNode);
              } else {
                // check if source and target does not have same owner graph (is inter graph edge)
                visibleGM.addInterGraphEdge(newEdge, sourceNode, targetNode);
              }
              // add orignal edge to visible edges map
              visibleGM.edgesMap.set(newEdge.ID, newEdge);
              // report orignal edge as  edge (to be added)
              originalEdgeIDList[0].push(originalEdgeID);
            }
          }
          // remove orignal edgeID from edges to meta edge map (it is no longer part of any meta edge)
          visibleGM.edgeToMetaEdgeMap.delete(originalEdgeID);
        });
        // remove edge from meta edge map ( this meta edge is expanded and does not exist anymore)
        visibleGM.metaEdgesMap.delete(edgeID);
        // if edge is visible
        if (visibleGM.edgesMap.has(edgeID)) {
          // remove edge from visible graph and visible edges map
          Auxiliary.removeEdgeFromGraph(metaEdge);
          visibleGM.edgesMap.delete(edgeID);
        }
      });
      // report orignal edges id list 
      // Structure = [ [edges to be added] , [meta edges to be removed], [edges to be removed]]
      return originalEdgeIDList;
    }
    // function to collapse edge between selected nodes
    static collapseEdgesBetweenNodes(nodeIDList, visibleGM, invisibleGM) {
      // initalize list to report meta edge
      let EdgeIDList = [[], []];
      // loop through all the nodes in the list
      for (let i = 0; i < nodeIDList.length; i++) {
        // loop through each pair onece (a-b and b-a are same so ignore one)
        for (let j = i + 1; j < nodeIDList.length; j++) {
          // get nodes
          let nodeA = visibleGM.nodesMap.get(nodeIDList[i]);
          let nodeB = visibleGM.nodesMap.get(nodeIDList[j]);
          let edgeIDList = [];
          // loop throught edges of first Node A and check if source or target of that edge is Node B and is not already in the edge list , add it.
          nodeA.edges.forEach(edge => {
            if (edge.source.ID == nodeB.ID || edge.target.ID == nodeB.ID) {
              if (!edgeIDList.includes(edge.ID)) {
                edgeIDList.push(edge.ID);
              }
            }
          });
          // call collapse edges function and pass edge list if edge list is not empty
          // function returns array containing one object 
          // Structure = [{ID,sourceID,targetID}]
          if (edgeIDList.length > 1) {
            let newMetaEge = this.collapseEdges(edgeIDList, visibleGM, invisibleGM);
            // append it to the edge list to report.
            EdgeIDList[0] = [...EdgeIDList[0], ...edgeIDList];
            // append it to the meta edge list to report.
            EdgeIDList[1] = [...EdgeIDList[1], ...newMetaEge];
          }
        }
      }
      return EdgeIDList;
    }
    static expandEdgesBetweenNodes(nodeIDList, isRecursive, visibleGM, invisibleGM) {
      // initalize list to report meta edge
      let EdgeIDList = [[], [], []];
      // loop through all the nodes in the list
      for (let i = 0; i < nodeIDList.length; i++) {
        // loop through each pair onece (a-b and b-a are same so ignore one)
        for (let j = i + 1; j < nodeIDList.length; j++) {
          // get nodes
          let nodeA = visibleGM.nodesMap.get(nodeIDList[i]);
          let nodeB = visibleGM.nodesMap.get(nodeIDList[j]);
          let edgeIDs = [];
          // loop throught edges of first Node A and check if source or target of that edge is Node B and is not already in the edge list , add it.
          nodeA.edges.forEach(edge => {
            if (edge.source.ID == nodeB.ID || edge.target.ID == nodeB.ID) {
              if (visibleGM.metaEdgesMap.has(edge.ID)) {
                if (!edgeIDs.includes(edge.ID) && edge.originalEdges.length != 1) {
                  edgeIDs.push(edge.ID);
                }
              }
            }
          });
          // call collapse edges function and pass edge list if edge list is not empty
          // function returns array containing one object 
          // Structure = [{ID,sourceID,targetID}]
          if (edgeIDs.length != 0) {
            let returnedEdgeList = this.expandEdges(edgeIDs, isRecursive, visibleGM, invisibleGM);
            // append it to the edge list to report.
            EdgeIDList[0] = [...EdgeIDList[0], ...returnedEdgeList[0]];
            // append it to the meta edge list to report.
            EdgeIDList[1] = [...EdgeIDList[1], ...returnedEdgeList[1]];
            // append it to the meta edge list to remove.
            EdgeIDList[2] = [...EdgeIDList[2], ...edgeIDs];
          }
        }
      }
      return EdgeIDList;
    }
    static collapseAllEdges(visibleGM, invisibleGM) {
      // create list for nodes to collapse
      let nodeIDList = [];
      // loop through nodes of root graph (rootNodes)
      visibleGM.nodesMap.forEach((node, ID) => {
        nodeIDList.push(ID);
      });
      // call the collapsedNodes function and pass list of nodes to be collapsed
      return this.collapseEdgesBetweenNodes(nodeIDList, visibleGM, invisibleGM);
    }
    static expandAllEdges(visibleGM, invisibleGM) {
      // create list for nodes to collapse
      let nodeIDList = [];
      // loop through nodes of root graph (rootNodes)
      visibleGM.nodesMap.forEach((node, ID) => {
        nodeIDList.push(ID);
      });
      // call the collapsedNodes function and pass list of nodes to be collapsed
      return this.expandEdgesBetweenNodes(nodeIDList, true, visibleGM, invisibleGM);
    }
  }
  class Auxiliary {
    static lastID = 0;
    // Function to create unique id for new elements
    static createUniqueID() {
      let newID = "Object#" + this.lastID + "";
      this.lastID++;
      return newID;
    }

    // function to remove edge from the graph
    static removeEdgeFromGraph(edgeToRemove) {
      // check if owner of edge is a graph mananger, (meaning it is inter graph edge)
      if (edgeToRemove.owner instanceof GraphManager) {
        // remove the inter graph edge
        edgeToRemove.owner.removeInterGraphEdge(edgeToRemove);
      } else {
        // edge is not an inter graph edge
        // remove the edge from the owner graph
        edgeToRemove.owner.removeEdge(edgeToRemove);
      }
    }

    // function to remove a given edge from the meta edge and that meta edge from its parent and so on and so forth 
    static recursiveMetaEdgeUpdate(edge, visibleGM, invisibleGM) {
      // initalize list to report all deleted meta edges
      let deletedMetaEdges = [[], []];
      // edge is part of a meta edge, get that meta edge using edge ID (as newMetaEdge)
      let metaEdge = visibleGM.edgeToMetaEdgeMap.get(edge.ID);
      // remove meta edge from the edge to meta edge map.
      visibleGM.edgeToMetaEdgeMap.delete(edge.ID);
      // check if newMetaEdge is part of any meta edge
      if (visibleGM.edgeToMetaEdgeMap.has(metaEdge.ID) && metaEdge.originalEdges.length == 1) {
        // call the function again and pass newMetaEdge
        let returnedList = this.recursiveMetaEdgeUpdate(metaEdge, visibleGM, invisibleGM);
        // combine the reproted list and the current list of meta edges to be deleted
        deletedMetaEdges[0] = [...deletedMetaEdges[0], ...returnedList[0]];
        deletedMetaEdges[1] = [...deletedMetaEdges[1], ...returnedList[1]];
      }
      if (visibleGM.metaEdgesMap.has(metaEdge.ID)) {
        // get the orignal edges of our newMetaEdge as new list ( orignalEnds)
        let orignalEnds = [...visibleGM.metaEdgesMap.get(metaEdge.ID)?.originalEdges];
        // remove given edgeID from the orignalEnds list (filter out EdgeID)
        orignalEnds = orignalEnds.filter(i => i == edge.ID ? false : true);
        // if filtered list is not empty
        if (orignalEnds.length == 0) {
          // delete meta edge from the metaEdgeMap
          visibleGM.metaEdgesMap.delete(metaEdge.ID);
          // if meta edge is visible
          if (visibleGM.edgesMap.has(metaEdge.ID)) {
            // delete meta edge from visible edge map
            Auxiliary.removeEdgeFromGraph(metaEdge);
            visibleGM.edgesMap.delete(metaEdge.ID);
            // report meta edge as processed (to be removed)
            // structure {ID,sourceID,TargetID}
            deletedMetaEdges[0].push({
              ID: metaEdge.ID,
              sourceID: metaEdge.source.ID,
              targetID: metaEdge.target.ID
            });
          }
        } else if (orignalEnds.length == 1) {
          visibleGM.edgeToMetaEdgeMap.delete(orignalEnds[0]);
          if (visibleGM.edgeToMetaEdgeMap.has(metaEdge.ID)) {
            let pMetaEdge = visibleGM.edgeToMetaEdgeMap.get(metaEdge.ID);
            pMetaEdge.originalEdges.push(orignalEnds[0]);
            visibleGM.edgeToMetaEdgeMap.set(orignalEnds[0], pMetaEdge);
            let updatedPOrignalEnds = pMetaEdge.originalEdges.filter(i => i == metaEdge.ID ? false : true);
            pMetaEdge.originalEdges = updatedPOrignalEnds;
          } else {
            deletedMetaEdges[1].push(orignalEnds[0]);
            if (visibleGM.metaEdgesMap.has(orignalEnds[0])) {
              let outerMetaEdge = visibleGM.metaEdgesMap.get(orignalEnds[0]);
              if (outerMetaEdge.originalEdges.length != 1) {
                visibleGM.edgesMap.set(orignalEnds[0], outerMetaEdge);
                let sourceNode = visibleGM.nodesMap.get(outerMetaEdge.source.ID);
                let targetNode = visibleGM.nodesMap.get(outerMetaEdge.target.ID);
                if (sourceNode != undefined && targetNode != undefined) {
                  if (sourceNode.owner === targetNode.owner) {
                    sourceNode.owner.addEdge(outerMetaEdge, sourceNode, targetNode);
                  } else {
                    //add inter graph edges
                    visibleGM.addInterGraphEdge(outerMetaEdge, sourceNode, targetNode);
                  }
                }
              }
            } else {
              let edgeInInvisible = invisibleGM.edgesMap.get(orignalEnds[0]);
              let sourceNode = visibleGM.nodesMap.get(edgeInInvisible.source.ID);
              let targetNode = visibleGM.nodesMap.get(edgeInInvisible.target.ID);
              let newEdge = new Edge(edgeInInvisible.ID, sourceNode, targetNode);
              visibleGM.edgesMap.set(orignalEnds[0], newEdge);
              if (sourceNode != undefined && targetNode != undefined) {
                if (sourceNode.owner === targetNode.owner) {
                  sourceNode.owner.addEdge(newEdge, sourceNode, targetNode);
                } else {
                  //add inter graph edges
                  visibleGM.addInterGraphEdge(newEdge, sourceNode, targetNode);
                }
              }
            }
          }
          // delete meta edge from the metaEdgeMap
          visibleGM.metaEdgesMap.delete(metaEdge.ID);
          // if meta edge is visible
          if (visibleGM.edgesMap.has(metaEdge.ID)) {
            // delete meta edge from visible edge map
            try {
              Auxiliary.removeEdgeFromGraph(metaEdge);
            } catch (e) {
              console.log(e);
            }
            visibleGM.edgesMap.delete(metaEdge.ID);
            // report meta edge as processed (to be removed)
            // structure {ID,sourceID,TargetID}
            deletedMetaEdges[0].push({
              ID: metaEdge.ID,
              sourceID: metaEdge.source.ID,
              targetID: metaEdge.target.ID
            });
          }
        } else {
          // if filtered list is not empty (there are other edges present in orignal edges list of meta edge)
          // set orignal edges list of meta edge to the filtered version (so edgeID gets removed from the orignal ends)
          visibleGM.metaEdgesMap.get(metaEdge.ID).originalEdges = orignalEnds;
        }
      }
      // reprot the list of meta edges to be deleted
      return deletedMetaEdges;
    }
    //recursivly tracks if meta edge is part of another meta edge if yes returns top one
    static getTopMetaEdge(metaEdge, visibleGM) {
      //check if meta edge is part of another meta edge
      let topMetaEdge = visibleGM.edgeToMetaEdgeMap.get(metaEdge.ID);
      //if not then topMetaEdge will be undefined so return meta edge
      if (topMetaEdge) {
        // if yes,
        // check that top meta edge is part of another meta edge
        if (visibleGM.edgeToMetaEdgeMap.has(topMetaEdge.ID)) {
          // if yes call the function again and pass top meta edge
          topMetaEdge = this.getTopMetaEdge(topMetaEdge, visibleGM);
        }
        // return top meta edge
        return topMetaEdge;
      }
      // return meta edge (since top meta edge is undfined, meaning given meta edge is not part of any other meta edge)
      return metaEdge;
    }
    static recursiveExpand(edgeID, visibleGM, bringBack = true) {
      let metaEdge = visibleGM.edgeToMetaEdgeMap.get(edgeID);
      let parentMetaEdge = visibleGM.edgeToMetaEdgeMap.get(metaEdge.ID);
      if (parentMetaEdge != undefined) {
        if (parentMetaEdge.originalEdges.length == 1) {
          if (!visibleGM.edgesMap.has(metaEdge.ID) && bringBack) {
            let sourceInVisible = visibleGM.nodesMap.get(metaEdge.source.ID);
            let targetInVisible = visibleGM.nodesMap.get(metaEdge.target.ID);
            // if source and target are visible
            if (sourceInVisible && targetInVisible) {
              // check if source and target of incident edge have same owner graph (not an intergraph edge)
              if (sourceInVisible.owner == targetInVisible.owner) {
                // add the meta edge to sibling graph of owner of incident edge (incident edge is from invisible graph)
                sourceInVisible.owner.addEdge(metaEdge, sourceInVisible, targetInVisible);
              } else {
                // source and target have different owner graphs (is an inter graph edge)
                // add meta edge as inter graph edge between visible source and target nodes
                visibleGM.addInterGraphEdge(metaEdge, sourceInVisible, targetInVisible);
              }
              //  add meta edge to visible edges map
              visibleGM.edgesMap.set(metaEdge.ID, metaEdge);
              return metaEdge;
            }
          } else {
            return metaEdge;
          }
        } else {
          return this.recursiveExpand(metaEdge.ID, visibleGM);
        }
      }
      return ['None', metaEdge];
    }
    static getVisibleParent(nodeID, invisibleGM) {
      let node = invisibleGM.nodesMap.get(nodeID);
      if (node.isVisible) {
        return node.ID;
      } else {
        return this.getVisibleParent(node.owner.parent.ID, invisibleGM);
      }
    }

    // function to bring node back to visible and all its incident edges
    static moveNodeToVisible(node, visibleGM, invisibleGM, nodeToBeExpanded = {
      ID: undefined
    }) {
      // initlaize the list of lists to report edges (to be added) and meta edges (to be removed) 
      // Structure = [ [edges] , [meta edges( to be removed)],[meta edges (to be added)]]
      var edgeIDList = [[], [], []];
      let edgesToBeProcessed = [];
      // set visbile flag of given node to true (marking it as processed)
      node.isVisible = true;
      // create new node with same nodeID as given node
      let nodeForVisible = new Node(node.ID);
      // add new node to the sibling graph of owner of the given node (given node is node form invisible GM)
      let newNode = node.owner.siblingGraph.addNode(nodeForVisible);
      // add new node to the nodes map of visible GM
      visibleGM.nodesMap.set(newNode.ID, newNode);
      // if given node has child graph ( meaning it is a compound node)
      if (node.child) {
        // chekc if given node is not collapsed
        if (node.isCollapsed == false) {
          // add an empty graph as child graph to new visible node
          let newGraph = visibleGM.addGraph(new Graph(null, visibleGM), nodeForVisible);
          // set siblingGraph pointer for visible and invisible child graph (so they point to each other)
          newGraph.siblingGraph = node.child;
          node.child.siblingGraph = newGraph;
        } else {
          let nodeDescendants = visibleGM.getDescendantsInorder(node);
          // loop through descendant edges
          nodeDescendants.edges.forEach(nodeDescendantEdge => {
            if (ExpandCollapse.incidentEdgeIsOutOfScope(invisibleGM.nodesMap.get(nodeDescendantEdge.source.ID), invisibleGM.nodesMap.get(nodeToBeExpanded.ID), invisibleGM) || ExpandCollapse.incidentEdgeIsOutOfScope(invisibleGM.nodesMap.get(nodeDescendantEdge.target.ID), invisibleGM.nodesMap.get(nodeToBeExpanded.ID), invisibleGM)) {
              edgesToBeProcessed.push(nodeDescendantEdge);
            }
          });
        }
      }
      // Structure [[edges],[metaedges (to be deleted)],[meta edges to be added]]
      let markedMetaEdges = [[], [], []];
      let addedMetaEdges = [];
      node.edges.forEach(nodeDescendantEdge => {
        if (invisibleGM.nodesMap.get(nodeDescendantEdge.source.ID).isVisible && invisibleGM.nodesMap.get(nodeDescendantEdge.target.ID).isVisible) {
          edgesToBeProcessed.push(nodeDescendantEdge);
        }
        if (ExpandCollapse.incidentEdgeIsOutOfScope(invisibleGM.nodesMap.get(nodeDescendantEdge.source.ID), invisibleGM.nodesMap.get(nodeToBeExpanded.ID), invisibleGM) || ExpandCollapse.incidentEdgeIsOutOfScope(invisibleGM.nodesMap.get(nodeDescendantEdge.target.ID), invisibleGM.nodesMap.get(nodeToBeExpanded.ID), invisibleGM)) {
          edgesToBeProcessed.push(nodeDescendantEdge);
        }
      });
      let tempSet = new Set(edgesToBeProcessed);
      edgesToBeProcessed = [...tempSet];
      // looping through incident edges of given node
      edgesToBeProcessed.forEach(incidentEdge => {
        //check if edge is part of a meta edge 
        if (visibleGM.edgeToMetaEdgeMap.has(incidentEdge.ID)) {
          // get meta edge corresponding to edgeID from edgeToMetaEdgeMap
          let visibleMetaEdge = visibleGM.edgeToMetaEdgeMap.get(incidentEdge.ID);
          // Case (C)
          // check if meta edge is visible and meta edge's orignal edges length is 1 (meaning meta edge is created by node collapse and is visible) 
          if (visibleGM.edgesMap.has(visibleMetaEdge.ID) && visibleMetaEdge.originalEdges.length == 1) {
            // delete meta edge from edges map and meta edge map
            visibleGM.edgesMap.delete(visibleMetaEdge.ID);
            visibleGM.metaEdgesMap.delete(visibleMetaEdge.ID);
            // dlete incident edge from edgeToMetaEdgemap
            visibleGM.edgeToMetaEdgeMap.delete(incidentEdge.ID);
            // report meta edge as processed (to be removed)
            // Structure  = {ID,sourceID,targetID}
            edgeIDList[1].push({
              ID: visibleMetaEdge.ID,
              sourceID: visibleMetaEdge.source.ID,
              targetID: visibleMetaEdge.target.ID
            });
            // remove meta edge from graph
            try {
              Auxiliary.removeEdgeFromGraph(visibleMetaEdge);
            } catch (ex) {}
            // check if incident edge is not filtered and not hidden and souce and target both are visible 
            if (incidentEdge.isFiltered == false && incidentEdge.isHidden == false) {
              if (incidentEdge.source.isVisible && incidentEdge.target.isVisible) {
                // move edge to visible graph
                Auxiliary.moveEdgeToVisible(incidentEdge, visibleGM, invisibleGM);
                // report edge as processed (to be added)
                edgeIDList[0].push(incidentEdge.ID);
              } else {
                if (incidentEdge.source.isVisible) {
                  let targetID = this.getVisibleParent(incidentEdge.target.ID, invisibleGM);
                  let target = visibleGM.nodesMap.get(targetID);
                  let newMetaEdge = Topology.addMetaEdge(incidentEdge.source.ID, target.ID, [incidentEdge.ID], visibleGM, invisibleGM);
                  // report incident edge as processed (to be added)
                  edgeIDList[2].push({
                    ID: newMetaEdge.ID,
                    sourceID: newMetaEdge.source.ID,
                    targetID: newMetaEdge.target.ID,
                    size: newMetaEdge.originalEdges.length,
                    compound: 'T'
                  });
                } else if (incidentEdge.target.isVisible) {
                  let sourceID = this.getVisibleParent(incidentEdge.source.ID, invisibleGM);
                  let source = visibleGM.nodesMap.get(sourceID);
                  let newMetaEdge = Topology.addMetaEdge(source.ID, incidentEdge.target.ID, [incidentEdge.ID], visibleGM, invisibleGM);
                  // report incident edge as processed (to be added)
                  edgeIDList[2].push({
                    ID: newMetaEdge.ID,
                    sourceID: newMetaEdge.source.ID,
                    targetID: newMetaEdge.target.ID,
                    size: newMetaEdge.originalEdges.length,
                    compound: 'T'
                  });
                } else {
                  let sourceID = this.getVisibleParent(incidentEdge.source.ID, invisibleGM);
                  let source = visibleGM.nodesMap.get(sourceID);
                  let targetID = this.getVisibleParent(incidentEdge.target.ID, invisibleGM);
                  let target = visibleGM.nodesMap.get(targetID);
                  let newMetaEdge = Topology.addMetaEdge(source.ID, target.ID, [incidentEdge.ID], visibleGM, invisibleGM);
                  // report incident edge as processed (to be added)
                  edgeIDList[2].push({
                    ID: newMetaEdge.ID,
                    sourceID: newMetaEdge.source.ID,
                    targetID: newMetaEdge.target.ID,
                    size: newMetaEdge.originalEdges.length,
                    compound: 'T'
                  });
                }
              }
            }
          } else if (visibleGM.edgesMap.has(visibleMetaEdge.ID) && visibleMetaEdge.originalEdges.length != 1) {
            // Case: meta edge is visible and the lenth of its orignal edges is more than 1 (meta edge is not created by node collapse)
            //do nothing
            console.log('done nothing');
          } else {
            // Case: meta edge is not visible (CEE....)
            // check if orignal edges of meta edge have length 1 (meta edge is created by node collapse)
            if (visibleMetaEdge.originalEdges.length == 1) {
              // check if incident edge is not filtere and not hidde and source and target are visible
              if (incidentEdge.isFiltered == false && incidentEdge.isHidden == false) {
                if (incidentEdge.source.isVisible && incidentEdge.target.isVisible) {
                  // move incident edge to visible graph
                  Auxiliary.moveEdgeToVisible(incidentEdge, visibleGM, invisibleGM);
                  // report incident edge as processed (to be added)
                  edgeIDList[0].push(incidentEdge.ID);
                  // call recursiveMetaEdgeUpdate function on incident edge to remove meta edge with incident edge as oringal edge and the meta edge that contains this meta edge and so on and so forth 
                  let deleteMetaEdgeList = this.recursiveMetaEdgeUpdate(incidentEdge, visibleGM, invisibleGM);
                  // report meta edges deleted by recursiveMetaEdgeUpdate function as processed and add them to the list of reported meta edges (to be removed) 
                  edgeIDList[1] = [...edgeIDList[1], ...deleteMetaEdgeList[0]];
                  edgeIDList[0] = [...edgeIDList[0], ...deleteMetaEdgeList[1]];
                } else {
                  if (incidentEdge.source.isVisible) {
                    let targetID = this.getVisibleParent(incidentEdge.target.ID, invisibleGM);
                    if (ExpandCollapse.incidentEdgeIsOutOfScope(incidentEdge.source, invisibleGM.nodesMap.get(targetID), invisibleGM)) {
                      // call recursiveMetaEdgeUpdate function on incident edge to remove meta edge with incident edge as oringal edge and the meta edge that contains this meta edge and so on and so forth 
                      let deleteMetaEdgeList = this.recursiveMetaEdgeUpdate(incidentEdge, visibleGM, invisibleGM);
                      // report meta edges deleted by recursiveMetaEdgeUpdate function as processed and add them to the list of reported meta edges (to be removed) 
                      edgeIDList[1] = [...edgeIDList[1], ...deleteMetaEdgeList[0]];
                      edgeIDList[0] = [...edgeIDList[0], ...deleteMetaEdgeList[1]];
                      let target = visibleGM.nodesMap.get(targetID);
                      let newMetaEdge = Topology.addMetaEdge(incidentEdge.source.ID, target.ID, [incidentEdge.ID], visibleGM, invisibleGM);
                      // report incident edge as processed (to be added)
                      edgeIDList[2].push({
                        ID: newMetaEdge.ID,
                        sourceID: newMetaEdge.source.ID,
                        targetID: newMetaEdge.target.ID,
                        size: newMetaEdge.originalEdges.length,
                        compound: 'T'
                      });
                    }
                  } else if (incidentEdge.target.isVisible) {
                    let sourceID = this.getVisibleParent(incidentEdge.source.ID, invisibleGM);
                    if (ExpandCollapse.incidentEdgeIsOutOfScope(incidentEdge.target, invisibleGM.nodesMap.get(sourceID), invisibleGM)) {
                      // call recursiveMetaEdgeUpdate function on incident edge to remove meta edge with incident edge as oringal edge and the meta edge that contains this meta edge and so on and so forth 
                      let deleteMetaEdgeList = this.recursiveMetaEdgeUpdate(incidentEdge, visibleGM, invisibleGM);
                      // report meta edges deleted by recursiveMetaEdgeUpdate function as processed and add them to the list of reported meta edges (to be removed) 
                      edgeIDList[1] = [...edgeIDList[1], ...deleteMetaEdgeList[0]];
                      edgeIDList[0] = [...edgeIDList[0], ...deleteMetaEdgeList[1]];
                      let source = visibleGM.nodesMap.get(sourceID);
                      let newMetaEdge = Topology.addMetaEdge(source.ID, incidentEdge.target.ID, [incidentEdge.ID], visibleGM, invisibleGM);
                      // report incident edge as processed (to be added)
                      edgeIDList[2].push({
                        ID: newMetaEdge.ID,
                        sourceID: newMetaEdge.source.ID,
                        targetID: newMetaEdge.target.ID,
                        size: newMetaEdge.originalEdges.length,
                        compound: 'T'
                      });
                    }
                  } else {
                    let sourceID = this.getVisibleParent(incidentEdge.source.ID, invisibleGM);
                    let targetID = this.getVisibleParent(incidentEdge.target.ID, invisibleGM);
                    if (ExpandCollapse.incidentEdgeIsOutOfScope(invisibleGM.nodesMap.get(targetID), invisibleGM.nodesMap.get(sourceID), invisibleGM) && ExpandCollapse.incidentEdgeIsOutOfScope(invisibleGM.nodesMap.get(sourceID), invisibleGM.nodesMap.get(targetID), invisibleGM)) {
                      // call recursiveMetaEdgeUpdate function on incident edge to remove meta edge with incident edge as oringal edge and the meta edge that contains this meta edge and so on and so forth 
                      let deleteMetaEdgeList = this.recursiveMetaEdgeUpdate(incidentEdge, visibleGM, invisibleGM);
                      // report meta edges deleted by recursiveMetaEdgeUpdate function as processed and add them to the list of reported meta edges (to be removed) 
                      edgeIDList[1] = [...edgeIDList[1], ...deleteMetaEdgeList[0]];
                      edgeIDList[0] = [...edgeIDList[0], ...deleteMetaEdgeList[1]];
                      let source = visibleGM.nodesMap.get(sourceID);
                      let target = visibleGM.nodesMap.get(targetID);
                      let newMetaEdge = Topology.addMetaEdge(source.ID, target.ID, [incidentEdge.ID], visibleGM, invisibleGM);
                      // report incident edge as processed (to be added)
                      edgeIDList[2].push({
                        ID: newMetaEdge.ID,
                        sourceID: newMetaEdge.source.ID,
                        targetID: newMetaEdge.target.ID,
                        size: newMetaEdge.originalEdges.length,
                        compound: 'T'
                      });
                    }
                  }
                }
              }
            } else {
              // Case (...EEC)
              // Case meta edge is not visible and length of its orignal ends is greater than 1 ( meta edge is not created by node collapse)
              //checks if given meta edge is part of any other meta edge, if yes returns the top one (only for cases where given meta edge is not created by node collapse.)
              visibleMetaEdge = this.getTopMetaEdge(visibleMetaEdge, visibleGM);
              // check if the returned top meta edge was created  by collapse or not
              if (visibleMetaEdge.originalEdges.length == 1) {
                let res = this.recursiveExpand(incidentEdge.ID, visibleGM);
                if (!Array.isArray(res)) {
                  if (!markedMetaEdges[1].includes(visibleMetaEdge)) {
                    markedMetaEdges[1].push(visibleMetaEdge);
                  }
                  // report incident edge as processed (to be added)
                  edgeIDList[0].push(res.ID);
                } else {
                  if (!markedMetaEdges[1].includes(visibleMetaEdge)) {
                    markedMetaEdges[1].push(visibleMetaEdge);
                  }
                  if (!markedMetaEdges[2].includes(res[1])) {
                    markedMetaEdges[2].push(res[1]);
                  }
                }
              } else {
                // Case (...ECE...)
                // Case: top meta edge is not created by node collapse

                let res = this.recursiveExpand(incidentEdge.ID, visibleGM, false);
                if (!Array.isArray(res)) {
                  // report incident edge as processed (to be added)
                  edgeIDList[0].push(visibleMetaEdge.ID);
                  // call recursiveMetaEdgeUpdate function on incident edge to remove meta edge with incident edge as oringal edge and the meta edge that contains this meta edge and so on and so forth 
                  let deleteMetaEdgeList = this.recursiveMetaEdgeUpdate(res, visibleGM, invisibleGM);
                  // report meta edges deleted by recursiveMetaEdgeUpdate function as processed and add them to the list of reported meta edges (to be removed) 
                  edgeIDList[1] = [...edgeIDList[1], ...deleteMetaEdgeList[0]];
                  edgeIDList[0] = [...edgeIDList[0], ...deleteMetaEdgeList[1]];
                  visibleMetaEdge = res;
                }

                // get soruce and target of top meta edge
                let sourceInVisible = visibleGM.nodesMap.get(visibleMetaEdge.source.ID);
                let targetInVisible = visibleGM.nodesMap.get(visibleMetaEdge.target.ID);
                // if source and target are visible
                if (sourceInVisible && targetInVisible) {
                  // check if source and target of incident edge have same owner graph (not an intergraph edge)
                  if (incidentEdge.source.owner == incidentEdge.target.owner) {
                    // add the meta edge to sibling graph of owner of incident edge (incident edge is from invisible graph)
                    if (!FilterUnfilter.updateMetaEdge(visibleMetaEdge.originalEdges, null, visibleGM, invisibleGM)) {
                      try {
                        let newEdge = incidentEdge.source.owner.siblingGraph.addEdge(visibleMetaEdge, sourceInVisible, targetInVisible);
                        addedMetaEdges.push(visibleMetaEdge);
                      } catch (e) {
                        console.log(e);
                      }
                    }
                  } else {
                    // source and target have different owner graphs (is an inter graph edge)
                    // add meta edge as inter graph edge between visible source and target nodes

                    if (!FilterUnfilter.updateMetaEdge(visibleMetaEdge.originalEdges, null, visibleGM, invisibleGM)) {
                      try {
                        let newEdge = visibleGM.addInterGraphEdge(visibleMetaEdge, sourceInVisible, targetInVisible);
                        addedMetaEdges.push(visibleMetaEdge);
                      } catch (e) {
                        console.log(e);
                      }
                    }
                  }
                  if (!FilterUnfilter.updateMetaEdge(visibleMetaEdge.originalEdges, null, visibleGM, invisibleGM)) {
                    //  add meta edge to visible edges map
                    visibleGM.edgesMap.set(visibleMetaEdge.ID, visibleMetaEdge);
                    // report meta edge as processed (to be added)
                    edgeIDList[0].push(visibleMetaEdge.ID);
                  }
                } else if (ExpandCollapse.incidentEdgeIsOutOfScope(invisibleGM.nodesMap.get(visibleMetaEdge.source.ID).isVisible ? invisibleGM.nodesMap.get(visibleMetaEdge.target.ID) : invisibleGM.nodesMap.get(visibleMetaEdge.source.ID), invisibleGM.nodesMap.get(nodeToBeExpanded.ID), invisibleGM)) {
                  if (sourceInVisible) {
                    let targetID = this.getVisibleParent(visibleMetaEdge.target.ID, invisibleGM);
                    if (ExpandCollapse.incidentEdgeIsOutOfScope(incidentEdge.source.isVisible ? incidentEdge.target : incidentEdge.source, invisibleGM.nodesMap.get(targetID), invisibleGM)) {
                      let target = visibleGM.nodesMap.get(targetID);
                      let newMetaEdge = Topology.addMetaEdge(visibleMetaEdge.source.ID, target.ID, [visibleMetaEdge.ID], visibleGM, invisibleGM);
                      // report incident edge as processed (to be added)
                      edgeIDList[2].push({
                        ID: newMetaEdge.ID,
                        sourceID: newMetaEdge.source.ID,
                        targetID: newMetaEdge.target.ID,
                        size: newMetaEdge.originalEdges.length,
                        compound: 'T'
                      });
                    }
                  } else {
                    let sourceID = this.getVisibleParent(visibleMetaEdge.source.ID, invisibleGM);
                    if (ExpandCollapse.incidentEdgeIsOutOfScope(incidentEdge.source.isVisible ? incidentEdge.target : incidentEdge.source, invisibleGM.nodesMap.get(sourceID), invisibleGM)) {
                      let source = visibleGM.nodesMap.get(sourceID);
                      let newMetaEdge = Topology.addMetaEdge(source.ID, visibleMetaEdge.target.ID, [visibleMetaEdge.ID], visibleGM, invisibleGM);
                      // report incident edge as processed (to be added)
                      edgeIDList[2].push({
                        ID: newMetaEdge.ID,
                        sourceID: newMetaEdge.source.ID,
                        targetID: newMetaEdge.target.ID,
                        size: newMetaEdge.originalEdges.length,
                        compound: 'T'
                      });
                    }
                  }
                }
              }
            }
          }
        } else {
          // incident edge is a normal edge 
          // check if incident edge is not filtered not hidded and soruce and target are visible
          if (incidentEdge.isFiltered == false && incidentEdge.isHidden == false && incidentEdge.source.isVisible && incidentEdge.target.isVisible) {
            // move incident edge to visible graph
            Auxiliary.moveEdgeToVisible(incidentEdge, visibleGM, invisibleGM);
            // report incident edge as processed (to be added)
            edgeIDList[0].push(incidentEdge.ID);
          }
        }
      });
      if (markedMetaEdges[0].length != 0 || markedMetaEdges[1].length != 0) {
        markedMetaEdges[1].forEach(metaEdge => {
          // if yes deleted top meta edge
          visibleGM.edgesMap.delete(metaEdge.ID);
          visibleGM.metaEdgesMap.delete(metaEdge.ID);
          // report top meta edge as processed (to be removed)
          // Structure = {ID,sourceID,targetID}
          edgeIDList[1].push({
            ID: metaEdge.ID,
            sourceID: metaEdge.source.ID,
            targetID: metaEdge.target.ID
          });
          // remvoe meta edge from graph
          try {
            Auxiliary.removeEdgeFromGraph(metaEdge);
          } catch (ex) {
            console.log(ex);
          }
        });
        markedMetaEdges[2].forEach(edge => {
          if (visibleGM.nodesMap.has(edge.source.ID)) {
            let targetID = this.getVisibleParent(edge.target.ID, invisibleGM);
            let target = visibleGM.nodesMap.get(targetID);
            if (ExpandCollapse.incidentEdgeIsOutOfScope(invisibleGM.nodesMap.get(edge.source.ID), invisibleGM.nodesMap.get(targetID), invisibleGM)) {
              let newMetaEdge = Topology.addMetaEdge(edge.source.ID, target.ID, [edge.ID], visibleGM, invisibleGM);
              // report incident edge as processed (to be added)
              edgeIDList[2].push({
                ID: newMetaEdge.ID,
                sourceID: newMetaEdge.source.ID,
                targetID: newMetaEdge.target.ID,
                size: newMetaEdge.originalEdges.length,
                compound: 'T'
              });
            }
          } else if (edge.target.isVisible) {
            let sourceID = this.getVisibleParent(edge.source.ID, invisibleGM);
            let source = visibleGM.nodesMap.get(sourceID);
            if (ExpandCollapse.incidentEdgeIsOutOfScope(invisibleGM.nodesMap.get(edge.target.ID), invisibleGM.nodesMap.get(sourceID), invisibleGM)) {
              let newMetaEdge = Topology.addMetaEdge(source.ID, edge.target.ID, [edge.ID], visibleGM, invisibleGM);
              // report incident edge as processed (to be added)
              edgeIDList[2].push({
                ID: newMetaEdge.ID,
                sourceID: newMetaEdge.source.ID,
                targetID: newMetaEdge.target.ID,
                size: newMetaEdge.originalEdges.length,
                compound: 'T'
              });
            }
          } else {
            let sourceID = this.getVisibleParent(edge.source.ID, invisibleGM);
            let source = visibleGM.nodesMap.get(sourceID);
            let targetID = this.getVisibleParent(edge.target.ID, invisibleGM);
            let target = visibleGM.nodesMap.get(targetID);
            if (ExpandCollapse.incidentEdgeIsOutOfScope(invisibleGM.nodesMap.get(sourceID), invisibleGM.nodesMap.get(targetID), invisibleGM) && ExpandCollapse.incidentEdgeIsOutOfScope(invisibleGM.nodesMap.get(targetID), invisibleGM.nodesMap.get(sourceID), invisibleGM)) {
              let newMetaEdge = Topology.addMetaEdge(source.ID, target.ID, [edge.ID], visibleGM, invisibleGM);
              // report incident edge as processed (to be added)
              edgeIDList[2].push({
                ID: newMetaEdge.ID,
                sourceID: newMetaEdge.source.ID,
                targetID: newMetaEdge.target.ID,
                size: newMetaEdge.originalEdges.length,
                compound: 'T'
              });
            }
          }
        });
      }

      // return the list of list to be reported
      // Structure = [ [edges] , [meta edges( to be removed)],[meta edges (to be added)]]
      return edgeIDList;
    }

    // fuunction to move edge to visible graph
    static moveEdgeToVisible(edge, visibleGM, invisibleGM) {
      // set visible flag of edge to true
      edge.isVisible = true;
      // create new edge fro the visible side
      let edgeForVisible = new Edge(edge.ID, null, null);
      // get source and target from visible graph
      let sourceInVisible = visibleGM.nodesMap.get(edge.source.ID);
      let targetInVisible = visibleGM.nodesMap.get(edge.target.ID);
      // initialize new edge 
      let newEdge;
      // check if owner graph of soruce and target are same (not an inter graph edge)
      if (edge.source.owner == edge.target.owner) {
        // add new edge to sibling graph of owner of given edge (given edge is from invisible graph)
        newEdge = edge.source.owner.siblingGraph.addEdge(edgeForVisible, sourceInVisible, targetInVisible);
      } else {
        // owner graph of soruce and target are different (is an inter graph edge)
        newEdge = visibleGM.addInterGraphEdge(edgeForVisible, sourceInVisible, targetInVisible);
      }
      //  add new edge to visible edges map
      visibleGM.edgesMap.set(newEdge.ID, newEdge);
    }

    // fucntion to get elements from neighbourhood of a given node
    static getTargetNeighborhoodElements(nodeID, invisibleGM) {
      // get node from invisible graph
      let node = invisibleGM.nodesMap.get(nodeID);
      //get zero distance Neighborhood
      // list of node that can be reached from given node with zero distance, all parents, all children and sibilings at all levels
      // Structure = { nodes: [nodes], edges: [edges]}
      let neighborhood = this.getZeroDistanceNeighbors(node, invisibleGM);
      // check if zero neighbourhood list includes the given node or not (if given node is the top level node in its tree structure it will not be included int he zero neighbourhood list)
      // if not add it to the list 
      if (!neighborhood.nodes.includes(nodeID)) {
        neighborhood.nodes.push(nodeID);
      }
      // initalize object to report all nodes and edges in neighbourhood of given node
      // Structure = { nodes: [nodes], edges: [edges]}
      let neighborElements = {
        nodes: [],
        edges: []
      };
      //for each 0 distance neighborhood node get 1 distance nodes and edges
      neighborhood['nodes'].forEach(neighborNodeID => {
        let neighborNode = invisibleGM.nodesMap.get(neighborNodeID);
        neighborNode.edges.forEach(edge => {
          if (edge.source.ID == neighborNode.ID) {
            neighborElements['nodes'].push(edge.target.ID);
          } else {
            neighborElements['nodes'].push(edge.source.ID);
          }
          neighborElements['edges'].push(edge.ID);
        });
      });
      // remove all duplicates from 1 distance neighbourhood
      neighborElements['nodes'] = [...new Set([...neighborElements['nodes']])];
      neighborElements['edges'] = [...new Set([...neighborElements['edges']])];

      //for each 1 distance node, calculate individual zero distance neighborhood and append it to the orignal dictionary
      neighborElements['nodes'].forEach(neighborElementID => {
        let targetNeighborNode = invisibleGM.nodesMap.get(neighborElementID);
        let targetNeighborhood = this.getZeroDistanceNeighbors(targetNeighborNode, invisibleGM);
        neighborhood['nodes'] = [...new Set([...neighborhood['nodes'], ...targetNeighborhood['nodes']])];
        neighborhood['edges'] = [...new Set([...neighborhood['edges'], ...targetNeighborhood['edges']])];
      });

      //remove duplications
      neighborhood['nodes'] = [...new Set([...neighborhood['nodes'], ...neighborElements['nodes']])];
      neighborhood['edges'] = [...new Set([...neighborhood['edges'], ...neighborElements['edges']])];

      //filter out all visible nodes
      neighborhood['nodes'] = neighborhood['nodes'].filter(itemID => {
        let itemNode = invisibleGM.nodesMap.get(itemID);
        return !itemNode.isVisible;
      });

      //filter out all visible edges
      neighborhood['edges'] = neighborhood['edges'].filter(itemID => {
        let itemEdge = invisibleGM.edgesMap.get(itemID);
        return !itemEdge.isVisible;
      });
      return neighborhood;
    }

    // function to get zero neighbourhood element of given node
    static getZeroDistanceNeighbors(node, invisibleGM) {
      // initialize neighbourhood object
      // Structure = {[nodes],[edges]} 
      let neighbors = {
        nodes: [],
        edges: []
      };
      // function to get the descendant of given node
      // Structure = {[nodes],[edges]} 
      let descendantNeighborhood = this.getDescendantNeighbors(node);
      // function to get the parents of the given ndoe
      // Structure = {[nodes],[edges]} 
      let predecessorsNeighborhood = this.getPredecessorNeighbors(node, invisibleGM);
      // append decendant neighbourhood elements and parent neighbourhood elements to neighbourhood object
      neighbors['nodes'] = [...new Set([...descendantNeighborhood['nodes'], ...predecessorsNeighborhood['nodes']])];
      neighbors['edges'] = [...new Set([...descendantNeighborhood['edges'], ...predecessorsNeighborhood['edges']])];

      // return neighbourhood object
      // Structure = {[nodes],[edges]} 
      return neighbors;
    }

    // function to get descendants of a given node
    static getDescendantNeighbors(node) {
      // initialize neighbourhood object
      // Structure = {[nodes],[edges]} 
      let neighbors = {
        nodes: [],
        edges: []
      };
      // if given node is compound node
      if (node.child) {
        // get nodes of children graph
        let children = node.child.nodes;
        // loop through children nodes
        children.forEach(childNode => {
          // report child node as processed 
          neighbors.nodes.push(childNode.ID);
          // loop through incident edges of child node
          childNode.edges.forEach(element => {
            // report incident edge as processed
            neighbors.edges.push(element.ID);
          });
          // function to get the descendant of given node
          // Structure = {[nodes],[edges]} 
          let nodesReturned = this.getDescendantNeighbors(childNode);
          // append decendant neighbourhood elements and parent neighbourhood elements to neighbourhood object
          neighbors['nodes'] = [...neighbors['nodes'], ...nodesReturned['nodes']];
          neighbors['edges'] = [...neighbors['edges'], ...nodesReturned['edges']];
        });
      }
      // return neighbourhood object
      // Structure = {[nodes],[edges]} 
      return neighbors;
    }

    // function to get predecessors of a given node
    static getPredecessorNeighbors(node, invisibleGM) {
      // initialize neighbourhood object
      // Structure = {[nodes],[edges]} 
      let neighbors = {
        nodes: [],
        edges: []
      };
      // check if owner graph of given node is not root graph
      if (node.owner != invisibleGM.rootGraph) {
        // get nodes of the owner graph
        let predecessors = node.owner.nodes;
        // loop through predecessor nodes
        predecessors.forEach(pNode => {
          // report predecessor node as processed
          neighbors['nodes'].push(pNode.ID);
          // loop through edges of the predecessor node
          pNode.edges.forEach(element => {
            // report edge as processed
            neighbors.edges.push(element.ID);
          });
        });
        // function to get the parents of the given ndoe
        // Structure = {[nodes],[edges]} 
        let nodesReturned = this.getPredecessorNeighbors(node.owner.parent, invisibleGM);
        // append decendant neighbourhood elements and parent neighbourhood elements to neighbourhood object
        neighbors['nodes'] = [...neighbors['nodes'], ...nodesReturned['nodes']];
        neighbors['edges'] = [...neighbors['edges'], ...nodesReturned['edges']];
      } else {
        // if owner graph of given node is the root graph
        // report the given node as processed
        neighbors['nodes'].push(node.ID);
      }
      // return neighbourhood object
      // Structure = {[nodes],[edges]} 
      return neighbors;
    }
  }
  class HideShow {
    static hide(nodeIDList, edgeIDList, visibleGM, invisibleGM) {
      let nodeIDListPostProcess = [];
      let edgeIDListPostProcess = [...edgeIDList];
      // first hide edges
      edgeIDList.forEach(edgeID => {
        let edgeToHide = visibleGM.edgesMap.get(edgeID);
        // edgeToHide can be a part of a meta edge, a simple (non-meta edge) or may not exist (may be removed inside a collapsed node or may be filtered)
        if (edgeToHide) {
          let found = false;
          visibleGM.edgesMap.forEach(visibleEdge => {
            if (visibleEdge instanceof MetaEdge) {
              // updateMetaEdge function returns updated version of originalEdges without key of edgeTo Remove
              updatedOrignalEdges = this.updateMetaEdge(visibleEdge.originalEdges(), edgeToHide.ID);
              // updatedOrignalEdges will be same as originalEdges if edge to remove is not part of the meta edge
              if (updatedOrignalEdges != visibleEdge.originalEdges()) {
                visibleEdge.originalEdges(updatedOrignalEdges);
                found = true;
              }
            }
          });
          // if edge is not part of any meta edge
          if (!found) {
            visibleGM.edgesMap.delete(edgeToHide.ID);
            Auxiliary.removeEdgeFromGraph(edgeToHide);
          }
        }
        //get ege from the invisible graph
        let edgeToHideInvisible = invisibleGM.edgesMap.get(edgeID);
        //change hidden and visibleity flag
        edgeToHideInvisible.isHidden = true;
        edgeToHideInvisible.isVisible = false;
      });
      //looping through list of nodes to hide
      nodeIDList.forEach(nodeID => {
        let nodeToHide = visibleGM.nodesMap.get(nodeID);
        // nodeToHide can be a simple node, a compound node or may not exist (may be removed inside a collapsed node or may be a filtered simple or compound node)
        if (nodeToHide) {
          // nodeToHide is either simple or a compound node in visible graph, so we first store the IDs of nodeToHide, its descendant nodes and their incident edges in elementIDsForInvisible, then remove those nodes and edges from the graph 
          //All done by getDescendantsInorder
          let nodeToHideDescendants = visibleGM.getDescendantsInorder(nodeToHide);
          //looping thorugh descendant edeges
          //get edge from invisible graph chnage visibility flag
          //remove edge from the visible graph
          nodeToHideDescendants.edges.forEach(nodeToHideEdge => {
            edgeIDListPostProcess.push(nodeToHideEdge.ID);
            if (!(nodeToHideEdge instanceof MetaEdge)) {
              let nodeToHideEdgeInvisible = invisibleGM.edgesMap.get(nodeToHideEdge.ID);
              nodeToHideEdgeInvisible.isVisible = false;
            }
            visibleGM.edgesMap.delete(nodeToHideEdge.ID);
            Auxiliary.removeEdgeFromGraph(nodeToHideEdge);
          });
          //looping thorugh descendant simple nodes
          //get node from invisible graph chnage visibility flag
          //remove node from the visible graph and nodes map
          nodeToHideDescendants.simpleNodes.forEach(nodeToHideSimpleNode => {
            let nodeToHideSimpleNodeInvisible = invisibleGM.nodesMap.get(nodeToHideSimpleNode.ID);
            nodeToHideSimpleNodeInvisible.isVisible = false;
            nodeIDListPostProcess.push(nodeToHideSimpleNode.ID);
            nodeToHideSimpleNode.owner.removeNode(nodeToHideSimpleNode);
            visibleGM.nodesMap.delete(nodeToHideSimpleNode.ID);
          });
          //looping thorugh descendant compound nodes
          //get node from invisible graph chnage visibility flag
          //remove node from the visible graph and nodes map
          nodeToHideDescendants.compoundNodes.forEach(nodeToHideCompoundNode => {
            let nodeToHideCompoundNodeInvisible = invisibleGM.nodesMap.get(nodeToHideCompoundNode.ID);
            nodeToHideCompoundNodeInvisible.isVisible = false;
            nodeIDListPostProcess.push(nodeToHideCompoundNode.ID);
            if (nodeToHideCompoundNode.child.nodes.length == 0) {
              nodeToHideCompoundNode.child.siblingGraph.siblingGraph = null;
            }
            visibleGM.removeGraph(nodeToHideCompoundNode.child);
            nodeToHideCompoundNode.owner.removeNode(nodeToHideCompoundNode);
            visibleGM.nodesMap.delete(nodeToHideCompoundNode.ID);
          });
          //not to remove the child graph can be empty, if yes set sibling graph status of sibling invisible graph to null
          if (nodeToHide.child && nodeToHide.child.nodes.length == 0) {
            nodeToHide.child.siblingGraph.siblingGraph = null;
          }
          //remove node from owner graph, delete it from visible graph and change hidden and visbile flags in invisible graph
          if (nodeToHide.child) {
            visibleGM.removeGraph(nodeToHide.child);
          }
          nodeToHide.owner.removeNode(nodeToHide);
          visibleGM.nodesMap.delete(nodeID);
          nodeIDListPostProcess.push(nodeID);
          let nodeToHideInvisible = invisibleGM.nodesMap.get(nodeID);
          nodeToHideInvisible.isHidden = true;
          nodeToHideInvisible.isVisible = false;
        } else {
          // nodeToHide does not exist in visible graph
          let nodeToHideInvisible = invisibleGM.nodesMap.get(nodeID);
          nodeToHideInvisible.isHidden = true;
          nodeToHideInvisible.isVisible = false;
        }
      });
      //remove duplication from edge list and retrun the combined list of edges and nodes in that order
      edgeIDListPostProcess = new Set(edgeIDListPostProcess);
      edgeIDListPostProcess = [...edgeIDListPostProcess];
      return edgeIDListPostProcess.concat(nodeIDListPostProcess);
    }
    static show(nodeIDList, edgeIDList, visibleGM, invisibleGM) {
      let nodeIDListPostProcess = [];
      let edgeIDListPostProcess = [];
      nodeIDList.forEach(nodeID => {
        if (!visibleGM.nodesMap.get(nodeID)) {
          let nodeToShow = invisibleGM.nodesMap.get(nodeID);
          nodeToShow.isHidden = false;
          let canNodeToShowBeVisible = true;
          if (nodeToShow.isFiltered == false) {
            let tempNode = nodeToShow;
            while (true) {
              if (tempNode.owner == invisibleGM.rootGraph) {
                break;
              } else {
                if (tempNode.owner.parent.isFiltered || tempNode.owner.parent.isHidden || tempNode.owner.parent.isCollapsed) {
                  canNodeToShowBeVisible = false;
                  break;
                } else {
                  tempNode = tempNode.owner.parent;
                }
              }
            }
          } else {
            canNodeToShowBeVisible = false;
          }
          if (canNodeToShowBeVisible) {
            Auxiliary.moveNodeToVisible(nodeToShow, visibleGM, invisibleGM);
            let descendants = FilterUnfilter.makeDescendantNodesVisible(nodeToShow, visibleGM, invisibleGM);
            nodeIDListPostProcess = [...nodeIDListPostProcess, ...descendants.simpleNodes, ...descendants.compoundNodes];
            edgeIDListPostProcess = [...edgeIDListPostProcess, ...descendants.edges];
            nodeIDListPostProcess.push(nodeToShow.ID);
          }
        }
      });
      edgeIDList.forEach(edgeID => {
        if (!visibleGM.edgesMap.get(edgeID)) {
          let edgeToShow = invisibleGM.edgesMap.get(edgeID);
          edgeToShow.isHidden = false;
          // check edge is part of a meta edge in visible graph
          let found = false;
          visibleGM.edgesMap.forEach(visibleEdge => {
            if (visibleEdge instanceof MetaEdge) {
              // this.updateMetaEdge function returns updated version of originalEdges without key of edgeTo Remove
              updatedOrignalEdges = FilterUnfilter.updateMetaEdge(visibleEdge.originalEdges(), edgeToShow.ID);
              // updatedOrignalEdges will be same as originalEdges if edge to remove is not part of the meta edge
              if (updatedOrignalEdges != visibleEdge.originalEdges()) {
                found = true;
              }
            }
          });
          if (!found && edgeToShow.isFiltered == false && edgeToShow.source.isVisible && edgeToShow.target.isVisible) {
            Auxiliary.moveEdgeToVisible(edgeToShow, visibleGM, invisibleGM);
            edgeIDListPostProcess.push(edgeToShow.ID);
          }
        }
      });
      edgeIDListPostProcess = new Set(edgeIDListPostProcess);
      edgeIDListPostProcess = [...edgeIDListPostProcess];
      return nodeIDListPostProcess.concat(edgeIDListPostProcess);
    }
    static showAll(visibleGM, invisibleGM) {
      let hiddenNodeIDList = [];
      let hiddenEdgeIDList = [];
      invisibleGM.nodesMap.forEach((node, NodeID) => {
        if (node.isHidden) {
          hiddenNodeIDList.push(node.ID);
        }
      });
      invisibleGM.edgesMap.forEach((edge, EdgeID) => {
        if (edge.isHidden) {
          hiddenEdgeIDList.push(edge.ID);
        }
      });
      return this.show(hiddenNodeIDList, hiddenEdgeIDList, visibleGM, invisibleGM);
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
      let visibleGM = this.#visibleGraphManager;
      let invisibleGM = this.#invisibleGraphManager;
      return FilterUnfilter.filter(nodeIDList, edgeIDList, visibleGM, invisibleGM);
    }
    unfilter(nodeIDList, edgeIDList) {
      let visibleGM = this.#visibleGraphManager;
      let invisibleGM = this.#invisibleGraphManager;
      return FilterUnfilter.unfilter(nodeIDList, edgeIDList, visibleGM, invisibleGM);
    }

    // hide/show methods

    hide(nodeIDList, edgeIDList) {
      let visibleGM = this.#visibleGraphManager;
      let invisibleGM = this.#invisibleGraphManager;
      return HideShow.hide(nodeIDList, edgeIDList, visibleGM, invisibleGM);
    }
    show(nodeIDList, edgeIDList) {
      let visibleGM = this.#visibleGraphManager;
      let invisibleGM = this.#invisibleGraphManager;
      return HideShow.show(nodeIDList, edgeIDList, visibleGM, invisibleGM);
    }
    showAll() {
      let visibleGM = this.#visibleGraphManager;
      let invisibleGM = this.#invisibleGraphManager;
      return HideShow.showAll(visibleGM, invisibleGM);
    }

    // expand/collapse methods

    collapseNodes(nodeIDList, isRecursive) {
      let visibleGM = this.#visibleGraphManager;
      let invisibleGM = this.#invisibleGraphManager;
      return ExpandCollapse.collapseNodes(nodeIDList, isRecursive, visibleGM, invisibleGM);
    }
    expandNodes(nodeIDList, isRecursive) {
      let visibleGM = this.#visibleGraphManager;
      let invisibleGM = this.#invisibleGraphManager;
      return ExpandCollapse.expandNodes(nodeIDList, isRecursive, visibleGM, invisibleGM);
    }
    collapseAllNodes() {
      let visibleGM = this.#visibleGraphManager;
      let invisibleGM = this.#invisibleGraphManager;
      return ExpandCollapse.collapseAllNodes(visibleGM, invisibleGM);
    }
    expandAllNodes() {
      let visibleGM = this.#visibleGraphManager;
      let invisibleGM = this.#invisibleGraphManager;
      return ExpandCollapse.expandAllNodes(visibleGM, invisibleGM);
    }
    collapseEdges(edgeIDList) {
      let visibleGM = this.#visibleGraphManager;
      let invisibleGM = this.#invisibleGraphManager;
      if (!visibleGM.edgesMap.has(edgeIDList[0])) {
        edgeIDList.shift();
      }
      return ExpandCollapse.collapseEdges(edgeIDList, visibleGM, invisibleGM);
    }
    expandEdges(edgeIDList, isRecursive) {
      let visibleGM = this.#visibleGraphManager;
      let invisibleGM = this.#invisibleGraphManager;
      return ExpandCollapse.expandEdges(edgeIDList, isRecursive, visibleGM, invisibleGM);
    }
    collapseEdgesBetweenNodes(nodeIDList) {
      let visibleGM = this.#visibleGraphManager;
      let invisibleGM = this.#invisibleGraphManager;
      return ExpandCollapse.collapseEdgesBetweenNodes(nodeIDList, visibleGM, invisibleGM);
    }
    expandEdgesBetweenNodes(nodeIDList, isRecursive) {
      let visibleGM = this.#visibleGraphManager;
      let invisibleGM = this.#invisibleGraphManager;
      return ExpandCollapse.expandEdgesBetweenNodes(nodeIDList, isRecursive, visibleGM, invisibleGM);
    }
    collapseAllEdges() {
      let visibleGM = this.#visibleGraphManager;
      let invisibleGM = this.#invisibleGraphManager;
      return ExpandCollapse.collapseAllEdges(visibleGM, invisibleGM);
    }
    expandAllEdges() {
      let visibleGM = this.#visibleGraphManager;
      let invisibleGM = this.#invisibleGraphManager;
      return ExpandCollapse.expandAllEdges(visibleGM, invisibleGM);
    }
    getHiddenNeighbors(nodeID) {
      let invisibleGM = this.#invisibleGraphManager;
      return Auxiliary.getTargetNeighborhoodElements(nodeID, invisibleGM);
    }
    isCollapsible(nodeID) {
      let invisibleGM = this.#invisibleGraphManager;
      let node = invisibleGM.nodesMap.get(nodeID);
      if (node.child && node.isCollapsed == false) {
        return true;
      } else {
        return false;
      }
    }
    isExpandable(nodeID) {
      let invisibleGM = this.#invisibleGraphManager;
      let node = invisibleGM.nodesMap.get(nodeID);
      if (node.child && node.isCollapsed) {
        return true;
      } else {
        return false;
      }
    }
  }

  function complexityManagement(cy) {
    /** Transfer cytoscape graph to complexity management model */
    //  testing github
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
    function actOnInvisible(eleIDList, cy) {
      // Collect cy elements to be removed
      var elesToRemove = cy.collection();
      eleIDList.forEach(function (id) {
        elesToRemove.merge(cy.getElementById(id));
      });

      // Close remove event temporarily because this is not an actual topology change, but a change because of cmgm
      cy.off('remove', actOnRemove);

      // Remove elements from cy graph and add them to the scratchpad
      var removedEles = cy.remove(elesToRemove);
      removedEles.forEach(function (ele) {
        cy.scratch('cyComplexityManagement').removedEles.set(ele.id(), ele);
      });

      // Activate remove event again
      cy.on('remove', actOnRemove);
    }
    function actOnVisible(eleIDList, cy) {
      // Collect cy elements to be added
      var nodesToAdd = cy.collection();
      var edgesToAdd = cy.collection();
      eleIDList.forEach(function (id) {
        var element = cy.scratch('cyComplexityManagement').removedEles.get(id);
        if (element) {
          if (element.isNode()) {
            nodesToAdd.merge(element);
          } else {
            edgesToAdd.merge(element);
          }
        }
      });

      // Close add event temporarily because this is not an actual topology change, but a change because of cmgm
      cy.off('add', actOnAdd);

      // Add elements from cy graph and remove them from the scratchpad
      var addedEles = cy.add(nodesToAdd.merge(edgesToAdd));
      addedEles.forEach(function (ele) {
        cy.scratch('cyComplexityManagement').removedEles.delete(ele.id());
      });

      // Activate remove event again
      cy.on('add', actOnAdd);
    }
    function actOnVisibleForMetaEdge(metaEdgeList, cy) {
      // Close add event temporarily because this is not an actual topology change, but a change because of cmgm
      cy.off('add', actOnAdd);
      metaEdgeList.forEach(function (metaEdgeData) {
        try {
          cy.add({
            group: 'edges',
            data: {
              id: metaEdgeData["ID"],
              source: metaEdgeData["sourceID"],
              target: metaEdgeData["targetID"],
              size: metaEdgeData['size'],
              compound: metaEdgeData['compound']
            }
          });
        } catch (e) {
          console.log(e);
        }
      });

      // Activate remove event again
      cy.on('add', actOnAdd);
    }
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
      var diffToUnfilter = getDifference(filteredElements, newFilteredElements);
      diffToUnfilter.forEach(function (id) {
        filteredElements.delete(id);
      });

      // diff between newFilteredElements and filteredElements should be added to filteredElements
      var diffToFilter = getDifference(newFilteredElements, filteredElements);
      diffToFilter.forEach(function (id) {
        filteredElements.add(id);
      });

      // Adjust to-be-filtered and to-be-unfiltered elements
      var nodeIDListToFilter = [];
      var edgeIDListToFilter = [];
      var nodeIDListToUnfilter = [];
      var edgeIDListToUnfilter = [];
      diffToFilter.forEach(function (id) {
        if (cy.getElementById(id).length > 0 && cy.getElementById(id).isNode() || cy.scratch('cyComplexityManagement').removedEles.has(id) && cy.scratch('cyComplexityManagement').removedEles.get(id).isNode()) {
          nodeIDListToFilter.push(id);
        } else {
          edgeIDListToFilter.push(id);
        }
      });
      diffToUnfilter.forEach(function (id) {
        if (cy.scratch('cyComplexityManagement').removedEles.get(id).isNode()) {
          nodeIDListToUnfilter.push(id);
        } else {
          edgeIDListToUnfilter.push(id);
        }
      });

      // Filter toBeFiltered elements
      var IDsToRemove = compMgrInstance.filter(nodeIDListToFilter, edgeIDListToFilter);

      // Unfilter toBeUnfiltered elements
      var IDsToAdd = compMgrInstance.unfilter(nodeIDListToUnfilter, edgeIDListToUnfilter);
      actOnInvisible(IDsToRemove, cy);
      actOnVisible(IDsToAdd, cy);
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
    api.getHiddenNeighbors = function (nodes) {
      var neighbors = cy.collection();
      nodes.forEach(function (node) {
        var neighborhood = compMgrInstance.getHiddenNeighbors(node.id());
        neighborhood.nodes.forEach(function (id) {
          neighbors.merge(cy.scratch('cyComplexityManagement').removedEles.get(id));
        });
        neighborhood.edges.forEach(function (id) {
          neighbors.merge(cy.scratch('cyComplexityManagement').removedEles.get(id));
        });
      });
      return neighbors;
    };
    api.hide = function (eles) {
      var nodeIDListToHide = [];
      var edgeIDListToHide = [];
      eles.forEach(function (ele) {
        if (ele.isNode()) {
          nodeIDListToHide.push(ele.id());
        } else {
          edgeIDListToHide.push(ele.id());
        }
      });
      var IDsToRemove = compMgrInstance.hide(nodeIDListToHide, edgeIDListToHide);

      // Remove required elements from cy instance
      actOnInvisible(IDsToRemove, cy);
    };
    api.show = function (eles) {
      var nodeIDListToShow = [];
      var edgeIDListToShow = [];
      eles.forEach(function (ele) {
        if (ele.isNode()) {
          nodeIDListToShow.push(ele.id());
        } else {
          edgeIDListToShow.push(ele.id());
        }
      });
      var IDsToAdd = compMgrInstance.show(nodeIDListToShow, edgeIDListToShow);

      // Add required elements to cy instance
      actOnVisible(IDsToAdd, cy);
    };
    api.showAll = function () {
      var IDsToAdd = compMgrInstance.showAll();

      // Add required elements to cy instance
      actOnVisible(IDsToAdd, cy);
    };
    api.collapseNodes = function (nodes) {
      var isRecursive = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
      var nodeIDList = [];
      nodes.forEach(function (node) {
        if (compMgrInstance.isCollapsible(node.id())) {
          nodeIDList.push(node.id());
          node.data('position-before-collapse', {
            x: node.position().x,
            y: node.position().y
          });
          node.data('size-before-collapse', {
            w: node.outerWidth(),
            h: node.outerHeight()
          });
          node.addClass('cy-expand-collapse-collapsed-node');
        }
      });
      var IDsToRemoveTemp = compMgrInstance.collapseNodes(nodeIDList, isRecursive);
      var IDsToRemove = [];
      var IDsToAdd = [];
      IDsToRemoveTemp.nodeIDListForInvisible.forEach(function (id) {
        IDsToRemove.push(id);
      });
      IDsToRemoveTemp.edgeIDListForInvisible.forEach(function (id) {
        IDsToRemove.push(id);
      });
      IDsToRemoveTemp.metaEdgeIDListForVisible.forEach(function (id) {
        IDsToAdd.push(id);
      });

      // Remove required elements from cy instance
      actOnInvisible(IDsToRemove, cy);
      // Add required elements to cy instance
      actOnVisibleForMetaEdge(IDsToAdd, cy);
    };
    api.expandNodes = function (nodes) {
      var isRecursive = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
      var nodeIDList = [];
      nodes.forEach(function (node) {
        if (compMgrInstance.isExpandable(node.id())) {
          nodeIDList.push(node.id());
          node.removeClass('cy-expand-collapse-collapsed-node');
          node.removeData('position-before-collapse');
          node.removeData('size-before-collapse');
        }
      });
      var returnedElements = compMgrInstance.expandNodes(nodeIDList, isRecursive);
      // Add required elements to cy instance
      actOnVisible(_toConsumableArray(returnedElements.nodeIDListForVisible), cy);
      returnedElements.nodeIDListForVisible.forEach(function (nodeID) {
        var node = cy.getElementById(nodeID);
        if (compMgrInstance.isCollapsible(node.id())) {
          node.removeClass('cy-expand-collapse-collapsed-node');
          node.removeData('position-before-collapse');
          node.removeData('size-before-collapse');
        } else if (compMgrInstance.isExpandable(node.id())) {
          node.data('position-before-collapse', {
            x: node.position().x,
            y: node.position().y
          });
          node.data('size-before-collapse', {
            w: node.outerWidth(),
            h: node.outerHeight()
          });
          node.addClass('cy-expand-collapse-collapsed-node');
        }
      });

      // Add required elements to cy instance
      actOnVisible(_toConsumableArray(returnedElements.edgeIDListForVisible), cy);

      // Remove required elements from cy instance
      actOnInvisible(_toConsumableArray(returnedElements.edgeIDListToRemove), cy);
      actOnVisibleForMetaEdge(_toConsumableArray(returnedElements.metaEdgeIDListForVisible), cy);
    };
    api.collapseAllNodes = function () {
      var IDsToRemoveTemp = compMgrInstance.collapseAllNodes();
      var IDsToRemove = [];
      var IDsToAdd = [];
      IDsToRemoveTemp.nodeIDListForInvisible.forEach(function (id) {
        IDsToRemove.push(id);
      });
      IDsToRemoveTemp.collapsedNodes.forEach(function (nodeID) {
        var node = cy.getElementById(nodeID);
        node.data('position-before-collapse', {
          x: node.position().x,
          y: node.position().y
        });
        node.data('size-before-collapse', {
          w: node.outerWidth(),
          h: node.outerHeight()
        });
        node.addClass('cy-expand-collapse-collapsed-node');
      });
      IDsToRemoveTemp.edgeIDListForInvisible.forEach(function (id) {
        IDsToRemove.push(id);
      });
      IDsToRemoveTemp.metaEdgeIDListForVisible.forEach(function (id) {
        IDsToAdd.push(id);
      });

      // Remove required elements from cy instance
      actOnInvisible(IDsToRemove, cy);
      // Add required elements to cy instance
      actOnVisibleForMetaEdge(IDsToAdd, cy);
    };
    api.expandAllNodes = function () {
      var returnedElements = compMgrInstance.expandAllNodes();
      // Add required elements to cy instance
      actOnVisible(_toConsumableArray(returnedElements.nodeIDListForVisible), cy);
      returnedElements.expandedNodes.forEach(function (nodeID) {
        var node = cy.getElementById(nodeID);
        node.removeClass('cy-expand-collapse-collapsed-node');
        node.removeData('position-before-collapse');
        node.removeData('size-before-collapse');
      });

      // Add required elements to cy instance
      actOnVisible(_toConsumableArray(returnedElements.edgeIDListForVisible), cy);

      // Remove required elements from cy instance
      actOnInvisible(_toConsumableArray(returnedElements.edgeIDListToRemove), cy);
    };
    api.collapseEdges = function (edges) {
      var edgeIDList = [];
      edges.forEach(function (edge) {
        edgeIDList.push(edge.id());
      });
      if (edgeIDList.length > 1) {
        var metaEdgeID = compMgrInstance.collapseEdges(edgeIDList);

        // Remove required elements from cy instance
        actOnInvisible(edgeIDList, cy);

        // Add required meta edges to cy instance
        actOnVisibleForMetaEdge(metaEdgeID, cy);
      }
    };
    api.collapseEdgesBetweenNodes = function (nodes) {
      var nodeIDList = [];
      nodes.forEach(function (node) {
        nodeIDList.push(node.id());
      });
      var EdgeIDList = compMgrInstance.collapseEdgesBetweenNodes(nodeIDList);

      // Remove required elements from cy instance
      actOnInvisible(EdgeIDList[0], cy);

      // Add required meta edges to cy instance
      actOnVisibleForMetaEdge(EdgeIDList[1], cy);
    };
    api.collapseAllEdges = function () {
      var EdgeIDList = compMgrInstance.collapseAllEdges();

      // Remove required elements from cy instance
      actOnInvisible(EdgeIDList[0], cy);

      // Add required meta edges to cy instance
      actOnVisibleForMetaEdge(EdgeIDList[1], cy);
    };
    api.expandEdges = function (edges) {
      var isRecursive = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
      var edgeIDList = [];
      edges.forEach(function (edge) {
        edgeIDList.push(edge.id());
      });
      var edgesListReturned = compMgrInstance.expandEdges(edgeIDList, isRecursive);

      // Remove required elements from cy instance
      actOnInvisible(edgesListReturned[2], cy);

      // Add required meta edges to cy instance
      actOnVisible(edgesListReturned[0], cy);

      // Add required meta edges to cy instance
      actOnVisibleForMetaEdge(edgesListReturned[1], cy);
    };
    api.expandEdgesBetweenNodes = function (nodes) {
      var isRecursive = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
      var nodeIDList = [];
      nodes.forEach(function (node) {
        nodeIDList.push(node.id());
      });
      var EdgeIDList = compMgrInstance.expandEdgesBetweenNodes(nodeIDList, isRecursive);

      // Remove required elements from cy instance
      actOnInvisible(EdgeIDList[2], cy);

      // Add required meta edges to cy instance
      actOnVisible(EdgeIDList[0], cy);

      // Add required meta edges to cy instance
      actOnVisibleForMetaEdge(EdgeIDList[1], cy);
    };
    api.expandAllEdges = function () {
      var EdgeIDList = compMgrInstance.expandAllEdges();

      // Remove required elements from cy instance
      actOnInvisible(EdgeIDList[2], cy);

      // Add required meta edges to cy instance
      actOnVisible(EdgeIDList[0], cy);

      // Add required meta edges to cy instance
      actOnVisibleForMetaEdge(EdgeIDList[1], cy);
    };
    api.isCollapsible = function (node) {
      return compMgrInstance.isCollapsible(node.id());
    };
    api.isExpandable = function (node) {
      return compMgrInstance.isExpandable(node.id());
    };
    return api;
  }

  var debounce = function () {
    /**
     * lodash 3.1.1 (Custom Build) <https://lodash.com/>
     * Build: `lodash modern modularize exports="npm" -o ./`
     * Copyright 2012-2015 The Dojo Foundation <http://dojofoundation.org/>
     * Based on Underscore.js 1.8.3 <http://underscorejs.org/LICENSE>
     * Copyright 2009-2015 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
     * Available under MIT license <https://lodash.com/license>
     */
    /** Used as the `TypeError` message for "Functions" methods. */
    var FUNC_ERROR_TEXT = 'Expected a function';

    /* Native method references for those with the same name as other `lodash` methods. */
    var nativeMax = Math.max,
      nativeNow = Date.now;

    /**
     * Gets the number of milliseconds that have elapsed since the Unix epoch
     * (1 January 1970 00:00:00 UTC).
     *
     * @static
     * @memberOf _
     * @category Date
     * @example
     *
     * _.defer(function(stamp) {
     *   console.log(_.now() - stamp);
     * }, _.now());
     * // => logs the number of milliseconds it took for the deferred function to be invoked
     */
    var now = nativeNow || function () {
      return new Date().getTime();
    };

    /**
     * Creates a debounced function that delays invoking `func` until after `wait`
     * milliseconds have elapsed since the last time the debounced function was
     * invoked. The debounced function comes with a `cancel` method to cancel
     * delayed invocations. Provide an options object to indicate that `func`
     * should be invoked on the leading and/or trailing edge of the `wait` timeout.
     * Subsequent calls to the debounced function return the result of the last
     * `func` invocation.
     *
     * **Note:** If `leading` and `trailing` options are `true`, `func` is invoked
     * on the trailing edge of the timeout only if the the debounced function is
     * invoked more than once during the `wait` timeout.
     *
     * See [David Corbacho's article](http://drupalmotion.com/article/debounce-and-throttle-visual-explanation)
     * for details over the differences between `_.debounce` and `_.throttle`.
     *
     * @static
     * @memberOf _
     * @category Function
     * @param {Function} func The function to debounce.
     * @param {number} [wait=0] The number of milliseconds to delay.
     * @param {Object} [options] The options object.
     * @param {boolean} [options.leading=false] Specify invoking on the leading
     *  edge of the timeout.
     * @param {number} [options.maxWait] The maximum time `func` is allowed to be
     *  delayed before it's invoked.
     * @param {boolean} [options.trailing=true] Specify invoking on the trailing
     *  edge of the timeout.
     * @returns {Function} Returns the new debounced function.
     * @example
     *
     * // avoid costly calculations while the window size is in flux
     * jQuery(window).on('resize', _.debounce(calculateLayout, 150));
     *
     * // invoke `sendMail` when the click event is fired, debouncing subsequent calls
     * jQuery('#postbox').on('click', _.debounce(sendMail, 300, {
     *   'leading': true,
     *   'trailing': false
     * }));
     *
     * // ensure `batchLog` is invoked once after 1 second of debounced calls
     * var source = new EventSource('/stream');
     * jQuery(source).on('message', _.debounce(batchLog, 250, {
     *   'maxWait': 1000
     * }));
     *
     * // cancel a debounced call
     * var todoChanges = _.debounce(batchLog, 1000);
     * Object.observe(models.todo, todoChanges);
     *
     * Object.observe(models, function(changes) {
     *   if (_.find(changes, { 'user': 'todo', 'type': 'delete'})) {
     *     todoChanges.cancel();
     *   }
     * }, ['delete']);
     *
     * // ...at some point `models.todo` is changed
     * models.todo.completed = true;
     *
     * // ...before 1 second has passed `models.todo` is deleted
     * // which cancels the debounced `todoChanges` call
     * delete models.todo;
     */
    function debounce(func, wait, options) {
      var args,
        maxTimeoutId,
        result,
        stamp,
        thisArg,
        timeoutId,
        trailingCall,
        lastCalled = 0,
        maxWait = false,
        trailing = true;
      if (typeof func != 'function') {
        throw new TypeError(FUNC_ERROR_TEXT);
      }
      wait = wait < 0 ? 0 : +wait || 0;
      if (options === true) {
        var leading = true;
        trailing = false;
      } else if (isObject(options)) {
        leading = !!options.leading;
        maxWait = 'maxWait' in options && nativeMax(+options.maxWait || 0, wait);
        trailing = 'trailing' in options ? !!options.trailing : trailing;
      }
      function cancel() {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
        if (maxTimeoutId) {
          clearTimeout(maxTimeoutId);
        }
        lastCalled = 0;
        maxTimeoutId = timeoutId = trailingCall = undefined;
      }
      function complete(isCalled, id) {
        if (id) {
          clearTimeout(id);
        }
        maxTimeoutId = timeoutId = trailingCall = undefined;
        if (isCalled) {
          lastCalled = now();
          result = func.apply(thisArg, args);
          if (!timeoutId && !maxTimeoutId) {
            args = thisArg = undefined;
          }
        }
      }
      function delayed() {
        var remaining = wait - (now() - stamp);
        if (remaining <= 0 || remaining > wait) {
          complete(trailingCall, maxTimeoutId);
        } else {
          timeoutId = setTimeout(delayed, remaining);
        }
      }
      function maxDelayed() {
        complete(trailing, timeoutId);
      }
      function debounced() {
        args = arguments;
        stamp = now();
        thisArg = this;
        trailingCall = trailing && (timeoutId || !leading);
        if (maxWait === false) {
          var leadingCall = leading && !timeoutId;
        } else {
          if (!maxTimeoutId && !leading) {
            lastCalled = stamp;
          }
          var remaining = maxWait - (stamp - lastCalled),
            isCalled = remaining <= 0 || remaining > maxWait;
          if (isCalled) {
            if (maxTimeoutId) {
              maxTimeoutId = clearTimeout(maxTimeoutId);
            }
            lastCalled = stamp;
            result = func.apply(thisArg, args);
          } else if (!maxTimeoutId) {
            maxTimeoutId = setTimeout(maxDelayed, remaining);
          }
        }
        if (isCalled && timeoutId) {
          timeoutId = clearTimeout(timeoutId);
        } else if (!timeoutId && wait !== maxWait) {
          timeoutId = setTimeout(delayed, wait);
        }
        if (leadingCall) {
          isCalled = true;
          result = func.apply(thisArg, args);
        }
        if (isCalled && !timeoutId && !maxTimeoutId) {
          args = thisArg = undefined;
        }
        return result;
      }
      debounced.cancel = cancel;
      return debounced;
    }

    /**
     * Checks if `value` is the [language type](https://es5.github.io/#x8) of `Object`.
     * (e.g. arrays, functions, objects, regexes, `new Number(0)`, and `new String('')`)
     *
     * @static
     * @memberOf _
     * @category Lang
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is an object, else `false`.
     * @example
     *
     * _.isObject({});
     * // => true
     *
     * _.isObject([1, 2, 3]);
     * // => true
     *
     * _.isObject(1);
     * // => false
     */
    function isObject(value) {
      // Avoid a V8 JIT bug in Chrome 19-20.
      // See https://code.google.com/p/v8/issues/detail?id=2291 for more details.
      var type = _typeof(value);
      return !!value && (type == 'object' || type == 'function');
    }
    return debounce;
  }();

  var debounce2 = function () {
    /**
     * Slightly modified version of debounce. Calls fn2 at the beginning of frequent calls to fn1
     * @static
     * @category Function
     * @param {Function} fn1 The function to debounce.
     * @param {number} [wait=0] The number of milliseconds to delay.
     * @param {Function} fn2 The function to call the beginning of frequent calls to fn1
     * @returns {Function} Returns the new debounced function.
     */
    function debounce2(fn1, wait, fn2) {
      var timeout;
      var isInit = true;
      return function () {
        var context = this,
          args = arguments;
        var later = function later() {
          timeout = null;
          fn1.apply(context, args);
          isInit = true;
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
        if (isInit) {
          fn2.apply(context, args);
          isInit = false;
        }
      };
    }
    return debounce2;
  }();

  function cueUtilities(params, cy, api) {
    var fn = params;
    var CUE_POS_UPDATE_DELAY = 100;
    var nodeWithRenderedCue;
    var getData = function getData() {
      var scratch = cy.scratch('_cyExpandCollapse');
      return scratch && scratch.cueUtilities;
    };
    var setData = function setData(data) {
      var scratch = cy.scratch('_cyExpandCollapse');
      if (scratch == null) {
        scratch = {};
      }
      scratch.cueUtilities = data;
      cy.scratch('_cyExpandCollapse', scratch);
    };
    var functions = {
      init: function init() {
        var canvas = document.createElement('canvas');
        canvas.classList.add("expand-collapse-canvas");
        var container = document.getElementById('cy');
        var ctx = canvas.getContext('2d');
        container.appendChild(canvas);
        var offset = function offset(elt) {
          var rect = elt.getBoundingClientRect();
          return {
            top: rect.top + document.documentElement.scrollTop,
            left: rect.left + document.documentElement.scrollLeft
          };
        };
        function resize() {
          var width = container.offsetWidth;
          var height = container.offsetHeight;
          var canvasWidth = width * options.pixelRatio;
          var canvasHeight = height * options.pixelRatio;
          canvas.width = canvasWidth;
          canvas.height = canvasHeight;
          canvas.style.width = "".concat(width, "px");
          canvas.style.height = "".concat(height, "px");
          cy.trigger("cyCanvas.resize");
        }
        cy.on("resize", function () {
          resize();
        });
        canvas.setAttribute("style", "position:absolute; top:0; left:0; z-index:".concat(options().zIndex, ";"));
        var _sizeCanvas = debounce(function () {
          canvas.height = cy.container().offsetHeight;
          canvas.width = cy.container().offsetWidth;
          canvas.style.position = 'absolute';
          canvas.style.top = 0;
          canvas.style.left = 0;
          canvas.style.zIndex = options().zIndex;
          setTimeout(function () {
            var canvasBb = offset(canvas);
            var containerBb = offset(container);
            canvas.style.top = -(canvasBb.top - containerBb.top);
            canvas.style.left = -(canvasBb.left - containerBb.left);

            // refresh the cues on canvas resize
            if (cy) {
              clearDraws();
            }
          }, 0);
        }, 250);
        function sizeCanvas() {
          _sizeCanvas();
        }
        resize();
        var data = {};

        // if there are events field in data unbind them here
        // to prevent binding the same event multiple times
        // if (!data.hasEventFields) {
        //   functions['unbind'].apply( $container );
        // }

        function options() {
          return cy.scratch('cyComplexityManagement').options;
        }
        function clearDraws() {
          var w = cy.width();
          var h = cy.height();
          ctx.clearRect(0, 0, w, h);
          nodeWithRenderedCue = null;
        }
        function drawExpandCollapseCue(node) {
          var isCollapsed = node.hasClass('cy-expand-collapse-collapsed-node');

          //Draw expand-collapse rectangles
          var rectSize = options().expandCollapseCueSize;
          var lineSize = options().expandCollapseCueLineSize;
          var cueCenter;
          if (options().expandCollapseCuePosition === 'top-left') {
            var _offset = 1;
            var size = cy.zoom() < 1 ? rectSize / (2 * cy.zoom()) : rectSize / 2;
            var nodeBorderWid = parseFloat(node.css('border-width'));
            var x = node.position('x') - node.width() / 2 - parseFloat(node.css('padding-left')) + nodeBorderWid + size + _offset;
            var y = node.position('y') - node.height() / 2 - parseFloat(node.css('padding-top')) + nodeBorderWid + size + _offset;
            cueCenter = {
              x: x,
              y: y
            };
          } else {
            var option = options().expandCollapseCuePosition;
            cueCenter = typeof option === 'function' ? option.call(this, node) : option;
          }
          var expandcollapseCenter = convertToRenderedPosition(cueCenter);

          // convert to rendered sizes
          rectSize = Math.max(rectSize, rectSize * cy.zoom());
          lineSize = Math.max(lineSize, lineSize * cy.zoom());
          var diff = (rectSize - lineSize) / 2;
          var expandcollapseCenterX = expandcollapseCenter.x;
          var expandcollapseCenterY = expandcollapseCenter.y;
          var expandcollapseStartX = expandcollapseCenterX - rectSize / 2;
          var expandcollapseStartY = expandcollapseCenterY - rectSize / 2;
          var expandcollapseRectSize = rectSize;

          // Draw expand/collapse cue if specified use an image else render it in the default way
          if (isCollapsed && options().expandCueImage) {
            drawImg(options().expandCueImage, expandcollapseStartX, expandcollapseStartY, rectSize, rectSize);
          } else if (!isCollapsed && options().collapseCueImage) {
            drawImg(options().collapseCueImage, expandcollapseStartX, expandcollapseStartY, rectSize, rectSize);
          } else {
            var oldFillStyle = ctx.fillStyle;
            var oldWidth = ctx.lineWidth;
            var oldStrokeStyle = ctx.strokeStyle;
            ctx.fillStyle = "black";
            ctx.strokeStyle = "black";
            ctx.ellipse(expandcollapseCenterX, expandcollapseCenterY, rectSize / 2, rectSize / 2, 0, 0, 2 * Math.PI);
            ctx.fill();
            ctx.beginPath();
            ctx.strokeStyle = "white";
            ctx.lineWidth = Math.max(2.6, 2.6 * cy.zoom());
            ctx.moveTo(expandcollapseStartX + diff, expandcollapseStartY + rectSize / 2);
            ctx.lineTo(expandcollapseStartX + lineSize + diff, expandcollapseStartY + rectSize / 2);
            if (isCollapsed) {
              ctx.moveTo(expandcollapseStartX + rectSize / 2, expandcollapseStartY + diff);
              ctx.lineTo(expandcollapseStartX + rectSize / 2, expandcollapseStartY + lineSize + diff);
            }
            ctx.closePath();
            ctx.stroke();
            ctx.strokeStyle = oldStrokeStyle;
            ctx.fillStyle = oldFillStyle;
            ctx.lineWidth = oldWidth;
          }
          node._private.data.expandcollapseRenderedStartX = expandcollapseStartX;
          node._private.data.expandcollapseRenderedStartY = expandcollapseStartY;
          node._private.data.expandcollapseRenderedCueSize = expandcollapseRectSize;
          nodeWithRenderedCue = node;
        }
        function drawImg(imgSrc, x, y, w, h) {
          var img = new Image(w, h);
          img.src = imgSrc;
          img.onload = function () {
            ctx.drawImage(img, x, y, w, h);
          };
        }
        cy.on('resize', data.eCyResize = function () {
          sizeCanvas();
        });
        cy.on('expandcollapse.clearvisualcue', function () {
          if (nodeWithRenderedCue) {
            clearDraws();
          }
        });
        var oldMousePos = null,
          currMousePos = null;
        cy.on('mousedown', data.eMouseDown = function (e) {
          oldMousePos = e.renderedPosition || e.cyRenderedPosition;
        });
        cy.on('mouseup', data.eMouseUp = function (e) {
          currMousePos = e.renderedPosition || e.cyRenderedPosition;
        });
        cy.on('remove', 'node', data.eRemove = function (evt) {
          var node = evt.target;
          if (node == nodeWithRenderedCue) {
            clearDraws();
          }
        });
        cy.on('select unselect', data.eSelect = function () {
          if (nodeWithRenderedCue) {
            clearDraws();
          }
          var selectedNodes = cy.nodes(':selected');
          if (selectedNodes.length !== 1) {
            return;
          }
          var selectedNode = selectedNodes[0];
          if (api.isExpandable(selectedNode) || api.isCollapsible(selectedNode)) {
            drawExpandCollapseCue(selectedNode);
          }
        });
        cy.on('tap', data.eTap = function (event) {
          var node = nodeWithRenderedCue;
          if (!node) {
            return;
          }
          var expandcollapseRenderedStartX = node.data('expandcollapseRenderedStartX');
          var expandcollapseRenderedStartY = node.data('expandcollapseRenderedStartY');
          var expandcollapseRenderedRectSize = node.data('expandcollapseRenderedCueSize');
          var expandcollapseRenderedEndX = expandcollapseRenderedStartX + expandcollapseRenderedRectSize;
          var expandcollapseRenderedEndY = expandcollapseRenderedStartY + expandcollapseRenderedRectSize;
          var cyRenderedPos = event.renderedPosition || event.cyRenderedPosition;
          var cyRenderedPosX = cyRenderedPos.x;
          var cyRenderedPosY = cyRenderedPos.y;
          var opts = options();
          var factor = (opts.expandCollapseCueSensitivity - 1) / 2;
          if (Math.abs(oldMousePos.x - currMousePos.x) < 5 && Math.abs(oldMousePos.y - currMousePos.y) < 5 && cyRenderedPosX >= expandcollapseRenderedStartX - expandcollapseRenderedRectSize * factor && cyRenderedPosX <= expandcollapseRenderedEndX + expandcollapseRenderedRectSize * factor && cyRenderedPosY >= expandcollapseRenderedStartY - expandcollapseRenderedRectSize * factor && cyRenderedPosY <= expandcollapseRenderedEndY + expandcollapseRenderedRectSize * factor) {
            if (api.isCollapsible(node)) {
              clearDraws();
              node.unselect();
              if (document.getElementById("cbk-flag-recursive").checked) {
                api.collapseNodes([node], true);
              } else {
                api.collapseNodes([node]);
              }
              if (document.getElementById("cbk-run-layout2").checked) {
                cy.layout({
                  name: "fcose",
                  animate: true,
                  randomize: false,
                  stop: function stop() {
                    initializer(cy);
                  }
                }).run();
              } else {
                initializer(cy);
              }
            } else if (api.isExpandable(node)) {
              clearDraws();
              node.unselect();
              if (document.getElementById("cbk-flag-recursive").checked) {
                api.expandNodes([node], true);
              } else {
                api.expandNodes([node]);
              }
              if (document.getElementById("cbk-run-layout2").checked) {
                cy.layout({
                  name: "fcose",
                  animate: true,
                  randomize: false,
                  stop: function stop() {
                    initializer(cy);
                  }
                }).run();
              } else {
                initializer(cy);
              }
            }
          }
        });
        cy.on('afterUndo afterRedo', data.eUndoRedo = data.eSelect);
        cy.on('position', 'node', data.ePosition = debounce2(data.eSelect, CUE_POS_UPDATE_DELAY, clearDraws));
        cy.on('pan zoom', data.ePosition);

        // write options to data
        data.hasEventFields = true;
        setData(data);
      },
      unbind: function unbind() {
        // let $container = this;
        var data = getData();
        if (!data.hasEventFields) {
          console.log('events to unbind does not exist');
          return;
        }
        cy.trigger('expandcollapse.clearvisualcue');
        cy.off('mousedown', 'node', data.eMouseDown).off('mouseup', 'node', data.eMouseUp).off('remove', 'node', data.eRemove).off('tap', 'node', data.eTap).off('add', 'node', data.eAdd).off('position', 'node', data.ePosition).off('pan zoom', data.ePosition).off('select unselect', data.eSelect).off('free', 'node', data.eFree).off('resize', data.eCyResize).off('afterUndo afterRedo', data.eUndoRedo);
      },
      rebind: function rebind() {
        var data = getData();
        if (!data.hasEventFields) {
          console.log('events to rebind does not exist');
          return;
        }
        cy.on('mousedown', 'node', data.eMouseDown).on('mouseup', 'node', data.eMouseUp).on('remove', 'node', data.eRemove).on('tap', 'node', data.eTap).on('add', 'node', data.eAdd).on('position', 'node', data.ePosition).on('pan zoom', data.ePosition).on('select unselect', data.eSelect).on('free', 'node', data.eFree).on('resize', data.eCyResize).on('afterUndo afterRedo', data.eUndoRedo);
      }
    };
    var convertToRenderedPosition = function convertToRenderedPosition(modelPosition) {
      var pan = cy.pan();
      var zoom = cy.zoom();
      var x = modelPosition.x * zoom + pan.x;
      var y = modelPosition.y * zoom + pan.y;
      return {
        x: x,
        y: y
      };
    };
    if (functions[fn]) {
      return functions[fn].apply(cy.container(), Array.prototype.slice.call(arguments, 1));
    } else if (_typeof(fn) == 'object' || !fn) {
      return functions.init.apply(cy.container(), arguments);
    }
    throw new Error('No such function `' + fn + '` for cytoscape.js-expand-collapse');
  }

  function register(cytoscape) {
    // register with cytoscape.js
    cytoscape("core", "complexityManagement", function (opts) {
      var cy = this;
      var options = {
        filterRule: function filterRule(ele) {
          return false;
        },
        cueEnabled: true,
        // Whether cues are enabled
        expandCollapseCuePosition: 'top-left',
        // default cue position is top left you can specify a function per node too
        expandCollapseCueSize: 12,
        // size of expand-collapse cue
        expandCollapseCueLineSize: 8,
        // size of lines used for drawing plus-minus icons
        expandCueImage: undefined,
        // image of expand icon if undefined draw regular expand cue
        collapseCueImage: undefined,
        // image of collapse icon if undefined draw regular collapse cue
        expandCollapseCueSensitivity: 1,
        zIndex: 999
      };

      // If opts is not 'get' that is it is a real options object then initilize the extension
      if (opts !== 'get') {
        options = extendOptions(options, opts);
        var api = complexityManagement(cy);

        // Keeps the temporarily removed elements (because of the complexity management operations)
        var tempRemovedEles = new Map();
        setScratch(cy, 'options', options);
        setScratch(cy, 'api', api);
        setScratch(cy, 'removedEles', tempRemovedEles);
        cueUtilities(options, cy, api);
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
