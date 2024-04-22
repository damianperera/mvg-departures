# MVG Departures

[![CI](https://github.com/damianperera/mvg-departures/actions/workflows/ci.yml/badge.svg)](https://github.com/damianperera/mvg-departures/actions/workflows/ci.yml) [![CD](https://github.com/damianperera/mvg-departures/actions/workflows/cd.yml/badge.svg)](https://github.com/damianperera/mvg-departures/actions/workflows/cd.yml) [![CodeQL](https://github.com/damianperera/mvg-departures/actions/workflows/github-code-scanning/codeql/badge.svg)](https://github.com/damianperera/mvg-departures/actions/workflows/github-code-scanning/codeql)

# Purpose

This web application is designed to serve as a live MVG transport tracker for your home or office, similar to the live schedules displayed at bus/tram halts and train stations. The application is designed to accommodate both touch and keyboard inputs.

# Changing Stations

To switch your station click on the screen or press `Ctrl` + `1`, click on the station list and start typing your station's name. Once you select your station the application will reload to display the applicable journeys.

> Reloading the application will not clear the station. To reset the application to its defaults click on the `Reset` button in the settings screen or press `Ctrl` + `0`.

# Updates

The application will automatically fetch and apply the latest update at 03:00 am CET/CEST. Dependabot updates have been configured to ensure that security vulnerabilities are patched as soon as fixes are made available.

# Shortcuts

- `Ctrl` + `1` - Open settings
- `Ctrl` + `9` - Reload app
- `Ctrl` + `0` - Reset app to defaults

# Installation Recommendation

Use an RPi or similar low-powered SBC with a low-energy e-Ink display as a permanent installation for this tracker.
  
