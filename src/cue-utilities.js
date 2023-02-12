import debounce from './debounce';
import debounce2 from './debounce2';

export function cueUtilities(params, cy, api) {

  let fn = params;
  const CUE_POS_UPDATE_DELAY = 100;
  let nodeWithRenderedCue;

  const getData = function () {
    let scratch = cy.scratch('_cyExpandCollapse');
    return scratch && scratch.cueUtilities;
  };

  const setData = function (data) {
    let scratch = cy.scratch('_cyExpandCollapse');
    if (scratch == null) {
      scratch = {};
    }

    scratch.cueUtilities = data;
    cy.scratch('_cyExpandCollapse', scratch);
  };

  let functions = {
    init: function () {
      let canvas = document.createElement('canvas');
      canvas.classList.add("expand-collapse-canvas");
      let container = document.getElementById('cy');
      let ctx = canvas.getContext('2d');
      container.appendChild(canvas);

      let offset = function (elt) {
        let rect = elt.getBoundingClientRect();

        return {
          top: rect.top + document.documentElement.scrollTop,
          left: rect.left + document.documentElement.scrollLeft
        }
      }
      function resize() {
				const width = container.offsetWidth;
				const height = container.offsetHeight;

				const canvasWidth = width * options.pixelRatio;
				const canvasHeight = height * options.pixelRatio;

				canvas.width = canvasWidth;
				canvas.height = canvasHeight;

				canvas.style.width = `${width}px`;
				canvas.style.height = `${height}px`;

				cy.trigger("cyCanvas.resize");
			}

			cy.on("resize", () => {
				resize();
			});
      
			canvas.setAttribute(
				"style",
				`position:absolute; top:0; left:0; z-index:${options().zIndex};`,
			);

      let _sizeCanvas = debounce(function () {
        canvas.height = cy.container().offsetHeight;
        canvas.width = cy.container().offsetWidth;
        canvas.style.position = 'absolute';
        canvas.style.top = 0;
        canvas.style.left = 0;
        canvas.style.zIndex = options().zIndex;

        setTimeout(function () {
          let canvasBb = offset(canvas);
          let containerBb = offset(container);
          canvas.style.top = -(canvasBb.top - containerBb.top);
          canvas.style.left = -(canvasBb.left - containerBb.left);

          // refresh the cues on canvas resize
          if (cy) {
            clearDraws(true);
          }
        }, 0);

      }, 250);

      function sizeCanvas() {
        _sizeCanvas();
      }

      resize();
      
      let data = {};

      // if there are events field in data unbind them here
      // to prevent binding the same event multiple times
      // if (!data.hasEventFields) {
      //   functions['unbind'].apply( $container );
      // }

      function options() {
        return cy.scratch('cyComplexityManagement').options;
      }

      function clearDraws() {
        let w = cy.width();
        let h = cy.height();

        ctx.clearRect(0, 0, w, h);
        nodeWithRenderedCue = null;
      }

      function drawExpandCollapseCue(node) {
        
        let isCollapsed = node.hasClass('cy-expand-collapse-collapsed-node');

        //Draw expand-collapse rectangles
        let rectSize = options().expandCollapseCueSize;
        let lineSize = options().expandCollapseCueLineSize;

        let cueCenter;

        if (options().expandCollapseCuePosition === 'top-left') {
          let offset = 1;
          let size = cy.zoom() < 1 ? rectSize / (2 * cy.zoom()) : rectSize / 2;
          let nodeBorderWid = parseFloat(node.css('border-width'));
          let x = node.position('x') - node.width() / 2 - parseFloat(node.css('padding-left'))
            + nodeBorderWid + size + offset;
            let y = node.position('y') - node.height() / 2 - parseFloat(node.css('padding-top'))
            + nodeBorderWid + size + offset;

          cueCenter = { x: x, y: y };
        } else {
          let option = options().expandCollapseCuePosition;
          cueCenter = typeof option === 'function' ? option.call(this, node) : option;
        }

        let expandcollapseCenter = convertToRenderedPosition(cueCenter);

        // convert to rendered sizes
        rectSize = Math.max(rectSize, rectSize * cy.zoom());
        lineSize = Math.max(lineSize, lineSize * cy.zoom());
        let diff = (rectSize - lineSize) / 2;

        let expandcollapseCenterX = expandcollapseCenter.x;
        let expandcollapseCenterY = expandcollapseCenter.y;

        let expandcollapseStartX = expandcollapseCenterX - rectSize / 2;
        let expandcollapseStartY = expandcollapseCenterY - rectSize / 2;
        let expandcollapseRectSize = rectSize;

        // Draw expand/collapse cue if specified use an image else render it in the default way
        if (isCollapsed && options().expandCueImage) {
          drawImg(options().expandCueImage, expandcollapseStartX, expandcollapseStartY, rectSize, rectSize);
        }
        else if (!isCollapsed && options().collapseCueImage) {
          drawImg(options().collapseCueImage, expandcollapseStartX, expandcollapseStartY, rectSize, rectSize);
        }
        else {
          let oldFillStyle = ctx.fillStyle;
          let oldWidth = ctx.lineWidth;
          let oldStrokeStyle = ctx.strokeStyle;

          ctx.fillStyle = "black";
          ctx.strokeStyle = "black";

          ctx.ellipse(expandcollapseCenterX, expandcollapseCenterY, rectSize / 2, rectSize / 2, 0, 0, 2 * Math.PI);
          ctx.fill();

          ctx.beginPath();

          ctx.strokeStyle = "white";
          ctx.lineWidth = Math.max(2.6, 2.6 * cy.zoom());

          ctx.moveTo(expandcollapseStartX + diff, expandcollapseStartY + rectSize / 2);
          ctx.lineTo(expandcollapseStartX + lineSize + diff, expandcollapseStartY + rectSize / 2);

          if (isCollapsed) {
            ctx.moveTo(expandcollapseStartX + rectSize / 2, expandcollapseStartY + diff);
            ctx.lineTo(expandcollapseStartX + rectSize / 2, expandcollapseStartY + lineSize + diff);
          }

          ctx.closePath();
          ctx.stroke();

          ctx.strokeStyle = oldStrokeStyle;
          ctx.fillStyle = oldFillStyle;
          ctx.lineWidth = oldWidth;
        }

        node._private.data.expandcollapseRenderedStartX = expandcollapseStartX;
        node._private.data.expandcollapseRenderedStartY = expandcollapseStartY;
        node._private.data.expandcollapseRenderedCueSize = expandcollapseRectSize;

        nodeWithRenderedCue = node;
      }

      function drawImg(imgSrc, x, y, w, h) {
        let img = new Image(w, h);
        img.src = imgSrc;
        img.onload = () => {
          ctx.drawImage(img, x, y, w, h);
        };
      }

      cy.on('resize', data.eCyResize = function () {
        sizeCanvas();
      });

      cy.on('expandcollapse.clearvisualcue', function () {
        if (nodeWithRenderedCue) {
          clearDraws();
        }
      });

      let oldMousePos = null, currMousePos = null;
      cy.on('mousedown', data.eMouseDown = function (e) {
        oldMousePos = e.renderedPosition || e.cyRenderedPosition
      });

      cy.on('mouseup', data.eMouseUp = function (e) {
        currMousePos = e.renderedPosition || e.cyRenderedPosition
      });

      cy.on('remove', 'node', data.eRemove = function (evt) {
        const node = evt.target;
        if (node == nodeWithRenderedCue) {
          clearDraws();
        }
      });

      let ur;
      cy.on('select unselect', data.eSelect = function () {
        if (nodeWithRenderedCue) {
          clearDraws();
        }
        let selectedNodes = cy.nodes(':selected');
        if (selectedNodes.length !== 1) {
          return;
        }
        let selectedNode = selectedNodes[0];
        
        if (api.isExpandable(selectedNode) || api.isCollapsible(selectedNode)) {
          drawExpandCollapseCue(selectedNode);
        }
      });

      cy.on('tap', data.eTap = function (event) {
        let node = nodeWithRenderedCue;
        if (!node) {
          return;
        }
        let expandcollapseRenderedStartX = node.data('expandcollapseRenderedStartX');
        let expandcollapseRenderedStartY = node.data('expandcollapseRenderedStartY');
        let expandcollapseRenderedRectSize = node.data('expandcollapseRenderedCueSize');
        let expandcollapseRenderedEndX = expandcollapseRenderedStartX + expandcollapseRenderedRectSize;
        let expandcollapseRenderedEndY = expandcollapseRenderedStartY + expandcollapseRenderedRectSize;

        let cyRenderedPos = event.renderedPosition || event.cyRenderedPosition;
        let cyRenderedPosX = cyRenderedPos.x;
        let cyRenderedPosY = cyRenderedPos.y;
        let opts = options();
        let factor = (opts.expandCollapseCueSensitivity - 1) / 2;

        if ((Math.abs(oldMousePos.x - currMousePos.x) < 5 && Math.abs(oldMousePos.y - currMousePos.y) < 5)
          && cyRenderedPosX >= expandcollapseRenderedStartX - expandcollapseRenderedRectSize * factor
          && cyRenderedPosX <= expandcollapseRenderedEndX + expandcollapseRenderedRectSize * factor
          && cyRenderedPosY >= expandcollapseRenderedStartY - expandcollapseRenderedRectSize * factor
          && cyRenderedPosY <= expandcollapseRenderedEndY + expandcollapseRenderedRectSize * factor) {
         
          if (api.isCollapsible(node)) {
            clearDraws();
            node.unselect();
            if (document.getElementById("cbk-flag-recursive").checked) {
              api.collapseNodes([node], true);
            }else{
              api.collapseNodes([node]);
            }
            if (document.getElementById("cbk-run-layout2").checked) {
              cy.layout({ name: "fcose", animate: true, randomize: false, stop: () => { initializer(cy) } }).run();
            }
            else {
              initializer(cy);
            }
          }
          else if (api.isExpandable(node)) {
            clearDraws();
            node.unselect();
            if (document.getElementById("cbk-flag-recursive").checked) {
              api.expandNodes([node], true);
            }else{
              api.expandNodes([node]);
            }
            if (document.getElementById("cbk-run-layout2").checked) {
              cy.layout({ name: "fcose", animate: true, randomize: false, stop: () => { initializer(cy) } }).run();
            }
            else {
              initializer(cy);
            }
          }
        }
      });

      cy.on('afterUndo afterRedo', data.eUndoRedo = data.eSelect);

      cy.on('position', 'node', data.ePosition = debounce2(data.eSelect, CUE_POS_UPDATE_DELAY, clearDraws));

      cy.on('pan zoom', data.ePosition);

      // write options to data
      data.hasEventFields = true;
      setData(data);
    },
    unbind: function () {
      // let $container = this;
      let data = getData();

      if (!data.hasEventFields) {
        console.log('events to unbind does not exist');
        return;
      }

      cy.trigger('expandcollapse.clearvisualcue');

      cy.off('mousedown', 'node', data.eMouseDown)
        .off('mouseup', 'node', data.eMouseUp)
        .off('remove', 'node', data.eRemove)
        .off('tap', 'node', data.eTap)
        .off('add', 'node', data.eAdd)
        .off('position', 'node', data.ePosition)
        .off('pan zoom', data.ePosition)
        .off('select unselect', data.eSelect)
        .off('free', 'node', data.eFree)
        .off('resize', data.eCyResize)
        .off('afterUndo afterRedo', data.eUndoRedo);
    },
    rebind: function () {
      let data = getData();

      if (!data.hasEventFields) {
        console.log('events to rebind does not exist');
        return;
      }

      cy.on('mousedown', 'node', data.eMouseDown)
        .on('mouseup', 'node', data.eMouseUp)
        .on('remove', 'node', data.eRemove)
        .on('tap', 'node', data.eTap)
        .on('add', 'node', data.eAdd)
        .on('position', 'node', data.ePosition)
        .on('pan zoom', data.ePosition)
        .on('select unselect', data.eSelect)
        .on('free', 'node', data.eFree)
        .on('resize', data.eCyResize)
        .on('afterUndo afterRedo', data.eUndoRedo);
    }
  };

  let convertToRenderedPosition = function (modelPosition) {
    var pan = cy.pan();
    var zoom = cy.zoom();

    var x = modelPosition.x * zoom + pan.x;
    var y = modelPosition.y * zoom + pan.y;

    return {
      x: x,
      y: y
    };
  }

  if (functions[fn]) {
    return functions[fn].apply(cy.container(), Array.prototype.slice.call(arguments, 1));
  } else if (typeof fn == 'object' || !fn) {
    return functions.init.apply(cy.container(), arguments);
  }
  throw new Error('No such function `' + fn + '` for cytoscape.js-expand-collapse');

};