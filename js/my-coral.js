'use strict';

{ // start scope"

//------------------------------------------------------------
// define coral chart class
//------------------------------------------------------------
function CoralChartManager() {
    this.myConfig = null;

    this.mySvg = null;

    this.myData = null;
    this.myData2 = null;

    this.upperPlot = null;

    this.circleList = null;

    this.globalMinValueCircle = 1e6;
    this.globalMaxValueCircle = -1e6;

    this.globalMinCountryTotal = 1e6;
    this.globalMaxCountryTotal = -1e6;

    this.globalMinFoodTotal = 1e6;
    this.globalMaxFoodTotal = -1e6;

    this.circleRadiusScale = null;

    this.simulationList = null;

    this.yScaleCircle = null;

    this.yScaleBox = null;

    this.foodLabelList = null;

    this.countryBoxList = null;

    this.countryNameList = null;

    this.countryLabelList = null;

    this.lowerPlot = null;

    this.foodIdxList = null;

    this.curveList = null;

    this.myCurve = null;

    this.simulationDataNodes = null;

    this.circleAxis = null;

    this.boxAxis = null;

    this.pattern = null;

    this.analyzeData = () => {
        // get extrema
        for(let foodIdx = 0; foodIdx < this.myData.length; ++foodIdx)
        {
            if(this.globalMinFoodTotal > this.myData[foodIdx]["total"])
            {
                this.globalMinFoodTotal = this.myData[foodIdx]["total"];
            }

            if(this.globalMaxFoodTotal < this.myData[foodIdx]["total"])
            {
                this.globalMaxFoodTotal = this.myData[foodIdx]["total"];
            }

            // iterate countryData
            for(let cIdx = 0; cIdx < this.myData[foodIdx]["internalData"].length; ++cIdx)
            {
                if(this.globalMinValueCircle > this.myData[foodIdx]["internalData"][cIdx]["value"])
                {
                    this.globalMinValueCircle = this.myData[foodIdx]["internalData"][cIdx]["value"];
                }

                if(this.globalMaxValueCircle < this.myData[foodIdx]["internalData"][cIdx]["value"])
                {
                    this.globalMaxValueCircle = this.myData[foodIdx]["internalData"][cIdx]["value"];
                }
            }
        }

        for(let cIdx = 0; cIdx < this.myData2.length; ++cIdx)
        {
            if(this.globalMinCountryTotal > this.myData2[cIdx]["total"])
            {
                this.globalMinCountryTotal = this.myData2[cIdx]["total"];
            }

            if(this.globalMaxCountryTotal < this.myData2[cIdx]["total"])
            {
                this.globalMaxCountryTotal = this.myData2[cIdx]["total"];
            }
        }

        // console.log(this.globalMinFoodTotal);
        // console.log(this.globalMaxFoodTotal);
        // console.log(this.globalMinValueCircle);
        // console.log(this.globalMaxValueCircle);
        // console.log(this.globalMinCountryTotal);
        // console.log(this.globalMaxCountryTotal);

        // derive country name list
        this.countryNameList = this.myData[0]["internalData"].map((el) => {
            return el["country"];
        });

        // derive food index list
        this.foodIdxList = {};

        for(let foodIdx = 0; foodIdx < this.myData.length; ++foodIdx)
        {
            let myKey = this.myData[foodIdx]["food"];
            let myValue = foodIdx;
            this.foodIdxList[myKey] = myValue;
        }
    };

    this.initializeCoralChart = (myData, myData2, myConfig) => {
        this.myData = myData;
        this.myData2 = myData2;
        this.myConfig = myConfig;

        this.analyzeData();

        if(this.myConfig["enableLog"])
        {
            this.circleRadiusScale = d3.scaleLog()
                            .domain([this.globalMinValueCircle, this.globalMaxValueCircle])
                            .range([5, 18])
                            .nice();

            this.yScaleCircle = d3.scaleLog()
                            .domain([0, this.globalMaxFoodTotal])
                            .range([
                                this.myConfig["upperHeight"] - this.myConfig["margin"]["middle"],
                                this.myConfig["margin"]["top"]
                            ])
                            .nice();

            this.yScaleBox = d3.scaleLog()
                            .domain([0, this.globalMaxCountryTotal])
                            .range([
                                this.myConfig["plotHeight"] - this.myConfig["margin"]["bottom"],
                                this.myConfig["upperHeight"]
                            ])
                            .nice();
        }
        else
        {
            this.circleRadiusScale = d3.scaleLinear()
                            .domain([this.globalMinValueCircle, this.globalMaxValueCircle])
                            .range([1, 80])
                            .nice();

            this.yScaleCircle = d3.scaleLinear()
                            .domain([0, this.globalMaxFoodTotal])
                            .range([
                                this.myConfig["upperHeight"] - this.myConfig["margin"]["middle"],
                                this.myConfig["margin"]["top"]
                            ])
                            .nice();

            this.yScaleBox = d3.scaleLinear()
                            .domain([0, this.globalMaxCountryTotal])
                            .range([
                                this.myConfig["plotHeight"] - this.myConfig["margin"]["bottom"],
                                this.myConfig["upperHeight"]
                            ])
                            .nice();
        }


        this.mySvg = d3.select("#my-coral-svg")
                        .attr("width", this.myConfig["plotWidth"])
                        .attr("height", this.myConfig["plotHeight"]);

        //++++++++++++++++++++++++++++++
        // add pattern
        //++++++++++++++++++++++++++++++
        /* this.pattern = this.mySvg.append("defs")
                        .append("pattern")
                            .attr("id", "my-circle-1")
                            .attr("width", 100)
                            .attr("height", 100)
                            .attr("patternUnits", "userSpaceOnUse")

        this.pattern.append("image")
            .attr("href", "chalk-stroke-2.png")
            .attr("x", 0)
            .attr("y", 0)
            .attr("width", 100)
            .attr("height", 100); */

        //++++++++++++++++++++++++++++++
        // add lower plot
        //++++++++++++++++++++++++++++++
        this.lowerPlot = this.mySvg.append("g")
                            .classed("lower-plot", true)
                            .selectAll("g")
                            .data(this.myData2)
                            .enter()
                            .append("g");

        this.countryBoxList = this.lowerPlot
                                .append("rect")
                                .attr("x", (d, i) => {
                                    let delta = this.myConfig["plotWidth"] / (this.myData2.length + 2);
                                    let xLocation = delta * (i + 1);
                                    return xLocation;
                                })
                                .attr("y", (d, i) => {
                                    return this.yScaleBox(d["total"]) - this.myConfig["countryBoxHeight"] / 2;
                                })
                                .attr("width", this.myConfig["countryBoxWidth"])
                                .attr("height", this.myConfig["countryBoxHeight"])
                                .attr("fill", this.myConfig["countryBoxColor"])
                                .on("mouseover", (d, i, nodes) => {
                                    // change box geometry
                                    let magnifyCoeff = 1.3;
                                    let delta = this.myConfig["plotWidth"] / (this.myData2.length + 2);
                                    let xLocation = delta * (i + 1);
                                    xLocation -= this.myConfig["countryBoxWidth"] * (magnifyCoeff - 1) / 2;

                                    d3.select(nodes[i])
                                        .attr("x", xLocation)
                                        .attr("width", this.myConfig["countryBoxWidth"] * magnifyCoeff)
                                        .attr("height", this.myConfig["countryBoxHeight"] * magnifyCoeff);

                                    // change circles
                                    d3.selectAll(".my-circle")
                                        .filter((dd) => {
                                            return dd["country"] == d["country"];
                                        })
                                        .attr("r", (dd) => {
                                            let myRadius = this.circleRadiusScale(dd["value"]);
                                            myRadius *= 1.1;

                                            if(dd["value"] < this.myConfig["threshold"])
                                            {
                                                myRadius = 0;
                                            }

                                            return myRadius;
                                        })
                                        .attr("opacity", this.myConfig["circleOpacityMouseOver"])
                                        // change connecting curves
                                        .each((dd, ii, nnodes) => {
                                            // assume that circle immediately precedes path
                                            let myPath = d3.select(nnodes[ii].nextElementSibling);
                                            let newCurveWidth = this.myConfig["curveWidthMouseOver"];

                                            if(dd["value"] < this.myConfig["threshold"])
                                            {
                                                newCurveWidth = 0;
                                            }

                                            myPath.attr("stroke-width", newCurveWidth)
                                                  .attr("opacity", this.myConfig["circleOpacityMouseOver"]);

                                            this.updateForce();
                                        });
                                })
                                .on("mouseout", (d, i, nodes) => {
                                    // change box geometry
                                    let delta = this.myConfig["plotWidth"] / (this.myData2.length + 2);
                                    let xLocation = delta * (i + 1);
                                    d3.select(nodes[i])
                                        .attr("x", xLocation)
                                        .attr("width", this.myConfig["countryBoxWidth"])
                                        .attr("height", this.myConfig["countryBoxHeight"]);

                                    // change circles
                                    d3.selectAll(".my-circle")
                                        .filter((dd) => {
                                            return dd["country"] == d["country"];
                                        })
                                        .attr("r", (dd) => {
                                            let myRadius = this.circleRadiusScale(dd["value"]);

                                            if(dd["value"] < this.myConfig["threshold"])
                                            {
                                                myRadius = 0;
                                            }

                                            return myRadius;
                                        })
                                        .attr("opacity", this.myConfig["circleOpacity"])
                                        // change connecting curves
                                        .each((dd, ii, nnodes) => {
                                            // assume that circle immediately precedes path
                                            let myPath = d3.select(nnodes[ii].nextElementSibling);
                                            let newCurveWidth = this.myConfig["curveWidth"];

                                            if(dd["value"] < this.myConfig["threshold"])
                                            {
                                                newCurveWidth = 0;
                                            }

                                            myPath.attr("stroke-width", newCurveWidth)
                                                  .attr("opacity", this.myConfig["circleOpacity"]);

                                            this.updateForce();
                                        });
                                });

        this.countryLabelList = this.lowerPlot
                                    .append("text")
                                    .text((d) => {
                                            return d["country"];
                                        })
                                    .attr("x", (d, i) => {
                                        let delta = this.myConfig["plotWidth"] / (this.myData2.length + 2);
                                        let xLocation = delta * (i + 1);
                                        return xLocation;
                                    })
                                    .attr("y", (d, i) => {
                                        return this.yScaleBox(d["total"]) + 40;
                                    })
                                    .attr("fill", this.myConfig["fontColor"])
                                    .attr("font-family", this.myConfig["fontFamily"])
                                    .attr("font-size", this.myConfig["fontSize"])
                                    .attr("text-anchor", "middle")
                                    .attr("alignment-baseline", "middle");

        //++++++++++++++++++++++++++++++
        // add upper plot
        //++++++++++++++++++++++++++++++
        this.upperPlot = this.mySvg.append("g")
                            .classed("upper-plot", true)
                            .selectAll(".circle-group")
                            .data(this.myData)
                            .enter()
                            .append("g")
                            .classed("circle-group", true);

        this.circleList = this.upperPlot.selectAll(".circle-sub-group")
            .data((d) => {
                return d["internalData"];
            })
            .enter()
            .append("g")
            .classed("circle-sub-group", true)
            .append("circle")
            .classed("my-circle", true)
            .attr("cx", (d, i, nodes) => {
                // equivalent to nodes[i].parentNode.__data__
                let parentNodeData = d3.select(nodes[i].parentNode.parentNode).datum();
                let foodName = parentNodeData["food"];
                let idx = this.foodIdxList[foodName];
                let delta = this.myConfig["plotWidth"] / (Object.keys(this.foodIdxList).length + 2);
                let xLocation = delta * (idx + 1);
                return xLocation;
            })
            .attr("cy", (d, i, nodes) => {
                // equivalent to nodes[i].parentNode.__data__
                let parentNodeData = d3.select(nodes[i].parentNode.parentNode).datum();
                let totalValue = parentNodeData["total"];
                let yLocation = this.yScaleCircle(totalValue);
                return yLocation;
            })
            .attr("r", (d) => {
                let myRadius = this.circleRadiusScale(d["value"]);

                if(d["value"] < this.myConfig["threshold"])
                {
                    myRadius = 0;
                }

                return myRadius;
            })
            .attr("fill", (d) => {
                // return "url(#my-circle-1)";
                let temp = this.myData2.find((el) => {
                    return el["country"] == d["country"];
                });
                return temp["color"];
            })
            .attr("opacity", this.myConfig["circleOpacity"])
            .on("mouseover", (d, i, nodes) => {
                let thisSelect = d3.select(nodes[i]);

                let myRadius = this.circleRadiusScale(d["value"]);
                myRadius *= 1.1;

                if(d["value"] < this.myConfig["threshold"])
                {
                    myRadius = 0;
                }

                thisSelect.attr("r", myRadius);
                thisSelect.attr("opacity", this.myConfig["circleOpacityMouseOver"]);

                // assume that circle immediately precedes path
                let myPath = d3.select(nodes[i].nextElementSibling);
                let newCurveWidth = this.myConfig["curveWidthMouseOver"];
                myPath.attr("stroke-width", newCurveWidth)
                      .attr("opacity", this.myConfig["circleOpacityMouseOver"]);

                this.updateForce();
            })
            .on("mouseout", (d, i, nodes) => {
                let thisSelect = d3.select(nodes[i]);

                let myRadius = this.circleRadiusScale(d["value"]);

                if(d["value"] < this.myConfig["threshold"])
                {
                    myRadius = 0;
                }

                thisSelect.attr("r", myRadius);
                thisSelect.attr("opacity", this.myConfig["circleOpacity"]);

                // assume that circle immediately precedes path
                let myPath = d3.select(nodes[i].nextElementSibling);
                myPath.attr("stroke-width", this.myConfig["curveWidth"])
                      .attr("opacity", this.myConfig["circleOpacity"]);

                this.updateForce();
            });

        this.foodLabelList = d3.selectAll(".circle-group")
                                .append("text")
                                .text((d) => {
                                    return d["food"];
                                })
                                .attr("x", (d) => {
                                    let foodName = d["food"];
                                    let idx = this.foodIdxList[foodName];
                                    let delta = this.myConfig["plotWidth"] / (Object.keys(this.foodIdxList).length + 2);
                                    let xLocation = delta * (idx + 1);
                                    return xLocation;
                                })
                                .attr("y", (d) => {
                                    let totalValue = d["total"];
                                    let yLocation = this.yScaleCircle(totalValue) - 60;
                                    return yLocation;
                                })
                                .attr("fill", this.myConfig["fontColor"])
                                .attr("font-family", this.myConfig["fontFamily"])
                                .attr("font-size", this.myConfig["fontSize"])
                                .attr("text-anchor", "middle")
                                .attr("alignment-baseline", "middle");

        //++++++++++++++++++++++++++++++
        // add connecting curves
        //++++++++++++++++++++++++++++++
        this.myCurve = d3.line()
                        .curve(d3.curveBasis);

        this.curveList = this.upperPlot.selectAll(".circle-sub-group")
            .append("path");

        this.updateCurve();


        this.curveList.attr("stroke", (d, i, nodes) => {
                // assume that circle immediately precedes path
                let myCircle = d3.select(nodes[i].previousElementSibling);
                // return myCircle.attr("fill");

                let myData = myCircle.data();
                let countryName = myData[0]["country"];

                let temp = this.myData2.find((el) => {
                    return el["country"] == countryName;
                });

                return temp["color"];
            })
            .attr("stroke-width", (d, i, nodes) => {
                let myCircle = d3.select(nodes[i].previousElementSibling);

                if(myCircle.data()[0]["value"] < this.myConfig["threshold"])
                {
                    return 0;
                }
                else
                {
                    return this.myConfig["curveWidth"];
                }
            })
            .attr("fill", "none")
            .attr("opacity", this.myConfig["circleOpacity"]);



        //++++++++++++++++++++++++++++++
        // add force simulation
        //++++++++++++++++++++++++++++++
        // for each element in the array this.myData
        // the force simulation adds the following properties:
        //     index - the node's zero-based index into nodes
        //     x - the node's current x-position
        //     y - the node's current y-position
        //     vx - the node's current x-velocity
        //     vy - the node's current y-velocity

        this.simulationList = Array(this.myData.length).fill(null);
        this.simulationDataNodes = Array(this.myData.length).fill(null);

        for(let i = 0; i < this.myData.length; ++i)
        {
            // calculate x location of the central force
            let foodName = this.myData[i]["food"];
            let idx = this.foodIdxList[foodName];
            let delta = this.myConfig["plotWidth"] / (Object.keys(this.foodIdxList).length + 2);
            let xLocation = delta * (idx + 1);

            // calculate y location of the central force
            let totalValue = this.myData[i]["total"];
            let yLocation = this.yScaleCircle(totalValue);

            this.simulationDataNodes[i] = this.mySvg.selectAll(".circle-group")
                .filter((d, j) => { // select the i-th group
                    return i == j;
                })
                .selectAll("circle") // select all circles of the i-th group
                .nodes();

            this.simulationList[i] = d3.forceSimulation(this.simulationDataNodes[i])
                .force('charge', d3.forceManyBody().strength(5))
                .force('center', d3.forceCenter()
                    .x(xLocation)
                    .y(yLocation)
                    )
                .force("collide", d3.forceCollide((d) => {
                    let myRadius = Number(d3.select(d).attr("r"));
                    return myRadius;
                }))
                .stop();

            // call force simulation
            this.simulationList[i].on('tick', () => {
                // update circle location
                this.mySvg.selectAll(".circle-group")
                    .filter((d, j) => { // select the i-th group
                        return i == j;
                    })
                    .selectAll("circle") // select all circles of the i-th group
                    .attr("cx", (d, j) => {
                        return this.simulationDataNodes[i][j]["x"];
                    })
                    .attr("cy", (d, j) => {

                        return this.simulationDataNodes[i][j]["y"];
                    });

                // update curve location
                this.updateCurve();
            });

            this.simulationList[i].restart();
        }

        //++++++++++++++++++++++++++++++
        // add axis
        //++++++++++++++++++++++++++++++
        /* let myAxisCircle = d3.axisRight(this.yScaleCircle)
                                .ticks(4);

        this.circleAxis = this.mySvg.select(".upper-plot")
            .append("g")
            .classed("my-axis", true)
            .attr("transform", `translate(${this.myConfig["plotWidth"] - 60}, 0)`)
            .call(myAxisCircle);

        this.circleAxis.selectAll("path")
            .attr("stroke", "none");
        this.circleAxis.selectAll("line")
            .attr("stroke", this.myConfig["fontColor"]);
        this.circleAxis.selectAll("text")
            .attr("fill", this.myConfig["fontColor"])
            .attr("font-family", this.myConfig["fontFamily"]);



        let myAxisBox = d3.axisLeft(this.yScaleBox)
                            .ticks(4);

        this.boxAxis = this.mySvg.select(".lower-plot")
            .append("g")
            .classed("my-axis", true)
            .attr("transform", `translate(50, 0)`)
            .call(myAxisBox);

        this.boxAxis.selectAll("path")
            .attr("stroke", "none");
        this.boxAxis.selectAll("line")
            .attr("stroke", this.myConfig["fontColor"]);
        this.boxAxis.selectAll("text")
            .attr("fill", this.myConfig["fontColor"])
            .attr("font-family", this.myConfig["fontFamily"]); */


    };

    this.updateCoralChart = () => {
    };

    this.updateCurve = () => {
        this.curveList
            .attr("d", (d, i, nodes) => {
                // assume that circle immediately precedes path
                let myCircle = d3.select(nodes[i].previousElementSibling);
                let myRadius = Number(myCircle.attr("r"));
                let startX = Number(myCircle.attr("cx"));
                let startY = Number(myCircle.attr("cy"));

                let myBox = null;

                this.countryBoxList.each((dd, ii, nnodes) => {

                    if(d["country"] == dd["country"])
                    {
                        myBox = d3.select(nnodes[ii]);
                    }
                });

                let endX = Number(myBox.attr("x")) + Number(myBox.attr("width")) / 2;
                let endY = Number(myBox.attr("y"));

                let midX1 = 0;
                let midY1 = 0;

                let midX2 = endX;
                let midY2 = endY - 100;

                if(startX < endX)
                {
                    startX -= myRadius;
                    midX1 = startX + 2;
                }
                else
                {
                    startX += myRadius;
                    midX1 = startX - 2;
                }

                midY1 = startY + myRadius;

                return this.myCurve([[startX, startY], [midX1, midY1], [midX2, midY2], [endX, endY]]);
            });
    };

    this.updateForce = () => {
        for(let i = 0; i < this.simulationList.length; ++i)
        {
            this.simulationList[i]
                .force("collide", d3.forceCollide((d) => {
                    let myRadius = Number(d3.select(d).attr("r"));
                    return myRadius;
                }));

            this.simulationList[i].alpha(1);
            this.simulationList[i].restart();
        }
    };
}


//------------------------------------------------------------
// define main onload event
//------------------------------------------------------------
window.addEventListener("load", (event) => {

let rcm = new CoralChartManager();

// configure object
const myConfig = {
    "plotWidth" : 900,
    "plotHeight" : 800,
    "upperHeight" : 600,
    "margin" : {"top" : 100, "bottom" : 20, "middle" : 100},
    "fontFamily" : "\"Century Gothic\", CenturyGothic, sans-serif",
    "fontColor" : "#ffffff",
    "fontSize" : 14,
    "countryBoxWidth" : 10,
    "countryBoxHeight" : 20,
    "countryBoxColor" : "#ffb266",
    "curveWidth" : 0.5,
    "curveWidthMouseOver" : 0.5,
    "circleOpacity" : 0.2,
    "circleOpacityMouseOver" : 1.0,
    // "enableLog" : true,
    "threshold" : 200,
};


// data to be displayed
const myData = [
    {"food" : "starchy roots",
     "total" : 22025,
     "internalData" : [
        {"country" : "China"       , "value" : 886   },
        {"country" : "India"       , "value" : 420   },
        {"country" : "USA"         , "value" : 3845  },
        {"country" : "Brazil"      , "value" : 87    },
        {"country" : "Russia"      , "value" : 194   },
        {"country" : "Canada"      , "value" : 2301  },
        {"country" : "France"      , "value" : 2448  },
        {"country" : "Germany"     , "value" : 4589  },
        {"country" : "Netherlands" , "value" : 7255  },
    ]},
    {"food" : "sugar",
     "total" : 48196,
     "internalData" : [
        {"country" : "China"       , "value" : 2505  },
        {"country" : "India"       , "value" : 2429  },
        {"country" : "USA"         , "value" : 3665  },
        {"country" : "Brazil"      , "value" : 29338 },
        {"country" : "Russia"      , "value" : 952   },
        {"country" : "Canada"      , "value" : 656   },
        {"country" : "France"      , "value" : 4269  },
        {"country" : "Germany"     , "value" : 2627  },
        {"country" : "Netherlands" , "value" : 1755 },
    ]},
    {"food" : "pulses",
     "total" : 9380,
     "internalData" : [
        {"country" : "China"       , "value" : 463  },
        {"country" : "India"       , "value" : 156  },
        {"country" : "USA"         , "value" : 1353 },
        {"country" : "Brazil"      , "value" : 123  },
        {"country" : "Russia"      , "value" : 1254 },
        {"country" : "Canada"      , "value" : 5466 },
        {"country" : "France"      , "value" : 437  },
        {"country" : "Germany"     , "value" : 79   },
        {"country" : "Netherlands" , "value" : 49   },
    ]},
    {"food" : "treenuts",
     "total" : 3239,
     "internalData" : [
        {"country" : "China"       , "value" : 385   },
        {"country" : "India"       , "value" : 405   },
        {"country" : "USA"         , "value" : 2036  },
        {"country" : "Brazil"      , "value" : 49    },
        {"country" : "Russia"      , "value" : 41    },
        {"country" : "Canada"      , "value" : 28    },
        {"country" : "France"      , "value" : 62    },
        {"country" : "Germany"     , "value" : 116   },
        {"country" : "Netherlands" , "value" : 117   },
    ]},
    {"food" : "cereal",
     "total" : 272365,
     "internalData" : [
        {"country" : "China"       , "value" : 3768   },
        {"country" : "India"       , "value" : 19770  },
        {"country" : "USA"         , "value" : 93954  },
        {"country" : "Brazil"      , "value" : 31192  },
        {"country" : "Russia"      , "value" : 44115  },
        {"country" : "Canada"      , "value" : 30488  },
        {"country" : "France"      , "value" : 28735  },
        {"country" : "Germany"     , "value" : 16961  },
        {"country" : "Netherlands" , "value" : 3382   },
    ]},
    {"food" : "vegetables",
     "total" : 32403,
     "internalData" : [
        {"country" : "China"       , "value" : 13885   },
        {"country" : "India"       , "value" : 2673    },
        {"country" : "USA"         , "value" : 5083    },
        {"country" : "Brazil"      , "value" : 375     },
        {"country" : "Russia"      , "value" : 221     },
        {"country" : "Canada"      , "value" : 1160    },
        {"country" : "France"      , "value" : 2020    },
        {"country" : "Germany"     , "value" : 947     },
        {"country" : "Netherlands" , "value" : 6039    },
    ]},
    {"food" : "fruits",
     "total" : 34689,
     "internalData" : [
        {"country" : "China"       , "value" : 5970     },
        {"country" : "India"       , "value" : 1028     },
        {"country" : "USA"         , "value" : 6473     },
        {"country" : "Brazil"      , "value" : 11447    },
        {"country" : "Russia"      , "value" : 182      },
        {"country" : "Canada"      , "value" : 487      },
        {"country" : "France"      , "value" : 1673     },
        {"country" : "Germany"     , "value" : 1907     },
        {"country" : "Netherlands" , "value" : 5522     },
    ]},
    {"food" : "meat",
     "total" : 28456,
     "internalData" : [
        {"country" : "China"       , "value" : 1741 },
        {"country" : "India"       , "value" : 1346 },
        {"country" : "USA"         , "value" : 7585 },
        {"country" : "Brazil"      , "value" : 7227 },
        {"country" : "Russia"      , "value" : 213  },
        {"country" : "Canada"      , "value" : 1946 },
        {"country" : "France"      , "value" : 1345 },
        {"country" : "Germany"     , "value" : 3626 },
        {"country" : "Netherlands" , "value" : 3427 },
    ]},
    {"food" : "milk and eggs",
     "total" : 55315,
     "internalData" : [
        {"country" : "China"       , "value" : 262     },
        {"country" : "India"       , "value" : 346     },
        {"country" : "USA"         , "value" : 11595   },
        {"country" : "Brazil"      , "value" : 161     },
        {"country" : "Russia"      , "value" : 394     },
        {"country" : "Canada"      , "value" : 931     },
        {"country" : "France"      , "value" : 10107   },
        {"country" : "Germany"     , "value" : 16870   },
        {"country" : "Netherlands" , "value" : 14649   },
    ]},
    {"food" : "fish and seafoods",
     "total" : 20237,
     "internalData" : [
        {"country" : "China"       , "value" : 9065    },
        {"country" : "India"       , "value" : 1747    },
        {"country" : "USA"         , "value" : 2633    },
        {"country" : "Brazil"      , "value" : 90      },
        {"country" : "Russia"      , "value" : 2713    },
        {"country" : "Canada"      , "value" : 862     },
        {"country" : "France"      , "value" : 450     },
        {"country" : "Germany"     , "value" : 1481    },
        {"country" : "Netherlands" , "value" : 1196    },
    ]},

];

const myData2 = [
    {"country" : "China"       , "total" : 38930  , "color" : "#FF7F0E"},
    {"country" : "India"       , "total" : 30320  , "color" : "#BCBD22"},
    {"country" : "USA"         , "total" : 138222 , "color" : "#1F77B4"},
    {"country" : "Brazil"      , "total" : 80089  , "color" : "#2CA02C"},
    {"country" : "Russia"      , "total" : 50279  , "color" : "#9C675C"},
    {"country" : "Canada"      , "total" : 44325  , "color" : "#E83F40"},
    {"country" : "France"      , "total" : 51546  , "color" : "#9258C7"},
    {"country" : "Germany"     , "total" : 49203  , "color" : "#949494"},
    {"country" : "Netherlands" , "total" : 43391  , "color" : "#E879C6"},
];


rcm.initializeCoralChart(myData, myData2, myConfig);



}); // end window.addEventListener("load", ...)
} // end scope





