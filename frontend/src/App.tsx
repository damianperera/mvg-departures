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
  messages: any[];
  bannerHash: string;
  occupancy: string;
  stopPointGlobalId: string;
}

type TransformedDepartureProps = {
  label: string;
  destinations: {
    destination: string;
    departures: DepartureProps[];
  }[];
}

function App() {
  const DEFAULT_STATION = 'Forstenrieder Allee'
  const TYPE_STATION = 'STATION'
  const TYPE_UBAHN = 'UBAHN'
  // const [departureStations, setDepartureStation] = useState<DepartureStationProps>()
  const [departures, setDepartures] = useState<TransformedDepartureProps[]>([])
  // const [disruptions, setDisruptions] = useState<DisruptionProps[]>([])

  useEffect(() => {
    const getDepartureStation = async () => {
      let data = await fetch(`https://www.mvg.de/api/fib/v2/location?query=${encodeURI(DEFAULT_STATION)}`, {
        method: "GET"
      });
      let jsonData = await data.json();

      const pds = jsonData.find((e: DepartureStationProps) => e.type === TYPE_STATION)
      data = await fetch(`https://www.mvg.de/api/fib/v2/departure?globalId=${pds?.globalId}&limit=20&offsetInMinutes=0`, {
        method: "GET"
      });
      const departures: DepartureProps[] = await data.json();
      const sortedDepartures: TransformedDepartureProps[] = transformDepartures(departures)

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

  function transformDepartures(departures: DepartureProps[]): TransformedDepartureProps[] {
    const transformedArray = departures.reduce((acc: TransformedDepartureProps[], departure: DepartureProps) => {
      const { label, destination } = departure;
      const labelIndex = acc.findIndex(item => item.label === label);
      if (labelIndex === -1) {
        acc.push({ label, destinations: [{ destination, departures: [departure] }] });
      } else {
        const destIndex = acc[labelIndex].destinations.findIndex(item => item.destination === destination);
        if (destIndex === -1) {
          acc[labelIndex].destinations.push({ destination, departures: [departure] });
        } else {
          acc[labelIndex].destinations[destIndex].departures.push(departure);
        }
      }
      return acc;
    }, []);

    // Sort the transformed array so that 'UBAHN' departures come first
    transformedArray.sort((a, b) => {
      const aHasUBahn = a.destinations.some(dest => dest.departures.some(dep => dep.transportType === TYPE_UBAHN));
      const bHasUBahn = b.destinations.some(dest => dest.departures.some(dep => dep.transportType === TYPE_UBAHN));
      if (aHasUBahn && !bHasUBahn) {
        return -1;
      } else if (!aHasUBahn && bHasUBahn) {
        return 1;
      } else {
        return 0;
      }
    });

    return transformedArray.map(item => ({
      label: item.label,
      destinations: item.destinations.map(dest => ({
        destination: dest.destination,
        departures: dest.departures.sort((a, b) => a.realtimeDepartureTime - b.realtimeDepartureTime).slice(0, 2)
      }))
    }));
  }

  return (
    <div className="App">
      <header className="App-header">
        <div className='departures-container'>
          <table className='departures'>
            <tbody>
              {departures.map((item, index) => {
                return (
                  <React.Fragment key={index}>
                    {item.destinations.map((dest, destIndex) => {
                      return dest.departures.map((departure, depIndex) => {
                        return (
                          <tr key={`${index}-${destIndex}-${depIndex}`}>
                            {depIndex === 0 && (
                              <React.Fragment>
                                <td rowSpan={dest.departures.length}>
                                  {depIndex === 0 ? item.label : null}
                                </td>
                                <td className='left' rowSpan={dest.departures.length}>
                                  {dest.destination}
                                </td>
                              </React.Fragment>
                            )}
                            <td className='left'>{calculateRemainingTime(departure.realtimeDepartureTime)}</td>
                          </tr>
                        );
                      });
                    })}
                  </React.Fragment>
                );
              })}
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
