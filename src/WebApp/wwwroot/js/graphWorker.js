import { Graph } from './Graph.js';

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
            "weight": 92
        },
        {
            "source": 4,
            "target": 5,
            "weight": 93
        },
        {
            "source": 4,
            "target": 9,
            "weight": 94
        },
        {
            "source": 5,
            "target": 10,
            "weight": 95
        },
        {
            "source": 11,
            "target": 12,
            "weight": 96
        },
        {
            "source": 9,
            "target": 11,
            "weight": 97
        },
        {
            "source": 8,
            "target": 12,
            "weight": 98
        },
        {
            "source": 7,
            "target": 12,
            "weight": 99
        }
    ]
};

let graph = new Graph('#graph', '.graph-container', data, '#status', true, true);
let deleting = false;
let cancel_add_con = true;
let cancel_rem_ver = true;
let cancel_dijkstra = true;
let cancel_dfs = true;
let cancel_bfs = true;
let cancel_button = document.getElementById("cancel_button");

// #region Upper buttons

window.cancel_button = () => {
    cancel_action();
    set_status("<b><p>Canceled operation.</b></p>");
}

window.clear_result = () => {
    graph.clear_result();
}

// #endregion

// #region Graph control buttons

window.add_vertex = () => {
    cancel_action();
    graph.clear_result();
    graph.add_vertex();
}

window.add_connection = async (this_button) => {
    selected_action(this_button, async function () {
        cancel_add_con = false;
        set_status(`<b><p>Select two points (connecting from first to second).</b></p>`);

        do {
            let status = await wait_for(graph.execute_when_two_selected);

            if (status(graph.add_connection_logic) === true) {
                break;
            }
        }
        while (!cancel_add_con);
        cancel_add_con = true;
    });
}

window.remove_vertex = async (this_button) => {
    selected_action(this_button, async function () {
        cancel_rem_ver = false;
        set_status(`<b><p>Select vertex to remove</b></p>`);

        do {
            let status = await wait_for(graph.execute_when_one_selected);

            if (status(graph.remove_vertex_logic) === true) {
                break;
            }
        }
        while (!cancel_rem_ver);
        cancel_rem_ver = true;
    });
}

window.remove_connection = async (this_button) => {
    deleting = !deleting;

    if (deleting) {
        this_button.style.backgroundColor = "lightgreen";
        graph.enable_delete_link();
        this_button.innerText = "Stop deleting"
    }
    else {
        this_button.style.backgroundColor = "white";
        graph.disable_delete_link();
        this_button.innerText = "Remove connection"
    }
}

window.clear_graph = () => {
    cancel_action();
    graph.clear_graph();
}

// #endregion

// #region Graph info buttons

window.adjacency_matrix_info = () => {
    let sorted_copy = [...graph.data.nodes].sort((a, b) => a.id - b.id);
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

window.incidence_matrix_info = () => {
    let sorted_nodes_copy = [...graph.data.nodes].sort((a, b) => a.id - b.id);
    let sorted_links_copy = [...graph.data.links].sort((a, b) => {
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
                if (graph.isOriented) {
                    matrix[i][j] = -1;
                }
                else {
                    matrix[i][j] = 1;
                }
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

window.weighted_matrix_info = () => {
    let sorted_copy = [...graph.data.nodes].sort((a, b) => a.id - b.id);
    let matrix = get_weighted_matrix(sorted_copy);
    set_status("<p><b>Weighted matrix:</b></p>" + matrix_to_table(sorted_copy, matrix));
}

window.adjacency_lists_info = () => {
    let starting_data = [...graph.data.links];

    if (!graph.isOriented) {
        starting_data = starting_data.concat([...graph.data.links].map(q => ({
            source: q.target,
            target: q.source,
            weight: q.weight
        })));
    }

    let result = "<p><b>Adjacency lists:</b></p>";
    let sorted_nodes_copy = [...graph.data.nodes].sort((a, b) => a.id - b.id);
    let sorted_links_copy = starting_data.sort((a, b) => {
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

window.edges_list_info = () => {
    let starting_data = [...graph.data.links];

    /*
    if (!graph.isOriented) {
        starting_data = starting_data.concat([...graph.data.links].map(q => ({
            source: q.target,
            target: q.source,
            weight: q.weight
        })));
    }*/

    let sorted_links_copy = starting_data.sort((a, b) => {
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

// #region Shortest path buttons

window.dijkstra = async (this_button) => {
    selected_action(this_button, async function () {
        cancel_dijkstra = false;
        set_status(`<b><p>Select two points (shortest path from first to second).</b></p>`);

        do {
            let status = await wait_for(graph.execute_when_two_selected);

            if (status(graph.dijkstra_logic) === true) {
                break;
            }
        }
        while (!cancel_dijkstra);
        cancel_dijkstra = true;
    });
}

window.floyd = () => {
    let result = "";
    let sorted_copy = [...graph.data.nodes].sort((a, b) => a.id - b.id);
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

    if (graph.data.links.some(link => link.weight < 0)) {
        result = '<h2><b style="color:red">Negative weights detected, the results are not guaranteed to be true!</b></h2>' + result;
    }

    set_status(result);
}

// #endregion

// #region Search buttons

window.breadth_first_search = async (this_button) => {
    selected_action(this_button, async function () {
        cancel_bfs = false;
        set_status(`<b><p>Select starting point:</b></p>`);

        do {
            let status = await wait_for(graph.execute_when_one_selected);

            if (status(graph.bfs_logic) === true) {
                break;
            }
        }
        while (!cancel_bfs);
        cancel_bfs = true;
    });
}

window.depth_first_search = async (this_button) => {
    selected_action(this_button, async function () {
        cancel_dfs = false;
        set_status(`<b><p>Select starting point:</b></p>`);

        do {
            let status = await wait_for(graph.execute_when_one_selected);

            if (status(graph.dfs_logic) === true) {
                break;
            }
        }
        while (!cancel_dfs);
        cancel_dfs = true;
    });
}

// #endregion

// #region Helper functions

async function selected_action(button, action) {
    cancel_action();
    graph.clear_result();
    button.style.backgroundColor = "lightgreen";
    cancel_button.disabled = false;
    graph.enable_selection();

    await action();

    graph.clear_selected();
    button.style.backgroundColor = "white";

    if (cancel_add_con && cancel_rem_ver && cancel_dijkstra && cancel_bfs && cancel_dfs) {
        cancel_button.disabled = true;
    }
}

function cancel_action() {
    cancel_add_con = true;
    cancel_rem_ver = true;
    cancel_dijkstra = true;
    cancel_dfs = true;
    cancel_bfs = true;
    graph.clear_selected();
}

async function wait_for(action) {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve(action);
        }, 100);
    });
}

function set_status(text) {
    document.getElementById("status").innerHTML = text;
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
            if (graph.data.links.some(q => q.source.id == sorted_nodes[i].id && q.target.id == sorted_nodes[j].id)) {
                matrix[i][j] = graph.data.links.find(q => q.source.id == sorted_nodes[i].id && q.target.id == sorted_nodes[j].id).weight;

                if (!graph.isOriented) {
                    matrix[j][i] = graph.data.links.find(q => q.source.id == sorted_nodes[i].id && q.target.id == sorted_nodes[j].id).weight;
                }
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

// #endregion