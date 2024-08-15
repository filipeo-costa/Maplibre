const map = new maplibregl.Map({
  container: "map",
  style: "./hybrid.json",
  center: [-76.98174185335526, 49.05297675465482],
  zoom: 5,
});

map.on("load", async () => {
  // Function to parse CSV and create GeoJSON features
  async function parseCSVAndAddToMap() {
    const response = await fetch("https://cwfis.cfs.nrcan.gc.ca/downloads/activefires/activefires.csv"); // Adjust path as needed
    const csvData = await response.text();
    
    const geojsonFeatures = [];
    const rows = csvData.trim().split("\n");

    rows.forEach((row) => {
      const columns = row.split(",");
      const latitude = parseFloat(columns[2]); // Latitude
      const longitude = parseFloat(columns[3]); // Longitude
      const description = columns.slice(4).join(",").trim(); // Handle description with commas
      const hectares = parseFloat(columns[5]); // Hectares
      //const status = columns[6].trim(); // status of fire (OC, BH, UC, etc.)

      if (!isNaN(latitude) && !isNaN(longitude) && !isNaN(hectares)) {
        const feature = {
          type: "Feature",
          geometry: {
            type: "Point",
            coordinates: [longitude, latitude], // GeoJSON uses [lon, lat] order
          },
          properties: {
            description: description, // Adding description to properties
            hectares: hectares, // Adding hectares to properties
            //status: status, // Adding status to properties
          },
        };

        geojsonFeatures.push(feature);
      }
    });

    // Add GeoJSON source and circle layer
    map.addSource("points", {
      type: "geojson",
      data: {
        type: "FeatureCollection",
        features: geojsonFeatures,
      },
    });

    // Defining Circles
    map.addLayer({
      id: "circles",
      type: "circle",
      source: "points",
      paint: {
        "circle-color": [
          "interpolate",
          ["linear"],
          ["get", "hectares"],
          0, "purple",       // 0 hectares is purple
          500, "yellow",    // up to 500 hectares is yellow
          1000, "orange",   // up to 1000 hectares is orange
          10000, "red"       // over 1000 and up to 10000 hectares is red
        ],
        "circle-radius": [
          "interpolate",
          ["linear"],
          ["get", "hectares"],
          0, 6,        // Minimum hectares to minimum radius
          10000, 20     // Maximum hectares to maximum radius
        ],
        "circle-opacity": 0.8, 
      },
    });

    // Create a popup
    const popup = new maplibregl.Popup({
      closeButton: false,
      closeOnClick: false
    });

    map.on('mouseenter', 'circles', (e) => {
      map.getCanvas().style.cursor = 'pointer';

      const coordinates = e.features[0].geometry.coordinates.slice();
      const description = e.features[0].properties.description;

  
      while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
        coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
      }
console.log (e.features)

// Populate the popup with styled HTML content
popup.setLngLat(coordinates).setHTML(`
  <div style=
  "border: 1px red solid; 
  border-radius: 5px;
  padding: 20px;
  background-color: white; 
    font-size: 1rem;
    font-family: Libre Franklin, Helvetica, Arial, sans-serif;
    font-weight: 400;
    line-height: 1.4;">
    <p style="margin: 0; font-weight: bold;">Fire Status</p>
    <p style="margin: 0;">${description}</p>
  </div>
`).addTo(map);
});

    map.on('mouseleave', 'circles', () => {
      map.getCanvas().style.cursor = '';
      popup.remove();
    });
  }

  // Call the function to parse CSV and add circles to the map
  await parseCSVAndAddToMap();
});
