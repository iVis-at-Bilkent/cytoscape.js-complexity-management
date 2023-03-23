import { ComplexityManager } from "cmgm";

export function complexityManagement(cy) {
  /** Transfer cytoscape graph to complexity management model */
  //  testing github
  // This function finds and returns the top-level nodes in the graph
  let getTopMostNodes = (nodes) => {
    let nodesMap = {};
    nodes.forEach((node) => {
      nodesMap[node.id()] = true;
    });
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

  let actOnAddTemp = [];

  let clearActOnAdd = () => {
    actOnAddTemp.forEach(elementToBeAdded => {
      let parentNode = compMgrInstance.visibleGraphManager.nodesMap.get(elementToBeAdded.parent().id());
      if(parentNode){
          // Add new node to both visible and invisible graphs
        if (elementToBeAdded.isNode()) {
          compMgrInstance.addNode(
            elementToBeAdded.id(),
            elementToBeAdded.parent().id()
          );
        } 

        const index = actOnAddTemp.indexOf(elementToBeAdded);
        if (index > -1) { // only splice array when item is found
          actOnAddTemp.splice(index, 1); // 2nd parameter means remove one item only
        }
        // Update filtered elements because new eles added may change the list
        updateFilteredElements();

      }
    })

  }

  let actOnAdd = (evt) => {
    let elementToBeAdded = evt.target;
    if(elementToBeAdded.parent().id()){
      let parentNode = compMgrInstance.visibleGraphManager.nodesMap.get(elementToBeAdded.parent().id());
      if(parentNode){
          // Add new node to both visible and invisible graphs
        if (elementToBeAdded.isNode()) {
          compMgrInstance.addNode(
            elementToBeAdded.id(),
            elementToBeAdded.parent().id()
          );
        } 
  
        // Update filtered elements because new eles added may change the list
        updateFilteredElements();
  
      }else{
        actOnAddTemp.push(elementToBeAdded);
      }

    }else{
        // Add new node to both visible and invisible graphs
        if (elementToBeAdded.isNode()) {
          compMgrInstance.addNode(
            elementToBeAdded.id(),
            elementToBeAdded.parent().id()
          );
        } else {
          clearActOnAdd()
          // Add new edge to both visible and invisible graphs
          compMgrInstance.addEdge(
            elementToBeAdded.id(),
            elementToBeAdded.source().id(),
            elementToBeAdded.target().id()
          );
        }

        // Update filtered elements because new eles added may change the list
        updateFilteredElements();
    }
    
    clearActOnAdd();

  };

  let actOnRemove = (evt) => {
    let elementToBeRemoved = evt.target;

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

  let actOnReconnect = (evt) => {
    let edgeToReconnect = evt.target;

    // Change the source and/or target of the edge
    compMgrInstance.reconnect(
      edgeToReconnect.id(),
      edgeToReconnect.source().id(),
      edgeToReconnect.target().id()
    );

    // Update filtered elements because changed eles may change the list
    updateFilteredElements();
  };

  let actOnParentChange = (evt) => {
    let nodeToChangeParent = evt.target;

    // Change the parent of the node
    compMgrInstance.changeParent(
      nodeToChangeParent.id(),
      nodeToChangeParent.parent().id()
    );

    // Update filtered elements because changed eles may change the list
    updateFilteredElements();
  };

  // Events - register action functions to events

  // When new element(s) added
  cy.on("add", actOnAdd);

  // When some element(s) removed
  cy.on("remove", actOnRemove);

  // When source and/or target of an edge changed
  cy.on("move", "edge", actOnReconnect);

  // When parent of a node changed
  cy.on("move", "node", actOnParentChange);

  /** Filter related operations */

  // Keeps the IDs of the currently filtered elements
  let filteredElements = new Set();

  let getFilterRule = () => {
    return cy.scratch("cyComplexityManagement").options.filterRule;
  };

  let getDifference = function (setA, setB) {
    return new Set([...setA].filter((element) => !setB.has(element)));
  };

  function actOnInvisible(eleIDList, cy) {
    // Collect cy elements to be removed
    let elesToRemove = cy.collection();
    eleIDList.forEach((id) => {
      elesToRemove.merge(cy.getElementById(id));
    });

    // Close remove event temporarily because this is not an actual topology change, but a change because of cmgm
    cy.off("remove", actOnRemove);

    // Remove elements from cy graph and add them to the scratchpad
    let removedEles = cy.remove(elesToRemove);
    removedEles.forEach((ele) => {
      cy.scratch("cyComplexityManagement").removedEles.set(ele.id(), ele);
    });

    // Activate remove event again
    cy.on("remove", actOnRemove);
  }
  function translateB(x1, y1, x2, y2, x3, y3) {
    let hx = x3 - x2;
    let hy = y3 - y2;
    let x4 = x1 + hx;
    let y4  = y1 + hy
    return { x: x4, y: y4 };
  }

  function getVisibleParentForPositioning(invisibleNode,cy){
    if(cy.getElementById(invisibleNode.data().parent).data()){
      return cy.getElementById(invisibleNode.data().parent);
    }else{
      return getVisibleParentForPositioning(invisibleNode.parent(),cy)
    }
  }
  function actOnVisible(eleIDList, cy) {
    // Collect cy elements to be added
    let nodesToAdd = cy.collection();
    let edgesToAdd = cy.collection();
    eleIDList.forEach((id) => {
      let element = cy.scratch("cyComplexityManagement").removedEles.get(id);
      if (element) {
        if (element.isNode()) {
          nodesToAdd.merge(element);
        } else {
          edgesToAdd.merge(element);
        }
      }
    });
    
    // Close add event temporarily because this is not an actual topology change, but a change because of cmgm
    cy.off("add", actOnAdd);

    nodesToAdd.forEach(node => {
      let invisibleNode = cyInvisible.getElementById(node.id())
      let inVisibleParent = cyInvisible.getElementById(invisibleNode.data().parent);
      let visibleParent = getVisibleParentForPositioning(invisibleNode,cy);
      if(visibleParent.id() != inVisibleParent.id()){
        inVisibleParent = cyInvisible.getElementById(visibleParent.id());
      }
      if(visibleParent.position() && node.isChildless()){
        let newPos = translateB(invisibleNode.position().x,invisibleNode.position().y,inVisibleParent.position().x,inVisibleParent.position().y,visibleParent.position().x,visibleParent.position().y);
        node.position(newPos);
      }
  })
    // Add elements from cy graph and remove them from the scratchpad
    let addedEles = cy.add(nodesToAdd.merge(edgesToAdd));
    addedEles.forEach((ele) => {
      cy.scratch("cyComplexityManagement").removedEles.delete(ele.id());
    });

    // Activate remove event again
    cy.on("add", actOnAdd);
  }

  function actOnVisibleForMetaEdge(metaEdgeList, cy) {
    // Close add event temporarily because this is not an actual topology change, but a change because of cmgm
    cy.off("add", actOnAdd);
    metaEdgeList.forEach((metaEdgeData) => {
      try {
        cy.add({
          group: "edges",
          data: {
            id: metaEdgeData["ID"],
            source: metaEdgeData["sourceID"],
            target: metaEdgeData["targetID"],
            size: metaEdgeData["size"],
            compound: metaEdgeData["compound"],
          },
        });
      } catch (e) {
      }
    });

    // Activate remove event again
    cy.on("add", actOnAdd);
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
    cy.scratch("cyComplexityManagement").removedEles.forEach((ele) => {
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
      if (
        (cy.getElementById(id).length > 0 && cy.getElementById(id).isNode()) ||
        (cy.scratch("cyComplexityManagement").removedEles.has(id) &&
          cy.scratch("cyComplexityManagement").removedEles.get(id).isNode())
      ) {
        nodeIDListToFilter.push(id);
      } else {
        edgeIDListToFilter.push(id);
      }
    });

    diffToUnfilter.forEach((id) => {
      if (cy.scratch("cyComplexityManagement").removedEles.get(id)?.isNode()) {
        nodeIDListToUnfilter.push(id);
      } else {
        edgeIDListToUnfilter.push(id);
      }
    });

    // Filter toBeFiltered elements
    let IDsToRemove = compMgrInstance.filter(
      nodeIDListToFilter,
      edgeIDListToFilter
    );

    // Unfilter toBeUnfiltered elements
    let [IDsToAdd,metaEdgeIDs] = compMgrInstance.unfilter(
      nodeIDListToUnfilter,
      edgeIDListToUnfilter
    );

    actOnInvisible(IDsToRemove, cy);

    actOnVisible(IDsToAdd, cy);
    actOnVisibleForMetaEdge(metaEdgeIDs,cy);
  }

  // API to be returned
  let api = {};

  api.getCompMgrInstance = () => {
    return compMgrInstance;
  };

  api.updateFilterRule = (newFilterRuleFunc) => {
    cy.scratch("cyComplexityManagement").options.filterRule = newFilterRuleFunc;

    // Update filtered elements based on the new filter rule
    updateFilteredElements();
  };

  api.getHiddenNeighbors = (nodes) => {
    let neighbors = cy.collection();
    nodes.forEach((node) => {
      let neighborhood = compMgrInstance.getHiddenNeighbors(node.id());
      neighborhood.nodes.forEach((id) => {
        neighbors.merge(
          cy.scratch("cyComplexityManagement").removedEles.get(id)
        );
      });

      neighborhood.edges.forEach((id) => {
        neighbors.merge(
          cy.scratch("cyComplexityManagement").removedEles.get(id)
        );
      });
    });

    return neighbors;
  };

  api.hide = (eles) => {
    let nodeIDListToHide = [];
    let edgeIDListToHide = [];

    eles.forEach((ele) => {
      if (ele.isNode()) {
        nodeIDListToHide.push(ele.id());
      } else {
        edgeIDListToHide.push(ele.id());
      }
    });

    let IDsToRemove = compMgrInstance.hide(nodeIDListToHide, edgeIDListToHide);

    // Remove required elements from cy instance
    actOnInvisible(IDsToRemove, cy);
  };

  api.show = (eles) => {
    let nodeIDListToShow = [];
    let edgeIDListToShow = [];

    eles.forEach((ele) => {
      if (ele.isNode()) {
        nodeIDListToShow.push(ele.id());
      } else {
        edgeIDListToShow.push(ele.id());
      }
    });

    let IDsToAdd = compMgrInstance.show(nodeIDListToShow, edgeIDListToShow);

    // Add required elements to cy instance
    actOnVisible(IDsToAdd, cy);
  };

  api.showAll = () => {
    let IDsToAdd = compMgrInstance.showAll();

    // Add required elements to cy instance
    actOnVisible(IDsToAdd, cy);
  };

  api.collapseNodes = (nodes, isRecursive = false) => {
    let nodeIDList = [];

    nodes.forEach((node) => {
      if (compMgrInstance.isCollapsible(node.id())) {
        nodeIDList.push(node.id());
        node.data("position-before-collapse", {
          x: node.position().x,
          y: node.position().y,
        });

        node.data("size-before-collapse", {
          w: node.outerWidth(),
          h: node.outerHeight(),
        });
        node.addClass("cy-expand-collapse-collapsed-node");
      }
    });

    let IDsToRemoveTemp = compMgrInstance.collapseNodes(
      nodeIDList,
      isRecursive
    );

    let IDsToRemove = [];
    let IDsToAdd = [];

    IDsToRemoveTemp.nodeIDListForInvisible.forEach((id) => {
      IDsToRemove.push(id);
    });

    IDsToRemoveTemp.edgeIDListForInvisible.forEach((id) => {
      IDsToRemove.push(id);
    });

    IDsToRemoveTemp.metaEdgeIDListForVisible.forEach((id) => {
      IDsToAdd.push(id);
    });

    // Remove required elements from cy instance
    actOnInvisible(IDsToRemove, cy);
    // Add required elements to cy instance
    actOnVisibleForMetaEdge(IDsToAdd, cy);
  };

  api.expandNodes = (nodes, isRecursive = false) => {
    let nodeIDList = [];

    nodes.forEach((node) => {
      if (compMgrInstance.isExpandable(node.id())) {
        nodeIDList.push(node.id());
        node.removeClass("cy-expand-collapse-collapsed-node");
        node.removeData("position-before-collapse");
        node.removeData("size-before-collapse");
      }
    });

    let returnedElements = compMgrInstance.expandNodes(nodeIDList, isRecursive);
    // Add required elements to cy instance
    actOnVisible([...returnedElements.nodeIDListForVisible], cy);

    returnedElements.nodeIDListForVisible.forEach((nodeID) => {
      let node = cy.getElementById(nodeID);
      if (compMgrInstance.isCollapsible(node.id())) {
        node.removeClass("cy-expand-collapse-collapsed-node");
        node.removeData("position-before-collapse");
        node.removeData("size-before-collapse");
      } else if (compMgrInstance.isExpandable(node.id())) {
        node.data("position-before-collapse", {
          x: node.position().x,
          y: node.position().y,
        });

        node.data("size-before-collapse", {
          w: node.outerWidth(),
          h: node.outerHeight(),
        });
        node.addClass("cy-expand-collapse-collapsed-node");
      }
    });

    // Add required elements to cy instance
    actOnVisible([...returnedElements.edgeIDListForVisible], cy);

    // Remove required elements from cy instance
    actOnInvisible([...returnedElements.edgeIDListToRemove], cy);

    actOnVisibleForMetaEdge([...returnedElements.metaEdgeIDListForVisible], cy);
  };

  api.collapseAllNodes = () => {
    let IDsToRemoveTemp = compMgrInstance.collapseAllNodes();

    let IDsToRemove = [];
    let IDsToAdd = [];

    IDsToRemoveTemp.nodeIDListForInvisible.forEach((id) => {
      IDsToRemove.push(id);
    });

    IDsToRemoveTemp.collapsedNodes.forEach((nodeID) => {
      let node = cy.getElementById(nodeID);

      node.data("position-before-collapse", {
        x: node.position().x,
        y: node.position().y,
      });

      node.data("size-before-collapse", {
        w: node.outerWidth(),
        h: node.outerHeight(),
      });
      node.addClass("cy-expand-collapse-collapsed-node");
    });

    IDsToRemoveTemp.edgeIDListForInvisible.forEach((id) => {
      IDsToRemove.push(id);
    });

    IDsToRemoveTemp.metaEdgeIDListForVisible.forEach((id) => {
      IDsToAdd.push(id);
    });

    // Remove required elements from cy instance
    actOnInvisible(IDsToRemove, cy);
    // Add required elements to cy instance
    actOnVisibleForMetaEdge(IDsToAdd, cy);
  };

  api.expandAllNodes = () => {
    let returnedElements = compMgrInstance.expandAllNodes();
    // Add required elements to cy instance
    actOnVisible([...returnedElements.nodeIDListForVisible], cy);

    returnedElements.expandedNodes.forEach((nodeID) => {
      let node = cy.getElementById(nodeID);

      node.removeClass("cy-expand-collapse-collapsed-node");
      node.removeData("position-before-collapse");
      node.removeData("size-before-collapse");
    });
    
    // Add required elements to cy instance
    actOnVisible([...returnedElements.edgeIDListForVisible], cy);

    let cleanup = []
    cy.edges('[compound = "T"]').forEach(edge => {
      if(!compMgrInstance.visibleGraphManager.edgesMap.has(edge.data().id)){
        cleanup.push(edge.data().id)
      }
    })
    // Remove required elements from cy instance
    actOnInvisible([...returnedElements.edgeIDListToRemove,...cleanup], cy);

  };

  api.collapseEdges = (edges) => {
    let edgeIDList = [];

    edges.forEach((edge) => {
      edgeIDList.push(edge.id());
    });
    if (edgeIDList.length > 1) {
      let metaEdgeID = compMgrInstance.collapseEdges(edgeIDList);

      // Remove required elements from cy instance
      actOnInvisible(edgeIDList, cy);

      // Add required meta edges to cy instance
      actOnVisibleForMetaEdge(metaEdgeID, cy);
    }
  };

  api.collapseEdgesBetweenNodes = (nodes) => {
    let nodeIDList = [];

    nodes.forEach((node) => {
      nodeIDList.push(node.id());
    });

    let EdgeIDList = compMgrInstance.collapseEdgesBetweenNodes(nodeIDList);

    // Remove required elements from cy instance
    actOnInvisible(EdgeIDList[0], cy);

    // Add required meta edges to cy instance
    actOnVisibleForMetaEdge(EdgeIDList[1], cy);
  };

  api.collapseAllEdges = () => {
    let EdgeIDList = compMgrInstance.collapseAllEdges();

    // Remove required elements from cy instance
    actOnInvisible(EdgeIDList[0], cy);

    // Add required meta edges to cy instance
    actOnVisibleForMetaEdge(EdgeIDList[1], cy);
  };

  api.expandEdges = (edges, isRecursive = false) => {
    let edgeIDList = [];

    edges.forEach((edge) => {
      edgeIDList.push(edge.id());
    });

    let edgesListReturned = compMgrInstance.expandEdges(
      edgeIDList,
      isRecursive
    );

    // Remove required elements from cy instance
    actOnInvisible(edgesListReturned[2], cy);

    // Add required meta edges to cy instance
    actOnVisible(edgesListReturned[0], cy);

    // Add required meta edges to cy instance
    actOnVisibleForMetaEdge(edgesListReturned[1], cy);
  };

  api.expandEdgesBetweenNodes = (nodes, isRecursive = false) => {
    let nodeIDList = [];

    nodes.forEach((node) => {
      nodeIDList.push(node.id());
    });

    let EdgeIDList = compMgrInstance.expandEdgesBetweenNodes(
      nodeIDList,
      isRecursive
    );

    // Remove required elements from cy instance
    actOnInvisible(EdgeIDList[2], cy);

    // Add required meta edges to cy instance
    actOnVisible(EdgeIDList[0], cy);

    // Add required meta edges to cy instance
    actOnVisibleForMetaEdge(EdgeIDList[1], cy);
  };

  api.expandAllEdges = () => {
    let EdgeIDList = compMgrInstance.expandAllEdges();

    // Remove required elements from cy instance
    actOnInvisible(EdgeIDList[2], cy);

    // Add required meta edges to cy instance
    actOnVisible(EdgeIDList[0], cy);

    // Add required meta edges to cy instance
    actOnVisibleForMetaEdge(EdgeIDList[1], cy);
  };

  api.isCollapsible = (node) => {
    return compMgrInstance.isCollapsible(node.id());
  };

  api.isExpandable = (node) => {
    return compMgrInstance.isExpandable(node.id());
  };

  return api;
}
