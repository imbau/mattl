const { InfluxDB, Point, HttpError } = require('@influxdata/influxdb-client');
const para = require('./parameters.js');
const influxdb = new InfluxDB({ url: 'http://' + para.influx_servsr_ip + ':9999', token: para.influx_token });
const writeApi = influxdb.getWriteApi(para.influx_org, para.influx_bucket, 'ms');
const queryApi = influxdb.getQueryApi(para.influx_org);
//const request = require('request');
const http = require('http');

let tags = ["source", "car_id"] //IIIGPS tag欄位

const writeArrayByPoint = async (dataList, measurement) => {
    return new Promise(async function (resolve, reject) {
        try {

            //input Struct IIIPGS
            for (let i = 0; i < dataList.length; i++)
            {

                let point = new Point(measurement)
                    .timestamp(new Date(dataList[i].timestamp));
                let key = Object.keys(dataList[i]);
                for (let x in tags) {
                    let tag = key.splice(key.findIndex(t => t == tags[x]), 1)
                    point.tag(tag, dataList[i][tag])
                }
                for (let j in key) {
                    if (key[j] == 'timestamp')
                        continue;
                    else if(key[j] == 'IIIspeedtype')
                    point.stringField(key[j], dataList[i][key[j]]);
                    else
                        point.floatField(key[j], dataList[i][key[j]]);
                }

                 let options = {
                    hostname: 'localhost',
                    port: "10299",
                    path: '/labeling',
                    method: 'POST',
                    headers: 
                    {
                      'Content-Type': 'application/json'
                    }
                  }
                  let req = http.request(options, (res) => {});
                  req.on('error', (error) => { console.error(error)});
                  req.write(JSON.stringify(dataList[i]) );
                  req.end();
                await writeApi.writePoint(point);
                }
            console.log(dataList[0].car_id)
            // writeApi
            //     .close()
            //     .then(() => {
            //         //console.log('FINISHED ... now try ./query.ts')
            //         resolve({error:false,dataList})
            //     })
            //     .catch(e => {
            //         //console.error(e)
            //         if (e instanceof HttpError && e.statusCode === 401) {
            //             console.log('Run ./onboarding.js to setup a new InfluxDB database.')
            //         }
            //         console.log('\nFinished ERROR')
            //         reject({error:true,dataList,e})
            //     })
        } catch (e) {
            console.log(e)
        }
    })
}

async function writetest(body) {
    let point1 = new Point(para.IIIGPS_measurement)
        .timestamp(body.timestamp)
        .tag('car_id', body.car_id)
        .floatField('lon', body.lon)
        .floatField('lat', body.lat)
        .floatField('speed', body.speed)
    await writeApi.writePoint(point1);
    await writeApi.flush();
}
let body = {
    car_id: "12345", speed: 100, source: "test", lon: 120, lat: 25
}
let count = 0

async function queryflux(starttime, endtime, measurementRITI)
 {
    return new Promise((resolve, reject) => {
        let array = []

        const fluxQuery =
            'from(bucket: "' + para.influx_bucket + '")' +
            '|> range(start: ' + starttime.toISOString() + ', stop: ' + endtime.toISOString() + ')' +
            '|> filter(fn: (r) => r["_measurement"] == "' + measurementRITI + '")' +
            '|> pivot(columnKey: ["_field"], valueColumn: "_value", rowKey: ["_time"])';
           
        //let queryApi = toolModel.getqueryApi();
        queryApi.queryRows(fluxQuery,
            {
                next(row, tableMeta) {
                    array.push(tableMeta.toObject(row))
                },
                error(error) {
                    console.log('QUERY FAILED', error)
                    reject(0)
                },
                complete() {
                    resolve(array)
                },
            });
    })
}


module.exports = { writeArrayByPoint, queryflux };
