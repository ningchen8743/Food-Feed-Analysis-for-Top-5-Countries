'use strict';

{ // start scope

//------------------------------------------------------------
// define map manager class
//------------------------------------------------------------
function MapManager() {
    this.plotWidth = 1100;
    this.plotHeight = 600;

    this.myProjection = d3.geoNaturalEarth1();

    this.myPath = d3.geoPath(this.myProjection);
    this.mapUrl = null;

    this.geoJson = null;
    this.rawMapData = null;

    this.countryAreas = null;

    this.circlePlotObj = null;

    this.fullCountryNameList = null;

    this.myMapSvgPlotObj = null;
    this.countryAreasPlotObj = null;
    this.countryAreasPlotPath = null;

    this.countryCentroidList = null;

    this.myData = null;

    this.currentYear = "1967";

    this.colorInterpolator = d3.interpolateRgb("#44ff44", "#448844");

    this.data1Scaler = null;
    this.data2Scaler = null;

    this.toolTip = null;

    this.yearList = null;
    this.slider = null;
    this.sliderRange = null;

    this.globalMax = -1e6;
    this.globalMin = 1e6;

    this.analyzeData = () => {
        for(let i = 0; i < this.myData.length; ++i)
        {
            let singleData = this.myData[i]["coreData"];
            for (const property in singleData)
            {
                if(this.globalMax < singleData[property])
                {
                    this.globalMax = singleData[property];
                }

                if(this.globalMin > singleData[property])
                {
                    this.globalMin = singleData[property];
                }
            }
        }
    };

    this.initialize = (mapUrl, myData) => {
        this.mapUrl = mapUrl;
        this.myData = myData;

        // download the map asynchronously
        d3.json(this.mapUrl)
          .then((rawData) => {
            this.rawMapData = rawData;

            this.analyzeData();

            // once download completes, plot the map
            this.initializeMap();
        });
    };

    this.initializeMap = () => {
        // add tooltip
        this.toolTip = d3.select("#my-map-div").append("div")
                            .attr("class", "my-map-tooltip")
                            .style("opacity", 0.0);

        //++++++++++++++++++++++++++++++
        // get country areas using topojson library
        //++++++++++++++++++++++++++++++
        this.geoJson = topojson.feature(this.rawMapData, this.rawMapData.objects.countries);

        // adjust projection size to fit the plot area
        this.myProjection.fitSize([this.plotWidth, this.plotHeight], this.geoJson);

        this.countryAreas = this.geoJson.features;
        this.fullCountryNameList = this.countryAreas.map((el) => {
            return el["properties"]["name"];
        });

        // this.countryAreas is an array. Each element is data for a certain country.
        // The element has the following members:
        // type: "Feature"
        // id: "716"
        // properties:
        //     name: "Zimbabwe"
        // geometry:
        //     type: "Polygon"
        //     coordinates: [Array(169)]
        // console.log(this.countryAreas);
        // console.log(this.fullCountryNameList);

        // derive global index
        for(let i = 0; i < this.myData.length; ++i)
        {
            for(let g = 0; g < this.fullCountryNameList.length; ++g)
            {
                if(this.myData[i]["countryName"] == this.fullCountryNameList[g])
                {
                    this.myData[i]["globalIdx"] = g;
                    continue;
                }
            }
        }

        //++++++++++++++++++++++++++++++
        // plot using d3 library
        //++++++++++++++++++++++++++++++
        this.myMapSvgPlotObj = d3.select("#my-map-svg")
                            .attr("width", this.plotWidth)
                            .attr("height", this.plotHeight)
							.attr("viewBox", `0 0 ${this.plotWidth} ${this.plotHeight - 200}`); // remove Antarctica;

        this.countryAreasPlotObj = this.myMapSvgPlotObj.append("g");

        // transform data from [min, max] into [0, 1]
        this.data1Scaler = d3.scaleLinear()
                            .domain([this.globalMin, this.globalMax])
                            .range([0.0, 1.0]);

        // plot countries
        this.countryAreasPlotPath = this.countryAreasPlotObj.selectAll("path")
            .data(this.countryAreas)
            .enter()
            .append("path");

        this.countryAreasPlotPath.attr("class", "countryArea")
            .attr("d", this.myPath)
            .style("stroke", "#ffffff")
            .style("stroke-width", 0.5)
            .style("stroke-opacity", 0.8)
            .style("fill", (d) => {
                // check if the given country on the map is included in this.myData
                let el = null;
                let bFound = false;
                for(let i = 0; i < this.myData.length; ++i)
                {
                    el = this.myData[i];

                    if(el["countryName"] == d["properties"]["name"])
                    {
                        bFound = true;
                        break;
                    }
                }

                let myColor = "#888888";
                if(bFound)
                {
                    // transform data from [min, max] into [0, 1]
                    let adjustedData = this.data1Scaler(el["coreData"][this.currentYear]);

                    // obtain a color value for the data between [0, 1]
                    myColor = this.colorInterpolator(adjustedData);
                }

                return myColor;
            });


        // calculate country centroid
        this.countryCentroidList = Array(this.countryAreas.length).fill(null);
        let pathData = this.countryAreasPlotPath.data();
        for(let i = 0; i < this.countryCentroidList.length; ++i)
        {
            let cenCoord = this.myPath.centroid(pathData[i]);
            this.countryCentroidList[i] = cenCoord;
        }

        this.countryAreasPlotPath
            .on("mouseover", (d, i, nodes) => {
                d3.select(nodes[i])
                    .style("stroke", "#ffd700")
                    .style("stroke-width", 1.0)
                    .style("stroke-opacity", 1.0);

                let cenCoord = this.countryCentroidList[i];

                this.toolTip
                    .html(d["properties"]["name"])
                    .style("left", `${cenCoord[0]}px`)
                    .style("top", `${cenCoord[1]}px`)
                    .style("opacity", 0.9);
            })
            .on("mouseout", (d, i, nodes) => {
                d3.select(nodes[i])
                    .style("stroke", "#ffffff")
                    .style("stroke-width", 0.5)
                    .style("stroke-opacity", 0.8);

                this.toolTip
                    .style("opacity", 0.0);
            });

        // add circles
        // transform data from [min, max] into [0, 1]
        this.data2Scaler = d3.scaleLinear()
                            .domain([this.globalMin, this.globalMax])
                            .range([0.0, 60.0]);

        let temp = this.myMapSvgPlotObj.append("g");
        this.circlePlotObj = temp.selectAll("circle")
            .data(this.myData)
            .enter()
            .append("circle")
            .attr("cx", (d, i) => {
                let globalIdx = this.myData[i]["globalIdx"];
                return this.countryCentroidList[globalIdx][0];
            })
            .attr("cy", (d, i) => {
                let globalIdx = this.myData[i]["globalIdx"];
                return this.countryCentroidList[globalIdx][1];
            })
            .attr("r", (d) => {
                return this.data2Scaler(d["coreData"][this.currentYear]);
            })
            .style("fill", "#ff8888cc")
            .style("stroke", "#ff0000");

        // obtain list of year in string
        this.yearList = Object.keys(this.myData[0]["coreData"]);

        // convert string to number
        this.yearList = this.yearList.map((el) => {
            return Number(el);
        });

        // slider
        // API reference: https://github.com/johnwalley/d3-simple-slider
        this.sliderRange = d3.sliderBottom() // ticks are located at the bottom
            .width(600)
            .min(this.yearList[0])
            .max(this.yearList[this.yearList.length - 1])
            .tickValues(this.yearList)
            .tickFormat(d3.format('.0f'))
            .marks(this.yearList) // enable snapping
            .on("onchange", (sliderValue) => {
                this.updateMap(sliderValue);
            });

        this.slider = d3
            .select("#slider-bar-step")
            .append("svg")
            .attr("width", 800)
            .attr("height", 200)
            .append("g")
            .attr("transform", "translate(30,30)");

        this.slider.call(this.sliderRange);

        this.slider.selectAll("text")
            .attr("font-family", "\"Century Gothic\", CenturyGothic, sans-serif")
            .attr("fill", "#ffffff")
            .attr("font-size", 16);
    };

    this.updateMap = (sliderValue) => {
        this.currentYear = sliderValue.toString();
        this.circlePlotObj
            .transition()
            .attr("r", (d) => {
                return this.data2Scaler(d["coreData"][this.currentYear]);
            });
    };
}


//------------------------------------------------------------
// define main onload event
//------------------------------------------------------------
window.addEventListener("load", (event) => {

let mm = new MapManager();

const mapUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-50m.json";
const myData = [{"countryName" : "China"                    , "globalIdx" : -1, "coreData" : {"1967" : 388772 , "1977" : 499015, "1987" : 763613  , "1997" :  1167965 , "2007" : 1607703 , "2013" : 1943987 , "2017" : 2161333}},
                {"countryName" : "India"                    , "globalIdx" : -1, "coreData" : {"1967" : 275260 , "1977" : 412318, "1987" : 516632  , "1997" :  757694  , "2007" : 1005286 , "2013" : 1126270 , "2017" : 1223513}},
                {"countryName" : "United States of America" , "globalIdx" : -1, "coreData" : {"1967" : 448832 , "1977" : 566895, "1987" : 622327  , "1997" :  744857  , "2007" : 847396  , "2013" : 894668  , "2017" : 974034 }},
                {"countryName" : "Brazil"                   , "globalIdx" : -1, "coreData" : {"1967" : 164118 , "1977" : 246755, "1987" : 432765  , "1997" :  549937  , "2007" : 884825  , "2013" : 1143605 , "2017" : 1216178}},
                {"countryName" : "Russia"                   , "globalIdx" : -1, "coreData" : {"1967" : 0      , "1977" : 0     , "1987" : 0       , "1997" :  211041  , "2007" : 236353  , "2013" : 263296  , "2017" : 334095 }}];
mm.initialize(mapUrl, myData);



}); // end window.addEventListener("load", ...)
} // end scope





