// calculate width and height based on window size

var margin = {top:60, right:50, bottom:70, left:110};

var w = Math.max(Math.min(window.innerWidth, 1000), 1000),
    gridSize = Math.floor(w / 24),
    h = gridSize * (10);

var colors = d3.scale.linear()
  	        .domain(d3.range(0, 35))
            .range(["#87cefa", "#86c6ef", "#85bde4", "#83b7d9", "#82afce", "#80a6c2", "#7e9fb8", "#7995aa", "#758b9e", "#708090"]);
var svg = d3.select("#heatmap")
  	        .append("svg")
  	        // .attr("width", w)
  	        // .attr("height", h)
            .attr("preserveAspectRatio", "xMinYMin meet")
            .attr("viewBox", "10 10 800 350")
  	        .append("g")
  	        .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
            // .classed("svg-content", true);

function init() {
    var dataset;
    // Need the house in this order to correspond correctly to heatmap values
    var house = ["Tyrell", "Targaryen", "Stark", "Martell", "Lannister", "Greyjoy","Baratheon"];

    d3.csv("heatmap.csv", function (response) {
        var dataset = [];
        response.forEach(function (row) {
            // Loop through all of the columns, and for each column
            // make a new row
            Object.keys(row).forEach(function (colname) {
                // Ignore 'season' and 'episode' columns
                if (colname == "season" || colname == "episode") {
                    return
                }
                dataset.push(
                    {
                        "season": parseInt(row["season"]),
                        "episode": parseInt(row["episode"]),
                        "value": parseInt(row[colname]),
                        "character": colname
                    });
            });
        });
        console.log(dataset);

        // Create + Merge Arrays to get charVal
        // (this is necessary to get svg attr("y"), the charLabel to work
        // 02/18/2018:  Figured out a way to get it to work without merging

        // var charValue_data = [
        //     {character: "Baratheon", charValue : 7},
        //     {character: "Greyjoy", charValue : 6},
        //     {character: "Lannister", charValue : 5},
        //     {character: "Martell", charValue : 4},
        //     {character: "Stark", charValue : 3},
        //     {character: "Targaryen", charValue : 2},
        //     {character: "Tyrell", charValue : 1}]
        //
        // var merged = alasql('SELECT * FROM ? dataset JOIN ? charValue USING character', [dataset,charValue_data]);
        // dataset = merged;

        console.log(dataset);

        // Create Constants by iterating over the list again and
        // removing duplicates.  Need these only for x & y axes labeling

        const x_elements = new Set(dataset.map(function( item ) { return item.episode; })),
        y_elements = new Set(dataset.map(function( item ) { return item.character; }))

        var x_elements2 = Array.from(x_elements);
        x_elements2.sort(function(a,b) {
            return a-b
        });

        var y_elements2 = Array.from(y_elements);
        y_elements2.sort(function(a,b) {
            return a-b
        });

        var xScale = d3.scale.ordinal()
        .domain(x_elements2)
        .rangeBands([0, x_elements2.size * y_elements2.size]);

        var yScale = d3.scale.ordinal()
        .domain(y_elements2)
        .rangeBands([y_elements2.size * x_elements2.size, 0])

        var xAxis = d3.svg.axis()
            .scale(xScale)

            .tickFormat(function (d) {
                return d;
            }).orient("top");
        // console.log(x_elements);


        var charLabels = svg.selectAll(".charLabel")
  	        .data(y_elements2)
  	        .enter()
  	        .append("text")
  	        .text(function(d) { return d; })
  	        .attr("x", 0)
  	        .attr("y", function(d, i) { return i * gridSize; })
  	        .style("text-anchor", "end")
		    .attr("transform", "translate(-6," + gridSize / 1.5 + ")")

        var episodeLabels = svg.selectAll(".episodeLabel")
            .data(x_elements2)
            .enter()
            .append("text")
            .text(function(d) { return d; })
            .attr("x", function(d, i) { return i * gridSize; })
            .attr("y", 0)
            .style("text-anchor", "middle")
            .attr("transform", "translate(" + gridSize / 2 + ", -6)");

        // group data by season

         var nest = d3.nest()
            .key(function(d) { return d.season; })
            .entries(dataset);

         // array of seasons in the data
        var seasons = nest.map(function(d) { return d.key; });
        var currentSeasonIndex = 0;

    // create season dropdown menu
    var seasonMenu = d3.select("#seasonDropdown");
    seasonMenu
      .append("select")
      .attr("id", "seasonMenu")
      .selectAll("option")
        .data(seasons)
        .enter()
        .append("option")
        .attr("value", function(d, i) { return i; })
        .text(function(d) { return d; });

    // function to create the initial heatmap
    var drawHeatmap = function(season) {
        // filter the data to return object of season of interest
        var selectSeason = nest.find(function(d) {
            return d.key == season;
            });

        var heatmap = svg.selectAll(".episode")
            .data(selectSeason.values)
            .enter().append('g')
            .append("rect")
            // .attr('y', function(d) { return yScale(d.character); })
            //.attr('x', function(d) { return xScale(d.episode); })
            .attr("x", function(d) { return (d.episode-1) * gridSize; })
            .attr("y", function(d) { return ((house.indexOf(d.character)) * gridSize); })
            .attr("class", "episode border")
            .attr("width", gridSize)
            .attr("height", gridSize)
            .style("stroke", "white")
            .style("stroke-opacity", 1.0)
            .style("fill", function(d) { return colors(d.value); })
        };

    drawHeatmap(seasons[currentSeasonIndex]);

    var updateHeatmap = function(season) {
      console.log("currentSeasonIndex: " + currentSeasonIndex)
        // filter data to return object of season of interest
        var selectSeason = nest.find(function(d) {
            return d.key == season;
        });

        // update the data and redraw heatmap
        var heatmap = svg.selectAll(".episode")
            .data(selectSeason.values)
            .transition()
            .duration(500)
            .style("fill", function(d) { return colors(d.value); })
    };

    // run update function when dropdown selection changes
    seasonMenu.on("change", function() {
      // find which season was selected from the dropdown
      var selectedSeason = d3.select(this)
          .select("select")
          .property("value");
      currentSeasonIndex = +selectedSeason;
        // run update function with selected season
        updateHeatmap(seasons[currentSeasonIndex]);
    });

    d3.selectAll(".nav").on("click", function() {
      if(d3.select(this).classed("left")) {
        if(currentSeasonIndex == 0) {
          currentSeasonIndex = seasons.length-1;
        } else {
          currentSeasonIndex--;
        }
      } else if(d3.select(this).classed("right")) {
        if(currentSeasonIndex == seasons.length-1) {
          currentSeasonIndex = 0;
        } else {
          currentSeasonIndex++;
        }
      }
      d3.select("#seasonMenu").property("value", currentSeasonIndex)
      updateHeatmap(seasons[currentSeasonIndex]);
    });

    var legend = svg.selectAll(".legend")
        .data(colors.ticks(10).slice().reverse())
        .enter().append("g")
        .attr("class", "legend")
        .attr("transform", function(d, i) { return "translate(" + (h + 20) + "," + (20 + i * 20) + ")"; });

    legend.append("rect")
      .attr("width", 20)
      .attr("height", 20)
      .style("fill", colors);


    legend.append("text")
      .attr("x", 26)
      .attr("y", 10)
      .attr("dy", ".35em")
      .text(String);

    svg.append("text")
      .attr("class", "label")
      .attr("x", h + 15)
      .attr("y", 5)
      .attr("dy", ".35em")
      .text("Count");

        // Add an x-axis with label.
    svg.append("g")
      // .attr("class", "x axis")
      .attr("transform", "translate(0," + yScale + ")")
      // .call(d3.svg.axis().scale(xScale).orient("top"))
        .append("text")
      .attr("class", "label")
      .attr("x", xScale)
      .attr("y", -30)
      // .attr("text-anchor", "end")
      .text("Episode");

    // Add a y-axis with label.
    svg.append("g")
      // .attr("class", "y axis")
      // .call(d3.svg.axis().scale(yScale).orient("left"))
        .append("text")
        .attr("class", "label")
        .attr("y", -90)
      .attr("dy", "1.0em")
      .attr("text-anchor", "end")
      .attr("transform", "rotate(-90)")
      .text("House");

        // Close the d3.csv()
    });
}


