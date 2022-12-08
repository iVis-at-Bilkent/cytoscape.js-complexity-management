import { ComplexityManager } from 'cmgm';

export function complexityManagement(cy) {

  /** Transfer cytoscape graph to complexity management model */

  // This function finds and returns the top-level nodes in the graph
  let getTopMostNodes = (nodes) => {
    let nodesMap = {};
    nodes.forEach((node) => {
      nodesMap[node.id()] = true;
    })
    let roots = nodes.filter((ele, i) => {
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
  let processChildrenList = (children, compMgr) => {
    let size = children.length;
    for (var i = 0; i < size; i++) {
      let theChild = children[i];
      let children_of_children = theChild.children();

      compMgr.addNode(theChild.id(), theChild.parent().id());

      if (children_of_children != null && children_of_children.length > 0) {
        processChildrenList(children_of_children, compMgr);
      }
    }
  };

  // This function processes edges to add them into both visible and invisible graphs
  let processEdges = (edges, compMgr) => {
    for (let i = 0; i < edges.length; i++) {
      let edge = edges[i];
      compMgr.addEdge(edge.id(), edge.source().id(), edge.target().id());
    }
  };

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
    let elementToBeAdded = evt.target;

    // Add new node to both visible and invisible graphs
    if (elementToBeAdded.isNode()) {
      compMgrInstance.addNode(elementToBeAdded.id(), elementToBeAdded.parent().id());
    }
    else {  // Add new edge to both visible and invisible graphs
      compMgrInstance.addEdge(elementToBeAdded.id(), elementToBeAdded.source().id(), elementToBeAdded.target().id());
    }

    // Update filtered elements because new eles added may change the list
    updateFilteredElements();
  };

  let actOnRemove = (evt) => {
    let elementToBeRemoved = evt.target;

    // Remove node from both visible and invisible graphs
    if (elementToBeRemoved.isNode()) {
      compMgrInstance.removeNode(elementToBeRemoved.id());
    }
    else {  // Remove edge from both visible and invisible graphs
      compMgrInstance.removeEdge(elementToBeRemoved.id());
    }

    // Update filtered elements because removed eles may change the list
    updateFilteredElements();
  };

  let actOnReconnect = (evt) => {
    let edgeToReconnect = evt.target;

    // Change the source and/or target of the edge
    compMgrInstance.reconnect(edgeToReconnect.id(), edgeToReconnect.source().id(), edgeToReconnect.target().id());

    // Update filtered elements because changed eles may change the list
    updateFilteredElements();
  };

  let actOnParentChange = (evt) => {
    let nodeToChangeParent = evt.target;

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
  let filteredElements = new Set();

  let getFilterRule = () => {
    return cy.scratch('cyComplexityManagement').options.filterRule;
  };

  let getDifference = function (setA, setB) {
    return new Set([...setA].filter(element => !setB.has(element)));
  }

  function updateFilteredElements() {
    let filterRuleFunc = getFilterRule();
    // Keeps IDs of the new filtered elements that should be filtered based on applying filter rule
    let newFilteredElements = new Set();

    // Find elements that should be filtered, first trace currently visible elements in cy
    cy.elements().forEach((ele) => {
      if (filterRuleFunc(ele)) {
        newFilteredElements.add(ele.id());
      }
    });

    // Then trace the temporarily removed elements
    cy.scratch('cyComplexityManagement').removedEles.forEach((ele) => {
      if (filterRuleFunc(ele)) {
        newFilteredElements.add(ele.id());
      }
    });

    // diff between filteredElements and newFilteredElements should be removed from filteredElements
    let diffToBeUnfiltered = getDifference(filteredElements, newFilteredElements);

    diffToBeUnfiltered.forEach((id) => {
      filteredElements.delete(id);
    });

    // diff between newFilteredElements and filteredElements should be added to filteredElements
    let diffToBeFiltered = getDifference(newFilteredElements, filteredElements);

    diffToBeFiltered.forEach((id) => {
      filteredElements.add(id);
    });

    // Adjust toBeFiltered and toBeUnfiltered elements
    let nodeIDListToBeFiltered = [];
    let edgeIDListToBeFiltered = [];

    let nodeIDListToBeUnfiltered = [];
    let edgeIDListToBeUnfiltered = [];

    diffToBeFiltered.forEach((id) => {
      if (cy.getElementById(id).isNode()) {
        nodeIDListToBeFiltered.push(id);
      }
      else {
        edgeIDListToBeFiltered.push(id);
      }
    });

    diffToBeUnfiltered.forEach((id) => {
      if (cy.getElementById(id).isNode()) {
        nodeIDListToBeUnfiltered.push(id);
      }
      else {
        edgeIDListToBeUnfiltered.push(id);
      }
    });

    // Filter toBeFiltered elements
    compMgrInstance.filter(nodeIDListToBeFiltered, edgeIDListToBeFiltered);

    // Unfilter toBeUnfiltered elements
    compMgrInstance.unfilter(nodeIDListToBeUnfiltered, edgeIDListToBeUnfiltered);
  }

  // API to be returned
  let api = {};

  api.getCompMgrInstance = () => {
    return compMgrInstance;
  };

  api.updateFilterRule = (newFilterRuleFunc) => {
    cy.scratch('cyComplexityManagement').options.filterRule = newFilterRuleFunc;

    // Update filtered elements based on the new filter rule
    updateFilteredElements();
  };

  api.hide = (eles) => {
    let nodesIDsToHide = [];
    let edgeIDsToHide = [];
  };

  return api;
}