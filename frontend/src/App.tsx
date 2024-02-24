import React, { useState, useEffect } from 'react';
import './App.css';

// type DisruptionStationProps = {
//   id: string;
//   name: string;
// }

// type DisruptionLineProps = {
//   id: string;
//   name: string;
//   typeOfTransport: string;
//   stations: DisruptionStationProps[];
//   direction: string;
// }

// type DisruptionProps = {
//   id: string;
//   type: string;
//   title: string;
//   text: string;
//   lines: DisruptionLineProps[];
// }

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
  const DEFAULT_STATION = 'Forstenrieder Allee'
  const TYPE_STATION = 'STATION'
  const [departureStations, setDepartureStation] = useState<DepartureStationProps>()
  const [departures, setDepartures] = useState<DepartureProps []>([])
    // const [disruptions, setDisruptions] = useState<DisruptionProps[]>([])

  useEffect(() => {
    const getDepartureStation = async() => {
      let data = await fetch(`https://www.mvg.de/api/fib/v2/location?query=${encodeURI(DEFAULT_STATION)}`, {
        method: "GET"
      });
      let jsonData = await data.json();
  
      const pds = jsonData.find((e: DepartureStationProps) => e.type === TYPE_STATION)
      data = await fetch(`https://www.mvg.de/api/fib/v2/departure?globalId=${pds?.globalId}&limit=10&offsetInMinutes=0`, {
        method: "GET"
      });
      jsonData = await data.json();

      setDepartureStation(pds)
      setDepartures(jsonData);
    }

    // const getDisruptions = async () => {
    //   const data = await fetch("https://www.mvg.de/api/ems/tickers", {
    //     method: "GET"
    //   });
    //   const jsonData = await data.json();
    //   setDisruptions(jsonData);
    // };
    
    const runEveryMinute = () => {
      getDepartureStation();
      // getDisruptions();

      setTimeout(runEveryMinute, 60000);
    };

    const timeoutId = setTimeout(runEveryMinute, 0)
    return () => clearTimeout(timeoutId);
  }, []);

  const calculateRemainingTime = (epochTime: number) => {
    const currentTime = new Date().getTime();
    const remainingMilliseconds = epochTime - currentTime;

    if (remainingMilliseconds < 60000) {
      return (<strong className="blinking">now</strong>);
    }

    const remainingMinutes = Math.floor(remainingMilliseconds / 60000);
    const hours = Math.floor(remainingMinutes / 60);
    const minutes = remainingMinutes % 60;

    let remainingTimeString = '';
    if (hours > 0) {
      remainingTimeString += `in ${hours} ${hours === 1 ? 'hr' : 'hrs'}`;
      if (minutes > 0) {
        remainingTimeString += `in ${minutes} ${minutes === 1 ? 'min' : 'mins'}`;
      }
    } else {
      remainingTimeString += `in ${minutes} ${minutes === 1 ? 'min' : 'mins'}`;
    }

    return (<span>{remainingTimeString}</span>);
  };

  return (
    <div className="App">
      <header className="App-header">
        <div>
          <h3>{departureStations?.name}</h3>
        </div>
        {departures.map((departure, idx) => {
          return (<div key={idx}>
            <div >{departure.label} to <strong>{departure.destination}</strong> {calculateRemainingTime(departure.realtimeDepartureTime)}</div>
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
