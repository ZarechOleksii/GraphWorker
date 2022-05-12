let cancel = false;
let selected = [];


function add_vertice()
{
    let id = 0;
    if (data.nodes.length > 0) {
        id = Math.max(...data.nodes.map(o => o.id));
    }
    id += 1;
    let name = "o"
    data.nodes.push({ id: id, name: name });

    svg
        .selectAll(".link-text")
        .remove();

    let new_node = svg
        .selectAll(".node")
        .data(data.nodes)
        .enter()
        .append("g")
        .attr("class", "node")
        .call(
            d3.drag()
                .on("start", dragstarted)
                .on("drag", dragged)
        )
        .on("click", click);

    nodes = new_node
        .merge(nodes)

    circles = new_node
        .append("circle")
        .attr("r", r)
        .attr("class", "circle")
        .merge(circles);

    link_labels = svg
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

    labels = new_node
        .append("text")
        .text(function (d) {
            return d.id;
        })
        .attr("text-anchor", "middle")
        .attr("y", 5)
        .merge(labels);

    simulation.nodes(data.nodes)
    simulation.alpha(0.1).restart()
}

async function add_connection() {
    clear_selected();
    enable_selection();

    const someTimeoutAction = () => {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve(add_conn_when_two_selected);
            }, 1000);
        });
    };

    do {
        let status = await someTimeoutAction();

        if (status() === true) {
            break;
        }
    }
    while (!cancel)
}

function add_conn_when_two_selected() {
    if (selected.length === 2) {
        add_connection_logic();
        return true;
    }
    return false;
}

function add_connection_logic() {
    let first_id = selected[0];
    let second_id = selected[1];
    let weight = 30;

    simulation.stop();

    data.links
        .push({
            source: first_id,
            target: second_id,
            weight: weight
        });

    svg
        .selectAll(".link-text")
        .remove();

    svg
        .selectAll(".node")
        .remove();

    let new_link = svg
        .selectAll(".line")
        .data(data.links)
        .enter()
        .append("g")
        .attr("class", "line");

    links = new_link.merge(new_link);

    lines = new_link
        .append("path")
        .style("stroke", "#aaa")
        .attr("fill-opacity", "0")
        .attr('marker-end', (d) => "url(#arrow)")//attach the arrow from defs
        .style("stroke-width", 2)
        .merge(lines);

    nodes = svg
        .selectAll(".node")
        .data(data.nodes)
        .enter()
        .append("g")
        .attr("class", "node")
        .call(
            d3.drag()
                .on("start", dragstarted)
                .on("drag", dragged)
        )
        .on("click", click);

    circles = nodes
        .append("circle")
        .attr("r", r)
        .attr("class", "circle");

    link_labels = svg
        .selectAll("link-text")
        .data(data.links)
        .enter()
        .append("text")
        .attr("dy", 5)
        .attr("text-anchor", "middle")
        .attr("class", "link-text")
        .text(function (d) {
            return d.weight
        })
        .merge(link_labels);

    labels = nodes
        .append("text")
        .text(function (d) {
            return d.id;
        })
        .attr("text-anchor", "middle")
        .attr("y", 5)
        .merge(labels);
    clear_selected()
    simulation.nodes(data.nodes)
    simulation.alpha(0.1).restart()
}

function clear_selected() {
    circles
        .classed("selected", false);
    selected = [];
    d3
        .selectAll(".node")
        .on("click", click);
}

function enable_selection() {
    d3
        .selectAll(".node")
        .on("click", select_this);
}

function select_this(event, d) {
    d3
        .select(this)
        .select(".circle")
        .classed("selected", true);

    d.fx = null;
    d.fy = null;
    d3.select(this).select("circle").classed("fixed", false);
    simulation.alpha(1).restart();

    selected.push(d.id);
}