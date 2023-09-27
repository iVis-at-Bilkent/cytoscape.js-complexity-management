
let pngExpandGraph = null ;
let pngSizeProxyGraph = null ;
let pngBeforeFinalGraph = null ;
let api;
let cy2;
document.addEventListener('DOMContentLoaded', onLoaded);
let layoutOptions = { name: "fcose",  nodeRepulsion: node => 4500,animate: true, randomize: false, stop: () => { initializer(cy) } }
function onLoaded() {
  let instance;
  const cyVisible = window.cyVisible = cytoscape({
    container: document.getElementById('cyVisible'),
    wheelSensitivity: 0.1,
    style: [
      {
        selector: 'node',
        style: {
          'label': 'data(id)',
          "color" : "black",
          'font-size': '20px',
          'compound-sizing-wrt-labels': 'include',
          'height': 40,
          'width': 40,
          'padding': "5px",
          "background-fit": "cover",
          "border-color": "black",
          "border-width": 1.5,
          "border-opacity": 1,
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
          'target-arrow-shape': 'triangle',
          'text-rotation': 'autorotate',
          'font-size': '14px',
          'width': "1.5px",
          'text-margin-y': '10px',
          'line-color' : 'black',
          'target-arrow-color': 'black',
          
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
          'label': 'data(label)',
          "color" : "black",
          'font-size': '20px',
          'compound-sizing-wrt-labels': 'include',
          'height': 40,
          'width': 40,
          'padding': "5px",
          "background-fit": "cover",
          "border-color": "black",
          "border-width": 1.5,
          "border-opacity": 1,
        }
      },
      {
        selector: 'node[visible="F"]',
        style: {
          'label': 'data(label)',
          "color" : "gray",
          "background-color" : "gray",          
          "background-opacity": 0.3,
          'font-size': '18px',
          'compound-sizing-wrt-labels': 'include',
          'height': 40,
          'width': 40,
          'padding': "5px",
          "background-fit": "cover",
          "border-color": "gray",
          "border-width": 1.5,
          "border-opacity": 0.5,
        }
      },
      {
        selector: 'node[filtered="T"]',
        style: {
            "border-width": "2",
            "border-style": "dashed"
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
          'target-arrow-shape': 'triangle',
          'text-rotation': 'autorotate',
          'font-size': '14px',
          'width': '1.5px',
          'text-margin-y': '10px',
          'line-color' : 'black',
          'target-arrow-color': 'black',
        }
      },
      {
        selector: 'edge[visible="F"]',
        style: {
          'label': (edge) => {
            if (edge.data('label')) {
              return edge.data('label');
            }
            return '';
          },
          color : 'gray',
          "line-color": 'gray',
          'target-arrow-color': 'gray', 
          'curve-style': 'bezier',
          'target-arrow-shape': 'triangle',
          'text-rotation': 'autorotate',
          'font-size': '14px',
          'width': '1.5px',
          'text-margin-y': '10px',
          
        }
      },
      {
        selector: 'edge[filtered="T"]',
        style: {
          'line-style' : 'dashed',
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
            return document.getElementById("cbk-flag-display-node-labels").checked? node.data('label') ? node.data('label') : node.id():"";
          },
          "color" : "black",
          'font-size': '20px',
          'compound-sizing-wrt-labels': 'include',
          'height': 40,
          'width': 40,
          'padding': "5px",
          "background-fit": "cover",
          "border-color": "black",
          "border-width": 1,
          "border-opacity": 1,
        }
      },
      {
        selector: 'edge',
        style: {
          'label': (edge) => {

            if (edge.data('weight') != null && document.getElementById("cbk-flag-display-edge-weights").checked) {
              return edge.data('weight');
            }
            return '';
          },
          'curve-style': 'bezier',
          'target-arrow-shape': 'triangle',
          'text-rotation': 'autorotate',
          'width': '1.5px',
          'text-margin-y': '10px',
          'line-color' : 'black',
          'target-arrow-color': 'black',
        }
      },
      {
        selector: 'edge:selected',
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
          'width': '1.5px',
          'text-margin-y': '10px',
          'line-color' : '#0169d9',
          'target-arrow-color': '#0169d9',
        }
      },
      {
        selector: 'edge[compound="T"]',
        style: {
          'width': (edge) => {
              return edge.data('size');
          },
          'line-color' : '#964B00',
          'target-arrow-color': '#964B00',
      }
      },
      {
        selector: 'edge[compound="T"]:selected',
        style: {
          'width': (edge) => {
              return edge.data('size');
          },
          'line-color' : '#0169d9',
          'target-arrow-color': '#0169d9',
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
    layout: { name: 'fcose', animate: true, stop: function () { initializer(cy); } }
  });

  api = cy.layvo('get');
  cy2 = cytoscape();
  const cyLayout = window.cyLayout =  cytoscape({
    container: document.getElementById('cyHeadless'),
    style: [
      {
        selector: 'node',
        style: {
          'label': (node) => {
            return document.getElementById("cbk-flag-display-node-labels").checked? node.data('label') ? node.data('label') : node.id():"";
          },
          "color" : "black",
          'font-size': '20px',
          'compound-sizing-wrt-labels': 'include',
          'height': 40,
          'width': 40,
          'padding': "5px",
          "background-fit": "cover",
          "border-color": "black",
          "border-width": 1,
          "border-opacity": 1,
        }
      },
      {
        selector: 'edge',
        style: {
          'label': (edge) => {

            if (edge.data('weight') != null && document.getElementById("cbk-flag-display-edge-weights").checked) {
              return edge.data('weight');
            }
            return '';
          },
          'curve-style': 'bezier',
          'target-arrow-shape': 'triangle',
          'text-rotation': 'autorotate',
          'width': '1.5px',
          'text-margin-y': '10px',
          'line-color' : 'black',
          'target-arrow-color': 'black',
        }
      }]
    // headless:true,
    // styleEnabled:true
  });
  
  let layoutUtilities = cy.layoutUtilities({ desigrayAspectRatio: cy.width() / cy.height() });

  let newNodeCount = 0;
  let newEdgeCount = 0;

  function initializer(cy) {
    let oldInvisiblePOS = Object.create(null)
    cyInvisible.nodes().forEach(node => {
      oldInvisiblePOS[node.id()] = node.position();
    })
    cyVisible.remove(cyVisible.elements());
    cyInvisible.remove(cyInvisible.elements());

    let nodesToAddVisible = [];

    instance.getCompMgrInstance('get').visibleGraphManager.nodesMap.forEach((nodeItem, key) => {
      nodesToAddVisible.push({ data: { id: nodeItem.ID, parent: instance.getCompMgrInstance().visibleGraphManager.rootGraph === nodeItem.owner ? null : nodeItem.owner.parent.ID }, position: !cy.getElementById(nodeItem.ID).isParent() ? cy.getElementById(nodeItem.ID).position() : null });
    });
    cyVisible.add(nodesToAddVisible);
    instance.getCompMgrInstance('get').visibleGraphManager.edgesMap.forEach((edgeItem, key) => {
      cyVisible.add({ data: { id: edgeItem.ID, source: edgeItem.source.ID, target: edgeItem.target.ID } });
    });
    cyVisible.fit(cyVisible.elements(), 30);

    let nodesToAddInvisible = [];
    let nodePosInBothCyAndInvisible = [];
    instance.getCompMgrInstance('get').mainGraphManager.nodesMap.forEach((nodeItem, key) => {
      nodesToAddInvisible.push({ data: { id: nodeItem.ID , visible : nodeItem.isVisible?'T':"F", filtered : nodeItem.isFiltered?'T':"F", hidden : nodeItem.isHidden?'T':"F", label: nodeItem.ID + (nodeItem.isFiltered ? "(f)" : "") + (nodeItem.isHidden ? "(h)" : "") + (nodeItem.isCollapsed ? "(-)" : "") + (nodeItem.isVisible ? "" : "(i)"), parent: instance.getCompMgrInstance().visibleGraphManager.rootGraph === nodeItem.owner ? null : nodeItem.owner.parent.ID }});
    });
    cyInvisible.add(nodesToAddInvisible);
    instance.getCompMgrInstance('get').mainGraphManager.edgesMap.forEach((edgeItem, key) => {
      cyInvisible.add({ data: { id: edgeItem.ID, visible : edgeItem.isVisible?'T':"F", filtered : edgeItem.isFiltered?'T':"F", hidden : edgeItem.isHidden?'T':"F", label: (edgeItem.isFiltered ? "(f)" : "") + (edgeItem.isHidden ? "(h)" : "") + (edgeItem.isVisible ? "" : "(i)"), source: edgeItem.source.ID, target: edgeItem.target.ID } });
    });
    cyInvisible.nodes().forEach((node) => {
      let cyNode = cy.getElementById(node.id());
      if(cyNode.length > 0 && !node.isParent()) {
        nodePosInBothCyAndInvisible.push({nodeId: cyNode.id(), position: cyNode.position()});
      }else if(cyNode.length == 0 && !node.isParent()){
        nodePosInBothCyAndInvisible.push({nodeId: node.id(), position: oldInvisiblePOS[node.id()]});
      }
    });
    cyInvisible.layout({name: 'fcose', animate: false, fixedNodeConstraint: nodePosInBothCyAndInvisible}).run();
    layoutOptions = {...layoutOptions,...cy.options().layout};
   
    var radioButtons = document.getElementsByName('cbk-flag-display-node-label-pos');

    // Attach event listeners to the radio buttons
    radioButtons.forEach(function(radio) {
      if(radio.checked){
        setLabelPosition(radio.value);
      }
    });
  
    function setLabelPosition(position) {
      var cyChildlessNodes = cy.nodes().filter(function(element) {
        return element.isChildless();
      });
      var cyVisibleChildlessNodes = cyVisible.nodes().filter(function(element) {
        return element.isChildless();
      });
      var cyInVisibleChildlessNodes = cyInvisible.nodes().filter(function(element) {
        return element.isChildless();
      });
      var cyLayoutChildlessNodes = cyLayout.nodes().filter(function(element) {
        return element.isChildless();
      });
      
      cy.nodes().style('text-valign', 'top');

      cyChildlessNodes.style('text-valign', position);
      cyVisibleChildlessNodes.style('text-valign', position);
      cyInVisibleChildlessNodes.style('text-valign', position);
      cyLayoutChildlessNodes.style('text-valign', position);
    }
  }


  function getDescendantsInorder(node) {
    let descendants = {
      edges: new Set(),
      simpleNodes: [],
      compoundNodes: []
    };
    let childGraph = node.child;
    if (childGraph) {
      let childGraphNodes = childGraph.nodes;
      childGraphNodes.forEach((childNode) => {
        let childDescendents = getDescendantsInorder(childNode);
        for (var id in childDescendents) {
          descendants[id] = [...descendants[id] || [], ...childDescendents[id]];
        }
        descendants['edges'] = new Set(descendants['edges']);
        if (childNode.child) {
          descendants.compoundNodes.push(childNode);
        } else {
          descendants.simpleNodes.push(childNode);
        }
        let nodeEdges = childNode.edges;
        nodeEdges.forEach(item => descendants['edges'].add(item));
      });
    }
  
    return descendants;
  }
  
  function expandGraph(focusID,cy){
    
    let descendants = getDescendantsInorder(instance.getCompMgrInstance('get').mainGraphManager.nodesMap.get(focusID));

    

    cyLayout.remove(cyLayout.elements());

    let fNode = cyLayout.add({
      group: 'nodes',
      data: { id: focusID, 
              parent: null,
              'label' : document.getElementById("cbk-flag-display-node-labels").checked ? focusID : ''
       }}
    )
    fNode.style({'background-color': '#CCE1F9',})
    let savedNodes = [];
    descendants.compoundNodes.forEach( node => {
      if(cyLayout.getElementById( node.owner.parent.ID).length!=0){
        cyLayout.add({
          group: 'nodes',
          data: { id: node.ID, 
                  parent: node.owner.parent.ID,
                  'label' : document.getElementById("cbk-flag-display-node-labels").checked ? node.ID : ''
            }});

      }else{
        savedNodes.push({
          group: 'nodes',
          data: { id: node.ID, 
                  parent: node.owner.parent.ID,
                  'label' : document.getElementById("cbk-flag-display-node-labels").checked ? node.ID : ''
           }})
      }

    })

    savedNodes.forEach(cNodeData => {
      cyLayout.add(cNodeData)
    })

    descendants.simpleNodes.forEach( node => {
      try{
      cyLayout.add({
        group: 'nodes',
        data: { id: node.ID, 
                parent: node.owner.parent.ID,
                'label' : document.getElementById("cbk-flag-display-node-labels").checked ? node.ID : ''
              }});
          
         }catch(e){
            console.log(e);
         }
    })

    let e = [...descendants.edges]
    
    e.forEach( edge => {
      try{
        if(cyLayout.getElementById(edge.source.ID).length == 0  ){
          
          cyLayout.add({
            group: 'nodes',
            data: { id: edge.source.ID, 
              'label' : document.getElementById("cbk-flag-display-node-labels").checked ? edge.source.ID : ''
            }});
            
        }else if(cyLayout.getElementById(edge.target.ID).length == 0){

          cyLayout.add({
            group: 'nodes',
            data: { id: edge.target.ID, 
              'label' : document.getElementById("cbk-flag-display-node-labels").checked ? edge.target.ID : ''
            }});
            
        }
          cyLayout.add({
            group: 'edges',
            data: { id: edge.ID, 
                    source: edge.source.ID, 
                    target: edge.target.ID,
                  }
          });

        
      }catch(e){
      }
    })

    while(true){
      try{
        cyLayout.layout({name: 'fcose', animate: false}).run();
        break;
      }catch(e){
        console.log(e)
        break;
      }
    }


     const boundingBox = cyLayout.getElementById(focusID).boundingBox();
    
    var focusNodeWidth = boundingBox.w;
    var fcousNodeHeight = boundingBox.h;

    cyLayout.nodes().forEach(node => {node.style('label', node.id());})
    radioButtons.forEach(function(radio) {
      if(radio.checked){
        setLabelPosition(radio.value);
      }
    });
    pngSizeProxyGraph = cyLayout.png({
      scale:2,
      full:true
    });
    
    cyLayout.remove(cyLayout.elements());
    

    let topLevelFocusParent = getTopParent(cy.getElementById(focusID));
    cy.nodes().unselect();
    let compoundsCounter = 1;
    let componentNodes = []
    
    cy.nodes().forEach(node => {
      if(node.id()!= topLevelFocusParent.id() && node.parent().length == 0){
        if(node.isChildless()){
          node.select();
         
        }else{
          selectChildren(node);
        }
          var newboundingBox = cy.collection(cy.$(":selected")).boundingBox();
          newboundingBox = {...newboundingBox,w: node.width(),h:node.height()};
          var width = newboundingBox.w;
          var height = newboundingBox.h;
          
          componentNodes.push({id: node.id(),data:cy.$(":selected"),pos:{
            x: (newboundingBox.x2 + newboundingBox.x1)/2,
            y: (newboundingBox.y1 + newboundingBox.y2)/2}});
          var newNode = cyLayout.add({
                group: 'nodes',
                data: {
                  id: node.id(),
                  label: node.id()
                },
              });
        
        
              newNode.position({
                x: (newboundingBox.x2 + newboundingBox.x1)/2,
                y: (newboundingBox.y1 + newboundingBox.y2)/2
              });
        
              newNode.style({
                'width': Math.max(width,height), // Set the new width of the node
                'height': Math.max(width,height), // Set the new height of the node
                'label' : document.getElementById("cbk-flag-display-node-labels").checked ? newNode.data().id : ''
              });
              
              cy.nodes().unselect();
              compoundsCounter++;
      }
    })
    
    if(cy.getElementById(focusID).parent().length == 0){
      let focusNode = cyLayout.add(cy.getElementById(focusID).clone());
      focusNode.unselect();
  
      focusNode.position({
        x: cy.getElementById(focusID).position().x,
        y: cy.getElementById(focusID).position().y
      });
      focusNode.style({
        'width': Math.max(focusNodeWidth,fcousNodeHeight)+'px', // Set the new width of the node
        'height': Math.max(focusNodeWidth,fcousNodeHeight)+'px',// Set the new height of the node
        'background-color': '#CCE1F9',
        'label' : document.getElementById("cbk-flag-display-node-labels").checked ? focusNode.data().id : ''
      });
    }else{
      var newNode = cyLayout.add({
        group: 'nodes',
        data: {
          id: topLevelFocusParent.id(),
          label: topLevelFocusParent.id()
        },
      });


      newNode.position({
        x: topLevelFocusParent.position().x,
        y: topLevelFocusParent.position().y
      });
      newNode.style({
        'label' : document.getElementById("cbk-flag-display-node-labels").checked ? newNode.data().id : ''
      });
      compoundsCounter++;

      // addAllChildren(topLevelFocusParent,'compound'+(compoundsCounter-1),cyLayout,compoundsCounter,componentNodes,focusID,fcousNodeHeight,focusNodeWidth);
    
      // let descdents = getDescendantsInorderCyGraph(topLevelFocusParent)
      // let children = [...descdents.compoundNodes,...descdents.simpleNodes]

      selectChildren(topLevelFocusParent);
      let children = cy.$(":selected")
      
      cy.nodes().unselect();
      let nodeCache = []
      cyLayout.add(children)
      children.forEach(child => {
        child.select()
        var newboundingBox = cy.collection(cy.$(":selected")).boundingBox();
        newboundingBox = {...newboundingBox,w: child.width(),h:child.height()};
        var width = newboundingBox.w;
        var height = newboundingBox.h;
         
        if(child.id() != focusID){
          if(child.isChildless()){
            componentNodes.push({id: child.id(), data:cy.$(":selected"),pos:{
                x: (newboundingBox.x2 + newboundingBox.x1)/2,
                y: (newboundingBox.y1 + newboundingBox.y2)/2}});

              
                  newNode = cyLayout.getElementById(child.id())
                  newNode.position({
                    x: (newboundingBox.x2 + newboundingBox.x1)/2,
                    y: (newboundingBox.y1 + newboundingBox.y2)/2
                  });
            
                  newNode.style({
                    'width': Math.max(width,height)+'px', // Set the new width of the node
                    'height': Math.max(width,height)+'px', // Set the new height of the node
                    'label' : document.getElementById("cbk-flag-display-node-labels").checked ? newNode.data().id : ''
                  });
                  compoundsCounter++;
          }else{
            compoundsCounter++;
      
          }
        }else{
          

            let newFNode = cyLayout.getElementById(child.id())
            newFNode.position({
                x: child.position().x,
                y: child.position().y
              });
        
              newFNode.style({
                'width': Math.max(focusNodeWidth,fcousNodeHeight)+'px', // Set the new width of the node
                'height': Math.max(focusNodeWidth,fcousNodeHeight)+'px', // Set the new height of the node
                'background-color':'#CCE1F9',
                'label' : document.getElementById("cbk-flag-display-node-labels").checked ? newFNode.data().id : ''
              });
              compoundsCounter++;
        }
        cy.nodes().unselect();

      })
    }


    cy.fit();

    cyLayout.layout({
      name: 'fcose',
        quality: "proof",
        animate:true,
        animationDuration: 500,
        randomize: false, 
        nodeSeparation: 25,
      fixedNodeConstraint:[{nodeId: focusID, position: {x: cy.$('#'+focusID).position('x'),y:cy.$('#'+focusID).position('y')}}]

    }).run();

    componentNodes.forEach(component => {
      let newBox = cyLayout.getElementById(component.id).boundingBox()
      let newPos = {x: (newBox.x2 + newBox.x1)/2,
                    y: (newBox.y1 + newBox.y2)/2}
      let newComponentPosition = translateComponent(component.pos,newPos, component.pos);
      let translationFactor = translateNode(component.pos,newComponentPosition);
      component.data.forEach(node => {
        moveChildren(node,translationFactor,focusID);
      })
    })

    cy.fit();

    cy.getElementById(focusID).select();
    radioButtons.forEach(function(radio) {
      if(radio.checked){
        setLabelPosition(radio.value);
      }
    });
  }

  
  function translateNode(a,a1) {
    // Step 1: Find the displacement vector d between a and a1
    return { x: a1.x - a.x, y: a1.y - a.y };
    
  }

  function translateComponent(focusNodeInCyLayout,componentNodeInCyLayout,FocusNodeInCy) {

    let d = {x:componentNodeInCyLayout.x-focusNodeInCyLayout.x,y:componentNodeInCyLayout.y-focusNodeInCyLayout.y};

    return { x: FocusNodeInCy.x + d.x, y: FocusNodeInCy.y + d.y };
    
  }


  function selectChildren(node) {
    var children = node.children();
  
    if (children.nonempty()) {
      children.forEach(function(child) {
        child.select();
        selectChildren(child);
      });
    }
  }

  function getTopParent(node) {
    if(node.parent().length!=0){
      return getTopParent(node.parent())
    }else{
      return node
    }
  }

  function moveChildren(node,translationFactor,focusID){
    if(node.isChildless() && node.id() != focusID){
      node.animate({
        position: { x: node.position().x + translationFactor.x, y: node.position().y + translationFactor.y },
        
      }, {
        duration: 500
      });
      // node.shift({ x: translationFactor.x, y: translationFactor.y }, { duration: 500 });
    }else{
      node.children().forEach(child =>{
        moveChildren(child,translationFactor,focusID)
      })
    }
  }

  function handleCheckboxClick(checkboxId, elementType) {
    const checkbox = document.getElementById(checkboxId);
    const isChecked = checkbox.checked;
  
    if (isChecked) {
      if(elementType == 'node'){
        if(checkboxId == "cbk-flag-display-node-labels"){
          if(document.getElementById("cbk-flag-display-node-weight").checked){
            cy.style().selector(elementType).style('label', 'data(label)').update();
            cyVisible.style().selector(elementType).style('label', 'data(id)').update();
            cyInvisible.style().selector(elementType).style('label', 'data(id)').update();
            cyLayout.nodes().forEach(node => {node.style('label', node.id());});
          }else{
            cy.style().selector(elementType).style('label', 'data(id)').update();
            cyVisible.style().selector(elementType).style('label', 'data(id)').update();
            cyInvisible.style().selector(elementType).style('label', 'data(id)').update();
            cyLayout.nodes().forEach(node => {node.style('label', node.id());});
          }
        }else{
          if(document.getElementById("cbk-flag-display-node-labels").checked){
            cy.style().selector(elementType).style('label', 'data(label)').update();

          }else{
            cy.style().selector(elementType).style('label', 'data(weight)').update();
          }
        }
      }else{
        cy.style().selector(elementType).style('label', 'data(weight)').update();
        cyVisible.style().selector(elementType).style('label', 'data(weight)').update();
        cyInvisible.style().selector(elementType).style('label', 'data(weight)').update();
      }
    } else {
      if(elementType == 'node'){
        if(checkboxId == "cbk-flag-display-node-labels"){
          if(document.getElementById("cbk-flag-display-node-weight").checked){
            cy.style().selector(elementType).style('label', 'data(weight)').update();
            cyVisible.style().selector(elementType).style('label', '').update();
            cyInvisible.style().selector(elementType).style('label', '').update();
            cyLayout.nodes().style('label', '');

          }else{
            cy.style().selector(elementType).style('label', '').update();
            cyVisible.style().selector(elementType).style('label', '').update();
            cyInvisible.style().selector(elementType).style('label', '').update();
            cyLayout.nodes().style('label', '');
          }
        }else{
          if(document.getElementById("cbk-flag-display-node-labels").checked){
            cy.style().selector(elementType).style('label', 'data(id)').update();
          }else{
            cy.style().selector(elementType).style('label', '').update();
          }
        }
      }else{
        cy.style().selector(elementType).style('label', '').update();
      }
    }
  }

  document.getElementById('cbk-flag-display-node-labels').addEventListener('click', function() {
    handleCheckboxClick('cbk-flag-display-node-labels', 'node');
  });
  
  document.getElementById('cbk-flag-display-node-weight').addEventListener('click', function() {
    handleCheckboxClick('cbk-flag-display-node-weight', 'node');
  });

  document.getElementById('cbk-flag-display-edge-weights').addEventListener('click', function() {
    handleCheckboxClick('cbk-flag-display-edge-weights', 'edge');
  });

    var radioButtons = document.getElementsByName('cbk-flag-display-node-label-pos');

    // Attach event listeners to the radio buttons
    radioButtons.forEach(function(radio) {
      radio.addEventListener('click', function() {
        var selectedPosition = this.value;
        setLabelPosition(selectedPosition);
      });
    });

    // Function to set the label position based on the selected radio button
    function setLabelPosition(position) {
      var cyChildlessNodes = cy.nodes().filter(function(element) {
        return element.isChildless();
      });
      var cyVisibleChildlessNodes = cyVisible.nodes().filter(function(element) {
        return element.isChildless();
      });
      var cyInVisibleChildlessNodes = cyInvisible.nodes().filter(function(element) {
        return element.isChildless();
      });
      var cyLayoutChildlessNodes = cyLayout.nodes().filter(function(element) {
        return element.isChildless();
      });
      cyChildlessNodes.style('text-valign', position);
      cyVisibleChildlessNodes.style('text-valign', position);
      cyInVisibleChildlessNodes.style('text-valign', position);
      cyLayoutChildlessNodes.style('text-valign', position);
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
      cy.layout(layoutOptions).run();
    }
    else {
      initializer(cy);
    }
  });

  document.getElementById("addEdgeBetweenSelected").addEventListener("click", () => {
    let firstSelectedNode = cy.nodes(":selected")[0];
    let secondSelectedNode = cy.nodes(":selected")[1];

    if (cy.nodes(":selected").length == 2 && firstSelectedNode.intersection(secondSelectedNode.ancestors()).length == 0 && 
      secondSelectedNode.intersection(firstSelectedNode.ancestors()).length == 0) {
      while(true){
        try{
          cy.add({
            group: 'edges',
            data: { id: 'ne' + newEdgeCount, 
                    source: cy.nodes(":selected")[0].id(), 
                    target: cy.nodes(":selected")[1].id(),
                    weight: Math.floor(Math.random() * 101)}
          });
          break;
        }catch(e){
          newEdgeCount++;
        }
    }
    
    }

    newEdgeCount++;

    if (document.getElementById("cbk-run-layout2").checked) {
      cy.layout(layoutOptions).run();
    }
    else {
      initializer(cy);
    }
  });

  document.getElementById("removeSelected").addEventListener("click", () => {
    cy.elements(":selected").remove();

    if (document.getElementById("cbk-run-layout2").checked) {
      cy.layout(layoutOptions).run();
    }
    else {
      initializer(cy);
    }
  });

  document.getElementById("changeSource").addEventListener("click", () => {
    let selectedEdge = cy.edges(':selected')[0];
    let newSource = cy.nodes(':selected')[0];

    selectedEdge.move({ source: newSource.id() });

    if (document.getElementById("cbk-run-layout2").checked) {
      cy.layout(layoutOptions).run();
    }
    else {
      initializer(cy);
    }
  });

  document.getElementById("changeTarget").addEventListener("click", () => {
    let selectedEdge = cy.edges(':selected')[0];
    let newTarget = cy.nodes(':selected')[0];

    selectedEdge.move({ target: newTarget.id() });

    if (document.getElementById("cbk-run-layout2").checked) {
      cy.layout(layoutOptions).run();
    }
    else {
      initializer(cy);
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
      cy.layout(layoutOptions).run();
    }
    else {
      initializer(cy);
    }
  });

  window.iteration = 0;

  document.getElementById("addRandomElements").addEventListener("click", () => {
    window.iteration = (window.iteration || 0) + 1;
    const nodes = getRandomNodes();
    layoutUtilities.placeNewNodes(nodes);

    if (document.getElementById("cbk-run-layout2").checked) {
      cy.layout(layoutOptions).run();
    }
    else {
      initializer(cy);
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
      if (document.getElementById("cbk-run-layout3").checked) {
        cy.layout(layoutOptions).run();
      }
      else {
        initializer(cy);
      }
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
      if (document.getElementById("cbk-run-layout3").checked) {
        cy.layout(layoutOptions).run();
      }
      else {
        initializer(cy);
      }
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
      cy.layout(layoutOptions).run();
    }
    else {
      initializer(cy);
    }
  });

  document.getElementById("showHiddenNeighbors").addEventListener("click", () => {
    let selectedNodes = cy.nodes(':selected');
    let neighbors = instance.getHiddenNeighbors(selectedNodes);
    instance.show(neighbors);

    if (document.getElementById("cbk-run-layout3").checked) {
      cy.layout(layoutOptions).run();
    }
    else {
      initializer(cy);
    }
  });

  document.getElementById("showAll").addEventListener("click", () => {
    instance.showAll();

    if (document.getElementById("cbk-run-layout3").checked) {
      cy.layout(layoutOptions).run();
    }
    else {
      initializer(cy);
    }
  });

  document.getElementById("collapseSelectedNodes").addEventListener("click", () => {

    if (document.getElementById("cbk-flag-recursive").checked) {
      instance.collapseNodes(cy.nodes(':selected'), true);
    }else{
      instance.collapseNodes(cy.nodes(':selected'));
    }

    if (document.getElementById("cbk-run-layout3").checked) {
      cy.layout(layoutOptions).run();
    }
    else {
      initializer(cy);
    }
  });

  document.getElementById("expandSelectedNodes").addEventListener("click", async () => {
    if (document.getElementById("cbk-flag-recursive").checked) {
      cy.$(':selected').forEach(node => {
        if (document.getElementById("cbk-run-layout3").checked) {
          
          // For DEMO purposes only we are using expandGraph function from main.js file with additional demo functionalities
          // Label positioning, Label Display functions, Saving transition graphs to png files
          // expandGraph(node.data().id, cy)
          // FOR GENERAL USE from API FOllowing line is to be used instead of above one.
          // instance.expandGraph(node.data().id, cy)
            pngExpandGraph = cy.png({
              scale:2,
              full:true
            });
            instance.expandNodes(cy.nodes(':selected'), true);
            pngBeforeFinalGraph = cy.png({
              scale:2,
              full:true
            }); ;
            setTimeout(() => {

              if (document.getElementById("cbk-run-layout3").checked) {
                cy.layout(layoutOptions).run();
              }
              else {
                initializer(cy);
              }
            }, 700);
            
        }else{
          instance.expandNodes(cy.nodes(':selected'), true);
          cy.fit();
          initializer(cy);
        }
        
      })
    }else{
      cy.$(':selected').forEach(node => {

        if (document.getElementById("cbk-run-layout3").checked) {
          // For DEMO purposes only we are using expandGraph function from main.js file with additional demo functionalities
          // Label positioning, Label Display functions, Saving transition graphs to png files
          // expandGraph(node.data().id, cy)
          // FOR GENERAL USE from API FOllowing line is to be used instead of above one.
          // instance.expandGraph(node.data().id, cy)
            pngExpandGraph = cy.png({
              scale:2,
              full:true
            });
            instance.expandNodes(cy.nodes(':selected'));
            pngBeforeFinalGraph = cy.png({
              scale:2,
              full:true
            }); ;
            setTimeout(() => {

              if (document.getElementById("cbk-run-layout3").checked) {
                cy.layout(layoutOptions).run();
              }
              else {
                initializer(cy);
              }
            }, 700);
          
        }else{
          instance.expandNodes(cy.nodes(':selected'));
          cy.fit();
          initializer(cy);
        }

        
      })
    }
  });

  document.getElementById("collapseAllNodes").addEventListener("click", () => {
    instance.collapseAllNodes();

    if (document.getElementById("cbk-run-layout3").checked) {
      cy.layout(layoutOptions).run();
    }
    else {
      initializer(cy);
    }
  });

  document.getElementById("expandAllNodes").addEventListener("click", () => {
    instance.expandAllNodes();

    if (document.getElementById("cbk-run-layout3").checked) {
      cy.layout(layoutOptions).run();
    }
    else {
      initializer(cy);
    }
  });  

  document.getElementById("collapseSelectedEdges").addEventListener("click", () => {
    instance.collapseEdges(cy.edges(':selected'));

    if (document.getElementById("cbk-run-layout3").checked) {
      cy.layout(layoutOptions).run();
    }
    else {
      initializer(cy);
    }
  });

