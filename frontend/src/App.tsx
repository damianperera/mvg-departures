import React, { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import './App.css'

type DepartureStationProps = {
  type: string
  latitude: string
  longitude: string
  place: string
  name: string
  globalId: string
  divaId: string
  transportTypes: []
  surroundingPlanLink: string
  aliases: string
  tariffZones: string
}

type DepartureProps = {
  plannedDepartureTime: string
  realtime: boolean
  delayInMinutes: number
  realtimeDepartureTime: number
  transportType: string
  label: string
  divaId: string
  network: string
  trainType: string
  destination: string
  cancelled: boolean
  sev: boolean
  platform: number
  platformChanged: boolean
  messages: any[]
  bannerHash: string
  occupancy: string
  stopPointGlobalId: string
}

type TransformedDepartureProps = {
  label: string
  destinations: {
    destination: string
    departures: DepartureProps[]
  }[]
}

type ErrorMessageProps = {
  reason: string
  message: string
}

function App() {
  /**
   * Constants
   */
  const DEFAULT_STATION = 'Forstenrieder Allee'
  const TYPE_STATION = 'STATION'
  const TYPE_UBAHN = 'UBAHN'
  const TEXT_SEV = 'SEV'
  const TEXT_CANCELLED = 'CANCELLED'
  const TEXT_DELAYED = 'DELAYED'
  const MVG_API_BASE_URI = 'https://www.mvg.de/api/fib/v2'
  const DEPARTURE_REFRESH_INTERVAL = 60 * 1000
  const QUERY_PARAM_STATION = 'station'
  const ERRORS: { [key: string]: ErrorMessageProps } = {
    NO_DEPARTURE_STATION_DATA: {
      reason: "could not fetch data for departure station",
      message: "Please verify that you are connected to the internet or wait awhile and try again"
    },
    NO_TARGET_STATION_IN_RESULTS: {
      reason: "could not find a departure station in your location",
      message: "Please verify that your station is correct or wait awhile and try again"
    },
    NO_DEPARTURE_DATA: {
      reason: "could not fetch departures for provided station",
      message: "Please verify that you are connected to the internet or wait awhile and try again"
    },
    GENERIC_NETWORK_ERROR: {
      reason: "could not communicate with upstream servers",
      message: "Please verify that you are connected to the internet or wait awhile and try again"
    }
  }

  /**
   * Effects
   */
  const [departureStation, setDepartureStation] = useState<DepartureStationProps>()
  const [departures, setDepartures] = useState<TransformedDepartureProps[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<ErrorMessageProps>()
  const [searchParams, setSearchParams] = useSearchParams()
  const [isDepartureStationModal, setIsDepartureStationModal] = useState(false)
  const [userUpdatedStation, setUserUpdatedStation] = useState('')

  /**
   * Reset All States
   */
  const resetState = () => {
    setIsDepartureStationModal(false)
    setIsLoading(false)
    resetErrors()
    setDepartureStation(undefined)
    setDepartures([])
  }

  /**
   * Reset Errors
   */
  const resetErrors = () => {
    setError(undefined)
  }

  /**
   * Reset States, Search Params & Reload App
   */
  const resetApp = () => {
    resetState()
    setSearchParams({})
    window.location.reload()
  }

  /**
   * Load Departure Station
   */
  useEffect(() => {
    const getDepartureStation = async () => {
      setIsLoading(true)
      try {
        const station = searchParams.get(QUERY_PARAM_STATION) || DEFAULT_STATION
        const data = await fetch(`${MVG_API_BASE_URI}/location?query=${encodeURI(station)}`, {
          method: "GET"
        })

        if (!data.ok) {
          resetState()
          console.error(ERRORS.NO_DEPARTURE_STATION_DATA)
          setError(ERRORS.NO_DEPARTURE_STATION_DATA)
          return
        }

        const stations = await data.json()
        const targetStation = stations.find((e: DepartureStationProps) => e.type === TYPE_STATION)

        if (targetStation == null) {
          resetState()
          console.error(ERRORS.NO_TARGET_STATION_IN_RESULTS)
          setError(ERRORS.NO_TARGET_STATION_IN_RESULTS)
          return
        }

        resetErrors()
        setDepartureStation(targetStation)
      } catch (error) {
        resetState()
        console.error(ERRORS.GENERIC_NETWORK_ERROR)
        setError(ERRORS.GENERIC_NETWORK_ERROR)
        return
      }
    }

    getDepartureStation()

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  /**
   * Load Departures
   */
  useEffect(() => {
    const getDepartures = async () => {
      try {
        const data = await fetch(`${MVG_API_BASE_URI}/departure?globalId=${departureStation?.globalId}&limit=20&offsetInMinutes=0`, {
          method: "GET"
        })

        if (!data.ok) {
          resetState()
          console.error(ERRORS.NO_DEPARTURE_DATA)
          setError(ERRORS.NO_DEPARTURE_DATA)
          return
        }

        const departures: DepartureProps[] = await data.json()
        const sortedDepartures: TransformedDepartureProps[] = transformDepartures(departures)

        setDepartures(sortedDepartures)
        resetErrors()
        setIsLoading(false)
      } catch (error) {
        resetState()
        console.error(ERRORS.GENERIC_NETWORK_ERROR)
        setError(ERRORS.GENERIC_NETWORK_ERROR)
        return
      }
    }

    const intervalId = setInterval(getDepartures, DEPARTURE_REFRESH_INTERVAL)
    departureStation != null && getDepartures()

    return () => clearInterval(intervalId)

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [departureStation])

  /**
   * Daily Reload
   */
  useEffect(() => {
    const dailyReload = () => {
      const now = new Date()

      // Check if it's already past 3:00 AM for today
      if (now.getHours() > 3 || (now.getHours() === 3 && now.getMinutes() > 0)) {
        const tomorrow = new Date(now)
        tomorrow.setDate(tomorrow.getDate() + 1)
        tomorrow.setHours(3, 0, 0, 0)
        const millisLeft = tomorrow.getTime() - now.getTime()

        setTimeout(() => {
          window.location.reload()
        }, millisLeft)

        printLog(millisLeft)
      } else {
        const millisLeft = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 3, 0, 0, 0).getTime() - now.getTime()

        setTimeout(() => {
          window.location.reload()
        }, millisLeft)

        printLog(millisLeft)
      }
    }

    const printLog = (millisLeft: number) => {
      const dateObj = new Date(millisLeft)
      console.log(`This application will be reloaded automatically in ${dateObj.getHours()} hours and ${dateObj.getMinutes()} minutes`)
    }

    dailyReload();
  }, [])

  /**
   * Returns a fully defined <span /> based on the provided epoch
   * @param epochTime 
   * @returns <span />
   */
  const calculateRemainingTime = (epochTime: number) => {
    const currentTime = new Date().getTime()
    const remainingMilliseconds = epochTime - currentTime

    if (remainingMilliseconds < 60000) {
      return (<strong className="blinking">now</strong>)
    }

    const remainingMinutes = Math.floor(remainingMilliseconds / 60000)
    const hours = Math.floor(remainingMinutes / 60)
    const minutes = remainingMinutes % 60

    let remainingTimeString = ''
    if (hours > 0) {
      remainingTimeString += `${hours} <small>${hours === 1 ? 'hr' : 'hrs'}</small>`
      if (minutes > 0) {
        remainingTimeString += ` ${minutes} <small>${minutes === 1 ? 'min &nbsp;' : 'mins'}</small>`
      }
    } else {
      remainingTimeString += `${minutes} <small>${minutes === 1 ? 'min &nbsp;' : 'mins'}</small>`
    }

    return (<span dangerouslySetInnerHTML={{ __html: remainingTimeString }}></span>)
  }

  /**
   * Transform Departures
   * @param departures DepartureProps[]
   * @returns TransformedDepartureProps[]
   */
  function transformDepartures(departures: DepartureProps[]): TransformedDepartureProps[] {
    const transformedArray = departures.reduce((acc: TransformedDepartureProps[], departure: DepartureProps) => {
      const { label, destination } = departure
      const labelIndex = acc.findIndex(item => item.label === label)
      if (labelIndex === -1) {
        acc.push({ label, destinations: [{ destination, departures: [departure] }] })
      } else {
        const destIndex = acc[labelIndex].destinations.findIndex(item => item.destination === destination)
        if (destIndex === -1) {
          acc[labelIndex].destinations.push({ destination, departures: [departure] })
        } else {
          acc[labelIndex].destinations[destIndex].departures.push(departure)
        }
      }
      return acc
    }, [])

    // Sort the transformed array so that 'UBAHN' departures come first
    transformedArray.sort((a, b) => {
      const aHasUBahn = a.destinations.some(dest => dest.departures.some(dep => dep.transportType === TYPE_UBAHN))
      const bHasUBahn = b.destinations.some(dest => dest.departures.some(dep => dep.transportType === TYPE_UBAHN))
      if (aHasUBahn && !bHasUBahn) {
        return -1
      } else if (!aHasUBahn && bHasUBahn) {
        return 1
      } else {
        return 0
      }
    })

    // Sort destinations alphabetically
    transformedArray.forEach(item => {
      item.destinations.sort((a, b) => a.destination.localeCompare(b.destination))
    })

    return transformedArray.map(item => ({
      label: item.label,
      destinations: item.destinations.map(dest => ({
        destination: dest.destination,
        departures: dest.departures.sort((a, b) => a.realtimeDepartureTime - b.realtimeDepartureTime).slice(0, 2)
      }))
    }))
  }

  const triggerDepartureSelectorModal = () =>
    setIsDepartureStationModal(!isDepartureStationModal)

  const updateDepartureModal = () => {
    resetState()
    setSearchParams({ 'station': userUpdatedStation })
  }

  return (
    <div className="app" onClick={triggerDepartureSelectorModal}>
      {isDepartureStationModal && (
        <div className="settings-overlay">
          <div className="settings">
            <h2>Settings {departureStation !== undefined && (<div><small>{departureStation.name}</small></div>)}</h2>
            <div className='settings-content'>
              <input type="text" placeholder={'Enter Departure Station'} onChange={(e) => setUserUpdatedStation(e.target.value)} onClick={(e) => e.stopPropagation()} />
              <div className="settings-buttons">
                <button onClick={resetApp}>Reset App</button>
                <button onClick={triggerDepartureSelectorModal}>Cancel</button>
                <button onClick={updateDepartureModal}>Confirm</button>
              </div>
            </div>
          </div>
        </div>
      )}
      {isLoading && !error && (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p className="loading-text">Loading Departures</p>
        </div>
      )}
      {error && (
        <div className="error-container">
          <p className="error-text">
            <span className='red'>error &#187;</span> {error.reason}<br />
            <small>{error.message}</small>
          </p>
        </div>
      )}
      <div className='departures-container'>
        <table className='departures'>
          <tbody>
            {departures.map((item, index) => {
              return (
                <React.Fragment key={index}>
                  {item.destinations.map((dest, destIndex) => {
                    return (
                      <React.Fragment key={`${index}-${destIndex}`}>
                        {dest.departures.map((departure, depIndex) => (
                          <tr key={`${index}-${destIndex}-${depIndex}`}>
                            {depIndex === 0 && (
                              <React.Fragment>
                                {destIndex === 0 && (
                                  <td key={`transport-label-${index}-${destIndex}-${depIndex}`} className='center' rowSpan={item.destinations.reduce((acc, dest) => acc + dest.departures.length, 0)}>
                                    {item.label}
                                  </td>
                                )}
                                <td key={`destination-${index}-${destIndex}-${depIndex}`} className='left' rowSpan={dest.departures.length}>
                                  {dest.destination}
                                </td>
                              </React.Fragment>
                            )}
                            <td key={`departure-${index}-${destIndex}-${depIndex}`} className='right'>
                              {departure.sev && (
                                <div key={`sev-${index}-${destIndex}-${depIndex}`} className='departureNested departureSev'>{TEXT_SEV}</div>
                              )}
                              {departure.cancelled && (
                                <div key={`cancelled-${index}-${destIndex}-${depIndex}`} className='departureNested departureCancelled blinking'>{TEXT_CANCELLED}</div>
                              )}
                              {(departure.delayInMinutes > 0 && !departure.cancelled) && (
                                <div key={`delayed-${index}-${destIndex}-${depIndex}`} className='departureNested departureDelayed'>{TEXT_DELAYED}</div>
                              )}
                              {calculateRemainingTime(departure.realtimeDepartureTime)}
                            </td>
                          </tr>
                        ))}
                      </React.Fragment>
                    )
                  })}
                </React.Fragment>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default App
