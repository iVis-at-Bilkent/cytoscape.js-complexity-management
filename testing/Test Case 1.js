let cmgm = cy.complexityManagement('get').getCompMgrInstance()

// Begin Testing

// add edges 3 times
// collapse all nodes 
// collapse all edges 
// filter node to 30 
// filter edges to 50 
// expand all nodes
// expand all edges.
// unfilter all

let startTime = 0;
let endTime = 0;
let timeTaken = 0
let sum = 0

for (let index = 0; index < 10; index++) {
    
    startTime = new Date().getTime()
    // add 3 edges b/w c and g
    addEdgeBetween('#c','#g');
    addEdgeBetween('#c','#g');
    addEdgeBetween('#c','#g');
    // collapse all nodes
    document.getElementById('collapseAllNodes').click();
    // collapse all edges
    document.getElementById('collapseAllEdges').click();
    // filter node value 30
    filterNodes(30,100);
    // filter edge value 50
    filterEdges(0,50);
    // expand all nodes
    document.getElementById('expandAllNodes').click();
    // expand all edges
    document.getElementById('expandAllEdges').click();
    // unfilter all
    filterNodes(0,100);
    filterEdges(0,100);
    
    endTime = new Date().getTime();
    timeTaken = endTime - startTime
    console.log("Time Per Operation: ", timeTaken/10)
    sum+=timeTaken

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

console.log("AVG Time Per Operation: ",sum/100);





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


