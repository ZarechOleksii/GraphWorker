import { ReadonlyGraph } from './ReadonlyGraph.js';

export class Graph extends ReadonlyGraph {
    constructor(svg_selector, conainer_selector, data, status_bar_selector, isOriented, isWeighted) {
        super(svg_selector, conainer_selector, data, isOriented, isWeighted);

        this.selected = [];
        this.status_bar_selector = status_bar_selector;

        this.add_connection_logic = this.add_connection_logic.bind(this);
        this.remove_vertex_logic = this.remove_vertex_logic.bind(this);

        this.dijkstra_logic = this.dijkstra_logic.bind(this);

        this.dfs_logic = this.dfs_logic.bind(this);
        this.bfs_logic = this.bfs_logic.bind(this);

        this.change_weight = this.change_weight.bind(this);
        this.delete_conn = this.delete_conn.bind(this);
        this.select_this = this.select_this.bind(this);
        this.execute_when_one_selected = this.execute_when_one_selected.bind(this);
        this.execute_when_two_selected = this.execute_when_two_selected.bind(this);

        this.set_status = this.set_status.bind(this);

        this.svg
            .selectAll(".link-text")
            .on("click", this.change_weight);
    }

    // #region Graph changes

    add_vertex() {
        let vars = this;

        let id = 0;
        if (this.data.nodes.length > 0) {
            id = Math.max(...this.data.nodes.map(o => o.id));
        }
        id += 1;
        let name = "o"
        this.data.nodes.push({ id: id, name: name });

        this.svg
            .selectAll(".link-text")
            .remove();

        let new_node = this.svg
            .selectAll(".node")
            .data(this.data.nodes)
            .enter()
            .append("g")
            .attr("class", "node")
            .call(
                d3.drag()
                    .on("start", function (d, i) { vars.dragstarted(d, i, this) })
                    .on("drag", this.dragged)
            )
            .on("click", this.click);

        this.nodes = new_node
            .merge(this.nodes)

        this.circles = new_node
            .append("circle")
            .attr("r", this.r)
            .attr("class", "circle")
            .merge(this.circles);

        if (this.isWeighted) {
            this.link_labels = this.svg
                .selectAll("link-text")
                .data(this.data.links)
                .enter()
                .append("text")
                .attr("dy", 5)
                .attr("text-anchor", "middle")
                .attr("class", "link-text")
                .on("click", this.change_weight)
                .text(function (d) {
                    return d.weight
                });
        }

        this.labels = new_node
            .append("text")
            .text(function (d) {
                return d.id;
            })
            .attr("text-anchor", "middle")
            .attr("y", 5)
            .merge(this.labels);

        this.simulation.nodes(this.data.nodes)
        this.simulation.alpha(0.1).restart()

        this.set_status(`<b><p>Added vertex ${id}.</b></p>`);
    }

