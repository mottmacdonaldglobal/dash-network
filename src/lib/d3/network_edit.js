import * as d3 from 'd3';

const DRAGALPHA = 0.3;
const DIST_MULTIPLIER = 1;
const DIST_EXTRA = 0;
const REPULSION = -80;
const REPULSIONPOWER = 0.3;
const MAXREPULSIONLENGTH = 0.25;

const dflts = {
    width: 500,
    height: 500,
    linkWidth: 4,
    maxLinkWidth: 20,
    nodeRadius: 10,
    maxRadius: 20
};

const linkAttrs = {
    stroke: '#999',
    strokeOpacity: 0.6
};

const nodeAttrs = {
    stroke: '#fff',
    strokeWidth: 1
};

const textStyle = {
    fill: '#444',
    textAnchor: 'middle',
    fontSize: '10px',
    fontFamily: 'Arial',
    textShadow: 'white -1px 0px 0.5px, white 0px -1px 0.5px, white 0px 1px 0.5px, white 1px 0px 0.5px'
};


export default class NetworkD3 {
    constructor(el, figure, onClick) {
        const self = this;

        self.update = self.update.bind(self);
        self.tick = self.tick.bind(self);
        self.drag = self.drag.bind(self);
        self.wrappedClick = self.wrappedClick.bind(self);

        const colorScale = d3.scaleOrdinal(d3.schemeCategory10);
        self.color = d => d.color || colorScale(d.group || d.id);

        self.svg = d3.select(el).append('svg');
        self.svg.on('click', self.wrappedClick);

      //*  self.linkGroup = self.svg.append('g')
      //*      .style('pointer-events', 'none');
      //*  self.nodeGroup = self.svg.append('g');
      //*  self.textGroup = self.svg.append('g')
      //*      .style('pointer-events', 'none');

        self.figure = {};

        self.onClick = onClick;

        self.initialized = false;

      //*  self.nodeData = [];
      //*  self.linkData = [];

        self.repulsion = d3.forceManyBody();
        self.simulation = d3.forceSimulation(self.nodeData)
            .force('charge', self.repulsion)
            .force('center', d3.forceCenter())
            .on('tick', self.tick());

        self.update(figure);
    }

    wrappedClick(d) {
        this.onClick(d);
        d3.event.stopPropagation();
    }

