// export function createLineChart(containerId, data) {
//     const dailyData = aggregateDailyData(data);
//     if (!data || data.length === 0) {
//         console.error("Keine gültigen Daten für das Diagramm übergeben.");
//         return;
//     }
//     // Masse und Margins
//     const margin = { top: 20, right: 50, bottom: 20, left: 50 };
//     const width = 1800 - margin.left - margin.right;
//     const height = 700 - margin.top - margin.bottom;

//     // SVG-Container erstellen
//     const svg = d3
//         .select(containerId)
//         .append("svg")
//         .attr("viewBox", `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`)
//         .attr("preserveAspectRatio", "xMidYMid meet");

//     const chartGroup = svg.append("g").attr("transform", `translate(${margin.left}, ${margin.top})`);

//     // Skalen erstellen
//     const xScale = d3.scaleTime()
//         .domain(d3.extent(data, d => new Date(d.time))) // Zeitbereich (Datenbereich)
//         .range([0, width]); // Pixelbereich

//     const yScale = d3.scaleLinear()
//         .domain([d3.min(data, d => d.temp) - 5, d3.max(data, d => d.temp) + 5]) // Temperaturbereich
//         .range([height, 0]); // Pixelbereich (invertiert)

//     console.log("xScale Domain:", xScale.domain());
//     console.log("yScale Domain:", yScale.domain());


//     //Clippath
//     chartGroup
//         .append("defs")
//         .append("clipPath")
//         .attr("id", "clip")
//         .append("rect")
//         .attr("x", 0)
//         .attr("y", 0)
//         .attr("width", width)
//         .attr("height", height)
//         .attr("clip-path", "url(#clip)");


//     // X- und Y-Achsen erstellen
//     const xAxis = d3.axisBottom(xScale).ticks(5).tickFormat(d3.timeFormat("%A"));
//     const yAxis = d3.axisLeft(yScale);

//     // X-Achse hinzufügen
//     const xAxisGroup = chartGroup
//         .append("g")
//         .attr("class", "x-axis")
//         .attr("transform", `translate(0, ${height})`)
//         .call(xAxis);

//     // Y-Achse hinzufügen
//     const yAxisGroup = chartGroup
//         .append("g")
//         .attr("class", "y-axis")
//         .call(yAxis);


//     // Linie erstellen
//     const line = d3.line()
//         .x(d => xScale(new Date(d.time))) // X-Wert berechnen
//         .y(d => yScale(d.temp)); // Y-Wert berechnen

//     const linePath = chartGroup
//         .append("path")
//         .datum(data)
//         .attr("fill", "none")
//         .attr("stroke", "white")
//         .attr("stroke-width", 3)
//         .attr("d", line)
//         .attr("clip-path", "url(#clip)");

//     displayDailyLabels(chartGroup, dailyData, xScale, yScale)


//     function filter12Hours(data) {
//         return data.filter(d => {
//             const hour = new Date(d.time).getHours();
//             return hour % 12 === 0; // Nur Werte alle 12 Stunden
//         });
//     }

//     function filter6Hours(data) {
//         return data.filter(d => {
//             const hour = new Date(d.time).getHours();
//             return hour % 6 === 0; // Nur Werte alle 6 Stunden
//         });
//     }

//     function filter3Hours(data) {
//         return data.filter(d => {
//             const hour = new Date(d.time).getHours();
//             return hour % 3 === 0; // Nur Werte alle 3 Stunden
//         });
//     }

//     function filterHourly(data) {
//         return data; // Alle Werte (stündlich)
//     }


//     function aggregateDailyData(data) {

//         const groupedData = d3.groups(data, d => {
//             const date = new Date(d.time);
//             const year = date.getFullYear();
//             const month = String(date.getMonth() + 1).padStart(2, '0'); // Monat mit führender Null
//             const day = String(date.getDate()).padStart(2, '0'); // Tag mit führender Null
//             return `${year}-${month}-${day}`;
//         });

//         return groupedData.map(([date, values]) => {
//             const parsedDate = new Date(date); // Korrekt formatierter String wird verarbeitet
//             if (isNaN(parsedDate.getTime())) {
//                 console.error("Invalid date during aggregation:", date);
//                 return null; // Ungültige Gruppen überspringen
//             }
//             return {
//                 date: parsedDate,
//                 tempMax: d3.max(values, d => d.temp),
//                 tempMin: d3.min(values, d => d.temp)
//             };
//         }).filter(d => d !== null); // Entferne ungültige Einträge


//     }
//     function displayTemperatureLabels(data, xScale, yScale, intervalType) {
//         chartGroup
//             .selectAll(".temp-label")
//             .data(data)
//             .enter()
//             .append("text")
//             .attr("class", "temp-label")
//             .attr("x", d => xScale(new Date(d.time)))
//             .attr("y", d => yScale(d.temp) - 50) // Leicht oberhalb der Linie
//             .style("text-anchor", "middle")
//             .style("font-size", intervalType === "hourly" ? "10px" : "12px")
//             .style("fill", "white")
//             .text(d => `${Math.round(d.temp)}°C`);
//     }


//     function displayDailyLabels(chartGroup, dailyData, xScale, yScale) {
//         chartGroup.selectAll(".daily-label").remove();

//         chartGroup
//             .selectAll(".daily-label-high")
//             .data(dailyData)
//             .enter()
//             .append("text")
//             .attr("class", "daily-label-high")
//             .attr("x", d => xScale(new Date(d.date)))
//             .attr("y", d => yScale(d.tempMax) - 20)
//             .style("text-anchor", "middle")
//             .style("fill", "red")
//             .style("font-size", "12px")
//             .text(d => `${Math.round(d.tempMax)}°C`);

//         chartGroup
//             .selectAll(".daily-label-low")
//             .data(dailyData)
//             .enter()
//             .append("text")
//             .attr("class", "daily-label-low")
//             .attr("x", d => xScale(new Date(d.date)))
//             .attr("y", d => yScale(d.tempMin) + 30)
//             .style("text-anchor", "middle")
//             .style("fill", "lightblue")
//             .style("font-size", "12px")
//             .text(d => `${Math.round(d.tempMin)}°C`);
//     }

//     // Zoomfunktion hinzufügen
//     const zoom = d3
//         .zoom()
//         .scaleExtent([1, 8]) // Zoomfaktor (1 bis 8)
//         .translateExtent([[0, 0], [width, height]]) // Begrenzung des Bereichs
//         .extent([[0, 0], [width, height]]) // Zoombereich
//         .on("zoom", zoomed);

//     svg.call(zoom);

//     function zoomed(event) {
//         const transform = event.transform;
//         const newXScale = transform.rescaleX(xScale);

//         // xAxis.ticks(d3.timeHour.every(3)).tickFormat(d3.timeFormat("%H:%M"));
//         xAxisGroup.call(xAxis.scale(newXScale));

