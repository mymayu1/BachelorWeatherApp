export function createLineChart(containerId, data) {
    if (!data || data.length === 0) {
        console.error("Keine gültigen Daten für das Diagramm übergeben.");
        return;
    }
    // Masse und Margins
    const margin = { top: 20, right: 30, bottom: 50, left: 50 };
    const width = 800 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    // SVG-Container erstellen
    const svg = d3
    .select(containerId)
    .append("svg")
    .attr("viewBox", `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`)
    .attr("preserveAspectRatio", "xMidYMid meet")

    const chartGroup = svg.append("g").attr("transform", `translate(${margin.left}, ${margin.top})`);

    // Skalen erstellen
    const xScale = d3.scaleTime()
    .domain(d3.extent(data, d => new Date(d.time))) // Zeitbereich (Datenbereich)
    .range([0, width]); // Pixelbereich

    const yScale = d3.scaleLinear()
    .domain([d3.min(data, d => d.temp) - 5, d3.max(data, d => d.temp) + 5]) // Temperaturbereich
    .range([height, 0]); // Pixelbereich (invertiert)


    // X- und Y-Achsen erstellen
    const xAxis = d3.axisBottom(xScale).ticks(8).tickFormat(d3.timeFormat("%H:%M"));
    const yAxis = d3.axisLeft(yScale);

    // X-Achse hinzufügen
    const xAxisGroup = chartGroup
    .append("g")
    .attr("class", "x-axis")
    .attr("transform", `translate(0, ${height})`)
    .call(xAxis);

    // Y-Achse hinzufügen
    const yAxisGroup = chartGroup
    .append("g")
    .attr("class", "y-axis")
    .call(yAxis);


    // Linie erstellen
    const line = d3.line()
    .x(d => xScale(new Date(d.time))) // X-Wert berechnen
    .y(d => yScale(d.temp)); // Y-Wert berechnen

    const linePath = chartGroup
    .append("path")
    .datum(data)
    .attr("fill", "none")
    .attr("stroke", "steelblue")
    .attr("stroke-width", 2)
    .attr("d", line);

    // Zoomfunktion hinzufügen
    const zoom = d3
    .zoom()
    .scaleExtent([1, 8]) // Zoomfaktor (1 bis 8)
    .translateExtent([[0, 0], [width, height]]) // Begrenzung des Bereichs
    .extent([[0, 0], [width, height]]) // Zoombereich
    .on("zoom", zoomed);

    svg.call(zoom);

    function zoomed(event) {
        const transform = event.transform;
        const newXScale = transform.rescaleX(xScale);

        xAxisGroup.call(xAxis.scale(newXScale));

        linePath.attr("d", line.x((d) => newXScale(new Date(d.time))))
    }



}
