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
  // const [departureStations, setDepartureStation] = useState<DepartureStationProps>()
  const [departures, setDepartures] = useState<DepartureProps [][][]>([])
    // const [disruptions, setDisruptions] = useState<DisruptionProps[]>([])

  useEffect(() => {
    const getDepartureStation = async() => {
      let data = await fetch(`https://www.mvg.de/api/fib/v2/location?query=${encodeURI(DEFAULT_STATION)}`, {
        method: "GET"
      });
      let jsonData = await data.json();
  
      const pds = jsonData.find((e: DepartureStationProps) => e.type === TYPE_STATION)
      data = await fetch(`https://www.mvg.de/api/fib/v2/departure?globalId=${pds?.globalId}&limit=20&offsetInMinutes=0`, {
        method: "GET"
      });
      const departures: DepartureProps[] = await data.json();
      const sortedDepartures: DepartureProps[][][] = sortDepartures(departures)

      // setDepartureStation(pds)
      setDepartures(sortedDepartures);
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
      remainingTimeString += `${hours} ${hours === 1 ? 'hr' : 'hrs'}`;
      if (minutes > 0) {
        remainingTimeString += `${minutes} ${minutes === 1 ? 'min' : 'mins'}`;
      }
    } else {
      remainingTimeString += `${minutes} ${minutes === 1 ? 'min' : 'mins'}`;
    }

    return (<span>{remainingTimeString}</span>);
  };

  const sortDepartures = (departures: DepartureProps[]): DepartureProps[][][] => {
    // Filter out cancelled departures
    const filteredDepartures = departures.filter(departure => !departure.cancelled);
  
    // Group filtered departures by transportType
    const groups: { [key: string]: DepartureProps[] } = {};
    filteredDepartures.forEach(departure => {
      const { transportType } = departure;
      if (!(transportType in groups)) {
        groups[transportType] = [];
      }
      groups[transportType].push(departure);
    });
  
    // Sort groups based on the presence of UBAHN transportType
    const sortedGroups = Object.entries(groups).sort(([typeA], [typeB]) => {
      if (typeA === 'UBAHN') return -1;
      if (typeB === 'UBAHN') return 1;
      return 0;
    });
  
    // Sort nested arrays within each group by label
    sortedGroups.forEach(([_, departures]) => {
      departures.sort((a, b) => a.label.localeCompare(b.label));
  
      // Group departures by destination and sort them by realtimeDepartureTime
      const groupedByDestination: { [key: string]: DepartureProps[] } = {};
      departures.forEach(departure => {
        const { destination } = departure;
        if (!(destination in groupedByDestination)) {
          groupedByDestination[destination] = [];
        }
        groupedByDestination[destination].push(departure);
      });
  
      // Keep only the top two nested objects per destination (preserving sort order)
      Object.values(groupedByDestination).forEach(destinationGroup => {
        destinationGroup.splice(2);
      });
  
      // Flatten and update the nested array
      const sortedNestedArray: DepartureProps[] = [];
      Object.values(groupedByDestination).forEach(destinationGroup => {
        sortedNestedArray.push(...destinationGroup);
      });
      departures.splice(0, departures.length, ...sortedNestedArray);
    });
  
    return sortedGroups.map(([_, departures]) => [departures]);
  };

  return (
    <div className="App">
      <header className="App-header">
        <div className='departures-container'>
          <table className='departures'>
            <tbody>
              {departures.map((group) => (
                group.map((nestedArray, nIdx) => (
                  <React.Fragment key={nIdx}>
                    {nestedArray.map((departure, dIdx) => (
                      <tr key={dIdx}>
                        <td className='center'>{departure.label}</td>
                        <td className='left'>{departure.destination}</td>
                        <td className='left'>{calculateRemainingTime(departure.realtimeDepartureTime)}</td>
                      </tr>
                    ))}
                  </React.Fragment>
                ))
            ))}
      </tbody>
          </table>
        </div>
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
