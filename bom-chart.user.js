// ==UserScript==
// @name        bom-chart
// @namespace   keithmaguire.net
// @require     http://d3js.org/d3.v3.min.js
// @description put charts onto BOM
// @include     http://www.bom.gov.au/products/*
// @version     1
// @grant       none
// ==/UserScript==


var margin = 30
var chartHeight = 400 
var chartWidth = 600 

///////////////////////////////
//////////////  Getting the Data
//////////////////////////////
//// this is taken from https://groups.google.com/forum/?fromgroups=#!topic/d3-js/B967ksKxCsw
//   Where a person asked about getting data out of a html table
d3.selection.prototype.map_nested = function(f) {
  var arr = d3.range(this.length).map(function() { return []; });
  this.each(function(d, i, j) {
    arr[j].push(f.call(this, d, i, j));
  });
  return arr;
};

// Selecting the first table which appears on the observations page

var observationData = d3.select("#t1").selectAll("tbody").selectAll("tr.rowleftcolumn").selectAll("td");
var vals = observationData.map_nested(function(d, i, j) { return d3.select(this).text(); });

//turn the chart around so it read left to right, early to late
vals.reverse();

//time entries are in the format 07/11:30am 
var parseDate = d3.time.format("%I:%M %p").parse;

// mapping the object generated from the table, attaching the appropriate keys
// to each entry as well as converting the numbers to numbers rahter than strings

var obsData = vals.map(function(d) {
    return {
        date:       d[0],
        tmp:        +d[1],
        apptmp:     +d[2],
        dewpoint:   +d[3],
        relhum:     +d[4],
        deltat:     +d[5],
        dir:        d[6],
        spdkm:      +d[7],
        gustkm:     +d[8],
        spdkts:     +d[9],
        gustkts:    +d[10],
        pressqnh:   +d[11],
        pressmsl:   d[12],
        rainsince9: +d[13],
    };
});


var new_time = [];
for (var idx = 0; idx < obsData.length; idx++){
    var datum = obsData[idx];
    var time_value = datum.date;
    var time_and_date = time_value.split("/");
    var hourminute_ampm = time_and_date[1];
//    var ampm_upper = hourminute_ampm.substring(5).toUpperCase();
//   var hourMinute = hourminute_ampm.substring(0,5);
//    var formatted_time = parseDate(hourMinute + " " + ampm_upper);
    var time = {};
    time.time = hourminute_ampm;
    new_time.push(time);
};

/*
* Recursively merge properties of two objects from http://stackoverflow.com/questions/171251/how-can-i-merge-properties-of-two-javascript-objects-dynamically
*/

function MergeRecursive(obj1, obj2) {
  for (var p in obj2) {
    try {
      // Property in destination object set; update its value.
      if ( obj2[p].constructor==Object ) {
        obj1[p] = MergeRecursive(obj1[p], obj2[p]);
      } else {
        obj1[p] = obj2[p];
      }
    } catch(e) {
      // Property in destination object not set; create it and set its value.
      obj1[p] = obj2[p];
    }
  }
  return obj1;
}

MergeRecursive(obsData,new_time)

var lengthofdata = obsData.length;

//////////////////////////////
/////////// Drawing the Chart
//////////////////////////////

var x = d3.scale.linear().domain([0, 48]).range([margin + 0, chartWidth - margin])
var timeaxis = d3.time.scale().domain(["12:00 AM", "11:30 PM"]).range([margin + 0, chartWidth - margin])
var y1 = d3.scale.linear().domain([0, 50]).range([chartHeight - margin, 0 + margin])
var y2 = d3.scale.linear().domain([0, 100]).range([chartHeight - margin, 0 + margin])

//temperature hopefully never goes above 50 degrees
//humidity goes from 0 to 100 percent

//The SVG Container
var svgContainer = d3.select(".p-id").append("svg")
                                    .attr("width", chartWidth)
                                    .attr("height", chartHeight);

var g = svgContainer.append("svg:g");

//The axes

//x axis
var xaxis = d3.svg.axis()
                   .scale(timeaxis)
                   .orient("top");
                   
