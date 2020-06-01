/* ---------------------------------------------------------------------
Nitya Davarapalli
CSE 163
peru.js
Referenced
https://stackoverflow.com/questions/54947126/geojson-map-with-d3-only-rendering-a-single-path-in-a-feature-collection

Peru Map Shapefile
https://gadm.org/download_country_v3.html

Used to convert Shapefiles to GeoJSON format
https://mapshaper.org/

Population and Area Data for each region in Peru
https://www.citypopulation.de/en/peru/cities/

Color Scheme
https://github.com/d3/d3-scale-chromatic

California Population
https://bl.ocks.org/mbostock/5562380
----------------------------------------------------------------------*/ 
/*jslint browser: true*/
/*global d3*/

var svg = d3.select("svg"),
    width = +svg.attr("width"),
    height = +svg.attr("height");

// center, translate, and scale the data to project it properly and make it visible
// Customize the projection to make the center of Peru become the center of the map
var projection = d3.geoMercator()
      .center([-80, -8.25])
      .scale(1500)
      .translate([width / 2, height / 2]);
    
// project the data
var path = d3.geoPath()
        .projection(projection);

// Set up scale that will take in data values as input and return colors. 
var color = d3.scaleThreshold()
//    .domain([5, 10, 25, 50, 60, 80, 2000, 4000])
//    .domain([5, 10, 15, 25, 40, 60, 85, 3000])
    .domain([5, 10, 20, 30, 45, 70, 100, 1000])
    .range(d3.schemeGnBu[9]);


// Legend
var x = d3.scaleSqrt()
    .domain([0, 1000])
    .rangeRound([440, 950]);
//    .domain([0, 4500])
//    .rangeRound([440, 950]);

// create svg element
var g = svg.append("g")
    .attr("class", "key")
    .attr("transform", "translate(0,40)");

// Create legend 
g.selectAll("rect")
// set color for legend according to data
  .data(color.range().map(function(d) {
      d = color.invertExtent(d);
      if (d[0] == null) d[0] = x.domain()[0];
      if (d[1] == null) d[1] = x.domain()[1];
      return d;
    }))
  .enter().append("rect")
    .attr("height", 10)
    .attr("x", function(d) { return x(d[0]); })
    .attr("width", function(d) { return x(d[1]) - x(d[0]); })
    .attr("fill", function(d) { return color(d[0]); })
    .attr("stroke", "black");

//  Create and place label for Legend
g.append("text")
    .attr("class", "caption")
    .attr("x", x.range()[0])
    .attr("y", -6)
    .attr("fill", "#000")
    .attr("text-anchor", "start")
    .attr("font-weight", "bold")
    .text("Population per square kilometer");

// Assign ticks and tick values for legend
g.call(d3.axisBottom(x)
    .tickSize(13)
    .tickValues(color.domain()))
  .select(".domain")
    .remove();

// Load in population density data
// read in the population and area data from the csv file 
d3.csv("Peru.csv").then(function(data){
    console.log(data);
   
    // Load in GeoJSON data
    // read in Peru map data from the json file using promises to use D3V5
    d3.json("Peru.json").then(function(json) {
        console.log(json);

    /*------------------------------------------------------------------------------------------
    Referenced: https://stackoverflow.com/questions/54947126/geojson-map-with-d3-only-rendering-a-single-path-in-a-feature-collection
    When the polygons are inverted, they will cover everything but the region of interest. 
    Here I needed to reverse the winding order of the polygons. To reverse the ordering of the coordinates, I reversed the items in the arrays.
    ------------------------------------------------------------------------------------------*/
        var features = json.features;
        features.forEach(function(feature) {
           if(feature.geometry.type == "MultiPolygon") {
             feature.geometry.coordinates.forEach(function(polygon) {

               polygon.forEach(function(ring) {
                 ring.reverse();
               })
             })
           }
           else if (feature.geometry.type == "Polygon") {
             feature.geometry.coordinates.forEach(function(ring) {
               ring.reverse();
             })  
           }
         })

        //Merge the csv data and GeoJSON
		//Loop through once for each data value
		for (var i = 0; i < data.length; i++) {
            //Grab region name
            var dataRegion = data[i].name;
						
            //Grab data area and population, and convert from string to float
			var dataArea = parseFloat(data[i].area);
            var dataPop = parseFloat(data[i].population);
            // Calculate population density
            var dataValue = dataPop/dataArea;

			//Find the corresponding state inside the GeoJSON
			for (var j = 0; j < json.features.length; j++) {
				var jsonRegion = json.features[j].properties.NAME_1;
				
				if (dataRegion == jsonRegion) {
					//Copy the data value into the JSON
					json.features[j].properties.value = dataValue;
                    
					//Stop looking through the JSON
					break;		
				}
			}		
        }
        
       //Bind data and create one path per GeoJSON feature
       svg.append("g")
         .selectAll("path")
         .data(features)
         .enter().append("path")
           .style("fill", function(d) { return color(d.properties.value); })
           .attr("stroke", "lightgrey")
           .attr("d", path);
    });
});

