document.addEventListener('DOMContentLoaded', onLoaded);

function onLoaded() {

  const cy = window.cy = cytoscape({
    container: document.getElementById('cy'),
    wheelSensitivity: 0.1,
    style: [
      {
        selector: 'node',
        style: {
          'label': 'data(id)'
        }
      },
      {
        selector: 'edge',
        style: {
          'label': (x) => {
            if (x.data('edgeType')) {
              return x.data('edgeType');
            }
            return '';
          },
          'curve-style': 'bezier',
          'target-arrow-shape': 'triangle'
        }
      }
    ],
    elements: {
      nodes: [
        { data: { id: 'a', parent: 'c2' } },
        { data: { id: 'b', parent: 'c2' } },
        { data: { id: 'c', parent: 'c1' } },
        { data: { id: 'd', parent: 'c4' } },
        { data: { id: 'e', parent: 'c3' } },
        { data: { id: 'f', parent: 'c3' } },
        { data: { id: 'g'} },
        { data: { id: 'c1' } },
        { data: { id: 'c2', parent: 'c1' } },
        { data: { id: 'c3' } },
        { data: { id: 'c4', parent: 'c3' } }
      ],
      edges: [
        { data: { id: 'a-b', source: 'a', target: 'b' } },
        { data: { id: 'b-a', source: 'b', target: 'a' } },
        { data: { id: 'a-c', source: 'a', target: 'c' } },
        { data: { id: 'c2-c3', source: 'c2', target: 'c3' } },
        { data: { id: 'd-e', source: 'd', target: 'e' } },
        { data: { id: 'f-d', source: 'f', target: 'd' } },
        { data: { id: 'f-e', source: 'f', target: 'e' } },
        { data: { id: 'f-g', source: 'f', target: 'g' } }
      ]
    },
    layout: { name: 'fcose' }
  });

  cy.layoutUtilities({ desiredAspectRatio: cy.width() / cy.height() });

  const instance = cy.complexityManagement();

  let newNodeCount = 0;
  let newEdgeCount = 0;

  document.getElementById("addNodeToSelected").addEventListener("click", () => {
    const selectedNode = cy.nodes(":selected")[0];
    let parentID = null;
    let position = { x: 0, y: 0 };
    if (selectedNode) {
      parentID = selectedNode.id();
      position = { x: selectedNode.bb().x1 + selectedNode.bb().w / 2, y: selectedNode.bb().y1 + selectedNode.bb().h / 2}
    }
    cy.add({
      group: 'nodes',
      data: { id: 'newNode' + newNodeCount, parent: parentID},
      position: position
    });
    newNodeCount++;

    if (document.getElementById("cbk-run-layout2").checked) {
      cy.layout({name: "fcose", randomize: false}).run();
    }
  });

  document.getElementById("addEdgeBetweenSelected").addEventListener("click", () => {
    if(cy.nodes(":selected").length == 2) {
      cy.add({ 
        group: 'edges', 
        data: { id: 'newEdge' + newEdgeCount, source: cy.nodes(":selected")[0].id(), target: cy.nodes(":selected")[1].id() }});
    }

    newEdgeCount++;

    if (document.getElementById("cbk-run-layout2").checked) {
      cy.layout({name: "fcose", randomize: false}).run();
    }
  });

  document.getElementById("removeSelected").addEventListener("click", () => {
    cy.elements(":selected").remove();

    if (document.getElementById("cbk-run-layout2").checked) {
      cy.layout({name: "fcose", randomize: false}).run();
    }
  });
}