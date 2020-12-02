/*
 https://github.com/plotly/dash-sunburst/blob/master/src/lib/d3/sunburst.js
*/

/* eslint no-magic-numbers: ["error", { "ignore": [0,1,2,5] }]*/

import * as d3 from 'd3';
import * as cola from 'webcola';


const LABEL_CORRECTION_HEIGHT = 50;
const LABEL_CORRECTION_WIDTH = 50;


export default class NetworkD3 {


    static get DEFAULTS(){
        return {
            width: 2000,
            height: 700,
            padding: 10,
            margin : 20,
            linkSettings : {
                nudge : 4 // separation between links in/out of nodes
            }
        };
    }

    constructor(el, figure, onClick) {
        const self = this;

        self.update = self.update.bind(self);
        self._update = self._update.bind(self);

        // self.tick = self.tick.bind(self);
        self.drag = self.drag.bind(self);
       // self.wrappedClick = self.wrappedClick.bind(self);
       // self.wrappedDrag = self.wrappedDrag.bind(self);

        self.svg = d3.select(el).append('svg');
        self.svg.on('click', self.wrappedClick);


        self.ghosts = []
        self.eventStart = {}

        self.linkGroup = self.svg.append('g')
            .style('pointer-events', 'none');
        self.nodeGroup = self.svg.append('g');
        self.nodeLabelGroup = self.svg.append('g')
            .style('pointer-events', 'none');

        self.figure = {};

        self.onClick = onClick;

        self.initialized = false;

        self.currentData = {
            nodes : [],
            links : []
        }

        self._promise = Promise.resolve();

        self.update(figure);
    }

    update(figure) {
        const self = this;
        // ensure any previous transition is complete before we start
        self._promise = self._promise.then(() => self._update(figure));
    }

    _update(figure) {
        const self = this;
        const oldFigure = self.figure;

        // fill defaults in the new figure
        const width = figure.width || NetworkD3.DEFAULTS.width;
        const height = figure.height || NetworkD3.DEFAULTS.height;
        const padding = figure.padding || NetworkD3.DEFAULTS.padding;
        const margin = figure.margin || NetworkD3.DEFAULTS.margin;
        const linkSettings = figure.linkSettings || NetworkD3.DEFAULTS.linkSettings;
        const {data, dataVersion} = figure;

        const newFigure = self.figure = {
            width,
            height,
            padding,
            margin,
            data,
            dataVersion
        };
        
        const change = diff(oldFigure, newFigure);
        if(!change) { return; }

        const sizeChange = change.width || change.height;
        const dataChange = change.data;
        const paddingChange = change.padding;
        const marginChange = change.margin;

        if(sizeChange) {
            self.svg
                .attr('viewBox', [0, 0, width, height])
                .attr('width', width)
                .attr('height', height);
        }

        let links = self.linkGroup.selectAll('.links');
        let nodes = self.nodeGroup.selectAll('.node');
        let nodeLabels = self.nodeLabelGroup.selectAll('.label');
        let i;

        if (dataChange || marginChange || paddingChange ){

            // Update nodes with new data.
            // and it adds other attributes to the array, so update this array in place
            const nodeMap = {};
            const newIDs = {};

            for (i in self.currentData.nodes){
                nodeMap[self.currentData.nodes[i].id] = self.currentData.nodes[i];
            }

            data.nodes.forEach(function (node, i) {
                node.name = node.label = node.id;
                node.width = node.height = 70;
                const newNode = node;
                newIDs[newNode.id] = 1
                const existingNode = nodeMap[newNode.id];
                if(existingNode) {
                    // existingNode.radius = newNode.radius;
                    // TODO change properties
                    //existingNode.color = newNode.color;
                }
                else {
                    self.currentData.nodes.push(newNode);
                    nodeMap[newNode.id] = newNode;
                }
            });

            for(i = self.currentData.nodes.length - 1; i >= 0; i--) {
                const oldId = self.currentData.nodes[i].id;
                if(!newIDs[oldId]) {
                    self.currentData.nodes.splice(i, 1);
                    delete nodeMap[oldId];
                }
            }

            // Update links in place as well
            // Links array has no extra data so we can simply replace old with new
            // but convert ids to node references
            for(i in data.links) {
                const linkDatai = data.links[i];
                self.currentData.links[i] = {
                    source: nodeMap[linkDatai.source],
                    target: nodeMap[linkDatai.target],
                    index: i
                };
            }
            const oldLinkCount = self.currentData.links.length;
            const newLinkCount = data.links.length;
            if(oldLinkCount > newLinkCount) {
                self.currentData.links.splice(newLinkCount, oldLinkCount - newLinkCount);
            }

            
          
            
            
            
            const widths = [];
            const heights = []; 
            nodeLabels = nodeLabels
                .data(self.currentData.nodes)
                .enter().append("text")
                .attr("class", "label")
                .text(d => d.name)
                .each(function(t){
                    widths[t.id] = this.getBBox().width;
                    heights[t.id]= this.getBBox().height;
                });

            self.currentData.nodes.forEach(function (node, i) {
                node.width = widths[node.id] +LABEL_CORRECTION_WIDTH
                node.height = heights[node.id] +LABEL_CORRECTION_HEIGHT
            });


            nodes = nodes
                .data(self.currentData.nodes);
            nodes.exit().remove();
            nodes.enter()   
                .append("rect")
                .attr("class", "node")
                .call(self.drag())
                .merge(nodes);

            // Now propagate the new data (& attributes) to the DOM elements
            // Positioning by cola.
            this.gridLayout = myGridLayout(self.currentData, [width, height]);
            self.gridify();
        }

        self.links = links;
        self.nodes = nodes;
        self.nodeLabels = nodeLabels;
    }

