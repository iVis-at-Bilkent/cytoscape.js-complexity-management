'use strict';

var cmgm = require('cmgm');

function _typeof(obj) {
  "@babel/helpers - typeof";

  return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (obj) {
    return typeof obj;
  } : function (obj) {
    return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
  }, _typeof(obj);
}
function _slicedToArray(arr, i) {
  return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _unsupportedIterableToArray(arr, i) || _nonIterableRest();
}
function _toConsumableArray(arr) {
  return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _unsupportedIterableToArray(arr) || _nonIterableSpread();
}
function _arrayWithoutHoles(arr) {
  if (Array.isArray(arr)) return _arrayLikeToArray(arr);
}
function _arrayWithHoles(arr) {
  if (Array.isArray(arr)) return arr;
}
function _iterableToArray(iter) {
  if (typeof Symbol !== "undefined" && iter[Symbol.iterator] != null || iter["@@iterator"] != null) return Array.from(iter);
}
function _iterableToArrayLimit(arr, i) {
  var _i = arr == null ? null : typeof Symbol !== "undefined" && arr[Symbol.iterator] || arr["@@iterator"];
  if (_i == null) return;
  var _arr = [];
  var _n = true;
  var _d = false;
  var _s, _e;
  try {
    for (_i = _i.call(arr); !(_n = (_s = _i.next()).done); _n = true) {
      _arr.push(_s.value);
      if (i && _arr.length === i) break;
    }
  } catch (err) {
    _d = true;
    _e = err;
  } finally {
    try {
      if (!_n && _i["return"] != null) _i["return"]();
    } finally {
      if (_d) throw _e;
    }
  }
  return _arr;
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
function _nonIterableRest() {
  throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
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
  var compMgrInstance = new cmgm.ComplexityManager();
  var nodes = cy.nodes();
  var edges = cy.edges();

  // Add nodes to both visible and invisible graphs
  processChildrenList(getTopMostNodes(nodes), compMgrInstance);

  // Add edges to both visible and invisible graphs
  processEdges(edges, compMgrInstance);

  /** Topology related event handling */

  //  Action functions

  var actOnAddTemp = [];
  var clearActOnAdd = function clearActOnAdd() {
    actOnAddTemp.forEach(function (elementToBeAdded) {
      var parentNode = compMgrInstance.visibleGraphManager.nodesMap.get(elementToBeAdded.parent().id());
      if (parentNode) {
        // Add new node to both visible and invisible graphs
        if (elementToBeAdded.isNode()) {
          compMgrInstance.addNode(elementToBeAdded.id(), elementToBeAdded.parent().id());
        }
        var index = actOnAddTemp.indexOf(elementToBeAdded);
        if (index > -1) {
          // only splice array when item is found
          actOnAddTemp.splice(index, 1); // 2nd parameter means remove one item only
        }
        // Update filtered elements because new eles added may change the list
        updateFilteredElements();
      }
    });
  };
  var actOnAdd = function actOnAdd(evt) {
    var elementToBeAdded = evt.target;
    if (elementToBeAdded.parent().id()) {
      var parentNode = compMgrInstance.visibleGraphManager.nodesMap.get(elementToBeAdded.parent().id());
      if (parentNode) {
        // Add new node to both visible and invisible graphs
        if (elementToBeAdded.isNode()) {
          compMgrInstance.addNode(elementToBeAdded.id(), elementToBeAdded.parent().id());
        }

        // Update filtered elements because new eles added may change the list
        updateFilteredElements();
      } else {
        actOnAddTemp.push(elementToBeAdded);
      }
    } else {
      // Add new node to both visible and invisible graphs
      if (elementToBeAdded.isNode()) {
        compMgrInstance.addNode(elementToBeAdded.id(), elementToBeAdded.parent().id());
      } else {
        clearActOnAdd();
        // Add new edge to both visible and invisible graphs
        compMgrInstance.addEdge(elementToBeAdded.id(), elementToBeAdded.source().id(), elementToBeAdded.target().id());
      }

      // Update filtered elements because new eles added may change the list
      updateFilteredElements();
    }
    clearActOnAdd();
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
  cy.on("add", actOnAdd);

  // When some element(s) removed
  cy.on("remove", actOnRemove);

  // When source and/or target of an edge changed
  cy.on("move", "edge", actOnReconnect);

  // When parent of a node changed
  cy.on("move", "node", actOnParentChange);

  /** Filter related operations */

  // Keeps the IDs of the currently filtered elements
  var filteredElements = new Set();
  var getFilterRule = function getFilterRule() {
    return cy.scratch("cyComplexityManagement").options.filterRule;
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
    cy.off("remove", actOnRemove);

    // Remove elements from cy graph and add them to the scratchpad
    var removedEles = cy.remove(elesToRemove);
    removedEles.forEach(function (ele) {
      cy.scratch("cyComplexityManagement").removedEles.set(ele.id(), ele);
    });

    // Activate remove event again
    cy.on("remove", actOnRemove);
  }
  function translateB(x1, y1, x2, y2, x3, y3) {
    var hx = x3 - x2;
    var hy = y3 - y2;
    var x4 = x1 + hx;
    var y4 = y1 + hy;
    return {
      x: x4,
      y: y4
    };
  }
  function getVisibleParentForPositioning(invisibleNode, cy) {
    if (cy.getElementById(invisibleNode.data().parent).data()) {
      return cy.getElementById(invisibleNode.data().parent);
    } else {
      if (invisibleNode.parent().id()) {
        return getVisibleParentForPositioning(invisibleNode.parent(), cy);
      } else {
        return undefined;
      }
    }
  }
  function actOnVisible(eleIDList, cy) {
    // Collect cy elements to be added
    var nodesToAdd = cy.collection();
    var edgesToAdd = cy.collection();
    eleIDList.forEach(function (id) {
      var element = cy.scratch("cyComplexityManagement").removedEles.get(id);
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
    nodesToAdd.forEach(function (node) {
      var invisibleNode = cyInvisible.getElementById(node.id());
      if (invisibleNode.id()) {
        var inVisibleParent = cyInvisible.getElementById(invisibleNode.data().parent);
        var visibleParent = getVisibleParentForPositioning(invisibleNode, cy);
        if (visibleParent) {
          if (visibleParent.id() != inVisibleParent.id()) {
            inVisibleParent = cyInvisible.getElementById(visibleParent.id());
          }
          if (visibleParent.position() && node.isChildless()) {
            var newPos = translateB(invisibleNode.position().x, invisibleNode.position().y, inVisibleParent.position().x, inVisibleParent.position().y, visibleParent.position().x, visibleParent.position().y);
            node.position(newPos);
          }
        }
      }
    });
    // Add elements from cy graph and remove them from the scratchpad
    var addedEles = cy.add(nodesToAdd.merge(edgesToAdd));
    addedEles.forEach(function (ele) {
      cy.scratch("cyComplexityManagement").removedEles.delete(ele.id());
    });

    // Activate remove event again
    cy.on("add", actOnAdd);
  }
  function actOnVisibleForMetaEdge(metaEdgeList, cy) {
    // Close add event temporarily because this is not an actual topology change, but a change because of cmgm
    cy.off("add", actOnAdd);
    metaEdgeList.forEach(function (metaEdgeData) {
      try {
        cy.add({
          group: "edges",
          data: {
            id: metaEdgeData["ID"],
            source: metaEdgeData["sourceID"],
            target: metaEdgeData["targetID"],
            size: metaEdgeData["size"],
            compound: metaEdgeData["compound"]
          }
        });
      } catch (e) {}
    });

    // Activate remove event again
    cy.on("add", actOnAdd);
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
    cy.scratch("cyComplexityManagement").removedEles.forEach(function (ele) {
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
      if (cy.getElementById(id).length > 0 && cy.getElementById(id).isNode() || cy.scratch("cyComplexityManagement").removedEles.has(id) && cy.scratch("cyComplexityManagement").removedEles.get(id).isNode()) {
        nodeIDListToFilter.push(id);
      } else {
        edgeIDListToFilter.push(id);
      }
    });
    diffToUnfilter.forEach(function (id) {
      var _cy$scratch$removedEl;
      if ((_cy$scratch$removedEl = cy.scratch("cyComplexityManagement").removedEles.get(id)) !== null && _cy$scratch$removedEl !== void 0 && _cy$scratch$removedEl.isNode()) {
        nodeIDListToUnfilter.push(id);
      } else {
        edgeIDListToUnfilter.push(id);
      }
    });

    // Filter toBeFiltered elements
    var IDsToRemove = compMgrInstance.filter(nodeIDListToFilter, edgeIDListToFilter);

    // Unfilter toBeUnfiltered elements
    var _compMgrInstance$unfi = compMgrInstance.unfilter(nodeIDListToUnfilter, edgeIDListToUnfilter),
      _compMgrInstance$unfi2 = _slicedToArray(_compMgrInstance$unfi, 2),
      IDsToAdd = _compMgrInstance$unfi2[0],
      metaEdgeIDs = _compMgrInstance$unfi2[1];
    actOnInvisible(IDsToRemove, cy);
    actOnVisible(IDsToAdd, cy);
    actOnVisibleForMetaEdge(metaEdgeIDs, cy);
  }

  // API to be returned
  var api = {};
  api.getCompMgrInstance = function () {
    return compMgrInstance;
  };
  api.updateFilterRule = function (newFilterRuleFunc) {
    cy.scratch("cyComplexityManagement").options.filterRule = newFilterRuleFunc;

    // Update filtered elements based on the new filter rule
    updateFilteredElements();
  };
  api.getHiddenNeighbors = function (nodes) {
    var neighbors = cy.collection();
    nodes.forEach(function (node) {
      var neighborhood = compMgrInstance.getHiddenNeighbors(node.id());
      neighborhood.nodes.forEach(function (id) {
        neighbors.merge(cy.scratch("cyComplexityManagement").removedEles.get(id));
      });
      neighborhood.edges.forEach(function (id) {
        neighbors.merge(cy.scratch("cyComplexityManagement").removedEles.get(id));
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
        node.data("position-before-collapse", {
          x: node.position().x,
          y: node.position().y
        });
        node.data("size-before-collapse", {
          w: node.outerWidth(),
          h: node.outerHeight()
        });
        node.addClass("cy-expand-collapse-collapsed-node");
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
        node.removeClass("cy-expand-collapse-collapsed-node");
        node.removeData("position-before-collapse");
        node.removeData("size-before-collapse");
      }
    });
    var returnedElements = compMgrInstance.expandNodes(nodeIDList, isRecursive);
    // Add required elements to cy instance
    actOnVisible(_toConsumableArray(returnedElements.nodeIDListForVisible), cy);
    returnedElements.nodeIDListForVisible.forEach(function (nodeID) {
      var node = cy.getElementById(nodeID);
      if (compMgrInstance.isCollapsible(node.id())) {
        node.removeClass("cy-expand-collapse-collapsed-node");
        node.removeData("position-before-collapse");
        node.removeData("size-before-collapse");
      } else if (compMgrInstance.isExpandable(node.id())) {
        node.data("position-before-collapse", {
          x: node.position().x,
          y: node.position().y
        });
        node.data("size-before-collapse", {
          w: node.outerWidth(),
          h: node.outerHeight()
        });
        node.addClass("cy-expand-collapse-collapsed-node");
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
      node.data("position-before-collapse", {
        x: node.position().x,
        y: node.position().y
      });
      node.data("size-before-collapse", {
        w: node.outerWidth(),
        h: node.outerHeight()
      });
      node.addClass("cy-expand-collapse-collapsed-node");
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
      node.removeClass("cy-expand-collapse-collapsed-node");
      node.removeData("position-before-collapse");
      node.removeData("size-before-collapse");
    });

    // Add required elements to cy instance
    actOnVisible(_toConsumableArray(returnedElements.edgeIDListForVisible), cy);
    var cleanup = [];
    cy.edges('[compound = "T"]').forEach(function (edge) {
      if (!compMgrInstance.visibleGraphManager.edgesMap.has(edge.data().id)) {
        cleanup.push(edge.data().id);
      }
    });
    // Remove required elements from cy instance
    actOnInvisible([].concat(_toConsumableArray(returnedElements.edgeIDListToRemove), cleanup), cy);
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

function getDescendantsInorder(node) {
  var descendants = {
    edges: new Set(),
    simpleNodes: [],
    compoundNodes: []
  };
  var childGraph = node.child;
  if (childGraph) {
    var childGraphNodes = childGraph.nodes;
    childGraphNodes.forEach(function (childNode) {
      var childDescendents = getDescendantsInorder(childNode);
      for (var id in childDescendents) {
        descendants[id] = [].concat(_toConsumableArray(descendants[id] || []), _toConsumableArray(childDescendents[id]));
      }
      descendants['edges'] = new Set(descendants['edges']);
      if (childNode.child) {
        descendants.compoundNodes.push(childNode);
      } else {
        descendants.simpleNodes.push(childNode);
      }
      var nodeEdges = childNode.edges;
      nodeEdges.forEach(function (item) {
        return descendants['edges'].add(item);
      });
    });
  }
  return descendants;
}
function calculateExpansionFactor(focusID) {
  var descendants = getDescendantsInorder(instance.getCompMgrInstance('get').invisibleGraphManager.nodesMap.get(focusID));
  var nodeDiamensionSum = 0;
  descendants.simpleNodes.forEach(function (node) {
    if (!isNaN(node === null || node === void 0 ? void 0 : node.width)) {
      nodeDiamensionSum += node === null || node === void 0 ? void 0 : node.width;
    }
  });
  var averageNodeDiamension = Math.max(nodeDiamensionSum, 40) / descendants.simpleNodes.length;
  var edgeDiamensionSum = 0;
  descendants.edges.forEach(function (edge) {
    if (edge.source.owner == edge.target.owner) {
      edgeDiamensionSum += 80;
    } else {
      edgeDiamensionSum += 160;
    }
  });
  var averageEdgeDiamension = Math.max(edgeDiamensionSum, 80) / descendants.edges.size;
  var areaCoveredByGrid = Math.pow((2 * Math.sqrt(descendants.simpleNodes.length) - 1) * averageNodeDiamension, 2);
  var areaCoveredByEdges = descendants.edges.size * averageEdgeDiamension;
  var totalAreaCovered = areaCoveredByGrid + areaCoveredByEdges;
  var expansionFactor = Math.sqrt(totalAreaCovered / Math.PI);
  console.log(expansionFactor, expansionFactor * 7);
  return expansionFactor * 7;
}
function expandGraph(focusID, cy) {
  var focusNode = cy.getElementById(focusID);
  var expansionFactor = calculateExpansionFactor(focusID);
  cy.layout({
    name: 'fcose',
    quality: "proof",
    animate: true,
    animationDuration: 1000,
    randomize: false,
    nodeRepulsion: function nodeRepulsion(node) {
      var nodeGeometricDistance = 1 + Math.sqrt(Math.pow(focusNode.position().x - node.position().x, 2) + Math.pow(focusNode.position().y - node.position().y, 2));
      console.log(nodeGeometricDistance, expansionFactor, expansionFactor / nodeGeometricDistance);
      return 7500 * (expansionFactor / nodeGeometricDistance);
    },
    idealEdgeLength: function idealEdgeLength(edge) {
      var currentEdgeLength = Math.sqrt(Math.pow(edge.source().position().x - edge.target().position().x, 2) + Math.pow(edge.source().position().y - edge.target().position().y, 2));
      var sourceGeometricDistance = Math.sqrt(Math.pow(focusNode.position().x - edge.source().position().x, 2) + Math.pow(focusNode.position().y - edge.source().position().y, 2));
      var targetGeometricDistance = Math.sqrt(Math.pow(focusNode.position().x - edge.target().position().x, 2) + Math.pow(focusNode.position().y - edge.target().position().y, 2));
      var avgGeometricDistance = (sourceGeometricDistance + targetGeometricDistance) / 2;
      return currentEdgeLength * (expansionFactor / avgGeometricDistance);
    }
  }).run();
}
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
            if (document.getElementById("cbk-flag-recursive").checked) {
              api.collapseNodes([node], true);
            } else {
              api.collapseNodes([node]);
            }
            if (document.getElementById("cbk-run-layout3").checked) {
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
            if (document.getElementById("cbk-flag-recursive").checked) {
              expandGraph(cy.$(':selected').data().id, cy);
              setTimeout(function () {
                api.expandNodes([node], true);
                if (document.getElementById("cbk-run-layout3").checked) {
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
              }, 1100);
            } else {
              expandGraph(cy.$(':selected').data().id, cy);
              setTimeout(function () {
                api.expandNodes([node]);
                if (document.getElementById("cbk-run-layout3").checked) {
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
              }, 1100);
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

module.exports = register;