//         chartGroup.selectAll(".temp-label").remove();
//         chartGroup.selectAll(".daily-label-high").remove();
//         chartGroup.selectAll(".daily-label-low").remove();

//         if (transform.k > 4) { // Stufe 4: Stündliche Intervalle
//             const hourlyData = filterHourly(data);
//             displayTemperatureLabels(hourlyData, newXScale, yScale, "hourly");
//             xAxis.ticks(d3.timeHour.every(1)).tickFormat(d3.timeFormat("%H:%M"));
//         } else if (transform.k > 3) { // Stufe 3: 3-Stunden-Intervalle
//             const threeHourData = filter3Hours(data);
//             displayTemperatureLabels(threeHourData, newXScale, yScale, "3h");
//             xAxis.ticks(d3.timeHour.every(3)).tickFormat(d3.timeFormat("%H:%M"));
//         } else if (transform.k > 2) { // Stufe 2: 6-Stunden-Intervalle
//             const sixHourData = filter6Hours(data);
//             displayTemperatureLabels(sixHourData, newXScale, yScale, "6h");
//             xAxis.ticks(d3.timeHour.every(6)).tickFormat(d3.timeFormat("%H:%M"));
//         } else if (transform.k > 1) { // Stufe 1: 12-Stunden-Intervalle
//             const twelveHourData = filter12Hours(data);
//             displayTemperatureLabels(twelveHourData, newXScale, yScale, "12h");
//             xAxis.ticks(d3.timeHour.every(12)).tickFormat(d3.timeFormat("%H:%M"));
//         } else { // Standardansicht: tägliche Höchst- und Tiefstwerte
//             const dailyData = aggregateDailyData(data);
//             displayDailyLabels(chartGroup, dailyData, newXScale, yScale);
//             xAxis.ticks(d3.timeDay).tickFormat(d3.timeFormat("%A"));
//         }
//         linePath.attr("d", line.x((d) => newXScale(new Date(d.time))))
//     }
// }
//Functioning Code that shows more weather Data
// export function createRealtimeChart(containerId, initialData) {
//     const margin = { top: 20, right: 80, bottom: 30, left: 60 };
//     const width = 1800 - margin.left - margin.right;
//     const height = 700 - margin.top - margin.bottom;

//     const dataSeries = {
//         temperature: { color: 'white', label: 'Temperature (°C)', active: true },
//         humidity: { color: '#4CAF50', label: 'Humidity (%)', active: false },
//         windSpeed: { color: '#2196F3', label: 'Wind Speed (m/s)', active: false },
//         visibility: { color: '#FFC107', label: 'Visibility (km)', active: false },
//         pressureSurfaceLevel: { color: '#9C27B0', label: 'Pressure (hPa)', active: false },
//         cloudCover: { color: '#607D8B', label: 'Cloud Cover (%)', active: false }
//     };

//     let selectedExtraMetric = null;

//     d3.select(containerId).html('');

//     const filterContainer = d3.select(containerId)
//         .append('div')
//         .attr('class', 'filter-container')
//         .style('margin-bottom', '10px');

//     Object.entries(dataSeries).forEach(([key, config]) => {
//         if (key === 'temperature') return;

//         const label = filterContainer
//             .append('label')
//             .style('margin-right', '15px')
//             .style('color', config.color);

//         label.append('input')
//             .attr('type', 'radio')
//             .attr('name', 'metric')
//             .attr('value', key)
//             .style('margin-right', '5px')
//             .on('change', function() {
//                 if (this.checked) {
//                     // Hide previous metric if exists
//                     if (selectedExtraMetric) {
//                         yAxisGroups[selectedExtraMetric].style("display", "none");
//                         paths[selectedExtraMetric].style("display", "none");
//                     }
//                     selectedExtraMetric = key;
//                     dataSeries[key].active = true;
//                 }
//                 if (currentData.length > 0) {
//                     updateChart(currentData);
//                 }
//             });

//         label.append('span')
//             .text(config.label);
//     });

//     const svg = d3.select(containerId)
//         .append("svg")
//         .attr("viewBox", `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`)
//         .attr("preserveAspectRatio", "xMidYMid meet");

//     const chartGroup = svg.append("g")
//         .attr("transform", `translate(${margin.left}, ${margin.top})`);

//     const xScale = d3.scaleTime().range([0, width]);
//     const yScales = {};

//     Object.keys(dataSeries).forEach(key => {
//         yScales[key] = d3.scaleLinear().range([height, 0]);
//     });

//     const xAxisGroup = chartGroup.append("g")
//         .attr("class", "x-axis")
//         .attr("transform", `translate(0, ${height})`);

//     const yAxisGroups = {};
//     Object.entries(dataSeries).forEach(([key, config]) => {
//         const group = chartGroup.append("g")
//             .attr("class", `y-axis-${key}`)
//             .style("display", config.active ? "block" : "none");
        
//         if (key !== 'temperature') {
//             group.attr("transform", `translate(${width}, 0)`);
//         }
//         yAxisGroups[key] = group;
//     });

//     const lines = {};
//     Object.keys(dataSeries).forEach(key => {
//         lines[key] = d3.line()
//             .x(d => xScale(new Date(d.time)))
//             .y(d => {
//                 const value = key === 'temperature' ? d.temp : d[key];
//                 return yScales[key](value);
//             })
//             .defined(d => {
//                 const value = key === 'temperature' ? d.temp : d[key];
//                 return value !== null && !isNaN(value);
//             });
//     });

//     const paths = {};
//     Object.entries(dataSeries).forEach(([key, config]) => {
//         paths[key] = chartGroup.append("path")
//             .attr("class", `line-${key}`)
//             .attr("fill", "none")
//             .attr("stroke", config.color)
//             .attr("stroke-width", 2)
//             .style("display", config.active ? "block" : "none");
//     });

//     let currentData = [];

//     function updateChart(data) {
//         if (!data || data.length === 0) return;
        
//         currentData = data;
//         xScale.domain(d3.extent(data, d => new Date(d.time)));

//         // Always update temperature
//         updateMetric('temperature', data);

//         // Update selected extra metric if any
//         if (selectedExtraMetric) {
//             updateMetric(selectedExtraMetric, data);
//         }

//         // Update data points for temperature
//         const points = chartGroup.selectAll(".point")
//             .data(data);

//         points.exit().remove();

//         points.enter()
//             .append("circle")
//             .attr("class", "point")
//             .merge(points)
//             .attr("cx", d => xScale(new Date(d.time)))
//             .attr("cy", d => yScales.temperature(d.temp))
//             .attr("r", 4)
//             .attr("fill", "white");

//         // Update temperature labels
//         const labels = chartGroup.selectAll(".temp-label")
//             .data(data);

//         labels.exit().remove();

