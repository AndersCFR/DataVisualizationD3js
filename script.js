// Seleccionar el contenedor
const dashboardContainer = d3.select("#dashboard-container");

// Agregar títulos
dashboardContainer.append("h1")
    .text("Estudio incendios forestales en Ecuador 2010 - 2019");

dashboardContainer.append("h4")
    .text("Herramientas para visualización de datos UNIR");

// Desing the dashboard
d3.json("ecu_incendios.json").then(function (data) {
    
    //console.log(data)

    // Acumulación de valores
    const counts = d3.rollup(data, v => v.length, d => d.DPA_DESPRO);
    const countsArray = Array.from(counts, ([key, value]) => ({ dpa_despro: key, count: value }));

    // ------------------------------------------
    // 1. Pastel para incendios por provincia
    // ------------------------------------------

    const chartContainer = dashboardContainer.append("div")
        .attr("id", "pie-chart");
        
    // Definir el ancho y alto del gráfico de barras
    const barWidth = 40;
    const barPadding = 10;
    const chartWidth = countsArray.length * (barWidth + barPadding);
    const chartHeight = 400;

    // Crear el contenedor SVG para el gráfico de barras
    const svg = chartContainer.append("svg")
        .attr("width", chartWidth)
        .attr("height", chartHeight);

    // Crear un generador de escalas para el eje Y (conteo de incidentes)
    const yScale2 = d3.scaleLinear()
        .domain([0, d3.max(countsArray, d => d.count)])
        .range([0, chartHeight - 50]);

    // Agregar barras al gráfico
    svg.selectAll("rect")
        .data(countsArray)
        .enter()
        .append("rect")
        .attr("x", (d, i) => i * (barWidth + barPadding))
        .attr("y", d => chartHeight - yScale2(d.count))
        .attr("width", barWidth)
        .attr("height", d => yScale2(d.count))
        .attr("fill", "steelblue");

    // Agregar etiquetas a las barras
    svg.selectAll("text.bar-label")
        .data(countsArray)
        .enter()
        .append("text")
        .attr("class", "bar-label")
        .attr("x", (d, i) => i * (barWidth + barPadding) + barWidth / 2)
        .attr("y", d => chartHeight - yScale2(d.count) + 15)
        .attr("text-anchor", "middle")
        .text(d => d.dpa_despro)
        .attr("fill", "black")
        .attr("font-size", "12px");

    // Agregar título al gráfico
    svg.append("text")
        .attr("x", chartWidth / 2)
        .attr("y", 30)
        .attr("text-anchor", "middle")
        .text("Distribución de Provincia")
        .attr("fill", "black")
        .attr("font-size", "18px");
    
    
    // --------------------------------------------------- //
    //  2. Evolución en línea de tiempo
    // ------------------------------------------------- //
        data.forEach(d => {
            d.date = new Date(d.ANIO, d.MES - 1); // Restamos 1 al mes ya que en JavaScript los meses van de 0 a 11
        });
        
        // Agrupar los datos por mes y año y sumar el área afectada en hectáreas
        const monthlyAreaAffected = d3.rollup(data, v => d3.sum(v, d => parseFloat(d.AREA_HA)), d => d.date);
        
        // Convertir los datos agrupados en un array
        const monthlyAreaArray = Array.from(monthlyAreaAffected, ([key, value]) => ({ date: key, area: value }));
        
        // Ordenar los datos por fecha
        monthlyAreaArray.sort((a, b) => d3.ascending(a.date, b.date));
        
        const xScale = d3.scaleTime()
        .domain(d3.extent(monthlyAreaArray, d => d.date))
        .range([0, 800]);

    const yScale = d3.scaleLinear()
        .domain([0, d3.max(monthlyAreaArray, d => d.area)])
        .nice()
        .range([400, 0]);

    // Crear la línea generadora
    const line = d3.line()
        .x(d => xScale(d.date))
        .y(d => yScale(d.area));

    // Crear el contenedor SVG para el gráfico de líneas
    const lineChart = dashboardContainer.append("svg")
        .attr("width", 950) // Aumentamos el ancho para dejar espacio a la izquierda
        .attr("height", 500)
        .append("g")
        .attr("transform", "translate(50, 50)"); // Agregamos un margen izquierdo de 50px y un margen superior de 50px

    // Agregar la línea al gráfico
    lineChart.append("path")
        .datum(monthlyAreaArray)
        .attr("fill", "none")
        .attr("stroke", "steelblue")
        .attr("stroke-width", 2)
        .attr("d", line);

    // Agregar ejes
    lineChart.append("g")
        .attr("transform", "translate(0,400)")
        .call(d3.axisBottom(xScale).ticks(10));

    lineChart.append("g")
        .call(d3.axisLeft(yScale)
            .tickFormat(d3.format(".2s")) // Formato para mostrar los números con notación abreviada
            .ticks(5) // Ajusta la cantidad de marcas en el eje y
        );

    // Agregar título
    lineChart.append("text")
        .attr("x", 400) // Centramos el título horizontalmente
        .attr("y", -20) // Desplazamos el título hacia arriba
        .attr("text-anchor", "middle")
        .text("Evolución del Área Afectada por Incendios Forestales (2010 - 2019)")
        .attr("fill", "black")
        .attr("font-size", "18px");

    // Etiqueta eje Y
    lineChart.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", -50)
        .attr("x", -200) // Desplazamos el texto hacia la izquierda
        .attr("dy", "1em")
        .style("text-anchor", "middle")
        .text("Área Afectada (hectáreas)")
        .attr("fill", "black");

    // Etiqueta del eje X
    lineChart.append("text")
        .attr("x", 400) // Centramos la etiqueta horizontalmente
        .attr("y", 450) // Desplazamos la etiqueta hacia abajo
        .attr("text-anchor", "middle")
        .text("Año")
        .attr("fill", "black");
    
    // ----------------------------------------------------------
    // 3. Mapa
    // ---------------------------------------------------------
    
    // Tamaño del contenedor del mapa
    d3.json("ecuador.json").then(function(ecuador) {
        // Definir la proyección
        const projection = d3.geoMercator()
            .fitSize([800, 500], ecuador); // Ajustar tamaño a 800x500

        // Crear generador de rutas para los límites
        const path = d3.geoPath().projection(projection);

        console.log("Data de incendios forestales:", data);

        // Calcular la suma de hectáreas afectadas por provincia
        const provinceAreaAffected = d3.rollup(data, v => d3.sum(v, d => parseFloat(d.AREA_HA)), d => d.DPA_PROVIN);
        // Convertir los datos agrupados en un array
        const provinceAreaArray = Array.from(provinceAreaAffected, ([key, value]) => ({ province: key, area: value }));

        console.log("Datos de provincia con área afectada:", provinceAreaArray);

        // Definir una escala de color azul
        const colorScale = d3.scaleSequential()
        .domain([0, d3.max(provinceAreaArray, d => d.area)])
        .interpolator(d3.interpolateBlues); // Escala de azules

        // Crear el contenedor SVG para el mapa
        const mapContainer = dashboardContainer.append("svg")
        .attr("width", 800)
        .attr("height", 500);

        // Dibujar las provincias de Ecuador
        mapContainer.selectAll("path")
        .data(ecuador.features)
        .enter().append("path")
        .attr("d", path)
        .attr("stroke", "black")
        .attr("stroke-width", 1)
        .attr("fill", d => {
            const provinceData = provinceAreaArray.find(province => province.province === parseInt(d.properties.dpa_provin));
            return provinceData ? colorScale(provinceData.area) : "lightgray";
        });

        // Agregar título al mapa
        mapContainer.append("text")
        .attr("x", 400)
        .attr("y", 14)
        .attr("text-anchor", "middle")
        .text("Frecuencia de Incendio por Provincias")
        .attr("fill", "black")
        .attr("font-size", "18px");

    });
        
        // 4. Pastel por sectores
        // Calcular la suma acumulada de hectáreas afectadas por cada categoría de DESCRIP_1
    // ------------------------------------------
    // 2. Nuevo Pastel para descripción de incendios
    // ------------------------------------------
    const descriptionCounts = d3.rollup(data, v => d3.sum(v, d => parseFloat(d.AREA_HA)), d => d.DESCRIP_1);
    const descriptionCountsArray = Array.from(descriptionCounts, ([key, value]) => ({ description: key, area: value }));

    const newChartContainer = dashboardContainer.append("div")
        .attr("id", "new-chart-container");

    // Crear el contenedor SVG para el nuevo gráfico de pastel
    const newSvg = newChartContainer.append("svg")
        .attr("width", 400)
        .attr("height", 400);

    // Definir el radio del nuevo gráfico de pastel
    const newRadius = Math.min(200, 200) / 2;

    // Crear una función generadora de arcos para el nuevo gráfico de pastel
    const newArcGenerator = d3.arc()
        .innerRadius(0)
        .outerRadius(newRadius);

    // Crear un generador de pastel para el nuevo gráfico
    const newPieGenerator = d3.pie()
        .value(d => d.area);

    // Agregar sectores al nuevo gráfico de pastel
    const newArcs = newSvg.selectAll("arc")
        .data(newPieGenerator(descriptionCountsArray))
        .enter()
        .append("g")
        .attr("class", "arc")
        .attr("transform", "translate(200,200)");

    // Agregar los sectores del nuevo pastel
    newArcs.append("path")
        .attr("d", newArcGenerator)
        .attr("fill", (d, i) => d3.schemeCategory10[i % 10]);

    // Agregar etiquetas a los sectores del nuevo pastel
    newArcs.append("text")
        .attr("transform", d => `translate(${newArcGenerator.centroid(d)})`)
        .attr("text-anchor", "middle")
        .text(d => d.data.description)
        .attr("fill", "black")
        .attr("font-size", "12px");

    // Agregar título al nuevo gráfico de pastel
    newSvg.append("text")
        .attr("x", 200)
        .attr("y", 30)
        .attr("text-anchor", "middle")
        .text("Distribución por Descripción")
        .attr("fill", "black")
        .attr("font-size", "18px");

    // -----------------
    // 5. Distribución por meses
    
    // Calcular el total de incendios por mes
    const incendiosPorMes = d3.rollup(data, v => v.length, d => d.MES);

    // Convertir los datos agrupados en un array de objetos
    const incendiosPorMesArray = Array.from(incendiosPorMes, ([mes, total]) => ({ mes, total }));

    // Ordenar el array por total de incendios de manera descendente
    incendiosPorMesArray.sort((a, b) => b.total - a.total);

    // Seleccionar el contenedor para el gráfico de barras
    const barChartContainer = dashboardContainer.append("div")
        .attr("class", "bar-chart-container");

    // Definir dimensiones del gráfico de barras
    const width = 400;
    const height = 400;
    const margin = { top: 20, right: 30, bottom: 40, left: 60 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    // Crear el contenedor SVG para el gráfico de barras
    const svgBar = barChartContainer.append("svg")
        .attr("width", width)
        .attr("height", height);

    // Crear la escala x para el total de incendios
    const xScaleHB = d3.scaleLinear()
        .domain([0, d3.max(incendiosPorMesArray, d => d.total)])
        .range([0, innerWidth]);

    // Crear la escala y para los meses
    const yScaleHB = d3.scaleBand()
        .domain(incendiosPorMesArray.map(d => d.mes))
        .range([0, innerHeight])
        .padding(0.1);

    // Agregar las barras al gráfico
    svgBar.selectAll(".bar")
        .data(incendiosPorMesArray)
        .enter().append("rect")
        .attr("class", "bar")
        .attr("x", 0)
        .attr("y", d => yScaleHB(d.mes))
        .attr("width", d => xScaleHB(d.total))
        .attr("height", yScaleHB.bandwidth())
        .attr("fill", "steelblue");

    // Agregar ejes
    svgBar.append("g")
    .attr("class", "x-axis")
    .attr("transform", `translate(0, ${innerHeight})`)
    .call(d3.axisBottom(xScaleHB))
    .selectAll("text")  // Rotar las etiquetas del eje x para que sean legibles
    .attr("transform", "rotate(-45)")
    .attr("text-anchor", "end")
    .attr("x", -10)
    .attr("y", 10);

    svgBar.append("g")
    .attr("class", "y-axis")
    .call(d3.axisLeft(yScaleHB).tickFormat((d, i) => {
        // Agregar nombres de los meses al eje Y
        return obtenerNombreMes(d);
    }))
    .selectAll("text") // Ajustar la posición del texto del eje y
    .attr("x", 18)
    .attr("dy", 0); // Centrar verticalmente

// Función para obtener el nombre del mes a partir de su número
function obtenerNombreMes(numeroMes) {
    const meses = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
    return meses[numeroMes - 1]; // Restamos 1 porque los meses comienzan desde 1
}

// Agregar título al gráfico
svgBar.append("text")
    .attr("x", innerWidth / 1.5)
    .attr("y", 200) // Coordenada Y negativa para colocarlo arriba del gráfico
    .attr("text-anchor", "middle")
    .text("Distribución mensual")
    .attr("fill", "black")
    .attr("font-size", "16px");

    svgBar.append("text")
    .attr("x", 140)
    .attr("y", chartHeight - 5)
    .attr("text-anchor", "middle")
    .text("Número de incendios registrados")
    .attr("fill", "black")
        .attr("font-size", "14px");
    
    


                    
});