var w = window.innerWidth;
var h = window.innerHeight;

var width = w,
    height = h-150;

//Map projection
//Map projection
var projection = d3.geoAlbersUsa()
    .scale(w)
    .translate([width / 2, height / 2]) //translate to center the map in view

//Generate paths based on projection
var path = d3.geoPath()
    .projection(projection);

var svg = d3.select("body").append("svg")
    .attr("width", width)
    .attr("height", height);

//Group for the map features
var features = svg.append("g")
    .attr("class", "features");

var radius = d3.scaleSqrt()
    .domain([0, 1e6])
    .range([0, 18]);

var rscale = d3.scaleSqrt()
    .domain([0, 410])
    .range([1, 20])

var tooltip = d3.select('body')
    .append('div')
    .style('position', 'absolute')
    .style('padding', '0 10px')
    .style('background', 'white')
    .style('opacity', 0);

var focusedBubble = null;

d3.queue()
    .defer(d3.csv, 'data/SlateGunDeaths.csv')
    .await(ready)

function ready(error, gundeaths) {
    if (error) return console.log(error); //unknown error, check the console
    var gdsummary = d3.nest()
        .key(function (d) { return d.state; })
        .key(function (d) { return d.city; })
        .rollup(function (v) {
            return {
                count: v.length,
                lat: d3.mean(v, function (d) { return d.lat; }),
                lng: d3.mean(v, function (d) { return d.lng; }),
                fcount: d3.sum(v.filter(function (d) { return d.gender == 'F' }), function (d) { return 1; }),
                mcount: d3.sum(v.filter(function (d) { return d.gender == 'M' }), function (d) { return 1; })
            };
        })
        .entries(gundeaths);

    var gdcity = []
    gdsummary.forEach(d => {
        d.values.forEach(ele => {
            gdcity.push({
                state: d.key,
                city: ele.key,
                count: ele.value.count,
                lat: ele.value.lat,
                lng: ele.value.lng,
                fcount: ele.value.fcount,
                mcount: ele.value.mcount
            });
        });
    });

    drawmainmap(gdcity)
};

function drawmainmap(gundeaths) {
    // var div = d3.select("body").append("div")
    //     .attr("class", "tooltip")
    //     .style("opacity", 0);

    var deaths = features.selectAll('.bubble')
        .data(gundeaths.sort(function (a, b) { return b.count - a.count; }))

    deaths.enter().append('circle')
        .attr("class", "bubble")
        .attr('r', function (d) {
            return rscale(d.count);
        })
        .attr('cx', function (d) {
            var coords = projection([d.lng, d.lat])
            if (coords == null) {
                return 42.570186;
            } else {
                return coords[0];
            }
        })
        .attr('cy', function (d) {
            var coords = projection([d.lng, d.lat])
            if (coords == null) {
                return 42.570186;
            } else {
                return coords[1];
            }
        });
    // .on("mouseover", function (d) {
    //     div.transition()
    //         .duration(200)
    //         .style("opacity", .9);
    //     div.html("<strong>" + d.city + "</strong><br/>" + "Female: " + d.fcount + "<br/>" + "Male: " + d.mcount)
    //         .style("left", (d3.event.pageX) + "px")
    //         .style("top", (d3.event.pageY - 28) + "px");
    // })
    // .on("mouseout", function (d) {
    //     div.transition()
    //         .duration(500)
    //         .style("opacity", 0);
    // });

    // deaths.exit().remove();
}

d3.json("data/us-states.topojson", function (error, geodata) {
    if (error) return console.error(error);

    // console.log(us);

    features.selectAll("path")
        .data(topojson.feature(geodata, geodata.objects.collection).features) //generate features from TopoJSON
        .enter()
        .append("path")
        .attr('class', 'land')
        .attr("d", path)
    // .on("click",clicked)

    // svg.append("path")
    //     .datum(topojson.feature(us, us.objects.nation))
    //     .attr("class", "land")
    //     .attr("d", path);

    // svg.append("path")
    //     .datum(topojson.mesh(us, us.objects.states, function (a, b) { return a !== b; }))
    //     .attr("class", "border border--state")
    //     .attr("d", path);

    // svg.append("g")
    //     .attr("class", "bubble")
    //     .selectAll("circle")
    //     .data(topojson.feature(us, us.objects.counties).features
    //         .sort(function (a, b) { return b.properties.population - a.properties.population; }))
    //     .enter().append("circle")
    //     .attr("transform", function (d) {
    //         return "translate(" + path.centroid(d) + ")";
    //     })
    //     .attr("r", function (d) { return radius(d.properties.population); })

    // .on('click', function (d) {
    //     var current = d3.select(this);
    //     console.log(current);

    //     if (focusedBubble) {
    //         focusedBubble.transition().duration(1000)
    //             .style('fill-opacity', .5)
    //             .attr("r", function (d) { return radius(d.properties.population); })
    //             .attr("transform", function (d) {
    //                 return "translate(" + path.centroid(d) + ")";
    //             });
    //     }
    //     if (current.attr("r") > 100) {
    //         console.log("true");
    //         current.transition().duration(1000)
    //             .style('fill-opacity', .5)
    //             .attr("r", function (d) { return radius(d.properties.population); })
    //             .attr("transform", function (d) {
    //                 return "translate(" + path.centroid(d) + ")";
    //             });
    //     } else {
    //         focusedBubble = current;

    //         // tooltip.transition().duration(2000)
    //         //     .style('opacity', .9)

    //         // tooltip.html(
    //         //     '<div style="font-size: 1rem; font-weight: bold">' +
    //         //     '&deg;</div>'
    //         // )
    //         //     .style('left', (d3.event.pageX - 35) + 'px')
    //         //     .style('top', (d3.event.pageY - 30) + 'px')

    //         current.
    //             transition().duration(1000)
    //             .style('fill', 'black')
    //             .style('fill-opacity', 1)
    //             .attr("r", function (d) { return 200; })
    //             .attr("transform", function (d) {
    //                 return "translate(" + [width / 2, height / 2] + ")";
    //             })
    //     }

    //     // .style('stroke-width', '3px')
    //     // tempColor = this.style.fill;
    //     // d3.select(this)
    //     //     .style('fill', 'yellow')
    // })

    // .on('mouseover', function (d) {
    //     tooltip.transition()
    //         .style('opacity', .9)

    //     tooltip.html(
    //         '<div style="font-size: 1rem; font-weight: bold">' +
    //         '&deg;</div>'
    //     )
    //         .style('left', (d3.event.pageX - 35) + 'px')
    //         .style('top', (d3.event.pageY - 30) + 'px')
    // })

    // .on('mouseout', function (d) {
    //     tooltip.html('');
    // });

});

var legend = svg.append("g")
    .attr("class", "legend")
    .attr("transform", "translate(" + (width - 50) + "," + (height - 20) + ")")
    .selectAll("g")
    .data([1, 100, 400])
    .enter().append("g");

legend.append("circle")
    .attr("cy", function (d) { return -rscale(d); })
    .attr("r", rscale);

legend.append("text")
    .attr("y", function (d) { return -2 * rscale(d); })
    .attr("dy", "1.3em")
    .text(d3.format(".1s"));