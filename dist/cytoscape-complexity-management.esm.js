import { ComplexityManager } from 'cmgm';

function complexityManagement(cy) {
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

  // This function processes nodes to add them into input graph
  var processChildrenList = function processChildrenList(parent, children, compMgr, isVisible) {
    var size = children.length;
    for (var i = 0; i < size; i++) {
      var theChild = children[i];
      var children_of_children = theChild.children();
      var theNode = void 0;
      theNode = parent.addNode(compMgr.newNode(theChild.id()));
      if (children_of_children != null && children_of_children.length > 0) {
        var theNewGraph = void 0;
        theNewGraph = parent.owner.add(compMgr.newGraph(isVisible), theNode);
        this.processChildrenList(theNewGraph, children_of_children, compMgr, isVisible);
      }
    }
  };
  var compMgrInstance = new ComplexityManager();
  var visibleGM = compMgrInstance.visibleGraphManager;
  var invisibleGM = compMgrInstance.invisibleGraphManager;
  var nodes = cy.nodes();
  cy.edges();
  var rootGraphForVisible = visibleGM.addRoot();
  var rootGraphForInvisible = invisibleGM.addRoot();

  // Add nodes to visible graph
  processChildrenList(rootGraphForVisible, getTopMostNodes(nodes), compMgrInstance, true);

  // Add nodes to invisible graph
  processChildrenList(rootGraphForInvisible, getTopMostNodes(nodes), compMgrInstance, false);
  console.log(visibleGM);
  console.log(invisibleGM);
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
