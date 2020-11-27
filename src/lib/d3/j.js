import d3 from 'd3';
import cola from 'cola';


const dflts = {
    width: 600,
    height: 500,
    padding: 10,
    groupPadding:0.01,
    margin : 20,
    groupMargin : 15,
    transitionDuration: 750
};



export default class NetworkD3 {
    constructor(el, figure, onClick) {
        const self = this;

        self.update = self.update.bind(self);
        self._update = self._update.bind(self);

        self.tick = self.tick.bind(self);
        self.drag = self.drag.bind(self);
        self.wrappedClick = self.wrappedClick.bind(self);
        self.wrappedDrag = self.wrappedDrag.bind(self);

        self.svg = d3.select(el).append('svg');
        self.svg.on('click', self.wrappedClick);

        self.ghosts = []
        self.eventStart = {}

        self.linkGroup = self.svg.append('g')
            .style('pointer-events', 'none');
        self.nodeGroup = self.svg.append('g');
        self.textGroup = self.svg.append('g')
            .style('pointer-events', 'none');

        self.figure = {};

        self.onClick = onClick;

        self.initialized = false;

        self.nodeData = [];
        self.linkData = [];

        self._promise = Promise.resolve();


        self.update(figure);
    }

    update(figure) {
        const self = this;
        // ensure any previous transition is complete before we start
        self._promise = self._promise.then(() => self._update(figure));
    }

    getDragPos(d)
    {
        let p = self.getEventPos(d.sourceEvent), startPos = eventStart[d.subject.routerNode.id];
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
            let dropPos = self.getDragPos(d);
            delete self.eventStart[d.subject.routerNode.id];
            d.subject.x = dropPos.x;
            d.subject.y = dropPos.y;
            self.ghosts.forEach(g => g.remove());
            if (Object.keys(self.eventStart).length === 0) {
                gridify(svg, pgLayout, margin, groupMargin);
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
                svg.append('path')
                    .attr('class', 'linkarrowoutline')
                    .attr('d', p.arrowpath);
                svg.append('path')
                    .attr('class', 'linkarrow')
                    .attr('d', p.arrowpath);
            }
            svg.append('path')
                .attr('class', 'linkoutline')
                .attr('d', p.routepath)
                .attr('fill', 'none');
            svg.append('path')
                .attr('class', 'link')
                .attr('d', p.routepath)
                .attr('fill', 'none');
        });
        svg.selectAll(".label").transition().attr("x", d => d.routerNode.bounds.cx())
            .attr("y", function (d) {
            var h = this.getBBox().height;
            return d.bounds.cy() + h / 3.5;
        });
        svg.selectAll(".node").transition().attr("x", d => d.routerNode.bounds.x)
            .attr("y", d => d.routerNode.bounds.y)
            .attr("width", d => d.routerNode.bounds.width())
            .attr("height", d => d.routerNode.bounds.height());
        let groupPadding = margin - groupMargin;
        svg.selectAll(".group").transition().attr('x', d => d.routerNode.bounds.x - groupPadding)
            .attr('y', d => d.routerNode.bounds.y + 2 * groupPadding)
            .attr('width', d => d.routerNode.bounds.width() - groupPadding)
            .attr('height', d => d.routerNode.bounds.height() - groupPadding);
    }

};
