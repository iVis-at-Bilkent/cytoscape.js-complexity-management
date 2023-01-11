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
  class FilterUnfilter {
    static filter(nodeIDList, edgeIDList, visibleGM, invisibleGM) {
      let nodeIDListPostProcess = [];
      let edgeIDListPostProcess = [...edgeIDList];
      edgeIDList.forEach(edgeID => {
        let edgeToFilter = visibleGM.edgesMap.get(edgeID);
        if (edgeToFilter) {
          let found = false;
          visibleGM.edgesMap.forEach(visibleEdge => {
            if (visibleEdge instanceof MetaEdge) {
              // updateMetaEdge function returns updated version of originalEdges without key of edgeTo Remove
              updatedOriginalEdges = this.updateMetaEdge(visibleEdge.originalEdges(), edgeToFilter.ID);
              // updatedOriginalEdges will be same as originalEdges if edge to remove is not part of the meta edge
              if (updatedOriginalEdges != visibleEdge.originalEdges()) {
                visibleEdge.originalEdges(updatedOriginalEdges);
                found = true;
              }
            }
          });
          if (!found) {
            visibleGM.edgesMap.delete(edgeToFilter.ID);
            Auxiliary.removeEdgeFromGraph(edgeToFilter);
          }
        }
        let edgeToFilterInvisible = invisibleGM.edgesMap.get(edgeID);
        edgeToFilterInvisible.isFiltered = true;
        edgeToFilterInvisible.isVisible = false;
      });
      nodeIDList.forEach(nodeID => {
        let nodeToFilter = visibleGM.nodesMap.get(nodeID);
        if (nodeToFilter) {
          let nodeToFilterDescendants = visibleGM.getDescendantsInorder(nodeToFilter);
          nodeToFilterDescendants.edges.forEach(nodeToFilterEdge => {
            edgeIDListPostProcess.push(nodeToFilterEdge.ID);
            if (!(nodeToFilterEdge instanceof MetaEdge)) {
              let nodeToFilterEdgeInvisible = invisibleGM.edgesMap.get(nodeToFilterEdge.ID);
              nodeToFilterEdgeInvisible.isVisible = false;
            }
            visibleGM.edgesMap.delete(nodeToFilterEdge.ID);
            Auxiliary.removeEdgeFromGraph(nodeToFilterEdge);
          });
          nodeToFilterDescendants.simpleNodes.forEach(nodeToFilterSimpleNode => {
            let nodeToFilterSimpleNodeInvisible = invisibleGM.nodesMap.get(nodeToFilterSimpleNode.ID);
            nodeToFilterSimpleNodeInvisible.isVisible = false;
            nodeIDListPostProcess.push(nodeToFilterSimpleNode.ID);
            nodeToFilterSimpleNode.owner.removeNode(nodeToFilterSimpleNode);
            visibleGM.nodesMap.delete(nodeToFilterSimpleNode.ID);
          });
          nodeToFilterDescendants.compoundNodes.forEach(nodeToFilterCompoundNode => {
            let nodeToFilterCompoundNodeInvisible = invisibleGM.nodesMap.get(nodeToFilterCompoundNode.ID);
            nodeToFilterCompoundNodeInvisible.isVisible = false;
            nodeIDListPostProcess.push(nodeToFilterCompoundNode.ID);
            if (nodeToFilterCompoundNode.child.nodes.length == 0) {
              nodeToFilterCompoundNode.child.siblingGraph.siblingGraph = null;
            }
            visibleGM.removeGraph(nodeToFilterCompoundNode.child);
            nodeToFilterCompoundNode.owner.removeNode(nodeToFilterCompoundNode);
            visibleGM.nodesMap.delete(nodeToFilterCompoundNode.ID);
          });
          if (nodeToFilter.child && nodeToFilter.child.nodes.length == 0) {
            nodeToFilter.child.siblingGraph.siblingGraph = null;
          }
          if (nodeToFilter.child) {
            visibleGM.removeGraph(nodeToFilter.child);
          }
          nodeToFilter.owner.removeNode(nodeToFilter);
          visibleGM.nodesMap.delete(nodeID);
          nodeIDListPostProcess.push(nodeID);
          let nodeToFilterInvisible = invisibleGM.nodesMap.get(nodeID);
          nodeToFilterInvisible.isFiltered = true;
          nodeToFilterInvisible.isVisible = false;
        } else {
          let nodeToFilterInvisible = invisibleGM.nodesMap.get(nodeID);
          nodeToFilterInvisible.isFiltered = true;
          nodeToFilterInvisible.isVisible = false;
        }
      });
      edgeIDListPostProcess = new Set(edgeIDListPostProcess);
      edgeIDListPostProcess = [...edgeIDListPostProcess];
      return edgeIDListPostProcess.concat(nodeIDListPostProcess);
    }
    static unfilter(nodeIDList, edgeIDList, visibleGM, invisibleGM) {
      let nodeIDListPostProcess = [];
      let edgeIDListPostProcess = [];
      nodeIDList.forEach(nodeID => {
        let nodeToUnfilter = invisibleGM.nodesMap.get(nodeID);
        nodeToUnfilter.isFiltered = false;
        let canNodeToUnfilterBeVisible = true;
        if (nodeToUnfilter.isHidden == false) {
          let tempNode = nodeToUnfilter;
          while (true) {
            if (tempNode.owner == invisibleGM.rootGraph) {
              break;
            } else {
              if (tempNode.owner.parent.isHidden || tempNode.owner.parent.isFiltered || tempNode.owner.parent.isCollapsed) {
                canNodeToUnfilterBeVisible = false;
                break;
              } else {
                tempNode = tempNode.owner.parent;
              }
            }
          }
        } else {
          canNodeToUnfilterBeVisible = false;
        }
        if (canNodeToUnfilterBeVisible) {
          Auxiliary.moveNodeToVisible(nodeToUnfilter, visibleGM, invisibleGM);
          let descendants = FilterUnfilter.makeDescendantNodesVisible(nodeToUnfilter, visibleGM, invisibleGM);
          nodeIDListPostProcess = [...nodeIDListPostProcess, ...descendants.simpleNodes, ...descendants.compoundNodes];
          edgeIDListPostProcess = [...edgeIDListPostProcess, ...descendants.edges];
          nodeIDListPostProcess.push(nodeToUnfilter.ID);
        }
      });
      edgeIDList.forEach(edgeID => {
        let edgeToUnfilter = invisibleGM.edgesMap.get(edgeID);
        edgeToUnfilter.isFiltered = false;
        // check edge is part of a meta edge in visible graph
        let found = false;
        visibleGM.edgesMap.forEach(visibleEdge => {
          if (visibleEdge instanceof MetaEdge) {
            // this.updateMetaEdge function returns updated version of originalEdges without key of edgeTo Remove
            updatedOriginalEdges = this.updateMetaEdge(visibleEdge.originalEdges(), edgeToUnfilter.ID);
            // updatedOriginalEdges will be same as originalEdges if edge to remove is not part of the meta edge
            if (updatedOriginalEdges != visibleEdge.originalEdges()) {
              found = true;
            }
          }
        });
        if (!found && edgeToUnfilter.isHidden == false && edgeToUnfilter.source.isVisible && edgeToUnfilter.target.isVisible) {
          Auxiliary.moveEdgeToVisible(edgeToUnfilter, visibleGM, invisibleGM);
          edgeIDListPostProcess.push(edgeToUnfilter.ID);
        }
      });
      edgeIDListPostProcess = new Set(edgeIDListPostProcess);
      edgeIDListPostProcess = [...edgeIDListPostProcess];
      return nodeIDListPostProcess.concat(edgeIDListPostProcess);
    }
    static makeDescendantNodesVisible(nodeToUnfilter, visibleGM, invisibleGM) {
      let descendants = {
        edges: new Set(),
        simpleNodes: [],
        compoundNodes: []
      };
      if (nodeToUnfilter.child) {
        let nodeToUnfilterDescendants = nodeToUnfilter.child.nodes;
        nodeToUnfilterDescendants.forEach(descendantNode => {
          if (descendantNode.isFiltered == false && descendantNode.isHidden == false) {
            Auxiliary.moveNodeToVisible(descendantNode, visibleGM, invisibleGM);
            if (descendantNode.isCollapsed == false) {
              let childDescendents = this.makeDescendantNodesVisible(descendantNode, visibleGM, invisibleGM);
              for (var id in childDescendents) {
                descendants[id] = [...(descendants[id] || []), ...childDescendents[id]];
              }
              descendants['edges'] = new Set(descendants['edges']);
              if (descendantNode.child) {
                descendants.compoundNodes.push(descendantNode.ID);
              } else {
                descendants.simpleNodes.push(descendantNode.ID);
              }
              let nodeEdges = descendantNode.edges;
              nodeEdges.forEach(item => {
                if (item.isFiltered == false && item.isHidden == false && item.source.isVisible && item.target.isVisible) {
                  descendants['edges'].add(item.ID);
                }
              });
            }
          }
        });
      }
      nodeToUnfilter.edges.forEach(edge => {
        if (edge.isFiltered == false && edge.isHidden == false && edge.source.isVisible && edge.target.isVisible) {
          descendants.edges.add(edge.ID);
        }
      });
      return descendants;
    }
    static updateMetaEdge(nestedEdges, targetEdgeID) {
      let updatedMegaEdges = [];
      nestedEdges.forEach((nestedEdge, index) => {
        if (typeof nestedEdge === "string") {
          if (nestedEdge != targetEdgeID) {
            updatedMegaEdges.push(nestedEdge);
          }
        } else {
          update = this.updateMetaEdge(nestedEdge, targetEdge);
          updatedMegaEdges.push(update);
        }
      });
      return updatedMegaEdges.length == 1 ? updatedMegaEdges[0] : updatedMegaEdges;
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
    static moveNodeToVisible(node, visibleGM, invisibleGM) {
      var edgeIDList = [];
      node.isVisible = true;
      let nodeForVisible = new Node(node.ID);
      let newNode = node.owner.siblingGraph.addNode(nodeForVisible);
      visibleGM.nodesMap.set(newNode.ID, newNode);
      if (node.child) {
        if (node.isCollapsed == false) {
          let newGraph = visibleGM.addGraph(new Graph(null, visibleGM), nodeForVisible);
          newGraph.siblingGraph = node.child;
          node.child.siblingGraph = newGraph;
        }
      }
      node.edges.forEach(incidentEdge => {
        visibleGM.edgesMap.forEach(visibleEdge => {
          if (visibleEdge instanceof MetaEdge) {
            // this.updateMetaEdge function returns updated version of originalEdges without key of edgeTo Remove
            let updatedOrignalEdges = FilterUnfilter.updateMetaEdge(visibleEdge.originalEdges, incidentEdge.ID);
            // updatedOrignalEdges will be same as originalEdges if edge to remove is not part of the meta edge
            if (updatedOrignalEdges != visibleEdge.originalEdges) {
              visibleEdge.originalEdges = updatedOrignalEdges;
            }
            //update handled but incident edge should be created in the visible graph.
            //..........THINK........
          }
        });

        if (incidentEdge.isFiltered == false && incidentEdge.isHidden == false && incidentEdge.source.isVisible && incidentEdge.target.isVisible) {
          Auxiliary.moveEdgeToVisible(incidentEdge, visibleGM, invisibleGM);
          edgeIDList.push(incidentEdge.ID);
        }
      });
      return edgeIDList;
    }
    static moveEdgeToVisible(edge, visibleGM, invisibleGM) {
      edge.isVisible = true;
      let edgeForVisible = new Edge(edge.ID, null, null);
      let sourceInVisible = visibleGM.nodesMap.get(edge.source.ID);
      let targetInVisible = visibleGM.nodesMap.get(edge.target.ID);
      let newEdge;
      if (edge.source.owner == edge.target.owner) {
        newEdge = edge.source.owner.siblingGraph.addEdge(edgeForVisible, sourceInVisible, targetInVisible);
      } else {
        newEdge = visibleGM.addInterGraphEdge(edgeForVisible, sourceInVisible, targetInVisible);
      }
      visibleGM.edgesMap.set(newEdge.ID, newEdge);
    }
    static getTargetNeighborhoodElements(nodeID, invisibleGM) {
      let node = invisibleGM.nodesMap.get(nodeID);
      //get zero distance Neighborhood
      let neighborhood = this.getZeroDistanceNeighbors(node, invisibleGM);
      if (!neighborhood.nodes.includes(nodeID)) {
        neighborhood.nodes.push(nodeID);
      }
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
      // append elements from 1 distance to orignal dictionary
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

      //remove all visible nodes
      neighborhood['nodes'] = neighborhood['nodes'].filter(itemID => {
        let itemNode = invisibleGM.nodesMap.get(itemID);
        return !itemNode.isVisible;
      });

      //remove all visible nodes
      neighborhood['edges'] = neighborhood['edges'].filter(itemID => {
        let itemEdge = invisibleGM.edgesMap.get(itemID);
        return !itemEdge.isVisible;
      });
      return neighborhood;
    }
    static getZeroDistanceNeighbors(node, invisibleGM) {
      let neighbors = {
        nodes: [],
        edges: []
      };
      let descendantNeighborhood = this.getDescendantNeighbors(node);
      let predecessorsNeighborhood = this.getPredecessorNeighbors(node, invisibleGM);
      neighbors['nodes'] = [...new Set([...descendantNeighborhood['nodes'], ...predecessorsNeighborhood['nodes']])];
      neighbors['edges'] = [...new Set([...descendantNeighborhood['edges'], ...predecessorsNeighborhood['edges']])];
      return neighbors;
    }
    static getDescendantNeighbors(node) {
      let neighbors = {
        nodes: [],
        edges: []
      };
      if (node.child) {
        let children = node.child.nodes;
        children.forEach(childNode => {
          neighbors.nodes.push(childNode.ID);
          childNode.edges.forEach(element => {
            neighbors.edges.push(element.ID);
          });
          let nodesReturned = this.getDescendantNeighbors(childNode);
          neighbors['nodes'] = [...neighbors['nodes'], ...nodesReturned['nodes']];
          neighbors['edges'] = [...neighbors['edges'], ...nodesReturned['edges']];
        });
      }
      return neighbors;
    }
    static getPredecessorNeighbors(node, invisibleGM) {
      let neighbors = {
        nodes: [],
        edges: []
      };
      if (node.owner != invisibleGM.rootGraph) {
        let predecessors = node.owner.nodes;
        predecessors.forEach(pNode => {
          neighbors['nodes'].push(pNode.ID);
          pNode.edges.forEach(element => {
            neighbors.edges.push(element.ID);
          });
        });
        let nodesReturned = this.getPredecessorNeighbors(node.owner.parent, invisibleGM);
        neighbors['nodes'] = [...neighbors['nodes'], ...nodesReturned['nodes']];
        neighbors['edges'] = [...neighbors['edges'], ...nodesReturned['edges']];
      } else {
        neighbors['nodes'].push(node.ID);
      }
      return neighbors;
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
    removeNestedEdges(nestedEdges, invisibleGM) {
      //loop through the list of nested edges
      nestedEdges.forEach(edgeInInvisibleItem => {
        // nested edge is an id and not a another meta edge
        if (typeof edgeInInvisibleItem === "string") {
          let edgeInInvisible = invisibleGM.edgesMap.get(edgeInInvisibleItem);
          invisibleGM.edgesMap.delete(edgeInInvisible);
          Auxiliary.removeEdgeFromGraph(edgeInInvisible);
        } else {
          //recursively passing the nested edge
          removeNestedEdges(edgeInInvisibleItem, invisibleGM);
        }
      });
    }
    static updateMetaEdge(nestedEdges, targetEdge) {
      //list to store updated list of edges
      let updatedMegaEdges = [];
      //looping thorugh the nested edges array
      nestedEdges.forEach((nestedEdge, index) => {
        if (typeof nestedEdge === "string") {
          //edge is an id
          if (nestedEdge != targetEdge.ID) {
            //if id == target skip it
            updatedMegaEdges.push(nestedEdge);
          }
        } else {
          //edge is an array i.e its enclosed meta edge
          update = this.updateMetaEdge(nestedEdge, targetEdge);
          updatedMegaEdges.push(update);
        }
      });
      //return the updateMetaEdges if length is more than 1 else return the actual ID inside the array
      return updatedMegaEdges.length == 1 ? updatedMegaEdges[0] : updatedMegaEdges;
    }
    static removeEdge(edgeID, visibleGM, invisibleGM) {
      //get edges
      let edgeToRemove = visibleGM.edgesMap.get(edgeID);
      let edgeToRemoveInvisible = invisibleGM.edgesMap.get(edgeID);
      if (edgeToRemove) {
        //if edge exisit in the visible graph
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
              updatedOrignalEdges = this.updateMetaEdge(visibleEdge.originalEdges(), edgeToRemove);
              // updatedOrignalEdges will be same as originalEdges if edge to remove is not part of the meta edge
              if (updatedOrignalEdges != visibleEdge.originalEdges()) {
                visibleEdge.originalEdges(updatedOrignalEdges);
                found = true;
              }
            }
          });
          //if edge is not part of any meta edge
          if (!found) {
            //remove edge from the visible graph
            visibleGM.edgesMap.delete(edgeToRemove.ID);
            Auxiliary.removeEdgeFromGraph(edgeToRemove);
          }
          //remove edge from the invisible graph
          invisibleGM.edgesMap.delete(edgeToRemoveInvisible.ID);
          Auxiliary.removeEdgeFromGraph(edgeToRemoveInvisible);
        }
      } else {
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
    static removedElements = {
      nodeIDListForInvisible: new Set(),
      edgeIDListForInvisible: new Set(),
      metaEdgeIDListForVisible: new Set()
    };
    static addedElements = {
      nodeIDListForVisible: new Set(),
      edgeIDListForVisible: new Set()
    };
    //Double Recursive Solution 
    static #collapseNode(node, visibleGM, invisibleGM) {
      //first process the visible graph
      let [nodeIDListForInvisible, edgeIDListForInvisible, metaEdgeIDListForVisible] = this.traverseDescendants(node, node, visibleGM, invisibleGM);
      visibleGM.removeGraph(node.child);
      nodeIDListForInvisible.forEach(nodeID => {
        visibleGM.nodesMap.delete(nodeID);
      });
      edgeIDListForInvisible.forEach(edgeID => {
        visibleGM.edgesMap.delete(edgeID);
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
      nodeIDListForInvisible.forEach(item => this.removedElements.nodeIDListForInvisible.add(item));
      edgeIDListForInvisible.forEach(item => this.removedElements.edgeIDListForInvisible.add(item));
      this.removedElements.metaEdgeIDListForVisible.add(metaEdgeIDListForVisible);
    }
    static traverseDescendants(node, nodeToBeCollapsed, visibleGM, invisibleGM) {
      let nodeIDListForInvisible = [];
      let edgeIDListForInvisible = [];
      let metaEdgeIDListForVisible = [];
      if (node.child) {
        let childrenNodes = node.child.nodes;
        childrenNodes.forEach(child => {
          nodeIDListForInvisible.push(child.ID);
          child.edges.forEach(childEdge => {
            if (!(childEdge instanceof MetaEdge)) {
              edgeIDListForInvisible.push(childEdge.ID);
            }
            if (childEdge.isInterGraph) {
              let metaEdgeToBeCreated;
              if (childEdge.source == child) {
                metaEdgeToBeCreated = this.incidentEdgeIsOutOfScope(childEdge.target, nodeToBeCollapsed, visibleGM);
                if (metaEdgeToBeCreated) {
                  let newMetaEdge = Topology.addMetaEdge(nodeToBeCollapsed.ID, childEdge.target.ID, [childEdge.ID], visibleGM, invisibleGM);
                  metaEdgeIDListForVisible.push(newMetaEdge.ID);
                }
              } else {
                metaEdgeToBeCreated = this.incidentEdgeIsOutOfScope(childEdge.source, nodeToBeCollapsed, visibleGM);
                if (metaEdgeToBeCreated) {
                  let newMetaEdge = Topology.addMetaEdge(nodeToBeCollapsed.ID, childEdge.target.ID, [childEdge.ID], visibleGM, invisibleGM);
                  metaEdgeIDListForVisible.push(newMetaEdge.ID);
                }
              }
            }
          });
          let [nodeIDsReturned, edgeIDsReturned, metaEdgeIDsReturned] = this.traverseDescendants(child, nodeToBeCollapsed, visibleGM, invisibleGM);
          nodeIDListForInvisible = [...nodeIDListForInvisible, ...nodeIDsReturned];
          edgeIDListForInvisible = [...edgeIDListForInvisible, ...edgeIDsReturned];
          metaEdgeIDListForVisible = [...metaEdgeIDListForVisible, ...metaEdgeIDsReturned];
        });
      }
      return [nodeIDListForInvisible, edgeIDListForInvisible, metaEdgeIDListForVisible];
    }
    static incidentEdgeIsOutOfScope(interGraphEdgeTarget, nodeToBeCollapsed, visibleGM) {
      if (interGraphEdgeTarget.owner == visibleGM.rootGraph) {
        return true;
      } else if (interGraphEdgeTarget.owner.parent == nodeToBeCollapsed) {
        return false;
      } else {
        return this.incidentEdgeIsOutOfScope(interGraphEdgeTarget.owner.parent, nodeToBeCollapsed, visibleGM);
      }
    }

    /*
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
    static #expandNode(node, isRecursive, visibleGM, invisibleGM) {
      let nodeInInvisible = invisibleGM.nodesMap.get(node.ID);
      let newVisibleGraph = visibleGM.addGraph(new Graph(null, visibleGM), node);
      nodeInInvisible.child.siblingGraph = newVisibleGraph;
      newVisibleGraph.siblingGraph = nodeInInvisible.child;
      nodeInInvisible.isCollapsed = false;
      let childrenNodes = nodeInInvisible.child.nodes;
      childrenNodes.forEach(child => {
        if (child.isCollapsed && isRecursive && !child.isFiltered && !child.isHidden || !child.isCollapsed && !child.isFiltered && !child.isHidden) {
          //return list of edges brought back to visible graph
          let tempList = Auxiliary.moveNodeToVisible(child, visibleGM, invisibleGM);
          tempList.forEach(item => this.addedElements.edgeIDListForVisible.add(item));
          this.addedElements.nodeIDListForVisible.add(child.ID);
          if (child.child) {
            let newNode = visibleGM.nodesMap.get(child.ID);
            this.#expandNode(newNode, isRecursive, visibleGM, invisibleGM);
          }
        } else if (child.isCollapsed && !isRecursive && !child.isFiltered && !child.isHidden) {
          this.addedElements.nodeIDListForVisible.add(child.ID);
          let tempList = Auxiliary.moveNodeToVisible(child, visibleGM, invisibleGM);
          tempList.forEach(item => this.addedElements.edgeIDListForVisible.add(item));
        }
      });
    }
    static getDescendantNodes(node) {
      let descendantNodes = [];
      if (node.child) {
        node.child.nodes.forEach(childNode => {
          descendantNodes.push(childNode);
          let nodesReturned = this.getDescendantNodes(childNode);
          descendantNodes = [...descendantNodes, ...nodesReturned];
        });
      }
      return descendantNodes;
    }
    static collapseNodes(nodeIDList, isRecursive, visibleGM, invisibleGM) {
      this.removedElements = {
        nodeIDListForInvisible: new Set(),
        edgeIDListForInvisible: new Set(),
        metaEdgeIDListForVisible: new Set()
      };
      if (isRecursive) {
        nodeIDList.forEach(nodeID => {
          let nodeInVisible = visibleGM.nodesMap.get(nodeID);
          if (nodeInVisible.child) {
            this.collapseCompoundDescendantNodes(nodeInVisible, visibleGM, invisibleGM);
            this.#collapseNode(nodeInVisible, visibleGM, invisibleGM);
            this.removedElements.metaEdgeIDListForVisible.forEach((edgeIDList, index) => {
              if (index != this.removedElements.metaEdgeIDListForVisible.size - 1) {
                edgeIDList.forEach(edgeID => {
                  visibleGM.edgesMap.delete(edgeID);
                });
              }
            });
            let temp1 = [...this.removedElements.metaEdgeIDListForVisible];
            let temp = [...temp1[temp1.length - 1]];
            this.removedElements.metaEdgeIDListForVisible = new Set();
            temp.forEach(item => this.removedElements.edgeIDListForInvisible.add(item));
          }
        });
      } else {
        nodeIDList.forEach(nodeID => {
          let nodeInVisible = visibleGM.nodesMap.get(nodeID);
          if (nodeInVisible.child) {
            this.#collapseNode(nodeInVisible, visibleGM, invisibleGM);
            this.removedElements.metaEdgeIDListForVisible.forEach((edgeIDList, index) => {
              if (index != this.removedElements.metaEdgeIDListForVisible.length - 1) {
                edgeIDList.forEach(edgeID => {
                  visibleGM.edgesMap.delete(edgeID);
                });
              }
            });
            let temp1 = [...this.removedElements.metaEdgeIDListForVisible];
            let temp = [...temp1[temp1.length - 1]];
            this.removedElements.metaEdgeIDListForVisible = new Set();
            temp.forEach(item => this.removedElements.edgeIDListForInvisible.add(item));
          }
        });
      }
      return this.removedElements;
    }
    static collapseCompoundDescendantNodes(node, visibleGM, invisibleGM) {
      if (node.child) {
        node.child.nodes.forEach(childNode => {
          if (childNode.child) {
            this.collapseCompoundDescendantNodes(childNode);
            this.#collapseNode(childNode, visibleGM, invisibleGM);
            this.removedElements.metaEdgeIDListForVisible.forEach((edgeIDList, index) => {
              if (index != this.removedElements.metaEdgeIDListForVisible.size - 1) {
                edgeIDList.forEach(edgeID => {
                  visibleGM.edgesMap.delete(edgeID);
                });
              }
            });
            let temp1 = [...this.removedElements.metaEdgeIDListForVisible];
            let temp = [...temp1[temp1.length - 1]];
            this.removedElements.metaEdgeIDListForVisible = new Set();
            temp.forEach(item => this.removedElements.edgeIDListForInvisible.add(item));
          }
        });
      }
    }
    static expandNodes(nodeIDList, isRecursive, visibleGM, invisibleGM) {
      this.addedElements = {
        nodeIDListForVisible: new Set(),
        edgeIDListForVisible: new Set()
      };
      nodeIDList.forEach(nodeID => {
        let nodeInVisible = visibleGM.nodesMap.get(nodeID);
        let nodeInInvisible = invisibleGM.nodesMap.get(nodeID);
        if (nodeInInvisible.child && nodeInInvisible.isCollapsed && !nodeInInvisible.isFiltered && !nodeInInvisible.isHidden) {
          this.#expandNode(nodeInVisible, isRecursive, visibleGM, invisibleGM);
        }
      });
      return this.addedElements;
    }
    static collapseAllNodes(visibleGM, invisibleGM) {
      let nodeIDList = [];
      visibleGM.rootGraph.nodes.forEach(rootNode => {
        if (rootNode.child) {
          nodeIDList.push(rootNode.ID);
        }
      });
      return this.collapseNodes(nodeIDList, true, visibleGM, invisibleGM);
    }
    static expandAllNodes(visibleGM, invisibleGM) {
      let topCollapsedCompoundNodes = this.getTopCollapsedCompoundNodes(invisibleGM.rootGraph.parent);
      return this.expandNodes(topCollapsedCompoundNodes, true, visibleGM, invisibleGM);
    }
    static getTopCollapsedCompoundNodes(node) {
      let descendantNodes = [];
      if (node.child) {
        node.child.nodes.forEach(childNode => {
          if (childNode.child && childNode.isCollapsed) {
            descendantNodes.push(childNode.ID);
          } else if (childNode.child && !childNode.isCollapsed) {
            let nodesReturned = this.getTopCollapsedCompoundNodes(childNode);
            descendantNodes = [...descendantNodes, ...nodesReturned];
          }
        });
      }
      return descendantNodes;
    }
    static getCompoundDescendantNodes(node, visibleGM, invisibleGM) {
      if (node.child) {
        node.child.nodes.forEach(childNode => {
          if (childNode.child) {
            this.getCompoundDescendantNodes(childNode);
            this.#collapseNode(childNode, visibleGM, invisibleGM);
          }
        });
      }
    }
    static collapseEdges(edgeIDList, visibleGM, invisibleGM) {
      let firstEdge = visibleGM.edgesMap.get(edgeIDList[0]);
      let sourceNode = firstEdge.source;
      let targetNode = firstEdge.target;
      let newMetaEdge = Topology.addMetaEdge(sourceNode.ID, targetNode.ID, edgeIDList, visibleGM, invisibleGM);
      let edgeIDListForInvisible = [];
      edgeIDList.forEach(edgeID => {
        let edge = visibleGM.edgesMap.get(edgeID);
        if (!(edge instanceof MetaEdge)) {
          edgeIDListForInvisible.push(edgeID);
        }
        Auxiliary.removeEdgeFromGraph(edge);
        visibleGM.edgesMap.delete(edge.ID);
      });
      edgeIDListForInvisible.forEach(edgeForInvisibleID => {
        let edgeInInvisible = invisibleGM.edgesMap.get(edgeForInvisibleID);
        edgeInInvisible.isVisible = false;
      });
      return [{
        ID: newMetaEdge.ID,
        sourceID: newMetaEdge.source.ID,
        targetID: newMetaEdge.target.ID
      }];
    }
    static expandEdges(edgeIDList, isRecursive, visibleGM, invisibleGM) {
      let originalEdgeIDList = [];
      edgeIDList.forEach(edgeID => {
        let metaEdge = visibleGM.metaEdgesMap.get(edgeID);
        let sourceNode = metaEdge.source;
        let targetNode = metaEdge.target;
        metaEdge.originalEdges.forEach(originalEdgeID => {
          if (visibleGM.metaEdgesMap.has(originalEdgeID)) {
            let originalEdge = visibleGM.metaEdgesMap.get(originalEdgeID);
            if (isRecursive) {
              let returnedList = this.expandEdges([originalEdge.ID], isRecursive, visibleGM, invisibleGM);
              originalEdgeIDList = [...originalEdgeIDList, ...returnedList];
            } else {
              if (originalEdge.source.owner == originalEdge.target.owner) {
                originalEdge.source.owner.addEdge(originalEdge, originalEdge.source, originalEdge.target);
              } else {
                visibleGM.addInterGraphEdge(originalEdge, originalEdge.source, originalEdge.target);
              }
              visibleGM.edgesMap.set(originalEdge.ID, originalEdge);
            }
          } else {
            let edgeInInvisible = invisibleGM.edgesMap.get(originalEdgeID);
            if (edgeInInvisible.isFiltered == false && edgeInInvisible.isHidden == false) {
              edgeInInvisible.isVisible = true;
              sourceNode = visibleGM.nodesMap.get(edgeInInvisible.source.ID);
              targetNode = visibleGM.nodesMap.get(edgeInInvisible.target.ID);
              let newEdge = new Edge(edgeInInvisible.ID, sourceNode, targetNode);
              if (sourceNode.owner == targetNode.owner) {
                sourceNode.owner.addEdge(newEdge, sourceNode, targetNode);
              } else {
                visibleGM.addInterGraphEdge(newEdge, sourceNode, targetNode);
              }
              visibleGM.edgesMap.set(newEdge.ID, newEdge);
              // creating recursion to expand recursively
            }
          }

          visibleGM.edgeToMetaEdgeMap.delete(originalEdgeID);
          originalEdgeIDList.push(originalEdgeID);
        });
        visibleGM.metaEdgesMap.delete(edgeID);
        visibleGM.edgesMap.delete(edgeID);
      });
      return originalEdgeIDList;
    }
    static collapseEdgesBetweenNodes(nodeIDList, visibleGM, invisibleGM) {
      // node pairs?
    }
    static expandEdgesBetweenNodes(nodeIDList, isRecursive, visibleGM, invisibleGM) {}
    static collapseAllEdges(visibleGM, invisibleGM) {}
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
      ExpandCollapse.expandNodes(nodeIDList, isRecursive, visibleGM, invisibleGM);
    }
    collapseAllNodes() {
      let visibleGM = this.#visibleGraphManager;
      let invisibleGM = this.#invisibleGraphManager;
      return ExpandCollapse.collapseAllNodes(visibleGM, invisibleGM);
    }
    expandAllNodes() {
      let visibleGM = this.#visibleGraphManager;
      let invisibleGM = this.#invisibleGraphManager;
      ExpandCollapse.expandAllNodes(visibleGM, invisibleGM);
    }
    collapseEdges(edgeIDList) {
      let visibleGM = this.#visibleGraphManager;
      let invisibleGM = this.#invisibleGraphManager;
      return ExpandCollapse.collapseEdges(edgeIDList, visibleGM, invisibleGM);
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
    getHiddenNeighbors(nodeID) {
      let invisibleGM = this.#invisibleGraphManager;
      return Auxiliary.getTargetNeighborhoodElements(nodeID, invisibleGM);
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
        if (element.isNode()) {
          nodesToAdd.merge(element);
        } else {
          edgesToAdd.merge(element);
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
        cy.add({
          group: 'edges',
          data: {
            id: metaEdgeData["ID"],
            source: metaEdgeData["sourceID"],
            target: metaEdgeData["targetID"]
          }
        });
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
      var isRecursive = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : true;
      var nodeIDList = [];
      nodes.forEach(function (node) {
        nodeIDList.push(node.id());
      });
      var IDsToRemoveTemp = compMgrInstance.collapseNodes(nodeIDList, isRecursive);
      var IDsToRemove = [];
      IDsToRemoveTemp.nodeIDListForInvisible.forEach(function (id) {
        IDsToRemove.push(id);
      });
      IDsToRemoveTemp.edgeIDListForInvisible.forEach(function (id) {
        IDsToRemove.push(id);
      });
      IDsToRemoveTemp.metaEdgeIDListForVisible.forEach(function (id) {
        IDsToRemove.push(id);
      });

      // Remove required elements from cy instance
      actOnInvisible(IDsToRemove, cy);
    };
    api.expandNodes = function (nodes) {
      var isRecursive = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : true;
      var nodeIDList = [];
      nodes.forEach(function (node) {
        nodeIDList.push(node.id());
      });
      compMgrInstance.expandNodes(nodeIDList, isRecursive);
    };
    api.collapseAllNodes = function () {
      compMgrInstance.collapseAllNodes();
    };
    api.expandAllNodes = function () {
      compMgrInstance.expandAllNodes();
    };
    api.collapseEdges = function (edges) {
      var edgeIDList = [];
      edges.forEach(function (edge) {
        edgeIDList.push(edge.id());
      });
      var metaEdgeID = compMgrInstance.collapseEdges(edgeIDList);

      // Remove required elements from cy instance
      actOnInvisible(edgeIDList, cy);

      // Add required meta edges to cy instance
      actOnVisibleForMetaEdge(metaEdgeID, cy);
    };
    api.expandEdges = function (edges) {
      var isRecursive = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : true;
      var edgeIDList = [];
      edges.forEach(function (edge) {
        edgeIDList.push(edge.id());
      });
      compMgrInstance.expandEdges(edgeIDList, isRecursive);
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
        var tempRemovedEles = new Map();
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