//         labels.enter()
//             .append("text")
//             .attr("class", "temp-label")
//             .merge(labels)
//             .attr("x", d => xScale(new Date(d.time)))
//             .attr("y", d => yScales.temperature(d.temp) - 10)
//             .attr("text-anchor", "middle")
//             .attr("fill", "white")
//             .text(d => `${Math.round(d.temp)}°C`);

//         const xAxis = d3.axisBottom(xScale)
//             .ticks(5)
//             .tickFormat(d3.timeFormat("%H:%M"));
//         xAxisGroup.call(xAxis);
//     }

//     function updateMetric(key, data) {
//         const values = key === 'temperature' 
//             ? data.map(d => d.temp) 
//             : data.map(d => d[key]);
        
//         const filteredValues = values.filter(v => v !== null && !isNaN(v));
        
//         if (filteredValues.length > 0) {
//             const extent = d3.extent(filteredValues);
//             const padding = (extent[1] - extent[0]) * 0.1;
//             yScales[key].domain([extent[0] - padding, extent[1] + padding]);

//             const yAxis = d3.axisLeft(yScales[key])
//                 .ticks(5)
//                 .tickFormat(d => `${d}${getUnit(key)}`);

//             yAxisGroups[key]
//                 .style("display", "block")
//                 .call(yAxis);

//             paths[key]
//                 .style("display", "block")
//                 .datum(data)
//                 .attr("d", lines[key]);
//         }
//     }

//     function getUnit(key) {
//         const units = {
//             temperature: '°C',
//             humidity: '%',
//             windSpeed: 'm/s',
//             visibility: 'km',
//             pressureSurfaceLevel: 'hPa',
//             cloudCover: '%'
//         };
//         return units[key] || '';
//     }

//     return { update: updateChart };
// }
//version1 of tooltip
// export function createRealtimeChart(containerId, initialData) {
//     const margin = { top: 20, right: 80, bottom: 30, left: 60 };
//     const width = 1800 - margin.left - margin.right;
//     const height = 700 - margin.top - margin.bottom;

//     const dataSeries = {
//         temperature: { color: 'white', label: 'Temperature (°C)', active: true },
//         humidity: { color: '#4CAF50', label: 'Humidity (%)', active: false },
//         windSpeed: { color: '#2196F3', label: 'Wind Speed (m/s)', active: false },
//         visibility: { color: '#FFC107', label: 'Visibility (km)', active: false },
//         pressureSurfaceLevel: { color: '#9C27B0', label: 'Pressure (hPa)', active: false },
//         cloudCover: { color: '#607D8B', label: 'Cloud Cover (%)', active: false }
//     };

//     let selectedExtraMetric = null;

//     d3.select(containerId).html('');

//     const filterContainer = d3.select(containerId)
//         .append('div')
//         .attr('class', 'filter-container')
//         .style('margin-bottom', '10px');

//     Object.entries(dataSeries).forEach(([key, config]) => {
//         if (key === 'temperature') return;

//         const label = filterContainer
//             .append('label')
//             .style('margin-right', '15px')
//             .style('color', config.color);

//         label.append('input')
//             .attr('type', 'radio')
//             .attr('name', 'metric')
//             .attr('value', key)
//             .style('margin-right', '5px')
//             .on('change', function() {
//                 if (this.checked) {
//                     if (selectedExtraMetric) {
//                         yAxisGroups[selectedExtraMetric].style("display", "none");
//                         paths[selectedExtraMetric].style("display", "none");
//                     }
//                     selectedExtraMetric = key;
//                     dataSeries[key].active = true;
//                 }
//                 if (currentData.length > 0) {
//                     updateChart(currentData);
//                 }
//             });

//         label.append('span')
//             .text(config.label);
//     });

//     const svg = d3.select(containerId)
//         .append("svg")
//         .attr("viewBox", `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`)
//         .attr("preserveAspectRatio", "xMidYMid meet");

//     const chartGroup = svg.append("g")
//         .attr("transform", `translate(${margin.left}, ${margin.top})`);

//     const xScale = d3.scaleTime().range([0, width]);
//     const yScales = {};

//     Object.keys(dataSeries).forEach(key => {
//         yScales[key] = d3.scaleLinear().range([height, 0]);
//     });

//     const xAxisGroup = chartGroup.append("g")
//         .attr("class", "x-axis")
//         .attr("transform", `translate(0, ${height})`);

//     const yAxisGroups = {};
//     Object.entries(dataSeries).forEach(([key, config]) => {
//         const group = chartGroup.append("g")
//             .attr("class", `y-axis-${key}`)
//             .style("display", config.active ? "block" : "none");
        
//         if (key !== 'temperature') {
//             group.attr("transform", `translate(${width}, 0)`);
//         }
//         yAxisGroups[key] = group;
//     });

//     const lines = {};
//     Object.keys(dataSeries).forEach(key => {
//         lines[key] = d3.line()
//             .x(d => xScale(new Date(d.time)))
//             .y(d => {
//                 const value = key === 'temperature' ? d.temp : d[key];
//                 return yScales[key](value);
//             })
//             .defined(d => {
//                 const value = key === 'temperature' ? d.temp : d[key];
//                 return value !== null && !isNaN(value);
//             });
//     });

//     const paths = {};
//     Object.entries(dataSeries).forEach(([key, config]) => {
//         paths[key] = chartGroup.append("path")
//             .attr("class", `line-${key}`)
//             .attr("fill", "none")
//             .attr("stroke", config.color)
//             .attr("stroke-width", 2)
//             .style("display", config.active ? "block" : "none");
//     });

//     let currentData = [];

//     function getTemperatureDescription(temp) {
//         if (temp <= 0) return "Freezing";
//         if (temp <= 10) return "Very Cold";
//         if (temp <= 15) return "Cool";
//         if (temp <= 22) return "Comfortable";
//         if (temp <= 27) return "Warm";
//         if (temp <= 32) return "Hot";
//         return "Very Hot";
//     }

//     function getMetricDescription(metric, value) {
//         const descriptions = {
//             humidity: (val) => {
//                 if (val <= 30) return "Very Dry";
//                 if (val <= 50) return "Comfortable";
//                 if (val <= 70) return "Humid";
//                 return "Very Humid";
//             },
//             windSpeed: (val) => {
//                 if (val <= 2) return "Calm";
//                 if (val <= 5) return "Light Breeze";
//                 if (val <= 10) return "Moderate";
//                 if (val <= 15) return "Strong";
//                 return "Very Strong";
//             },
//             visibility: (val) => {
//                 if (val <= 1) return "Very Poor";
//                 if (val <= 4) return "Poor";
//                 if (val <= 10) return "Moderate";
//                 return "Good";
//             },
//             pressureSurfaceLevel: (val) => {
//                 if (val < 1000) return "Low (Storm Possible)";
//                 if (val <= 1013) return "Normal";
//                 return "High (Clear Weather)";
//             },
//             cloudCover: (val) => {
//                 if (val <= 25) return "Clear";
//                 if (val <= 50) return "Partly Cloudy";
//                 if (val <= 75) return "Mostly Cloudy";
//                 return "Overcast";
//             }
//         };

