import { complexityManagement } from "./complexity-management";
import { cueUtilities } from "./cue-utilities";

export default function register(cytoscape) {	// register with cytoscape.js
  cytoscape("core", "complexityManagement", function(opts) {
    let cy = this;

    let options = {
      layoutBy: null,
      filterRule: (ele) => {
        return false;
      },
      cueEnabled: true, // Whether cues are enabled
      expandCollapseCuePosition: 'top-left', // default cue position is top left you can specify a function per node too
      expandCollapseCueSize: 12, // size of expand-collapse cue
      expandCollapseCueLineSize: 8, // size of lines used for drawing plus-minus icons
      expandCueImage: undefined, // image of expand icon if undefined draw regular expand cue
      collapseCueImage: undefined, // image of collapse icon if undefined draw regular collapse cue
      expandCollapseCueSensitivity: 1,
      zIndex: 999
    };

    // If opts is not 'get' that is it is a real options object then initilize the extension
    if (opts !== 'get') {
      options = extendOptions(options, opts);

      let api = complexityManagement(cy);

      // Keeps the temporarily removed elements (because of the complexity management operations)
      let tempRemovedEles = new Map();

      setScratch(cy, 'options', options);
      setScratch(cy, 'api', api);
      setScratch(cy, 'removedEles', tempRemovedEles);

      cueUtilities(options, cy, api);
    }

    // Expose the API to the users
    return getScratch(cy, 'api');
  });
  
  const cyLayout = window.cyLayout =  cytoscape({
    style: [
      {
        selector: 'node',
        style: {
          'label': (node) => {
            return node.data('label');
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
      }],
    headless:true,
    styleEnabled:true
  });
  const cyVisible = window.cyVisible = cytoscape({
    headless:true,
    styleEnabled:true,
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
  // Get the whole scratchpad reserved for this extension (on an element or core) or get a single property of it
  function getScratch(cyOrEle, name) {
    if (cyOrEle.scratch('cyComplexityManagement') === undefined) {
      cyOrEle.scratch('cyComplexityManagement', {});
    }

    var scratch = cyOrEle.scratch('cyComplexityManagement');
    var retVal = (name === undefined) ? scratch : scratch[name];
    return retVal;
  }

  // Set a single property on scratchpad of an element or the core
  function setScratch(cyOrEle, name, val) {
    getScratch(cyOrEle)[name] = val;
  }

  function extendOptions(options, extendBy) {
    var tempOpts = {};
    for (var key in options)
      tempOpts[key] = options[key];

    for (var key in extendBy)
      if (tempOpts.hasOwnProperty(key))
        tempOpts[key] = extendBy[key];
    return tempOpts;
  }
}

if (typeof window.cytoscape !== 'undefined') {	// expose to global cytoscape (i.e. window.cytoscape)
  register(window.cytoscape);
}