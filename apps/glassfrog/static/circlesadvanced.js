var divName = "circleschart";

function getGraphSize(divGraphName, graphsPerPage) {
  var position = $("#" + divGraphName).position();
  var margin = {
    top: 20,
    right: 40,
    bottom: 20,
    left: 40
  };
  var width = parseInt((document.body.offsetWidth - margin.left - margin.right - position.left) / graphsPerPage);
  var height = parseInt(window.innerHeight - margin.top - margin.bottom - position.top);
  return {
    "margin": margin,
    "width": width - (graphsPerPage - 1) * 80,
    "height": height - 80
  };
}

function draw(data) {
  var sizes = getGraphSize(divName, 1);
  drawWithParameters(data, divName, sizes["margin"], sizes["width"], sizes["height"]);
}

function drawWithParameters(data, divGraphName, margin, width, height) {
  var w = width,
    h = height,
    x = d3.scale.linear().range([0, w]),
    y = d3.scale.linear().range([0, h]),
    color = d3.scale.category20c(),
    root,
    node;

  var treemap = d3.layout.treemap()
    .round(false)
    .size([w, h])
    .sticky(true)
    .value(function(d) {
      return d.size;
    });

  var svg = d3.select("#" + divGraphName).append("div")
    .attr("class", "loc")
    .attr("id", "d3graph")
    .style("width", w + "px")
    .style("height", h + "px")
    .append("svg:svg")
    .attr("width", w)
    .attr("height", h)
    .append("svg:g")
    .attr("transform", "translate(.5,.5)");

  node = root = data;

  var nodes = treemap.nodes(root)
    .filter(function(d) {
      return !d.children;
    });

  var parents = treemap.nodes(root)
    .filter(function(d) {
      return d.children && d.children.length > 0 && d.depth > 0;
    });

  var cell = svg.selectAll("g")
    .data(nodes)
    .enter().append("svg:g")
    .attr("class", "loc cell child")
    .attr("transform", function(d) {
      return "translate(" + d.x + "," + d.y + ")";
    })
    .on("click", function(d) {
      return zoom(node == d.parent ? root : d.parent);
    });

  cell.append("svg:rect")
    .attr("width", function(d) {
      return d.dx - 1;
    })
    .attr("height", function(d) {
      return d.dy - 1;
    })
    .style("fill", function(d) {
      return color(d.parent.name);
    });

  cell.append("svg:text")
    .attr("x", function(d) {
      return d.dx / 2;
    })
    .attr("y", function(d) {
      return d.dy / 2;
    })
    .attr("dy", ".35em")
    .attr("text-anchor", "middle")
    .text(function(d) {
      return d.name;
    })
    .style("opacity", 0);
  //.style("opacity", function(d) { d.w = this.getComputedTextLength(); return d.dx > d.w ? 1 : 0; });

  var parentCell = svg.selectAll("g.parentCell")
    .data(parents)
    .enter().append("svg:g")
    .attr("class", "loc cell parent");

  parentCell.append("svg:text")
    .text(function(d) {
      return d.name;
    })
    .attr("x", function(d) {
      return d.x + (d.dx / 2);
    })
    .attr("y", function(d) {
      return d.y + (d.dy / 2);
    })
    .attr("text-anchor", "middle")
    .style("font-size", "8px"); // initial guess
  // .style("font-size", function (d) { return Math.min(48, (d.dx - 8) / this.getComputedTextLength() * 24) + "px"; });

  d3.select(window).on("click", function() {
    zoom(root);
  });

  d3.select("#unit").on("change", function() {
    treemap.value(this.value == "size" ? size : density).nodes(root);
    zoom(node);
  });

  function size(d) {
    return d.size;
  }

  function density(d) {
    return d.density;
  }

  function zoom(d) {
    var kx = w / d.dx,
      ky = h / d.dy;
    x.domain([d.x, d.x + d.dx]);
    y.domain([d.y, d.y + d.dy]);

    var t = svg.selectAll("g.loc.cell.child").transition()
      .duration(d3.event.altKey ? 7500 : 750)
      .attr("transform", function(d) {
        return "translate(" + x(d.x) + "," + y(d.y) + ")";
      });

    t.select("rect")
      .attr("width", function(d) {
        return kx * d.dx - 1;
      })
      .attr("height", function(d) {
        return ky * d.dy - 1;
      });

    t.select("text")
      .attr("x", function(d) {
        return kx * d.dx / 2;
      })
      .attr("y", function(d) {
        return ky * d.dy / 2;
      })
      .style("opacity", d == root ? 0 : 1);

    var t1 = svg.selectAll("g.loc.cell.parent").transition()
      .duration(d3.event.altKey ? 7500 : 750)
      .attr("transform", function(d) {
        return "translate(" + x(d.x) + "," + y(d.y) + ")";
      });

    t1.select("text")
      .attr("x", function(d) {
        return kx * d.dx / 2;
      })
      .attr("y", function(d) {
        return ky * d.dy / 2;
      })
      .style("opacity", d == root ? 1 : 0);

    node = d;
    d3.event.stopPropagation();
  }
}
