import { complexityManagement } from "./complexity-management";

export default function register(cytoscape) {	// register with cytoscape.js
  cytoscape("core", "complexityManagement", function(opts) {
    let cy = this;

    let options = {
      filterRule: (ele) => {
        return false;
      }
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
    }

    // Expose the API to the users
    return getScratch(cy, 'api');
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