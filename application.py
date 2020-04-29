import os
import gpxpy
from cs50 import SQL
from flask import Flask, render_template, request
from helpers import haversine, check, upload

# Configure application
app = Flask(__name__)

# Ensure templates are auto-reloaded
app.config["TEMPLATES_AUTO_RELOAD"] = True

# Configure uploads for photos: Only IMAGES allowed, set destination
app.config["UPLOADED_PHOTOS_DEST"] = "static/foto"
app.config["ALLOWED_IMAGE_EXTENSIONS"] = ["JPEG", "JPG", "PNG"]

app.config["UPLOADED_GPXUPLOAD_DEST"] = "static/data"
app.config["ALLOWED_GPX_EXTENSIONS"] = ["GPX"]

# This should limit the size of uploadable files to 6 MB
app.config['MAX_CONTENT_LENGTH'] = 6 * 1024 * 1024

# define database
db = SQL("sqlite:///hiking.db")

def get_tracks():
    # get all the tracks to show in map
    tracklist = db.execute("SELECT * FROM hikes")
    # create a list for all the trackpoints
    pointlist = []
    # extract trackdata for each gpx file and append to pointlist
    for n in range(len(tracklist)):
        path = os.path.join(app.config["UPLOADED_GPXUPLOAD_DEST"], tracklist[n]["gpx"])
        gpxfile = open(path, "r")
        gpx = gpxpy.parse(gpxfile)
        trackdata = gpx.tracks[0].segments[0].points
        # get a comma separated list of all the gpspositions (format accepted by cesium)
        l = []
        for point in trackdata:
            l.append(point.longitude)
            l.append(point.latitude)
        pointlist.append(l)
    return tracklist, pointlist

@app.route("/")
def index():
    # get all the photos as well as associated track name to show in map
    tracklist, pointlist = get_tracks()
    photos = db.execute("SELECT pic_name, track_id, lat, lon, name FROM pictures JOIN hikes ON track_id = ID")
    # get path instead of filenames
    for m in range(len(photos)):
        photos[m]["pic_name"] = os.path.join(app.config["UPLOADED_PHOTOS_DEST"], photos[m]["pic_name"])
    return render_template("index.html", tracks = pointlist, tracklist = tracklist, photos = photos)


@app.route("/input", methods=["GET", "POST"])
def input():
    if request.method == "POST":
        # upload gpx file and get name of uploaded file (could be different from original filename)
        file = request.files["gpx"]
        if check(file, app, "gpx"):
            gpxname = upload(file, app, "gpx")
            message = ""
        else:
            message = "Something went wrong. Please check if file extension was gpx"
            return render_template("input.html", message = message)
        # open and parse gpx file
        path = os.path.join(app.config["UPLOADED_GPXUPLOAD_DEST"], gpxname)
        gpxfile = open(path, "r")
        gpx = gpxpy.parse(gpxfile)
        trackdata = gpx.tracks[0].segments[0].points
        # calculate length
        length = 0
        for i in range(len(trackdata)):
            if i == 0:
                pass
            else:
                length = length + haversine(trackdata[i-1].longitude, trackdata[i-1].latitude, trackdata[i].longitude, trackdata[i].latitude)
        length = round(length,2)

        # data for save to database
        name = request.form.get("name")
        description = request.form.get("description")
        difficulty = request.form.get("difficulty")
        start = request.form.get("start")
        db.execute("INSERT INTO hikes (name, desc, gpx, laenge, difficulty, start) VALUES (?,?,?,?,?,?)", name, description, gpxname, length, difficulty, start)
    return render_template("input.html")

# chose track from list and add photos to it
@app.route("/newphoto", methods=["GET", "POST"])
def newphoto():
    tracklist, pointlist = get_tracks()
    if request.method == "POST":
        file = request.files["photo"]
        if check(file, app, "image"):
            picname = upload(file, app, "image")
            message = ""
        else:
            message = "Something went wrong. Please check if file extension was jpg, jpeg or png"
            allhikes = db.execute("SELECT name FROM hikes")
            return render_template("newphoto.html", allhikes = allhikes, message = message)
        # get info for db
        trackid = request.form.get("tracks")
        #trackid = db.execute("SELECT ID FROM hikes WHERE name=?", track)
        #picname = request.files["photo"].filename
        if request.form.get("lat") == "" or request.form.get("lon") == "":
            errormsg = "Please pick a location for your photo using right click!"
            return render_template("error.html", errormsg = errormsg)
        lat = request.form.get("lat")
        lon = request.form.get("lon")
        # write into pic table
        db.execute("INSERT INTO pictures (track_id, pic_name, lat, lon) VALUES (?,?,?,?)", trackid, picname, lat, lon)
        # get info for GET method to reload page
        return render_template("newphoto.html", tracks = pointlist, tracklist = tracklist, message = message)
    else:
        # method = GET
        message = ""
        return render_template("newphoto.html", tracks = pointlist, tracklist = tracklist, message = message)

@app.route("/error")
def error():
    return render_template("error.html", errormsg = "")