    add_connection_logic(first_id, second_id) {
        let vars = this;
        let weight = 30;

        if (this.data.links.find(q => q.source.id == first_id && q.target.id == second_id) != null) {
            this.set_status(`<b><p>Connection from ${first_id} to ${second_id} already exists.</b ></p>`);
            return;
        }
        else if (!this.isOriented && this.data.links.find(q => q.target.id == first_id && q.source.id == second_id) != null) {
            this.set_status(`<b><p>Connection from ${first_id} to ${second_id} already exists.</b ></p>`);
            return;
        }

        this.simulation.stop();

        this.data.links
            .push({
                source: this.data.nodes.find(q => q.id == first_id),
                target: this.data.nodes.find(q => q.id == second_id),
                weight: weight
            });

        this.svg
            .selectAll(".link-text")
            .remove();

        this.svg
            .selectAll(".node")
            .remove();

        let new_link = this.svg
            .selectAll(".line")
            .data(this.data.links)
            .enter()
            .append("g")
            .attr("class", "line");

        this.links = new_link.merge(this.links);

        this.lines = new_link
            .append("path")
            .style("stroke", "#aaa")
            .attr("fill-opacity", "0")
            .attr('marker-end', (d) => "url(#arrow)")//attach the arrow from defs
            .style("stroke-width", 2)
            .merge(this.lines);

        this.nodes = this.svg
            .selectAll(".node")
            .data(this.data.nodes)
            .enter()
            .append("g")
            .attr("class", "node")
            .call(
                d3.drag()
                    .on("start", function (d, i) { vars.dragstarted(d, i, this) })
                    .on("drag", this.dragged)
            )
            .on("click", this.click);

        this.circles = this.nodes
            .append("circle")
            .attr("r", this.r)
            .attr("class", "circle");

        this.nodes
            .filter(function (d) {
                return d.fx != null
            })
            .select("circle")
            .classed("fixed", true);

        if (this.isWeighted) {
            this.link_labels = this.svg
                .selectAll("link-text")
                .data(this.data.links)
                .enter()
                .append("text")
                .attr("dy", 5)
                .attr("text-anchor", "middle")
                .attr("class", "link-text")
                .on("click", this.change_weight)
                .text(function (d) {
                    return d.weight
                })
                .merge(this.link_labels);
        }

        this.labels = this.nodes
            .append("text")
            .text(function (d) {
                return d.id;
            })
            .attr("text-anchor", "middle")
            .attr("y", 5)
            .merge(this.labels);

        this.simulation.nodes(this.data.nodes)
        this.simulation
            .force("link", d3.forceLink()
                .id(function (d) { return d.id; }).distance(120)
                .links(this.data.links)
            );
        this.simulation.alpha(0.1).restart()
        this.set_status(`<b><p>Successfully connected ${first_id} to ${second_id}.</b ></p>`);
    }

    remove_vertex_logic(selected_id) {
        this.data.nodes = this.data.nodes.filter(q => q.id != selected_id);
        this.data.links = this.data.links.filter(q => q.source.id != selected_id && q.target.id != selected_id);

        this.svg.selectAll(".line").filter(q => q.source.id == selected_id || q.target.id == selected_id).remove();
        this.links = this.svg.selectAll(".line");
        this.lines = this.links.select("path");
        this.svg.selectAll(".node").filter(d => d.id == selected_id).remove();
        this.nodes = this.svg.selectAll(".node");
        this.circles = this.nodes.select("circle");
        if (this.isWeighted) {
            this.svg.selectAll(".link-text").filter(q => q.source.id == selected_id || q.target.id == selected_id).remove();
            this.link_labels = this.svg.selectAll(".link-text");
        }
        this.labels = this.nodes.select("text");

        this.simulation.nodes(this.data.nodes)
        this.simulation.alpha(0.1).restart()
        this.set_status(`<b><p>Successfully removed vertex ${selected_id}.</b ></p>`);
    }

    clear_graph() {
        this.data.nodes = [];
        this.data.links = [];

        this.svg.selectAll(".line").remove();
        this.links = this.svg.selectAll(".line");
        this.lines = this.links.select("path");
        this.svg.selectAll(".node").remove();
        this.nodes = this.svg.selectAll(".node");
        this.circles = this.nodes.select("circle");

        if (this.isWeighted) {
            this.svg.selectAll(".link-text").remove();
            this.link_labels = this.svg.selectAll(".link-text");
        }
        this.labels = this.nodes.select("text");

        this.simulation.nodes(this.data.nodes)
        this.simulation.alpha(0.1).restart()
        this.set_status(`<b><p>Cleared entire graph.</b ></p>`);
    }

    // #endregion

    // #region Shortest path algorithms

