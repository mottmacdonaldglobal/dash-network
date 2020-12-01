/*
 https://github.com/plotly/dash-sunburst/blob/master/src/lib/d3/sunburst.js
*/

/* eslint no-magic-numbers: ["error", { "ignore": [0,1,2,3.5,5] }]*/

import * as d3 from 'd3';
import * as cola from 'webcola';


const dflts = {
    width: 600,
    height: 500,
    padding: 10,
    groupPadding:0.01,
    margin : 20,
    groupMargin : 15,
};



export default class NetworkD3 {
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
        self.labelGroup = self.svg.append('g')
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
        const width = figure.width || dflts.width;
        const height = figure.height || dflts.height;
        const padding = figure.padding || dflts.padding;
        const groupPadding = figure.groupPadding || dflts.groupPadding;
        const margin = figure.margin || dflts.margin;
        const groupMargin = figure.groupMargin || dflts.groupMargin
        const {data, dataVersion} = figure;

        const newFigure = self.figure = {
            width,
            height,
            padding,
            groupPadding,
            margin,
            groupMargin,
            data,
            dataVersion
        };
        
        const change = diff(oldFigure, newFigure);
        if(!change) { return; }

        const sizeChange = change.width || change.height;
        const dataChange = change.data;
        const paddingChange = change.padding || change.groupPadding;
        const marginChange = change.margin || change.groupMargin;

        if(sizeChange) {
            self.svg
                .attr('viewBox', [-width / 2, -height / 2, width, height])
                .attr('width', width)
                .attr('height', height);
        }

        let links = self.linkGroup.selectAll('.links');
        let nodes = self.nodeGroup.selectAll('.node');
        let labels = self.labelGroup.selectAll('.label');
        let i;

        if (dataChange){

            // Update nodes with new data.
            // and it adds other attributes to the array, so update this array in place
            const nodeMap = {};
            const newIDs = {};

            for (i in self.currentData.nodes){
                nodeMap[self.currentData.nodes[i].id] = self.currentData.nodes[i];
            }

            for(i in data.nodes) {
                const newNode = data.nodes[i];
                newIDs[newNode.id] = 1;
                const existingNode = nodeMap[newNode.id];
                if(existingNode) {
                    // existingNode.radius = newNode.radius;
                    // TODO 
                    existingNode.color = newNode.color;
                }
                else {
                    self.currentData.nodes.push(newNode);
                    nodeMap[newNode.id] = newNode;
                }
            }
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
                    source: nodeMap[linkDatai.source].id,
                    target: nodeMap[linkDatai.target].id,
                    index: i
                };
            }
            const oldLinkCount = self.currentData.links.length;
            const newLinkCount = data.links.length;
            if(oldLinkCount > newLinkCount) {
                self.currentData.links.splice(newLinkCount, oldLinkCount - newLinkCount);
            }

            
            // Now propagate the new data (& attributes) to the DOM elements
            // Positioning by cola.
            console.log(self.currentData);

            self.currentData.nodes.forEach(v => {
                v.width = 70;
                v.height = 70;
            });

            console.log(self.currentData)

            const pgLayout = cola.powerGraphGridLayout(self.currentData, [this.width, this.height], self.grouppadding);
            
            nodes = nodes
                .data(self.currentData.nodes);
            nodes.exit().remove();
            nodes.enter()   
                .append("rect")
                .attr("class", "node")
                .call(self.drag())
                .merge(nodes);
            nodes.append("title").text(d => d.name);

            labels = labels
                .data(self.currentData.nodes)
                .enter().append("text")
                .attr("class", "label");
                //.text(d => d.name.replace(/^u/, ''));

       //     self.gridify(pgLayout, self.margin, self.groupMargin);
        }

        self.links = links;
        self.nodes = nodes;
        self.labels = labels;
    }

    getDragPos(d)
    {
        const p = self.getEventPos(d.sourceEvent), startPos = self.eventStart[d.subject.routerNode.id];
        return { x: d.subject.routerNode.bounds.x + p.x - startPos.x, y: d.subject.routerNode.bounds.y + p.y - startPos.y };
    }


    getEventPos(ev) {
        return { x: ev.clientX, y: ev.clientY };
    }
    
    drag() {
        const self = this;

        const dragstarted = d => {

            self.ghosts = [1, 2].map(i => self.svg.append('rect')
                .attr("class" ,"ghost")
                .attr("x" ,d.subject.routerNode.bounds.x)
                .attr("y" ,d.subject.routerNode.bounds.y)
                .attr("width" ,d.subject.routerNode.bounds.X - d.subject.routerNode.bounds.x)
                .attr("height" ,d.subject.routerNode.bounds.Y - d.subject.routerNode.bounds.y)
            );

            self.eventStart[d.subject.routerNode.id] = self.getEventPos(d.sourceEvent);
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
            delete self.eventStart[d.subject.routerNode.id];
            d.subject.x = dropPos.x;
            d.subject.y = dropPos.y;
            self.ghosts.forEach(g => g.remove());
            if (Object.keys(self.eventStart).length === 0) {
                // self.gridify(pgLayout, margin, groupMargin);
            }
            d.fx = null;
            d.fy = null;
        }

        return d3.drag()
            .on('start', dragstarted)
            .on('drag', dragged)
            .on('end', dragended);
    }


    gridify(pgLayout, margin, groupMargin) {
        var routes = cola.gridify(pgLayout, 5, margin, groupMargin);
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
        self.svg.selectAll(".label").transition().attr("x", d => d.routerNode.bounds.cx())
            .attr("y", function (d) {
            var h = d.getBBox().height;
            return d.bounds.cy() + h / 3.5;
        });
        self.svg.selectAll(".node").transition().attr("x", d => d.routerNode.bounds.x)
            .attr("y", d => d.routerNode.bounds.y)
            .attr("width", d => d.routerNode.bounds.width())
            .attr("height", d => d.routerNode.bounds.height());
        const groupPadding = margin - groupMargin;
        self.svg.selectAll(".group").transition().attr('x', d => d.routerNode.bounds.x - groupPadding)
            .attr('y', d => d.routerNode.bounds.y + 2 * groupPadding)
            .attr('width', d => d.routerNode.bounds.width() - groupPadding)
            .attr('height', d => d.routerNode.bounds.height() - groupPadding);
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

