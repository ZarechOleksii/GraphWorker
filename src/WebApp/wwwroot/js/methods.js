// #region vars
let cancel = false;
let selected = [];
// #endregion

// #region graph controll
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
    this_button.style.backgroundColor = "lightgreen";
    clear_selected();
    clear_result();
    document.getElementById("cancel_button").disabled = false;
    enable_selection();
    document.getElementById("status").innerHTML = `<b><p>Select two points (connecting from first to second).</b></p>`;

    const someTimeoutAction = () => {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve(execute_when_two_selected);
            }, 1000);
        });
    };

    do {
        let status = await someTimeoutAction();

        if (status(add_connection_logic) === true) {
            break;
        }
    }
    while (!cancel)
    clear_selected()
    this_button.style.backgroundColor = "white";
}

function add_connection_logic(first_id, second_id) {
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
    set_status(`<b><p>Successfully connected ${first_id} to ${second_id}.</b ></p>`);
}
// #endregion

// #region graph info
function adjacency_matrix_info() {
    let sorted_copy = [...data.nodes].sort((a, b) => a.id - b.id);
    const size = sorted_copy.length;
    let matrix = get_weighted_matrix(sorted_copy);

    for (let i = 0; i < size; i++) {
        for (let j = 0; j < size; j++) {
            if (matrix[i][j] == Infinity || matrix[i][j] == 0) {
                matrix[i][j] = 0;
            }
            else {
                matrix[i][j] = 1;
            }
        }
    }

    set_status("<p><b>Adjacency matrix:</b></p>" + matrix_to_table(sorted_copy, matrix));
}

function incidence_matrix_info() {
    let sorted_nodes_copy = [...data.nodes].sort((a, b) => a.id - b.id);
    let sorted_links_copy = [...data.links].sort((a, b) => {
        if (a.source.id != b.source.id)
            return a.source.id - b.source.id;
        return a.target.id - b.target.id;
    });

    let matrix = new Array(sorted_nodes_copy.length);

    for (let i = 0; i < sorted_nodes_copy.length; i++) {
        let vector = new Array(sorted_links_copy.length);
        vector.fill(0);
        matrix[i] = vector;
    }

    for (let i = 0; i < sorted_nodes_copy.length; i++) {
        for (let j = 0; j < sorted_links_copy.length; j++) {
            if (sorted_links_copy[j].source.id == sorted_nodes_copy[i].id) {
                matrix[i][j] = -1;
            }
            else if (sorted_links_copy[j].target.id == sorted_nodes_copy[i].id) {
                matrix[i][j] = 1;
            }
        }
    }

    let result = "<p><b>Incidence matrix:</b></p><table class=\"matrix-table\">";

    for (let i = 0; i < matrix.length; i++) {
        result += `<tr><th scope="row">${sorted_nodes_copy[i].id}</th>`;

        for (let j = 0; j < matrix[i].length; j++) {
            result += `<td>${matrix[i][j]}</td>`
        }

        result += "</tr>";
    }
    result += "</table>"

    set_status(result);
}

function weighted_matrix_info() {
    let sorted_copy = [...data.nodes].sort((a, b) => a.id - b.id);
    let matrix = get_weighted_matrix(sorted_copy);
    set_status("<p><b>Weighted matrix:</b></p>" + matrix_to_table(sorted_copy, matrix));
}

function adjacency_lists_info() {
    let result = "<p><b>Adjacency lists:</b></p>";
    let sorted_nodes_copy = [...data.nodes].sort((a, b) => a.id - b.id);
    let sorted_links_copy = [...data.links].sort((a, b) => {
        if (a.source.id != b.source.id)
            return a.source.id - b.source.id;
        return a.target.id - b.target.id;
    });

    for (let i = 0; i < sorted_nodes_copy.length; i++) {
        result += "<div class=\"list\">";
        result += `<div class="smallbox">${sorted_nodes_copy[i].id}</div>`;

        sorted_links_copy
            .filter(q => q.source.id == sorted_nodes_copy[i].id)
            .forEach(q => {
                result += `<img src="/images/svg/arrow-right.svg" alt="arrow" style="width:60px"/><div class="microbox">ID:${q.target.id}</div><div class="microbox">${q.weight}</div>`;
            });

        result += "</div>";
    };

    set_status(result);
}

