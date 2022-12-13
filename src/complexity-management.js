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

  function actOnInvisible(eleIDList, cy) {
    // Collect cy elements to be removed
    let elesToRemove = cy.collection();
    eleIDList.forEach((id) => {
      elesToRemove.merge(cy.getElementById(id));
    });

    // Close remove event temporarily because this is not an actual topology change, but a change because of cmgm
    cy.off('remove', actOnRemove);

    // Remove elements from cy graph and add them to the scratchpad
    let removedEles = cy.remove(elesToRemove);
    removedEles.forEach((ele) => {
      cy.scratch('cyComplexityManagement').removedEles.set(ele.id(), ele);
    });

    // Activate remove event again
    cy.on('remove', actOnRemove);
  }

  function actOnVisible(eleIDList, cy) {
    // Collect cy elements to be added
    let elesToAdd = cy.collection();
    eleIDList.forEach((id) => {
      elesToAdd.merge(cy.scratch('cyComplexityManagement').removedEles.get(id));
    });

    // Close add event temporarily because this is not an actual topology change, but a change because of cmgm
    cy.off('add', actOnAdd);

    // Add elements from cy graph and remove them from the scratchpad
    let addedEles = cy.add(elesToAdd);
    addedEles.forEach((ele) => {
      cy.scratch('cyComplexityManagement').removedEles.delete(ele.id());
    });

    // Activate remove event again
    cy.on('add', actOnAdd);
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
    let diffToUnfilter = getDifference(filteredElements, newFilteredElements);

    diffToUnfilter.forEach((id) => {
      filteredElements.delete(id);
    });

    // diff between newFilteredElements and filteredElements should be added to filteredElements
    let diffToFilter = getDifference(newFilteredElements, filteredElements);

    diffToFilter.forEach((id) => {
      filteredElements.add(id);
    });

    // Adjust to-be-filtered and to-be-unfiltered elements
    let nodeIDListToFilter = [];
    let edgeIDListToFilter = [];

    let nodeIDListToUnfilter = [];
    let edgeIDListToUnfilter = [];

    diffToFilter.forEach((id) => {
      if (cy.getElementById(id).isNode()) {
        nodeIDListToFilter.push(id);
      }
      else {
        edgeIDListToFilter.push(id);
      }
    });

    diffToUnfilter.forEach((id) => {
      if (cy.scratch('cyComplexityManagement').removedEles.get(id).isNode()) {
        nodeIDListToUnfilter.push(id);
      }
      else {
        edgeIDListToUnfilter.push(id);
      }
    });

    // Filter toBeFiltered elements
    let IDsToRemove = compMgrInstance.filter(nodeIDListToFilter, edgeIDListToFilter);

    // Unfilter toBeUnfiltered elements
    let IDsToAdd = compMgrInstance.unfilter(nodeIDListToUnfilter, edgeIDListToUnfilter);

    actOnInvisible(IDsToRemove, cy);

    actOnVisible(IDsToAdd, cy);
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
    let nodeIDListToHide = [];
    let edgeIDListToHide = [];

    eles.forEach((ele) => {
      if (ele.isNode()) {
        nodeIDListToHide.push(ele.id());
      }
      else {
        edgeIDListToHide.push(ele.id());
      }
    });

    let IDsToRemove = compMgrInstance.hide(nodeIDListToHide, edgeIDListToHide);

    actOnInvisible(IDsToRemove, cy);
  };

  api.show = (eles) => {
    let nodeIDListToShow = [];
    let edgeIDListToShow = [];

    eles.forEach((ele) => {
      if (ele.isNode()) {
        nodeIDListToShow.push(ele.id());
      }
      else {
        edgeIDListToShow.push(ele.id());
      }
    });

    compMgrInstance.show(nodeIDListToShow, edgeIDListToShow);
  };

  api.showAll = () => {
    compMgrInstance.showAll();
  }

  return api;
}