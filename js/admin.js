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
            'Stuff': layerStaff(map, rc),
            'Edit': layerEdit(map, rc, img)
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
     * Editable layer
     */
    function layerEdit (map, rc, img) {
        // set marker at the image bound edges
        var layerBounds = L.layerGroup();

        map.addLayer(layerBounds);

        // set markers on click events in the map
        map.on('click', function (event) {
            var coord = rc.project(event.latlng),
                imgDir = 'images/',
                newMarker = L.icon({
                    iconUrl: imgDir + 'marker-icon-red-2x.png',
                    iconRetinaUrl: imgDir + 'marker-icon-red-2x.png',
                    iconSize: [25, 35],
                    iconAnchor: [12, 35],
                    popupAnchor: [-0, -35],
                    shadowUrl: imgDir + 'marker-shadow.png',
                    shadowSize: [41, 35],
                    shadowAnchor: [14, 35]
                }),
                marker = L.marker(rc.unproject(coord), {icon: newMarker, draggable:true}).addTo(layerBounds);

            marker.on('dragend', function (e) {
                coord = rc.project(e.target._latlng);
            });

            var $popupContent = $('<div class="tooltip-card"></div>'),
                $form = $('<form action="#" class="edit-form" id="edit-form" onsubmit="event.preventDefault();"></form>'),
                $layer = $('<select type="text" class="form-field" id="edditable-layer"><option value="staff" selected>Staff</option><option value="rooms">Rooms</option><option value="printers">Printers</option></select>'),
                $name = $('<input type="text" class="form-field" id="employee-name" required placeholder="Name">'),
                $roomType = $('<select type="text" class="form-field" id="room-type" style="display: none;"><option value="meeting" selected>Meeting Room</option><option value="rest">RestRoom</option><option value="kitchen">Kitchen</option></select>'),
                $printerAddress = $('<input type="text" class="form-field" id="printer-address" style="display: none;" placeholder="IP Address">'),
                $jobTitle = $('<input type="text" class="form-field" id="employee-title" required placeholder="Job Title">'),
                $email = $('<input type="email" class="form-field" id="employee-email" required placeholder="Email">'),
                $phone = $('<input type="phone" class="form-field" id="employee-phone" placeholder="+1-234-567-8910" required>'),
                $photo = $('<input type="file" class="form-field" id="employee-photo" data-image-src="' + feature.properties.photo + '" placeholder="Choose Photo">'),
                $btnSave = $('<button type="submit" class="form-field action" id="save">Save</button>'),
                $btnRemove = $('<button class="form-field action" id="remove">Remove</button>'),
                popup;

            $layer.on('change', function () {
                switch ($layer.val()) {
                    case 'staff':
                        $roomType.hide().attr('required', false);
                        $printerAddress.hide().attr('required', false);
                        $name.show().attr('required', true);
                        $jobTitle.show().attr('required', true);
                        $email.show().attr('required', true);
                        $phone.show().attr('required', true);
                        $photo.show().attr('required', false);
                        break;
                    case 'rooms':
                        $printerAddress.hide().attr('required', false);
                        $jobTitle.hide().attr('required', false);
                        $email.hide().attr('required', false);
                        $phone.hide().attr('required', false);
                        $photo.hide().attr('required', false);
                        $name.show().attr('required', true);
                        $roomType.show().attr('required', true);
                        break;
                    case 'printers':
                        $roomType.hide().attr('required', false);
                        $jobTitle.hide().attr('required', false);
                        $email.hide().attr('required', false);
                        $phone.hide().attr('required', false);
                        $photo.hide().attr('required', false);
                        $name.show().attr('required', true);
                        $printerAddress.show().attr('required', true);
                        break;
                    default:
                        break;
                }
            });

            $btnSave.on('click', function (e) {
                e.preventDefault();
                var newFeature;

                switch ($layer.val()) {
                    case 'staff':
                        if ($name.valid() && $jobTitle.valid() && $email.valid() && $phone.valid() && $photo.valid()) {
                            newFeature = {
                                type: 'Feature',
                                properties: {
                                    name: $name.val(),
                                    jobTitle: $jobTitle.val(),
                                    email: $email.val(),
                                    phone: $phone.val(),
                                    photo: $photo.attr('data-image-src')
                                },
                                geometry: {
                                    type: 'Point',
                                    coordinates: [Math.floor(coord.x), Math.floor(coord.y)]
                                }
                            };
                            pushToGeoJson();
                        }
                        break;
                    case 'rooms':
                        if ($name.valid() && $roomType.valid()) {
                            newFeature = {
                                type: 'Feature',
                                properties: {
                                    name: $name.val(),
                                    type: $roomType.val()
                                },
                                geometry: {
                                    type: 'Point',
                                    coordinates: [Math.floor(coord.x), Math.floor(coord.y)]
                                }
                            };
                            pushToGeoJson();
                        }
                        break;
                    case 'printers':
                        if ($name.valid() && $printerAddress.valid()) {
                            newFeature = {
                                type: 'Feature',
                                properties: {
                                    name: $name.val(),
                                    address: $printerAddress.val()
                                },
                                geometry: {
                                    type: 'Point',
                                    coordinates: [Math.floor(coord.x),+ Math.floor(coord.y)]
                                }
                            };
                            pushToGeoJson();
                        }
                        break;
                    default:
                        break;
                }

                function pushToGeoJson() {
                    window.geoJson[$layer.val()].push(newFeature);
                    $(document).trigger('saveMap');
                }
            });

            $btnRemove.on('click', function (e) {
                e.preventDefault();
                map.removeLayer(marker);
            });

            $photo.on('change', function () {
                var self = this,
                    file = this.files[0],
                    reader  = new FileReader();

                if (file) {
                    reader.readAsDataURL(file)
                }

                reader.onloadend = function () {
                    $(self).attr('data-image-src', reader.result);
                }
            });

            $form.append($layer, $name, $roomType, $printerAddress, $jobTitle, $email, $phone, $photo, $btnSave, $btnRemove);

            $popupContent.append($form);

            popup = new L.popup().setContent($popupContent[0]);

            marker.bindPopup(popup).openPopup();

            map.on('popupclose', function(e){
                map.removeLayer(marker);
            });
        });

        return layerBounds;
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
                    var featureId = $.inArray(feature, window.geoJson.printers),
                        $popupContent = $('<div class="tooltip-card"></div>'),
                        $form = $('<form action="#" class="edit-form" id="edit-form" onsubmit="event.preventDefault();"></form>'),
                        $layer = $('<select type="text" class="form-field" id="edditable-layer"><option value="staff">Staff</option><option value="rooms">Rooms</option><option value="printers" selected>Printers</option></select>'),
                        $name = $('<input type="text" class="form-field" id="employee-name" required placeholder="Name" value="' + feature.properties.name + '">'),
                        $roomType = $('<select type="text" class="form-field" id="room-type" style="display: none;"><option value="meeting" selected>Meeting Room</option><option value="rest">RestRoom</option><option value="kitchen">Kitchen</option></select>'),
                        $printerAddress = $('<input type="text" class="form-field" id="printer-address" required placeholder="IP Address" value="' + feature.properties.address + '">'),
                        $jobTitle = $('<input type="text" class="form-field" id="employee-title" style="display: none;" placeholder="Job Title">'),
                        $email = $('<input type="email" class="form-field" id="employee-email" style="display: none;" placeholder="Email">'),
                        $phone = $('<input type="phone" class="form-field" id="employee-phone" style="display: none;" placeholder="+1-234-567-8910">'),
                        $photo = $('<input type="file" class="form-field" id="employee-photo" data-image-src="' + feature.properties.photo + '" style="display: none;" placeholder="Choose Photo">'),
                        $btnSave = $('<button type="submit" class="form-field action" id="save">Save</button>'),
                        $btnRemove = $('<button class="form-field action" id="remove">Remove</button>'),
                        popup;

                    $layer.on('change', function () {
                        switch ($layer.val()) {
                            case 'staff':
                                $roomType.hide().attr('required', false);
                                $printerAddress.hide().attr('required', false);
                                $name.show().attr('required', true);
                                $jobTitle.show().attr('required', true);
                                $email.show().attr('required', true);
                                $phone.show().attr('required', true);
                                $photo.show().attr('required', false);
                                break;
                            case 'rooms':
                                $printerAddress.hide().attr('required', false);
                                $jobTitle.hide().attr('required', false);
                                $email.hide().attr('required', false);
                                $phone.hide().attr('required', false);
                                $photo.hide().attr('required', false);
                                $name.show().attr('required', true);
                                $roomType.show().attr('required', true);
                                break;
                            case 'printers':
                                $roomType.hide().attr('required', false);
                                $jobTitle.hide().attr('required', false);
                                $email.hide().attr('required', false);
                                $phone.hide().attr('required', false);
                                $photo.hide().attr('required', false);
                                $name.show().attr('required', true);
                                $printerAddress.show().attr('required', true);
                                break;
                            default:
                                break;
                        }
                    });

                    $btnSave.on('click', function (e) {
                        e.preventDefault();
                        var newFeature;

                        switch ($layer.val()) {
                            case 'staff':
                                if ($name.valid() && $jobTitle.valid() && $email.valid() && $phone.valid() && $photo.valid()) {
                                    newFeature = {
                                        type: 'Feature',
                                        properties: {
                                            name: $name.val(),
                                            jobTitle: $jobTitle.val(),
                                            email: $email.val(),
                                            phone: $phone.val(),
                                            photo: $photo.attr('data-image-src')
                                        },
                                        geometry: {
                                            type: 'Point',
                                            coordinates: feature.geometry.coordinates
                                        }
                                    };
                                    pushToGeoJson(newFeature);
                                }
                                break;
                            case 'rooms':
                                if ($name.valid() && $roomType.valid()) {
                                    newFeature = {
                                        type: 'Feature',
                                        properties: {
                                            name: $name.val(),
                                            type: $roomType.val()
                                        },
                                        geometry: {
                                            type: 'Point',
                                            coordinates: feature.geometry.coordinates
                                        }
                                    };
                                    pushToGeoJson(newFeature);
                                }
                                break;
                            case 'printers':
                                if ($name.valid() && $printerAddress.valid()) {
                                    newFeature = {
                                        type: 'Feature',
                                        properties: {
                                            name: $name.val(),
                                            address: $printerAddress.val()
                                        },
                                        geometry: {
                                            type: 'Point',
                                            coordinates: feature.geometry.coordinates
                                        }
                                    };
                                    pushToGeoJson(newFeature);
                                }
                                break;
                            default:
                                break;
                        }

                        function pushToGeoJson(newFeature) {
                            if ($layer.val() == 'printers'){
                                window.geoJson.printers[featureId] = newFeature;
                            } else {
                                window.geoJson.printers.splice(featureId, 1);
                                window.geoJson[$layer.val()].push(newFeature);
                            }

                            $(document).trigger('saveMap');
                        }
                    });

                    $btnRemove.on('click', function () {
                        if (confirm('Are you sure you want to remove "' + $name.val() + '" ?')) {
                            window.geoJson.printers.splice(featureId, 1);
                            $(document).trigger('saveMap');
                        } else {
                            return;
                        }
                    });

                    $photo.on('change', function () {
                        var self = this,
                            file = this.files[0],
                            reader  = new FileReader();

                        if (file) {
                            reader.readAsDataURL(file)
                        }

                        reader.onloadend = function () {
                            $(self).attr('data-image-src', reader.result);
                        }
                    });

                    $form.append($layer, $name, $roomType, $printerAddress, $jobTitle, $email, $phone, $photo, $btnSave, $btnRemove);

                    $popupContent.append($form);

                    popup = new L.popup().setContent($popupContent[0]);

                    layer.bindPopup(popup);
                },
                pointToLayer: function (feature, latlng) {
                    var marker = L.marker(latlng, {
                        icon: printerMarker,
                        draggable: true
                    });

                    marker.on('dragend', function (e) {
                        var coords,
                            featureId = $.inArray(feature, window.geoJson.printers);

                        coords = rc.project(e.target._latlng);
                        window.geoJson.printers[featureId].geometry.coordinates = coords;
                    });

                    return marker;
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
                var featureId = $.inArray(feature, window.geoJson.rooms),
                    $popupContent = $('<div class="tooltip-card"></div>'),
                    $form = $('<form action="#" class="edit-form" id="edit-form" onsubmit="event.preventDefault();"></form>'),
                    $layer = $('<select type="text" class="form-field" id="edditable-layer"><option value="staff">Staff</option><option value="rooms" selected>Rooms</option><option value="printers">Printers</option></select>'),
                    $name = $('<input type="text" class="form-field" id="employee-name" required placeholder="Name" value="' + feature.properties.name + '">'),
                    $roomType = $('<select type="text" class="form-field" id="room-type" required><option value="meeting">Meeting Room</option><option value="rest">RestRoom</option><option value="kitchen">Kitchen</option></select>'),
                    $printerAddress = $('<input type="text" class="form-field" id="printer-address" style="display: none;" placeholder="IP Address">'),
                    $jobTitle = $('<input type="text" class="form-field" id="employee-title" style="display: none;" placeholder="Job Title">'),
                    $email = $('<input type="email" class="form-field" id="employee-email" style="display: none;" placeholder="Email">'),
                    $phone = $('<input type="phone" class="form-field" id="employee-phone" style="display: none;" placeholder="+1-234-567-8910">'),
                    $photo = $('<input type="file" class="form-field" id="employee-photo" data-image-src="' + feature.properties.photo + '" style="display: none;" placeholder="Choose Photo">'),
                    $btnSave = $('<button type="submit" class="form-field action" id="save">Save</button>'),
                    $btnRemove = $('<button class="form-field action" id="remove">Remove</button>'),
                    popup;

                $roomType.val(feature.properties.type);

                $layer.on('change', function () {
                    switch ($layer.val()) {
                        case 'staff':
                            $roomType.hide().attr('required', false);
                            $printerAddress.hide().attr('required', false);
                            $name.show().attr('required', true);
                            $jobTitle.show().attr('required', true);
                            $email.show().attr('required', true);
                            $phone.show().attr('required', true);
                            $photo.show().attr('required', false);
                            break;
                        case 'rooms':
                            $printerAddress.hide().attr('required', false);
                            $jobTitle.hide().attr('required', false);
                            $email.hide().attr('required', false);
                            $phone.hide().attr('required', false);
                            $photo.hide().attr('required', false);
                            $name.show().attr('required', true);
                            $roomType.show().attr('required', true);
                            break;
                        case 'printers':
                            $roomType.hide().attr('required', false);
                            $jobTitle.hide().attr('required', false);
                            $email.hide().attr('required', false);
                            $phone.hide().attr('required', false);
                            $photo.hide().attr('required', false);
                            $name.show().attr('required', true);
                            $printerAddress.show().attr('required', true);
                            break;
                        default:
                            break;
                    }
                });

                $btnSave.on('click', function (e) {
                    e.preventDefault();
                    var newFeature;

                    switch ($layer.val()) {
                        case 'staff':
                            if ($name.valid() && $jobTitle.valid() && $email.valid() && $phone.valid() && $photo.valid()) {
                                newFeature = {
                                    type: 'Feature',
                                    properties: {
                                        name: $name.val(),
                                        jobTitle: $jobTitle.val(),
                                        email: $email.val(),
                                        phone: $phone.val(),
                                        photo: $photo.attr('data-image-src')
                                    },
                                    geometry: {
                                        type: 'Point',
                                        coordinates: feature.geometry.coordinates
                                    }
                                };
                                pushToGeoJson(newFeature);
                            }
                            break;
                        case 'rooms':
                            if ($name.valid() && $roomType.valid()) {
                                newFeature = {
                                    type: 'Feature',
                                    properties: {
                                        name: $name.val(),
                                        type: $roomType.val()
                                    },
                                    geometry: {
                                        type: 'Point',
                                        coordinates: feature.geometry.coordinates
                                    }
                                };
                                pushToGeoJson(newFeature);
                            }
                            break;
                        case 'printers':
                            if ($name.valid() && $printerAddress.valid()) {
                                newFeature = {
                                    type: 'Feature',
                                    properties: {
                                        name: $name.val(),
                                        address: $printerAddress.val()
                                    },
                                    geometry: {
                                        type: 'Point',
                                        coordinates: feature.geometry.coordinates
                                    }
                                };
                                pushToGeoJson(newFeature);
                            }
                            break;
                        default:
                            break;
                    }

                    function pushToGeoJson(newFeature) {
                        if ($layer.val() == 'rooms'){
                            window.geoJson.rooms[featureId] = newFeature;
                        } else {
                            window.geoJson.rooms.splice(featureId, 1);
                            window.geoJson[$layer.val()].push(newFeature);
                        }

                        $(document).trigger('saveMap');
                    }
                });

                $btnRemove.on('click', function () {
                    if (confirm('Are you sure you want to remove "' + $name.val() + '"?')) {
                        window.geoJson.rooms.splice(featureId, 1);
                        $(document).trigger('saveMap');
                    } else {
                        return;
                    }
                });

                $photo.on('change', function () {
                    var self = this,
                        file = this.files[0],
                        reader  = new FileReader();

                    if (file) {
                        reader.readAsDataURL(file)
                    }

                    reader.onloadend = function () {
                        $(self).attr('data-image-src', reader.result);
                    }
                });

                $form.append($layer, $name, $roomType, $printerAddress, $jobTitle, $email, $phone, $photo, $btnSave, $btnRemove);

                $popupContent.append($form);

                popup = new L.popup().setContent($popupContent[0]);

                layer.bindPopup(popup);

                addToRoomsSidebar(map, rc, feature, layer);
            },
            pointToLayer: function (feature, latlng) {
                var marker,
                    markerImg;

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

                marker = L.marker(latlng, {
                    icon: roomMarker,
                    draggable: true
                });

                marker.on('dragend', function (e) {
                    var coords,
                        featureId = $.inArray(feature, window.geoJson.rooms);

                    coords = rc.project(e.target._latlng);
                    window.geoJson.rooms[featureId].geometry.coordinates = coords;
                });

                return marker
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
                    var featureId = $.inArray(feature, window.geoJson.staff),
                        $popupContent = $('<div class="tooltip-card"></div>'),
                        $form = $('<form action="#" class="edit-form" id="edit-form" onsubmit="event.preventDefault();"></form>'),
                        $layer = $('<select type="text" class="form-field" id="edditable-layer"><option value="staff" selected>Staff</option><option value="rooms">Rooms</option><option value="printers">Printers</option></select>'),
                        $name = $('<input type="text" class="form-field" id="employee-name" required placeholder="Name" value="' + feature.properties.name + '">'),
                        $roomType = $('<select type="text" class="form-field" id="room-type" style="display: none;" ><option value="meeting">Meeting Room</option><option value="rest">RestRoom</option><option value="kitchen">Kitchen</option></select>'),
                        $printerAddress = $('<input type="text" class="form-field" id="printer-address" style="display: none;" placeholder="IP Address">'),
                        $jobTitle = $('<input type="text" class="form-field" id="employee-title" required placeholder="Job Title" value="' + feature.properties.jobTitle + '">'),
                        $email = $('<input type="email" class="form-field" id="employee-email" required placeholder="Email" value="' + feature.properties.email + '">'),
                        $phone = $('<input type="phone" class="form-field" id="employee-phone" required placeholder="+1-234-567-8910" value="' + feature.properties.phone + '">'),
                        $photo = $('<input type="file" class="form-field" id="employee-photo" data-image-src="' + feature.properties.photo + '" placeholder="Choose Photo">'),
                        $existingImg = $('<img src="' + feature.properties.photo + '" style="display: block; width: auto; max-width: 100%; max-height: 70px;">'),
                        $btnSave = $('<button type="submit" class="form-field action" id="save">Save</button>'),
                        $btnRemove = $('<button class="form-field action" id="remove">Remove</button>'),
                        popup;

                    $layer.on('change', function () {
                        switch ($layer.val()) {
                            case 'staff':
                                $roomType.hide().attr('required', false);
                                $printerAddress.hide().attr('required', false);
                                $name.show().attr('required', true);
                                $jobTitle.show().attr('required', true);
                                $email.show().attr('required', true);
                                $phone.show().attr('required', true);
                                $existingImg.show();
                                $photo.show().attr('required', false);
                                break;
                            case 'rooms':
                                $printerAddress.hide().attr('required', false);
                                $jobTitle.hide().attr('required', false);
                                $email.hide().attr('required', false);
                                $phone.hide().attr('required', false);
                                $existingImg.hide();
                                $photo.hide().attr('required', false);
                                $name.show().attr('required', true);
                                $roomType.show().attr('required', true);
                                break;
                            case 'printers':
                                $roomType.hide().attr('required', false);
                                $jobTitle.hide().attr('required', false);
                                $email.hide().attr('required', false);
                                $phone.hide().attr('required', false);
                                $existingImg.hide();
                                $photo.hide().attr('required', false);
                                $name.show().attr('required', true);
                                $printerAddress.show().attr('required', true);
                                break;
                            default:
                                break;
                        }
                    });

                    $btnSave.on('click', function (e) {
                        e.preventDefault();
                        var newFeature;

                        switch ($layer.val()) {
                            case 'staff':
                                if ($name.valid() && $jobTitle.valid() && $email.valid() && $phone.valid() && $photo.valid()) {
                                    newFeature = {
                                        type: 'Feature',
                                        properties: {
                                            name: $name.val(),
                                            jobTitle: $jobTitle.val(),
                                            email: $email.val(),
                                            phone: $phone.val(),
                                            photo: $photo.attr('data-image-src')
                                        },
                                        geometry: {
                                            type: 'Point',
                                            coordinates: feature.geometry.coordinates
                                        }
                                    };
                                    pushToGeoJson(newFeature);
                                }
                                break;
                            case 'rooms':
                                if ($name.valid() && $roomType.valid()) {
                                    newFeature = {
                                        type: 'Feature',
                                        properties: {
                                            name: $name.val(),
                                            type: $roomType.val()
                                        },
                                        geometry: {
                                            type: 'Point',
                                            coordinates: feature.geometry.coordinates
                                        }
                                    };
                                    pushToGeoJson(newFeature);
                                }
                                break;
                            case 'printers':
                                if ($name.valid() && $printerAddress.valid()) {
                                    newFeature = {
                                        type: 'Feature',
                                        properties: {
                                            name: $name.val(),
                                            address: $printerAddress.val()
                                        },
                                        geometry: {
                                            type: 'Point',
                                            coordinates: feature.geometry.coordinates
                                        }
                                    };
                                    pushToGeoJson(newFeature);
                                }
                                break;
                            default:
                                break;
                        }

                        function pushToGeoJson(newFeature) {
                            if ($layer.val() == 'staff'){
                                window.geoJson.staff[featureId] = newFeature;
                            } else {
                                window.geoJson.staff.splice(featureId, 1);
                                window.geoJson[$layer.val()].push(newFeature);
                            }

                            $(document).trigger('saveMap');
                        }
                    });

                    $btnRemove.on('click', function () {
                        if (confirm('Are you sure you want to remove "' + $name.val() + '"?')) {
                            window.geoJson.staff.splice(featureId, 1);
                            $(document).trigger('saveMap');
                        } else {
                            return;
                        }
                    });

                    $photo.on('change', function () {
                        var self = this,
                            file = this.files[0],
                            reader  = new FileReader();

                        if (file) {
                            reader.readAsDataURL(file)
                        }

                        reader.onloadend = function () {
                            $(self).attr('data-image-src', reader.result);
                        }
                    });

                    $form.append($layer, $name, $roomType, $printerAddress, $jobTitle, $email, $phone, $existingImg, $photo, $btnSave, $btnRemove);

                    $popupContent.append($form);

                    popup = new L.popup().setContent($popupContent[0]);

                    layer.bindPopup(popup);

                    addToStaffSidebar(map, rc, feature, layer);
                },
                pointToLayer: function (feature, latlng) {
                    var marker = L.marker(latlng, {
                        icon: staffMarker,
                        draggable: true
                    });

                    marker.on('dragend', function (e) {
                        var coords,
                            featureId = $.inArray(feature, window.geoJson.staff);

                        coords = rc.project(e.target._latlng);
                        window.geoJson.staff[featureId].geometry.coordinates = coords;
                    });

                    return marker;
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
     * Saving Data
     */
    function saveMap() {
        $.ajax({
            method: "POST",
            url: "./save.php",
            data: JSON.stringify(window.geoJson)
        }).done(function() {
            location.reload();
        });
    }

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
        $(document).on('saveMap', saveMap);
    });
}(window));
