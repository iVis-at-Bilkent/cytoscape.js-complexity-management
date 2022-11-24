import { ComplexityManager } from 'cmgm';

export function complexityManagement(cy) {

  /** Transfer cytoscape graph to complexity management model */

  // This function finds and returns the top-level nodes in the graph
  let getTopMostNodes = function(nodes) {
    let nodesMap = {};
    nodes.forEach((node) => {
      nodesMap[node.id()] = true;
    })
    let roots = nodes.filter((ele, i) => {
        if(typeof ele === "number") {
          ele = i;
        }
        var parent = ele.parent()[0];
        while(parent != null){
          if(nodesMap[parent.id()]){
            return false;
          }
          parent = parent.parent()[0];
        }
        return true;
    });
  
    return roots;
  };

  // This function processes nodes to add them into both visible and invisible graphs
  let processChildrenList = function(children, compMgr) {
    let size = children.length;
    for (var i = 0; i < size; i++) {
      let theChild = children[i];
      let children_of_children = theChild.children();

      compMgr.addNode(theChild.id(), theChild.parent().id());

      if (children_of_children != null && children_of_children.length > 0) {
        processChildrenList(children_of_children, compMgr);
      }
    }
  }

  // This function processes edges to add them into both visible and invisible graphs
  let processEdges = function(edges, compMgr) {
    for (let i = 0; i < edges.length; i++) {
      let edge = edges[i];
      compMgr.addEdge(edge.id(), edge.source().id(), edge.target().id());
    }
  }

  let compMgrInstance = new ComplexityManager();

  let nodes = cy.nodes();
  let edges = cy.edges();

  // Add nodes to both visible and invisible graphs
  processChildrenList(getTopMostNodes(nodes), compMgrInstance);

  // Add edges to both visible and invisible graphs
  processEdges(edges, compMgrInstance);

  /** Topology related event handling */

  //  Action functions

  let actOnAdd = (evt) => {

  }

  let actOnRemove = (evt) => {

  }
  
  let actOnReconnect = (evt) => {

  }

  let actOnParentChange = (evt) => {

  }

  //Events

  // When new element(s) added
  cy.on('add', actOnAdd);

  // When some element(s) removed
  cy.on('remove', actOnRemove);

  // When source and/or target of an edge changed
  cy.on('move', 'edge', actOnReconnect);

  // When parent of a node changed
  cy.on('move', 'node', actOnParentChange);

  // API to be returned
  let api = {};
  
  api.getCompMgrInstance = () => {
    return compMgrInstance;
  }

  return api;
}