export function createLineChart(containerId, data) {
    if (!data || data.length === 0) {
        console.error("Keine gültigen Daten für das Diagramm übergeben.");
        return;
    }
  // Masse und Margins
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

   // Skalen erstellen
   const xScale = d3.scaleTime()
   .domain(d3.extent(data, d => new Date(d.time))) // Zeitbereich (Datenbereich)
   .range([0, width]); // Pixelbereich

 const yScale = d3.scaleLinear()
   .domain([d3.min(data, d => d.temp) - 5, d3.max(data, d => d.temp) + 5]) // Temperaturbereich
   .range([height, 0]); // Pixelbereich (invertiert)

  // X- und Y-Achsen erstellen
  const xAxis = d3.axisBottom(xScale).ticks(8).tickFormat((d) => `${d}h`);
  const yAxis = d3.axisLeft(yScale);

  // X-Achse hinzufügen
  svg
    .append("g")
    .attr("transform", `translate(0, ${height})`)
    .call(xAxis)

  // Y-Achse hinzufügen
  svg
    .append("g")
    .call(yAxis)
  

  // Platzhalter für Linien hinzufügen
  svg
    .append("path")
    .datum([]) // Leere Daten
    .attr("fill", "none")
    .attr("stroke", "steelblue")
    .attr("stroke-width", 1.5)
    .attr("d", d3.line());

  // Linie erstellen
  const line = d3.line()
    .x(d => xScale(new Date(d.time))) // X-Wert berechnen
    .y(d => yScale(d.temp)); // Y-Wert berechnen

    svg.append("path")
    .datum(data)
    .attr("fill", "none")
    .attr("stroke", "steelblue")
    .attr("stroke-width", 2)
    .attr("d", line); // Linie zeichnen

}