function edges_list_info() {
    let sorted_links_copy = [...data.links].sort((a, b) => {
        if (a.source.id != b.source.id)
            return a.source.id - b.source.id;
        return a.target.id - b.target.id;
    });

    let text = "<p><b>Edges list:</b></p><table class=\"matrix-table\"><tr><th>From</th><th>To</th><th>Weight</th></tr>";

    sorted_links_copy.forEach(q => {
        text += `<tr><td>${q.source.id}</td><td>${q.target.id}</td><td>${q.weight}</td></tr>`;
    });
    text += "</table>";

    set_status(text);
}
// #endregion

// #region shortest path
async function dijkstra(this_button) {
    this_button.style.backgroundColor = "lightgreen";
    clear_selected();
    clear_result();
    document.getElementById("cancel_button").disabled = false;
    enable_selection();
    document.getElementById("status").innerHTML = `<b><p>Select two points (shortest path from first to second).</b></p>`;

    const someTimeoutAction = () => {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve(execute_when_two_selected);
            }, 1000);
        });
    };

    do {
        let status = await someTimeoutAction();

        if (status(dijkstra_logic) === true) {
            break;
        }
    }
    while (!cancel)
    clear_selected()
    this_button.style.backgroundColor = "white";
}

function dijkstra_logic(first_id, second_id) {

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


        lines
            .filter(function (d) {
                for (let i = 0; i < toWhere.pathing.length - 1; i++) {
                    if (d.source.id == toWhere.pathing[i] && d.target.id == toWhere.pathing[i + 1]) {
                        return false;
                    }
                }
                return true;
            })
            .attr("stroke-opacity", "0.3");
    }
    else {
        text = `<p><b>There is no way to get from vertex ${first.id} to vertex ${toWhere.id}.</b></p>` + text;
        set_status(text);
    }
}

function floyd() {
    let result = "";
    let sorted_copy = [...data.nodes].sort((a, b) => a.id - b.id);
    const size = sorted_copy.length;
    let matrix = get_weighted_matrix(sorted_copy);
    
    result += "<p>Our initial distance matrix: </p>" + matrix_to_table(sorted_copy, matrix) + "<p>Steps: </p><ol>";

    for (let i = 0; i < size; i++) {
        for (let j = 0; j < size; j++) {
            for (let q = 0; q < size; q++) {
                if (matrix[j][q] > matrix[j][i] + matrix[i][q]) {
                    matrix[j][q] = matrix[j][i] + matrix[i][q];
                }
            }
        }
        result += `<li>${matrix_to_table(sorted_copy, matrix)}</li>`;
    }

    result = "<p><b>Final result (shortest distance matrix):</b></p>" + matrix_to_table(sorted_copy, matrix) + result + "</ol>";

    set_status(result);
}
// #endregion

// #region search algorithms

async function depth_first_search(this_button){
    this_button.style.backgroundColor = "lightgreen";
    clear_selected();
    clear_result();
    document.getElementById("cancel_button").disabled = false;
    enable_selection();
    document.getElementById("status").innerHTML = `<b><p>Select starting point:</b></p>`;

    const someTimeoutAction = () => {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve(execute_when_one_selected);
            }, 1000);
        });
    };

    do {
        let status = await someTimeoutAction();

        if (status(dfs_logic) === true) {
            break;
        }
    }
    while (!cancel)
    clear_selected()
    this_button.style.backgroundColor = "white";
}