    update(figure) {
        // const self = this;
        // const oldFigure = self.figure;

        // // fill defaults in the new figure
        // const width = figure.width || dflts.width;
        // const height = figure.height || dflts.height;
        // const linkWidth = figure.linkWidth || dflts.linkWidth;
        // const maxLinkWidth = figure.maxLinkWidth || dflts.maxLinkWidth;
        // const nodeRadius = figure.nodeRadius || dflts.nodeRadius;
        // const maxRadius = figure.maxRadius || dflts.maxRadius;
        // const {data, dataVersion} = figure;

        // const newFigure = self.figure = {
        //     width,
        //     height,
        //     linkWidth,
        //     maxLinkWidth,
        //     nodeRadius,
        //     maxRadius,
        //     data,
        //     dataVersion
        // };

        // const change = diff(oldFigure, newFigure);
        // if(!change) { return; }

        // const sizeChange = change.width || change.height;
        // const dataChange = change.data;
        // const linkWidthChange = change.linkWidth || change.maxLinkWidth;
        // const radiusChange = change.nodeRadius;

        // if(sizeChange) {
        //     self.svg
        //         .attr('viewBox', [-width / 2, -height / 2, width, height])
        //         .attr('width', width)
        //         .attr('height', height);

        //     self.repulsion.distanceMax(Math.min(width, height) * MAXREPULSIONLENGTH);
        // }

        // let links = self.linkGroup.selectAll('line');
        // let nodes = self.nodeGroup.selectAll('circle');
        // let texts = self.textGroup.selectAll('text');
        // let i;

        if(dataChange) {
            // Update nodes with new data.
            // The force simulation is connected to the self.nodeData array
            // and it adds other attributes to the array, so update this array in place
            const nodeMap = {};
            const newIDs = {};
            for(i in self.nodeData) {
                nodeMap[self.nodeData[i].id] = self.nodeData[i];
            }
            for(i in data.nodes) {
                const newNode = data.nodes[i];
                newIDs[newNode.id] = 1;
                const existingNode = nodeMap[newNode.id];
                if(existingNode) {
                    existingNode.radius = newNode.radius;
                    existingNode.color = newNode.color;
                }
                else {
                    self.nodeData.push(newNode);
                    nodeMap[newNode.id] = newNode;
                }
            }
            for(i = self.nodeData.length - 1; i >= 0; i--) {
                const oldId = self.nodeData[i].id;
                if(!newIDs[oldId]) {
                    self.nodeData.splice(i, 1);
                    delete nodeMap[oldId];
                }
            }
            self.simulation.nodes(self.nodeData);

            // Update links in place as well
            // Links array has no extra data so we can simply replace old with new
            // but convert ids to node references
            for(i in data.links) {
                const linkDatai = data.links[i];
                self.linkData[i] = {
                    source: nodeMap[linkDatai.source],
                    target: nodeMap[linkDatai.target],
                    index: i
                };
            }
            const oldLinkCount = self.linkData.length;
            const newLinkCount = data.links.length;
            if(oldLinkCount > newLinkCount) {
                self.linkData.splice(newLinkCount, oldLinkCount - newLinkCount);
            }

            // Now propagate the new data (& attributes) to the DOM elements
            // Omit positioning for now, it will be handled by `self.tick`
            // via the force model.
            links = links.data(self.linkData, d => d.source + '>>' + d.source);
            links.exit().remove();
            links = links.enter().append('line')
                .attr('stroke', linkAttrs.stroke)
                .attr('stroke-opacity', linkAttrs.strokeOpacity)
              .merge(links);

            nodes = nodes.data(self.nodeData, d => d.id);
            nodes.exit().remove();
            nodes = nodes.enter().append('circle')
                .attr('stroke', nodeAttrs.stroke)
                .attr('stroke-width', nodeAttrs.strokeWidth)
                .call(self.drag())
                .on('click', self.wrappedClick)
              .merge(nodes)
                .attr('fill', self.color);

            texts = texts.data(self.nodeData, d => d.id);
            texts.exit().remove();
            texts = texts.enter().append('text')
                .style('fill', textStyle.fill)
                .style('text-anchor', textStyle.textAnchor)
                .style('font-size', textStyle.fontSize)
                .style('font-family', textStyle.fontFamily)
                .style('text-shadow', textStyle.textShadow)
              .merge(texts)
                .text(d => d.id);
        }

        self.links = links;
        self.nodes = nodes;
        self.texts = texts;

        if(dataChange || linkWidthChange) {
            let maxFoundWidth = 0;
            self.links.each(d => {
                maxFoundWidth = Math.max(maxFoundWidth, d.width || 0);
            });
            maxFoundWidth = maxFoundWidth || 1;
            self.links.attr('width', d => (d.width * maxLinkWidth / maxFoundWidth) || linkWidth);
        }

        if(dataChange || radiusChange) {
            let maxFoundRadius = 0;
            self.nodes.each(d => {
                maxFoundRadius = Math.max(maxFoundRadius, d.radius || 0);
            });
            maxFoundRadius = maxFoundRadius || 1;
            self.nodes.each(d => {
                d._r = (d.radius * maxRadius / maxFoundRadius) || nodeRadius;
            })
            self.nodes.attr('r', d => d._r);

            self.simulation.force('link', d3.forceLink(self.linkData).distance(link => {
                return DIST_MULTIPLIER * (link.source._r + link.target._r) + DIST_EXTRA
            }));
            self.repulsion.strength(d => (
                REPULSION * d._r / Math.pow(self.nodeData.length, REPULSIONPOWER)
            ));
        }
        self.simulation.alpha(0.5).restart();
    }

    tick() {
        const self = this;
        return () => {
            self.links
                .attr('x1', d => d.source.x)
                .attr('y1', d => d.source.y)
                .attr('x2', d => d.target.x)
                .attr('y2', d => d.target.y);

            self.nodes
                .attr('cx', d => d.x)
                .attr('cy', d => d.y);

            self.texts
                .attr('x', d => d.x)
                .attr('y', d => d.y);
        }
    }

    drag() {
        const self = this;

        const dragstarted = d => {
            if (!d3.event.active) {
                self.simulation.alphaTarget(DRAGALPHA).restart();
            }
            d.fx = d.x;
            d.fy = d.y;
        }

        const dragged = d => {
            d.fx = d3.event.x;
            d.fy = d3.event.y;
        }

        const dragended = d => {
            if (!d3.event.active) {
                self.simulation.alphaTarget(0);
            }
            d.fx = null;
            d.fy = null;
        }

        return d3.drag()
            .on('start', dragstarted)
            .on('drag', dragged)
            .on('end', dragended);
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
