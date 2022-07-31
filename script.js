//########## begin   GLOBAL Variables   #######

let currentSlide = 1;
const slidesContainer = document.getElementById("slides-container");
const slide = document.querySelector(".slide");
const prevButton = document.getElementById("slide-arrow-prev");
const nextButton = document.getElementById("slide-arrow-next");
const slideCount = document.querySelectorAll(".slide").length;
// parse the date / time
var parseTime = d3.timeParse("%Y-%m-%d");
var formatTime = d3.timeFormat("%m/%d");

const russiaEquipmentLosses = [];

const equipmentClassification = {
  airforce: ["Aircraft", "Helicopter", "Drone"],
  military: [
    "Tank",
    "APC",
    "MRL",
    "Field Artillery",
    "Military Auto",
    "Fuel tank"
  ],
  navy: ["Naval Ship", "Personnel"],
  persons: ["Personnel"]
};

const chartAnnotations = {
  airforce: [
    { date: "2022-02-26", title: "Max equipment loss" },
    { date: "2022-05-02", title: "Max drones shot down" }
  ],
  military: [],
  navy: [{ date: "2022-04-15", title: "Sinking of Moskva" }],
  persons: []
};

const csvFields = [
  "Aircraft",
  "Helicopter",
  "Drone",
  "Tank",
  "APC",
  "MRL",
  "Field Artillery",
  "Military Auto",
  "Fuel tank",
  "Naval Ship",
  "Anti-aircraft Warfare",
  "Personnel"
];

let selectedAirforceOptions = [...equipmentClassification.airforce];

let selectedMilitaryOptions = [...equipmentClassification.military];

let selectedNavyOptions = ["Naval Ship"];

const sliderMonth2Dates = {
  Feb: "2022-02-28",
  March: "2022-03-31",
  April: "2022-04-30",
  May: "2022-05-31",
  June: "2022-06-30",
  July: "2022-07-31"
};

const sliderValues = {
  airforce: "2022-07-31",
  military: "2022-07-31",
  navy: "2022-07-31"
};
// ########## end   GLOBAL Variables   #######

//########## begin   GLOBAL Events   #######

window.onload = () => {
  d3.csv(
    "https://gist.githubusercontent.com/venkatesh-katari/ba051cb7fbf2d192d2ee82dd5be74e40/raw/ef704d429e78ecadb90ff23c590368fa89e27f85/russia_equipment_loss.csv",
    function (data) {
      data.date = parseTime(data.date);
      russiaEquipmentLosses.push(data);
    }
  );
};

nextButton.addEventListener("click", () => {
  if (currentSlide < slideCount) {
    currentSlide = currentSlide + 1;
  }
  const slideWidth = slide.clientWidth;
  slidesContainer.scrollLeft += slideWidth;
  renderSlideCharts();
});

prevButton.addEventListener("click", () => {
  if (currentSlide > 1) {
    currentSlide = currentSlide - 1;
  }
  const slideWidth = slide.clientWidth;
  slidesContainer.scrollLeft -= slideWidth;
  renderSlideCharts();
});

function getSelectedAirforceOptions(sel) {
  selectedAirforceOptions = getSelectedOptions(sel);
  renderSlideCharts();
}

function getSelectedMilitaryOptions(sel) {
  selectedMilitaryOptions = getSelectedOptions(sel);
  renderSlideCharts();
}

function getSelectedNavyOptions(sel) {
  selectedNavyOptions = getSelectedOptions(sel);
  renderSlideCharts();
}

function updateSliderValues(category) {
  const sliderId = `${category}-range`;
  const labelId = `${category}-range-label`;
  const value = document.getElementById(sliderId).value;

  const sliderDateLabel = sliderValueToDateLabel(value);
  sliderValues[category] = sliderMonth2Dates[sliderDateLabel];
  document.getElementById(labelId).innerHTML = `${sliderDateLabel}`;
  renderSlideCharts();
}

