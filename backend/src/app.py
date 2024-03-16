import asyncio
from flask import Flask
from mvg import MvgApi

app = Flask(__name__)

@app.route('/stations/')
def stations():
    return MvgApi.stations()

@app.route('/stations/<id>/departures')
def departures(id):
    return asyncio.run(MvgApi.departures_async(id, 20, 0, None))

if __name__ == '__main__':
    app.run()
