import { complexityManagement } from "./complexity-management";

export default function register(cytoscape) {	// register with cytoscape.js
	cytoscape("core", "complexityManagement", function(opts) {
		let cy = this;
		return complexityManagement(cy);
	});
}

if (typeof window.cytoscape !== 'undefined') {	// expose to global cytoscape (i.e. window.cytoscape)
	register(window.cytoscape);
}