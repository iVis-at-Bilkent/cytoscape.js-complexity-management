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

  let  actOnAddOld = (evt) => {
    var elementsToBeAdded = evt.target;
    var nodesToBeAdded = elementsToBeAdded.nodes();
    var edgesToBeAdded = elementsToBeAdded.edges();

    // Add new nodes to both visible and invisible graphs
    processChildrenList(getTopMostNodes(nodesToBeAdded), compMgrInstance);

    // Add new edges to both visible and invisible graphs
    processEdges(edgesToBeAdded, compMgrInstance);
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
      if(invisibleNode.parent().id()){
        return getVisibleParentForPositioning(invisibleNode.parent(),cy)
      }else{
        return undefined
      }
    }
  }
  function actOnVisible(eleIDList, cy, expandCollapse=false) {
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
      if(invisibleNode.id()){
        let inVisibleParent = cyInvisible.getElementById(invisibleNode.data().parent);
      let visibleParent = getVisibleParentForPositioning(invisibleNode,cy);
      if(visibleParent){
        if(visibleParent.id() != inVisibleParent.id()){
          inVisibleParent = cyInvisible.getElementById(visibleParent.id());
        }
        if(visibleParent.position() && node.isChildless()){
          let newPos = translateB(invisibleNode.position().x,invisibleNode.position().y,inVisibleParent.position().x,inVisibleParent.position().y,visibleParent.position().x,visibleParent.position().y);
          node.position(newPos);
        }
      }
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

    // Show to show elements
    let [IDsToAdd,metaEdgeIDs] = compMgrInstance.show(
      nodeIDListToShow,
      edgeIDListToShow
    );

    // Add required elements to cy instance
    actOnVisible(IDsToAdd, cy);
    actOnVisibleForMetaEdge(metaEdgeIDs,cy);
  };

  api.showAll = () => {
    let [IDsToAdd,metaEdgeIDs] = compMgrInstance.showAll();

    // Add required elements to cy instance
    actOnVisible(IDsToAdd, cy);
    actOnVisibleForMetaEdge(metaEdgeIDs,cy);
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

  api.expandNodes = (nodes, isRecursive = false, runLayout = true, pngImage = null, setLabelPosition = null) => {

    let nodeIDList = [];

    nodes.forEach( (node) => {
      if (compMgrInstance.isExpandable(node.id())) {
        nodeIDList.push(node.id());
        if(runLayout){
          expandGraph(node.data().id, cy, pngImage, setLabelPosition)
        }
        node.removeClass("cy-expand-collapse-collapsed-node");
        node.removeData("position-before-collapse");
        node.removeData("size-before-collapse");
      }
    });

    
    setTimeout(() => {
    
      pngImage.pngExpandGraph = cy.png({
        scale:2,
        full:true
      });

    let returnedElements = compMgrInstance.expandNodes(nodeIDList, isRecursive);
    // Add required elements to cy instance
    actOnVisible([...returnedElements.nodeIDListForVisible], cy, true);

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

    }, runLayout?600:0);
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
    const groupedEdges = new Map();

      // Iterate through the edges and group them by their end nodes (regardless of direction)
      edges.forEach(edge => {
        const edgeKey = [edge.source().id(), edge.target().id()].sort().join('-');
        // If the edge key is not in the Map, create a new entry
        if (!groupedEdges.has(edgeKey)) {
          groupedEdges.set(edgeKey, [edge.id()]);
        } else {
          // If the edge key is already in the Map, append the edge to the existing list
          groupedEdges.get(edgeKey).push(edge.id());
        }
      });

      // Convert the Map to an array of arrays
      const ListOfEdgeIDList = Array.from(groupedEdges.values());
    
      ListOfEdgeIDList.forEach(edgeIDList => {
        if (edgeIDList.length > 1) {
          let metaEdgeID = compMgrInstance.collapseEdges(edgeIDList);
  
          // Remove required elements from cy instance
          actOnInvisible(edgeIDList, cy);
  
          // Add required meta edges to cy instance
          actOnVisibleForMetaEdge(metaEdgeID, cy);
        }
      })
      
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

  let expandGraph = (focusID,cy,pngImage,setLabelPosition) => {
    
    let descendants = getDescendantsInorder(instance.getCompMgrInstance('get').mainGraphManager.nodesMap.get(focusID));

   

    cyLayout.remove(cyLayout.elements());

    let fNode = cyLayout.add({
      group: 'nodes',
      data: { id: focusID, 
              parent: null,
              'label' : document.getElementById("cbk-flag-display-node-labels").checked ? focusID : ''
       },
       position: cyInvisible.getElementById(focusID).position()
      }
    )
    fNode.style({'background-color': '#CCE1F9',})
    let savedNodes = [];
    descendants.compoundNodes.forEach( node => {
      if(cyLayout.getElementById( node.owner.parent.ID).length!=0){
        cyLayout.add({
          group: 'nodes',
          data: { id: node.ID, 
                  parent: node.owner.parent.ID,
                  'label' : document.getElementById("cbk-flag-display-node-labels").checked ? node.ID : ''
            },
            position: cyInvisible.getElementById(node.ID).position()
          });

      }else{
        savedNodes.push({
          group: 'nodes',
          data: { id: node.ID, 
                  parent: node.owner.parent.ID,
                  'label' : document.getElementById("cbk-flag-display-node-labels").checked ? node.ID : ''
           },
           position: cyInvisible.getElementById(node.ID).position()
          })
      }

    })

    savedNodes.forEach(cNodeData => {
      cyLayout.add(cNodeData)
    })

    descendants.simpleNodes.forEach( node => {
      try{
      cyLayout.add({
        group: 'nodes',
        data: { id: node.ID, 
                parent: node.owner.parent.ID,
                'label' : document.getElementById("cbk-flag-display-node-labels").checked ? node.ID : ''
              },
              position: cyInvisible.getElementById(node.ID).position()
            });
          
         }catch(e){
            console.log(e);
         }
    })

    let e = [...descendants.edges]
    
    e.forEach( edge => {
      try{
        if(cyLayout.getElementById(edge.source.ID).length == 0  ){
          
          cyLayout.add({
            group: 'nodes',
            data: { id: edge.source.ID, 
              'label' : document.getElementById("cbk-flag-display-node-labels").checked ? edge.source.ID : ''
            },
            position: cyInvisible.getElementById(edge.source.ID).position()
          });
            
        }else if(cyLayout.getElementById(edge.target.ID).length == 0){

          cyLayout.add({
            group: 'nodes',
            data: { id: edge.target.ID, 
              'label' : document.getElementById("cbk-flag-display-node-labels").checked ? edge.target.ID : ''
            },
            position: cyInvisible.getElementById(edge.target.ID).position()
          });
            
        }
          cyLayout.add({
            group: 'edges',
            data: { id: edge.ID, 
                    source: edge.source.ID, 
                    target: edge.target.ID,
                  }
          });

        
      }catch(e){
      }
    })

        cyLayout.layout({name: 'fcose', randomize: false, animate: false}).run();


     const boundingBox = cyLayout.getElementById(focusID).boundingBox();
    
    var focusNodeWidth = boundingBox.w;
    var fcousNodeHeight = boundingBox.h;

    cyLayout.nodes().forEach(node => {node.style('label', node.id());})
    var radioButtons = document.getElementsByName('cbk-flag-display-node-label-pos');
    radioButtons.forEach(function(radio) {
      if(radio.checked){
        setLabelPosition(radio.value);
      }
    });
    if(pngImage!= null){
      pngImage.pngSizeProxyGraph = cyLayout.png({
        scale:2,
        full:true
      });
    }
    
    cyLayout.remove(cyLayout.elements());
    

    let topLevelFocusParent = getTopParent(cy.getElementById(focusID));
    cy.nodes().unselect();
    let compoundsCounter = 1;
    let componentNodes = []
    
    cy.nodes().forEach(node => {
      if(node.id()!= topLevelFocusParent.id() && node.parent().length == 0){
        if(node.isChildless()){
          node.select();
         
        }else{
          selectChildren(node);
        }
          var newboundingBox = cy.collection(cy.$(":selected")).boundingBox();
          newboundingBox = {...newboundingBox,w: node.width(),h:node.height()};
          var width = newboundingBox.w;
          var height = newboundingBox.h;
          
          componentNodes.push({id: node.id(),data:cy.$(":selected"),pos:{
            x: (newboundingBox.x2 + newboundingBox.x1)/2,
            y: (newboundingBox.y1 + newboundingBox.y2)/2}});
          var newNode = cyLayout.add({
                group: 'nodes',
                data: {
                  id: node.id(),
                  label: node.id()
                },
              });
        
        
              newNode.position({
                x: (newboundingBox.x2 + newboundingBox.x1)/2,
                y: (newboundingBox.y1 + newboundingBox.y2)/2
              });
        
              newNode.style({
                'width': Math.max(width,height), // Set the new width of the node
                'height': Math.max(width,height), // Set the new height of the node
                'label' : document.getElementById("cbk-flag-display-node-labels").checked ? newNode.data().id : ''
              });
              
              cy.nodes().unselect();
              compoundsCounter++;
      }
    })
    
    if(cy.getElementById(focusID).parent().length == 0){
      let focusNode = cyLayout.add(cy.getElementById(focusID).clone());
      focusNode.unselect();
  
      focusNode.position({
        x: cy.getElementById(focusID).position().x,
        y: cy.getElementById(focusID).position().y
      });
      focusNode.style({
        'width': Math.max(focusNodeWidth,fcousNodeHeight)+'px', // Set the new width of the node
        'height': Math.max(focusNodeWidth,fcousNodeHeight)+'px',// Set the new height of the node
        'background-color': '#CCE1F9',
        'label' : document.getElementById("cbk-flag-display-node-labels").checked ? focusNode.data().id : ''
      });
    }else{
      var newNode = cyLayout.add({
        group: 'nodes',
        data: {
          id: topLevelFocusParent.id(),
          label: topLevelFocusParent.id()
        },
      });


      newNode.position({
        x: topLevelFocusParent.position().x,
        y: topLevelFocusParent.position().y
      });
      newNode.style({
        'label' : document.getElementById("cbk-flag-display-node-labels").checked ? newNode.data().id : ''
      });
      compoundsCounter++;

      // addAllChildren(topLevelFocusParent,'compound'+(compoundsCounter-1),cyLayout,compoundsCounter,componentNodes,focusID,fcousNodeHeight,focusNodeWidth);
    
      // let descdents = getDescendantsInorderCyGraph(topLevelFocusParent)
      // let children = [...descdents.compoundNodes,...descdents.simpleNodes]

      selectChildren(topLevelFocusParent);
      let children = cy.$(":selected")
      
      cy.nodes().unselect();
      let nodeCache = []
      cyLayout.add(children)
      children.forEach(child => {
        child.select()
        var newboundingBox = cy.collection(cy.$(":selected")).boundingBox();
        newboundingBox = {...newboundingBox,w: child.width(),h:child.height()};
        var width = newboundingBox.w;
        var height = newboundingBox.h;
         
        if(child.id() != focusID){
          if(child.isChildless()){
            componentNodes.push({id: child.id(), data:cy.$(":selected"),pos:{
                x: (newboundingBox.x2 + newboundingBox.x1)/2,
                y: (newboundingBox.y1 + newboundingBox.y2)/2}});

              
                  newNode = cyLayout.getElementById(child.id())
                  newNode.position({
                    x: (newboundingBox.x2 + newboundingBox.x1)/2,
                    y: (newboundingBox.y1 + newboundingBox.y2)/2
                  });
            
                  newNode.style({
                    'width': Math.max(width,height)+'px', // Set the new width of the node
                    'height': Math.max(width,height)+'px', // Set the new height of the node
                    'label' : document.getElementById("cbk-flag-display-node-labels").checked ? newNode.data().id : ''
                  });
                  compoundsCounter++;
          }else{
            compoundsCounter++;
      
          }
        }else{
          

            let newFNode = cyLayout.getElementById(child.id())
            newFNode.position({
                x: child.position().x,
                y: child.position().y
              });
        
              newFNode.style({
                'width': Math.max(focusNodeWidth,fcousNodeHeight)+'px', // Set the new width of the node
                'height': Math.max(focusNodeWidth,fcousNodeHeight)+'px', // Set the new height of the node
                'background-color':'#CCE1F9',
                'label' : document.getElementById("cbk-flag-display-node-labels").checked ? newFNode.data().id : ''
              });
              compoundsCounter++;
        }
        cy.nodes().unselect();

      })
    }


    cy.fit();

    cyLayout.layout({
      name: 'fcose',
        quality: "proof",
        animate:true,
        animationDuration: 500,
        randomize: false, 
        nodeSeparation: 25,
      fixedNodeConstraint:[{nodeId: focusID, position: {x: cy.$('#'+focusID).position('x'),y:cy.$('#'+focusID).position('y')}}]

    }).run();

    componentNodes.forEach(component => {
      let newBox = cyLayout.getElementById(component.id).boundingBox()
      let newPos = {x: (newBox.x2 + newBox.x1)/2,
                    y: (newBox.y1 + newBox.y2)/2}
      let newComponentPosition = translateComponent(component.pos,newPos, component.pos);
      let translationFactor = translateNode(component.pos,newComponentPosition);
      component.data.forEach(node => {
        moveChildren(node,translationFactor,focusID);
      })
    })

    cy.fit();

    cy.getElementById(focusID).select();
    
  }

  function getDescendantsInorder(node) {
    let descendants = {
      edges: new Set(),
      simpleNodes: [],
      compoundNodes: []
    };
    let childGraph = node.child;
    if (childGraph) {
      let childGraphNodes = childGraph.nodes;
      childGraphNodes.forEach((childNode) => {
        let childDescendents = getDescendantsInorder(childNode);
        for (var id in childDescendents) {
          descendants[id] = [...descendants[id] || [], ...childDescendents[id]];
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

  function translateNode(a,a1) {
    // Step 1: Find the displacement vector d between a and a1
    return { x: a1.x - a.x, y: a1.y - a.y };
    
  }

  function translateComponent(focusNodeInCyLayout,componentNodeInCyLayout,FocusNodeInCy) {

    let d = {x:componentNodeInCyLayout.x-focusNodeInCyLayout.x,y:componentNodeInCyLayout.y-focusNodeInCyLayout.y};

    return { x: FocusNodeInCy.x + d.x, y: FocusNodeInCy.y + d.y };
    
  }


  function selectChildren(node) {
    var children = node.children();
  
    if (children.nonempty()) {
      children.forEach(function(child) {
        child.select();
        selectChildren(child);
      });
    }
  }

  function getTopParent(node) {
    if(node.parent().length!=0){
      return getTopParent(node.parent())
    }else{
      return node
    }
  }

  function moveChildren(node,translationFactor,focusID){
    if(node.isChildless() && node.id() != focusID){
      node.animate({
        position: { x: node.position().x + translationFactor.x, y: node.position().y + translationFactor.y },
        
      }, {
        duration: 500
      });
      // node.shift({ x: translationFactor.x, y: translationFactor.y }, { duration: 500 });
    }else{
      node.children().forEach(child =>{
        moveChildren(child,translationFactor,focusID)
      })
    }
  }

  return api;
}
