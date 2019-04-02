var w = window.innerWidth;
var h = window.innerHeight;

var width = w,
    height = h - 150;

const bubbleOpacity = 1;
const hoverBubbleOpacity = .3;

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

var bub = svg.append("g")
    .attr("class", "bubbles");

var radius = d3.scaleSqrt()
    .domain([0, 1e6])
    .range([0, 18]);

var rscale = d3.scaleSqrt()
    .domain([0, 410])
    .range([1, 25])

var tooltip = d3.select('body')
    .append('div')
    .attr("class", "tooltip")
    .style('position', 'absolute')
    .style('padding', '10px 10px 10px 10px')
    .style('visibility', 'hidden');

var focusedBubble = null;

// Extending d3 functionalities to move to back and front elements
d3.selection.prototype.moveToFront = function() {
    // el = d3.select(this).node();
    return this.each(function(){
      this.parentNode.appendChild(this);
    });
};

d3.selection.prototype.moveToBack = function() {  
    return this.each(function() { 
        // console.log(d3.select(this).parentNode)
        var firstChild = this.parentNode.firstChild; 
        if (firstChild) { 
            this.parentNode.insertBefore(this, firstChild); 
        } 
    });
};

d3.queue()
    .defer(d3.csv, 'data/SlateGunDeaths.csv')
    .await(ready)

function ready(error, gundeaths) {
    if (error) return console.log(error); //unknown error, check the console
    var gdsummary = d3.nest()
        .key(function (d) { return d.state; })
        .key(function (d) { return d.city; })
        .rollup(function (v) {
            if (d3.mean(v, function (d) { return d.lat; }) == undefined) {
                console.log(v)
            }
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

    var deaths = bub.selectAll('.bubble')
        .data(gundeaths.sort(function (a, b) { return b.count - a.count; }))

    deaths.enter().append('circle')
        .attr("class", "bubble")
        .attr('r', function (d) {
            return rscale(d.count);
        })
        .attr('cx', function (d) {
            return projection([d.lng, d.lat])[0];

        })
        .attr('cy', function (d) {
            return projection([d.lng, d.lat])[1];
        })

        .on('click', function (d) {
            var current = d3.select(this);
            current.moveToFront();
            // If there is a focused bubble
            if (focusedBubble) {
                focusedBubble.moveToBack();
                focusedBubble.transition().duration(1000)
                    .style('fill-opacity', .5)
                    .attr('r', function (d) {
                        return rscale(d.count);
                    })
                    .attr('cx', function (d) {
                        return projection([d.lng, d.lat])[0];
            
                    })
                    .attr('cy', function (d) {
                        return projection([d.lng, d.lat])[1];
                    });

            }
            // If the current selected bubbled is focused
            if (current.attr("data-foc") === 'true') {
                current.attr("data-foc","false");
                current.moveToBack();
                current.transition().duration(1000)
                    .style('fill-opacity', .5)
                    .attr('r', function (d) {
                        return rscale(d.count);
                    })
                    .attr('cx', function (d) {
                        return projection([d.lng, d.lat])[0];
                    })
                    .attr('cy', function (d) {
                        return projection([d.lng, d.lat])[1];
                    });
            } else { // If no one is selected
                focusedBubble = current;
                current.
                    transition().duration(1000)
                    .style('fill', 'black')
                    .style('fill-opacity', 1)
                    .attr('data-foc', "true")
                    .attr("r", function (d) { return width/10+rscale(d.count)*5; })
                    .attr('cx', function (d) {
                        return width/2;
                    })
                    .attr('cy', function (d) {
                        return height/2;
                    })
            }

            // .style('stroke-width', '3px')
            // tempColor = this.style.fill;
            // d3.select(this)
            //     .style('fill', 'yellow')
        })

        .on('mouseover', function (d) {
            var current = d3.select(this);
            current.
                attr('opacity',hoverBubbleOpacity);

            // console.log(this)
            // console.log(d3.select(this))
            // console.log(d)
            tooltip.transition()
                .style('visibility', "visible");

            tooltip.html(
                `<div style="font-size: 1rem; font-weight: bold">${d.city} - ${d.state}</div>
                
                Deaths: ${d.count} (<font color="#f47f8b">${d.fcount}</font> | <font color="#4286f4">${d.mcount}</font>)
                <br>
                `
            );
            
            if(current.attr('data-foc') == 'true'){
                tooltip
                    .style("left", (width/2-70) + "px")		
                    .style("top", (height/6) + "px");
            } else {
                tooltip
                    .style("left", (d3.event.pageX+20) + "px")		
                    .style("top", (d3.event.pageY - 28) + "px");
            }

        })
    
        .on('mouseout', function (d) {
            d3.select(this)
                .attr('opacity',bubbleOpacity);
                
            tooltip.style('visibility','hidden');
        });

}

d3.json("data/us-states.topojson", function (error, geodata) {
    if (error) return console.error(error);

    features.selectAll("path")
        .data(topojson.feature(geodata, geodata.objects.collection).features) //generate features from TopoJSON
        .enter()
        .append("path")
        .attr('class', 'land')
        .attr("d", path)

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