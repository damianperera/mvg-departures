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

function App() {
  const [disruptions, setDisruptions] = useState<DisruptionProps[]>([])

  useEffect(() => {
    const getDisruptions = async () => {
      const data = await fetch("https://www.mvg.de/api/ems/tickers", {
        method: "GET"
      });
      const jsonData = await data.json();
      setDisruptions(jsonData);
    };

    getDisruptions();
  }, []);

  return (
    <div className="App">
      <header className="App-header">
        {disruptions.map((value) => {
          return (
            <div>
              <div><strong>{value.type}</strong></div>
              <div>{value.title}</div>
              <div>{value.text}</div>
            </div>
          );
        })}
      </header>
    </div>
  );
}

export default App;
