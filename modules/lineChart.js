export function createLineChart(containerId, data, temperatureHiLo) {
    if (!data || data.length === 0) {
        console.error("Keine gültigen Daten für das Diagramm übergeben.");
        return;
    }
    // Masse und Margins
    const margin = { top: 20, right: 50, bottom: 20, left: 50 };
    const width = 1800 - margin.left - margin.right;
    const height = 500 - margin.top - margin.bottom;

    // SVG-Container erstellen
    const svg = d3
    .select(containerId)
    .append("svg")
    .attr("viewBox", `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`)
    .attr("preserveAspectRatio", "xMidYMid meet");

    const chartGroup = svg.append("g").attr("transform", `translate(${margin.left}, ${margin.top})`);

    // Skalen erstellen
    const xScale = d3.scaleTime()
    .domain(d3.extent(data, d => new Date(d.time))) // Zeitbereich (Datenbereich)
    .range([0, width]); // Pixelbereich

    const yScale = d3.scaleLinear()
    .domain([d3.min(data, d => d.temp) - 5, d3.max(data, d => d.temp) + 5]) // Temperaturbereich
    .range([height, 0]); // Pixelbereich (invertiert)

    console.log("xScale Domain:", xScale.domain());
    console.log("yScale Domain:", yScale.domain()); 
  

    //Clippath
    chartGroup
    .append("defs")
    .append("clipPath")
    .attr("id", "clip")
    .append("rect")
    .attr("x", 0)
    .attr("y", 0)
    .attr("width", width)
    .attr("height", height)
    .attr("clip-path", "url(#clip)");


    // X- und Y-Achsen erstellen
    const xAxis = d3.axisBottom(xScale).ticks(5).tickFormat(d3.timeFormat("%A"));
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
    .attr("stroke", "white")
    .attr("stroke-width", 3)
    .attr("d", line)
    .attr("clip-path", "url(#clip)");

    function filterEveryThreeHours(data) {
        return data.filter(d => {
            const hour = new Date(d.time).getHours();
            return hour % 3 === 0; // Nur Daten, bei denen die Stunde ein Vielfaches von 3 ist
        });
    }

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

       // xAxis.ticks(d3.timeHour.every(3)).tickFormat(d3.timeFormat("%H:%M"));
        xAxisGroup.call(xAxis.scale(newXScale));
        
        const filteredData = filterEveryThreeHours(data);  

        
        // Ändere die Ticks je nach Zoom-Level
        if (transform.k > 3) { // Wenn gezoomt wird (k > 3), zeige Uhrzeiten
            xAxis.ticks(d3.timeHour).ticks(12).tickFormat(d3.timeFormat("%H:%M"));
            filteredData;
           
        } else { // Wenn weit herausgezoomt wird, zeige Wochentage
            xAxis.ticks(d3.timeDay).tickFormat(d3.timeFormat("%A"));

        }
        chartGroup.selectAll(".temp-label").remove();   

        // Füge neue Temperaturtexte hinzu
        chartGroup
        .selectAll(".temp-label")
        .data(filteredData)
        .enter()
        .append("text")
        .attr("class", "temp-label")
        .attr("x", d => newXScale(new Date(d.time)))
        .attr("y", d => yScale(d.temp) - 50)
        .attr("text-anchor", "middle")
        .style("font-size", "12px")
        .style("fill", "white")
        .text(d => `${d.temp}°C`)
        .attr("clip-path", "url(#clip)");

    
        linePath.attr("d", line.x((d) => newXScale(new Date(d.time))))
        // Textposition aktualisieren
        //  chartGroup.selectAll(".temp-label")
        //     .attr("x", d => newXScale(new Date(d.time)));
    }
}
export function createRealtimeChart(containerId, realtimeData) {
    const margin = { top: 20, right: 50, bottom: 20, left: 50 };
    const width = 1800 - margin.left - margin.right;
    const height = 500 - margin.top - margin.bottom;
  
    const svg = d3
      .select(containerId)
      .append("svg")
      .attr("viewBox", `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`)
      .attr("preserveAspectRatio", "xMidYMid meet");
  
    const chartGroup = svg.append("g").attr("transform", `translate(${margin.left}, ${margin.top})`);
  
    const xScale = d3.scaleTime().range([0, width]);
    const yScale = d3.scaleLinear().range([height, 0]);
  
    const xAxisGroup = chartGroup
      .append("g")
      .attr("class", "x-axis")
      .attr("transform", `translate(0, ${height})`);
  
    const yAxisGroup = chartGroup.append("g").attr("class", "y-axis");
  
    const line = d3
      .line()
      .x(d => xScale(new Date(d.time)))
      .y(d => yScale(d.temp));
  
    const linePath = chartGroup.append("path")
    .attr("fill", "none")
    .attr("stroke", "white")
    .attr("stroke-width", 3);

    // Buttons hinzufügen
    const buttonGroup = svg.append("g").attr("class", "button-group");

    const buttons = [
        { label: "Temperatur", key: "temp" },
        { label: "Niederschlag", key: "precipitation" },
        { label: "UV-Index", key: "uvIndex" }
    ];
    buttonGroup.selectAll("g.button")
    .data(buttons)
    .enter()
    .append("g")
    .attr("class", "button")
    .attr("transform", (_, i) => `translate(${margin.left + i * 100}, ${margin.top - 30})`)
    .on("click", (_, d) => updateGraph(d.key))
    .each(function(d) {
      const button = d3.select(this);
      button.append("rect")
        .attr("width", 90)
        .attr("height", 30)
        .attr("fill", "lightgray")
        .attr("rx", 5)
        .attr("ry", 5);

      button.append("text")
        .attr("x", 45)
        .attr("y", 20)
        .attr("text-anchor", "middle")
        .style("font-size", "14px")
        .text(d.label);
    });
    
    function updateGraph(key) {
        const filteredData = realtimeData.map(d => ({
          time: d.time,
          value: d[key] || 0
        }));
    
        // Skalen aktualisieren
        xScale.domain(d3.extent(filteredData, d => new Date(d.time)));
        yScale.domain([d3.min(filteredData, d => d.value) - 5, d3.max(filteredData, d => d.value) + 5]);
    
        // Achsen aktualisieren
        xAxisGroup.call(d3.axisBottom(xScale).ticks(5).tickFormat(d3.timeFormat("%H:%M")));
        yAxisGroup.call(d3.axisLeft(yScale));
    
        // Linie aktualisieren
        linePath.datum(filteredData).attr("d", line);
    }

    return {
      update: function (realtimeData) {
      updateGraph("temp"); // Standard: Temperatur anzeigen
    },
  };
  }
  