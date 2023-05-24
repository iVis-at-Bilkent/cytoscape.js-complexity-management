let cmgm = cy.complexityManagement('get').getCompMgrInstance()

// document.getElementsByClassName("dropdown-menu")[0].getElementsByTagName("li")[0].getElementsByTagName("a")[0].click()

// Begin Testing

// add neighborhood
// add edges
// collapse all edges 
// filter node to 25 
// collapse all nodes 
// filter edges to 40 
// hide
// expand all nodes
// add edges
// show
// add neighborhood
// collapse all nodes
// unfilter all
// expand all edges
// expand all nodes


let startTime = 0;
let endTime = 0;
let timeTaken = 0
let sum = 0

    
    startTime = new Date().getTime()

    // add neighborhood
    // add edges
    addEdgeBetween('#39','#24');
    // collapse all edges 
    document.getElementById('collapseAllEdges').click();
    // filter node to 25 
    filterNodes(25,100);
    // collapse all nodes 
    document.getElementById('collapseAllNodes').click();
    // filter edges to 40 
    filterEdges(40,100);
    // hide
    hide()
    // expand all nodes
    document.getElementById('expandAllNodes').click();
    // add edges
    addEdgeBetween('#103','#189');
    // show
    showAll();
    // add neighborhood
    addNeighbours("#127")
    // collapse all nodes
    document.getElementById('collapseAllNodes').click();
    // unfilter all
    filterNodes(0,100);
    filterEdges(0,100);
    // expand all edges
    document.getElementById('expandAllEdges').click();
    // expand all nodes
    document.getElementById('expandAllNodes').click();

    endTime = new Date().getTime();
    timeTaken = endTime - startTime
    console.log("Time Per Operation: ", timeTaken/15)
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
        console.log("Test sucessfull");
    }else{
        console.error("Test Failed");
    
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