// Seleccionar el contenedor
const dashboardContainer = d3.select("#dashboard-container");

// Agregar títulos
dashboardContainer.append("h1")
    .text("Incendios en Ecuador 2010 - 2019");

dashboardContainer.append("h2")
    .text("Herramientas para visualización de datos");


// Desing the dashboard
d3.json("ecu_incendios.json").then(function (data) {
    
    console.log(data)

    // 1. Create a Pie for Provinces


    const counts = d3.rollup(data, v => v.length, d => d.DPA_DESPRO);
    const countsArray = Array.from(counts, ([key, value]) => ({ dpa_despro: key, count: value }));

    const chartContainer = dashboardContainer.append("div")
        .attr("id", "chart-container");

    // Crear el contenedor SVG para el gráfico de pastel
    const svg = chartContainer.append("svg")
        .attr("width", 400)
        .attr("height", 400);

    // Definir el radio del gráfico de pastel
    const radius = Math.min(200, 200) / 2;

    // Crear una función generadora de arcos para el gráfico de pastel
    const arcGenerator = d3.arc()
        .innerRadius(0)
        .outerRadius(radius);

    // Crear un generador de pastel
    const pieGenerator = d3.pie()
        .value(d => d.count);

    // Agregar sectores al gráfico de pastel
    const arcs = svg.selectAll("arc")
        .data(pieGenerator(countsArray))
        .enter()
        .append("g")
        .attr("class", "arc")
        .attr("transform", "translate(200,200)");

    // Agregar los sectores del pastel
    arcs.append("path")
        .attr("d", arcGenerator)
        .attr("fill", (d, i) => d3.schemeCategory10[i % 10]);

    // Agregar etiquetas a los sectores
    arcs.append("text")
        .attr("transform", d => `translate(${arcGenerator.centroid(d)})`)
        .attr("text-anchor", "middle")
        .text(d => d.data.dpa_despro)
        .attr("fill", "black")
        .attr("font-size", "12px");

    // Agregar título al gráfico
    svg.append("text")
        .attr("x", 200)
        .attr("y", 30)
        .attr("text-anchor", "middle")
        .text("Distribución de DPA_DESPRO")
        .attr("fill", "black")
        .attr("font-size", "18px");
});