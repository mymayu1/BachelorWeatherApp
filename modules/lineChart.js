export function createLineChart(lineChart, data) {

    const margin = { top: 20, right: 30, bottom: 30, left: 50 };
    const width = 800 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    const svg = d3.select(lineChart)
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .style("border", "1px solid black")
    .append("g")
    .attr("transform", `translate(${margin.left}, ${margin.top})`);


    //Zeitskala mit spezifiziertem domain und range
    const xScale = d3.scaleTime()
    .domain(d3.extent(data, d => new Date(d.time)))
    .range([0, width]);

    const yScale = d3.scaleLinear()
    .domain([d3.min(data, d => d.temp) - 5, d3.max(data, d => d.temp) + 5])
    .range([height, 0]);

    //X & Y-Achsen 
    const xAxis = d3.axisBottom(xScale)
    .ticks(6)   //es sollen nur 6h im browser angezeigt werden
    .tickFormat(d3.timeFormat("%H:%M"));

    const yAxis = d3.axisLeft(yScale);

    svg.append("g") //Gruppierungelement
    .attr("transform", `translate(0, ${height})`)
    .call(xAxis);

    svg.append("g")
    .call(yAxis);

    //Temperaturlinie
    const line = d3.line()
    .x(d => xScale(new Date(d.time)))
    .y(d => yScale(d.temp));

    svg.append("path")
    .datum(threeHourData)
    .attr("fill", "none")
    .attr("stroke", "steelblue")
    .attr("stroke-width", 2)
    .attr("d", line);

    //ZoomEffekt
    // const zoom = d3.zoom()
    // .scaleExtent([1, 7]) // Zoomstufen: 1 (3h-Takt), bis 7 (7-Tagesansicht)
    // .translateExtent([[0, 0], [width, height]]) // Begrenzung der Verschiebung
    // .on("zoom", (event) => {
    //     const newXScale = event.transform.rescaleX(xScale);
    //     svg.select(".x-axis").call(d3.axisBottom(newXScale).ticks(6));
    //     svg.select("path").attr("d", line.x(d => newXScale(new Date(d.time))));
    // });

    // svg.call(zoom);
    console.log("Übergebene Daten:", data);

}
