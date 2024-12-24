// export function createLineChart(lineChart, data) {

//     const margin = { top: 20, right: 30, bottom: 30, left: 50 };
//     const width = 800 - margin.left - margin.right;
//     const height = 400 - margin.top - margin.bottom;

//     const svg = d3.select(lineChart)
//     .append("svg")
//     .attr("width", width + margin.left + margin.right)
//     .attr("height", height + margin.top + margin.bottom)
//     .style("border", "1px solid black")
//     .append("g")
//     .attr("transform", `translate(${margin.left}, ${margin.top})`);


//     //Zeitskala mit spezifiziertem domain und range
//     const xScale = d3.scaleTime()
//     .domain(d3.extent(data, d => new Date(d.time)))
//     .range([0, width]);

//     const yScale = d3.scaleLinear()
//     .domain([d3.min(data, d => d.temp) - 5, d3.max(data, d => d.temp) + 5])
//     .range([height, 0]);

//     //X & Y-Achsen 
//     const xAxis = d3.axisBottom(xScale)
//     .ticks(6)   //es sollen nur 6h im browser angezeigt werden
//     .tickFormat(d3.timeFormat("%H:%M"));

//     const yAxis = d3.axisLeft(yScale);

//     svg.append("g") //Gruppierungelement
//     .attr("transform", `translate(0, ${height})`)
//     .call(xAxis);

//     svg.append("g")
//     .call(yAxis);

//     //Temperaturlinie
//     const line = d3.line()
//     .x(d => xScale(new Date(d.time)))
//     .y(d => yScale(d.temp));

//     svg.append("path")
//     .datum(threeHourData)
//     .attr("fill", "none")
//     .attr("stroke", "steelblue")
//     .attr("stroke-width", 2)
//     .attr("d", line);

//     //ZoomEffekt
//     // const zoom = d3.zoom()
//     // .scaleExtent([1, 7]) // Zoomstufen: 1 (3h-Takt), bis 7 (7-Tagesansicht)
//     // .translateExtent([[0, 0], [width, height]]) // Begrenzung der Verschiebung
//     // .on("zoom", (event) => {
//     //     const newXScale = event.transform.rescaleX(xScale);
//     //     svg.select(".x-axis").call(d3.axisBottom(newXScale).ticks(6));
//     //     svg.select("path").attr("d", line.x(d => newXScale(new Date(d.time))));
//     // });

//     // svg.call(zoom);
//     console.log("Übergebene Daten:", data);

// }
//import * as d3 from "d3";

export function createLineChart(containerId) {
  // Maße und Margins
  const margin = { top: 20, right: 30, bottom: 50, left: 50 };
  const width = Math.max(800, window.innerWidth) - margin.left - margin.right; // Responsive Breite
  const height = 400 - margin.top - margin.bottom;

  // SVG-Container erstellen
  const svg = d3
    .select(containerId)
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left}, ${margin.top})`);

  // X- und Y-Skalen erstellen
  const xScale = d3
    .scaleLinear()
    .domain([0, 24]) // 24 Stunden des Tages
    .range([0, width]);

  const yScale = d3
    .scaleLinear()
    .domain([-10, 40]) // Beispiel: Temperatur von -10 bis 40 Grad
    .range([height, 0]);

  // X- und Y-Achsen erstellen
  const xAxis = d3.axisBottom(xScale).ticks(8).tickFormat((d) => `${d}h`);
  const yAxis = d3.axisLeft(yScale);

  // X-Achse hinzufügen
  svg
    .append("g")
    .attr("transform", `translate(0, ${height})`)
    .call(xAxis)
    .selectAll("text")
    .style("font-size", "12px");

  // Y-Achse hinzufügen
  svg
    .append("g")
    .call(yAxis)
    .selectAll("text")
    .style("font-size", "12px");

  // Platzhalter für Linien hinzufügen
  svg
    .append("path")
    .datum([]) // Leere Daten
    .attr("fill", "none")
    .attr("stroke", "steelblue")
    .attr("stroke-width", 1.5)
    .attr("d", d3.line());

  // Responsive Skalierung
  window.addEventListener("resize", () => {
    const newWidth = Math.max(800, window.innerWidth) - margin.left - margin.right;
    xScale.range([0, newWidth]);
    svg.select(".x-axis").call(xAxis);
    d3.select(containerId)
      .select("svg")
      .attr("width", newWidth + margin.left + margin.right);
  });
}
