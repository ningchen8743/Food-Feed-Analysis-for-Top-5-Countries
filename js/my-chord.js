'use strict';

{ // start scope"

//------------------------------------------------------------
// define chord chart class
//------------------------------------------------------------
function ChordChartManager() {
    this.myConfig = null;

    this.mySvg = null;

    this.myData = null;

    this.mySortedDataUpper = null;
    this.mySortedDataLower = null;

    this.myInternalDataUpper = null;
    this.myInternalDataLower = null;

    this.myChordGeneratorUpper = null;
    this.myChordGeneratorLower = null;

    this.myChordDataUpper = null;
    this.myChordDataLower = null;

    this.myGroupsUpper = null;
    this.myGroupsLower = null;

    this.myRibbonUpper = null;
    this.myRibbonLower = null;

    this.myPathsUpper = null;
    this.myPathsLower = null;

    this.myLabels = null;

    this.myText = null;

    this.myFractionUpper = null;
    this.myFractionLower = null;

    this.mySubtendAngleEffective = 0.0;

    this.assembleData = () => {
        // sort upper data
        this.mySortedDataUpper = JSON.parse(JSON.stringify(this.myData));
        this.mySortedDataUpper.sort((a, b) => {
            if(a["total_export"] > b["total_export"])
            {
                return 1;
            }
            else if(a["total_export"] < b["total_export"])
            {
                return -1;
            }
            else
            {
                return 0;
            }
        });

        for(let i = 0; i < this.mySortedDataUpper.length; ++i)
        {
            for(let j = 0; j < this.myData.length; ++j)
            {
                if(this.mySortedDataUpper[i]["country"] === this.myData[j]["country"])
                {
                    this.mySortedDataUpper[i]["internalIdx"] = j;
                }
            }
        }

        // sort lower data
        this.mySortedDataLower = JSON.parse(JSON.stringify(this.myData));
        this.mySortedDataLower.sort((a, b) => {
            if(a["total_food"] > b["total_food"])
            {
                return -1;
            }
            else if(a["total_food"] < b["total_food"])
            {
                return 1;
            }
            else
            {
                return 0;
            }
        });

        for(let i = 0; i < this.mySortedDataLower.length; ++i)
        {
            for(let j = 0; j < this.myData.length; ++j)
            {
                if(this.mySortedDataLower[i]["country"] === this.myData[j]["country"])
                {
                    this.mySortedDataLower[i]["internalIdx"] = j;
                }
            }
        }

        // assemble data for upper plot
        this.myInternalDataUpper = [];
        for(let i = 0; i < this.myData.length + 1; ++i)
        {
            this.myInternalDataUpper.push([]);
        }

        for(let i = 0; i < this.myInternalDataUpper.length - 1; ++i)
        {
            for(let j = 0; j < this.myInternalDataUpper.length; ++j)
            {
                if(j != this.myInternalDataUpper.length - 1)
                {
                    this.myInternalDataUpper[i].push(0);
                }
                else
                {
                    this.myInternalDataUpper[i].push(this.myData[i]["total_export"]);
                }
            }
        }

        for(let j = 0; j < this.myInternalDataUpper.length; ++j)
        {
            this.myInternalDataUpper[this.myInternalDataUpper.length - 1].push(1);
        }

        // assemble data for lower plot
        this.myInternalDataLower = [];
        for(let i = 0; i < this.myData.length + 1; ++i)
        {
            this.myInternalDataLower.push([]);
        }

        for(let i = 0; i < this.myInternalDataLower.length - 1; ++i)
        {
            for(let j = 0; j < this.myInternalDataLower.length; ++j)
            {
                if(j != this.myInternalDataLower.length - 1)
                {
                    this.myInternalDataLower[i].push(0);
                }
                else
                {
                    this.myInternalDataLower[i].push(this.myData[i]["total_food"]);
                }
            }
        }

        for(let j = 0; j < this.myInternalDataLower.length; ++j)
        {
            this.myInternalDataLower[this.myInternalDataLower.length - 1].push(1);
        }

        // calculate fraction
        this.myFractionUpper = new Array(this.myInternalDataUpper.length).fill(0.0);
        {
            let mySum = 0.0;
            for(let j = 0; j < this.myInternalDataUpper.length; ++j)
            {
                mySum += this.myInternalDataUpper[j][this.myInternalDataUpper[j].length - 1];
            }
            for(let j = 0; j < this.myInternalDataUpper.length; ++j)
            {
                this.myFractionUpper[j] = this.myInternalDataUpper[j][this.myInternalDataUpper[j].length - 1] / mySum;
            }
        }

        this.myFractionLower = new Array(this.myInternalDataLower.length).fill(0.0);
        {
            let mySum = 0.0;
            for(let j = 0; j < this.myInternalDataLower.length; ++j)
            {
                mySum += this.myInternalDataLower[j][this.myInternalDataLower[j].length - 1];
            }
            for(let j = 0; j < this.myInternalDataLower.length; ++j)
            {
                this.myFractionLower[j] = this.myInternalDataLower[j][this.myInternalDataLower[j].length - 1] / mySum;
            }
        }

        this.mySubtendAngleEffective = this.myConfig["subtendAngleDegree"] / 180.0 * Math.PI;
        this.mySubtendAngleEffective -= this.myConfig["padAngleRadian"] * (this.myInternalDataUpper.length - 2);
    };

    this.analyzeData = () => {
        this.assembleData();

        // create chord generators
        this.myChordGeneratorUpper = d3.chord()
                                .padAngle(this.myConfig["padAngleRadian"]);
        this.myChordDataUpper = this.myChordGeneratorUpper(this.myInternalDataUpper);

        this.myChordGeneratorLower = d3.chord()
                                .padAngle(this.myConfig["padAngleRadian"]);
        this.myChordDataLower = this.myChordGeneratorLower(this.myInternalDataLower);

        // adjust angles
        {
            let targetAngle = Math.PI;

            let upperStartAngle = -this.myConfig["subtendAngleDegree"] / 180.0 * Math.PI / 2;
            let temp = upperStartAngle;
            for(let j = 0; j < this.mySortedDataUpper.length; ++j)
            {
                let internalIdx = this.mySortedDataUpper[j]["internalIdx"];

                this.myChordDataUpper[internalIdx]["source"]["startAngle"] = temp;
                temp += this.mySubtendAngleEffective * this.myFractionUpper[internalIdx];

                this.myChordDataUpper[internalIdx]["source"]["endAngle"]   = temp;
                temp += this.myConfig["padAngleRadian"];

                this.myChordDataUpper[internalIdx]["target"]["startAngle"] = targetAngle;
                this.myChordDataUpper[internalIdx]["target"]["endAngle"]   = targetAngle;
            }

            this.myChordDataUpper[this.myChordDataUpper.length - 1]["source"]["startAngle"] = targetAngle;
            this.myChordDataUpper[this.myChordDataUpper.length - 1]["source"]["endAngle"] = targetAngle;
            this.myChordDataUpper[this.myChordDataUpper.length - 1]["target"]["startAngle"] = targetAngle;
            this.myChordDataUpper[this.myChordDataUpper.length - 1]["target"]["endAngle"] = targetAngle;
        }

        {
            let targetAngle = 0;
            let lowerStartAngle = Math.PI - this.myConfig["subtendAngleDegree"] / 180.0 * Math.PI / 2;
            let temp = lowerStartAngle;
            for(let j = 0; j < this.mySortedDataLower.length; ++j)
            {
                let internalIdx = this.mySortedDataLower[j]["internalIdx"];

                this.myChordDataLower[internalIdx]["source"]["startAngle"] = temp;
                temp += this.mySubtendAngleEffective * this.myFractionLower[internalIdx];

                this.myChordDataLower[internalIdx]["source"]["endAngle"]   = temp;
                temp += this.myConfig["padAngleRadian"];

                this.myChordDataLower[internalIdx]["target"]["startAngle"] = targetAngle;
                this.myChordDataLower[internalIdx]["target"]["endAngle"]   = targetAngle;
            }

            this.myChordDataLower[this.myChordDataLower.length - 1]["source"]["startAngle"] = targetAngle;
            this.myChordDataLower[this.myChordDataLower.length - 1]["source"]["endAngle"] = targetAngle;
            this.myChordDataLower[this.myChordDataLower.length - 1]["target"]["startAngle"] = targetAngle;
            this.myChordDataLower[this.myChordDataLower.length - 1]["target"]["endAngle"] = targetAngle;
        }

        // console.log(this.myInternalDataUpper);
        // console.log(this.myChordDataUpper);

        // console.log(this.myInternalDataLower);
        // console.log(this.myChordDataLower);

        // The angle is specified in radians,
        // with 0 at -y (12 o’clock) and positive angles proceeding clockwise.
        this.myRibbonUpper = d3.ribbon()
                            .radius(this.myConfig["upperChordRadius"]);

        this.myRibbonLower = d3.ribbon()
                            .radius(this.myConfig["lowerChordRadius"]);
    };

    this.initializeChordChart = (myData, myConfig) => {
        this.myData = myData;
        this.myConfig = myConfig;

        this.analyzeData();

        this.mySvg = d3.select("#my-chord-svg")
                    .attr("width", this.myConfig["plotWidth"])
                    .attr("height", this.myConfig["plotHeight"]);

        this.myGroupsUpper = this.mySvg.append("g")
                                 .attr("transform", `translate(${this.myConfig["plotWidth"] / 2}, ${this.myConfig["upperChordRadius"] + 20})`);

        this.myGroupsLower = this.mySvg.append("g")
                                 .attr("transform", `translate(${this.myConfig["plotWidth"] / 2}, ${this.myConfig["lowerChordRadius"] + this.myConfig["upperChordRadius"] * 2.0 + 20})`);

        // add text
        this.myText = this.mySvg
                        .append("text")
                        .attr("transform", `translate(${this.myConfig["plotWidth"] / 2 + 100}, ${this.myConfig["upperChordRadius"] * 2})`)
                        .text("")
                        .attr("fill", this.myConfig["fontColor"])
                        .attr("font-family", this.myConfig["fontFamily"])
                        .attr("font-size", this.myConfig["fontSize"])
                        .attr("text-anchor", "start")
                        .attr("alignment-baseline", "middle");

        // add chords using ribbon
        this.myPathsUpper = this.myGroupsUpper.append("g")
            .selectAll("path")
            .data(this.myChordDataUpper)
            .enter()
            .append("path")
                .attr("d", this.myRibbonUpper)
                .attr("fill", (d, i) => {
                    if(i < this.myData.length)
                    {
                        return this.myData[i]["color"];
                    }
                    else
                    {
                        return "#000000";
                    }
                })
                .attr("stroke", "none")
                .attr("opacity", this.myConfig["opacity"]);

        this.myPathsLower = this.myGroupsLower.append("g")
            .selectAll("path")
            .data(this.myChordDataLower)
            .enter()
            .append("path")
                .attr("d", this.myRibbonLower)
                .attr("fill", (d, i) => {
                    if(i < this.myData.length)
                    {
                        return this.myData[i]["color"];
                    }
                    else
                    {
                        return "#000000";
                    }
                })
                .attr("stroke", "none")
                .attr("opacity", this.myConfig["opacity"]);

        this.myPathsUpper
        .on("mouseover", (d, i, nodes) => {
            d3.select(nodes[i])
                .attr("opacity", 1.0);

            let spouseNode = this.myPathsLower.nodes()[i];
            d3.select(spouseNode)
                .attr("opacity", 1.0);

			let internalIdx = d["source"]["index"];
			let countryName = this.myData[internalIdx]["country"];
			this.myText
				.text(`exportation: ${this.myData[internalIdx]["total_export"]}, domestic food: ${this.myData[internalIdx]["total_food"]}`);
        })
        .on("mouseout", (d, i, nodes) => {
            d3.select(nodes[i])
                .attr("opacity", this.myConfig["opacity"]);

            let spouseNode = this.myPathsLower.nodes()[i];
            d3.select(spouseNode)
                .attr("opacity", this.myConfig["opacity"]);

			this.myText
				.text("");
        });

        this.myPathsLower
        .on("mouseover", (d, i, nodes) => {
            d3.select(nodes[i])
                .attr("opacity", 1.0);

            let spouseNode = this.myPathsUpper.nodes()[i];
            d3.select(spouseNode)
                .attr("opacity", 1.0);

			let internalIdx = d["source"]["index"];
			let countryName = this.myData[internalIdx]["country"];
			this.myText
				.text(`exportation: ${this.myData[internalIdx]["total_export"]}, domestic consumption: ${this.myData[internalIdx]["total_food"]}`);

        })
        .on("mouseout", (d, i, nodes) => {
            d3.select(nodes[i])
                .attr("opacity", this.myConfig["opacity"]);

            let spouseNode = this.myPathsUpper.nodes()[i];
            d3.select(spouseNode)
                .attr("opacity", this.myConfig["opacity"]);

			this.myText
				.text("");
        });

        // add chords using ribbon
        this.myLabels = this.myGroupsLower.append("g")
            .selectAll("text")
            .data(this.myChordDataLower)
            .enter()
            .append("text")
                .text((d, i) => {
                    if(i < this.myData.length)
                    {
                        return this.myData[i]["country"];
                    }
                })
                .attr("fill", this.myConfig["fontColor"])
                .attr("font-family", this.myConfig["fontFamily"])
                .attr("font-size", this.myConfig["fontSize"])
                .attr("text-anchor", "middle")
                .attr("alignment-baseline", "middle")
                .attr("transform", (d, i) => {
                    let transformCmd = "translate(0, 0)";

                    if(i < this.myData.length)
                    {
                        let rotateDegree = 180.0 / Math.PI * (d["source"]["startAngle"] + d["source"]["endAngle"]) / 2.0;
                        transformCmd = `rotate(${rotateDegree - 90}) translate(250, 0)`;

                        if(rotateDegree > 180.0)
                        {
                            transformCmd += "scale(-1, -1)";
                        }
                    }

                    return transformCmd;
                });
    };

}


//------------------------------------------------------------
// define main onload event
//------------------------------------------------------------
window.addEventListener("load", (event) => {

let ccm = new ChordChartManager();

// configure object
const myConfig = {
    "plotWidth" : 1100,
    "plotHeight" : 700,
    // "margin" : {"top" : 100, "bottom" : 20, "middle" : 100},
    "fontFamily" : "\"Century Gothic\", CenturyGothic, sans-serif",
    "fontColor" : "#ffffff",
    "fontSize" : 14,
    "opacity" : 0.4,
    "opacityMouseOver" : 1.0,
    "upperChordRadius" : 100,
    "lowerChordRadius" : 200,
    "padAngleRadian" : 0.1,
    "subtendAngleDegree" : 200,
};


// data to be displayed
const myData = [
    {"country" : "China"          , "total_export" :  38930 , "total_food" : 1300606 , "color" : "#FF7F0E"},
    {"country" : "India"          , "total_export" :  30320 , "total_food" : 680830  , "color" : "#BCBD22"},
    {"country" : "USA"            , "total_export" :  138222, "total_food" : 279127  , "color" : "#1F77B4"},
    {"country" : "Brazil"         , "total_export" :  80089 , "total_food" : 134165  , "color" : "#2CA02C"},
    {"country" : "Russia"         , "total_export" :  50279 , "total_food" : 115106  , "color" : "#9C675C"},
    {"country" : "Canada"         , "total_export" :  44325 , "total_food" : 28167   , "color" : "#E83F40"},
    {"country" : "France"         , "total_export" :  51546 , "total_food" : 52894   , "color" : "#9258C7"},
    {"country" : "Germany"        , "total_export" :  49203 , "total_food" : 64123   , "color" : "#949494"},
    {"country" : "Netherlands"     , "total_export" :  43391 , "total_food" : 14129   , "color" : "#E879C6"},
];

ccm.initializeChordChart(myData, myConfig);



}); // end window.addEventListener("load", ...)
} // end scope





