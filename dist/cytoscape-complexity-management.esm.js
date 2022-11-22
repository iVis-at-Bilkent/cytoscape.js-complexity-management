import { ComplexityManager } from 'cmgm';

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

  var actOnAdd = function actOnAdd(evt) {};
  var actOnRemove = function actOnRemove(evt) {};
  var actOnReconnect = function actOnReconnect(evt) {};
  var actOnParentChange = function actOnParentChange(evt) {};

  //Events

  // When new element(s) added
  cy.on('add', actOnAdd);

  // When some element(s) removed
  cy.on('remove', actOnRemove);

  // When source and/or target of an edge changed
  cy.on('move', 'edge', actOnReconnect);

  // When parent of a node changed
  cy.on('move', 'node', actOnParentChange);
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

export { register as default };
