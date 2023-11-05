![Logo](admin/imap.png)

# ioBroker.imap

**Infos:** </br>
[![GitHub license](https://img.shields.io/github/license/Lucky-ESA/ioBroker.imap)](https://github.com/Lucky-ESA/ioBroker.imap/blob/main/LICENSE)
[![NPM version](https://img.shields.io/npm/v/iobroker.imap.svg)](https://www.npmjs.com/package/iobroker.imap)
[![Downloads](https://img.shields.io/npm/dm/iobroker.imap.svg)](https://www.npmjs.com/package/iobroker.imap)
![Number of Installations](https://iobroker.live/badges/imap-installed.svg)
![GitHub size](https://img.shields.io/github/repo-size/Lucky-ESA/ioBroker.imap)</br>
![GitHub commit activity](https://img.shields.io/github/commit-activity/m/Lucky-ESA/ioBroker.imap)
![GitHub commits since latest release](https://img.shields.io/github/commits-since/Lucky-ESA/ioBroker.imap/latest)
![GitHub last commit](https://img.shields.io/github/last-commit/Lucky-ESA/ioBroker.imap)
![GitHub issues](https://img.shields.io/github/issues/Lucky-ESA/ioBroker.imap)</br>
**Version:** </br>
![Beta](https://img.shields.io/npm/v/iobroker.imap.svg?color=red&label=beta)

[![NPM](https://nodei.co/npm/iobroker.imap.png?downloads=true)](https://nodei.co/npm/iobroker.imap/)

**Tests:** </br>
![Test and Release](https://github.com/Lucky-ESA/ioBroker.imap/workflows/Test%20and%20Release/badge.svg)
[![CodeQL](https://github.com/Lucky-ESA/ioBroker.imap/actions/workflows/codeql.yml/badge.svg)](https://github.com/Lucky-ESA/ioBroker.imap/actions/workflows/codeql.yml)

## imap adapter for ioBroker

-   Monitor your email accounts via IMAP (Internet Message Access Protocol)
-   Receive notification of new emails or updates (e. g. marked unseen)
-   Simple login with password and username (without xoauth2 or xoauth).

## Requirements

-   Node >= 16
-   ~150 MB free ram

## Tested with

-   1und1
-   gmail [app-password](https://support.google.com/mail/answer/185833?hl=de)
-   vodafone
-   strato
-   outlook (e. g. [outlook 2Factor authentication](https://mcuiobroker.gitbook.io/jarvis-infos/tipps/allgemein/microsoft-windows/2-fach-authentifizierung))

## Description

🇬🇧 [Description](/docs/en/README.md)</br>
🇩🇪 [Beschreibung](/docs/de/README.md)

## Questions

🇩🇪 [Fragen](https://forum.iobroker.net/topic/63400/test-adapter-iobroker-imap-v0-0-1-github)

## Changelog

<!--
    Placeholder for the next version (at the beginning of the line):
    ### **WORK IN PROGRESS**
-->

### **WORK IN PROGRESS**

-   (Lucky-ESA) Missing translate

### 0.1.1 (2023-09-11)

-   (Lucky-ESA) Delete wrong error parse message

### 0.1.0 (2023-09-06)

-   (Lucky-ESA) Added RAM consumption - Instance Settings
-   (Lucky-ESA) Added german documention
-   (Lucky-ESA) Added Mailparser options
-   (Lucky-ESA) Added counter history
-   (Lucky-ESA) Bug fixes

### 0.0.9 (2023-07-26)

-   (Lucky-ESA) Fixed RAM consumption of new emails
-   (Lucky-ESA) Added counter attachments in JSON

### 0.0.8 (2023-07-13)

-   (Lucky-ESA) Fix refresh crash
-   (Lucky-ESA) Added MB threshold

### 0.0.7 (2023-04-25)

-   (Lucky-ESA) Fix correct counter for seen and unseen
-   (Lucky-ESA) Added capabilities
-   (Lucky-ESA) Criteria change without restart
-   (Lucky-ESA) Added outlook.office365.com oauth2 login
-   (Lucky-ESA) Added Connection.js from Module to Adapter
-   (Lucky-ESA) Bug fixes

### 0.0.6 (2023-03-17)

-   (Lucky-ESA) Added trigger move or copy emails
-   (Lucky-ESA) Added JSON for multiple IMAP accounts
-   (Lucky-ESA) Bug fixes

### 0.0.5 (2023-03-15)

-   (Lucky-ESA) Added: Limited reconnected (5 max)
-   (Lucky-ESA) Added: into datapoints
-   (Lucky-ESA) Added: Password entry not possible without an active instance
-   (Lucky-ESA) Added: Added description to readme
-   (Lucky-ESA) Added: Added move or copy
-   (Lucky-ESA) Added: Set flag with datapoints
-   (Lucky-ESA) Fix: debug output without attachments
-   (Lucky-ESA) Fix: wrong json_table
-   (Lucky-ESA) Fix: value null
-   (Lucky-ESA) Change: Reconnected change info level to debug level
-   (Lucky-ESA) Change: correct dp roles
-   (Lucky-ESA) Change: delete attachments (too much RAM usage)

### 0.0.4 (2023-03-03)

-   (Lucky-ESA) Fix json_table

### 0.0.3 (2023-03-03)

-   (Lucky-ESA) Beta release

### 0.0.2 (2023-03-03)

-   (Lucky-ESA) initial release

## License

MIT License

Copyright (c) 2023 Lucky-ESA <github@luckyskills.de>

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
