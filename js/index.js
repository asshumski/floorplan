/* global L */
;(function (window) {
    var $employeeList = $('#sidebar .employee-list'),
        $roomsList = $('#rooms .rooms-list'),
        $search = $('#search');

    function init(mapid) {
        var minZoom = 1,
            maxZoom = 6,
            img = [
                window.mapSize.width,  // original width of image './map.png'
                window.mapSize.height   // original height of image './map.png'
            ],
            // create the map
            map = L.map(mapid, {
                minZoom: minZoom,
                maxZoom: maxZoom,
                zoomControl: false
            }),
            // assign map and image dimensions
            rc = new L.RasterCoords(map, img),
            bounds = L.latLngBounds(rc.unproject([0, 0]), rc.unproject(img));

        // set the view on a marker ...
        map.setView(rc.unproject([img[0]/2, img[1]/2]), 2);

        // add layer control object
        L.control.layers({}, {
            'Rooms': layerRooms(map, rc),
            'Printers': layerPrinters(map, rc, img),
            'Stuff': layerStaff(map, rc)
        }).setPosition('topleft').addTo(map);

        L.control.zoom({

        }).setPosition('bottomleft').addTo(map);

        // the tile layer containing the image generated with gdal2tiles --leaflet ...
        L.tileLayer('./tiles/{z}/{x}/{y}.png', {
            noWrap: true,
            bounds: bounds,
            attribution: 'Current map was made by <a href="https://www.linkedin.com/in/andrei-shumski-600265113/" target="_blank" title="LinkedIn Profile">Andrei Shumski</a>'
        }).addTo(map);

        sortSidebars();

        /**
         * Filter Staff list in sidebar
         */
        $search.on("input", function() {
            var value = $(this).val().toLowerCase();

            $("#sidebar .employee-card").filter(function() {
                $(this).toggle($(this).text().toLowerCase().indexOf(value) > -1)
            });
        });
    }

    /**
     * Layer with Printers
     */
    function layerPrinters(map, rc, img) {
        var imgDir = 'images/',
            printerMarker = L.icon({
                iconUrl: imgDir + 'printer.svg',
                iconRetinaUrl: imgDir + 'printer.svg',
                iconSize: [35, 35],
                iconAnchor: [12, 35],
                popupAnchor: [-0, -35],
                shadowUrl: imgDir + 'marker-shadow.png',
                shadowSize: [41, 35],
                shadowAnchor: [14, 35]
            }),
            layerPrinters = L.geoJson(window.geoJson.printers, {
                // correctly map the geojson coordinates on the image
                coordsToLatLng: function (coords) {
                    return rc.unproject(coords)
                },
                // add a popup content to the marker
                onEachFeature: function (feature, layer) {
                    if (feature.properties && feature.properties.name) {
                        layer.bindPopup('<div class="tooltip-card"><div class="employee-name">' + feature.properties.name + '</div><div class="employee-title">' + feature.properties.address + '</div></div>')
                    }
                },
                pointToLayer: function (feature, latlng) {
                    return L.marker(latlng, {
                        icon: printerMarker
                    })
                }
            });
        map.addLayer(layerPrinters);
        return layerPrinters;
    }

    /**
     * Layer with Rooms
     */
    function layerRooms(map, rc) {
        var imgDir = 'images/',
            roomMarker,
            layerRooms = L.geoJson(window.geoJson.rooms, {
            // correctly map the geojson coordinates on the image
            coordsToLatLng: function (coords) {
                return rc.unproject(coords)
            },
            // add a popup content to the marker
            onEachFeature: function (feature, layer) {
                if (feature.properties && feature.properties.name) {
                    layer.bindPopup('<div class="tooltip-card"><div class="employee-name">' + feature.properties.name + '</div><div class="employee-title">' + feature.properties.type + '</div></div>')
                }

                addToRoomsSidebar(map, rc, feature, layer);
            },
            pointToLayer: function (feature, latlng) {
                var markerImg;

                switch (feature.properties.type) {
                    case 'kitchen':
                        markerImg = imgDir + 'kitchen.svg';
                        break;
                    case 'meeting':
                        markerImg = imgDir + 'meeting-room.svg';
                        break;
                    case 'rest':
                        markerImg = imgDir + 'rest-room.svg';
                        break;
                    default:
                        markerImg = imgDir + 'meeting-room.svg';
                }

                roomMarker = L.icon({
                    iconUrl: markerImg,
                    iconRetinaUrl: markerImg,
                    iconSize: [38, 38],
                    iconAnchor: [19, 38],
                    popupAnchor: [-0, -38]
                });

                return L.marker(latlng, {
                    icon: roomMarker
                })
            }
        });

        map.addLayer(layerRooms);

        return layerRooms;
    }

    /**
     * Layer with Staff
     */
    function layerStaff(map, rc) {
        var imgDir = 'images/',
            staffMarker = L.icon({
                iconUrl: imgDir + 'marker-icon-blue.png',
                iconRetinaUrl: imgDir + 'marker-icon-blue-2x.png',
                iconSize: [25, 35],
                iconAnchor: [12, 35],
                popupAnchor: [-0, -35],
                shadowUrl: imgDir + 'marker-shadow.png',
                shadowSize: [41, 35],
                shadowAnchor: [14, 35]
            }),
            layerStaff = L.geoJson(window.geoJson.staff, {
                // correctly map the geojson coordinates on the image
                coordsToLatLng: function (coords) {
                    return rc.unproject(coords)
                },
                // add a popup content to the marker
                onEachFeature: function (feature, layer) {
                    if (feature.properties && feature.properties.name) {
                        layer.bindPopup(feature.properties.name)
                    }

                    addToStaffSidebar(map, rc, feature, layer);

                var featureId = $.inArray(feature, window.geoInfo),
                    $employeeCard = $('<div class="employee-card" data-id="' + featureId + '"></div>'),
                    $employeeMainInfo = $('<div class="employee-info"></div>');

                    if (feature.properties.photo && feature.properties.name) {
                        $employeeCard.append('<div class="employee-photo"><img src="' + feature.properties.photo + '" alt="' + feature.properties.name + '"></div>');
                    }

                    if (feature.properties.name) {
                        $employeeMainInfo.append('<div class="employee-name">' + feature.properties.name + '</div>');
                    }

                    if (feature.properties.jobTitle) {
                        $employeeMainInfo.append('<div class="employee-title">' + feature.properties.jobTitle + '</div>');
                    }

                    if (feature.properties.email) {
                        $employeeMainInfo.append('<div class="employee-email"><span>email: </span><a href="mailto:' + feature.properties.email + '">' + feature.properties.email + '</a></div>');
                    }

                    if (feature.properties.phone) {
                        $employeeMainInfo.append('<div class="employee-phone"><span>tel: </span><a href="tel:' + feature.properties.phone + '">' + feature.properties.phone + '</a></div>');
                    }

                    $employeeCard.append($employeeMainInfo);

                    layer.bindPopup($('<div/>').append($employeeCard.clone(true)).html(), {maxWidth : 800});
                },
                pointToLayer: function (feature, latlng) {
                    return L.marker(latlng, {
                        icon: staffMarker
                    })
                }
            });

        map.addLayer(layerStaff);

        return layerStaff;
    }

    /**
     * Adding Rooms to Sidebar
     */
    function addToRoomsSidebar (map, rc, feature, layer) {
        var $roomLabel = $('<div class="room-card"></div>'),
            $roomInfo = $('<div class="room-info"></div>');

        if (feature.properties) {
            if (feature.properties.name) {
                $roomLabel.attr('data-name', feature.properties.name);
                $roomInfo.append('<div class="room-name">' + feature.properties.name + '</div>');
            }

            $roomLabel.append($roomInfo);
        }

        $roomLabel.on('click', function (e) {
            map.setView(rc.unproject(feature.geometry.coordinates), 5, {animation: true});
            layer.openPopup();
        });

        $roomsList.append($roomLabel);
    }

    /**
     * Adding Staff to Sidebar
     */
    function addToStaffSidebar (map, rc, feature, layer) {
        var $employeeLabel = $('<div class="employee-card"></div>'),
            $employeeMainInfo = $('<div class="employee-info"></div>');

        if (feature.properties) {
            if (feature.properties.photo) {
                $employeeLabel.append('<div class="employee-photo"><img src="' + feature.properties.photo + '" alt="Employee Photo"></div>');
            }

            if (feature.properties.name) {
                $employeeLabel.attr('data-name', feature.properties.name);
                $employeeMainInfo.append('<div class="employee-name">' + feature.properties.name + '</div>');
            }

            if (feature.properties.jobTitle) {
                $employeeMainInfo.append('<div class="employee-title">' + feature.properties.jobTitle + '</div>');
            }

            $employeeLabel.append($employeeMainInfo);
        }

        $employeeLabel.on('click', function (e) {
            map.setView(rc.unproject(feature.geometry.coordinates), 5, {animation: true});
            layer.openPopup();
        });

        $employeeList.append($employeeLabel);
    }

    /**
     * Sorting Sidebars
     */
    function sortSidebars () {
        var sidebarCardsList = $('[class*="-list"]');

        sidebarCardsList.each(function () {
            var sidebarCards = $(this).children('[class*="-card"]');

            sidebarCards.sort(function(a, b){
                return $(a).attr('data-name').localeCompare($(b).attr('data-name'));
            });

            sidebarCards.appendTo($(this));
        })
    }

    /**
     * Getting Data and init map
     */
    /**
     * Getting Data and init map
     */
    $.when(
        $.getJSON('./employee_list.json'),
        $.getJSON('./map-size.php', {
            file_path: './map.png'
        })
    ).then(function (employeeList, imageSize) {
        window.geoJson = employeeList[0];
        window.mapSize = {
            width: 14920,
            height: 5747
        };

        init('map');
    });
}(window));