document.getElementById("expandSelectedEdges").addEventListener("click", () => {
  if (document.getElementById("cbk-flag-recursive").checked) {
    instance.expandEdges(cy.edges(':selected'), true);
  }else{
    instance.expandEdges(cy.edges(':selected'));
  }
  if (document.getElementById("cbk-run-layout3").checked) {
    cy.layout(layoutOptions).run();
  }
  else {
    initializer(cy);
  }
});

document.getElementById("collapseEdgesBetweenNodes").addEventListener("click", () => {
  instance.collapseEdgesBetweenNodes(cy.nodes(':selected'));

  if (document.getElementById("cbk-run-layout3").checked) {
    cy.layout(layoutOptions).run();
  }
  else {
    initializer(cy);
  }
});

document.getElementById("expandEdgesBetweenNodes").addEventListener("click", () => {

  if (document.getElementById("cbk-flag-recursive").checked) {
    instance.expandEdgesBetweenNodes(cy.nodes(':selected') , true);
  }else{
    instance.expandEdgesBetweenNodes(cy.nodes(':selected'));
  }

  

  if (document.getElementById("cbk-run-layout3").checked) {
    cy.layout(layoutOptions).run();
  }
  else {
    initializer(cy);
  }
});

document.getElementById("collapseAllEdges").addEventListener("click", () => {
  instance.collapseAllEdges();

  if (document.getElementById("cbk-run-layout3").checked) {
    cy.layout(layoutOptions).run();
  }
  else {
    initializer(cy);
  }
});

