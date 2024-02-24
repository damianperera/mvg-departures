import React, { useState, useEffect } from 'react';
import './App.css';

type DisruptionStationProps = {
  id: string;
  name: string;
}

type DisruptionLineProps = {
  id: string;
  name: string;
  typeOfTransport: string;
  stations: DisruptionStationProps[];
  direction: string;
}

type DisruptionProps = {
  id: string;
  type: string;
  title: string;
  text: string;
  lines: DisruptionLineProps[];
}

type DepartureStationProps = {
  type: string;
  latitude: string;
  longitude: string;
  place: string;
  name: string;
  globalId: string;
  divaId: string;
  transportTypes: [];
  surroundingPlanLink: string;
  aliases: string;
  tariffZones: string;
}

type DepartureProps = {
  plannedDepartureTime: string;
  realtime: boolean;
  delayInMinutes: number;
  realtimeDepartureTime: number;
  transportType: string;
  label: string;
  divaId: string;
  network: string;
  trainType: string;
  destination: string;
  cancelled: boolean;
  sev: boolean;
  platform: number;
  platformChanged: boolean;
  messages: [];
  bannerHash: string;
  occupancy: string;
  stopPointGlobalId: string;
}

function App() {
  const [departureStations, setDepartureStation] = useState<DepartureStationProps>()
  const [departures, setDepartures] = useState<DepartureProps []>([])
    // const [disruptions, setDisruptions] = useState<DisruptionProps[]>([])

  useEffect(() => {
    const getDepartureStation = async() => {
      let data = await fetch("https://www.mvg.de/api/fib/v2/location?query=Forstenrieder%20Allee", {
        method: "GET"
      });
      let jsonData = await data.json();
  
      const pds = jsonData.find((e: DepartureStationProps) => e.type === "STATION")
      data = await fetch(`https://www.mvg.de/api/fib/v2/departure?globalId=${pds?.globalId}&limit=10&offsetInMinutes=0`, {
        method: "GET"
      });
      jsonData = await data.json();

      setDepartureStation(pds)
      setDepartures(jsonData);
    }

    const getDisruptions = async () => {
      const data = await fetch("https://www.mvg.de/api/ems/tickers", {
        method: "GET"
      });
      const jsonData = await data.json();
      setDisruptions(jsonData);
    };
    
    const runEveryMinute = () => {
      getDepartureStation();
      // getDisruptions();

      setTimeout(runEveryMinute, 10000);
    };

    const timeoutId = setTimeout(runEveryMinute, 0)
    return () => clearTimeout(timeoutId);
  }, []);

  const calculateRemainingTime = (epochTime: number) => {
    const currentTime = new Date().getTime();
    const remainingMilliseconds = epochTime - currentTime;

    // If remaining time is less than 1 minute, display "NOW"
    if (remainingMilliseconds < 60000) {
      return 'NOW';
    }

    // Convert remaining time to minutes and hours
    const remainingMinutes = Math.floor(remainingMilliseconds / 60000);
    const hours = Math.floor(remainingMinutes / 60);
    const minutes = remainingMinutes % 60;

    // Construct the remaining time string
    let remainingTimeString = '';
    if (hours > 0) {
      remainingTimeString += `in ${hours} ${hours === 1 ? 'hour' : 'hours'}`;
      if (minutes > 0) {
        remainingTimeString += `in ${minutes} ${minutes === 1 ? 'minute' : 'minutes'}`;
      }
    } else {
      remainingTimeString += `in ${minutes} ${minutes === 1 ? 'minute' : 'minutes'}`;
    }

    return remainingTimeString;
  };

  return (
    <div className="App">
      <header className="App-header">
        <div>
          <div>{departureStations?.name}</div>
        </div>
        {departures.map((departure, idx) => {
          return (<div key={idx}>
            <div >{departure.label} <small>to <strong>{departure.destination}</strong> {calculateRemainingTime(departure.realtimeDepartureTime)}</small></div>
          </div>)
        })}
        {/* {disruptions.map((disruption, idx) => {
          return (
            <div key={idx}>
              <div><strong>{disruption.type}</strong></div>
              <div>{disruption.title}</div>
              <div>{disruption.text}</div>
            </div>
          );
        })} */}
      </header>
    </div>
  );
}

export default App;
