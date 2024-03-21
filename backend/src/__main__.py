import asyncio
from flask import Flask
from mvg import MvgApi
from departures import transform_departures, transform_to_departure_props

app = Flask(__name__)

@app.route('/stations/')
def stations():
    return MvgApi.stations()

@app.route('/stations/<id>/departures')
def departures(id):
    return transform_departures(transform_to_departure_props(asyncio.run(MvgApi.departures_async(id, 20, 0, None))))

if __name__ == '__main__':
    app.run()
