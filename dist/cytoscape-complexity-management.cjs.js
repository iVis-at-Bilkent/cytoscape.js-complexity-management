'use strict';

var cmgm = require('cmgm');

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
  var compMgrInstance = new cmgm.ComplexityManager();
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
    var isRecursive = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : true;
    var nodeIDList = [];
    nodes.forEach(function (node) {
      nodeIDList.push(node.id());
    });
    var returnedElements = compMgrInstance.expandNodes(nodeIDList, isRecursive);
    // Add required elements to cy instance
    actOnVisible(_toConsumableArray(returnedElements.nodeIDListForVisible), cy);
    // Add required elements to cy instance
    actOnVisible(_toConsumableArray(returnedElements.edgeIDListForVisible), cy);

    // Remove required elements from cy instance
    actOnInvisible(_toConsumableArray(returnedElements.edgeIDListToRemove), cy);
  };
  api.collapseAllNodes = function () {
    var IDsToRemoveTemp = compMgrInstance.collapseAllNodes();
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
  api.expandAllNodes = function () {
    var returnedElements = compMgrInstance.expandAllNodes();
    // Add required elements to cy instance
    actOnVisible(_toConsumableArray(returnedElements.nodeIDListForVisible), cy);
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
    var edgesListReturned = compMgrInstance.expandEdges(edgeIDList, isRecursive);

    // Remove required elements from cy instance
    actOnInvisible(edgeIDList, cy);

    // Add required meta edges to cy instance
    actOnVisible(edgesListReturned[0], cy);

    // Add required meta edges to cy instance
    actOnVisibleForMetaEdge(edgesListReturned[1], cy);
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

module.exports = register;
