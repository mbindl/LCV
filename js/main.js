    // Declare required widgets
    require([ 
        "esri/Map",
        "esri/views/MapView",
        "esri/Viewpoint",
        "esri/layers/FeatureLayer",
        "esri/widgets/Expand",
        "esri/widgets/BasemapGallery",
        "esri/widgets/BasemapToggle",
        "esri/widgets/Search",
        "esri/widgets/Editor",
        "esri/layers/TileLayer",
        "esri/widgets/LayerList",
        "esri/widgets/LayerList/LayerListViewModel",
        "esri/widgets/Home",
        "esri/widgets/Legend",
        "esri/WebMap",
        "esri/widgets/Print",
        "esri/widgets/AreaMeasurement2D",
        "esri/widgets/DistanceMeasurement2D",
        "esri/geometry/geometryEngine",
        "esri/widgets/ScaleBar",
        "esri/core/watchUtils",
        "dojo/domReady!"
        ], 
    // Function to Call widgets     
    function(Map, MapView, Viewpoint, FeatureLayer, Expand, BasemapGallery, BasemapToggle, Search, Editor, TileLayer, LayerList, LayerListVM, Home, Legend, WebMap, Print, AreaMeasurement2D, DistanceMeasurement2D, geometryEngine, ScaleBar, watchUtils) {

            // Create Map
            var map = new Map({
                basemap: "topo-vector"
            });
            
            // Create Map View and add it to the viewDiv container
            var view = new MapView({
                container: "viewDiv",
                map: map,
                center: [-120.01,38.925],
                zoom: 13,
                popup: {
                    actionsMenuEnabled: false
                    }
            });

            // Add this action to the popup so it is always available in this view
            var measureThisAction = {
              title: "Measure Area",
              id: "measure-this",
              // Sets the icon font used to style the action button
              className: "esri-icon-polygon"
              // image: "/assets/measure_area.png"
            };
            
            // Land Capability Popup template
            var popupLCV = {
              // autocasts as new PopupTemplate()
              title: "LCV Information",
              content: "Land Capability: {LCV_IPES}",
              actions: [measureThisAction]
            };
            
            // create a number with commas
            function numberWithCommas(x) {
                var parts = x.toString().split(".");
                parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
                return parts.join(".");
            }
            
            // Execute each time the "Measure Area" is clicked
            function measureThis() {
              var geom = view.popup.selectedFeature.geometry;
              var area = geometryEngine.geodesicArea(geom, "square-feet");
              area = numberWithCommas(parseFloat(Math.round(area * 100) / 100).toFixed(2));
              view.popup.content =
                "Land Capability: " + view.popup.selectedFeature.attributes.LCV_IPES +
                "<div style='background-color:black;color:white'>" +
                area +
                " sq. ft.</div>";
            }

            // Event handler that fires each time an action is clicked.
            view.popup.on("trigger-action", function(event) {
              // Execute the measureThis() function if the measure-this action is clicked
              if (event.action.id === "measure-this") {
                measureThis();
              }
            });
            
            // hides zoomTo action from popup
            view.popup.viewModel.actions.getItemAt(0).visible = false;
            
            // Define a popup for Parcels
            var popupParcels = {
                title: "Parcel Information",
                content: [
                        {
                        type: "fields",
                        fieldInfos: [
                            {
                              fieldName: "APN", // The field whose values you want to format
                              label: "APN: "
                            },
                            {
                              fieldName: "JURISDICTION", // The field whose values you want to format
                              label: "Jurisdiction: ",
                            },
                            {
                              fieldName: "APO_ADDRESS", // The field whose values you want to format
                              label: "Address: ",
                            },
                            {
                              fieldName: "OWNERSHIP_TYPE", // The field whose values you want to format
                              label: "Ownership Type: ",
                            },
                            {
                              fieldName: "TRPA_LANDUSE_DESCRIPTION", // The field whose values you want to format
                              label: "Land Use: ",
                            },
                            {
                              fieldName: "PARCEL_SQFT", // The field whose values you want to format
                              label: "Area (sq.ft.): ", 
                              format: {
                                digitSeparator: true, // Uses a comma separator in numbers >999
                                places: 0 // Sets the number of decimal places to 0 and rounds up
                                }
                            },  
                            {
                              fieldName: "COVERAGE_ALLOWED", // The field whose values you want to format
                              label: "Coverage Allowed (sq.ft.): ", 
                              format: {
                                digitSeparator: true, // Uses a comma separator in numbers >999
                                places: 0 // Sets the number of decimal places to 0 and rounds up
                                }
                            }
                            ]
                        }
                    ]
                };
            
            // Create Layers
            var parcels = new FeatureLayer({
                url: "https://maps.trpa.org/server/rest/services/LandCapability_BaseMap/MapServer/0",
                outFields: ["*"],
                popupTemplate: popupParcels
            });
            
            var impervious = new FeatureLayer({
                url: "https://maps.trpa.org/server/rest/services/LandCapability_BaseMap/MapServer/1",
                outFields: ["*"],
                visible: false
            });
            
            var contour = new FeatureLayer({
                url: "https://maps.trpa.org/server/rest/services/LandCapability_BaseMap/MapServer/2",
                outFields: ["*"],
                visible: false
            });
            
            var water = new FeatureLayer({
                url: "https://maps.trpa.org/server/rest/services/LandCapability_BaseMap/MapServer/4",
                outFields: ["*"],
                visible: false
            });
            
            var nrcsLandCap = new FeatureLayer({
                url: "https://maps.trpa.org/server/rest/services/LandCapability_BaseMap/MapServer/7",
                outFields: ["*"],
                visible: false
            });
            
            var nrcsSoils = new FeatureLayer({
                url: "https://maps.trpa.org/server/rest/services/LandCapability_BaseMap/MapServer/8",
                outFields: ["*"],
                visible: false
            });
                        
            // Create Slope Tile Layer
            var slopeLayer = new TileLayer({
                url: "https://maps.trpa.org/server/rest/services/SlopeClasses_cached/MapServer",
                opacity: 0.75,
                visible: false
            });
            
            // Create Hillsahde Tile Layer
            var hillshadeLayer = new TileLayer({
                url: "https://maps.trpa.org/server/rest/services/Tahoe_Hillshade_cached/MapServer",
                opacity: 0.75,
                visible: false
            });
            
            // Construct LCV Feature Layer
            var lcvLayer = new FeatureLayer({
                url: "https://maps.trpa.org/server/rest/services/LandCapability_editable/FeatureServer/0",
                outFields: ["*"],
                opacity: 0.75,
                popupTemplate: popupLCV
            });
            
            // Construct Set Back Feature Layer
            var setbackLayer = new FeatureLayer({
                url: "https://maps.trpa.org/server/rest/services/LandCapability_editable/FeatureServer/1",
                outFields: ["*"],
                popupEnabled: false,
                visible: false
            });
            
            // Construct Backshore Layer 
            var backshoreLayer = new FeatureLayer({
                url: "https://maps.trpa.org/server/rest/services/LandCapability_editable/FeatureServer/2",
                outFields: ["*"],
                popupEnabled: false,
                visible: false
            });
                        
            // Add the layer
            map.add(lcvLayer,0)
            
            // Add the layer
            map.add(setbackLayer,1)
            
            // Add the layer
            map.add(backshoreLayer,2)
            
            // Add the layer
            map.add(slopeLayer);
            
            // Add the layer
            map.add(hillshadeLayer);

            // Add the layer
            map.add(parcels,0);
            
            // Add the layer
            map.add(impervious,1);
            
            // Add the layer
            map.add(contour,2);
            
            // Add the layer
            map.add(water,3);
            
            // Add the layer
            map.add(nrcsLandCap,7);
            
            // Add the layer
            map.add(nrcsSoils,8);
            
            
            // Create Editor widget
            var editor = new Editor({
                container: document.createElement("div"),
                view: view
            });
            
            // Create expand button for editor widget
            var editorExpand = new Expand({
                expandIconClass: "esri-icon-sketch-rectangle",  // see https://developers.arcgis.com/javascript/latest/guide/esri-icon-font/
                expandTooltip: "Editor",
                view: view,
                autoCollapse: true,
                content: editor.domNode
            });
            
            // Add editor widget to view
            view.ui.add(editorExpand, "top-right");
            
            // Creaete Table of Contents
            var layerList = new LayerList({
                container: document.createElement("div"),
                view: view, 
                listItemCreatedFunction : function (event) {

                // The event object contains properties of the
                // layer in the LayerList widget
                var item = event.item;

                if (item.title === "SlopeClasses cached") {
                    // open the list item in the LayerList
                    item.open = false;
                    // change the title to something more descriptive
                    item.title = "Slope";
                    }
                if (item.title === "Tahoe Hillshade cached") {
                    // open the list item in the LayerList
                    item.open = false;
                    // change the title to something more descriptive
                    item.title = "Hillshade";
                    }
                if (item.title === "LandCapability BaseMap - Soils - NRCS 2003") {
                    // open the list item in the LayerList
                    item.open = false;
                    // change the title to something more descriptive
                    item.title = "Soils - NRCS 2003";
                    }
                if (item.title === "LandCapability BaseMap - Land Capability NRCS 2007") {
                    // open the list item in the LayerList
                    item.open = false;
                    // change the title to something more descriptive
                    item.title = "Land Capability - NRCS 2007";
                    }
                if (item.title === "LandCapability editable - Backshore Boundary") {
                    // open the list item in the LayerList
                    item.open = false;
                    // change the title to something more descriptive
                    item.title = "Backshore Boundary - Editable";
                    }
                if (item.title === "LandCapability editable - Setback") {
                    // open the list item in the LayerList
                    item.open = false;
                    // change the title to something more descriptive
                    item.title = "Setback - Editable";
                    }
                if (item.title === "LandCapability editable - Verified Land Capability") {
                    // open the list item in the LayerList
                    item.open = false;
                    // change the title to something more descriptive
                    item.title = "Verified Land Capability - Editable";
                    }
                if (item.title === "LandCapability BaseMap - Stream Environment Zone (LiDAR derived)") {
                    // open the list item in the LayerList
                    item.open = true;
                    // change the title to something more descriptive
                    item.title = "Stream Environment Zone";
                    }
                if (item.title === "LandCapability BaseMap - 6,229ft - High Water Line") {
                    // open the list item in the LayerList
                    item.open = false;
                    // change the title to something more descriptive
                    item.title = "6,229ft - High Water Line";
                    }
                if (item.title === "LandCapability BaseMap - Impervious Surface - 2010 LiDAR") {
                    // open the list item in the LayerList
                    item.open = false;
                    // change the title to something more descriptive
                    item.title = "Impervious Surface - LiDAR 2010";
                    }
                if (item.title === "LandCapability BaseMap - Parcels") {
                    // open the list item in the LayerList
                    item.open = false;
                    // change the title to something more descriptive
                    item.title = "Parcels";
                    }
                },
                // set layers in layer list
                layers: [
                    {  
                    layer: lcvLayer,
                    title: "Verified Land Capability",  
                    },  
                    {  
                    layer: setbackLayer,  
                    title: "Setback",  
                    },  
                    {  
                    layer: backshoreLayer,  
                    title:"Backshore Boundary", 
                    },  
                    {  
                    layer: parcels,  
                    title:"Parcels"  
                    },
                    {  
                    layer: impervious,  
                    title:"Impervious Surface"  
                    },
                    {  
                    layer: contour,  
                    title:"Water"  
                    },
                    {  
                    layer: water,  
                    title:"Water"  
                    },
                    {  
                    layer: nrcsLandCap,  
                    title:"NRCS Land Capability 2007"  
                    },
                    {  
                    layer: nrcsSoils,  
                    title:"NRCS Soils 2003"  
                    },
                    {  
                    layer: slopeLayer,  
                    title:"Slope"  
                    },
                    {  
                    layer: hillshadeLayer,  
                    title:"Hillshade"  
                    }] 
            });
            
            // Create collapasable button for Table of Contents
            var layerListExpand = new Expand({
                expandIconClass: "esri-icon-layer-list",  // see https://developers.arcgis.com/javascript/latest/guide/esri-icon-font/
                expandTooltip: "Layer List",
                view: view,
                autoCollapse: true,
                content: layerList.domNode
                });
            
            // add layer list button to the top right corner of the view
            view.ui.add(layerListExpand, "top-right");
            
            // function to create print service
            view.when(function() {
                var print = new Print({
                    container: document.createElement("div"),
                    view: view,
                    // specify print service url
                    printServiceUrl:"https://utility.arcgisonline.com/arcgis/rest/services/Utilities/PrintingTools/GPServer/Export%20Web%20Map%20Task"
            });
                // Standard AGOL Print Service            //"https://utility.arcgisonline.com/arcgis/rest/services/Utilities/PrintingTools/GPServer/Export%20Web%20Map%20Task"
                
                // Custom TRPA Print Service
                // "https://maps.trpa.org/server/rest/services/Utilities/PrintingTools/GPServer/Export%20Web%20Map%20Task"
            
            // Create Print Button
            var printExpand = new Expand({
                expandIconClass: "esri-icon-printer",  // see https://developers.arcgis.com/javascript/latest/guide/esri-icon-font/
                expandTooltip: "Print",
                view: view,
                autoCollapse: true,
                content: print.domNode
                });

            // Add print widget to the top right corner of the view
            view.ui.add(printExpand, "top-right");
            });
            
            // Create Search Widget
            var searchWidget = new Search({
              view: view,
              allPlaceholder: "Address or APN",
              sources: [
                {
                  layer: parcels,
                  searchFields: ["APN"],
                  displayField: "APN",
                  exactMatch: false,
                  outFields: ["APN"],
                  name: "Parcel APN",
                  placeholder: "APN"
                }
              ]
            });
            
            // Add the search widget to the top left corner of the view
            view.ui.add(searchWidget, {
                position: "top-left"
            });
            
            // move zoom buttons to top left
            view.ui.move("zoom", "top-left");
                
            // Createa Home Button
            var homeWidget = new Home({
                view: view
            });
            
            // adds the home widget to the top left corner of the MapView
            view.ui.add(homeWidget, "top-left");
                        
            // Create Legend Widget
            var legend = new Legend({
                container: document.createElement("div"),
                view: view,
                layerInfos: [
                    {  
                    layer: lcvLayer,
                    title: "Verified Land Capability",  
                    },  
                    {  
                    layer: setbackLayer,  
                    title: "Setback",  
                    },  
                    {  
                    layer: backshoreLayer,  
                    title: "Backshore Boundary"  
                    },  
                    {  
                    layer: parcels,  
                    title: "Parcels"  
                    },  
                    {  
                    layer: impervious,  
                    title: "Impervious Surface"  
                    },
                    {  
                    layer: contour,  
                    title: "High Water Line - 6,229ft"  
                    },
                    {  
                    layer: nrcsLandCap,  
                    title: "Land Capability - NRCS 2007"  
                    },
                    {  
                    layer: nrcsSoils,  
                    title: "Soils - NRCS 2003"  
                    },
                    {  
                    layer: water,  
                    title: "Stream Environment Zone"  
                    },
                    {  
                    layer: slopeLayer,  
                    title: "Slope"  
                    }
                ]
            });
            
            // Create Legend button
            var legendExpand = new Expand({
                expandIconClass: "esri-icon-layers",  // see https://developers.arcgis.com/javascript/latest/guide/esri-icon-font/
                expandTooltip: "Expand Legend",
                view: view,
                content: legend.domNode
                });
        
            // Add Legend to the bottom right corner of the view
            view.ui.add(legendExpand, "bottom-left");    
            
    //// Changed to Basemap Toggle Widget BUT may change back to Gallery Widget if users want more than two options...
//            // Create Basemap Gallery Widget
//            var basemapGallery = new BasemapGallery({
//                container: document.createElement("div"),
//                view: view
//                source: {
//                  portal: {
//                    url: "https://www.arcgis.com",
//                    useVectorBasemaps: true  // Load vector tile basemaps
//                  }
//                }
//              });
//            watchUtils.once(basemapGallery.source.basemaps,"length", function(state){
//            setTimeout(function(){
//            basemapGallery.source.basemaps.removeAt(2);
//            }, 200);
//            });

            var basemapToggle = new BasemapToggle({
                container: document.createElement("div"),
                view: view,
                nextBasemap: "hybrid"  // Allows for toggling to the "hybrid" basemap
            });
            
            // Create an Expand instance and set the content
            // property to the DOM node of the basemap gallery widget
            var bgExpand = new Expand({
                expandIconClass: "esri-icon-basemap",  // see https://developers.arcgis.com/javascript/latest/guide/esri-icon-font
                expandTooltip: "Toggle Basemap",
                view: view,
                content: basemapToggle.domNode
            });

            // Add the basemap gallery button
            view.ui.add(bgExpand, "bottom-left"); 
            
            // setup active widget var to hold measurement interaction
            var activeWidget = null;

            // add the area measurment widget
            view.ui.add("areaButton", "bottom-right");
            
            // add the distance measure widget
            view.ui.add("distanceButton", "bottom-right");
            
            // setup the actions and classes for the distance button            
            document
              .getElementById("distanceButton")
              .addEventListener("click", function() {
                setActiveWidget(null);
                if (!this.classList.contains("active")) {
                  setActiveWidget("distance");
                } else {
                  setActiveButton(null);
                }
              });
            
            // setup the actions and classes for the area button
            document
              .getElementById("areaButton")
              .addEventListener("click", function() {
                setActiveWidget(null);
                if (!this.classList.contains("active")) {
                  setActiveWidget("area");
                } else {
                  setActiveButton(null);
                }
              });
            
            // fucntion to set the active widget on click 
            function setActiveWidget(type) {
              switch (type) {
                // if measure distance is clicked
                case "distance":
                  activeWidget = new DistanceMeasurement2D({
                    viewModel: {
                        view: view,
                        mode: "geodesic",
                        unit: "feet"
                        }
                    });

                    // skip the initial 'new measurement' button
                    activeWidget.viewModel.newMeasurement();
                    
                    // add the widget window to the view on the bottom right
                    view.ui.add(activeWidget, "bottom-right");
    
                    setActiveButton(document.getElementById("distanceButton"));
                    break;
                      
                // if measure area button is clicked     
                case "area":
                  activeWidget = new AreaMeasurement2D({
                    viewModel: {
                        view: view,
                        mode: "planar",
                        unit: "square-feet"
                        }
                    });

                  // skip the initial 'new measurement' button
                  activeWidget.viewModel.newMeasurement();

                  view.ui.add(activeWidget, "bottom-right");
                  setActiveButton(document.getElementById("areaButton"));
                    break;
                      
                case null:
                  if (activeWidget) {
                    view.ui.remove(activeWidget);
                    activeWidget.destroy();
                    activeWidget = null;
                  }
                    break;
              }
            }
            
            // function to add keyboard shorcuts and highlight button when widget active
            function setActiveButton(selectedButton) {
              // focus the view to activate keyboard shortcuts for sketching
              view.focus();
              var elements = document.getElementsByClassName("active");
              for (var i = 0; i < elements.length; i++) {
                elements[i].classList.remove("active");
              }
              if (selectedButton) {
                selectedButton.classList.add("active");
              }
            }
            
            // Create Scale Bar Widget centered on the bottom using the div container scaleposition
            var scaleBar = new ScaleBar({
                view: view,
                container: "scaleposition"
            });
    });