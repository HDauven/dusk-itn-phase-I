# Dusk ITN phase I analysis

This repo contains a simple script to extract information about provisioners from the `dusk.log` node logs.
It also collects information about blocks and transactions.

Furthermore, this repository comes with two charts you can explore. Simply open them in any browser to observe it with default provided data.

The `provisioners.json` file shows the public provisioner keys of ITN phase I participants. It shows how many times a provisioner was selected, how many times a privisioner accepted a block or missed one.

## Prerequisites

- NodeJS v18 or higher
- Place a complete `dusk.log` file next to the `index.js` file.

## How to run

Make sure all prerequisites are met.

Run `node index.js` or `npm run start` in this directory.

## Charts

The `blockTimes.html` file contains a bar chart showing the frequency of blocks with a given block time.

The `blockTimesTransactions.html` file contains a scatter plot showing the relation between block time, transactions per block and its frequency.

To update the data used in the charts, simply update the `data` variable with your own dataset.