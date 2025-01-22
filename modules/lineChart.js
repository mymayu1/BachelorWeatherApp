export function createLineChart(containerId, data) {
    const dailyData = aggregateDailyData(data);
    if (!data || data.length === 0) {
        console.error("Keine gültigen Daten für das Diagramm übergeben.");
        return;
    }
    // Masse und Margins
    const margin = { top: 20, right: 50, bottom: 20, left: 50 };
    const width = 1800 - margin.left - margin.right;
    const height = 700 - margin.top - margin.bottom;

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
export function createRealtimeChart(containerId, initialData) {
    const margin = { top: 20, right: 50, bottom: 30, left: 50 };
    const width = 1800 - margin.left - margin.right;
    const height = 700 - margin.top - margin.bottom;

    // Clear any existing chart
    d3.select(containerId).html('');

    const svg = d3
        .select(containerId)
        .append("svg")
        .attr("viewBox", `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`)
        .attr("preserveAspectRatio", "xMidYMid meet");

    const chartGroup = svg.append("g")
        .attr("transform", `translate(${margin.left}, ${margin.top})`);

    // Initialize scales
    const xScale = d3.scaleTime()
        .range([0, width]);

    const yScale = d3.scaleLinear()
        .range([height, 0]);

    // Add axes groups
    const xAxisGroup = chartGroup.append("g")
        .attr("class", "x-axis")
        .attr("transform", `translate(0, ${height})`);

    const yAxisGroup = chartGroup.append("g")
        .attr("class", "y-axis");

    // Create the line generator
    const line = d3.line()
        .x(d => xScale(new Date(d.time)))
        .y(d => yScale(d.temp))
        .curve(d3.curveMonotoneX); // Smooth curve

    // Add the path element for the line
    const path = chartGroup.append("path")
        .attr("class", "line")
        .attr("fill", "none")
        .attr("stroke", "white")
        .attr("stroke-width", 2);

    // Function to update the chart
    function updateChart(data) {
        if (!Array.isArray(data) || data.length === 0) {
            console.warn("No valid data to display");
            return;
        }

        // Update scales
        const timeExtent = d3.extent(data, d => new Date(d.time));
        xScale.domain(timeExtent);

        const tempExtent = d3.extent(data, d => d.temp);
        const tempPadding = (tempExtent[1] - tempExtent[0]) * 0.1;
        yScale.domain([tempExtent[0] - tempPadding, tempExtent[1] + tempPadding]);

        // Update axes
        const xAxis = d3.axisBottom(xScale)
            .ticks(5)
            .tickFormat(d3.timeFormat("%H:%M"));
        
        const yAxis = d3.axisLeft(yScale)
            .ticks(5)
            .tickFormat(d => `${d}°C`);

        xAxisGroup.call(xAxis);
        yAxisGroup.call(yAxis);

        // Update line
        path.datum(data)
            .attr("d", line);

        // Add points
        const points = chartGroup.selectAll(".point")
            .data(data, d => d.time);

        // Remove old points
        points.exit().remove();

        // Add new points
        points.enter()
            .append("circle")
            .attr("class", "point")
            .merge(points)
            .attr("cx", d => xScale(new Date(d.time)))
            .attr("cy", d => yScale(d.temp))
            .attr("r", 4)
            .attr("fill", "white");

        // Add temperature labels
        const labels = chartGroup.selectAll(".temp-label")
            .data(data, d => d.time);

        // Remove old labels
        labels.exit().remove();

        // Add new labels
        labels.enter()
            .append("text")
            .attr("class", "temp-label")
            .merge(labels)
            .attr("x", d => xScale(new Date(d.time)))
            .attr("y", d => yScale(d.temp) - 50)
            .attr("text-anchor", "middle")
            .attr("fill", "white")
            .text(d => `${d.temp}°C`);
    }

    // Return the update function
    return {
        update: updateChart
    };
}
export function createEnhancedChart(containerId, data, chartType = 'forecast') {
    const margin = { top: 40, right: 80, bottom: 40, left: 60 };
    const width = 1800 - margin.left - margin.right;
    const height = 700 - margin.top - margin.bottom;

    // Clear existing content
    d3.select(containerId).html('');

    const svg = d3
        .select(containerId)
        .append("svg")
        .attr("viewBox", `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`)
        .attr("preserveAspectRatio", "xMidYMid meet");

    const chartGroup = svg.append("g")
        .attr("transform", `translate(${margin.left}, ${margin.top})`);

    // Define data groups
    const dataGroups = {
        temperature: {
            metrics: ['temperature', 'temperatureApparent', 'dewPoint'],
            colors: ['#ff4444', '#ff8c00', '#00bcd4'],
            labels: ['Temperature', 'Feels Like', 'Dew Point'],
            unit: '°C',
            yAxisPosition: 'left'
        },
        atmospheric: {
            metrics: ['pressureSurfaceLevel', 'humidity'],
            colors: ['#9c27b0', '#4caf50'],
            labels: ['Pressure', 'Humidity'],
            unit: ['hPa', '%'],
            yAxisPosition: 'right'
        },
        wind: {
            metrics: ['windSpeed', 'windGust'],
            colors: ['#2196f3', '#3f51b5'],
            labels: ['Wind Speed', 'Wind Gust'],
            unit: 'm/s',
            yAxisPosition: 'right'
        }
    };

    // Create scales
    const xScale = d3.scaleTime()
        .range([0, width]);

    const yScales = {};
    Object.keys(dataGroups).forEach(group => {
        yScales[group] = d3.scaleLinear().range([height, 0]);
    });

    // Set domains
    const timeExtent = d3.extent(data, d => new Date(d.time));
    xScale.domain(timeExtent);

    Object.entries(dataGroups).forEach(([groupName, groupConfig]) => {
        const allValues = data.flatMap(d => 
            groupConfig.metrics.map(metric => d[metric])
        );
        const extent = d3.extent(allValues);
        const padding = (extent[1] - extent[0]) * 0.1;
        yScales[groupName].domain([extent[0] - padding, extent[1] + padding]);
    });

    // Create line generators
    const lineGenerators = {};
    Object.entries(dataGroups).forEach(([groupName, groupConfig]) => {
        groupConfig.metrics.forEach((metric, index) => {
            lineGenerators[metric] = d3.line()
                .x(d => xScale(new Date(d.time)))
                .y(d => yScales[groupName](d[metric]))
                .curve(d3.curveMonotoneX);
        });
    });

    // Add axes
    const xAxis = d3.axisBottom(xScale)
        .ticks(chartType === 'realtime' ? 5 : 10)
        .tickFormat(chartType === 'realtime' ? 
            d3.timeFormat("%H:%M") : 
            d3.timeFormat("%a %H:%M"));

    chartGroup.append("g")
        .attr("class", "x-axis")
        .attr("transform", `translate(0, ${height})`)
        .call(xAxis);

    // Add lines and legends
    Object.entries(dataGroups).forEach(([groupName, groupConfig]) => {
        // Create y-axis
        const yAxis = d3[groupConfig.yAxisPosition === 'left' ? 'axisLeft' : 'axisRight'](yScales[groupName]);
        const yAxisGroup = chartGroup.append("g")
            .attr("class", `y-axis-${groupName}`)
            .attr("transform", groupConfig.yAxisPosition === 'right' ? `translate(${width}, 0)` : '');
        
        yAxisGroup.call(yAxis);

        // Add lines
        groupConfig.metrics.forEach((metric, index) => {
            chartGroup.append("path")
                .datum(data)
                .attr("class", `line-${metric}`)
                .attr("fill", "none")
                .attr("stroke", groupConfig.colors[index])
                .attr("stroke-width", 2)
                .attr("d", lineGenerators[metric]);
        });

        // Add legend
        const legend = svg.append("g")
            .attr("class", "legend")
            .attr("transform", `translate(${margin.left + 10}, ${margin.top + 20})`);

        groupConfig.metrics.forEach((metric, i) => {
            const legendItem = legend.append("g")
                .attr("transform", `translate(0, ${i * 25})`);

            legendItem.append("line")
                .attr("x1", 0)
                .attr("x2", 20)
                .attr("y1", 0)
                .attr("y2", 0)
                .attr("stroke", groupConfig.colors[i])
                .attr("stroke-width", 2);

            legendItem.append("text")
                .attr("x", 30)
                .attr("y", 5)
                .text(`${groupConfig.labels[i]} (${Array.isArray(groupConfig.unit) ? groupConfig.unit[i] : groupConfig.unit})`)
                .attr("fill", "white")
                .style("font-size", "12px");
        });
    });

    // Add interactivity
    const tooltip = d3.select(containerId)
        .append("div")
        .attr("class", "tooltip")
        .style("opacity", 0)
        .style("position", "absolute")
        .style("background-color", "rgba(0, 0, 0, 0.8)")
        .style("padding", "10px")
        .style("border-radius", "5px")
        .style("color", "white");

    const focus = chartGroup.append("g")
        .style("display", "none");

    focus.append("line")
        .attr("class", "focus-line")
        .attr("y1", 0)
        .attr("y2", height)
        .style("stroke", "#fff")
        .style("stroke-width", "1px")
        .style("stroke-dasharray", "3,3");

    chartGroup.append("rect")
        .attr("class", "overlay")
        .attr("width", width)
        .attr("height", height)
        .style("fill", "none")
        .style("pointer-events", "all")
        .on("mouseover", () => focus.style("display", null))
        .on("mouseout", () => {
            focus.style("display", "none");
            tooltip.style("opacity", 0);
        })
        .on("mousemove", mousemove);

    function mousemove(event) {
        const x0 = xScale.invert(d3.pointer(event)[0]);
        const bisectDate = d3.bisector(d => new Date(d.time)).left;
        const i = bisectDate(data, x0, 1);
        const d0 = data[i - 1];
        const d1 = data[i];
        const d = x0 - new Date(d0.time) > new Date(d1.time) - x0 ? d1 : d0;

        focus.attr("transform", `translate(${xScale(new Date(d.time))},0)`);

        let tooltipContent = `<strong>${d3.timeFormat("%Y-%m-%d %H:%M")(new Date(d.time))}</strong><br/>`;
        Object.entries(dataGroups).forEach(([groupName, groupConfig]) => {
            tooltipContent += `<br/><strong>${groupName}:</strong><br/>`;
            groupConfig.metrics.forEach((metric, i) => {
                tooltipContent += `${groupConfig.labels[i]}: ${d[metric]}${Array.isArray(groupConfig.unit) ? groupConfig.unit[i] : groupConfig.unit}<br/>`;
            });
        });

        tooltip.html(tooltipContent)
            .style("left", `${event.pageX + 15}px`)
            .style("top", `${event.pageY - 15}px`)
            .style("opacity", 1);
    }

    return {
        update: function(newData) {
            // Update logic for realtime data
            if (chartType === 'realtime') {
                data = newData;
                // Update scales and lines
                xScale.domain(d3.extent(data, d => new Date(d.time)));
                Object.entries(dataGroups).forEach(([groupName, groupConfig]) => {
                    const allValues = data.flatMap(d => 
                        groupConfig.metrics.map(metric => d[metric])
                    );
                    const extent = d3.extent(allValues);
                    const padding = (extent[1] - extent[0]) * 0.1;
                    yScales[groupName].domain([extent[0] - padding, extent[1] + padding]);

                    groupConfig.metrics.forEach((metric, index) => {
                        chartGroup.select(`.line-${metric}`)
                            .datum(data)
                            .attr("d", lineGenerators[metric]);
                    });
                });

                // Update axes
                chartGroup.select(".x-axis").call(xAxis);
                Object.entries(dataGroups).forEach(([groupName, groupConfig]) => {
                    const yAxis = d3[groupConfig.yAxisPosition === 'left' ? 'axisLeft' : 'axisRight'](yScales[groupName]);
                    chartGroup.select(`.y-axis-${groupName}`).call(yAxis);
                });
            }
        }
    };
}