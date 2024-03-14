import React, { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import './App.css'
import { useHotkeys } from 'react-hotkeys-hook'
import AsyncSelect from 'react-select/async'

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
  messages: any[] // eslint-disable-line @typescript-eslint/no-explicit-any
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

type ZdmStationProps = {
  name: string
  place: string
  id: string
  divaId: number
  abbreviation: string
  tariffZones: string
  products: string[]
  latitude: number
  longitude: number
}

type SearchStationProps = {
  label: string // name
  value: string // id
  place: string
  id: string
  divaId: number
  abbreviation: string
  tariffZones: string
  products: string[]
  latitude: number
  longitude: number
}

function App() {
	/**
   * Constants
   */
	const DEFAULT_STATION_ID = 'de:09162:1480'
	const TYPE_UBAHN = 'UBAHN'
	const TEXT_SEV = 'SEV'
	const TEXT_CANCELLED = 'CANCELLED'
	const TEXT_DELAYED = 'DELAYED'
	const MVG_FIB_API_BASE_URI = 'https://www.mvg.de/api/fib/v2'
	const MVG_ZDM_API_BASE_URI = 'https://www.mvg.de/.rest/zdm'
	const DEPARTURE_REFRESH_INTERVAL = 60 * 1000
	const DEPARTURE_RESULT_LIMIT = 20
	const QUERY_PARAM_STATION_ID = 'stationId'
	const HELP_URL = 'https://github.com/damianperera/mvg-departures'
	const LICENSE_URL = 'https://github.com/damianperera/mvg-departures/blob/main/LICENSE'
	const SETTINGS_STATION_SELECTOR_DEFAULT_PLACEHOLDER = 'Loading Departure Stations'
	const SETTINGS_STATION_SELECTOR_RESULTS_LIMIT = 10
	const CORS_PROXY_URI = 'https://corsproxy.io/?'
	const ERRORS: { [key: string]: ErrorMessageProps } = {
		NO_DEPARTURE_DATA: {
			reason: 'could not fetch departures for the selected station',
			message: 'Please verify that you are connected to the internet or wait awhile and try again'
		},
		GENERIC_NETWORK_ERROR: {
			reason: 'could not communicate with upstream servers',
			message: 'Please verify that you are connected to the internet or wait awhile and try again'
		},
		NO_SEARCH_STATION_DATA: {
			reason: 'could not fetch all stations',
			message: 'Please verify that you are connected to the internet or wait awhile and try again'
		},
		NO_DEPARTURE_STATIONS: {
			reason: 'could not find any departures for the selected station',
			message: 'Please select a different departure station or wait awhile and try again'
		}
	}

	/**
   * Effects
   */
	const [departures, setDepartures] = useState<TransformedDepartureProps[]>([])
	const [isLoading, setIsLoading] = useState(true)
	const [error, setError] = useState<ErrorMessageProps>()
	const [searchParams, setSearchParams] = useSearchParams()
	const [showSettingsModal, setShowSettingsModal] = useState(false)
	const [searchStations, setSearchStations] = useState<SearchStationProps[]>([])
	const [newStation, setNewStation] = useState<SearchStationProps>()

	/**
   * Reset All States
   */
	const resetState = () => {
		setShowSettingsModal(false)
		setIsLoading(false)
		resetErrors()
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
	const resetApp = (persistSearchParams: boolean = false) => {
		resetState()
		if (!persistSearchParams) {
			setSearchParams({})
		}
		window.location.reload()
	}

	/**
   * Load Departures
   */
	useEffect(() => {
		const getDepartures = async () => {
			try {
				const station = searchParams.get(QUERY_PARAM_STATION_ID) || DEFAULT_STATION_ID
				const cacheBuster = `&cb=${Date.now()}`
				const uri = `${CORS_PROXY_URI}${encodeURIComponent(`${MVG_FIB_API_BASE_URI}/departure?globalId=${station}&limit=${DEPARTURE_RESULT_LIMIT}${cacheBuster}`)}`
				const data = await fetch(uri, {
					method: 'GET'
				})

				if (!data.ok) {
					resetState()
					console.error(ERRORS.NO_DEPARTURE_DATA)
					setError(ERRORS.NO_DEPARTURE_DATA)
					return
				}

				const departures: DepartureProps[] = await data.json()

				if (departures.length === 0) {
					resetState()
					console.error(ERRORS.NO_DEPARTURE_STATIONS)
					setError(ERRORS.NO_DEPARTURE_STATIONS)
					return
				}

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
		getDepartures()

		return () => clearInterval(intervalId)
	}, [searchParams])

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

		dailyReload()
	}, [])

	/**
   * Hotkeys
   */
	useHotkeys('ctrl+1', () => triggerSettingsModal())
	useHotkeys('ctrl+9', () => triggerSettingsReload())
	useHotkeys('ctrl+0', () => triggerSettingsReset())

	/**
   * Returns a HTML element based on the provided epoch
   * @param epochTime 
   * @returns <span />
   */
	const calculateRemainingTime = (epochTime: number) => {
		const currentTime = new Date().getTime()
		const remainingMilliseconds = epochTime - currentTime

		if (remainingMilliseconds < 60000) {
			return (<strong className='blinking'>now</strong>)
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

	/**
   * Triggers
   */
	const triggerSettingsModal = () => setShowSettingsModal(!showSettingsModal)
	const triggerSettingsHelp = () => window.location.href = HELP_URL
	const triggerSettingsReload = () => resetApp(true)
	const triggerSettingsReset = () => resetApp(false)
	const triggerSettingsConfirm = () => {
		if (newStation && newStation.id !== searchParams.get(QUERY_PARAM_STATION_ID)) {
			setSearchParams({ 'stationId': newStation.id })
			resetApp(true)
		}
	}
	const triggerSettingsCancel = () => {
		setNewStation(undefined)
		triggerSettingsModal()
	}

	const fetchStations = async () => {
		try {
			const data = await fetch(`${MVG_ZDM_API_BASE_URI}/stations`, {
				method: 'GET'
			})

			if (!data.ok) {
				setSearchStations([])
				console.error(ERRORS.NO_SEARCH_STATION_DATA)
				return []
			}

			const stations: ZdmStationProps[] = await data.json()
			const options: SearchStationProps[] = stations.map(station => ({
				label: `${station.name}, ${station.place}`,
				value: station.id,
				place: station.place,
				id: station.id,
				divaId: station.divaId,
				abbreviation: station.abbreviation,
				tariffZones: station.tariffZones,
				products: station.products,
				latitude: station.latitude,
				longitude: station.longitude
			}))

			setSearchStations(options)
			return options
		} catch (error) {
			setSearchStations([])
			console.error(ERRORS.GENERIC_NETWORK_ERROR)
			return []
		}
	}

	const getStations = async (searchValue: string) => {
		let allStations = searchStations
		if (!allStations || allStations.length === 0) {
			allStations = await fetchStations()
		}
		return allStations.filter((station) => 
			station.label.toLowerCase().startsWith(searchValue.toLowerCase())
		).slice(0, SETTINGS_STATION_SELECTOR_RESULTS_LIMIT)
	}

	const loadStationOptions = (searchValue: string) => {
		return new Promise<SearchStationProps[]>((resolve) => 
			resolve(getStations(searchValue))
		)
	}

	const getCurrentStation = () => {
		const stationId = searchParams.get(QUERY_PARAM_STATION_ID) || DEFAULT_STATION_ID
		return (searchStations !== undefined && searchStations.find((station) => station.id === stationId)?.label) 
            || SETTINGS_STATION_SELECTOR_DEFAULT_PLACEHOLDER
	}

	return (
		<div className='app'>
			{showSettingsModal && (
				<div className='settings-container'>
					<div className='settings'>
						<h2>Settings</h2>
						<div className='settings-content'>
							<AsyncSelect
								className='settings-input' 
								cacheOptions 
								defaultOptions 
								loadOptions={loadStationOptions} 
								onChange={(selectedOption) => selectedOption && setNewStation(selectedOption)} 
								placeholder={getCurrentStation()}
							/>
							<div className='settings-buttons'>
								<button onClick={triggerSettingsHelp}>Help</button>
								<button onClick={triggerSettingsReload}>Reload</button>
								<button onClick={triggerSettingsReset}>Reset</button>
								<button onClick={triggerSettingsConfirm} disabled={newStation?.id === searchParams.get(QUERY_PARAM_STATION_ID)}>Confirm</button>
								<button onClick={triggerSettingsCancel}>Cancel</button>
							</div>
						</div>
						<div className='license'>&copy;{new Date().getFullYear()} Damian Perera | <a href={LICENSE_URL}>AGPL-3.0 License</a></div>
					</div>
				</div>
			)}
			{isLoading && !error && (
				<div className='loading-container' onClick={triggerSettingsModal}>
					<div className='loading-spinner'></div>
					<p className='loading-text'>Loading Departures</p>
				</div>
			)}
			{error && (
				<div className='error-container' onClick={triggerSettingsModal}>
					<p className='error-text'>
						<span className='red'>error &#187;</span> {error.reason}<br />
						<small>{error.message}</small>
					</p>
				</div>
			)}
			<div className='departures-container' onClick={triggerSettingsModal}>
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
																	<td 
																		key={`transport-label-${index}-${destIndex}-${depIndex}`}
																		className='center' 
																		rowSpan={item.destinations.reduce((acc, dest) => acc + dest.departures.length, 0)}
																	>
																		{item.label}
																	</td>
																)}
																<td 
																	key={`destination-${index}-${destIndex}-${depIndex}`} 
																	className='left' 
																	rowSpan={dest.departures.length}
																>
																	{dest.destination}
																</td>
															</React.Fragment>
														)}
														<td key={`departure-${index}-${destIndex}-${depIndex}`} className='right'>
															{departure.sev && (
																<div 
																	key={`sev-${index}-${destIndex}-${depIndex}`} 
																	className='departureNested departureSev'
																>
																	{TEXT_SEV}
																</div>
															)}
															{departure.cancelled && (
																<div
																	key={`cancelled-${index}-${destIndex}-${depIndex}`}
																	className='departureNested departureCancelled blinking'
																>
																	{TEXT_CANCELLED}
																</div>
															)}
															{(departure.delayInMinutes > 0 && !departure.cancelled) && (
																<div 
																	key={`delayed-${index}-${destIndex}-${depIndex}`}
																	className='departureNested departureDelayed'
																>
																	{TEXT_DELAYED}
																</div>
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
