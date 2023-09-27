(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory();
	else if(typeof define === 'function' && define.amd)
		define([], factory);
	else if(typeof exports === 'object')
		exports["cytoscapeLayvo"] = factory();
	else
		root["cytoscapeLayvo"] = factory();
})(this, function() {
return /******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// identity function for calling harmony imports with the correct context
/******/ 	__webpack_require__.i = function(value) { return value; };
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, {
/******/ 				configurable: false,
/******/ 				enumerable: true,
/******/ 				get: getter
/******/ 			});
/******/ 		}
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 1);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports) {

module.exports = function () {
	let cy = this;
	return {
		generalProperties: () => {
			return generalProperties(cy);
		},
		differenceMetrics: differenceMetrics
	};
};

let generalProperties = function (cy) {
	let totalEdgeLength = getTotalEdgeLength(cy);
	return {
		numberOfEdgeCrosses: findNumberOfCrosses(cy),
		numberOfNodeOverlaps: findNumberOfOverlappingNodes(cy),
		totalArea: getTotalArea(cy),
		totalEdgeLength: totalEdgeLength,
		averageEdgeLength: totalEdgeLength / cy.edges().length
	};
};

let findNumberOfCrosses = function (cy) {
	let doesIntersect = function (a, b, c, d, p, q, r, s) {
		var det, gamma, lambda;
		det = (c - a) * (s - q) - (r - p) * (d - b);
		if (det === 0) {
			return false;
		} else {
			lambda = ((s - q) * (r - a) + (p - r) * (s - b)) / det;
			gamma = ((b - d) * (r - a) + (c - a) * (s - b)) / det;
			return 0.01 < lambda && lambda < 0.99 && 0.1 < gamma && gamma < 0.99;
		}
	};

	let crosses = 0;
	let edgeArray = cy.edges().toArray();

	for (let i = 0; i < edgeArray.length; i++) {
		var p = edgeArray[i].sourceEndpoint(),
		    q = edgeArray[i].targetEndpoint();
		for (var j = i + 1; j < edgeArray.length; j++) {
			var r = edgeArray[j].sourceEndpoint(),
			    s = edgeArray[j].targetEndpoint();
			if (doesIntersect(p.x, p.y, q.x, q.y, r.x, r.y, s.x, s.y)) {
				crosses++;
			}
		}
	}
	return crosses;
};

let findNumberOfOverlappingNodes = function (cy) {
	let doesOverlap = function (node, otherNode) {
		let bb = node.boundingBox(),
		    bbOther = otherNode.boundingBox();
		return !(bbOther.x1 > bb.x2 || bbOther.x2 < bb.x1 || bbOther.y1 > bb.y2 || bbOther.y2 < bb.y1);
	};

	let overlaps = 0;
	let nodeArray = cy.nodes().toArray();

	for (let i = 0; i < nodeArray.length; i++) {
		let node = nodeArray[i];
		for (let j = i + 1; j < nodeArray.length; j++) {
			let otherNode = nodeArray[j];
			if (doesOverlap(node, otherNode)) {
				overlaps++;
			}
		}
	}
	return overlaps;
};

let getTotalArea = function (cy) {
	let bb = cy.elements().boundingBox();
	return bb.w * bb.h;
};

let getTotalEdgeLength = function (cy) {
	let getDistance = function (p, q) {
		let dx = q.x - p.x,
		    dy = q.y - p.y;
		return Math.sqrt(dx * dx + dy * dy);
	};

	let totalLength = 0;
	let edgeArray = cy.edges().toArray();

	for (let edge of edgeArray) {
		let p = edge.sourceEndpoint(),
		    q = edge.targetEndpoint();
		totalLength += getDistance(p, q);
	}
	return totalLength;
};

let differenceMetrics = function (cy, otherCy) {
	// align
	cy.fit(50);otherCy.fit(50);

	if (cy.zoom() > otherCy.zoom()) {
		cy.zoom(otherCy.zoom());cy.pan(otherCy.pan());
	} else {
		otherCy.zoom(cy.zoom());otherCy.pan(cy.pan());
	}
	let similarityMetric = {
		averageDistanceBetweenGraphs: calculateProximity(cy, otherCy),
		orthogonalOrdering: calculateOrthogonalOrdering(cy, otherCy)
	};

	console.log(similarityMetric);

	return similarityMetric;
};

let calculateAverageDistanceBetweenGraphs = function (cy, otherCy) {
	let getDistance = function (p, q) {
		let dx = q.x - p.x,
		    dy = q.y - p.y;
		return Math.sqrt(dx * dx + dy * dy);
	};

	let totalDistance = 0,
	    numberOfNodes = 0;

	cy.nodes().forEach(function (ele) {
		let otherEle = otherCy.getElementById(ele.id());
		if (otherEle.length) {
			numberOfNodes++;
			totalDistance += getDistance(ele.renderedPosition(), otherEle.renderedPosition());
		}
	});
	console.log(totalDistance)
	return numberOfNodes ? totalDistance / numberOfNodes : 0;
};

let calculateNeighborhoodDistanceBetweenGraphs = function (cy, otherCy) {

	let getDistance = function (p, q) {
		let dx = q.x - p.x,
		    dy = q.y - p.y;
		return Math.sqrt(dx * dx + dy * dy);
	};

	let totalDistance = 0,
	    numberOfEdges = 0;

	function calculateDeltaDistance(edge) {
		const sourceNode = edge.source();
		const targetNode = edge.target();

		const otherEdge = otherCy.getElementById(edge.id());

		const otherSourceNode = otherEdge.source();
		const otherTargetNode = otherEdge.target();

		const graphDistance = getDistance(sourceNode.renderedPosition(), targetNode.renderedPosition());

		const otherGraphDistance = getDistance(otherSourceNode.renderedPosition(), otherTargetNode.renderedPosition());

		const deltaDistance = Math.abs(graphDistance - otherGraphDistance);

		const idealEdgeLength = 50;

		const score = 1 - deltaDistance / idealEdgeLength;

		return score;
	}

	// Iterate over each edge in the cy graph
	cy.edges().forEach(edge => {
		const score = calculateDeltaDistance(edge);
		totalDistance += score;
		numberOfEdges++;
	});

	return numberOfEdges ? totalDistance / numberOfEdges : 0;
};

let calculateProximity = function (cy, otherCy) {

	let absoluteProximityScore = calculateAverageDistanceBetweenGraphs(cy, otherCy);
	let neighborhoodProximityScore = calculateNeighborhoodDistanceBetweenGraphs(cy, otherCy);

	console.log({
		absoluteProximityScore: absoluteProximityScore,
		neighborhoodProximityScore: neighborhoodProximityScore
	});

	return (absoluteProximityScore + neighborhoodProximityScore) / 2;
};

let calculateOrthogonalOrdering = function (cy, otherCy) {

	let totalAngle = 0,
	    numberOfEdges = 0;

	cy.edges().forEach(function (ele) {
		let otherEle = otherCy.getElementById(ele.id());
		if (otherEle.length) {

			numberOfEdges++;

			const eleAngleRadians = Math.atan2(ele.target().position().y - ele.source().position().y, ele.target().position().x - ele.source().position().x);
			const eleAngleDegrees = eleAngleRadians * (180 / Math.PI);

			const otherEleAngleRadians = Math.atan2(otherEle.target().position().y - otherEle.source().position().y, otherEle.target().position().x - otherEle.source().position().x);
			const otherEleAngleDegrees = otherEleAngleRadians * (180 / Math.PI);

			const absoluteDifference = Math.abs(eleAngleDegrees - otherEleAngleDegrees);
			const orthogonalOrder = 1 - absoluteDifference / 180;

			totalAngle += orthogonalOrder;
		}
	});

	return numberOfEdges ? totalAngle / numberOfEdges : 0;
};

// let differenceMetrics = function(cy, otherCy) {
// 	// align
// 	cy.fit(50); otherCy.fit(50);                                                                                                                                                                             

// 	if (cy.zoom() > otherCy.zoom()){
// 		cy.zoom(otherCy.zoom()); cy.pan(otherCy.pan());
// 	} else {
// 		otherCy.zoom(cy.zoom()); otherCy.pan(cy.pan());
// 	}

// 	return {
// 		averageDistanceBetweenGraphs: getAverageDistanceBetweenGraphs(cy, otherCy),
// 			orthogonalOrdering: orthogonalOrdering(cy, otherCy),
// 	};
// };

// let getAverageDistanceBetweenGraphs = function(cy, otherCy) {
// 	let getDistance = function(p, q) {
// 		let dx = q.x - p.x, dy = q.y - p.y;
// 		return Math.sqrt(dx * dx + dy * dy);
// 	};

// 	let totalDistance = 0, numberOfNodes = 0;

// 	cy.nodes().forEach(function(ele) {
// 		let otherEle = otherCy.getElementById(ele.id());
// 		if (otherEle.length) {
// 			numberOfNodes++;
// 			totalDistance += getDistance(ele.renderedPosition(), otherEle.renderedPosition());
// 		}
// 	});
// 	return numberOfNodes ? totalDistance / numberOfNodes : 0;
// };

// let orthogonalOrdering = function(cy, otherCy) {
// 	let calcEdgeAngle = function(edge) {
// 		let dx = edge.targetEndpoint().x - edge.sourceEndpoint().x;
// 		let dy = edge.targetEndpoint().y - edge.sourceEndpoint().y;
// 		let angle = Math.atan2(dx, dy);
// 		return angle < 0 ? angle + 2 * Math.PI : angle;
// 	};

// 	let getWeight = function(theta, lowerBound, upperBound) {
// 		if ((theta % Math.PI) > Math.PI / 4) {
// 			let slope = -4 / Math.PI, height = 2, width = Math.PI / 2; 
// 			let x = Math.floor(upperBound / width) - Math.floor(lowerBound / width);
// 			let area = 0;
// 			let lowerBoundY = 2 + (lowerBound % width) * slope, upperBoundY = 2 + (upperBound % width) * slope;

// 			if (x > 0) {
// 				area = width * (x - 1);
// 				area += (width - (lowerBound % width)) * lowerBoundY / 2;
// 				area += (height + upperBoundY) / 2 * (upperBound % width); 
// 			} else {
// 				area += (lowerBoundY + upperBoundY) / 2 * ((upperBound - lowerBound) % width);
// 			}
// 			return area;
// 		} else {
// 			let slope = 4 / Math.PI, height = 2, width = Math.PI / 2;
// 			let x = Math.floor(upperBound / width) - Math.floor(lowerBound / width);
// 			let area = width * Math.floor((upperBound - lowerBound) / width);
// 			let lowerBoundY = (lowerBound % width) * slope, upperBoundY = (upperBound % width) * slope;

// 			if (x > 0) {
// 				area = width * (x - 1);
// 				area += (width - (lowerBound % width)) * (height + lowerBoundY) / 2;
// 				area += upperBoundY * (upperBound % width) / 2 ; 
// 			} else {
// 				area += (lowerBoundY + upperBoundY) / 2 * ((upperBound - lowerBound) % width);
// 			}
// 			return area;
// 		}
// 	};

// 	let getOrder = function(edge, otherEdge) {
// 		let totalWeight = 0, angle = calcEdgeAngle(edge), otherAngle = calcEdgeAngle(otherEdge);

// 		if (angle > otherAngle) {
// 			[angle, otherAngle] = [otherAngle, angle];
// 		}
// 		let upperBound = 0;
// 		while (upperBound != otherAngle) {
// 			upperBound = Math.PI / 4 * (Math.floor(angle / (Math.PI / 4)) + 1);

// 			if (upperBound > otherAngle) {
// 				upperBound = otherAngle;
// 			}

// 			if (angle % Math.PI / 2 > Math.PI / 4) {
// 				totalWeight += getWeight(5, angle, upperBound);
// 			} else {
// 				totalWeight += getWeight(0, angle, upperBound);
// 			}

// 			angle = upperBound;

// 		}
// 		return totalWeight;
// 	};

// 	let totalAngle = 0, numberOfEdges = 0;

// 	cy.edges().forEach(function(ele) {
// 		let otherEle = otherCy.getElementById(ele.id());
// 		if (otherEle.length) {
// 			numberOfEdges++;
// 			totalAngle += Math.min(getOrder(ele, otherEle), getOrder(otherEle, ele));
// 		}
// 	});
// 	console.log(totalAngle);
// 	return numberOfEdges ? totalAngle / numberOfEdges : 0;
// };

/***/ }),
/* 1 */
/***/ (function(module, exports, __webpack_require__) {

const impl = __webpack_require__(0);

// registers the extension on a cytoscape lib ref
let register = function (cytoscape) {
  if (!cytoscape) {
    return;
  } // can't register if cytoscape unspecified

  cytoscape('core', 'layvo', impl); // register with cytoscape.js
};

if (typeof cytoscape !== 'undefined') {
  // expose to global cytoscape (i.e. window.cytoscape)
  register(cytoscape);
}

module.exports = register;

/***/ })
/******/ ]);
});