let cmgm = cy.complexityManagement('get').getCompMgrInstance()

// Begin Testing

// add eges 
// collapse all nodes
// add neighbours
// collapse all edges
// add neigbours
// collapse all nodes
// filter node to 30
// filter edges to 50
// expand all nodes
// expand all edges.
// add neighbours
// unfilter all


for (let index = 0; index < 10; index++) {
    
    // add 3 edges b/w c and g
    addEdgeBetween('#c','#g');
    addEdgeBetween('#c','#g');
    addEdgeBetween('#c','#g');
    // collapse all nodes
    document.getElementById('collapseAllNodes').click();
    //adding random neighbours to c3
    addNeighbours('#c3');
    // collapse all edges
    document.getElementById('collapseAllEdges').click();
    //adding random neighbours to c3
    addNeighbours('#c1');
    // collapse all nodes
    document.getElementById('collapseAllNodes').click();
    // filter node value 30
    filterNodes(30,100);
    // filter edge value 50
    filterEdges(0,50);
    // expand all nodes
    document.getElementById('expandAllNodes').click();
    // expand all edges
    document.getElementById('expandAllEdges').click();
    //adding random neighbours to c3
    addNeighbours('#g');
    // unfilter all
    filterNodes(0,100);
    filterEdges(0,100);

    document.getElementById('collapseAllNodes').click();
    document.getElementById('expandAllNodes').click();
    document.getElementById('expandAllEdges').click();
    
    
    // checking final count
    let finalinvisibleGraphNodes = 0;
    let finalinvisibleGraphEdges = 0;
    let finalCyGraphNodes = cy.nodes().length;
    let finalCyGraphEdges = cy.edges().length;
    cmgm.visibleGraphManager.graphs.forEach(graph => {
        finalinvisibleGraphNodes += graph.nodes.length;
        finalinvisibleGraphEdges += graph.edges.length;
    })
    finalinvisibleGraphEdges += cmgm.visibleGraphManager.edges.length;
    
    if(finalinvisibleGraphNodes == finalCyGraphNodes && finalinvisibleGraphEdges == finalCyGraphEdges){
        console.log("Test sucessfull", index);
    }else{
        console.error("Test Failed", index);
        break
    
    }
    
}


function addEdgeBetween(a,b){
    cy.$(a).select();
    cy.$(b).select();
    document.getElementById('addEdgeBetweenSelected').click();
    cy.$().unselect();
}

function addNeighbours(a){
    cy.$(a).select()
    document.getElementById('addRandomElements').click();
    cy.$().unselect();
}

function filterNodes(min,max){
    $('#slider-nodes').slider('values', [min, max]).trigger('change');
    $('#min-weight-node').html($('#slider-nodes').slider('values', 0)).position({
        my: 'center top',
        at: 'center bottom',
        of: $('#slider-nodes span:eq(0)'),
        offset: "0, 0"
      });
    
      $('#max-weight-node').html($('#slider-nodes').slider('values', 1)).position({
        my: 'center top',
        at: 'center bottom',
        of: $('#slider-nodes span:eq(1)'),
        offset: "0, 10"
      });
      $('#slider-nodes').slider('values', [min, max]).trigger('change');
}

function filterEdges(min,max){
    $('#slider-edges').slider('values', [min, max]).trigger('change');
    $('#min-weight-edge').html($('#slider-edges').slider('values', 0)).position({
        my: 'center top',
        at: 'center bottom',
        of: $('#slider-edges span:eq(0)'),
        offset: "0, 0"
      });
    
      $('#max-weight-edge').html($('#slider-edges').slider('values', 1)).position({
        my: 'center top',
        at: 'center bottom',
        of: $('#slider-edges span:eq(1)'),
        offset: "0, 10"
      });
      $('#slider-edges').slider('values', [min, max]).trigger('change');
}



const movedNodes = new Set();
  
// Loop through all edges in the graph
cy.edges().forEach(edge => {
  const source = edge.source();
  const target = edge.target();
  
  // Check if either node has already been moved
  if (!movedNodes.has(source.id())) {
    // Calculate the new position for the source node
    const targetPosition = target.position();
    const newSourcePosition = {
      x: (source.position().x + targetPosition.x) / 2,
      y: (source.position().y + targetPosition.y) / 2
    };


  if (target.isParent() || source.isParent()) {
    const childrenCount = target.children().length;
    newSourcePosition.x = (newSourcePosition.x * 2)  + childrenCount * 10;
    newSourcePosition.y = (newSourcePosition.x * 2) + childrenCount * 10;
  }
    // Move the source node to the new position and add it to the movedNodes set
    source.position(newSourcePosition);
    movedNodes.add(source.id());
  }
  
  if (!movedNodes.has(target.id())) {
    // Calculate the new position for the target node
    const sourcePosition = source.position();
    const newTargetPosition = {
      x: (target.position().x + sourcePosition.x) / 2,
      y: (target.position().y + sourcePosition.y) / 2
    };

      
  if (source.isParent() || target.isParent()) {
    const childrenCount = source.children().length;
    newTargetPosition.x = (newTargetPosition.x * 2)  + childrenCount * 10;
    newTargetPosition.y = (newTargetPosition.x * 2) + childrenCount * 10;
  }
      
    // Move the target node to the new position and add it to the movedNodes set
    target.position(newTargetPosition);
    movedNodes.add(target.id());
  }
});

let focusID = cy.$(':selected')[0].data().id;
let focusNode = cy.$(':selected')[0];
function getNewPosition(xA, yA, xB, yB) {
  // Find the vector AB
  var dx = xB - xA;
  var dy = yB - yA;

  // Calculate the Euclidean length of AB
  var abLength = Math.sqrt(dx*dx + dy*dy);

  // Calculate l as half the length of AB
  var l = abLength / 2;
  // let distance = 2 * l;
  // let minDistance = 2 * Math.sqrt(focusNode.data().height*focusNode.data().height + focusNode.data().width*focusNode.data().width);
  let distance = 2 * Math.sqrt(focusNode.data().height*focusNode.data().height + focusNode.data().width*focusNode.data().width);

  
  // if(distance < minDistance){
  //   distance = minDistance;
  // }
  // Normalize AB to get the unit vector AB_unit
  var abUnitX = dx / abLength;
  var abUnitY = dy / abLength;

  // Scale AB_unit by 2l to get AC
  var acX = distance * abUnitX;
  var acY = distance * abUnitY;

  // Add AC to B to get C
  var xC = xB + acX;
  var yC = yB + acY;

  // Return the coordinates of point C
  return {
      x: xC,
      y: yC
  };
}
let list = cy.nodes();
if(focusNode.isChild()){
  list = cy.$(`#${focusNode.data().parent}`)[0].children();
}
list.forEach(node => {
  if(node.id() != focusID){
    let newPosition = getNewPosition(focusNode.position().x, focusNode.position().y, node.position().x, node.position().y)
    node.position(newPosition);
  }
})