document.getElementById("expandAllEdges").addEventListener("click", () => {
  instance.expandAllEdges();

  if (document.getElementById("cbk-run-layout3").checked) {
    cy.layout(layoutOptions).run();
  }
  else {
    initializer(cy);
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
        parentID = compoundNodes[Math.floor(Math.random() * compoundNodes.length)]?.id()
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
              try{
              cy.add({ group: 'edges', data: { id: `${dummyID}-e`, source: nodeToConnect.id(), target: dummyID, weight: Math.floor(Math.random() * 101)}})
              }catch(exp){

              }
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
          try{
          cy.add({ group: 'edges', data: { id: `${edgeId}-${i}`, source: id, target: randomNeighbor.id(), weight: Math.floor(Math.random() * 101)}})
          }catch(exp){
                  
          }
        }
      } else if (randomValue < 8) {
        const availableCount = Math.min(neighborCount, availableCurrentNodes.length);
        for (let i = 0; i < availableCount; i++) {
          let randomNeighbor;
          do {
            randomNeighbor = availableCurrentNodes[Math.floor(Math.random() * availableCurrentNodes.length)];
          } while (selectedNeighbors.includes(randomNeighbor.id()));
          selectedNeighbors.push(randomNeighbor.id());
          try{
          cy.add({ group: 'edges', data: { id: `${edgeId}-${i}`, source: id, target: randomNeighbor.id(), weight: Math.floor(Math.random() * 101)}})
          }catch(exp){
                  
          }
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
          try{
          cy.add({ group: 'edges', data: { id: `${edgeId}-${i}`, source: id, target: randomNeighbor.id(), weight: Math.floor(Math.random() * 101)}})
          }catch(exp){
                  
          }
        }
      }
    }
  }
  return newNodes;
};

