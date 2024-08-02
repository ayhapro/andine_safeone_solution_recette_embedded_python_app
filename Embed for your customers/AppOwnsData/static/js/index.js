$(function () {
    var reportContainer = $("#report-container");
    var models = window["powerbi-client"].models;

    $.ajax({
        type: "GET",
        url: "/getembedinfo",
        dataType: "json",
        success: function (data) {
            embedData = $.parseJSON(JSON.stringify(data));
            var tokenExpiry = embedData.tokenExpiry;
            var reports = embedData.reportConfig;

            // Store references to the embedded reports
            var embeddedReports = [];

            // Loop through each report and create an iframe for it
            reports.forEach(function (reportConfig, index) {
                var reportLoadConfig = {
                    type: "report",
                    tokenType: models.TokenType.Embed,
                    accessToken: embedData.accessToken,
                    embedUrl: reportConfig.embedUrl,
                    id: reportConfig.id,
                    name: reportConfig.name
                };

                // Create a div to host the report
                var reportDiv = $("<div>").addClass("report-div").attr("id", "report-" + index);
                reportContainer.append(reportDiv);

                // Initialize iframe for embedding report
                powerbi.bootstrap(reportDiv.get(0), { type: "report" });

                // Embed Power BI report when Access token and Embed URL are available
                var report = powerbi.embed(reportDiv.get(0), reportLoadConfig);

                // Store the reference to the report
                embeddedReports.push(report);

                // Triggers when a report schema is successfully loaded
                report.on("loaded", function () {
                    console.log("Report load successful for report " + reportConfig.name);
                });

                // Triggers when a report is successfully embedded in UI
                report.on("rendered", function () {
                    console.log("Report render successful for report " + reportConfig.name);
                });

                // Clear any other error handler event
                report.off("error");

                // Below patch of code is for handling errors that occur during embedding
                report.on("error", function (event) {
                    var errorMsg = event.detail;
                    console.error(errorMsg);
                    return;
                });

                // Retrieve and display slicers after the report is rendered
                report.on("rendered", function () {
                    displaySlicers(report);
                });

                report.on("dataSelected", function (event) {
                    var data = event.detail;
                    // console.log("Data selected: ", event.detail);
                    // var selectedValues = extractValuesFromDataPoints(data.dataPoints);
                    var selectedValue = data.dataPoints[0].identity[0];
                    // console.log("selectedValue", selectedValue)
                    applyFilterToAllReports(selectedValue, embeddedReports);
                });
            });
        },
        error: function (err) {
            // Show error container
            var errorContainer = $(".error-container");
            $(".embed-container").hide();
            errorContainer.show();

            // Format error message
            var errMessageHtml = "<strong> Error Details: </strong> <br/>" + $.parseJSON(err.responseText)["errorMsg"];
            errMessageHtml = errMessageHtml.split("\n").join("<br/>");

            // Show error message on UI
            errorContainer.html(errMessageHtml);
        }
    });

    // function extractValuesFromDataPoints(dataPoints) {
    //     var values = [];
    //     dataPoints.forEach(function (dataPoint) {
    //         if (dataPoint.identity && dataPoint.identity.length > 0) {
    //             dataPoint.identity.forEach(function (identity) {
    //                 if (identity.target.table === 'dwh_d_liste_sites' && identity.target.column === 'SITE') {
    //                     values.push(identity.value);
    //                 }
    //             });
    //         }
    //     });
    //     return values;
    // }

    function applyFilterToAllReports(values, embeddedReports) {
        // Define a dictionary to map specific values to new values for NOM_SITE
        var nomSiteMappings = {
            "AMIENS (80)": ["Amiens"],
            "MARIGNANE 1 (13)": ["Marignane"],
            "MARIGNANE 2 (13)": ["Marignane"]
        };
    
        // Define a reverse dictionary to map NOM_SITE back to SITE
        var siteMappings = {
            "Amiens": ["AMIENS (80)"],
            "Marignane": ["MARIGNANE 2 (13)"]
        };
    
        var new_values = [];
        var filterTarget = {};

        // console.log("values", values)
    
        // Determine the filter target and new values based on the current value being updated
        if (values.equals === null) {
            // Handle unselection case (null value)
            new_values = [];
            if (values.target.column === "SITE") {
                filterTarget = {
                    table: "dwh_d_liste_sites",
                    column: "SITE"
                };
            } else if (values.target.column === "NOM_SITE") {
                filterTarget = {
                    table: "dwh_d_site",
                    column: "NOM_SITE"
                };
            }
        } else if (values.target.column === "SITE" && values.target.table === "dwh_d_liste_sites") {
            new_values = nomSiteMappings[values.equals] || [];
            filterTarget = {
                table: "dwh_d_site",
                column: "NOM_SITE"
            };
        } else if (values.target.column === "NOM_SITE" && values.target.table === "dwh_d_site") {
            new_values = siteMappings[values.equals] || [];
            filterTarget = {
                table: "dwh_d_liste_sites",
                column: "SITE"
            };
        }
    
        console.log("new_values", new_values); 
    
        // Construct the filter object
        var filter = {
            $schema: "http://powerbi.com/product/schema#basic",
            target: filterTarget,
            operator: "In",
            values: new_values
        };
    
        // Apply the filter to all embedded reports
        embeddedReports.forEach(function (report) {
            report.getPages()
                .then(function (pages) {
                    pages.forEach(function (page) {
                        page.getVisuals()
                            .then(function (visuals) {
                                visuals.forEach(function (visual) {
                                    if (visual.type === 'slicer') {
                                        // Set the slicer state which contains the slicer filters
                                        visual.setSlicerState({ filters: [filter] })
                                            .then(function () {
                                                console.log("Filter applied successfully to slicer.");
                                            })
                                            .catch(function (errors) {
                                                console.error("Error applying filter to slicer: ", errors);
                                            });
                                    }
                                });
                            })
                            .catch(function (errors) {
                                console.error("Error retrieving visuals: ", errors);
                            });
                    });
                })
                .catch(function (errors) {
                    console.error("Error retrieving pages: ", errors);
                });
        });
    }
    
    
    

    function displaySlicers(report) {
        report.getPages()
            .then(function (pages) {
                pages.forEach(function (page) {
                    page.getVisuals()
                        .then(function (visuals) {
                            visuals.forEach(function (visual) {
                                if (visual.type === 'slicer') {
                                    visual.getSlicerState()
                                        .then(function (slicerState) {
                                            // Filter by specific table and column
                                            if (slicerState.targets.some(target => target.table === 'dwh_d_liste_sites' && target.column === 'SITE')) {
                                                displaySlicerState(slicerState);
                                            }
                                        })
                                        .catch(function (errors) {
                                            console.error("Error retrieving slicer state: ", errors);
                                        });
                                }
                            });
                        })
                        .catch(function (errors) {
                            console.error("Error retrieving visuals: ", errors);
                        });
                });
            })
            .catch(function (errors) {
                console.error("Error retrieving pages: ", errors);
            });
    }

    function displaySlicerState(slicerState) {
        // Clear previous slicers display
        $("#filter-list").empty();

        // Display slicer state
        var slicerDisplay = $("<div>").text(JSON.stringify(slicerState, null, 2)); // Format slicer for display
        $("#filter-list").append(slicerDisplay);
    }
});