svgContainer.append("g")
            .attr("fill","none")
            .attr("stroke","black")
            .attr("ticks",48)
            .attr("stroke-width","0.5")
            .attr("transform", "translate(0," + (chartHeight - margin ) + ")")
            .call(xaxis);          

//tmp axis
var y1axis = d3.svg.axis()
                   .scale(y1)
                   .ticks(10)
                   .orient("left");
                 
svgContainer.append("g")
            .attr("fill","none")
            .attr("stroke","red")
            .attr("stroke-width","0.5")
            .attr("transform","translate(" + (2 + margin) + ",0)")
            .call(y1axis)
          .append("text")
            .attr("y", 6)
            .attr("transform","translate(-10, 0)")
            .attr("dy", ".71em")
            .style("text-anchor", "end")
            .text("ºC");

//humidity axis
var y2axis = d3.svg.axis()
                   .scale(y2)
                   .orient("right");

svgContainer.append("g")
            .attr("fill","none")
            .attr("stroke","blue")
            .attr("stroke-width","0.5")
            .attr("transform","translate(" + margin + ",0)")
            .call(y2axis)
          .append("text")
            .attr("y", 6)
            .attr("transform","translate(20, 0)")
            .attr("dy", ".71em")
            .style("text-anchor", "end")
            .text("%");

//the lines

//prepares the humidity line
var lineFunction = d3.svg.line()
                         .x(function(d,i) { return x(i); })
                         .y(function(d) { return y2(d.relhum); })
                         .interpolate("linear");

//actually draws the humidity line
var lineGraph = g.append("path")
                 .attr("d", lineFunction(obsData))
                 .attr("stroke", "lightskyblue")
                 .attr("opacity","0.8")
                 .attr("stroke-width", 2)
                 .attr("fill", "none");
                           
//draws circles for mouseover
g.selectAll("humidcircle")
          .data(obsData)
          .enter()
          .append("svg:circle")
          .attr("cx", function(d,i) { return x(i); })
          .attr("cy", function(d) { return y2(d.relhum); })
          .attr("r", 8)
          .attr("opacity", 0)
        .append("svg:title")
          .text(function(d){
            return d.relhum
            + "% at " 
            + d.time
           });
          
//adds the humidity onto the final value
g.selectAll("finalhumid")
          .data(obsData)
          .enter()
          .append("svg:text")
          .attr("x", x(lengthofdata-1) )
          .attr("y", y2(obsData[lengthofdata - 1].relhum))
          .attr("font-family", "serif")
          .attr("font-size", "14px")
          .attr("dy", "0.25em")
          .attr("fill","blue")
          .text(obsData[lengthofdata - 1].relhum + "%");

//prepares the temperature line
var lineFunction = d3.svg.line()
                         .x(function(d,i) { return x(i); })
                         .y(function(d) { return y1(d.tmp); })
                         .interpolate("linear");

//actually draws the temperature line
var lineGraph = g.append("path")
                 .attr("d", lineFunction(obsData))
                 .attr("stroke", "red")
                 .attr("opacity","0.8")
                 .attr("stroke-width", 2)
                 .attr("fill", "none");
                            
//draws circles for mouseover
g.selectAll("tempcircle")
          .data(obsData)
          .enter()
          .append("svg:circle")
          .attr("cx", function(d,i) { return x(i); })
          .attr("cy", function(d) { return y1(d.tmp); })
          .attr("r", 8)
          .attr("opacity", 0)
        .append("svg:title")
          .text(function(d){
          return d.tmp
            + "° at " 
            + d.time
          });

//adds the temperature onto the final value
g.selectAll("finaltemperature")
          .data(obsData)
          .enter()
          .append("svg:text")
          .attr("x", x(lengthofdata-1) )
          .attr("y", y1(obsData[lengthofdata - 1].tmp))
          .attr("font-family", "serif")
          .attr("font-size", "14px")
          .attr("dy", "0.25em")
          .attr("fill","red")
          .text(obsData[lengthofdata - 1].tmp + "°");        
