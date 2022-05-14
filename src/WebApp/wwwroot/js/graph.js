let data = {
    nodes: [
        {
            "id": 1,
            "name": "A"
        },
        {
            "id": 2,
            "name": "B"
        },
        {
            "id": 3,
            "name": "C"
        },
        {
            "id": 4,
            "name": "D"
        },
        {
            "id": 5,
            "name": "E"
        },
        {
            "id": 6,
            "name": "F"
        },
        {
            "id": 7,
            "name": "G"
        },
        {
            "id": 8,
            "name": "H"
        },
        {
            "id": 9,
            "name": "I"
        },
        {
            "id": 10,
            "name": "J"
        },
        {
            "id": 11,
            "name": "K"
        },
        {
            "id": 12,
            "name": "L"
        }
    ],
    links: [
        {
            "source": 1,
            "target": 2,
            "weight": 20
        },
        {
            "source": 1,
            "target": 5,
            "weight": 20
        },
        {
            "source": 1,
            "target": 6,
            "weight": 10
        },
        {
            "source": 2,
            "target": 3,
            "weight": 5
        },
        {
            "source": 2,
            "target": 7,
            "weight": 5
        },
        {
            "source": 3,
            "target": 4,
            "weight": 10
        },
        {
            "source": 6,
            "target": 10,
            "weight": 3
        },
        {
            "source": 10,
            "target": 6,
            "weight": 2
        },
        {
            "source": 8,
            "target": 3,
            "weight": 10
        },
        {
            "source": 4,
            "target": 5,
            "weight": 10
        },
        {
            "source": 4,
            "target": 9,
            "weight": 10
        },
        {
            "source": 5,
            "target": 10,
            "weight": 10
        },
        {
            "source": 11,
            "target": 12,
            "weight": 10
        },
        {
            "source": 9,
            "target": 11,
            "weight": 10
        },
        {
            "source": 8,
            "target": 12,
            "weight": 10
        },
        {
            "source": 7,
            "target": 12,
            "weight": 10
        }
    ]
};

let graph = document.getElementById("graph");
let width = graph.clientWidth;
let height = graph.clientHeight;
let r = 20;

let zoom = d3
    .zoom()
    .scaleExtent([1, 4])
    .translateExtent([[0, 0], [width, height]])
    .extent([[0, 0], [width, height]])
    .on('zoom', function (e) {
        svg.attr("transform", e.transform)
    });

d3.select(".graph-container").call(zoom);

let svg = d3.select("#graph");

let simulation;

window.addEventListener("resize", function () {
    width = graph.clientWidth;
    height = graph.clientHeight;

    simulation.force("center")
        .x(width / 2)
        .y(height / 2);

    simulation.alpha(1).restart();
});

svg.append("svg:defs").append("svg:marker")
    .attr("id", "arrow")
    .attr("viewBox", "0 -5 10 10")
    .attr('refX', 29)
    .attr('refY', 0)
    .attr("markerWidth", 5)
    .attr("markerHeight", 5)
    .attr("orient", "auto")
    .append("svg:path")
    .attr("d", "M0,-5L10,0L0,5");

// Initialize the links
let links = svg
    .selectAll(".line")
    .data(data.links)
    .enter()
    .append("g")
    .attr("class", "line");

let lines = links
    .append("path")
    .style("stroke", "#aaa")
    .attr("fill-opacity", "0")
    .attr('marker-end', (d) => "url(#arrow)")//attach the arrow from defs
    .style("stroke-width", 2);

// Initialize the nodes
let nodes = svg
    .selectAll(".node")
    .data(data.nodes)
    .enter()
    .append("g")
    .attr("class", "node")
    .call(
        d3.drag() //sets the event listener for the specified typenames and returns the drag behavior.
            .on("start", dragstarted) //start - after a new pointer becomes active (on mousedown or touchstart).
            .on("drag", dragged) //drag - after an active pointer moves (on mousemove or touchmove).
    )
    .on("click", click);

let circles = nodes
    .append("circle")
    .attr("r", r)
    .attr("class", "circle");


let link_labels = svg
    .selectAll("link-text")
    .data(data.links)
    .enter()
    .append("text")
    .attr("dy", 5)
    .attr("text-anchor", "middle")
    .attr("class", "link-text")
    .text(function (d) {
        return d.weight
    });

let labels = nodes
    .append("text")
    .text(function (d) {
        return d.id;
    })
    .attr("text-anchor", "middle")
    .attr("y", 5);

// Let's list the force we wanna apply on the network
simulation = d3.forceSimulation(data.nodes)                 // Force algorithm is applied to data.nodes
    .force("link", d3.forceLink()                               // This force provides links between nodes
        .id(function (d) { return d.id; }).distance(120)                     // This provide  the id of a node
        .links(data.links)                                    // and this the list of links
    )
    .force("charge", d3.forceManyBody().strength(-400))         // This adds repulsion between nodes. Play with the -400 for the repulsion strength
    .force("center", d3.forceCenter(width / 2, height / 2))    // This force attracts nodes to the center of the svg area
    .on("end", ticked)
    .on("tick", ticked);

function dragstarted(event, d) {
    if (!event.active) simulation.alphaTarget(0.3).restart(); //sets the current target alpha to the specified number in the range [0,1].
    d.fy = d.y; //fx - the node’s fixed x-position. Original is null.
    d.fx = d.x; //fy - the node’s fixed y-position. Original is null.
    d3.select(this).select("circle").classed("fixed", true);
}

//When the drag gesture starts, the targeted node is fixed to the pointer
function dragged(event, d) {
    d.fx = event.x;
    d.fy = event.y;
}

function click(event, d) {
    d.fx = null;
    d.fy = null;
    d3.select(this).select("circle").classed("fixed", false);
    simulation.alpha(1).restart();
}

// This function is run at each iteration of the force algorithm, updating the nodes position.
function ticked() {
    lines
        .attr("d", function (d) {
            let SX = Math.max(r, Math.min(width - r, d.source.x));
            let SY = Math.max(r, Math.min(height - r, d.source.y));
            let TX = Math.max(r, Math.min(width - r, d.target.x));
            let TY = Math.max(r, Math.min(height - r, d.target.y));

            return `M${SX},${SY},${TX},${TY}`; //uncurved

            let dx = TX - SX;
            let dy = TY - SY;
            let dr = Math.sqrt(dx * dx + dy * dy);
            //return `M${SX},${SY}A${dr},${dr} 0 0,1 ${TX},${TY}`; //curved (need to change pointer and labels)
        });

    link_labels
        .attr("x", function (d) {
            return d.target.x - ((d.target.x - d.source.x) / 3);
        })
        .attr("y", function (d) {
            return d.target.y - ((d.target.y - d.source.y) / 3);
        });

    nodes
        .attr("cx", function (d) { return d.x = Math.max(r, Math.min(width - r, d.x)); })
        .attr("cy", function (d) { return d.y = Math.max(r, Math.min(height - r, d.y)); })
        .attr("transform", function (d) {
            return "translate(" + d.x + "," + d.y + ")";
        });
}
