// ==UserScript==
// @name        bom-chart-json
// @namespace   keithmaguire.net
// @require     http://d3js.org/d3.v3.min.js
// @description put charts onto BOM using the observations json feed
// @include     http://www.bom.gov.au/products/*
// @version     1
// @grant       none
// ==/UserScript==


// current is the observations url, for example: http://www.bom.gov.au/products/IDS60901/IDS60901.94675.shtml
var current = window.location + "";
var url_parts = current.split("products"); 
var base_bom_url = url_parts[0]; // "http://www.bom.gov.au/"

var product_id_url = url_parts[1];
var htmlurl = base_bom_url + "fwo" + product_id_url;
var jsonurl = htmlurl.replace("shtml","json")

console.log(jsonurl);

document.body.innerHTML= document.body.innerHTML.replace(/<div class="p-id">.*>/,'<div class="p-id"><p></p></div>');


d3.json(jsonurl, function(json){

//forecast url - if it exists, to be investigated at another time!
var state_uppercase = json.observations.header[0].state_time_zone;
var state = state_uppercase.toLowerCase();
console.log(state);
var town_titlecase = json.observations.header[0].name;
var town = town_titlecase.replace(" ","").toLowerCase();
console.log(town);
var forecast_url = base_bom_url + state + "/forecasts/" + town + ".shtml"
console.log(forecast_url)

var obsData = json.observations.data;

obsData.reverse();

var margin = 45
var chartHeight = 400 
var chartWidth = 793

//time entries are in the format 20130119190000
var parseDate = d3.time.format("%Y%m%d%H%M%S").parse;

obsData.forEach(function(d) {
    d.local_date_time_full = parseDate(d.local_date_time_full);
    });

console.log(obsData[0]);



// mapping the object generated from the table, attaching the appropriate keys
// to each entry as well as converting the numbers to numbers rather than strings

var lengthofdata = obsData.length;

    
//////////////////////////////
/////////// Drawing the Chart
//////////////////////////////

//var x = d3.scale.linear().domain([0, 160]).range([margin + 0, chartWidth - margin])
var x = d3.time.scale().domain(d3.extent(obsData, function(d) {return d.local_date_time_full}))
                       .range([margin + 0, chartWidth - margin])
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
                   .scale(x)
                   .orient("bottom");
                   
svgContainer.append("g")
            .attr("fill","none")
            .attr("stroke","black")
            .attr("ticks",48)
            .attr("stroke-width","0.5")
            .attr("transform", "translate(0," + (chartHeight - margin ) + ")")
            .call(xaxis);          

//air_temp axis
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

//put shaded rectangles over what's pretty much always night in Aus - 9pm to 4am
//
//
//
//
//the lines
var last_temp_y = y1(obsData[lengthofdata - 1].air_temp);
var last_humidity_y = y2(obsData[lengthofdata - 1].rel_hum);

//prepares the humidity line
var lineFunction = d3.svg.line()
                         .x(function(d) { return x((d.local_date_time_full)); })
                         .y(function(d) { return y2(d.rel_hum); })
                         .interpolate("linear");

//draws the humidity line
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
          .attr("cx", function(d) { return x((d.local_date_time_full)); })
          .attr("cy", function(d) { return y2(d.rel_hum); })
          .attr("r", 8)
          .attr("opacity", 0)
        .append("svg:title")
          .text(function(d){
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
                 .attr("opacity","0.8")
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
                 .attr("opacity","0.25")
                 .attr("stroke-width", 2)
                 .attr("stroke-dasharray","5,3")
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
          .text(function(d){
          return d.air_temp
            + "° at " 
            + d.local_date_time
          });

//midpoint between the final point of temperature and humidity                
var midpoint = 0.5*(last_temp_y + last_humidity_y);


//add the time of the last observation to the page's (h1) title
var last_time = obsData[lengthofdata - 1].local_date_time.split("/")[1];

d3.select("h1").append("text")
            .text(", as of " 
            + last_time 
            + ": "
            + obsData[lengthofdata - 1].air_temp + "°C" 
            + " and " 
            + obsData[lengthofdata - 1].rel_hum + "%"
            + " humidity");

//Change page title
document.title = town_titlecase +
            ", " 
            + last_time +": "
            + obsData[lengthofdata - 1].air_temp + "°C," 
            + obsData[lengthofdata - 1].rel_hum + "%";

            
var topvalue,bottomvalue,topcolour,bottomcolour;
//if the values are too close together to be displayed neatly just display them
//above and below the date
if ( midpoint - last_temp_y > 10)
  {
    
//adds the humidity onto the final value
  g.selectAll("finalhumid")
          .data(obsData)
          .enter()
          .append("svg:text")
          .attr("x", chartWidth - margin )
          .attr("y", last_humidity_y)
          .attr("font-family", "Arial,Helvetica,Verdana,sans-serif")
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
// therefor the y values are actually calculated from the top, so a higher 
// number actually means closer to the bottom
  else 
{   console.log("lesser")
    if (last_temp_y < last_humidity_y)
    {
    topvalue = obsData[lengthofdata - 1].air_temp + "°",
    bottomvalue = obsData[lengthofdata - 1].rel_hum + "%",
    topcolour = "red",
    bottomcolour = "blue"
    }
  else
    {
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
            .attr("fill",topcolour)
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
            .attr("fill",bottomcolour)
            .text(bottomvalue);
};



});
