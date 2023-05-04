export class ReadonlyGraph {
    constructor(svg_selector, conainer_selector, data) {
        let vars = this;

        this.ticked = this.ticked.bind(this);
        this.click = this.click.bind(this);
        this.resize = this.resize.bind(this);
        
        this.data = data;
        this.graph = $(svg_selector)[0];
        this.width = this.graph.clientWidth;
        this.height = this.graph.clientHeight;
        this.r = 20;
        
        this.zoom = d3
            .zoom()
            .scaleExtent([1, 4])
            .translateExtent([[0, 0], [this.width, this.height]])
            .extent([[0, 0], [this.width, this.height]])
            .on('zoom', function (e) {
                vars.svg.attr("transform", e.transform)
            });

        d3.select(conainer_selector).call(this.zoom);

        this.svg = d3.select(svg_selector);

        this.simulation;

        window.addEventListener("resize", this.resize);

        this.svg
            .append("svg:defs")
            .append("svg:marker")
            .attr("id", "arrow")
            .attr("viewBox", "0 -5 10 10")
            .attr('refX', 29)
            .attr('refY', 0)
            .attr("markerWidth", 5)
            .attr("markerHeight", 5)
            .attr("orient", "auto")
            .append("svg:path")
            .attr("d", "M0,-5L10,0L0,5");

        this.links = this.svg
            .selectAll(".line")
            .data(this.data.links)
            .enter()
            .append("g")
            .attr("class", "line");

        this.lines = this.links
            .append("path")
            .style("stroke", "#aaa")
            .attr("fill-opacity", "0")
            .attr('marker-end', (d) => "url(#arrow)")//attach the arrow from defs
            .style("stroke-width", 2);

        this.nodes = this.svg
            .selectAll(".node")
            .data(this.data.nodes)
            .enter()
            .append("g")
            .attr("class", "node")
            .call(
                d3.drag() //sets the event listener for the specified typenames and returns the drag behavior.
                    .on("start", function (d, i) { vars.dragstarted(d, i, this) }) //start - after a new pointer becomes active (on mousedown or touchstart).
                    .on("drag", this.dragged) //drag - after an active pointer moves (on mousemove or touchmove).
            )
            .on("click", this.click);

        this.circles = this.nodes
            .append("circle")
            .attr("r", this.r)
            .attr("class", "circle");

        this.link_labels = this.svg
            .selectAll(".link-text")
            .data(this.data.links)
            .enter()
            .append("text")
            .attr("dy", 5)
            .attr("text-anchor", "middle")
            .attr("class", "link-text")
            .text(function (d) {
                return d.weight
            });

        this.labels = this.nodes
            .append("text")
            .text(function (d) {
                return d.id;
            })
            .attr("text-anchor", "middle")
            .attr("y", 5);

        this.simulation = d3.forceSimulation(this.data.nodes)
            .force("link", d3.forceLink()
                .id(function (d) { return d.id; }).distance(120)
                .links(this.data.links)
            )
            .force("charge", d3.forceManyBody().strength(-400))
            .force("center", d3.forceCenter(this.width / 2, this.height / 2))
            .on("end", this.ticked)
            .on("tick", this.ticked);

    }

    dragstarted(event, d, node) {
        if (!event.active) this.simulation.alphaTarget(0.3).restart();
        d.fy = d.y;
        d.fx = d.x;
        d3.select(node).select("circle").classed("fixed", true);
    }

    //When the drag gesture starts, the targeted node is fixed to the pointer
    dragged(event, d) {
        d.fx = event.x;
        d.fy = event.y;
    }

    click(event, d) {
        d.fx = null;
        d.fy = null;
        d3.select(event.currentTarget).select("circle").classed("fixed", false);
        this.simulation.alpha(1).restart();
    }

    resize() {
        this.width = this.graph.clientWidth;
        this.height = this.graph.clientHeight;

        this.simulation.force("center")
            .x(this.width / 2)
            .y(this.height / 2);

        this.simulation.alpha(1).restart();
    }

    ticked() {
        let vars = this;

        this.lines
            .attr("d", function (d) {
                let SX = Math.max(vars.r, Math.min(vars.width - vars.r, d.source.x));
                let SY = Math.max(vars.r, Math.min(vars.height - vars.r, d.source.y));
                let TX = Math.max(vars.r, Math.min(vars.width - vars.r, d.target.x));
                let TY = Math.max(vars.r, Math.min(vars.height - vars.r, d.target.y));

                return `M${SX},${SY},${TX},${TY}`; //uncurved

                let dx = TX - SX;
                let dy = TY - SY;
                let dr = Math.sqrt(dx * dx + dy * dy);
                //return `M${SX},${SY}A${dr},${dr} 0 0,1 ${TX},${TY}`; //curved (need to change pointer and labels)
            });

        this.link_labels
            .attr("x", function (d) {
                return d.target.x - ((d.target.x - d.source.x) / 3);
            })
            .attr("y", function (d) {
                return d.target.y - ((d.target.y - d.source.y) / 3);
            });

        this.nodes
            .attr("cx", function (d) { return d.x = Math.max(vars.r, Math.min(vars.width - vars.r, d.x)); })
            .attr("cy", function (d) { return d.y = Math.max(vars.r, Math.min(vars.height - vars.r, d.y)); })
            .attr("transform", function (d) {
                return "translate(" + d.x + "," + d.y + ")";
            });
    }
}