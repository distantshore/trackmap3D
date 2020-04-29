import os
from math import radians, sin, cos, asin, sqrt
from werkzeug.utils import secure_filename

# uses the halversine function to calculate 2D distance between two gps points
def haversine(lon1, lat1, lon2, lat2):
    lon1, lat1, lon2, lat2 = map(radians, [lon1, lat1, lon2, lat2])
    dlon = lon2 - lon1
    dlat = lat2 - lat1
    a = sin(dlat / 2) ** 2 + cos(lat1) * cos(lat2) * sin(dlon / 2) ** 2

    return 2 * 6371 * asin(sqrt(a))

# code for uploads based on https://pythonise.com/series/learning-flask/flask-uploading-files
# and https://github.com/ngoduykhanh/flask-file-uploader/blob/master/app.py
# checks if filename has a . and is one of the allowed extensions
def check(file, app, param):
    if not "." in file.filename:
    # rsplit(separator,maxsplit) splits a string by seperator starting from the right, d.h. it splits at the first point encountered from the right
    # we need the second element [1] of this list, d.h. the extension
    ext = file.filename.rsplit(".", 1)[1]
    if param == "gpx" and ext.upper() in app.config["ALLOWED_GPX_EXTENSIONS"]:
        return True
    elif param == "image" and ext.upper() in app.config["ALLOWED_IMAGE_EXTENSIONS"]:
        return True
    else:
        return False


def upload(file, app, param):
    # use werkzeugs secure_filename to change filename if necessary
    filename = secure_filename(file.filename)
    if param == "gpx":
        # check if path (i.e. file) already exists, if yes: extend filename
        i = 1
        while os.path.exists(os.path.join(app.config["UPLOADED_GPXUPLOAD_DEST"], filename)):
            name, extension = os.path.splitext(filename)
            filename = '%s_%s%s' % (name, str(i), extension)
            i += 1
        # assemble new path
        path = os.path.join(app.config["UPLOADED_GPXUPLOAD_DEST"], filename)
    else:
        # check if path (i.e. file) already exists, if yes: extend filename
        i = 1
        while os.path.exists(os.path.join(app.config['UPLOADED_PHOTOS_DEST'], filename)):
            name, extension = os.path.splitext(filename)
            filename = '%s_%s%s' % (name, str(i), extension)
            i += 1
        # assemble new path
        path = os.path.join(app.config['UPLOADED_PHOTOS_DEST'], filename)
    # save the file
    file.save(path)
    # return filename for database save
    return filename
