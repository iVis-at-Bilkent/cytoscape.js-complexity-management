let cmgm = cy.complexityManagement('get').getCompMgrInstance()

let finalCyGraphNodes = cy.nodes().length;
let finalCyGraphEdges = cy.edges().length;
// Begin Testing

// collapse random compound
// collapse edge between random nodes
// hide random nodes
// collapse all nodes
// expand all nodes
// filter node to 30
// filter edges to 50
// expand all edges.
// unfilter all


for (let index = 0; index < 10; index++) {
    

    // collapse random compound
    selectRandomCompound()
    document.getElementById('collapseSelectedNodes').click();
    cy.nodes().unselect()
    // collapse all edges
    selectRandomNode();
    selectRandomNode();
    document.getElementById('collapseSelectedEdges').click();
    cy.nodes().unselect()
    // hide randomly
    hide()
    // collapse all nodes
    document.getElementById('collapseAllNodes').click();
    // expand all nodes
    document.getElementById('expandAllNodes').click();
    // filter node value 30
    filterNodes(30,100);
    // filter edge value 50
    filterEdges(0,50);
    // show
    showAll()
    // expand all edges
    document.getElementById('expandAllEdges').click();
    // unfilter all
    filterNodes(0,100);
    filterEdges(0,100);

    document.getElementById('collapseAllNodes').click();
    document.getElementById('expandAllNodes').click();
    document.getElementById('expandAllEdges').click();
    
    
    // checking final count
    let finalmainGraphNodes = cy.nodes().length;
    let finalmainGraphEdges = cy.edges().length;
   
    
    if(finalmainGraphNodes == finalCyGraphNodes && finalmainGraphEdges == finalCyGraphEdges){
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

function selectRandomCompound(){
    var compoundNodes = cy.nodes().filter(node => !node.isChildless());
    if (compoundNodes.length > 0) {
        var randomIndex = Math.floor(Math.random() * compoundNodes.length);
        cy.getElementById(compoundNodes[randomIndex].id()).select();
    }
}
function selectRandomNode(){
    var nodes = cy.nodes();
    if (nodes.length > 0) {
        var randomIndex = Math.floor(Math.random() * nodes.length);
        cy.getElementById(nodes[randomIndex].id()).select();
    }
}