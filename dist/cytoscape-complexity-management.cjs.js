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
  var actOnReconnect = function actOnReconnect(evt) {};
  var actOnParentChange = function actOnParentChange(evt) {};

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
    var diffToBeUnfiltered = getDifference(filteredElements, newFilteredElements);
    diffToBeUnfiltered.forEach(function (id) {
      filteredElements.delete(id);
    });

    // diff between newFilteredElements and filteredElements should be added to filteredElements
    var diffToBeFiltered = getDifference(newFilteredElements, filteredElements);
    diffToBeFiltered.forEach(function (id) {
      filteredElements.add(id);
    });
    var edgeIDListToBeFiltered = [];
    var nodeIDListToBeUnfiltered = [];
    var edgeIDListToBeUnfiltered = [];
    diffToBeFiltered.forEach(function (id) {
      if (cy.getElementById(id).isNode()) ; else {
        edgeIDListToBeFiltered.push(id);
      }
    });
    diffToBeUnfiltered.forEach(function (id) {
      if (cy.getElementById(id).isNode()) {
        nodeIDListToBeUnfiltered.push(id);
      } else {
        edgeIDListToBeUnfiltered.push(id);
      }
    });

    // Filter toBeFiltered elements
    compMgrInstance.filter(nodeIDListToBeUnfiltered, edgeIDListToBeFiltered);

    // Unfilter toBeUnfiltered elements
    compMgrInstance.unfilter(nodeIDListToBeUnfiltered, edgeIDListToBeUnfiltered);
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
      var tempRemovedEles = new Set();
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
