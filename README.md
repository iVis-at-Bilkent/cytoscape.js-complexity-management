# cytoscape.js-complexity-management

A Cytoscape.js extension for a set of complexity management operations for compound graphs.

## Description

Based on [Complexity Management Graph Model (CMGM)](https://github.com/iVis-at-Bilkent/cmgm), this extension provides a unified set of complexity management operations working seamlessly. It also provides automatic adjustment of the graph layout after each complexity management operation to protect the user's mental map. The supported operations include filter/unfilter, hide/show and collapse/expand nodes/edges.  

## Demo

Click [here](https://ivis-at-bilkent.github.io/cytoscape.js-complexity-management/demo/demo.html) for a demo.

## API
`var instance = cy.complexityManagement(options)`
To initialize the extension with given options.

`instance.updateFilterRule(newFilterRuleFunc)`
Update filter rule with the given filter rule function.

`instance.getHiddenNeighbors(nodes)`
Get hidden neighbor elements of the given nodes.

`instance.hide(eles)`
Hide given elements.

`instance.show(eles)`
Show given elements.

`instance.showAll()`
Show all hidden elements.

`instance.collapseNodes(nodes, isRecursive = false)`
Collapse given nodes, recursively if isRecursive option is true.

`instance.expandNodes(nodes, isRecursive = false)`
Expand given nodes, recursively if isRecursive option is true.

`instance.collapseAllNodes()`
Collapse all nodes in the graph recursively.

`instance.expandAllNodes()`
Expand all nodes in the graph recursively.

`instance.collapseEdges(edges)`
Collapse the given edges if all of them are between same two nodes and number of edges passed is at least 2. Do nothing otherwise.

`instance.expandEdges(edges, isRecursive = false)`
Expand given edges, recursively if isRecursive option is true.

`instance.collapseEdgesBetweenNodes(nodes)`
Collapse all edges between the given nodes.

`instance.expandEdgesBetweenNodes(nodes, isRecursive = false)`
Expand all edges between the given nodes, recursively if isRecursive option is true.

`instance.collapseAllEdges()`
Collapse all possible edges in the graph.

`instance.expandAllEdges()`
Expand all possible edges in the graph.

`instance.isCollapsible(node)`
Get whether the given node is collapsible.

`instance.isExpandable(node)`
Get whether the given node is expandible.

## Default Options
```javascript
    var options = {
      filterRule: (ele) => {
        return false;
      }, // function to specify the filtering rules desired
      cueEnabled: true, // Whether cues are enabled
      expandCollapseCuePosition: 'top-left', // default cue position is top left you can specify a function per node too
      expandCollapseCueSize: 12, // size of expand-collapse cue
      expandCollapseCueLineSize: 8, // size of lines used for drawing plus-minus icons
      expandCueImage: undefined, // image of expand icon if undefined draw regular expand cue
      collapseCueImage: undefined, // image of collapse icon if undefined draw regular collapse cue
      expandCollapseCueSensitivity: 1, // sensitivity of expand-collapse cues
      zIndex: 999 // z-index value of the canvas in which cue images are drawn
    };
```

## Dependencies
 * Cytoscape.js ^3.2.0
 * cytoscape-fcose.js ^2.0.0
 * cmgm.js (unified complexity management model) ^1.0.0
   
## Usage instructions

Download the library:
 * via npm: `npm install cytoscape-complexity-management`,
 * via bower: `bower install cytoscape-complexity-management`, or
 * via direct download in the repository (probably from a tag).

Import the library as appropriate for your project:

ES import:

```js
import cytoscape from 'cytoscape';
import complexityManagement from 'cytoscape-complexity-management';

cytoscape.use( complexityManagement ); // register extension
```

CommonJS:
```js
var cytoscape = require('cytoscape');
var complexityManagement = require('cytoscape-complexity-management');

complexityManagement( cytoscape ); // register extension
```

AMD:
```js
require(['cytoscape', 'cytoscape-complexity-management'], function( cytoscape, complexityManagement ){
  complexityManagement( cytoscape ); // register extension
});
```

Plain HTML/JS has the extension registered for you automatically, because no `require()` is needed.

## Publishing instructions

This project is set up to automatically be published to npm and bower.  To publish:

1. Build the extension : `npm run build`
1. Commit the build : `git commit -am "Build for release"`
1. Bump the version number and tag: `npm version major|minor|patch`
1. Push to origin: `git push && git push --tags`
1. Publish to npm: `npm publish .`
1. If publishing to bower for the first time, you'll need to run `bower register cytoscape-complexity-management https://github.com/iVis-at-Bilkent/cytoscape.js-complexity-management.git`
1. [Make a new release](https://github.com/iVis-at-Bilkent/cytoscape.js-complexity-management/releases/new) for Zenodo.

## Team

  * [Osama Zafar](https://github.com/osamazafar980), [Hasan Balcı](https://github.com/hasanbalci) and [Ugur Dogrusoz](https://github.com/ugurdogrusoz) of [i-Vis at Bilkent University](http://www.cs.bilkent.edu.tr/~ivis)
