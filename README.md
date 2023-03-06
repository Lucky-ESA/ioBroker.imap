![Logo](admin/imap.png)

# ioBroker.imap

[![GitHub license](https://img.shields.io/github/license/Lucky-ESA/ioBroker.imap)](https://github.com/Lucky-ESA/ioBroker.imap/blob/main/LICENSE)
[![NPM version](https://img.shields.io/npm/v/iobroker.imap.svg)](https://www.npmjs.com/package/iobroker.imap)
[![Downloads](https://img.shields.io/npm/dm/iobroker.imap.svg)](https://www.npmjs.com/package/iobroker.imap)
![Number of Installations](https://iobroker.live/badges/imap-installed.svg)
![Current version in stable repository](https://iobroker.live/badges/imap-stable.svg)

[![NPM](https://nodei.co/npm/iobroker.imap.png?downloads=true)](https://nodei.co/npm/iobroker.imap/)

**Tests:** </br>
![Test and Release](https://github.com/Lucky-ESA/ioBroker.imap/workflows/Test%20and%20Release/badge.svg)
[![CodeQL](https://github.com/Lucky-ESA/ioBroker.imap/actions/workflows/codeql.yml/badge.svg)](https://github.com/Lucky-ESA/ioBroker.imap/actions/workflows/codeql.yml)
![Snyk Vulnerabilities for GitHub Repo](https://img.shields.io/snyk/vulnerabilities/github/Lucky-ESA/ioBroker.imap)

## imap adapter for ioBroker

Monitor your email accounts via IMAP (Internet Message Access Protocol)

## Tested with

-   1und1
-   gmail [app-password](https://support.google.com/mail/answer/185833?hl=de)
-   vodafone
-   strato

## Description and Questions

🇬🇧 [Description](/docs/en/README.md)</br>
🇩🇪 [Beschreibung & Fragen](https://forum.iobroker.net/topic/63400/test-adapter-iobroker-imap-v0-0-1-github)

## Changelog

<!--
    Placeholder for the next version (at the beginning of the line):
    ### **WORK IN PROGRESS**
-->

### **WORK IN PROGRESS**

-   (Lucky-ESA) Added: Limited reconnected (5 max)
-   (Lucky-ESA) Added: into datapoints
-   (Lucky-ESA) Added: Password entry not possible without an active instance
-   (Lucky-ESA) Added: Added description to reradme
-   (Lucky-ESA) Fix: debug output without attachments
-   (Lucky-ESA) Fix: wrong json_table
-   (Lucky-ESA) Fix: value null
-   (Lucky-ESA) Change: Reconnected change info level to debug level
-   (Lucky-ESA) Change: correct dp roles

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
