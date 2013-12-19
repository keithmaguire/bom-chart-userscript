// ==UserScript==
// @name        bom-chart-json
// @namespace   keithmaguire.net
// @require     http://d3js.org/d3.v3.min.js
// @require     http://code.jquery.com/jquery-1.9.0.min.js
// @description put charts onto BOM using the observations json feed
// @include     http://www.bom.gov.au/products/*
// @version     1
// @grant       none
// ==/UserScript==

$('head').append("<link href='http://www.bom.gov.au/css/weather/gfe.css' type='text/css' rel='stylesheet'>");

///////Create a div to put the chart into
$('<div id="obs_chart"></div>').insertBefore('.p-id');


//getting the URL for the json file attached to the observations

var current = window.location + "",
    url_parts = current.split("products"),
    base_bom_url = url_parts[0], 
    product_id_url = url_parts[1], 
    htmlurl = base_bom_url + "fwo" + product_id_url,
    jsonurl = htmlurl.replace("shtml", "json");
console.log(jsonurl);

d3.json(jsonurl, function (json) {


//forecast url
    var state_uppercase = json.observations.header[0].state_time_zone,
        state = state_uppercase.toLowerCase(),
        town_titlecase = json.observations.header[0].name,
        town = town_titlecase.split(" ")[0].toLowerCase(),
        forecast_url = base_bom_url + state + "/forecasts/" + town + ".shtml";
        
    console.log(forecast_url);
    
    
    var obsData = json.observations.data;

//so chart reads from left to right
    obsData.reverse();

    var margin = 30,
        chartHeight = 400,
        chartWidth = 793;

//in the data change local_date_time_full from a string to a date/time value
    var parseDate = d3.time.format("%Y%m%d%H%M%S").parse;
    obsData.forEach(function (d) {
        d.local_date_time_full = parseDate(d.local_date_time_full);
    });

    var lengthofdata = obsData.length;

//////////////////////////////
/////////// Drawing the Chart
//////////////////////////////

///////////////The scales
    var x = d3.time.scale().domain(d3.extent(obsData, function(d) {return d.local_date_time_full}))
                       .range([margin + 0, chartWidth - margin]);
//temperature - hopefully never goes above 50 degrees
    var y1 = d3.scale.linear().domain([0, 50]).range([chartHeight - margin, 0 + margin]);
//humidity goes from 0 to 100 percent
    var y2 = d3.scale.linear().domain([0, 100]).range([chartHeight - margin, 0 + margin]);

//The SVG Container to hold the chart
    var svgContainer = d3.select("#obs_chart").append("svg")
                                     .attr("width", chartWidth)
                                     .attr("height", chartHeight);
    var g = svgContainer.append("svg:g");

///////////////The grid lines
// Draw X-axis grid lines - thick ones for day
    svgContainer.selectAll("line.x")
                .data(x.ticks(3))
                .enter().append("line")
                .attr("x1", x)
                .attr("x2", x)
                .attr("y1", 0 + margin)
                .attr("y2", chartHeight - margin)
                .style("stroke-width", 2)
                .attr("stroke","#ccc")
                .attr("opacity", 0.5);

// Draw X-axis grid lines - thinner ones for every six hours
    svgContainer.selectAll("line.x")
                .data(x.ticks(12))
                .enter().append("line")
                .attr("x1", x)
                .attr("x2", x)
                .attr("y1", 0 + margin)
                .attr("y2", chartHeight - margin)
                .style("stroke-width", 2)
                .attr("stroke","#ccc")
                .attr("opacity", 0.3);

// Draw Y-axis grid lines
    svgContainer.selectAll("line.y")
                .data(y1.ticks(5))
                .enter().append("line")
                .attr("x1", margin)
                .attr("x2", chartWidth - margin)
                .attr("y1", y1)
                .attr("y2", y1)
                .style("stroke", "#ccc");

//////////////////The axes

//x axis
    var xaxis = d3.svg.axis()
                  .scale(x)
                  .orient("bottom");

    svgContainer.append("g")
            .attr("fill", "none")
            .attr("stroke", "black")
            .attr("ticks", 48)
            .attr("stroke-width", "0.5")
            .attr("transform", "translate(0," + (chartHeight - margin) + ")")
            .call(xaxis);          

//air_temp axis
    var y1axis = d3.svg.axis()
                   .scale(y1)
                   .ticks(10)
                   .orient("left");

    svgContainer.append("g")
            .attr("fill", "none")
            .attr("stroke", "red")
            .attr("stroke-width", "0.5")
            .attr("transform", "translate(" + ( margin) + ",0)")
            .call(y1axis)
          .append("text")
            .attr("y", 6)
            .attr("transform", "translate(-10, 0)")
            .attr("dy", ".71em")
            .style("text-anchor", "end")
            .text("ºC");

//humidity axis
    var y2axis = d3.svg.axis()
                   .scale(y2)
                   .orient("right");

    svgContainer.append("g")
            .attr("fill", "none")
            .attr("stroke", "blue")
            .attr("stroke-width", "0.5")
            .attr("transform", "translate(" + margin + ",0)")
            .call(y2axis)
          .append("text")
            .attr("y", 6)
            .attr("transform", "translate(20, 0)")
            .attr("dy", ".71em")
            .style("text-anchor", "end")
            .text("%");



//the lines

//prepares the humidity line
    var lineFunction = d3.svg.line()
                         .x(function(d) { return x((d.local_date_time_full)); })
                         .y(function(d) { return y2(d.rel_hum); })
                         .interpolate("linear");

//draws the humidity line
    var lineGraph = g.append("path")
                 .attr("d", lineFunction(obsData))
                 .attr("stroke", "lightskyblue")
                 .attr("opacity", "0.8")
                 .attr("stroke-width", 2)
                 .attr("fill", "none");
                           
//draws circles for mouseover
    g.selectAll("humidcircle")
          .data(obsData)
          .enter()
          .append("svg:circle")
          .attr("cx", function(d) { return x((d.local_date_time_full)); })
          .attr("cy", function(d) { return y2(d.rel_hum); })
          .attr("r", 8)
          .attr("opacity", 0)
        .append("svg:title")
          .text(function (d) {
            return d.rel_hum
            + "% at " 
            + d.local_date_time
           });

//prepares the temperature line
    var lineFunction = d3.svg.line()
                         .x(function(d) { return x((d.local_date_time_full)); })
                         .y(function(d) { return y1(d.air_temp); })
                         .interpolate("linear");

//draws the temperature line
    var lineGraph = g.append("path")
                 .attr("d", lineFunction(obsData))
                 .attr("stroke", "red")
                 .attr("opacity", "0.8")
                 .attr("stroke-width", 2)
                 .attr("fill", "none");
                 
//prepares the apparent temperature line
    var lineFunction = d3.svg.line()
                         .x(function(d) { return x((d.local_date_time_full)); })
                         .y(function(d) { return y1(d.apparent_t); })
                         .interpolate("linear");

//draws the apparent temperature line
    var lineGraph = g.append("path")
                 .attr("d", lineFunction(obsData))
                 .attr("stroke", "red")
                 .attr("opacity", "0.25")
                 .attr("stroke-width", 2)
                 .attr("stroke-dasharray", "5,3")
                 .attr("fill", "none");
                            
//draws circles for mouseover
    g.selectAll("tempcircle")
          .data(obsData)
          .enter()
          .append("svg:circle")
          .attr("cx", function(d) { return x((d.local_date_time_full)); })
          .attr("cy", function(d) { return y1(d.air_temp); })
          .attr("r", 8)
          .attr("opacity", 0)
        .append("svg:title")
          .text(function (d) {
          return d.air_temp
            + "° at " 
            + d.local_date_time
          });

/////////////////Annotations and titles

//The final values in each line and the midpoint between them
    var last_temp_y = y1(obsData[lengthofdata - 1].air_temp),
        last_humidity_y = y2(obsData[lengthofdata - 1].rel_hum),
        midpoint = 0.5*(last_temp_y + last_humidity_y);

//add the time of the last observation to the page's (h1) title
    var last_time = obsData[lengthofdata - 1].local_date_time.split("/")[1];

    d3.select("h1").append("text")
                   .text(" ("
                   + last_time 
                   + "): "
                   + obsData[lengthofdata - 1].air_temp + "°C" 
                   + " and " 
                   + obsData[lengthofdata - 1].rel_hum + "%"
                   + " humidity");

//change the page title so you can see it in the tab title when on another page
    document.title = obsData[lengthofdata - 1].air_temp + "°C, " 
                     + obsData[lengthofdata - 1].rel_hum + "%, "
                     + last_time + " ("                
                     + town_titlecase +")";

//////////////////add the final value to the end of each line
            
    var topvalue, bottomvalue, topcolour, bottomcolour;
    
//if the values are too close together to be displayed neatly just separate them slightly
    if ( Math.abs(midpoint - last_temp_y) > 10) {
    
//adds the humidity onto the final value
    g.selectAll("finalhumid")
          .data(obsData)
          .enter()
          .append("svg:text")
          .attr("x", chartWidth - margin )
          .attr("y", last_humidity_y)
          .attr("font-family", "sans-serif")
          .attr("stroke-width", "0.5")
          .attr("font-size", "95%")
          .attr("dy", "0.25em")
          .attr("fill","blue")
          .text(obsData[lengthofdata - 1].rel_hum + "%");
          
//adds the temperature onto the final value
    g.selectAll("finaltemperature")
          .data(obsData)
          .enter()
          .append("svg:text")
          .attr("x", chartWidth - margin )
          .attr("y", last_temp_y)
          .attr("font-family", "sans-serif")
          .attr("stroke-width", "0.5")
          .attr("font-size", "95%")
          .attr("dy", "0.25em")
          .attr("fill","red")
          .text(obsData[lengthofdata - 1].air_temp + "°"); 
    }
//This looks roundybout because the origin in d3 is at the top left
// so a higher number means closer to the bottom
    else {   
        if (last_temp_y < last_humidity_y) {
            topvalue = obsData[lengthofdata - 1].air_temp + "°",
            bottomvalue = obsData[lengthofdata - 1].rel_hum + "%",
            topcolour = "red",
            bottomcolour = "blue"
            }
        else {
             topvalue = obsData[lengthofdata - 1].rel_hum + "%",
             bottomvalue = obsData[lengthofdata - 1].air_temp + "°",
             topcolour = "blue",
             bottomcolour = "red"    
             };
    
    g.selectAll("values_label")
            .data(obsData)
            .enter()
            .append("svg:text")
            .attr("x", chartWidth - margin )
            .attr("y", midpoint - 10)
            .attr("font-family", "sans-serif")
            .attr("font-size", "95%")
            .attr("dy", "0.25em")
            .attr("fill", topcolour)
            .text(topvalue);
    g.selectAll("values_label")
            .data(obsData)
            .enter()
            .append("svg:text")
            .attr("x", chartWidth - margin )
            .attr("y", midpoint + 10)
            .attr("font-family", "sans-serif")
            .attr("font-size", "95%")
            .attr("dy", "0.25em")
            .attr("fill", bottomcolour)
            .text(bottomvalue);
    };
    

//try and add the forecast after the chart - if the URL works
   $('<div id="import_forecast"></div>').load(forecast_url + ' .day').insertBefore('.p-id');
});