//         return descriptions[metric]?.(value) || "";
//     }

//     function updateChart(data) {
//         if (!data || data.length === 0) return;
        
//         currentData = data;
//         xScale.domain(d3.extent(data, d => new Date(d.time)));

//         // Always update temperature
//         updateMetric('temperature', data);

//         // Update selected extra metric if any
//         if (selectedExtraMetric) {
//             updateMetric(selectedExtraMetric, data);
//         }

//         // Create tooltip div
//         const tooltip = d3.select(containerId)
//             .append("div")
//             .attr("class", "tooltip")
//             .style("opacity", 0)
//             .style("position", "absolute")
//             .style("background", "rgba(0, 0, 0, 0.8)")
//             .style("padding", "10px")
//             .style("border-radius", "5px")
//             .style("color", "white")
//             .style("pointer-events", "none");

//         const points = chartGroup.selectAll(".point")
//             .data(data);

//         points.exit().remove();

//         points.enter()
//             .append("circle")
//             .attr("class", "point")
//             .merge(points)
//             .attr("cx", d => xScale(new Date(d.time)))
//             .attr("cy", d => yScales.temperature(d.temp))
//             .attr("r", 4)
//             .attr("fill", "white")
//             .on("mouseover", (event, d) => {
//                 tooltip.transition()
//                     .duration(200)
//                     .style("opacity", .9);
                
//                 let tooltipContent = `
//                     Temperature: ${Math.round(d.temp)}°C (${getTemperatureDescription(d.temp)})<br/>
//                     ${selectedExtraMetric ? `${dataSeries[selectedExtraMetric].label}: ${Math.round(d[selectedExtraMetric])}${getUnit(selectedExtraMetric)} (${getMetricDescription(selectedExtraMetric, d[selectedExtraMetric])})` : ''}
//                 `;
                
//                 tooltip.html(tooltipContent)
//                     .style("left", (event.pageX + 10) + "px")
//                     .style("top", (event.pageY - 28) + "px");
//             })
//             .on("mouseout", () => {
//                 tooltip.transition()
//                     .duration(500)
//                     .style("opacity", 0);
//             });

//         const labels = chartGroup.selectAll(".temp-label")
//             .data(data);

//         labels.exit().remove();

//         labels.enter()
//             .append("text")
//             .attr("class", "temp-label")
//             .merge(labels)
//             .attr("x", d => xScale(new Date(d.time)))
//             .attr("y", d => yScales.temperature(d.temp) - 10)
//             .attr("text-anchor", "middle")
//             .attr("fill", "white")
//             .text(d => `${Math.round(d.temp)}°C`);

//         const xAxis = d3.axisBottom(xScale)
//             .ticks(5)
//             .tickFormat(d3.timeFormat("%H:%M"));
//         xAxisGroup.call(xAxis);
//     }

//     function updateMetric(key, data) {
//         const values = key === 'temperature' 
//             ? data.map(d => d.temp) 
//             : data.map(d => d[key]);
        
//         const filteredValues = values.filter(v => v !== null && !isNaN(v));
        
//         if (filteredValues.length > 0) {
//             const extent = d3.extent(filteredValues);
//             const padding = (extent[1] - extent[0]) * 0.1;
//             yScales[key].domain([extent[0] - padding, extent[1] + padding]);

//             const yAxis = d3.axisLeft(yScales[key])
//                 .ticks(5)
//                 .tickFormat(d => `${d}${getUnit(key)}`);

//             yAxisGroups[key]
//                 .style("display", "block")
//                 .call(yAxis);

//             paths[key]
//                 .style("display", "block")
//                 .datum(data)
//                 .attr("d", lines[key]);
//         }
//     }

//     function getUnit(key) {
//         const units = {
//             temperature: '°C',
//             humidity: '%',
//             windSpeed: 'm/s',
//             visibility: 'km',
//             pressureSurfaceLevel: 'hPa',
//             cloudCover: '%'
//         };
//         return units[key] || '';
//     }

