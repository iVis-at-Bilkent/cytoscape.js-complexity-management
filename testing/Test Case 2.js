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
for (let q = 0; q < 2; q++) {


let startTime = 0;
let endTime = 0;
let timeTaken = 0
let sum = 0


for (let index = 0; index < 5; index++) {

    startTime = new Date().getTime()

    // add neighborhood
    // add edges
    addEdgeBetween();
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
    addEdgeBetween();
     // hide
     hide()
    // collapse all nodes
    document.getElementById('collapseAllNodes').click();
    // unfilter all
    filterNodes(0,100);
    filterEdges(0,100);
    // show
    showAll();
    // expand all edges
    document.getElementById('expandAllEdges').click();
    // expand all nodes
    document.getElementById('expandAllNodes').click();

    endTime = new Date().getTime();
    timeTaken = endTime - startTime
    console.log("Time Per Operation: ", timeTaken/15, "index",index)
    sum+=timeTaken
    
    document.getElementById('collapseAllNodes').click();
    document.getElementById('expandAllNodes').click();
    document.getElementById('expandAllEdges').click();
}
console.error("Avg Time Per Operation: ", sum/75," Size : ", cy.nodes().length)

    // add neighborhood
    addNeighbours()

    
    // checking final count
    let finalmainGraphNodes = 0;
    let finalmainGraphEdges = 0;
    let finalCyGraphNodes = cy.nodes().length;
    let finalCyGraphEdges = cy.edges().length;
    cmgm.visibleGraphManager.graphs.forEach(graph => {
        finalmainGraphNodes += graph.nodes.length;
        finalmainGraphEdges += graph.edges.length;
    })
    finalmainGraphEdges += cmgm.visibleGraphManager.edges.length;
    
    if(finalmainGraphNodes == finalCyGraphNodes && finalmainGraphEdges == finalCyGraphEdges){
        console.log("Test sucessfull");
    }else{
        console.error("Test Failed");
    
    }
    
}





function addEdgeBetween(){
    cy.$().unselect();
    while(true){
        var nodes = cy.nodes().filter(node=> !node.selected());
        if (nodes.length > 0) {
            var randomIndex = Math.floor(Math.random() * nodes.length);
            cy.getElementById(nodes[randomIndex].id()).select();
        
        if(cy.$(":selected").length == 2){
            break
        }
    }else{
        break
    }
    }
    
    document.getElementById('addEdgeBetweenSelected').click();
    cy.$().unselect();
}

function addNeighbours(){
    cy.$().unselect();
    var nodes = cy.nodes().filter(node=> !node.selected());
    if (nodes.length > 0) {
        var randomIndex = Math.floor(Math.random() * nodes.length);
        cy.getElementById(nodes[randomIndex].id()).select();
    }
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
    if(randomNode){
        randomNode.select()
    }else{
        return
    }
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


function selectRandomCompound(){
    var compoundNodes = cy.nodes().filter(node => !node.isChildless());
    if (compoundNodes.length > 0) {
        var randomIndex = Math.floor(Math.random() * compoundNodes.length);
        cy.getElementById(compoundNodes[randomIndex].id()).select();
    }
}