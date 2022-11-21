import { ComplexityManager } from 'cmgm';

export function complexityManagement(cy) {

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

  // This function processes nodes to add them into input graph
  let processChildrenList = function(parent, children, compMgr, isVisible) {
    let size = children.length;
    for (var i = 0; i < size; i++) {
      let theChild = children[i];
      let children_of_children = theChild.children();
      let theNode;

      theNode = parent.addNode(compMgr.newNode(theChild.id()));

      if (children_of_children != null && children_of_children.length > 0) {
        let theNewGraph;
        theNewGraph = parent.owner.add(compMgr.newGraph(isVisible), theNode);
        this.processChildrenList(theNewGraph, children_of_children, compMgr, isVisible);
      }
    }
  }

  let compMgrInstance = new ComplexityManager();
  let visibleGM = compMgrInstance.visibleGraphManager;
  let invisibleGM = compMgrInstance.invisibleGraphManager;

  let nodes = cy.nodes();
  let edges = cy.edges();

  let rootGraphForVisible = visibleGM.addRoot();
  let rootGraphForInvisible = invisibleGM.addRoot();

  // Add nodes to visible graph
  processChildrenList(rootGraphForVisible, getTopMostNodes(nodes), compMgrInstance, true);

  // Add nodes to invisible graph
  processChildrenList(rootGraphForInvisible, getTopMostNodes(nodes), compMgrInstance, false);

  console.log(visibleGM);
  console.log(invisibleGM);
}