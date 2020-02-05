'use strict';

{
	let csvFileName = "../data/FoodBalance_trial.csv";
	
	let margin = {top: 20, right: 40, bottom: 30, left: 40},
    width = 1000 - margin.left - margin.right,
    height = 500 - margin.top - margin.bottom;

	let yCoord = 200;
	
	let myData = [];
		
	d3.csv(csvFileName, d => {

        // Parse data
        // d.country = +d.country; The default format is string, so there is no need to convert this variable
        d.value = +d.value; // +x is equivalent to Number(x)

        return d;
    }).then(myDataRaw => {

        myData = myDataRaw;
		
		console.log(myData);

        buildBarchart();

    }).catch(err => console.error(err));
	
	

	function buildBarchart(){
		
		let barChartSvg = d3.select("body").append("svg")
		.attr("width", width)
		.attr("height", height)
		.append("g")
		.attr("transform", `translate(${margin.left},${margin.top})`);
		
		let x = d3.scaleLinear()
		  .domain([0,5])
          .range([0, width]);

		let y = d3.scaleLinear()
		  .domain(d3.extent(myData, d => {
                return d.value;
            }))
          .range([height, 0]);
		
		let bars = barChartSvg.selectAll('circle')
            .data(myData)
            .enter()
            .append('circle')
            .attr("cx",  function(d, i) {    
			return i * (width / myData.length);
			})
			.attr("cy",  function(d) {    
			return yCoord; 
			})
			.attr("r", function(d) {    
			return d.value/1000;
			});
	}

	
}