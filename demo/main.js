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
          'label': 'data(label)'
        }
      },
      {
        selector: 'edge',
        style: {
          'label': (edge) => {
            if (edge.data('label')) {
              return edge.data('label');
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
    ready: function () {
      instance = window.instance = this.complexityManagement();
      this.elements().forEach((ele) => {
        let randomWeight = Math.floor(Math.random() * 101);
        ele.data('weight', randomWeight);
        ele.data('label', ele.data('id') + '(' + ele.data('weight') + ')');
      });
    },
    container: document.getElementById('cy'),
    wheelSensitivity: 0.1,
    style: [
      {
        selector: 'node',
        style: {
          'label': (node) => {
            return node.data('label') ? node.data('label') : node.id();
          },
          'font-size': '10px',
          'compound-sizing-wrt-labels': 'include'
        }
      },
      {
        selector: 'edge',
        style: {
          'label': (edge) => {
            if (edge.data('weight') != null) {
              return edge.data('weight');
            }
            return '';
          },
          'curve-style': 'bezier',
          'target-arrow-shape': 'triangle',
          'text-rotation': 'autorotate',
          'font-size': '10px',
          'text-margin-y': '10px'
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
        { data: { id: 'g' } },
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
    layout: { name: 'fcose', animate: true, stop: function () { initailizer(cy); } }
  });

  let layoutUtilities = cy.layoutUtilities({ desiredAspectRatio: cy.width() / cy.height() });

  let newNodeCount = 0;
  let newEdgeCount = 0;

  function initailizer(cy) {
    cyVisible.remove(cyVisible.elements());
    cyInvisible.remove(cyInvisible.elements());

    let nodesToAddVisible = [];

    instance.getCompMgrInstance().visibleGraphManager.nodesMap.forEach((nodeItem, key) => {
      nodesToAddVisible.push({ data: { id: nodeItem.ID, parent: instance.getCompMgrInstance().visibleGraphManager.rootGraph === nodeItem.owner ? null : nodeItem.owner.parent.ID }, position: !cy.getElementById(nodeItem.ID).isParent() ? cy.getElementById(nodeItem.ID).position() : null });
    });
    cyVisible.add(nodesToAddVisible);
    instance.getCompMgrInstance().visibleGraphManager.edgesMap.forEach((edgeItem, key) => {
      cyVisible.add({ data: { id: edgeItem.ID, source: edgeItem.source.ID, target: edgeItem.target.ID } });
    });
    cyVisible.fit(cyVisible.elements(), 30);

    let nodesToAddInvisible = [];
    instance.getCompMgrInstance().invisibleGraphManager.nodesMap.forEach((nodeItem, key) => {
      nodesToAddInvisible.push({ data: { id: nodeItem.ID, label: nodeItem.ID + (nodeItem.isFiltered ? "(f)" : "") + (nodeItem.isHidden ? "(h)" : "") + (nodeItem.isCollapsed ? "(c)" : "") + (nodeItem.isVisible ? "" : "(i)"), parent: instance.getCompMgrInstance().visibleGraphManager.rootGraph === nodeItem.owner ? null : nodeItem.owner.parent.ID }, position: !cy.getElementById(nodeItem.ID).isParent() ? cy.getElementById(nodeItem.ID).position() : null });
    });
    cyInvisible.add(nodesToAddInvisible);
    instance.getCompMgrInstance().invisibleGraphManager.edgesMap.forEach((edgeItem, key) => {
      cyInvisible.add({ data: { id: edgeItem.ID, label: (edgeItem.isFiltered ? "(f)" : "") + (edgeItem.isHidden ? "(h)" : "") + (edgeItem.isVisible ? "" : "(i)"), source: edgeItem.source.ID, target: edgeItem.target.ID } });
    });
    cyInvisible.fit(cyInvisible.elements(), 30);
  }

  document.getElementById("addNodeToSelected").addEventListener("click", () => {
    const selectedNode = cy.nodes(":selected")[0];
    let parentID = null;
    let position = { x: 0, y: 0 };
    if (selectedNode) {
      parentID = selectedNode.id();
      position = { x: selectedNode.bb().x1 + selectedNode.bb().w / 2, y: selectedNode.bb().y1 + selectedNode.bb().h / 2 }
    }
    let newNode = cy.add({
      group: 'nodes',
      data: { id: 'nn' + newNodeCount, 
              parent: parentID,
              weight: Math.floor(Math.random() * 101)},
      position: position
    });
    newNode.data('label', newNode.data('id') + '(' + newNode.data('weight') + ')')
    newNodeCount++;

    if (document.getElementById("cbk-run-layout2").checked) {
      cy.layout({ name: "fcose", animate: true, randomize: false, stop: () => { initailizer(cy) } }).run();
    }
    else {
      initailizer(cy);
    }
  });

  document.getElementById("addEdgeBetweenSelected").addEventListener("click", () => {
    let firstSelectedNode = cy.nodes(":selected")[0];
    let secondSelectedNode = cy.nodes(":selected")[1];

    if (cy.nodes(":selected").length == 2 && firstSelectedNode.intersection(secondSelectedNode.ancestors()).length == 0 && 
      secondSelectedNode.intersection(firstSelectedNode.ancestors()).length == 0) {
      cy.add({
        group: 'edges',
        data: { id: 'ne' + newEdgeCount, 
                source: cy.nodes(":selected")[0].id(), 
                target: cy.nodes(":selected")[1].id(),
                weight: Math.floor(Math.random() * 101)}
      });
    }

    newEdgeCount++;

    if (document.getElementById("cbk-run-layout2").checked) {
      cy.layout({ name: "fcose", animate: true, randomize: false, stop: () => { initailizer(cy) } }).run();
    }
    else {
      initailizer(cy);
    }
  });

  document.getElementById("removeSelected").addEventListener("click", () => {
    cy.elements(":selected").remove();

    if (document.getElementById("cbk-run-layout2").checked) {
      cy.layout({ name: "fcose", animate: true, randomize: false, stop: () => { initailizer(cy) } }).run();
    }
    else {
      initailizer(cy);
    }
  });

  document.getElementById("changeSource").addEventListener("click", () => {
    let selectedEdge = cy.edges(':selected')[0];
    let newSource = cy.nodes(':selected')[0];

    selectedEdge.move({ source: newSource.id() });

    if (document.getElementById("cbk-run-layout2").checked) {
      cy.layout({ name: "fcose", animate: true, randomize: false, stop: () => { initailizer(cy) } }).run();
    }
    else {
      initailizer(cy);
    }
  });

  document.getElementById("changeTarget").addEventListener("click", () => {
    let selectedEdge = cy.edges(':selected')[0];
    let newTarget = cy.nodes(':selected')[0];

    selectedEdge.move({ target: newTarget.id() });

    if (document.getElementById("cbk-run-layout2").checked) {
      cy.layout({ name: "fcose", animate: true, randomize: false, stop: () => { initailizer(cy) } }).run();
    }
    else {
      initailizer(cy);
    }
  });

  document.getElementById("changeParent").addEventListener("click", () => {
    let firstSelectedNode = cy.nodes(':selected')[0];
    let newParent = cy.nodes(':selected')[1];

    if (newParent) {
      firstSelectedNode.move({ parent: newParent.id() });
    }
    else {
      firstSelectedNode.move({ parent: null });
    }

    if (document.getElementById("cbk-run-layout2").checked) {
      cy.layout({ name: "fcose", animate: true, randomize: false, stop: () => { initailizer(cy) } }).run();
    }
    else {
      initailizer(cy);
    }
  });

  window.iteration = 0;

  document.getElementById("addRandomElements").addEventListener("click", () => {
    window.iteration = (window.iteration || 0) + 1;
    const nodes = getRandomNodes();
    layoutUtilities.placeNewNodes(nodes);

    if (document.getElementById("cbk-run-layout2").checked) {
      cy.layout({ name: "fcose", animate: true, randomize: false, stop: () => { initailizer(cy) } }).run();
    }
    else {
      initailizer(cy);
    }
  });

  // Slider operations
  $("#slider-nodes").slider({
    range: true,
    min: 0,
    max: 100,
    step: 1,
    values: [0, 100],
    slide: function (event, ui) {
      let delay = function () {
        let handleIndex = ui.handleIndex;
        let label = handleIndex == 0 ? '#min-weight-node' : '#max-weight-node';
        $(label).html(ui.value).position({
          my: 'center top',
          at: 'center bottom',
          of: ui.handle,
          offset: "0, 10"
        });
      };
      // wait for the ui.handle to set its position
      setTimeout(delay, 5);
    },
    change: function () {
      instance.updateFilterRule((ele) => {
        if (ele.isNode() && (ele.data('weight') < parseInt($('#min-weight-node').html()) || ele.data('weight') > parseInt($('#max-weight-node').html()))) {
          return true;
        }
        else if (ele.isEdge() && (ele.data('weight') < parseInt($('#min-weight-edge').html()) || ele.data('weight') > parseInt($('#max-weight-edge').html()))) {
          return true;
        }
        else {
          return false;
        }
      });
      initailizer(cy);
    }
  });

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

  $("#slider-edges").slider({
    range: true,
    min: 0,
    max: 100,
    step: 1,
    values: [0, 100],
    slide: function (event, ui) {
      let delay = function () {
        let handleIndex = ui.handleIndex;
        let label = handleIndex == 0 ? '#min-weight-edge' : '#max-weight-edge';
        $(label).html(ui.value).position({
          my: 'center top',
          at: 'center bottom',
          of: ui.handle,
          offset: "0, 10"
        });
      };
      // wait for the ui.handle to set its position
      setTimeout(delay, 5);
    },
    change: function () {
      instance.updateFilterRule((ele) => {
        if (ele.isNode() && (ele.data('weight') < parseInt($('#min-weight-node').html()) || ele.data('weight') > parseInt($('#max-weight-node').html()))) {
          return true;
        }
        else if (ele.isEdge() && (ele.data('weight') < parseInt($('#min-weight-edge').html()) || ele.data('weight') > parseInt($('#max-weight-edge').html()))) {
          return true;
        }
        else {
          return false;
        }
      });
      initailizer(cy);
    }
  });

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

  document.getElementById("hideSelected").addEventListener("click", () => {
    instance.hide(cy.elements(":selected"));

    if (document.getElementById("cbk-run-layout3").checked) {
      cy.layout({ name: "fcose", animate: true, randomize: false, stop: () => { initailizer(cy) } }).run();
    }
    else {
      initailizer(cy);
    }
  });

  document.getElementById("showHiddenNeighbors").addEventListener("click", () => {
    let selectedNodes = cy.nodes(':selected');
    instance.show(selectedNodes.union(selectedNodes.descendants().closedNeighborhood()));

    if (document.getElementById("cbk-run-layout3").checked) {
      cy.layout({ name: "fcose", animate: true, randomize: false, stop: () => { initailizer(cy) } }).run();
    }
    else {
      initailizer(cy);
    }
  });

  document.getElementById("showAll").addEventListener("click", () => {
    instance.showAll();

    if (document.getElementById("cbk-run-layout3").checked) {
      cy.layout({ name: "fcose", animate: true, randomize: false, stop: () => { initailizer(cy) } }).run();
    }
    else {
      initailizer(cy);
    }
  });  
}

  function getRandomNodes() {
    const nodeCount = 2;
    const averageDegree = 2;
    const newNodes = cy.collection();
    const currentNodes = cy.nodes();
    const compoundNodes = cy.nodes().filter(e => e.isParent());
    let newCompound;
    for (let nodeId = 0; nodeId < nodeCount; nodeId++) {
      const id = `n${window.iteration}-${nodeId}`;
      const edgeId = `e${window.iteration}-${nodeId}`;
      let parentID;
      switch (Math.ceil(Math.random() * 3)) {
        case 1: // New parent
          if (newNodes.length === 0) {
            let node = cy.add({group: 'nodes', data: {id: `${id}a`, name: `${id}a`, weight: Math.floor(Math.random() * 101)}});
            node.data('label', node.data('id') + '(' + node.data('weight') + ')');
            newNodes.merge(node);
          }
          if (!newCompound) {
            const randomNewCompound = newNodes[Math.floor(Math.random() * newNodes.length)];
            newCompound = randomNewCompound;
          }
          parentID = newCompound.id();
          break;
        case 2: // Existing parent
          parentID = compoundNodes[Math.floor(Math.random() * compoundNodes.length)].id()
          break;
        case 3: // No parent
        default:
          break;
      }
      const newNode = cy.add({ group: 'nodes', data: { id, name: id, parent: parentID, weight: Math.floor(Math.random() * 101) }});
      newNode.data('label', newNode.data('id') + '(' + newNode.data('weight') + ')');
      newNodes.merge(newNode);

      let neighborCount;
      let selectedNodes = cy.nodes(":selected");
      switch (Math.ceil(Math.random() * 6)) {
        case 1:
          if (selectedNodes.length === 0) {
            neighborCount = 0;
            break;
          }
        case 2:
          neighborCount = 1;
          break;
        default:
          neighborCount = averageDegree;
          break;
      }

      if (neighborCount) {
        const addDummyNodes = function(dummyNodeCount, currentNodes) {
          let nodeToConnect = currentNodes[Math.floor(Math.random() * currentNodes.length)];
          for (let i = 0; i < dummyNodeCount; i++) {
                // Add necessary dummy nodes
                const dummyID = `${id}-d${i}`;
                const dummyNode = cy.add({ group: 'nodes', data: { id: dummyID, name: dummyID}});
                cy.add({ group: 'edges', data: { id: `${dummyID}-e`, source: nodeToConnect.id(), target: dummyID, weight: Math.floor(Math.random() * 101)}})
                nodeToConnect = dummyNode;
                newNodes.merge(dummyNode)
                availableNewNodes.merge(dummyNode)
              }
        }
        const forbiddenNodes = cy.collection();
        forbiddenNodes.merge(newNode);
        forbiddenNodes.merge(newNode.ancestors());
        forbiddenNodes.merge(newNode.descendants());
        const availableNewNodes = newNodes.difference(forbiddenNodes)
        const availableCurrentNodes = selectedNodes.length > 0 ? selectedNodes : currentNodes.difference(forbiddenNodes)
        const selectedNeighbors = [];

        const randomValue = Math.ceil(Math.random() * 10);
        if (randomValue < 6 && selectedNodes.length === 0) {
          const dummyNodeCount = neighborCount - availableNewNodes.length;
          addDummyNodes(dummyNodeCount, availableCurrentNodes);
          for (let i = 0; i < neighborCount; i++) {
            let randomNeighbor;
            if (i === 0) {
              // Select the last new node in any case, in order to increase the probability of higher rank nodes
              randomNeighbor = availableNewNodes[availableNewNodes.length - 1];
            } else {
              do {
                randomNeighbor = availableNewNodes[Math.floor(Math.random() * availableNewNodes.length)];
              } while (selectedNeighbors.includes(randomNeighbor.id()));
            }
            selectedNeighbors.push(randomNeighbor.id());
            cy.add({ group: 'edges', data: { id: `${edgeId}-${i}`, source: id, target: randomNeighbor.id(), weight: Math.floor(Math.random() * 101)}})
          }
        } else if (randomValue < 8) {
          const availableCount = Math.min(neighborCount, availableCurrentNodes.length);
          for (let i = 0; i < availableCount; i++) {
            let randomNeighbor;
            do {
              randomNeighbor = availableCurrentNodes[Math.floor(Math.random() * availableCurrentNodes.length)];
            } while (selectedNeighbors.includes(randomNeighbor.id()));
            selectedNeighbors.push(randomNeighbor.id());
            cy.add({ group: 'edges', data: { id: `${edgeId}-${i}`, source: id, target: randomNeighbor.id(), weight: Math.floor(Math.random() * 101)}})
          }
        } else {
          const dummyNodeCount = neighborCount - Math.min(neighborCount / 2, availableCurrentNodes.length) - availableNewNodes.length;
          addDummyNodes(dummyNodeCount, availableCurrentNodes);
          for (let i = 0; i < neighborCount; i++) {
            let randomNeighbor;
            if (i === 0) {
                // Select the last new node in any case, in order to increase the probability of higher rank nodes
                randomNeighbor = availableNewNodes[availableNewNodes.length - 1];
            } else {
              do {
                let tempNodes;
                if (i < neighborCount - Math.min(neighborCount / 2, availableCurrentNodes.length)) {
                  tempNodes = availableNewNodes;
                } else {
                  tempNodes = availableCurrentNodes;
                }
                randomNeighbor = tempNodes[Math.floor(Math.random() * tempNodes.length)];
              } while (selectedNeighbors.includes(randomNeighbor.id()));
            }
            selectedNeighbors.push(randomNeighbor.id());
            cy.add({ group: 'edges', data: { id: `${edgeId}-${i}`, source: id, target: randomNeighbor.id(), weight: Math.floor(Math.random() * 101)}})
          }
        }
      }
    }
    return newNodes;
  };