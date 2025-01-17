export function createLineChart(containerId, data) {
    const dailyData = aggregateDailyData(data);
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

    displayDailyLabels(chartGroup, dailyData, xScale, yScale)


    function filter12Hours(data) {
        return data.filter(d => {
            const hour = new Date(d.time).getHours();
            return hour % 12 === 0; // Nur Werte alle 12 Stunden
        });
    }
    
    function filter6Hours(data) {
        return data.filter(d => {
            const hour = new Date(d.time).getHours();
            return hour % 6 === 0; // Nur Werte alle 6 Stunden
        });
    }
    
    function filter3Hours(data) {
        return data.filter(d => {
            const hour = new Date(d.time).getHours();
            return hour % 3 === 0; // Nur Werte alle 3 Stunden
        });
    }
    
    function filterHourly(data) {
        return data; // Alle Werte (stündlich)
    }
    

    function aggregateDailyData(data) {

        const groupedData = d3.groups(data, d => {
            const date = new Date(d.time);
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0'); // Monat mit führender Null
            const day = String(date.getDate()).padStart(2, '0'); // Tag mit führender Null
            return `${year}-${month}-${day}`;
        });

        return groupedData.map(([date, values]) => {
            const parsedDate = new Date(date); // Korrekt formatierter String wird verarbeitet
            if (isNaN(parsedDate.getTime())) {
                console.error("Invalid date during aggregation:", date);
                return null; // Ungültige Gruppen überspringen
            }
            return {
                date: parsedDate,
                tempMax: d3.max(values, d => d.temp),
                tempMin: d3.min(values, d => d.temp)
            };
        }).filter(d => d !== null); // Entferne ungültige Einträge

        
    }
    function displayTemperatureLabels(data, xScale, yScale, intervalType) {
        chartGroup
            .selectAll(".temp-label")
            .data(data)
            .enter()
            .append("text")
            .attr("class", "temp-label")
            .attr("x", d => xScale(new Date(d.time)))
            .attr("y", d => yScale(d.temp) - 50) // Leicht oberhalb der Linie
            .style("text-anchor", "middle")
            .style("font-size", intervalType === "hourly" ? "10px" : "12px")
            .style("fill", "white")
            .text(d => `${Math.round(d.temp)}°C`);
    }
    

    function displayDailyLabels(chartGroup, dailyData, xScale, yScale) {
        chartGroup.selectAll(".daily-label").remove();
    
        chartGroup
            .selectAll(".daily-label-high")
            .data(dailyData)
            .enter()
            .append("text")
            .attr("class", "daily-label-high")
            .attr("x", d => xScale(new Date(d.date)))
            .attr("y", d => yScale(d.tempMax) - 20)
            .style("text-anchor", "middle")
            .style("fill", "red")
            .style("font-size", "12px")
            .text(d => `${Math.round(d.tempMax)}°C`);
    
        chartGroup
            .selectAll(".daily-label-low")
            .data(dailyData)
            .enter()
            .append("text")
            .attr("class", "daily-label-low")
            .attr("x", d => xScale(new Date(d.date)))
            .attr("y", d => yScale(d.tempMin) + 30)
            .style("text-anchor", "middle")
            .style("fill", "lightblue")
            .style("font-size", "12px")
            .text(d => `${Math.round(d.tempMin)}°C`);
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

        chartGroup.selectAll(".temp-label").remove();
        chartGroup.selectAll(".daily-label-high").remove();
        chartGroup.selectAll(".daily-label-low").remove();
        
        if (transform.k > 4) { // Stufe 4: Stündliche Intervalle
            const hourlyData = filterHourly(data);
            displayTemperatureLabels(hourlyData, newXScale, yScale, "hourly");
            xAxis.ticks(d3.timeHour.every(1)).tickFormat(d3.timeFormat("%H:%M"));
        } else if (transform.k > 3) { // Stufe 3: 3-Stunden-Intervalle
            const threeHourData = filter3Hours(data);
            displayTemperatureLabels(threeHourData, newXScale, yScale, "3h");
            xAxis.ticks(d3.timeHour.every(3)).tickFormat(d3.timeFormat("%H:%M"));
        } else if (transform.k > 2) { // Stufe 2: 6-Stunden-Intervalle
            const sixHourData = filter6Hours(data);
            displayTemperatureLabels(sixHourData, newXScale, yScale, "6h");
            xAxis.ticks(d3.timeHour.every(6)).tickFormat(d3.timeFormat("%H:%M"));
        } else if (transform.k > 1) { // Stufe 1: 12-Stunden-Intervalle
            const twelveHourData = filter12Hours(data);
            displayTemperatureLabels(twelveHourData, newXScale, yScale, "12h");
            xAxis.ticks(d3.timeHour.every(12)).tickFormat(d3.timeFormat("%H:%M"));
        } else { // Standardansicht: tägliche Höchst- und Tiefstwerte
            const dailyData = aggregateDailyData(data);
            displayDailyLabels(chartGroup, dailyData, newXScale, yScale);
            xAxis.ticks(d3.timeDay).tickFormat(d3.timeFormat("%A"));
        }
        linePath.attr("d", line.x((d) => newXScale(new Date(d.time))))
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
    console.log("X-Achse Domain:", xScale.domain());
    console.log("Y-Achse Domain:", yScale.domain());

  
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
        console.log("Aktuelle Echtzeitdaten updategraph:", realtimeData);
        const filteredData = realtimeData.map(d => ({
          time: d.time,
          value: d[key] || 0
        }));
        console.log("Gefilterte Daten für die Achsen: updategraph", filteredData); 
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
        console.log("Update-Daten:", realtimeData); // DEBUG
        updateGraph("temp"); // Standard: Temperatur anzeigen
    },
  };
  }
  