function gotoSlide(n) {
  window.scrollTo(0, 0);
  const slidesToMove = n - currentSlide;
  const slideWidth = slide.clientWidth;
  slidesContainer.scrollLeft += slidesToMove * slideWidth;
  currentSlide = n;
  renderSlideCharts();
  window.setTimeout(() => {
    d3.select(".slides-container").node().scrollTop = 0;
  }, 1000);
}

//########## end   GLOBAL Events   #######

//########## beign  data utils   #######

function sliderValueToDateLabel(value) {
  var months = ["Feb", "March", "April", "May", "June", "July"];
  return months[value / 10 - 1];
}

function mapDataToChartData(xData, yData) {
  return xData.map((data, idx) => {
    return {
      xData: data,
      yData: yData[idx]
    };
  });
}

function getSelectedOptions(sel) {
  return [...sel.options]
    .filter((opt) => {
      return opt.selected;
    })
    .map((opt) => {
      return opt.value;
    });
}

function extractColumn(dataArray, columnName) {
  return dataArray.map((data) => {
    return data[columnName];
  });
}

function arraySum(elements) {
  return elements.reduce((acc, curr) => {
    return acc + parseInt(curr);
  }, 0);
}

function getColumnValuesSum(dataArray, columnNames) {
  return dataArray.map((data) => {
    const columns = columnNames.map((column) => {
      return data[column];
    });
    return arraySum(columns);
  });
}

function getSummaryCount(dataArray, fieldName) {
  const elements = dataArray.map((data) => {
    return data[fieldName];
  });
  return arraySum(elements);
}
//########## end  data utils   #######

//########## begin  D3 charts   #######
function generateD3Counter(id, fieldName) {
  const count = getSummaryCount(russiaEquipmentLosses, fieldName);
  const start = 0;
  d3.select(`#${id}`).html("");
  d3.select(`#${id}`).append("h3").html(fieldName);
  d3.select(`#${id}`)
    .append("text")
    .transition()
    .tween("text", () => {
      const interpolator = d3.interpolateNumber(0, count);
      return function (t) {
        d3.select(this).text(Math.round(interpolator(t)));
      };
    })
    .duration(1500);
}

function addBarChart(id, config) {
  const offset = 20;
  const { data, barColor, xTitle, yTitle, annotations } = config;
  var tip = d3
    .select(id)
    .select("div")
    .attr("class", "tip")
    .style("position", "absolute")
    .style("z-index", "10")
    .style("visibility", "hidden");

  var svg = d3
      .select(id)
      .select("svg")
      .html("")
      .attr("class", "background-style"),
    margin = { top: 20, right: 20, bottom: 42, left: 40 },
    width = +svg.attr("width") - margin.left - margin.right,
    height = +svg.attr("height") - margin.top - margin.bottom;

  // var x = d3.scaleTime().rangeRound([0, width]).padding(0.05);
  var x = d3.scaleTime().range([0, width]);
  var y = d3.scaleLinear().rangeRound([height, 0]);

  var g = svg
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  // x.domain(
  //   data.map(function (d) {
  //     return d.xData;
  //   })
  // );
  x.domain(
    d3.extent(data, function (d) {
      return d.xData;
    })
  );
  y.domain([
    0,
    d3.max(data, function (d) {
      return d.yData;
    })
  ]);

  g.append("g")
    .attr("class", "axis axis--x")
    .attr("transform", `translate(${offset},${height})`)
    .call(d3.axisBottom(x).ticks(d3.utcWeek.every(2)).tickFormat(formatTime))
    .append("text")
    .attr("y", 8)
    .attr("dy", "2.5em")
    .attr("dx", width / 2 - margin.left)
    .attr("text-anchor", "start")
    .text(xTitle);

  g.append("g")
    .attr("class", "axis axis--y")
    .call(d3.axisLeft(y))
    .append("text")
    .attr("transform", "rotate(-90)")
    .attr("y", 6)
    .attr("dy", "0.71em")
    .attr("text-anchor", "end")
    .text(yTitle);

  g.selectAll(".bar")
    .data(data)
    .enter()
    .append("rect")
    .attr("class", "bar")
    .attr("x", function (d) {
      return x(d.xData) + offset;
    })
    .attr("y", function (d) {
      return y(d.yData);
    })
    .attr("width", 5)
    .attr("height", function (d) {
      return height - y(d.yData);
    })
    .on("mouseover", function (e, d) {
      return tip
        .text(`${formatTime(d.xData)}: ${d.yData}`)
        .style("visibility", "visible")
        .style("top", function () {
          return e.layerY + "px";
        })
        .style("left", e.layerX + "px");
    })
    //.on("mousemove", function(){return tooltip.style("top", (d3.event.pageY-10)+"px").style("left",(d3.event.pageX+10)+"px");})
    .on("mouseout", function () {
      return tip.style("visibility", "hidden");
    });
  if (Array.isArray(annotations) && annotations) {
    const annotationsOnChart = annotations.map((annotation, idx) => {
      return {
        note: {
          title: annotation.title
        },
        x: x(parseTime(annotation.date)) + offset + margin.left + 3,
        y: 150,
        dx: 10,
        dy: -50
      };
    });
    const makeAnnotations = d3.annotation().annotations(annotationsOnChart);
    svg.append("g").call(makeAnnotations);
  }
}