//     return { update: updateChart };
// }
export function createLineChart(containerId, data) {
    const dailyData = aggregateDailyData(data);
    if (!data || data.length === 0) {
        console.error("No valid data provided for chart");
        return;
    }

    // Dimensions
    const margin = { top: 20, right: 50, bottom: 20, left: 50 };
    const width = 1800 - margin.left - margin.right;
    const height = 700 - margin.top - margin.bottom;

    // Create SVG container
    const svg = d3
        .select(containerId)
        .append("svg")
        .attr("viewBox", `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`)
        .attr("preserveAspectRatio", "xMidYMid meet");

    const chartGroup = svg.append("g")
        .attr("transform", `translate(${margin.left}, ${margin.top})`);

    // Scales
    const xScale = d3.scaleTime()
        .domain(d3.extent(data, d => new Date(d.time)))
        .range([0, width]);

    const yScale = d3.scaleLinear()
        .domain([d3.min(data, d => d.temp) - 5, d3.max(data, d => d.temp) + 5])
        .range([height, 0]);

    // Clippath for chart area
    chartGroup
        .append("defs")
        .append("clipPath")
        .attr("id", "clip")
        .append("rect")
        .attr("x", 0)
        .attr("y", 0)
        .attr("width", width)
        .attr("height", height);

    // Axes
    const xAxis = d3.axisBottom(xScale)
        .ticks(5)
        .tickFormat(d3.timeFormat("%A"));
    const yAxis = d3.axisLeft(yScale);

    const xAxisGroup = chartGroup
        .append("g")
        .attr("class", "x-axis")
        .attr("transform", `translate(0, ${height})`)
        .call(xAxis);

    const yAxisGroup = chartGroup
        .append("g")
        .attr("class", "y-axis")
        .call(yAxis);

    // Line generator
    const line = d3.line()
        .x(d => xScale(new Date(d.time)))
        .y(d => yScale(d.temp));

    // Add drag behavior
    const drag = d3.drag()
        .on("drag", dragged);

    function dragged(event) {
        if (event.sourceEvent.shiftKey || event.sourceEvent.ctrlKey) return;
        const transform = d3.zoomTransform(svg.node());
        if (transform.k === 1) return; // Only allow panning when zoomed

        const xChange = event.dx;
        const newTransform = d3.zoomIdentity
            .translate(transform.x + xChange, transform.y)
            .scale(transform.k);
            
        svg.call(zoom.transform, newTransform);
    }

    // Add the line
    const linePath = chartGroup
        .append("path")
        .datum(data)
        .attr("fill", "none")
        .attr("stroke", "white")
        .attr("stroke-width", 3)
        .attr("d", line)
        .attr("clip-path", "url(#clip)");

    // Enable drag on the chart area
    chartGroup.call(drag);

    displayDailyLabels(chartGroup, dailyData, xScale, yScale);

    // Data filtering functions
    function filter12Hours(data) {
        return data.filter(d => {
            const hour = new Date(d.time).getHours();
            return hour % 12 === 0;
        });
    }

    function filter6Hours(data) {
        return data.filter(d => {
            const hour = new Date(d.time).getHours();
            return hour % 6 === 0;
        });
    }

    function filter3Hours(data) {
        return data.filter(d => {
            const hour = new Date(d.time).getHours();
            return hour % 3 === 0;
        });
    }

    function filterHourly(data) {
        return data;
    }

    function aggregateDailyData(data) {
        const groupedData = d3.groups(data, d => {
            const date = new Date(d.time);
            return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        });

        return groupedData.map(([date, values]) => {
            const parsedDate = new Date(date);
            if (isNaN(parsedDate.getTime())) {
                console.error("Invalid date during aggregation:", date);
                return null;
            }
            return {
                date: parsedDate,
                tempMax: d3.max(values, d => d.temp),
                tempMin: d3.min(values, d => d.temp)
            };
        }).filter(d => d !== null);
    }

    function displayTemperatureLabels(data, xScale, yScale, intervalType) {
        chartGroup
            .selectAll(".temp-label")
            .data(data)
            .enter()
            .append("text")
            .attr("class", "temp-label")
            .attr("x", d => xScale(new Date(d.time)))
            .attr("y", d => yScale(d.temp) - 50)
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

    // Zoom behavior
    const zoom = d3
        .zoom()
        .scaleExtent([1, 8])
        .translateExtent([[0, 0], [width, height]])
        .extent([[0, 0], [width, height]])
        .on("zoom", zoomed)
        .filter(event => {
            // Allow zoom only with shift or ctrl key pressed
            return event.type === 'wheel' ? event.shiftKey || event.ctrlKey : true;
        });

    svg.call(zoom);

    function zoomed(event) {
        const transform = event.transform;
        const newXScale = transform.rescaleX(xScale);

        xAxisGroup.call(xAxis.scale(newXScale));

        chartGroup.selectAll(".temp-label").remove();
        chartGroup.selectAll(".daily-label-high").remove();
        chartGroup.selectAll(".daily-label-low").remove();

        if (transform.k > 4) {
            const hourlyData = filterHourly(data);
            displayTemperatureLabels(hourlyData, newXScale, yScale, "hourly");
            xAxis.ticks(d3.timeHour.every(1)).tickFormat(d3.timeFormat("%H:%M"));
        } else if (transform.k > 3) {
            const threeHourData = filter3Hours(data);
            displayTemperatureLabels(threeHourData, newXScale, yScale, "3h");
            xAxis.ticks(d3.timeHour.every(3)).tickFormat(d3.timeFormat("%H:%M"));
        } else if (transform.k > 2) {
            const sixHourData = filter6Hours(data);
            displayTemperatureLabels(sixHourData, newXScale, yScale, "6h");
            xAxis.ticks(d3.timeHour.every(6)).tickFormat(d3.timeFormat("%H:%M"));
        } else if (transform.k > 1) {
            const twelveHourData = filter12Hours(data);
            displayTemperatureLabels(twelveHourData, newXScale, yScale, "12h");
            xAxis.ticks(d3.timeHour.every(12)).tickFormat(d3.timeFormat("%H:%M"));
        } else {
            const dailyData = aggregateDailyData(data);
            displayDailyLabels(chartGroup, dailyData, newXScale, yScale);
            xAxis.ticks(d3.timeDay).tickFormat(d3.timeFormat("%A"));
        }

        linePath.attr("d", line.x(d => newXScale(new Date(d.time))));
    }
}
// export function createRealtimeChart(containerId, initialData) {
//     const margin = { top: 20, right: 80, bottom: 30, left: 60 };
//     const width = 1800 - margin.left - margin.right;
//     const height = 700 - margin.top - margin.bottom;

//     const dataSeries = {
//         temperature: { color: 'white', label: 'Temperature (°C)', active: true },
//         humidity: { color: '#4CAF50', label: 'Humidity (%)', active: false },
//         windSpeed: { color: '#2196F3', label: 'Wind Speed (m/s)', active: false },
//         visibility: { color: '#FFC107', label: 'Visibility (km)', active: false },
//         pressureSurfaceLevel: { color: '#9C27B0', label: 'Pressure (hPa)', active: false },
//         cloudCover: { color: '#607D8B', label: 'Cloud Cover (%)', active: false }
//     };

//     let selectedExtraMetric = null;

//     d3.select(containerId).html('');

//     const filterContainer = d3.select(containerId)
//         .append('div')
//         .attr('class', 'filter-container')
//         .style('margin-bottom', '10px');

//     Object.entries(dataSeries).forEach(([key, config]) => {
//         if (key === 'temperature') return;

//         const label = filterContainer
//             .append('label')
//             .style('margin-right', '15px')
//             .style('color', config.color);

//         label.append('input')
//             .attr('type', 'radio')
//             .attr('name', 'metric')
//             .attr('value', key)
//             .style('margin-right', '5px')
//             .on('change', function() {
//                 if (this.checked) {
//                     if (selectedExtraMetric) {
//                         yAxisGroups[selectedExtraMetric].style("display", "none");
//                         paths[selectedExtraMetric].style("display", "none");
//                     }
//                     selectedExtraMetric = key;
//                     dataSeries[key].active = true;
//                 }
//                 if (currentData.length > 0) {
//                     updateChart(currentData);
//                 }
//             });

//         label.append('span')
//             .text(config.label);
//     });

//     // Add container div for responsive sizing
//     const chartDiv = d3.select(containerId)
//         .append("div")
//         .style("position", "relative")
//         .style("width", "100%")
//         .style("max-height", "70vh")
//         .style("overflow", "hidden");

//     const svg = chartDiv
//         .append("svg")
//         .style("width", "100%")
//         .style("height", "100%")
//         .attr("viewBox", `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`)
//         .attr("preserveAspectRatio", "xMidYMid meet");

//     const chartGroup = svg.append("g")
//         .attr("transform", `translate(${margin.left}, ${margin.top})`);
    
//     // Add transparent overlay for hover effects
//     const overlay = chartGroup.append("rect")
//         .attr("class", "overlay")
//         .attr("width", width)
//         .attr("height", height)
//         .style("opacity", 0);
    
//     // Add vertical line for hover
//     const verticalLine = chartGroup.append("line")
//         .attr("class", "hover-line")
//         .attr("y1", 0)
//         .attr("y2", height)
//         .style("stroke", "#ffffff")
//         .style("stroke-width", "1px")
//         .style("stroke-dasharray", "5,5")
//         .style("opacity", 0);

//     const xScale = d3.scaleTime().range([0, width]);
//     const yScales = {};

//     Object.keys(dataSeries).forEach(key => {
//         yScales[key] = d3.scaleLinear().range([height, 0]);
//     });

//     const xAxisGroup = chartGroup.append("g")
//         .attr("class", "x-axis")
//         .attr("transform", `translate(0, ${height})`);

//     const yAxisGroups = {};
//     Object.entries(dataSeries).forEach(([key, config]) => {
//         const group = chartGroup.append("g")
//             .attr("class", `y-axis-${key}`)
//             .style("display", config.active ? "block" : "none");
        
//         if (key !== 'temperature') {
//             group.attr("transform", `translate(${width}, 0)`);
//         }
//         yAxisGroups[key] = group;
//     });

//     const lines = {};
//     Object.keys(dataSeries).forEach(key => {
//         lines[key] = d3.line()
//             .x(d => xScale(new Date(d.time)))
//             .y(d => {
//                 const value = key === 'temperature' ? d.temp : d[key];
//                 return yScales[key](value);
//             })
//             .defined(d => {
//                 const value = key === 'temperature' ? d.temp : d[key];
//                 return value !== null && !isNaN(value);
//             });
//     });

//     const paths = {};
//     Object.entries(dataSeries).forEach(([key, config]) => {
//         paths[key] = chartGroup.append("path")
//             .attr("class", `line-${key}`)
//             .attr("fill", "none")
//             .attr("stroke", config.color)
//             .attr("stroke-width", 2)
//             .style("display", config.active ? "block" : "none");
//     });

//     let currentData = [];

//     function getTemperatureDescription(temp) {
//         if (temp <= 0) return "Freezing";
//         if (temp <= 10) return "Very Cold";
//         if (temp <= 15) return "Cool";
//         if (temp <= 22) return "Comfortable";
//         if (temp <= 27) return "Warm";
//         if (temp <= 32) return "Hot";
//         return "Very Hot";
//     }

//     function getMetricDescription(metric, value) {
//         const descriptions = {
//             humidity: (val) => {
//                 if (val <= 30) return "Very Dry";
//                 if (val <= 50) return "Comfortable";
//                 if (val <= 70) return "Humid";
//                 return "Very Humid";
//             },
//             windSpeed: (val) => {
//                 if (val <= 2) return "Calm";
//                 if (val <= 5) return "Light Breeze";
//                 if (val <= 10) return "Moderate";
//                 if (val <= 15) return "Strong";
//                 return "Very Strong";
//             },
//             visibility: (val) => {
//                 if (val <= 1) return "Very Poor";
//                 if (val <= 4) return "Poor";
//                 if (val <= 10) return "Moderate";
//                 return "Good";
//             },
//             pressureSurfaceLevel: (val) => {
//                 if (val < 1000) return "Low (Storm Possible)";
//                 if (val <= 1013) return "Normal";
//                 return "High (Clear Weather)";
//             },
//             cloudCover: (val) => {
//                 if (val <= 25) return "Clear";
//                 if (val <= 50) return "Partly Cloudy";
//                 if (val <= 75) return "Mostly Cloudy";
//                 return "Overcast";
//             }
//         };

//         return descriptions[metric]?.(value) || "";
//     }

//     function updateChart(data) {
//         if (!data || data.length === 0) return;
        
//         // Remove existing tooltip if any
//         d3.select(containerId).selectAll(".tooltip").remove();
        
//         currentData = data;
//         xScale.domain(d3.extent(data, d => new Date(d.time)));

//         // Always update temperature
//         updateMetric('temperature', data);

//         // Update selected extra metric if any
//         if (selectedExtraMetric) {
//             updateMetric(selectedExtraMetric, data);
//         }

//         // Create tooltip div
//         const tooltip = d3.select(containerId)
//             .append("div")
//             .attr("class", "tooltip")
//             .style("opacity", 0)
//             .style("position", "absolute")
//             .style("background", "rgba(0, 0, 0, 0.8)")
//             .style("padding", "10px")
//             .style("border-radius", "5px")
//             .style("color", "white")
//             .style("pointer-events", "none");

//         const points = chartGroup.selectAll(".point")
//             .data(data);

//         points.exit().remove();

//         points.enter()
//             .append("circle")
//             .attr("class", "point")
//             .merge(points)
//             .attr("cx", d => xScale(new Date(d.time)))
//             .attr("cy", d => yScales.temperature(d.temp))
//             .attr("r", 4)
//             .attr("fill", "white")
//             .on("mouseover", (event, d) => {
//                 tooltip.transition()
//                     .duration(200)
//                     .style("opacity", .9);
                
//                 let tooltipContent = `
//                     Temperature: ${Math.round(d.temp)}°C (${getTemperatureDescription(d.temp)})<br/>
//                     ${selectedExtraMetric ? `${dataSeries[selectedExtraMetric].label}: ${Math.round(d[selectedExtraMetric])}${getUnit(selectedExtraMetric)} (${getMetricDescription(selectedExtraMetric, d[selectedExtraMetric])})` : ''}
//                 `;
                
//                 tooltip.html(tooltipContent)
//                     .style("left", (event.pageX + 10) + "px")
//                     .style("top", (event.pageY - 28) + "px");
//             })
//             .on("mouseout", () => {
//                 tooltip.transition()
//                     .duration(500)
//                     .style("opacity", 0);
//             });

//         const labels = chartGroup.selectAll(".temp-label")
//             .data(data);

//         labels.exit().remove();

//         labels.enter()
//             .append("text")
//             .attr("class", "temp-label")
//             .merge(labels)
//             .attr("x", d => xScale(new Date(d.time)))
//             .attr("y", d => yScales.temperature(d.temp) - 10)
//             .attr("text-anchor", "middle")
//             .attr("fill", "white")
//             .text(d => `${Math.round(d.temp)}°C`);

//         const xAxis = d3.axisBottom(xScale)
//             .ticks(5)
//             .tickFormat(d3.timeFormat("%H:%M"));
//         xAxisGroup.call(xAxis);

//         // Add hover functionality
//         overlay
//             .on("mousemove", function(event) {
//                 const mouseX = d3.pointer(event)[0];
//                 const x0 = xScale.invert(mouseX);
                
//                 // Find the nearest data point
//                 const bisectDate = d3.bisector(d => new Date(d.time)).left;
//                 const i = bisectDate(data, x0, 1);
//                 const d0 = data[i - 1];
//                 const d1 = data[i];
                
//                 if (!d0 || !d1) return;
                
//                 const d = x0 - new Date(d0.time) > new Date(d1.time) - x0 ? d1 : d0;
                
//                 // Update vertical line position
//                 verticalLine
//                     .attr("x1", xScale(new Date(d.time)))
//                     .attr("x2", xScale(new Date(d.time)))
//                     .style("opacity", 1);

//                 // Update tooltip
//                 tooltip
//                     .style("opacity", 0.9)
//                     .html(`
//                         Time: ${d3.timeFormat("%H:%M")(new Date(d.time))}<br/>
//                         Temperature: ${Math.round(d.temp)}°C (${getTemperatureDescription(d.temp)})<br/>
//                         ${selectedExtraMetric ? `${dataSeries[selectedExtraMetric].label}: ${Math.round(d[selectedExtraMetric])}${getUnit(selectedExtraMetric)} (${getMetricDescription(selectedExtraMetric, d[selectedExtraMetric])})` : ''}
//                     `)
//                     .style("left", (event.pageX + 10) + "px")
//                     .style("top", (event.pageY - 28) + "px");
//             })
//             .on("mouseout", function() {
//                 verticalLine.style("opacity", 0);
//                 tooltip.style("opacity", 0);
//             });
//     }

//     function updateMetric(key, data) {
//         const values = key === 'temperature' 
//             ? data.map(d => d.temp) 
//             : data.map(d => d[key]);
        
//         const filteredValues = values.filter(v => v !== null && !isNaN(v));
        
//         if (filteredValues.length > 0) {
//             const extent = d3.extent(filteredValues);
//             const padding = (extent[1] - extent[0]) * 0.1;
//             yScales[key].domain([extent[0] - padding, extent[1] + padding]);

//             const yAxis = d3.axisLeft(yScales[key])
//                 .ticks(5)
//                 .tickFormat(d => `${d}${getUnit(key)}`);

//             yAxisGroups[key]
//                 .style("display", "block")
//                 .call(yAxis);

//             paths[key]
//                 .style("display", "block")
//                 .datum(data)
//                 .attr("d", lines[key]);
//         }
//     }

//     function getUnit(key) {
//         const units = {
//             temperature: '°C',
//             humidity: '%',
//             windSpeed: 'm/s',
//             visibility: 'km',
//             pressureSurfaceLevel: 'hPa',
//             cloudCover: '%'
//         };
//         return units[key] || '';
//     }

//     return { update: updateChart };
// }

export function createRealtimeChart(containerId, initialData) {
    const margin = { top: 20, right: 80, bottom: 30, left: 60 };
    const width = 1800 - margin.left - margin.right;
    const height = 700 - margin.top - margin.bottom;
    
    let currentData = [];  // Store accumulated data

    const dataSeries = {
        temperature: { color: 'white', label: 'Temperature (°C)', active: true },
        humidity: { color: '#4CAF50', label: 'Humidity (%)', active: false },
        windSpeed: { color: '#2196F3', label: 'Wind Speed (m/s)', active: false },
        visibility: { color: '#FFC107', label: 'Visibility (km)', active: false },
        pressureSurfaceLevel: { color: '#9C27B0', label: 'Pressure (hPa)', active: false },
        cloudCover: { color: '#607D8B', label: 'Cloud Cover (%)', active: false }
    };

    let selectedExtraMetric = null;

    d3.select(containerId).html('');

    // Create filter controls
    const filterContainer = d3.select(containerId)
        .append('div')
        .attr('class', 'filter-container')
        .style('margin-bottom', '10px');

    Object.entries(dataSeries).forEach(([key, config]) => {
        if (key === 'temperature') return;

        const label = filterContainer
            .append('label')
            .style('margin-right', '15px')
            .style('color', config.color);

        label.append('input')
            .attr('type', 'radio')
            .attr('name', 'metric')
            .attr('value', key)
            .style('margin-right', '5px')
            .on('change', function() {
                if (this.checked) {
                    if (selectedExtraMetric) {
                        yAxisGroups[selectedExtraMetric].style("display", "none");
                        paths[selectedExtraMetric].style("display", "none");
                    }
                    selectedExtraMetric = key;
                    dataSeries[key].active = true;
                }
                if (currentData.length > 0) {
                    updateChart(currentData);
                }
            });

        label.append('span')
            .text(config.label);
    });

    // Setup chart container
    const chartDiv = d3.select(containerId)
        .append("div")
        .style("position", "relative")
        .style("width", "100%")
        .style("max-height", "70vh")
        .style("overflow", "hidden");

    const svg = chartDiv
        .append("svg")
        .style("width", "100%")
        .style("height", "100%")
        .attr("viewBox", `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`)
        .attr("preserveAspectRatio", "xMidYMid meet");

    const chartGroup = svg.append("g")
        .attr("transform", `translate(${margin.left}, ${margin.top})`);

    // Add hover elements
    const overlay = chartGroup.append("rect")
        .attr("class", "overlay")
        .attr("width", width)
        .attr("height", height)
        .style("opacity", 0);

    const verticalLine = chartGroup.append("line")
        .attr("class", "hover-line")
        .attr("y1", 0)
        .attr("y2", height)
        .style("stroke", "#ffffff")
        .style("stroke-width", "1px")
        .style("stroke-dasharray", "5,5")
        .style("opacity", 0);

    // Setup scales
    const xScale = d3.scaleTime().range([0, width]);
    const yScales = {};

    Object.keys(dataSeries).forEach(key => {
        yScales[key] = d3.scaleLinear().range([height, 0]);
    });

    // Add axes
    const xAxisGroup = chartGroup.append("g")
        .attr("class", "x-axis")
        .attr("transform", `translate(0, ${height})`);

    const yAxisGroups = {};
    Object.entries(dataSeries).forEach(([key, config]) => {
        const group = chartGroup.append("g")
            .attr("class", `y-axis-${key}`)
            .style("display", config.active ? "block" : "none");
        
        if (key !== 'temperature') {
            group.attr("transform", `translate(${width}, 0)`);
        }
        yAxisGroups[key] = group;
    });

    // Setup line generators
    const lines = {};
    Object.keys(dataSeries).forEach(key => {
        lines[key] = d3.line()
            .x(d => xScale(new Date(d.time)))
            .y(d => {
                const value = key === 'temperature' ? d.temp : d[key];
                return yScales[key](value);
            })
            .defined(d => {
                const value = key === 'temperature' ? d.temp : d[key];
                return value !== null && !isNaN(value);
            });
    });

    // Create paths
    const paths = {};
    Object.entries(dataSeries).forEach(([key, config]) => {
        paths[key] = chartGroup.append("path")
            .attr("class", `line-${key}`)
            .attr("fill", "none")
            .attr("stroke", config.color)
            .attr("stroke-width", 2)
            .style("display", config.active ? "block" : "none");
    });

    // Helper functions
    function getTemperatureDescription(temp) {
        if (temp <= 0) return "Freezing";
        if (temp <= 10) return "Very Cold";
        if (temp <= 15) return "Cool";
        if (temp <= 22) return "Comfortable";
        if (temp <= 27) return "Warm";
        if (temp <= 32) return "Hot";
        return "Very Hot";
    }

    function getMetricDescription(metric, value) {
        const descriptions = {
            humidity: (val) => {
                if (val <= 30) return "Very Dry";
                if (val <= 50) return "Comfortable";
                if (val <= 70) return "Humid";
                return "Very Humid";
            },
            windSpeed: (val) => {
                if (val <= 2) return "Calm";
                if (val <= 5) return "Light Breeze";
                if (val <= 10) return "Moderate";
                if (val <= 15) return "Strong";
                return "Very Strong";
            },
            visibility: (val) => {
                if (val <= 1) return "Very Poor";
                if (val <= 4) return "Poor";
                if (val <= 10) return "Moderate";
                return "Good";
            },
            pressureSurfaceLevel: (val) => {
                if (val < 1000) return "Low (Storm Possible)";
                if (val <= 1013) return "Normal";
                return "High (Clear Weather)";
            },
            cloudCover: (val) => {
                if (val <= 25) return "Clear";
                if (val <= 50) return "Partly Cloudy";
                if (val <= 75) return "Mostly Cloudy";
                return "Overcast";
            }
        };
        return descriptions[metric]?.(value) || "";
    }

    function updateChart(newData) {
        if (!newData || newData.length === 0) return;

        // Update data management
        currentData = [...currentData, ...newData];
        
        // Keep only last 10 minutes of data
        const tenMinutesAgo = new Date(Date.now() - 10 * 60000);
        currentData = [...currentData, ...newData]
            .filter(d => new Date(d.time) > tenMinutesAgo)
            .sort((a, b) => new Date(a.time) - new Date(b.time))
            .slice(-20); // Keep maximum 20 data points
    
        // Remove existing tooltip
        d3.select(containerId).selectAll(".tooltip").remove();

        // Update scales
        xScale.domain(d3.extent(currentData, d => new Date(d.time)));
        updateMetric('temperature', currentData);
        if (selectedExtraMetric) {
            updateMetric(selectedExtraMetric, currentData);
        }

        // Create tooltip
        const tooltip = d3.select(containerId)
            .append("div")
            .attr("class", "tooltip")
            .style("opacity", 0)
            .style("position", "absolute")
            .style("background", "rgba(0, 0, 0, 0.8)")
            .style("padding", "10px")
            .style("border-radius", "5px")
            .style("color", "white")
            .style("pointer-events", "none");

        // Update points
        const points = chartGroup.selectAll(".point")
            .data(currentData);

        points.exit().remove();

        points.enter()
            .append("circle")
            .attr("class", "point")
            .merge(points)
            .attr("cx", d => xScale(new Date(d.time)))
            .attr("cy", d => yScales.temperature(d.temp))
            .attr("r", 4)
            .attr("fill", "white")
            .on("mouseover", (event, d) => {
                tooltip.transition()
                    .duration(200)
                    .style("opacity", .9);
                
                let tooltipContent = `
                    Temperature: ${Math.round(d.temp)}°C (${getTemperatureDescription(d.temp)})<br/>
                    ${selectedExtraMetric ? `${dataSeries[selectedExtraMetric].label}: ${Math.round(d[selectedExtraMetric])}${getUnit(selectedExtraMetric)} (${getMetricDescription(selectedExtraMetric, d[selectedExtraMetric])})` : ''}
                `;
                
                tooltip.html(tooltipContent)
                    .style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY - 28) + "px");
            })
            .on("mouseout", () => {
                tooltip.transition()
                    .duration(500)
                    .style("opacity", 0);
            });

        // Update labels
        const labels = chartGroup.selectAll(".temp-label")
            .data(currentData);

        labels.exit().remove();

        labels.enter()
            .append("text")
            .attr("class", "temp-label")
            .merge(labels)
            .attr("x", d => xScale(new Date(d.time)))
            .attr("y", d => yScales.temperature(d.temp) - 10)
            .attr("text-anchor", "middle")
            .attr("fill", "white")
            .text(d => `${Math.round(d.temp)}°C`);

        // Update x-axis
        const xAxis = d3.axisBottom(xScale)
            .ticks(5)
            .tickFormat(d3.timeFormat("%H:%M"));
        xAxisGroup.call(xAxis);

        // Add hover functionality
        overlay
            .on("mousemove", function(event) {
                const mouseX = d3.pointer(event)[0];
                const x0 = xScale.invert(mouseX);
                
                const bisectDate = d3.bisector(d => new Date(d.time)).left;
                const i = bisectDate(currentData, x0, 1);
                const d0 = currentData[i - 1];
                const d1 = currentData[i];
                
                if (!d0 || !d1) return;
                
                const d = x0 - new Date(d0.time) > new Date(d1.time) - x0 ? d1 : d0;
                
                verticalLine
                    .attr("x1", xScale(new Date(d.time)))
                    .attr("x2", xScale(new Date(d.time)))
                    .style("opacity", 1);

                tooltip
                    .style("opacity", 0.9)
                    .html(`
                        Time: ${d3.timeFormat("%H:%M")(new Date(d.time))}<br/>
                        Temperature: ${Math.round(d.temp)}°C (${getTemperatureDescription(d.temp)})<br/>
                        ${selectedExtraMetric ? `${dataSeries[selectedExtraMetric].label}: ${Math.round(d[selectedExtraMetric])}${getUnit(selectedExtraMetric)} (${getMetricDescription(selectedExtraMetric, d[selectedExtraMetric])})` : ''}
                    `)
                    .style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY - 28) + "px");
            })
            .on("mouseout", function() {
                verticalLine.style("opacity", 0);
                tooltip.style("opacity", 0);
            });
    }

    function updateMetric(key, data) {
        const values = key === 'temperature' 
            ? data.map(d => d.temp) 
            : data.map(d => d[key]);
        
        const filteredValues = values.filter(v => v !== null && !isNaN(v));
        
        if (filteredValues.length > 0) {
            const extent = d3.extent(filteredValues);
            const padding = (extent[1] - extent[0]) * 0.1;
            yScales[key].domain([extent[0] - padding, extent[1] + padding]);

            const yAxis = d3.axisLeft(yScales[key])
                .ticks(5)
                .tickFormat(d => `${d}${getUnit(key)}`);

            yAxisGroups[key]
                .style("display", "block")
                .call(yAxis);

            paths[key]
                .style("display", "block")
                .datum(data)
                .attr("d", lines[key]);
        }
    }

    function getUnit(key) {
        const units = {
            temperature: '°C',
            humidity: '%',
            windSpeed: 'm/s',
            visibility: 'km',
            pressureSurfaceLevel: 'hPa',
            cloudCover: '%'
        };
        return units[key] || '';
    }

    return { update: updateChart };
}

