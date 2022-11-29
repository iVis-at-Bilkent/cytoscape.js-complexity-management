document.addEventListener('DOMContentLoaded', onLoaded);



function onLoaded() {
  let instance;
  const cyVisible = window.cyVisible = cytoscape({
    container: document.getElementById('cyVisible'),
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
    ]
  });
  const cyInvisible = window.cyInvisible = cytoscape({
    container: document.getElementById('cyInvisible'),
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
    ]
  });
  const cy = window.cy = cytoscape({
    ready: function(){
      instance = this.complexityManagement();
      initailizer(this);
    },
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
    layout: { name: 'fcose', animate: false}
  });

  cy.layoutUtilities({ desiredAspectRatio: cy.width() / cy.height() });

  let newNodeCount = 0;
  let newEdgeCount = 0;

  function initailizer(cy){
    cyVisible.remove(cyVisible.elements());
    cyInvisible.remove(cyInvisible.elements());
    instance.getCompMgrInstance().visibleGraphManager.nodesMap.forEach((nodeItem,key) => {
      cyVisible.add({data:{id: nodeItem.ID,parent:instance.getCompMgrInstance().visibleGraphManager.rootGraph === nodeItem.owner ? null : nodeItem.owner.parent.ID}, position:cy.getElementById(nodeItem.ID).position()});
    });
    
    instance.getCompMgrInstance().visibleGraphManager.edgesMap.forEach((edgeItem,key) => {
      cyVisible.add({data:{id: edgeItem.ID,source:edgeItem.source.ID,target:edgeItem.target.ID}});
    });
    cyVisible.fit(cyVisible.elements(),30);

    instance.getCompMgrInstance().invisibleGraphManager.nodesMap.forEach((nodeItem,key) => {
      cyInvisible.add({data:{id:nodeItem.ID ,label: nodeItem.ID + (nodeItem.isFiltered?"(f)":"") + (nodeItem.isHidden?"(h)":"") + (nodeItem.isCollapsed?"(c)":"") + (nodeItem.isVisible?"":"(i)"),parent:instance.getCompMgrInstance().visibleGraphManager.rootGraph === nodeItem.owner ? null : nodeItem.owner.parent.ID}, position:cy.getElementById(nodeItem.ID).position()});
    });
    instance.getCompMgrInstance().invisibleGraphManager.edgesMap.forEach((edgeItem,key) => {
      cyInvisible.add({data:{id: edgeItem.ID, label: edgeItem.ID + (edgeItem.isFiltered?"(f)":"") + (edgeItem.isHidden?"(h)":"") + (edgeItem.isVisible?"":"(i)"),source:edgeItem.source.ID,target:edgeItem.target.ID}});
    });
    cyInvisible.fit(cyInvisible.elements(),30);
  }

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
      cy.layout({name: "fcose", animate: false, randomize: false}).run();
    }
    initailizer(cy);
  });

  document.getElementById("addEdgeBetweenSelected").addEventListener("click", () => {
    if(cy.nodes(":selected").length == 2) {
      cy.add({ 
        group: 'edges', 
        data: { id: 'newEdge' + newEdgeCount, source: cy.nodes(":selected")[0].id(), target: cy.nodes(":selected")[1].id() }});
    }

    newEdgeCount++;

    if (document.getElementById("cbk-run-layout2").checked) {
      cy.layout({name: "fcose", animate: false, randomize: false}).run();
    }
    initailizer(cy);
  });

  document.getElementById("removeSelected").addEventListener("click", () => {
    cy.elements(":selected").remove();

    if (document.getElementById("cbk-run-layout2").checked) {
      cy.layout({name: "fcose", animate: false, randomize: false}).run();
    }
    initailizer(cy);
  });


  

}