//########## end  D3 charts   #######

//########## begin  slide content   #######
function renderSlide2() {
  window.setTimeout(function () {
    csvFields.forEach((fieldName, idx) => {
      generateD3Counter(`counter${idx + 1}`, fieldName);
    });
  }, 1000);
}

function renderSlide3() {
  let annotations = [];
  if (
    equipmentClassification.airforce.length === selectedAirforceOptions.length
  ) {
    annotations = chartAnnotations.airforce;
  }
  const endDate = sliderValues["airforce"];
  renderSlideWithChart(
    "#slide3-chart1",
    selectedAirforceOptions,
    annotations,
    endDate
  );
}

function renderSlide4() {
  const endDate = sliderValues["military"];
  let annotations = [];
  if (
    equipmentClassification.military.length === selectedAirforceOptions.length
  ) {
    annotations = chartAnnotations.military;
  }
  renderSlideWithChart(
    "#slide4-chart1",
    selectedMilitaryOptions,
    annotations,
    endDate
  );
}

function renderSlide5() {
  const endDate = sliderValues["navy"];
  let annotations = [];
  if (selectedNavyOptions[0] === "Naval Ship") {
    annotations = chartAnnotations.navy;
  }
  renderSlideWithChart(
    "#slide5-chart1",
    selectedNavyOptions,
    annotations,
    endDate
  );
}

function renderSlideWithChart(id, selectedOptions, annotations, endDate) {
  const dateColumn = extractColumn(russiaEquipmentLosses, "date");
  const yData = getColumnValuesSum(russiaEquipmentLosses, selectedOptions);
  let data = mapDataToChartData(dateColumn, yData);
  if (endDate) {
    const endDateObj = parseTime(endDate);
    data = data.filter((datum) => {
      return datum.xData < endDateObj;
    });
  }
  const yTitle =
    selectedOptions.length > 3
      ? `${selectedOptions.slice(0, 3).join(", ")} ...`
      : selectedOptions.join(", ");
  addBarChart(id, {
    data,
    annotations,
    xTitle: "Timeline",
    yTitle: `Loss Count for ${yTitle}`
  });
}

function renderSlideCharts() {
  if (currentSlide == 2) {
    renderSlide2();
  }

  if (currentSlide === 3) {
    renderSlide3();
  }

  if (currentSlide === 4) {
    renderSlide4();
  }

  if (currentSlide === 5) {
    renderSlide5();
  }
}