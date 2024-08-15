const map = new maplibregl.Map({
  container: "map",
  style:
    "./hybrid.json",
  center: [-76.98174185335526, 49.05297675465482],
  zoom: 5,
});

map.on("load", async () => {
  // Add an image to use as a custom marker
  const image = await map.loadImage(
    "https://cdn-icons-png.flaticon.com/512/10760/10760660.png"
  );
  map.addImage("custom-marker", image.data);


  
  // Function to parse CSV and create GeoJSON features
  async function parseCSVAndAddToMap() {
    const response = await fetch("https://cwfis.cfs.nrcan.gc.ca/downloads/activefires/activefires.csv"); // Adjust path as needed
    const csvData = await response.text();
    
    const geojsonFeatures = [];
    const rows = csvData.trim().split("\n");

    rows.forEach((row) => {
      const columns = row.split(",");
      const latitude = parseFloat(columns[2]);
      const longitude = parseFloat(columns[3]);
      const description = columns.slice(4).join(",").trim(); // Handle description with commas

      if (!isNaN(latitude) && !isNaN(longitude)) {
        const feature = {
          type: "Feature",
          geometry: {
            type: "Point",
            coordinates: [longitude, latitude], // GeoJSON uses [lon, lat] order
          },
          properties: {
            description: description,
          },
        };

        geojsonFeatures.push(feature);
      }
    });

    
    // Add GeoJSON source and symbol layer
    map.addSource("points", {
      type: "geojson",
      data: {
        type: "FeatureCollection",
        features: geojsonFeatures,
      },
    });

    // Add a symbol layer
    map.addLayer({
      id: "symbols",
      type: "symbol",
      source: "points",
      layout: {
        "icon-image": "custom-marker",
        "icon-size": 0.05,
        'icon-overlap': 'always',
        "icon-anchor": "center",

      },
    });

    
     // Create a popup, but don't add it to the map yet.
     const popup = new maplibregl.Popup({
        closeButton: false,
        closeOnClick: false
    });

    map.on('mouseenter', 'symbols', (e) => {
        // Change the cursor style as a UI indicator.
        map.getCanvas().style.cursor = 'pointer';

        const coordinates = e.features[0].geometry.coordinates.slice();
        const description = e.features[0].properties.description;

        // Ensure that if the map is zoomed out such that multiple
        // copies of the feature are visible, the popup appears
        // over the copy being pointed to.
        while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
            coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
        }

        // Populate the popup and set its coordinates
        // based on the feature found.
        popup.setLngLat(coordinates).setHTML(description).addTo(map);
    });

    map.on('mouseleave', 'symbols', () => {
        map.getCanvas().style.cursor = '';
        popup.remove();
    });
  }

  // Call the function to parse CSV and add markers to the map
  await parseCSVAndAddToMap();
});
