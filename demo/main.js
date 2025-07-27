
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
    "edges": [
                {
                    "data": {
                        "id": "e36",
                        "source": "f2",
                        "target": "n10",
                        "weight": 94,
                        "label": "e36(94)"
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
                        "weight": 71,
                        "label": "e35(71)"
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
                        "weight": 90,
                        "label": "e33(90)"
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
                        "weight": 63,
                        "label": "e31(63)"
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
                        "weight": 59,
                        "label": "e30(59)"
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
                        "weight": 23,
                        "label": "e29(23)"
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
                        "weight": 5,
                        "label": "e27(5)"
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
                        "weight": 62,
                        "label": "e26(62)"
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
                        "weight": 92,
                        "label": "e25(92)"
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
                        "weight": 75,
                        "label": "e23(75)"
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
                        "weight": 25,
                        "label": "e38(25)"
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
                        "weight": 49,
                        "label": "e37(49)"
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
                        "weight": 21,
                        "label": "e40(21)"
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
                        "weight": 100,
                        "label": "e39(100)"
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
                        "weight": 85,
                        "label": "e41(85)"
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
                        "weight": 57,
                        "label": "e42(57)"
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
                        "id": "e43",
                        "source": "r3",
                        "target": "h4r",
                        "weight": 52,
                        "label": "e43(52)"
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
                        "weight": 17,
                        "label": "e45(17)"
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
                        "weight": 4,
                        "label": "e44(4)"
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
                        "weight": 89,
                        "label": "e13(89)"
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
                        "weight": 73,
                        "label": "e14(73)"
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
                        "weight": 28,
                        "label": "e15(28)"
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
                        "weight": 17,
                        "label": "e16(17)"
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
                        "weight": 47,
                        "label": "e17(47)"
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
                        "weight": 69,
                        "label": "e18(69)"
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
                        "weight": 53,
                        "label": "e19(53)"
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
                        "weight": 20,
                        "label": "e20(20)"
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
                        "weight": 33,
                        "label": "e21(33)"
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
                        "weight": 50,
                        "label": "e22(50)"
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
            ],
            "nodes": [
                {
                    "data": {
                        "id": "n9",
                        "weight": 25,
                        "label": "n9(25)"
                    },
                    "position": {
                        "x": 425.6139319821181,
                        "y": -12.52066778359962
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
                        "weight": 58,
                        "label": "n10(58)"
                    },
                    "position": {
                        "x": 155.70135758276473,
                        "y": 114.339006583964
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
                        "weight": 84,
                        "label": "n11(84)"
                    },
                    "position": {
                        "x": 262.37369477856623,
                        "y": 98.29841326292042
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
                        "weight": 41,
                        "label": "n12(41)"
                    },
                    "position": {
                        "x": 129.42872922817196,
                        "y": -111.36322176158609
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
                        "weight": 9,
                        "label": "n13(9)"
                    },
                    "position": {
                        "x": 231.9496747640108,
                        "y": -110.07233690514457
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
                        "weight": 66,
                        "label": "n14(66)"
                    },
                    "position": {
                        "x": 184.21405471770504,
                        "y": -14.072096482898118
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
                        "weight": 27,
                        "label": "n15(27)"
                    },
                    "position": {
                        "x": -322.55554180935275,
                        "y": -302.5761176840286
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
                        "weight": 27,
                        "label": "n16(27)"
                    },
                    "position": {
                        "x": -215.85532705589526,
                        "y": -286.65898462062233
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
                        "weight": 24,
                        "label": "n17(24)"
                    },
                    "position": {
                        "x": -386.8530123045272,
                        "y": -206.5529942738839
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
                        "weight": 0,
                        "label": "n18(0)"
                    },
                    "position": {
                        "x": -459.8843239689812,
                        "y": -101.66951247852937
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
                        "weight": 75,
                        "label": "n19(75)"
                    },
                    "position": {
                        "x": -354.12310327531463,
                        "y": -103.27819619423016
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
                        "weight": 63,
                        "label": "n20(63)"
                    },
                    "position": {
                        "x": -179.2682407983245,
                        "y": 376.7983702816269
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
                        "weight": 48,
                        "label": "n21(48)"
                    },
                    "position": {
                        "x": -79.6166653266363,
                        "y": 367.77217669164537
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
                        "weight": 47,
                        "label": "n22(47)"
                    },
                    "position": {
                        "x": -60.7657814666902,
                        "y": -63.77511259619564
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
                        "weight": 6,
                        "label": "n23(6)"
                    },
                    "position": {
                        "x": -435.6039231650455,
                        "y": 155.68433675903992
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
                        "weight": 11,
                        "label": "n25(11)"
                    },
                    "position": {
                        "x": -385.9242634118476,
                        "y": 138.0548088617641
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
                        "weight": 9,
                        "label": "n26(9)"
                    },
                    "position": {
                        "x": -129.4424530624804,
                        "y": 362.03527348663613
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
                        "weight": 49,
                        "label": "n27(49)"
                    },
                    "position": {
                        "x": -60.7657814666902,
                        "y": -74.02511259619564
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
                        "weight": 41,
                        "label": "n28(41)"
                    },
                    "position": {
                        "x": 195.6512120033691,
                        "y": 35.882236739452736
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
                        "weight": 96,
                        "label": "n29(96)"
                    },
                    "position": {
                        "x": 100.55395665593801,
                        "y": 30.5475899094411
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
                        "weight": 69,
                        "label": "n30(69)"
                    },
                    "position": {
                        "x": 44.55272699012086,
                        "y": 98.7175742600204
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
                        "weight": 7,
                        "label": "f1(7)"
                    },
                    "position": {
                        "x": -70.28609259205383,
                        "y": 103.73792331990356
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
                        "weight": 92,
                        "label": "f2(92)"
                    },
                    "position": {
                        "x": 235.61498933681736,
                        "y": 203.62769524049156
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
                        "weight": 22,
                        "label": "h1(22)"
                    },
                    "position": {
                        "x": -207.5335795900148,
                        "y": -385.4280735550449
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
                        "weight": 82,
                        "label": "h2(82)"
                    },
                    "position": {
                        "x": -288.92338280933905,
                        "y": -200.11415937887097
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
                        "weight": 56,
                        "label": "h3(56)"
                    },
                    "position": {
                        "x": -400.5670617896641,
                        "y": -1.3466611100251527
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
                        "weight": 29,
                        "label": "v2(29)"
                    },
                    "position": {
                        "x": -335.7446036586498,
                        "y": 140.92528096448825
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
                        "weight": 5,
                        "label": "v3(5)"
                    },
                    "position": {
                        "x": -506.74135210993404,
                        "y": -2.7458966834183727
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
                        "weight": 76,
                        "label": "v4(76)"
                    },
                    "position": {
                        "x": -372.3368826193146,
                        "y": 531.9173678469429
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
                        "weight": 72,
                        "label": "h4r(72)"
                    },
                    "position": {
                        "x": 515.741352109934,
                        "y": -95.70863277988236
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
                        "weight": 80,
                        "label": "r1(80)"
                    },
                    "position": {
                        "x": 1.3900076252920641,
                        "y": 219.9584015804683
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
                        "weight": 59,
                        "label": "r2(59)"
                    },
                    "position": {
                        "x": -73.08587381870004,
                        "y": 190.6442314507709
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
                        "weight": 62,
                        "label": "r3(62)"
                    },
                    "position": {
                        "x": 413.76485974846304,
                        "y": -117.00341904410323
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

