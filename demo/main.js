
let pngImage = {pngExpandGraph:null, pngSizeProxyGraph:null} ;
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
      instance = window.instance = this.complexityManagement({
        layoutBy: {
          name: "fcose",
          randomize: false
        }}
      );
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
            return document.getElementById("cbk-flag-display-node-labels").checked ? 
            (node.data('label') ? 
              (node.data('label').length > 5 ? node.data('label').substring(0, 5) + '...' : node.data('label')) : 
              (node.id().length > 5 ? node.id().substring(0, 5) + '...' : node.id())) : 
            '';
            // return document.getElementById("cbk-flag-display-node-labels").checked? node.data('label') ? node.data('label') : node.id():"";
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

            return edge.data('weight');
            
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
      "nodes": [
          {
              "data": {
                  "id": "n1",
                  "weight": 91,
                  "label": "n1(91)"
              },
              "position": {
                  "x": 767.4624422778397,
                  "y": -86.22531596671283
              },
              "group": "nodes",
              "removed": false,
              "selected": false,
              "selectable": true,
              "locked": false,
              "grabbable": true,
              "pannable": false,
              "classes": ""
          },
          {
              "data": {
                  "id": "n2",
                  "weight": 25,
                  "label": "n2(25)"
              },
              "position": {
                  "x": 712.7746821305227,
                  "y": -217.1808787103852
              },
              "group": "nodes",
              "removed": false,
              "selected": false,
              "selectable": true,
              "locked": false,
              "grabbable": true,
              "pannable": false,
              "classes": ""
          },
          {
              "data": {
                  "id": "n3",
                  "weight": 36,
                  "label": "n3(36)"
              },
              "position": {
                  "x": 627.5237294843408,
                  "y": -180.64109228657105
              },
              "group": "nodes",
              "removed": false,
              "selected": false,
              "selectable": true,
              "locked": false,
              "grabbable": true,
              "pannable": false,
              "classes": ""
          },
          {
              "data": {
                  "id": "n4",
                  "weight": 20,
                  "label": "n4(20)"
              },
              "position": {
                  "x": 497.66299245462466,
                  "y": -241.92053976493065
              },
              "group": "nodes",
              "removed": false,
              "selected": false,
              "selectable": true,
              "locked": false,
              "grabbable": true,
              "pannable": false,
              "classes": ""
          },
          {
              "data": {
                  "id": "n5",
                  "weight": 25,
                  "label": "n5(25)"
              },
              "position": {
                  "x": 468.48132415972304,
                  "y": -563.6482837972129
              },
              "group": "nodes",
              "removed": false,
              "selected": false,
              "selectable": true,
              "locked": false,
              "grabbable": true,
              "pannable": false,
              "classes": ""
          },
          {
              "data": {
                  "id": "n9",
                  "weight": 15,
                  "label": "n9(15)"
              },
              "position": {
                  "x": 522.1186285290894,
                  "y": 2.246459645671024
              },
              "group": "nodes",
              "removed": false,
              "selected": false,
              "selectable": true,
              "locked": false,
              "grabbable": true,
              "pannable": false,
              "classes": ""
          },
          {
              "data": {
                  "id": "n10",
                  "parent": "n28",
                  "weight": 5,
                  "label": "n10(5)"
              },
              "position": {
                  "x": 114.73861171877854,
                  "y": -75.95187419834441
              },
              "group": "nodes",
              "removed": false,
              "selected": false,
              "selectable": true,
              "locked": false,
              "grabbable": true,
              "pannable": false,
              "classes": ""
          },
          {
              "data": {
                  "id": "n11",
                  "parent": "n28",
                  "weight": 34,
                  "label": "n11(34)"
              },
              "position": {
                  "x": 217.81380848285627,
                  "y": -142.20380316101853
              },
              "group": "nodes",
              "removed": false,
              "selected": false,
              "selectable": true,
              "locked": false,
              "grabbable": true,
              "pannable": false,
              "classes": ""
          },
          {
              "data": {
                  "id": "n12",
                  "parent": "n28",
                  "weight": 74,
                  "label": "n12(74)"
              },
              "position": {
                  "x": 302.8797591388047,
                  "y": -151.71136423286364
              },
              "group": "nodes",
              "removed": false,
              "selected": false,
              "selectable": true,
              "locked": false,
              "grabbable": true,
              "pannable": false,
              "classes": ""
          },
          {
              "data": {
                  "id": "n13",
                  "parent": "n28",
                  "weight": 11,
                  "label": "n13(11)"
              },
              "position": {
                  "x": 392.97324382710053,
                  "y": -65.38947507579
              },
              "group": "nodes",
              "removed": false,
              "selected": false,
              "selectable": true,
              "locked": false,
              "grabbable": true,
              "pannable": false,
              "classes": ""
          },
          {
              "data": {
                  "id": "n14",
                  "parent": "n28",
                  "weight": 27,
                  "label": "n14(27)"
              },
              "position": {
                  "x": 261.5997754659475,
                  "y": -48.03564682440343
              },
              "group": "nodes",
              "removed": false,
              "selected": false,
              "selectable": true,
              "locked": false,
              "grabbable": true,
              "pannable": false,
              "classes": ""
          },
          {
              "data": {
                  "id": "n15",
                  "weight": 88,
                  "label": "n15(88)"
              },
              "position": {
                  "x": -358.4425596617727,
                  "y": 323.58683891351046
              },
              "group": "nodes",
              "removed": false,
              "selected": false,
              "selectable": true,
              "locked": false,
              "grabbable": true,
              "pannable": false,
              "classes": ""
          },
          {
              "data": {
                  "id": "n16",
                  "weight": 4,
                  "label": "n16(4)"
              },
              "position": {
                  "x": -287.99419061390745,
                  "y": 226.52634806671085
              },
              "group": "nodes",
              "removed": false,
              "selected": false,
              "selectable": true,
              "locked": false,
              "grabbable": true,
              "pannable": false,
              "classes": ""
          },
          {
              "data": {
                  "id": "n17",
                  "weight": 67,
                  "label": "n17(67)"
              },
              "position": {
                  "x": -446.5121118429573,
                  "y": 245.3437027432583
              },
              "group": "nodes",
              "removed": false,
              "selected": false,
              "selectable": true,
              "locked": false,
              "grabbable": true,
              "pannable": false,
              "classes": ""
          },
          {
              "data": {
                  "id": "n18",
                  "weight": 99,
                  "label": "n18(99)"
              },
              "position": {
                  "x": -521.4069934148254,
                  "y": 166.92945578827792
              },
              "group": "nodes",
              "removed": false,
              "selected": false,
              "selectable": true,
              "locked": false,
              "grabbable": true,
              "pannable": false,
              "classes": ""
          },
          {
              "data": {
                  "id": "n19",
                  "weight": 35,
                  "label": "n19(35)"
              },
              "position": {
                  "x": -411.04374793571026,
                  "y": 139.1309818870278
              },
              "group": "nodes",
              "removed": false,
              "selected": false,
              "selectable": true,
              "locked": false,
              "grabbable": true,
              "pannable": false,
              "classes": ""
          },
          {
              "data": {
                  "id": "n20",
                  "parent": "n26",
                  "weight": 54,
                  "label": "n20(54)"
              },
              "position": {
                  "x": -218.01476473514617,
                  "y": -387.9935557029679
              },
              "group": "nodes",
              "removed": false,
              "selected": false,
              "selectable": true,
              "locked": false,
              "grabbable": true,
              "pannable": false,
              "classes": ""
          },
          {
              "data": {
                  "id": "n21",
                  "parent": "n26",
                  "weight": 17,
                  "label": "n21(17)"
              },
              "position": {
                  "x": -322.6556106050282,
                  "y": -374.1956867726113
              },
              "group": "nodes",
              "removed": false,
              "selected": false,
              "selectable": true,
              "locked": false,
              "grabbable": true,
              "pannable": false,
              "classes": ""
          },
          {
              "data": {
                  "id": "n22",
                  "parent": "n27",
                  "weight": 4,
                  "label": "n22(4)"
              },
              "position": {
                  "x": -25.68233593878368,
                  "y": -46.80713108297246
              },
              "group": "nodes",
              "removed": false,
              "selected": false,
              "selectable": true,
              "locked": false,
              "grabbable": true,
              "pannable": false,
              "classes": ""
          },
          {
              "data": {
                  "id": "n23",
                  "parent": "n25",
                  "weight": 29,
                  "label": "n23(29)"
              },
              "position": {
                  "x": -502.6474517802701,
                  "y": -87.44463756528387
              },
              "group": "nodes",
              "removed": false,
              "selected": false,
              "selectable": true,
              "locked": false,
              "grabbable": true,
              "pannable": false,
              "classes": ""
          },
          {
              "data": {
                  "id": "n24",
                  "weight": 71,
                  "label": "n24(71)",
                  "expandcollapseRenderedStartX": 820.5834583663917,
                  "expandcollapseRenderedStartY": 59.98662794776743,
                  "expandcollapseRenderedCueSize": 12
              },
              "position": {
                  "x": 602.9750012630975,
                  "y": -428.0951544279311
              },
              "group": "nodes",
              "removed": false,
              "selected": false,
              "selectable": true,
              "locked": false,
              "grabbable": true,
              "pannable": false,
              "classes": ""
          },
          {
              "data": {
                  "id": "n25",
                  "weight": 18,
                  "label": "n25(18)",
                  "expandcollapseRenderedStartX": 276.27331088167983,
                  "expandcollapseRenderedStartY": 420.4098080594265,
                  "expandcollapseRenderedCueSize": 12
              },
              "position": {
                  "x": -463.0933082012036,
                  "y": -44.299998486054484
              },
              "group": "nodes",
              "removed": false,
              "selected": false,
              "selectable": true,
              "locked": false,
              "grabbable": true,
              "pannable": false,
              "classes": ""
          },
          {
              "data": {
                  "id": "n26",
                  "parent": "n30",
                  "weight": 32,
                  "label": "n26(32)",
                  "expandcollapseRenderedStartX": 343.3505188551197,
                  "expandcollapseRenderedStartY": 144.88221170139153,
                  "expandcollapseRenderedCueSize": 12
              },
              "position": {
                  "x": -270.3351876700872,
                  "y": -381.0946212377896
              },
              "group": "nodes",
              "removed": false,
              "selected": false,
              "selectable": true,
              "locked": false,
              "grabbable": true,
              "pannable": false,
              "classes": ""
          },
          {
              "data": {
                  "id": "n27",
                  "parent": "n29",
                  "weight": 77,
                  "label": "n27(77)"
              },
              "position": {
                  "x": -25.68233593878368,
                  "y": -46.80713108297246
              },
              "group": "nodes",
              "removed": false,
              "selected": false,
              "selectable": true,
              "locked": false,
              "grabbable": true,
              "pannable": false,
              "classes": ""
          },
          {
              "data": {
                  "id": "n28",
                  "parent": "n29",
                  "weight": 48,
                  "label": "n28(48)"
              },
              "position": {
                  "x": 249.9261434062584,
                  "y": -112.28667694638187
              },
              "group": "nodes",
              "removed": false,
              "selected": false,
              "selectable": true,
              "locked": false,
              "grabbable": true,
              "pannable": false,
              "classes": ""
          },
          {
              "data": {
                  "id": "n29",
                  "parent": "n30",
                  "weight": 6,
                  "label": "n29(6)"
              },
              "position": {
                  "x": 173.04268611224666,
                  "y": -163.92090139050754
              },
              "group": "nodes",
              "removed": false,
              "selected": false,
              "selectable": true,
              "locked": false,
              "grabbable": true,
              "pannable": false,
              "classes": ""
          },
          {
              "data": {
                  "id": "n30",
                  "weight": 4,
                  "label": "n30(4)"
              },
              "position": {
                  "x": 38.40881661103617,
                  "y": -224.4003433929702
              },
              "group": "nodes",
              "removed": false,
              "selected": false,
              "selectable": true,
              "locked": false,
              "grabbable": true,
              "pannable": false,
              "classes": ""
          },
          {
              "data": {
                  "id": "f1",
                  "parent": "n29",
                  "weight": 88,
                  "label": "f1(88)"
              },
              "position": {
                  "x": -53.38787160260725,
                  "y": -162.8801817579064
              },
              "group": "nodes",
              "removed": false,
              "selected": false,
              "selectable": true,
              "locked": false,
              "grabbable": true,
              "pannable": false,
              "classes": ""
          },
          {
              "data": {
                  "id": "f2",
                  "parent": "n28",
                  "weight": 68,
                  "label": "f2(68)"
              },
              "position": {
                  "x": 106.87904298541628,
                  "y": -176.53770706836033
              },
              "group": "nodes",
              "removed": false,
              "selected": false,
              "selectable": true,
              "locked": false,
              "grabbable": true,
              "pannable": false,
              "classes": ""
          },
          {
              "data": {
                  "id": "h1",
                  "weight": 3,
                  "label": "h1(3)"
              },
              "position": {
                  "x": -258.4852840461332,
                  "y": 332.2643368505786
              },
              "group": "nodes",
              "removed": false,
              "selected": false,
              "selectable": true,
              "locked": false,
              "grabbable": true,
              "pannable": false,
              "classes": ""
          },
          {
              "data": {
                  "id": "h2",
                  "weight": 87,
                  "label": "h2(87)"
              },
              "position": {
                  "x": -279.5850012185665,
                  "y": 113.0731062330378
              },
              "group": "nodes",
              "removed": false,
              "selected": false,
              "selectable": true,
              "locked": false,
              "grabbable": true,
              "pannable": false,
              "classes": ""
          },
          {
              "data": {
                  "id": "h3",
                  "weight": 78,
                  "label": "h3(78)"
              },
              "position": {
                  "x": -527.6900722469431,
                  "y": 97.18489950610378
              },
              "group": "nodes",
              "removed": false,
              "selected": false,
              "selectable": true,
              "locked": false,
              "grabbable": true,
              "pannable": false,
              "classes": ""
          },
          {
              "data": {
                  "id": "v2",
                  "parent": "n25",
                  "weight": 9,
                  "label": "v2(9)"
              },
              "position": {
                  "x": -423.5391646221372,
                  "y": -1.1553594068250952
              },
              "group": "nodes",
              "removed": false,
              "selected": false,
              "selectable": true,
              "locked": false,
              "grabbable": true,
              "pannable": false,
              "classes": ""
          },
          {
              "data": {
                  "id": "v3",
                  "weight": 22,
                  "label": "v3(22)"
              },
              "position": {
                  "x": -620.121632912445,
                  "y": 70.84596568689443
              },
              "group": "nodes",
              "removed": false,
              "selected": false,
              "selectable": true,
              "locked": false,
              "grabbable": true,
              "pannable": false,
              "classes": ""
          },
          {
              "data": {
                  "id": "v4",
                  "weight": 55,
                  "label": "v4(55)"
              },
              "position": {
                  "x": -338.3705424462228,
                  "y": -601.7349486208947
              },
              "group": "nodes",
              "removed": false,
              "selected": false,
              "selectable": true,
              "locked": false,
              "grabbable": true,
              "pannable": false,
              "classes": ""
          },
          {
              "data": {
                  "id": "h4r",
                  "weight": 2,
                  "label": "h4r(2)"
              },
              "position": {
                  "x": 578.9141573923807,
                  "y": -81.75182601864368
              },
              "group": "nodes",
              "removed": false,
              "selected": false,
              "selectable": true,
              "locked": false,
              "grabbable": true,
              "pannable": false,
              "classes": ""
          },
          {
              "data": {
                  "id": "r1",
                  "parent": "n29",
                  "weight": 81,
                  "label": "r1(81)"
              },
              "position": {
                  "x": 32.965986937594266,
                  "y": -235.61994667370004
              },
              "group": "nodes",
              "removed": false,
              "selected": false,
              "selectable": true,
              "locked": false,
              "grabbable": true,
              "pannable": false,
              "classes": ""
          },
          {
              "data": {
                  "id": "r2",
                  "parent": "n29",
                  "weight": 89,
                  "label": "r2(89)"
              },
              "position": {
                  "x": -32.41639935559519,
                  "y": -287.5346716980426
              },
              "group": "nodes",
              "removed": false,
              "selected": false,
              "selectable": true,
              "locked": false,
              "grabbable": true,
              "pannable": false,
              "classes": ""
          },
          {
              "data": {
                  "id": "r3",
                  "weight": 96,
                  "label": "r3(96)"
              },
              "position": {
                  "x": 498.1892246479104,
                  "y": -117.32813638983498
              },
              "group": "nodes",
              "removed": false,
              "selected": false,
              "selectable": true,
              "locked": false,
              "grabbable": true,
              "pannable": false,
              "classes": ""
          },
          {
              "data": {
                  "id": "n6",
                  "parent": "n24",
                  "weight": 55,
                  "label": "n6(55)"
              },
              "position": {
                  "x": 553.5145202231397,
                  "y": -384.8816946035505
              },
              "group": "nodes",
              "removed": false,
              "selected": false,
              "selectable": true,
              "locked": false,
              "grabbable": true,
              "pannable": false,
              "classes": ""
          },
          {
              "data": {
                  "id": "n7",
                  "parent": "n24",
                  "weight": 82,
                  "label": "n7(82)"
              },
              "position": {
                  "x": 652.4354823030553,
                  "y": -560.5649678269923
              },
              "group": "nodes",
              "removed": false,
              "selected": false,
              "selectable": true,
              "locked": false,
              "grabbable": true,
              "pannable": false,
              "classes": ""
          },
          {
              "data": {
                  "id": "n8",
                  "parent": "n24",
                  "weight": 22,
                  "label": "n8(22)"
              },
              "position": {
                  "x": 628.7158691943905,
                  "y": -295.62534102886985
              },
              "group": "nodes",
              "removed": false,
              "selected": false,
              "selectable": true,
              "locked": false,
              "grabbable": true,
              "pannable": false,
              "classes": ""
          },
          {
              "data": {
                  "id": "v1",
                  "parent": "n24",
                  "weight": 79,
                  "label": "v1(79)"
              },
              "position": {
                  "x": 635.6305119092972,
                  "y": -415.70277105249016
              },
              "group": "nodes",
              "removed": false,
              "selected": false,
              "selectable": true,
              "locked": false,
              "grabbable": true,
              "pannable": false,
              "classes": ""
          }
      ],
      "edges": [
          {
              "data": {
                  "id": "e43",
                  "source": "r3",
                  "target": "h4r",
                  "weight": 91,
                  "label": "e43(91)"
              },
              "position": {
                  "x": 0,
                  "y": 0
              },
              "group": "edges",
              "removed": false,
              "selected": false,
              "selectable": true,
              "locked": false,
              "grabbable": true,
              "pannable": true,
              "classes": ""
          },
          {
              "data": {
                  "id": "e42",
                  "source": "n9",
                  "target": "h4r",
                  "weight": 1,
                  "label": "e42(1)"
              },
              "position": {
                  "x": 0,
                  "y": 0
              },
              "group": "edges",
              "removed": false,
              "selected": false,
              "selectable": true,
              "locked": false,
              "grabbable": true,
              "pannable": true,
              "classes": ""
          },
          {
              "data": {
                  "id": "e41",
                  "source": "n9",
                  "target": "r3",
                  "weight": 47,
                  "label": "e41(47)"
              },
              "position": {
                  "x": 0,
                  "y": 0
              },
              "group": "edges",
              "removed": false,
              "selected": false,
              "selectable": true,
              "locked": false,
              "grabbable": true,
              "pannable": true,
              "classes": ""
          },
          {
              "data": {
                  "id": "e40",
                  "source": "h2",
                  "target": "n27",
                  "weight": 10,
                  "label": "e40(10)"
              },
              "position": {
                  "x": 0,
                  "y": 0
              },
              "group": "edges",
              "removed": false,
              "selected": false,
              "selectable": true,
              "locked": false,
              "grabbable": true,
              "pannable": true,
              "classes": ""
          },
          {
              "data": {
                  "id": "e2",
                  "source": "n2",
                  "target": "n3",
                  "weight": 51,
                  "label": "e2(51)"
              },
              "position": {
                  "x": 0,
                  "y": 0
              },
              "group": "edges",
              "removed": false,
              "selected": false,
              "selectable": true,
              "locked": false,
              "grabbable": true,
              "pannable": true,
              "classes": ""
          },
          {
              "data": {
                  "id": "e3",
                  "source": "n1",
                  "target": "n2",
                  "weight": 50,
                  "label": "e3(50)"
              },
              "position": {
                  "x": 0,
                  "y": 0
              },
              "group": "edges",
              "removed": false,
              "selected": false,
              "selectable": true,
              "locked": false,
              "grabbable": true,
              "pannable": true,
              "classes": ""
          },
          {
              "data": {
                  "id": "ne6",
                  "source": "n12",
                  "target": "n14",
                  "weight": 71,
                  "label": "ne6(71)"
              },
              "position": {
                  "x": 0,
                  "y": 0
              },
              "group": "edges",
              "removed": false,
              "selected": false,
              "selectable": true,
              "locked": false,
              "grabbable": true,
              "pannable": true,
              "classes": ""
          },
          {
              "data": {
                  "id": "ne7",
                  "source": "n3",
                  "target": "n13",
                  "weight": 3
              },
              "position": {
                  "x": 0,
                  "y": 0
              },
              "group": "edges",
              "removed": false,
              "selected": false,
              "selectable": true,
              "locked": false,
              "grabbable": true,
              "pannable": true,
              "classes": ""
          },
          {
              "data": {
                  "id": "ne8",
                  "source": "n4",
                  "target": "n13",
                  "weight": 56
              },
              "position": {
                  "x": 0,
                  "y": 0
              },
              "group": "edges",
              "removed": false,
              "selected": false,
              "selectable": true,
              "locked": false,
              "grabbable": true,
              "pannable": true,
              "classes": ""
          },
          {
              "data": {
                  "id": "ne4",
                  "source": "n25",
                  "target": "f1",
                  "weight": 99,
                  "label": "ne4(99)"
              },
              "position": {
                  "x": 0,
                  "y": 0
              },
              "group": "edges",
              "removed": false,
              "selected": false,
              "selectable": true,
              "locked": false,
              "grabbable": true,
              "pannable": true,
              "classes": ""
          },
          {
              "data": {
                  "id": "e44",
                  "source": "n11",
                  "target": "r3",
                  "weight": 45,
                  "label": "e44(45)"
              },
              "position": {
                  "x": 0,
                  "y": 0
              },
              "group": "edges",
              "removed": false,
              "selected": false,
              "selectable": true,
              "locked": false,
              "grabbable": true,
              "pannable": true,
              "classes": ""
          },
          {
              "data": {
                  "id": "ne5",
                  "source": "n25",
                  "target": "f1",
                  "weight": 37,
                  "label": "ne5(37)"
              },
              "position": {
                  "x": 0,
                  "y": 0
              },
              "group": "edges",
              "removed": false,
              "selected": false,
              "selectable": true,
              "locked": false,
              "grabbable": true,
              "pannable": true,
              "classes": ""
          },
          {
              "data": {
                  "id": "e45",
                  "source": "n14",
                  "target": "r3",
                  "weight": 40,
                  "label": "e45(40)"
              },
              "position": {
                  "x": 0,
                  "y": 0
              },
              "group": "edges",
              "removed": false,
              "selected": false,
              "selectable": true,
              "locked": false,
              "grabbable": true,
              "pannable": true,
              "classes": ""
          },
          {
              "data": {
                  "id": "e13",
                  "source": "h1",
                  "target": "n16",
                  "weight": 54,
                  "label": "e13(54)"
              },
              "position": {
                  "x": 0,
                  "y": 0
              },
              "group": "edges",
              "removed": false,
              "selected": false,
              "selectable": true,
              "locked": false,
              "grabbable": true,
              "pannable": true,
              "classes": ""
          },
          {
              "data": {
                  "id": "e14",
                  "source": "v2",
                  "target": "n23",
                  "weight": 7,
                  "label": "e14(7)"
              },
              "position": {
                  "x": 0,
                  "y": 0
              },
              "group": "edges",
              "removed": false,
              "selected": false,
              "selectable": true,
              "locked": false,
              "grabbable": true,
              "pannable": true,
              "classes": ""
          },
          {
              "data": {
                  "id": "e15",
                  "source": "n16",
                  "target": "n15",
                  "weight": 21,
                  "label": "e15(21)"
              },
              "position": {
                  "x": 0,
                  "y": 0
              },
              "group": "edges",
              "removed": false,
              "selected": false,
              "selectable": true,
              "locked": false,
              "grabbable": true,
              "pannable": true,
              "classes": ""
          },
          {
              "data": {
                  "id": "e16",
                  "source": "n16",
                  "target": "h2",
                  "weight": 8,
                  "label": "e16(8)"
              },
              "position": {
                  "x": 0,
                  "y": 0
              },
              "group": "edges",
              "removed": false,
              "selected": false,
              "selectable": true,
              "locked": false,
              "grabbable": true,
              "pannable": true,
              "classes": ""
          },
          {
              "data": {
                  "id": "e17",
                  "source": "n15",
                  "target": "n17",
                  "weight": 29,
                  "label": "e17(29)"
              },
              "position": {
                  "x": 0,
                  "y": 0
              },
              "group": "edges",
              "removed": false,
              "selected": false,
              "selectable": true,
              "locked": false,
              "grabbable": true,
              "pannable": true,
              "classes": ""
          },
          {
              "data": {
                  "id": "e18",
                  "source": "h3",
                  "target": "v3",
                  "weight": 2,
                  "label": "e18(2)"
              },
              "position": {
                  "x": 0,
                  "y": 0
              },
              "group": "edges",
              "removed": false,
              "selected": false,
              "selectable": true,
              "locked": false,
              "grabbable": true,
              "pannable": true,
              "classes": ""
          },
          {
              "data": {
                  "id": "e19",
                  "source": "v3",
                  "target": "n18",
                  "weight": 31,
                  "label": "e19(31)"
              },
              "position": {
                  "x": 0,
                  "y": 0
              },
              "group": "edges",
              "removed": false,
              "selected": false,
              "selectable": true,
              "locked": false,
              "grabbable": true,
              "pannable": true,
              "classes": ""
          },
          {
              "data": {
                  "id": "e20",
                  "source": "n17",
                  "target": "n19",
                  "weight": 33,
                  "label": "e20(33)"
              },
              "position": {
                  "x": 0,
                  "y": 0
              },
              "group": "edges",
              "removed": false,
              "selected": false,
              "selectable": true,
              "locked": false,
              "grabbable": true,
              "pannable": true,
              "classes": ""
          },
          {
              "data": {
                  "id": "e21",
                  "source": "n18",
                  "target": "n19",
                  "weight": 61,
                  "label": "e21(61)"
              },
              "position": {
                  "x": 0,
                  "y": 0
              },
              "group": "edges",
              "removed": false,
              "selected": false,
              "selectable": true,
              "locked": false,
              "grabbable": true,
              "pannable": true,
              "classes": ""
          },
          {
              "data": {
                  "id": "e22",
                  "source": "h2",
                  "target": "n19",
                  "weight": 54,
                  "label": "e22(54)"
              },
              "position": {
                  "x": 0,
                  "y": 0
              },
              "group": "edges",
              "removed": false,
              "selected": false,
              "selectable": true,
              "locked": false,
              "grabbable": true,
              "pannable": true,
              "classes": ""
          },
          {
              "data": {
                  "id": "e23",
                  "source": "n19",
                  "target": "h3",
                  "weight": 47,
                  "label": "e23(47)"
              },
              "position": {
                  "x": 0,
                  "y": 0
              },
              "group": "edges",
              "removed": false,
              "selected": false,
              "selectable": true,
              "locked": false,
              "grabbable": true,
              "pannable": true,
              "classes": ""
          },
          {
              "data": {
                  "id": "e25",
                  "source": "v4",
                  "target": "n20",
                  "weight": 58,
                  "label": "e25(58)"
              },
              "position": {
                  "x": 0,
                  "y": 0
              },
              "group": "edges",
              "removed": false,
              "selected": false,
              "selectable": true,
              "locked": false,
              "grabbable": true,
              "pannable": true,
              "classes": ""
          },
          {
              "data": {
                  "id": "e26",
                  "source": "n20",
                  "target": "n21",
                  "weight": 38,
                  "label": "e26(38)"
              },
              "position": {
                  "x": 0,
                  "y": 0
              },
              "group": "edges",
              "removed": false,
              "selected": false,
              "selectable": true,
              "locked": false,
              "grabbable": true,
              "pannable": true,
              "classes": ""
          },
          {
              "data": {
                  "id": "e27",
                  "source": "n25",
                  "target": "f1",
                  "weight": 33,
                  "label": "e27(33)"
              },
              "position": {
                  "x": 0,
                  "y": 0
              },
              "group": "edges",
              "removed": false,
              "selected": false,
              "selectable": true,
              "locked": false,
              "grabbable": true,
              "pannable": true,
              "classes": ""
          },
          {
              "data": {
                  "id": "e29",
                  "source": "f1",
                  "target": "n26",
                  "weight": 6,
                  "label": "e29(6)"
              },
              "position": {
                  "x": 0,
                  "y": 0
              },
              "group": "edges",
              "removed": false,
              "selected": false,
              "selectable": true,
              "locked": false,
              "grabbable": true,
              "pannable": true,
              "classes": ""
          },
          {
              "data": {
                  "id": "e30",
                  "source": "f1",
                  "target": "r2",
                  "weight": 70,
                  "label": "e30(70)"
              },
              "position": {
                  "x": 0,
                  "y": 0
              },
              "group": "edges",
              "removed": false,
              "selected": false,
              "selectable": true,
              "locked": false,
              "grabbable": true,
              "pannable": true,
              "classes": ""
          },
          {
              "data": {
                  "id": "e31",
                  "source": "f1",
                  "target": "r1",
                  "weight": 18,
                  "label": "e31(18)"
              },
              "position": {
                  "x": 0,
                  "y": 0
              },
              "group": "edges",
              "removed": false,
              "selected": false,
              "selectable": true,
              "locked": false,
              "grabbable": true,
              "pannable": true,
              "classes": ""
          },
          {
              "data": {
                  "id": "e33",
                  "source": "h3",
                  "target": "v2",
                  "weight": 33,
                  "label": "e33(33)"
              },
              "position": {
                  "x": 0,
                  "y": 0
              },
              "group": "edges",
              "removed": false,
              "selected": false,
              "selectable": true,
              "locked": false,
              "grabbable": true,
              "pannable": true,
              "classes": ""
          },
          {
              "data": {
                  "id": "e35",
                  "source": "f2",
                  "target": "n11",
                  "weight": 3,
                  "label": "e35(3)"
              },
              "position": {
                  "x": 0,
                  "y": 0
              },
              "group": "edges",
              "removed": false,
              "selected": false,
              "selectable": true,
              "locked": false,
              "grabbable": true,
              "pannable": true,
              "classes": ""
          },
          {
              "data": {
                  "id": "e36",
                  "source": "f2",
                  "target": "n10",
                  "weight": 13,
                  "label": "e36(13)"
              },
              "position": {
                  "x": 0,
                  "y": 0
              },
              "group": "edges",
              "removed": false,
              "selected": false,
              "selectable": true,
              "locked": false,
              "grabbable": true,
              "pannable": true,
              "classes": ""
          },
          {
              "data": {
                  "id": "e37",
                  "source": "n11",
                  "target": "n10",
                  "weight": 69,
                  "label": "e37(69)"
              },
              "position": {
                  "x": 0,
                  "y": 0
              },
              "group": "edges",
              "removed": false,
              "selected": false,
              "selectable": true,
              "locked": false,
              "grabbable": true,
              "pannable": true,
              "classes": ""
          },
          {
              "data": {
                  "id": "e38",
                  "source": "n12",
                  "target": "n13",
                  "weight": 94,
                  "label": "e38(94)"
              },
              "position": {
                  "x": 0,
                  "y": 0
              },
              "group": "edges",
              "removed": false,
              "selected": false,
              "selectable": true,
              "locked": false,
              "grabbable": true,
              "pannable": true,
              "classes": ""
          },
          {
              "data": {
                  "id": "e39",
                  "source": "n12",
                  "target": "n14",
                  "weight": 10,
                  "label": "e39(10)"
              },
              "position": {
                  "x": 0,
                  "y": 0
              },
              "group": "edges",
              "removed": false,
              "selected": false,
              "selectable": true,
              "locked": false,
              "grabbable": true,
              "pannable": true,
              "classes": ""
          },
          {
              "data": {
                  "id": "e6",
                  "source": "v1",
                  "target": "n4",
                  "weight": 99,
                  "label": "e6(99)"
              },
              "position": {
                  "x": 0,
                  "y": 0
              },
              "group": "edges",
              "removed": false,
              "selected": false,
              "selectable": true,
              "locked": false,
              "grabbable": true,
              "pannable": true,
              "classes": ""
          },
          {
              "data": {
                  "id": "e8",
                  "source": "v1",
                  "target": "n5",
                  "weight": 48,
                  "label": "e8(48)"
              },
              "position": {
                  "x": 0,
                  "y": 0
              },
              "group": "edges",
              "removed": false,
              "selected": false,
              "selectable": true,
              "locked": false,
              "grabbable": true,
              "pannable": true,
              "classes": ""
          },
          {
              "data": {
                  "id": "e9",
                  "source": "v1",
                  "target": "n6",
                  "weight": 32,
                  "label": "e9(32)"
              },
              "position": {
                  "x": 0,
                  "y": 0
              },
              "group": "edges",
              "removed": false,
              "selected": false,
              "selectable": true,
              "locked": false,
              "grabbable": true,
              "pannable": true,
              "classes": ""
          },
          {
              "data": {
                  "id": "e10",
                  "source": "v1",
                  "target": "n7",
                  "weight": 54,
                  "label": "e10(54)"
              },
              "position": {
                  "x": 0,
                  "y": 0
              },
              "group": "edges",
              "removed": false,
              "selected": false,
              "selectable": true,
              "locked": false,
              "grabbable": true,
              "pannable": true,
              "classes": ""
          },
          {
              "data": {
                  "id": "ne0",
                  "source": "n2",
                  "target": "v1",
                  "weight": 88,
                  "label": "ne0(88)"
              },
              "position": {
                  "x": 0,
                  "y": 0
              },
              "group": "edges",
              "removed": false,
              "selected": false,
              "selectable": true,
              "locked": false,
              "grabbable": true,
              "pannable": true,
              "classes": ""
          },
          {
              "data": {
                  "id": "ne1",
                  "source": "n2",
                  "target": "v1",
                  "weight": 67,
                  "label": "ne1(67)"
              },
              "position": {
                  "x": 0,
                  "y": 0
              },
              "group": "edges",
              "removed": false,
              "selected": false,
              "selectable": true,
              "locked": false,
              "grabbable": true,
              "pannable": true,
              "classes": ""
          },
          {
              "data": {
                  "id": "ne2",
                  "source": "n2",
                  "target": "v1",
                  "weight": 55,
                  "label": "ne2(55)"
              },
              "position": {
                  "x": 0,
                  "y": 0
              },
              "group": "edges",
              "removed": false,
              "selected": false,
              "selectable": true,
              "locked": false,
              "grabbable": true,
              "pannable": true,
              "classes": ""
          },
          {
              "data": {
                  "id": "ne3",
                  "source": "n2",
                  "target": "v1",
                  "weight": 66,
                  "label": "ne3(66)"
              },
              "position": {
                  "x": 0,
                  "y": 0
              },
              "group": "edges",
              "removed": false,
              "selected": false,
              "selectable": true,
              "locked": false,
              "grabbable": true,
              "pannable": true,
              "classes": ""
          },
          {
              "data": {
                  "id": "e12",
                  "source": "n6",
                  "target": "n8",
                  "weight": 24,
                  "label": "e12(24)"
              },
              "position": {
                  "x": 0,
                  "y": 0
              },
              "group": "edges",
              "removed": false,
              "selected": false,
              "selectable": true,
              "locked": false,
              "grabbable": true,
              "pannable": true,
              "classes": ""
          },
          {
              "data": {
                  "id": "e4",
                  "source": "n3",
                  "target": "v1",
                  "weight": 14,
                  "label": "e4(14)"
              },
              "position": {
                  "x": 0,
                  "y": 0
              },
              "group": "edges",
              "removed": false,
              "selected": false,
              "selectable": true,
              "locked": false,
              "grabbable": true,
              "pannable": true,
              "classes": ""
          },
          {
              "data": {
                  "id": "e5",
                  "source": "n2",
                  "target": "v1",
                  "weight": 13,
                  "label": "e5(13)"
              },
              "position": {
                  "x": 0,
                  "y": 0
              },
              "group": "edges",
              "removed": false,
              "selected": false,
              "selectable": true,
              "locked": false,
              "grabbable": true,
              "pannable": true,
              "classes": ""
          },
          {
              "data": {
                  "id": "ne9",
                  "source": "n4",
                  "target": "r3",
                  "weight": 39
              },
              "position": {
                  "x": 0,
                  "y": 0
              },
              "group": "edges",
              "removed": false,
              "selected": false,
              "selectable": true,
              "locked": false,
              "grabbable": true,
              "pannable": true,
              "classes": ""
          }
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
            return document.getElementById("cbk-flag-display-node-labels").checked ? 
            (node.data('label') ? 
              (node.data('label').length > 5 ? node.data('label').substring(0, 5) + '...' : node.data('label')) : 
              (node.id().length > 5 ? node.id().substring(0, 5) + '...' : node.id())) : 
            '';
            // return document.getElementById("cbk-flag-display-node-labels").checked? node.data('label') ? node.data('label') : node.id():"";
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

            return edge.data('weight');
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
    setLabelPosition('bottom');
    
  
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
              'label' : focusID
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
                  'label' : node.ID
            }});

      }else{
        savedNodes.push({
          group: 'nodes',
          data: { id: node.ID, 
                  parent: node.owner.parent.ID,
                  'label' : node.ID
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
                'label' : node.ID
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
              'label' : edge.source.ID
            }});
            
        }else if(cyLayout.getElementById(edge.target.ID).length == 0){

          cyLayout.add({
            group: 'nodes',
            data: { id: edge.target.ID, 
              'label' : edge.target.ID
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
                'label' : newNode.data().id
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
        'label' : focusNode.data().id
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
        'label' : newNode.data().id
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
                    'label' : newNode.data().id
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
                'label' : newFNode.data().id
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
            
            instance.expandNodes(cy.nodes(':selected'), true, runLayout = document.getElementById("cbk-run-layout3").checked, pngImage,setLabelPosition);
            
            setTimeout(() => {
              pngBeforeFinalGraph = cy.png({
                scale:2,
                full:true
              }); ;
              if (document.getElementById("cbk-run-layout3").checked) {
                cy.layout(layoutOptions).run();
              }
              else {
                initializer(cy);
              }
            }, document.getElementById("cbk-run-layout3").checked?700:0);
            
        }else{
          instance.expandNodes(cy.nodes(':selected'), true, runLayout = document.getElementById("cbk-run-layout3").checked, pngImage,setLabelPosition);
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
            instance.expandNodes(cy.nodes(':selected'), false, document.getElementById("cbk-run-layout3").checked, pngImage, setLabelPosition);
            
            setTimeout(() => {
              pngBeforeFinalGraph = cy.png({
                scale:2,
                full:true
              }); 
              if (document.getElementById("cbk-run-layout3").checked) {
                cy.layout(layoutOptions).run();
              }
              else {
                initializer(cy);
              }
            }, document.getElementById("cbk-run-layout3").checked?700:0);
          
        }else{
          instance.expandNodes(cy.nodes(':selected'),false,document.getElementById("cbk-run-layout3").checked, pngImage,setLabelPosition);
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

