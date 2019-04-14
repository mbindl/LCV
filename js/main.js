require([
        "esri/Map",
        "esri/views/MapView",
        "esri/layers/FeatureLayer",
        "esri/toolbars/edit",
    
        "dojo/domReady!"
        ], 
    function(
        Map, 
        MapView, 
        FeatureLayer,
        Edit
        ) {

      const polylineLayer = new FeatureLayer({
        url: "https://servicesdev1.arcgis.com/5uh3wwYLNzBuU0Eu/arcgis/rest/services/DevSummitTestLayers/FeatureServer/1",
        outFields: ["*"],
        popupEnabled: false,
        id: "polylineLayer"
      });

      const polygonLayer = new FeatureLayer({
        url: "https://servicesdev1.arcgis.com/5uh3wwYLNzBuU0Eu/arcgis/rest/services/DevSummitTestLayers/FeatureServer/2",
        outFields: ["*"],
        popupEnabled: false,
        id: "polygonLayer"
      });

      // Create the map; add only FeatureLayer
      const map = new Map({
        basemap: "gray-vector",
        layers: [gLayer]
      });

      const view = new MapView({
        container: "viewDiv",
        map: map,
        zoom: 12,
        center: [-71.016264, 42.370486]
      });

      view.when(function(evt) {

        view.ui.add("sketch-container", "top-right");

        // Associated FeatureLayers
        const featureLayers = [polylineLayer, polygonLayer];

        // Add features from each layer to our GraphicsLayer.
        // Sketch widget requires graphics to be on an associated GraphicsLayer
        // to qualify for updating (and deletion).
        featureLayers.forEach(function(layer) {
          addGraphicsToGraphicsLayer(layer);
        });

        const sketch = new Sketch({
          layer: gLayer,
          view: view
        }, "sketch-container");

        // After creating, updating or deleting a graphic, we need
        // to update the associated FeatureLayer
        sketch.on("create", function(event) {
          if (event.state === "complete") {
            updateFeatureLayer(event.tool, { addFeatures: [event.graphic] });
          }
        });

        sketch.on("update", function(event) {
          if (event.state === "complete") {
            const graphics = event.graphics;

            // Handle case when updating multiple features simultaneously.
            // These features can come from different FeatureLayers.
            graphics.forEach(function(graphic) {
              updateFeatureLayer(graphic.geometry.type, { updateFeatures: [graphic] })
            });
          }
        });

        sketch.on("delete", function(event) {
          const graphics = event.graphics;

          // Handle case when deleting multiple features simultaneously.
          // These features can come from different FeatureLayers.
          graphics.forEach(function(graphic) {
            updateFeatureLayer(graphic.geometry.type, { deleteFeatures: [graphic] })
          });
        });
      });

      // Identify the appropriate FeatureLayer to update
      // based on the Sketch tool used to create the graphic.
      // Circle and Rectangle tools are grouped together with Polygon
      function updateFeatureLayer(tool, edits) {
        if (tool === "point") {
          applyEditsToLayer(pointLayer, edits);
        }
        else if (tool === "polyline") {
          applyEditsToLayer(polylineLayer, edits);
        }
        else {
          applyEditsToLayer(polygonLayer, edits);
        }
      }

      // Update the given layer with provided edits
      function applyEditsToLayer(layer, edits) {
        layer.applyEdits(edits);
      }

      function addGraphicsToGraphicsLayer(layer) {
        const query = layer.createQuery();

        // Query the associated layer for Features to add to the GraphicsLayer
        // We also want to update the features to use default symbology
        // ... from the layer's renderer
        layer.queryFeatures(query).then(function(response) {
          response.features.forEach(function(feature) {
            feature.symbol = layer.renderer.symbol;
          });

          gLayer.addMany(response.features);
        });
      }

    });
