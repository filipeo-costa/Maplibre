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
  
  const image2 = await map.loadImage(
    "https://static.thenounproject.com/png/5832524-200.png"
  );
  map.addImage("custom-marker2", image2.data);

  
  // Function to parse CSV and create GeoJSON features
  async function parseCSVAndAddToMap() {
    const response = await fetch("https://cwfis.cfs.nrcan.gc.ca/downloads/activefires/activefires.csv"); // Adjust path as needed
    const csvData = await response.text();
    console.log(csvData);
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

    // Create a popup container element
    const popupContainer = document.createElement("div");
    popupContainer.id = "popup-container";
    popupContainer.style.position = "absolute";
    popupContainer.style.top = "20px";
    popupContainer.style.right = "20px";
    popupContainer.style.backgroundColor = "red";
    popupContainer.style.padding = "10px";
    popupContainer.style.borderRadius = "5px";
    popupContainer.style.color = "white";
    popupContainer.style.fontFamily = "Arial, sans-serif"; // Set font to Arial
    popupContainer.style.display = "none"; // Initially hidden
    document.body.appendChild(popupContainer);

    map.on("mouseenter", "symbols", (e) => {
      // Change the cursor style as a UI indicator.
      map.getCanvas().style.cursor = "pointer";

      const description = e.features[0].properties.description;

      // Populate the popup container with the description
      popupContainer.innerHTML = description;
      popupContainer.style.display = "block";
    });

    map.on("mouseleave", "symbols", () => {
      map.getCanvas().style.cursor = "";
      popupContainer.style.display = "none";
    });
  }

  async function parseCSVAndAddToMap2() {
    const response = await fetch("stations_hydrometriques.csv"); // Adjust path as needed
    const csvData = await response.text();
    console.log(csvData);
    const geojsonFeatures = [];
    const rows = csvData.trim().split("\n");

    rows.forEach((row) => {
      const columns = row.split(",");
      const latitude = parseFloat(columns[8]);
      const longitude = parseFloat(columns[9]);
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
    map.addSource("points2", {
      type: "geojson",
      data: {
        type: "FeatureCollection",
        features: geojsonFeatures,
      },
    });

    // Add a symbol layer
    map.addLayer({
      id: "symbols2",
      type: "symbol",
      source: "points2",
      layout: {
        "icon-image": "custom-marker2",
        "icon-size": 0.2,
        'icon-overlap': 'always',
        "icon-anchor": "center",

      },
    });

    // Create a popup container element
    const popupContainer = document.createElement("div");
    popupContainer.id = "popup-container";
    popupContainer.style.position = "absolute";
    popupContainer.style.top = "20px";
    popupContainer.style.right = "20px";
    popupContainer.style.backgroundColor = "green";
    popupContainer.style.padding = "10px";
    popupContainer.style.borderRadius = "5px";
    popupContainer.style.color = "white";
    popupContainer.style.fontFamily = "Arial, sans-serif"; // Set font to Arial
    popupContainer.style.display = "none"; // Initially hidden
    document.body.appendChild(popupContainer);

    map.on("mouseenter", "symbols2", (e) => {
      // Change the cursor style as a UI indicator.
      map.getCanvas().style.cursor = "pointer";

      const description = e.features[0].properties.description;

      // Populate the popup container with the description
      popupContainer.innerHTML = description;
      popupContainer.style.display = "block";
    });

    map.on("mouseleave", "symbols2", () => {
      map.getCanvas().style.cursor = "";
      popupContainer.style.display = "none";
    });
  }


  
  // Call the function to parse CSV and add markers to the map
  await parseCSVAndAddToMap();
  await parseCSVAndAddToMap2();
});