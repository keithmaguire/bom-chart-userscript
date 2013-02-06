A greasemonkey userscript to add charts to the (Australian) Bureau of Meteorology's Observations pages
======================================================================================================

This is a greasemonkey script using [d3.js](http://www.d3js.org) to add a temperature and humidity graph
to the top of the Recent Observations pages,such as this one for [Adelaide](http://www.bom.gov.au/products/IDS60901/IDS60901.94675.shtml)

It's mostly because I really wanted to have this, but it's been also a useful exercise for starting d3

From


![screen before](https://raw.github.com/keithmaguire/bom-chart-userscript/master/img/before_script.png)

to (as it stands at the moment)

![screen with graph added](https://raw.github.com/keithmaguire/bom-chart-userscript/master/img/after_json_script.png)

The red line is for Temperature, the Blue line is for Humidity and the dashed Red line is for Apparent temperature.  If you hover over either of the two main lines you'll get the value at that point. I've not done the same to the Apparent Temperature line because I only included it to combat panic when the temperature gets over 40° - you can tell yourself well it should only *feel* like around 38°

There are two userscripts here - the first one extracts the data for the last 24 hours from the tables on the page, the second one uses the data from a linked json file which covers the previous three days.

I'm going to keep the table one here mainly as a reference for myself and work on the json based one, as I think that can probably be gotten to do more interesting things.



There are a number of updates I'd like to do - 

 
 1. at the moment it uses svg:title to do simple pop-ups on mouseover for specific values
so I'd like to update that to use jquery and tipsy instead
 2. I also want to just tidy it up somewhat - I think I've not properly wrapped my head around how things should be done with d3 and have needlessly duplicated things that should have been abstracted. This includes separating out the CSS, probably using Greasemonkey to add the different classes to the pages HEAD



But it works perfectly fine at the moment!
