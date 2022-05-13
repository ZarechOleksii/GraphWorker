let cancel = false;
let selected = [];


function add_vertice() {
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

    document.getElementById("status").innerHTML = `<b><p>Added vertex ${id}.</b></p>`;
}

async function add_connection(this_button) {
    this_button.style.backgroundColor = "green";
    clear_selected();
    clear_result();
    document.getElementById("cancel_button").disabled = false;
    enable_selection();
    document.getElementById("status").innerHTML = `<b><p>Select two points (connecting from first to second).</b></p>`;

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
    clear_selected()
    this_button.style.backgroundColor = "white";
}

async function dijkstra(this_button) {
    this_button.style.backgroundColor = "green";
    clear_selected();
    clear_result();
    document.getElementById("cancel_button").disabled = false;
    enable_selection();
    document.getElementById("status").innerHTML = `<b><p>Select two points (shortest path from first to second).</b></p>`;

    const someTimeoutAction = () => {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve(dijkstra_when_two_selected);
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
    clear_selected()
    this_button.style.backgroundColor = "white";
}

function add_conn_when_two_selected() {
    if (selected.length === 2) {
        add_connection_logic();
        return true;
    }
    return false;
}

function dijkstra_when_two_selected() {
    if (selected.length === 2) {
        dijkstra_logic();
        return true;
    }
    return false;
}

function dijkstra_logic() {
    let first_id = selected[0];
    let second_id = selected[1];

    let dataAlgo = data.nodes.map(node => ({
        id: node.id,
        passed: false,
        weight: Infinity,
        name: node.name,
        connections: data.links.filter(link => link.source.id == node.id),
        pathing: []
    }));

    let first = dataAlgo.find(node => node.id == first_id);
    let current = first;
    current.weight = 0;

    let text = `<b>Algorithm steps:</b><p>Set weight of all points to infinity, starting from point ${current.id}, weight 0.</p><ol>`;

    while (current != null) {
        text += `<li>Setting new weights from point ${current.id}.<ol>`;

        current.connections.forEach(function (con) {
            let secondPoint = dataAlgo.find(node => node.id == con.target.id);

            if (!secondPoint.passed) {
                if (secondPoint.weight > current.weight + con.weight) {
                    text += `<li>Setting new weight for ${secondPoint.id}: from ${secondPoint.weight} to ${current.weight} + ${con.weight} = ${current.weight + con.weight}</li>`
                    secondPoint.weight = current.weight + con.weight;
                    secondPoint.pathing = Array.from(current.pathing);
                    secondPoint.pathing.push(current.id);
                }
            }
        });

        current.passed = true;
        let filtered = dataAlgo
            .filter(q => !q.passed && q.weight != Infinity);

        if (filtered.length > 0) {
            current = filtered.reduce((first, second) => first.weight > second.weight ? second : first);
            text += `</ol><p>New minimal point is ${current.id}, weight ${current.weight}.</p></li>`;
        }
        else {
            text += "</ol></li></ol><p>All available points are passed</p>";
            current = null;
        }
    }

    let toWhere = dataAlgo.find(node => node.id == second_id);
    toWhere.pathing.push(toWhere.id);

    if (toWhere.weight != Infinity) {
        let currWeight = 0;

        text += "<p>Entire path summary:</p><ol>";
        for (let i = 0; i < toWhere.pathing.length - 1; i++) {
            let conn = data.links.find(link => link.source.id == toWhere.pathing[i] && link.target.id == toWhere.pathing[i + 1]);
            text += `<li>From ${toWhere.pathing[i]} to ${toWhere.pathing[i + 1]}: ${currWeight} + ${conn.weight} = ${currWeight += conn.weight}</li>`;
        }
        text += "</ol>";
        text = `<p><b>Shortest path from vertex ${first.id} to vertex ${toWhere.id} is ${toWhere.weight} units.</b></p>` + text;
        set_status(text);

        nodes
            .filter(function (d) {
                return toWhere.pathing.includes(d.id);
            })
            .select("circle")
            .classed("result", true);

        lines
            .filter(function (d) {
                for (let i = 0; i < toWhere.pathing.length - 1; i++) {
                    if (d.source.id == toWhere.pathing[i] && d.target.id == toWhere.pathing[i + 1]) {
                        return true;
                    }
                }
                return false;
            })
            .style("stroke", "red");
    }
    else {
        text = `<p><b>There is no way to get from vertex ${first.id} to vertex ${toWhere.id}.</b></p>` + text;
        set_status(text);
    }
}

function add_connection_logic() {
    let first_id = selected[0];
    let second_id = selected[1];
    let weight = 30;

    if (data.links.find(q => q.source.id == first_id && q.target.id == second_id) != null) {
        document.getElementById("status").innerHTML = `<b><p>Connection from ${first_id} to ${second_id} already exists.</b ></p>`;
        return;
    }

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

    nodes
        .filter(function (d) {
            return d.fx != null
        })
        .select("circle")
        .classed("fixed", true);

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
    simulation.nodes(data.nodes)
    simulation.alpha(0.1).restart()
    document.getElementById("status").innerHTML = `<b><p>Successfully connected ${first_id} to ${second_id}.</b ></p>`;
}

function cancel_button() {
    cancel = true;
    document.getElementById("status").innerHTML = "<b><p>Canceled operation.</b></p>";
}

function clear_selected() {
    document.getElementById("cancel_button").disabled = true;
    cancel = false;
    circles
        .classed("selected", false);
    selected = [];
    d3
        .selectAll(".node")
        .on("click", click);
}

function clear_result() {
    circles
        .classed("result", false);

    lines
        .style("stroke", "#aaa");
}

function enable_selection() {
    d3
        .selectAll(".node")
        .on("click", select_this);
}

function select_this(event, d) {
    if (!selected.includes(d.id)) {
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
}

function set_status(text) {
    document.getElementById("status").innerHTML = text;
}