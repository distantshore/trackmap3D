    Cesium.Ion.defaultAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiIwYTQ4ZTM4My0wZmRjLTRiNmItYTZmZS0wNTY0MjNiOWI1ZWYiLCJpZCI6MjI3NDEsInNjb3BlcyI6WyJhc3IiLCJnYyJdLCJpYXQiOjE1ODE5NzMwMDF9.FM4ZUuuAzAd2hJOpZT-9fI6lQtMPKADxOsaclY2HvoI';
    // get data from flask
    var pythontrack = window.appConfig.tracks;
    var tracklist = window.appConfig.tracklist;

    // create viewer, deactivate all uneccessary UI
    var viewer = new Cesium.Viewer('cesiumContainer', {
        terrainProvider: Cesium.createWorldTerrain(),
        imageryProvider : new Cesium.ArcGisMapServerImageryProvider({
            url : 'https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer'
        }),
        timeline : false,
        animation: false,
        sceneModePicker : false,
        baseLayerPicker : false,
        terrainShadows: Cesium.ShadowMode.ENABLED
    });
    // zoom to home area
    viewer.camera.setView({
        destination: Cesium.Cartesian3.fromDegrees(5.78, 58.88, 150000)
    });
    //check if pick supported
    var scene = viewer.scene;
    if (!scene.pickPositionSupported) {
        window.alert('This browser does not support pickPosition.');
    }

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

    // on selection change, zoom to track
    document.getElementById("tracks").addEventListener("change", chooseTrack);

    // Zooms to selected track and shows properties in the table
    function chooseTrack() {
        var id = this.value;
        // entities have the same id as the track in the db. zooms to the corresponding entity
        viewer.zoomTo(viewer.entities.getById(id));
    }

    var handler;

    handler = new Cesium.ScreenSpaceEventHandler(scene.canvas);
    handler.setInputAction(function(click) {
        var cartesian = viewer.camera.pickEllipsoid(click.position, scene.globe.ellipsoid);
        if (cartesian) {
            var cartographic = Cesium.Cartographic.fromCartesian(cartesian);
            var longitudeString = Cesium.Math.toDegrees(cartographic.longitude).toFixed(5);
            var latitudeString = Cesium.Math.toDegrees(cartographic.latitude).toFixed(5);

            document.getElementById("lat").value = latitudeString;
            document.getElementById("lon").value = longitudeString;
        } else {
            entity.label.show = false;
        }
    }, Cesium.ScreenSpaceEventType.RIGHT_CLICK);