function dfs_logic(selected_id) {
    let result = "<p><b>DFS:</b></p><table class=\"matrix-table\"><tr><th>Vertex</th><th>DFS-Number</th><th>Stack</th></tr>";
    let passed = [selected_id];
    let stack = [selected_id];
    let to_mark = [];
    let number = 1;

    let sorted_copy = [...data.nodes].sort((a, b) => a.id - b.id);
    let sorted_links_copy = [...data.links].sort((a, b) => {
        if (a.source.id != b.source.id)
            return a.source.id - b.source.id;
        return a.target.id - b.target.id;
    });

    result += `<tr><td>${selected_id}</td><td>${number}</td><td>${selected_id}</td></tr>`;

    while (stack.length != 0) {
        let current = stack[stack.length - 1];

        let filtered = sorted_links_copy
            .filter(q => q.source.id == current && !passed.includes(q.target.id));

        if (filtered.length == 0) {
            stack.pop();
            let to_put = "Ø";
            if (stack.length != 0) {
                to_put = stack.join(', ');
            }
            result += `<tr><td>-</td><td>-</td><td>${to_put}</td></tr>`;
        }
        else {
            let conn = filtered[0];
            number++;
            stack.push(conn.target.id);
            to_mark.push(conn);
            passed.push(conn.target.id);
            result += `<tr><td>${conn.target.id}</td><td>${number}</td><td>${stack.join(', ')}</td></tr>`;
        }

        if (stack.length == 0 && passed.length != sorted_copy.length) {
            let new_node = sorted_copy
                .filter(q => !passed.includes(q.id))[0];

            number++;
            stack.push(new_node.id);
            passed.push(new_node.id);
            result += `<tr><td>${new_node.id}</td><td>${number}</td><td>${stack.join(', ')}</td></tr>`;
        }
    }
    result += "</table>";


    nodes
        .select("circle")
        .classed("result", true);

    lines
        .filter(function (q) {
            if (to_mark.filter(w => w.target.id == q.target.id && w.source.id == q.source.id).length == 1) {
                return true;
            }
            return false;
        })
        .style("stroke", "red");

    lines
        .filter(function (q) {
            if (to_mark.filter(w => w.target.id == q.target.id && w.source.id == q.source.id).length == 1) {
                return false;
            }
            return true;
        })
        .attr("stroke-opacity", "0.3");

    set_status(result);
}

// #endregion

//#region helper funcs
function execute_when_one_selected(func) {
    if (selected.length === 1) {
        func(selected[0]);
        return true;
    }
    return false;
}

function execute_when_two_selected(func) {
    if (selected.length === 2) {
        func(selected[0], selected[1]);
        return true;
    }
    return false;
}

function get_weighted_matrix(sorted_nodes) {
    const size = sorted_nodes.length;
    let matrix = new Array(size);

    for (var i = 0; i < size; i++) {
        let vector = new Array(size);
        vector.fill(Infinity);
        matrix[i] = vector;
    }

    for (var i = 0; i < size; i++) {
        for (var j = 0; j < size; j++) {
            if (i == j) {
                matrix[i][j] = 0;
            }
        }
    }

    for (let i = 0; i < size; i++) {
        for (let j = 0; j < size; j++) {
            if (data.links.some(q => q.source.id == sorted_nodes[i].id && q.target.id == sorted_nodes[j].id)) {
                matrix[i][j] = data.links.find(q => q.source.id == sorted_nodes[i].id && q.target.id == sorted_nodes[j].id).weight;
            }
        }
    }

    return matrix;
}

function matrix_to_table(sorted_nodes, matrix) {
    let table = '<table class="matrix-table"><tr><td></td>';

    sorted_nodes.forEach(q => {
        table += `<th scope="col">${q.id}</th>`;
    });

    table += "</tr>";

    for (let i = 0; i < sorted_nodes.length; i++) {
        table += `<tr><th scope="row">${sorted_nodes[i].id}</th>`;

        matrix[i].forEach(q => {
            if (q == Infinity) {
                table += "<td>∞</td>";
            }
            else {
                table += `<td>${q}</td>`;
            }
        });

        table += "</tr>";
    }

    table += "</table>";
    return table;
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
        .attr("stroke-opacity", "1")
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
//#endregion