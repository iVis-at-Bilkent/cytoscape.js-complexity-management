let cmgm = cy.complexityManagement('get').getCompMgrInstance()

// Begin Testing

// add edge
// hide
// collapse all nodes 
// collapse all edges 
// filter node to 30 
// filter edges to 50 
// hide
// expand all nodes
// expand all edges.
// show
// unfilter all

let startTime = 0;
let endTime = 0;
let timeTaken = 0
let sum = 0

for (let index = 0; index < 10; index++) {
    
    startTime = new Date().getTime()
    // add  edges b/w c and g
    addEdgeBetween('#105','#126');
    // hide
    hide()
    // collapse all nodes
    document.getElementById('collapseAllNodes').click();
    // collapse all edges
    document.getElementById('collapseAllEdges').click();
    // filter node value 30
    filterNodes(30,100);
    // filter edge value 50
    filterEdges(0,50);
    // hide
    hide()
    // expand all nodes
    document.getElementById('expandAllNodes').click();
    // expand all edges
    document.getElementById('expandAllEdges').click();
    // show
    showAll()
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


function hide(){
    var nodes = cy.nodes();

    // Step 1: Randomly select a node
    var randomNode = nodes[Math.floor(Math.random() * nodes.length)];
    randomNode.select()
    // Step 2: Get the 1-hop neighborhood
    var oneHopNeighbors = randomNode.isParent() ? randomNode.descendants().neighborhood().nodes() : randomNode.neighborhood().nodes();

    // Step 3: Calculate the number of nodes to select (75%)
    var numNodesToSelect = Math.floor(oneHopNeighbors.length * 0.75);

    // Step 4: Randomly select nodes from the 1-hop neighborhood
    var selectedNodes = [];
    while (selectedNodes.length < numNodesToSelect) {
    var randomNeighbor = oneHopNeighbors[Math.floor(Math.random() * oneHopNeighbors.length)];
    if (!selectedNodes.includes(randomNeighbor)) {
        selectedNodes.push(randomNeighbor);
        randomNeighbor.select();
    }
    }

    document.getElementById("hideSelected").click();

}

function showAll(){
    document.getElementById("showAll").click();
}