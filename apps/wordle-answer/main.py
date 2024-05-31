from flask_cors import CORS, cross_origin
import requests
from datetime import datetime
import json



app = flask.Flask(__name__)

cors = CORS(app)
app.config['CORS_HEADERS'] = 'Content-Type'


@app.route("/")
def main():
    req = requests.get(f"https://www.nytimes.com/svc/wordle/v2/" + str(datetime.now()).split(" ")[0] +".json")
    word = json.loads(req.text)['solution']
    return word
app.run(port=80, host="0.0.0.0")