    dijkstra_logic(first_id, second_id) {
        let vars = this;
        let dataAlgo;

        if (this.isOriented) {
            dataAlgo = this.data.nodes.map(node => ({
                id: node.id,
                passed: false,
                weight: Infinity,
                name: node.name,
                connections: this.data.links.filter(link => link.source.id == node.id),
                pathing: []
            }));
        }
        else {
            dataAlgo = this.data.nodes.map(node => {
                let connection_copy = [...this.data.links.filter(link => link.target.id == node.id)].map(link => ({
                    target: link.source,
                    source: link.target,
                    weight: link.weight
                }));

                return ({
                    id: node.id,
                    passed: false,
                    weight: Infinity,
                    name: node.name,
                    connections: this.data.links.filter(link => link.source.id == node.id).concat(connection_copy),
                    pathing: []
                });
            });
        }

        let first = dataAlgo.find(node => node.id == first_id);
        let current = first;
        current.weight = 0;

        let text = `<b>Algorithm steps:</b><p>Set weight of all points to infinity, starting from point ${current.id}, weight 0.</p><ol>`;

        while (current != null) {
            text += `<li>Setting new weights from point ${current.id}.<ol>`;

            current.connections.forEach(function (con) {
                let secondPoint = dataAlgo.find(node => node.id == con.target.id);

                if (!secondPoint.passed) {
                    if (vars.isWeighted) {
                        if (secondPoint.weight > current.weight + con.weight) {
                            text += `<li>Setting new weight for ${secondPoint.id}: from ${secondPoint.weight} to ${current.weight} + ${con.weight} = ${current.weight + con.weight}</li>`
                            secondPoint.weight = current.weight + con.weight;
                            secondPoint.pathing = Array.from(current.pathing);
                            secondPoint.pathing.push(current.id);
                        }
                    }
                    else {
                        if (secondPoint.weight > current.weight + 1) {
                            text += `<li>Setting new weight for ${secondPoint.id}: from ${secondPoint.weight} to ${current.weight} + ${1} = ${current.weight + 1}</li>`
                            secondPoint.weight = current.weight + 1;
                            secondPoint.pathing = Array.from(current.pathing);
                            secondPoint.pathing.push(current.id);
                        }
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
                let conn = this.data.links.find(link => link.source.id == toWhere.pathing[i] && link.target.id == toWhere.pathing[i + 1]);

                if (conn === undefined && !this.isOriented) {
                    conn = this.data.links.find(link => link.target.id == toWhere.pathing[i] && link.source.id == toWhere.pathing[i + 1]);
                }

                if (vars.isWeighted) {
                    text += `<li>From ${toWhere.pathing[i]} to ${toWhere.pathing[i + 1]}: ${currWeight} + ${conn.weight} = ${currWeight += conn.weight}</li>`;
                }
                else {
                    text += `<li>From ${toWhere.pathing[i]} to ${toWhere.pathing[i + 1]}: ${currWeight} + 1 = ${currWeight += 1}</li>`;
                }
            }
            text += "</ol>";
            text = `<p><b>Shortest path from vertex ${first.id} to vertex ${toWhere.id} is ${toWhere.weight} units.</b></p>` + text;

            this.nodes
                .filter(function (d) {
                    return toWhere.pathing.includes(d.id);
                })
                .select("circle")
                .classed("result", true);

            this.lines
                .filter(function (d) {
                    for (let i = 0; i < toWhere.pathing.length - 1; i++) {
                        if (d.source.id == toWhere.pathing[i] && d.target.id == toWhere.pathing[i + 1]) {
                            return true;
                        }
                        else if (!vars.isOriented && d.target.id == toWhere.pathing[i] && d.source.id == toWhere.pathing[i + 1]) {
                            return true;
                        }
                    }
                    return false;
                })
                .style("stroke", "red");


            this.lines
                .filter(function (d) {
                    for (let i = 0; i < toWhere.pathing.length - 1; i++) {
                        if (d.source.id == toWhere.pathing[i] && d.target.id == toWhere.pathing[i + 1]) {
                            return false;
                        }
                        else if (!vars.isOriented && d.target.id == toWhere.pathing[i] && d.source.id == toWhere.pathing[i + 1]) {
                            return false;
                        }
                    }
                    return true;
                })
                .attr("stroke-opacity", "0.3");
        }
        else {
            text = `<p><b>There is no way to get from vertex ${first.id} to vertex ${toWhere.id}.</b></p>` + text;
        }

        if (this.data.links.some(link => link.weight < 0)) {
            text = '<h2><b style="color:red">Negative weights detected, the results are not guaranteed to be true!</b></h2>' + text;
        }

        this.set_status(text);
    }

    // #endregion

    // #region Search algorithms

    dfs_logic(selected_id) {
        let vars = this;
        let result = "<p><b>DFS:</b></p><table class=\"matrix-table\"><tr><th>Vertex</th><th>DFS-Number</th><th>Stack</th></tr>";
        let passed = [selected_id];
        let stack = [selected_id];
        let to_mark = [];
        let number = 1;

        let starting_data = [...this.data.links];

        if (!this.isOriented) {
            starting_data = starting_data.concat([...this.data.links].map(q => ({
                source: q.target,
                target: q.source,
                weight: q.weight
            })));
        }

        let sorted_copy = [...this.data.nodes].sort((a, b) => a.id - b.id);
        let sorted_links_copy = starting_data.sort((a, b) => {
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

        this.nodes
            .select("circle")
            .classed("result", true);

        this.lines
            .filter(function (q) {
                if (to_mark.filter(w => w.target.id == q.target.id && w.source.id == q.source.id).length == 1) {
                    return true;
                }
                else if (!vars.isOriented && to_mark.filter(w => w.target.id == q.source.id && w.source.id == q.target.id).length == 1) {
                    return true;
                }
                return false;
            })
            .style("stroke", "red");

        this.lines
            .filter(function (q) {
                if (to_mark.filter(w => w.target.id == q.target.id && w.source.id == q.source.id).length == 1) {
                    return false;
                }
                else if (!vars.isOriented && to_mark.filter(w => w.target.id == q.source.id && w.source.id == q.target.id).length == 1) {
                    return false;
                }
                return true;
            })
            .attr("stroke-opacity", "0.3");

        this.set_status(result);
    }

    bfs_logic(selected_id) {
        let vars = this;
        let result = "<p><b>BFS:</b></p><table class=\"matrix-table\"><tr><th>Vertex</th><th>BFS-Number</th><th>Queue</th></tr>";
        let passed = [selected_id];
        let queue = [selected_id];
        let to_mark = [];
        let number = 1;

        let starting_data = [...this.data.links];

        if (!this.isOriented) {
            starting_data = starting_data.concat([...this.data.links].map(q => ({
                source: q.target,
                target: q.source,
                weight: q.weight
            })));
        }

        let sorted_copy = [...this.data.nodes].sort((a, b) => a.id - b.id);
        let sorted_links_copy = starting_data.sort((a, b) => {
            if (a.source.id != b.source.id)
                return a.source.id - b.source.id;
            return a.target.id - b.target.id;
        });

        result += `<tr><td>${selected_id}</td><td>${number}</td><td>${selected_id}</td></tr>`;

        while (queue.length != 0) {
            let current = queue[0];

            let filtered = sorted_links_copy
                .filter(q => q.source.id == current && !passed.includes(q.target.id));

            if (filtered.length == 0) {
                queue.shift();
                let to_put = "Ø";
                if (queue.length != 0) {
                    to_put = queue.join(', ');
                }
                result += `<tr><td>-</td><td>-</td><td>${to_put}</td></tr>`;
            }
            else {
                let conn = filtered[0];
                number++;
                queue.push(conn.target.id);
                to_mark.push(conn);
                passed.push(conn.target.id);
                result += `<tr><td>${conn.target.id}</td><td>${number}</td><td>${queue.join(', ')}</td></tr>`;
            }

            if (queue.length == 0 && passed.length != sorted_copy.length) {
                let new_node = sorted_copy
                    .filter(q => !passed.includes(q.id))[0];

                number++;
                queue.push(new_node.id);
                passed.push(new_node.id);
                result += `<tr><td>${new_node.id}</td><td>${number}</td><td>${queue.join(', ')}</td></tr>`;
            }
        }
        result += "</table>";


        this.nodes
            .select("circle")
            .classed("result", true);

        this.lines
            .filter(function (q) {
                if (to_mark.filter(w => w.target.id == q.target.id && w.source.id == q.source.id).length == 1) {
                    return true;
                }
                else if (!vars.isOriented && to_mark.filter(w => w.target.id == q.source.id && w.source.id == q.target.id).length == 1) {
                    return true;
                }
                return false;
            })
            .style("stroke", "red");

        this.lines
            .filter(function (q) {
                if (to_mark.filter(w => w.target.id == q.target.id && w.source.id == q.source.id).length == 1) {
                    return false;
                }
                else if (!vars.isOriented && to_mark.filter(w => w.target.id == q.source.id && w.source.id == q.target.id).length == 1) {
                    return false;
                }
                return true;
            })
            .attr("stroke-opacity", "0.3");

        this.set_status(result);
    }

    // #endregion

    // #region Helpers

    execute_when_one_selected(func) {
        this.enable_selection();
        if (this.selected.length === 1) {
            func(this.selected[0]);
            return true;
        }
        return false;
    }

    execute_when_two_selected(func) {
        this.enable_selection();
        if (this.selected.length === 2) {
            func(this.selected[0], this.selected[1]);
            return true;
        }
        return false;
    }
    
    clear_result() {
        this.circles
            .classed("result", false);

        this.lines
            .attr("stroke-opacity", "1")
            .style("stroke", "#aaa");
    }

    clear_selected() {
        this.circles.classed("selected", false);
        this.selected = [];

        this.svg
            .selectAll(".node")
            .on("click", this.click);
    }

    enable_selection() {
        this.svg
            .selectAll(".node")
            .on("click", this.select_this);
    }

    enable_delete_link() {
        this.svg
            .selectAll(".line")
            .on("click", this.delete_conn);
    }

    disable_delete_link() {
        this.svg
            .selectAll(".line")
            .on("click", null);
    }

    change_weight(event, d) {
        let result = prompt("Enter new weight:");
        let parsed = parseFloat(result);

        if (isNaN(parsed)) {
            this.set_status(`Entered value is not a valid weight: ${result}`);
        }
        else {
            d.weight = parsed;

            d3.select(event.currentTarget).text(function (d) {
                return d.weight
            });
        }
    }

    delete_conn(event, d) {
        this.data.links = this.data.links.filter(q => q.source.id != d.source.id || q.target.id != d.target.id);

        d3.select(event.currentTarget).remove();

        this.svg.selectAll(".link-text").filter(q => q.source.id == d.source.id && q.target.id == d.target.id).remove();

        this.links = this.svg.selectAll(".line");
        this.lines = this.links.select("path");
        this.link_labels = this.svg.selectAll(".link-text");

        this.simulation
            .force("link", d3.forceLink()
                .id(function (d) { return d.id; }).distance(120)
                .links(this.data.links)
            );
        this.simulation.alpha(0.1).restart()
    }

    select_this(event, d) {
        if (!this.selected.includes(d.id)) {
            d3
                .select(event.currentTarget)
                .select(".circle")
                .classed("selected", true);

            d.fx = null;
            d.fy = null;
            d3.select(event.currentTarget).select("circle").classed("fixed", false);
            this.simulation.alpha(1).restart();

            this.selected.push(d.id);
        }
    }

    set_status(text) {
        $(this.status_bar_selector)[0].innerHTML = text;
    }

    // #endregion
}