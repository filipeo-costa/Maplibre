const map = new maplibregl.Map({
  container: "map",
  style: "./hybrid.json",
  center: [-96.817456, 54.771983],
  zoom: 3.5,
});

map.on("load", async () => {
  async function parseCSVAndAddToMap2() {
    const response = await fetch("https://api.ciffc.net//v1/dashboard/fires"); //path to api
  
    

    
const geojsonFeatures = await response.json ();
 geojsonFeatures.features.map(e=> {
  const newFeature={...e}
  newFeature.properties.field_fire_size=parseFloat(newFeature.properties.field_fire_size)
  return newFeature;
  });

    // Get the current date and calculate the date from 1 month ago
    const currentDate = new Date();
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(currentDate.getMonth() - 1);
  
    // Filter features based on the reported fire date
    geojsonFeatures.features = geojsonFeatures.features.filter(e => {
      const reportDate = new Date(e.properties.field_situation_report_date);
      return reportDate >= oneMonthAgo;
    });
  
console.log (geojsonFeatures)
    // Add GeoJSON source and circle layer
    map.addSource("points", {
      type: "geojson",
      data: {
        type: "FeatureCollection",
        features: geojsonFeatures.features,
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
          ["get", "field_fire_size"],
          0, "yellowgreen", // 0 to 50 hectares is yellowgreen
          50, "yellowgreen", 
          51, "yellow",    // 51 to 500 hectares is yellow
          500, "yellow",  
          501, "orange",   // 501 to 1000 hectares is orange
          1000, "orange",  
          1001, "red",       // 1001 to 10000 hectares is red
          10000, "red",     
          10001, "purple",  // Above 10000 hectares is purple
          100000, "purple",  
        ],
        "circle-radius": [
          "interpolate",
          ["linear"],
          ["get", "field_fire_size"],
          0, 4,         // Minimum size (0 hectares)
          50, 8,       // 50 hectares = 10 pixels radius
          500, 12,      // 500 hectares = 15 pixels radius
          1000, 16,     // 1000 hectares = 20 pixels radius
          10000, 20,    // 10000 hectares = 25 pixels radius
          10001, 24,     // Above 10000 hectares = 30 pixels radius
          100000, 28,     // Above 10000 hectares = 35 pixels radius
        ],
        "circle-opacity": 0.7, 
        "circle-stroke-color": "black", // Adds a black border to each circle
        "circle-stroke-width": 0.7 // Width of the border
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
      const field_system_fire_id = e.features[0].properties.field_system_fire_id;
      const field_situation_report_date = e.features[0].properties.field_situation_report_date;
      const field_stage_of_control_status = e.features[0].properties.field_stage_of_control_status;
      const field_response_type = e.features[0].properties.field_response_type;
      const field_fire_size = e.features[0].properties.field_fire_size;     
      const field_status_date = e.features[0].properties.field_status_date;     

      while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
        coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
      }
      
      // Format the datea for reports (mm, dd, yyyy)
      const formattedDate = new Date(field_situation_report_date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      const formattedDate2 = new Date(field_status_date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      
console.log (e.features)

// Popup windows
popup.setLngLat(coordinates).setHTML(`
 <div style="
    background-color: white; 
    font-size: 1rem;
    font-family: Libre Franklin, Helvetica, Arial, sans-serif;
    font-weight: 400;
    line-height: 1.4;
    border-radius: 5px;
    padding: 10px;">

    <p style="margin: 5px 0; font-size: 1rem;"><strong>Fire ID:</strong> ${field_system_fire_id}</p>
    <hr>
    <p style="margin: 0; font-weight: bold;">Fire Report Date</p>
    <p style="margin: 0;">${formattedDate}</p>
    <hr>
    <p style="margin: 0; font-weight: bold;">Fire Response</p>
    <p style="margin: 0;">${field_response_type === 'FUL' ? 'Full Response'
    : field_response_type === 'MOD' ? 'Modified Response'
    : field_response_type === 'MON' ? 'Monitored Response' : field_response_type}
    </p>
    <hr>
    <p style="margin: 0; font-weight: bold;">Fire Status</p>
    <p style="margin: 0;">
    ${field_stage_of_control_status === 'BH' ? 'Being Held' 
    : field_stage_of_control_status === 'OUT' ? 'Out of Control' 
    : field_stage_of_control_status === 'UC' ? 'Under Control' 
    : field_stage_of_control_status === 'OC' ? 'Out of Control' : field_stage_of_control_status}
    </p>
    <hr>
    <p style="margin: 0; font-weight: bold;">Fire Size</p>
    <p style="margin: 0;">${field_fire_size} Hectares</p>
    <hr>
    <p style="margin: 0; font-weight: bold;">Latest Fire Update</p>
    <p style="margin: 0;">${formattedDate2}</p>
    </div>
`).addTo(map);
});

    map.on('mouseleave', 'circles', () => {
      map.getCanvas().style.cursor = '';
      popup.remove();
    });
  }

    // Zoom in feature
    map.on('dblclick', 'circles', (e) => {
      const coordinates = e.features[0].geometry.coordinates.slice();
      const fireSize = e.features[0].properties.field_fire_size;
      const zoomLevel = Math.min(15, map.getZoom() + 2); 
      
      map.easeTo({
        center: coordinates,
        zoom: zoomLevel,
        duration: 1000 
      });
    });

  //Toggle colors
  let visibleColors = {
    yellowgreen: true, // 0-50 Hectares
    yellow: true, // 51-500 Hectares
    orange: true, // 501-1000 Hectares
    red: true, // 1001-10000 Hectares
    purple: true // 10000+ Hectares
  };
  
  function updateCircleVisibility() {
    const filters = ['any'];
    if (visibleColors.yellowgreen) {
      filters.push(['<=', ['get', 'field_fire_size'], 50]);
    }
    if (visibleColors.yellow) {
      filters.push(['all', ['>', ['get', 'field_fire_size'], 51], ['<=', ['get', 'field_fire_size'], 500]]);
    }
    if (visibleColors.orange) {
      filters.push(['all', ['>', ['get', 'field_fire_size'], 501], ['<=', ['get', 'field_fire_size'], 1000]]);
    }
    if (visibleColors.red) {
      filters.push(['all', ['>', ['get', 'field_fire_size'], 1001], ['<=', ['get', 'field_fire_size'], 10000]]);
    }
    if (visibleColors.purple) {
      filters.push(['>', ['get', 'field_fire_size'], 10000]);
    }

    map.setFilter('circles', filters);
  }
  
  document.getElementById('toggle-yellowgreen').addEventListener('click', () => {
    visibleColors.yellowgreen = !visibleColors.yellowgreen;
    updateCircleVisibility();
  });
  
  document.getElementById('toggle-yellow').addEventListener('click', () => {
    visibleColors.yellow = !visibleColors.yellow;
    updateCircleVisibility();
  });
  
  document.getElementById('toggle-orange').addEventListener('click', () => {
    visibleColors.orange = !visibleColors.orange;
    updateCircleVisibility();
  });
  
  document.getElementById('toggle-red').addEventListener('click', () => {
    visibleColors.red = !visibleColors.red;
    updateCircleVisibility();
  });

  document.getElementById('toggle-purple').addEventListener('click', () => {
    visibleColors.purple = !visibleColors.purple;
    updateCircleVisibility();
  });


  // Initial setup: show all colors
  updateCircleVisibility();
  
  
  // Call the function to parse CSV and add circles to the map
  await parseCSVAndAddToMap2();
});