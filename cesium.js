    // set Access Tolen (can be obtained at cesium.com for free)
    Cesium.Ion.defaultAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiIwYTQ4ZTM4My0wZmRjLTRiNmItYTZmZS0wNTY0MjNiOWI1ZWYiLCJpZCI6MjI3NDEsInNjb3BlcyI6WyJhc3IiLCJnYyJdLCJpYXQiOjE1ODE5NzMwMDF9.FM4ZUuuAzAd2hJOpZT-9fI6lQtMPKADxOsaclY2HvoI';

    // get data from flask
    var pythontrack = window.appConfig.tracks;
    var tracklist = window.appConfig.tracklist;
    var photolist = window.appConfig.photos;

    // creates the viewer. Deactivate all unnecessary UI elements
    var viewer = new Cesium.Viewer('cesiumContainer', {
        terrainProvider: Cesium.createWorldTerrain(),
        imageryProvider : new Cesium.ArcGisMapServerImageryProvider({
            url : 'https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer',
            enablePickFeatures: false
        }),
        timeline : false,
        animation: false,
        sceneModePicker : false,
        baseLayerPicker : false,
        terrainShadows: Cesium.ShadowMode.ENABLED
    });

    // sets initial view and camera distance
    viewer.camera.setView({
        destination: Cesium.Cartesian3.fromDegrees(5.78, 58.88, 40000)
    });

    // get all the tracks from the list and add to viewer. Per default indices in pythontrack and tracklist correspond.
    // ID is the unique identifyer from the database table and can be different
    for (i=0; i<pythontrack.length; i++) {
        viewer.entities.add({
            id : tracklist[i].ID,
            name: tracklist[i].name,
            description: tracklist[i].description,
            // polyline needs a comma separated list of lat, lon positions
            polyline : {
                positions : Cesium.Cartesian3.fromDegreesArray(pythontrack[i]),
            width : 2,
            material : Cesium.Color.BLUE,
            // displays polyline on the terrain (false = it is at height 0)
            clampToGround : true,
            //(1.0, 5000) would display point scaled by 1 from distance 5000
            distanceDisplayCondition : new Cesium.DistanceDisplayCondition(1, 50000)
            }
        });
    }

    // get all the photos from list, add their positions, name + link to pic
    for (i=0; i<photolist.length; i++) {
        viewer.entities.add({
            position : Cesium.Cartesian3.fromDegrees(photolist[i].lon, photolist[i].lat),
            name: photolist[i].name,
            // careful: use to different sets of quotation marks for html. Use backslash for new line
            description: "<a href=" + photolist[i].pic_name +" target='_blank'> \
            <img height='200px' style='display: block; margin-left: auto; margin-right: auto;'\
            src="+ photolist[i].pic_name + "> </a>",
            // sets billboard graphic. TODO: perhaps change to marker symbol (better viewable?)
            billboard : {
                image : "/static/foto.svg",
                //(1.0, 5000) displays point scaled by 1 from distance 5000
                distanceDisplayCondition : new Cesium.DistanceDisplayCondition(1, 10000)
            }
        });
    }

    // on selection change, zoom to track
    document.getElementById("tracks").addEventListener("change", chooseTrack);

    // Zooms to selected track and shows properties in the table
    function chooseTrack() {
        var id = this.value;
        // entities have the same id as the track in the db. zooms to the corresponding entity
        viewer.zoomTo(viewer.entities.getById(id));
        // iterates over tracklist to find the element with the correct id and saves to elem
        var elem;
        for (var i=0; i<tracklist.length; i++) {
            if (tracklist[i].ID == id) {
                elem = tracklist[i];
            }
        }
        // gets the elements properties and displays them in table
        document.getElementById("length").innerHTML = elem.laenge;
        document.getElementById("description").innerHTML = elem.desc;
        document.getElementById("difficulty").innerHTML = elem.difficulty;
        document.getElementById("start").innerHTML = elem.start;

    }