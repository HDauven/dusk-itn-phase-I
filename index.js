const fs = require('fs');
const readline = require('readline');

let provisionerMap = new Map();
let blockTimesMap = new Map();
let blockSeries = new Map();
let transactionCounter = 0;
let blockCounter = 0;

const rl = readline.createInterface({
    input: fs.createReadStream('dusk.log')
});

rl.on('line', (line) => {
    let jsonLine;
    try {
        jsonLine = JSON.parse(line);
    } catch (e) {
        console.log(`Error: ${e}`);
        return;
    }
    let provisioner = jsonLine.generator;
    if (jsonLine.msg.includes("Accepted block")) {
        if (provisionerMap.has(provisioner)) {
            provisionerMap.set(provisioner, { Accepted: provisionerMap.get(provisioner).Accepted + 1, Missed: provisionerMap.get(provisioner).Missed });
        }
        else {
            provisionerMap.set(provisioner, { Accepted: 1, Missed: 0 });
        }
        return;
    }
    else if (jsonLine.msg.includes("Missed block")) {
        if (provisionerMap.has(provisioner)) {
            provisionerMap.set(provisioner, { Accepted: provisionerMap.get(provisioner).Accepted, Missed: provisionerMap.get(provisioner).Missed + 1 });
        }
        else {
            provisionerMap.set(provisioner, { Accepted: 0, Missed: 1 });
        }
        return;
    }

    let blockHeight = jsonLine.height;
    let blockTime = jsonLine.block_time;
    let txsCount = jsonLine.txs_count;
    if (blockTime && jsonLine.msg.includes("complete")) {
        blockSeries.set(blockHeight, blockTime);
        if (blockTimesMap.has(blockTime)) {
            blockTimesMap.get(blockTime).count++;
            blockTimesMap.get(blockTime).txsCount += txsCount;
            transactionCounter += txsCount;
            if (blockTimesMap.get(blockTime).txsCountOccurrences.has(txsCount)) {
                blockTimesMap.get(blockTime).txsCountOccurrences.set(txsCount, blockTimesMap.get(blockTime).txsCountOccurrences.get(txsCount) + 1);
            } else {
                blockTimesMap.get(blockTime).txsCountOccurrences.set(txsCount, 1);
            }
        } else {
            blockTimesMap.set(blockTime, { count: 1, txsCount: txsCount, txsCountOccurrences: new Map().set(txsCount, 1) });
        }
    }
});

rl.on('close', () => {
    let data = {
        provisionerData: {},
        results: {
            provisionerCount: 0,
            provisionerAcceptedCount: 0,
            provisionerMissedCount: 0,
            provisionerAccepted: [],
            provisionerMissed: [],
            totalTransactions: transactionCounter,
            totalBlocks: blockCounter,
            block_times: {},
            blockSeries: {}
        }
    };

    for (let [key, value] of provisionerMap.entries()) {
        data.provisionerData[key] = value;
        data.results.provisionerCount++;
        if (value.Accepted > 0) {
            data.results.provisionerAccepted.push(key);
            data.results.provisionerAcceptedCount++;
        }
        if (value.Accepted === 0) {
            data.results.provisionerMissed.push(key);
            data.results.provisionerMissedCount++;
        }
    }

    for (let [key, value] of blockTimesMap.entries()) {
        data.results.block_times[key] = {
            count: value.count,
            txsCount: value.txsCount,
            txsCountOccurrences: Object.fromEntries(value.txsCountOccurrences)
        };
    }

    let newBlockSeries = new Map();
    let sum = 0;
    let count = 0;
    let keyCount = 1;

    for (let [blockHeight, blockTime] of blockSeries.entries()) {
        sum += blockTime;
        count++;
        if (count % 100 === 0) {
            newBlockSeries.set(keyCount, sum / 100);
            sum = 0;
            count = 0;
            keyCount++;
        }
    }

    for (let [key, value] of newBlockSeries.entries()){
        console.log(key, value)
        data.results.blockSeries[key] = value;
    }

    fs.writeFile("provisioners.json", JSON.stringify(data), (err) => {
        if (err) {
            console.log("An error occurred while saving the file.");
            console.error(err);
            return;
        }
        console.log("File has been saved.");
    });

});