    getDragPos(d)
    {
        const self = this;
        const p = self.getEventPos(d3.event), startPos = self.eventStart[d.routerNode.id];
        return { x: d.routerNode.bounds.x + p.x - startPos.x, y: d.routerNode.bounds.y + p.y - startPos.y };
    }


    getEventPos(ev) {
        return { x: ev.x, y: ev.y };
    }
    
    drag() {
        const self = this;

        const dragstarted = d => {
 
            self.ghosts = [1, 2].map(i => self.svg.append('rect')
                .attr("class" ,"ghost")
                .attr("x" ,d.routerNode.bounds.x)
                .attr("y" ,d.routerNode.bounds.y)
                .attr("width" ,d.routerNode.bounds.X - d.routerNode.bounds.x)
                .attr("height" ,d.routerNode.bounds.Y - d.routerNode.bounds.y)
            );

            self.eventStart[d.routerNode.id] = self.getEventPos(d3.event);
            d.fx = d.x;
            d.fy = d.y;
        }

        const dragged = d => {
            d.fx = d3.event.x;
            d.fy = d3.event.y;
            var p = self.getDragPos(d);
            self.ghosts[1]
                .attr("x" , p.x)
                .attr("y",p.y);
        }

        const dragended = d => {
            const dropPos = self.getDragPos(d);
            delete self.eventStart[d.routerNode.id];
            d.x = dropPos.x;
            d.y = dropPos.y;
            self.ghosts.forEach(g => g.remove());
            if (Object.keys(self.eventStart).length === 0) {
                self.gridify();
            }
            d.fx = null;
            d.fy = null;
        }

        return d3.drag()
            .on('start', dragstarted)
            .on('drag', dragged)
            .on('end', dragended);
    }


    gridify() {
        /**
         * 
         */

        const self = this;
       // var routes = cola.gridify(pgLayout, 0, margin, groupMargin);
        self.gridLayout.cola.start(0, 0, 0, 1000, false);
        const gridrouter = myRouter(self.gridLayout.cola.nodes(), self.figure.margin)
        var routes = gridrouter.routeEdges(self.gridLayout.cola.links(),4, function (e) { return e.source.routerNode.id; }, function (e) { return e.target.routerNode.id; });

        console.log(routes);
        self.svg.selectAll('path').remove();
        routes.forEach(route => {
            var cornerradius = 5;
            var arrowwidth = 3;
            var arrowheight = 7;
            var p = cola.GridRouter.getRoutePath(route, cornerradius, arrowwidth, arrowheight);
            if (arrowheight > 0) {
                self.svg.append('path')
                    .attr('class', 'linkarrowoutline')
                    .attr('d', p.arrowpath);
                self.svg.append('path')
                    .attr('class', 'linkarrow')
                    .attr('d', p.arrowpath);
            }
            self.svg.append('path')
                .attr('class', 'linkoutline')
                .attr('d', p.routepath)
                .attr('fill', 'none');
            self.svg.append('path')
                .attr('class', 'link')
                .attr('d', p.routepath)
                .attr('fill', 'none');
        });
        self.svg.selectAll(".label").transition()
            .attr("dominant-baseline", "middle")
            .attr("text-anchor", "middle")
            .attr("x", function (d) {  
                return d.routerNode.bounds.x + d.routerNode.bounds.width()/2;
            })
            .attr("y", function (d) {           
                return d.routerNode.bounds.y + d.routerNode.bounds.height()/2;
            });
        self.svg.selectAll(".node").transition().attr("x", d => d.routerNode.bounds.x)
            .attr("y", d => d.routerNode.bounds.y)
            .attr("width", d => d.routerNode.bounds.width())
            .attr("height", d => d.routerNode.bounds.height());
    }

};


/**
 * Very simple diff - assumes newObj is flat and has all the possible keys from oldObj
 * uses a "dataVersion" key to avoid diffing the full data object.
 * In fact, this way we can avoid copying data (ie treating it immutably),
 * and just use dataVersion to track mutations.
 */
function diff(oldObj, newObj) {
    const V = 'Version';
    const out = {};
    let hasChange = false;
    for(const key in newObj) {
        if(key.substr(key.length - V.length) === V) { continue; }

        if(typeof newObj[key] === 'object') {
            if(newObj[key + V]) {
                if(newObj[key + V] !== oldObj[key + V]) {
                    out[key] = 1;
                    hasChange = true;
                }
            }
            else if(JSON.stringify(oldObj[key]) !== JSON.stringify(newObj[key])) {
                out[key] = 1;
                hasChange = true;
            }
        }
        else if(oldObj[key] !== newObj[key]) {
            out[key] = 1;
            hasChange = true;
        }
    }
    return hasChange && out;
}


function myRouter(nodes, margin) {
    nodes.forEach(function (d) {
        d.routerNode = {
            name: d.name,
            bounds: d.bounds.inflate(-margin)
        };
    });
    var gridRouterNodes = nodes.map(function (d, i) {
        d.routerNode.id = i;
        return d.routerNode;
    });
    return new cola.GridRouter(gridRouterNodes, {
        getChildren: function (v) { return v.children; },
        getBounds: function (v) { return v.bounds; }
    }, margin);
}



function myGridLayout(graph, size) {

    return {
        cola: new cola.Layout()
            .convergenceThreshold(1e-3)
            .size(size)
            .avoidOverlaps(true)
            .nodes(graph.nodes)
            .links(graph.links)
            .linkDistance(100)
            .symmetricDiffLinkLengths(50)
            .start(50, 0, 100, 0, false)
    };
}
exports.myGridLayout = myGridLayout;