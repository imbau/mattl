const AT35toIIIPGS = require('./IIIGPS.js').AT35toIIIPGS;
const {   keynotZero } = require('./claer');
const { correction } = require('./correction');
const { writeArrayByPoint } = require('./influxdb')
const para = require('./parameters.js');

class AT35Queue {
    constructor() {
        this.Queue = {};   //原始資料Queue表     
        this.gpsArray = {};//待寫入表
        this.lastgpsArray = {};//最後點位表
    }
    //檢查資料欄位皆不為零
    iskeynotZero(data,keyarray) {
        return !keynotZero(data, keyarray)
    }
    //RITI檢查資料
    RITI_isBadData(data) {
        return !keynotZero(data, ["car_id", "lat", "lon"])
    }    
    //AT35檢查資料 不符合回傳 true 
    AT35_isBadData(data) {
        //cal_status 個位數為2(正常校正) 衛星數大於3  
        if (data.sats > 3  || data.cal_status % 10 == 2 ) 
        {
            //檢查 id 經緯 皆不為零
            if (keynotZero(data, ["car_id", "lat","lon"]))
                return false       
                else
                return true     
        } else
            return true
    }
    //加入資料到Queue
    add(data,key,timestamp_key) {       
        let car_id=data[key]        
        if (!this.Queue[car_id]) {
            this.Queue[car_id] = [data]
        } else {
            //不加入重複timestamp的資料進Queue
            if (this.Queue[car_id].length==0 || this.Queue[car_id].findIndex(a=>a[timestamp_key]==data[timestamp_key])==-1)
                this.Queue[car_id].push(data)
        }
        return this.Queue[car_id].length
    }
    //將Queue移到gpsarray等待寫入
    setQueuetogpsArray(id){
        this.gpsArray[id]=this.Queue[id].splice(0).sort((a,b)=>{return a.timestamp<b.timestamp?-1:1})
    }
    //將AT35 正規化 選一筆
    NL_AT35(data){        
        let key = Object.keys(data).filter(index => Array.isArray(data[index]))
        for (let j = data.e_lat.length-1; j >=  0; j--) 
        {
            if(data.e_lat[j] !=0 && data.e_lon[j] !=0 ){
                for (let k in key) {
                    data[key[k]] = data[key[k]][j]
                }                
                return data
            }
                
        }
        data.e_lat=0
        data.e_lon=0
        return data

    }
    //AT35拆分資料 一筆拆成五比
    async splitrowdata(id) {
        for (let i = 0; i < this.Queue[id].length; i++) {
            //排序Queue內的資料
            this.Queue[id].sort((a,b)=>{return a.unix_t<b.unix_t?-1:1})
            let key = Object.keys(this.Queue[id][i]).filter(index => Array.isArray(this.Queue[id][i][index]))
            let secdatanum = this.Queue[id][i][key[0]].length
            let IMUGPScount = 0
            for (let j = 0; j < secdatanum; j++) {
                let gps = Object.assign({}, this.Queue[id][i])
                if (gps.e_lat[j] == 0 && gps.e_lon[j] == 0) {
                    IMUGPScount++
                    continue;
                }
                for (let k in key) {
                    gps[key[k]] = this.Queue[id][i][key[k]][j]
                }
                //若一秒內傳兩筆要將時間攤平超過一秒已一秒計算                
                if (i == 0) {
                    gps.unix_t -= (secdatanum - 1 - j) * 1000 / secdatanum;
                } else {
                    let interval = this.Queue[id][i].unix_t - this.Queue[id][i - 1].unix_t
                    gps.unix_t -= (secdatanum - 1 - j) * (interval > 1000 ? 1000 : interval) / secdatanum;
                }
                gps = new AT35toIIIPGS(gps)
                //imu有資料才存
                if (keynotZero(gps, ["e_lat", "e_lon"])) {
                    gps.lat = gps.e_lat
                    gps.lon = gps.e_lon
                    this.addtogpsArray(gps)
                    IMUGPScount++
                }
            }
            if (IMUGPScount == 0) {
                //IMUGPS沒資料 車機有但不塞                
            }
        }
        this.Queue[id].length=0
        return this.gpsArray[id].length
    }
    addtogpsArray(gps) {
        if (!this.gpsArray[gps.car_id])
            this.gpsArray[gps.car_id] = [gps];
        else
            this.gpsArray[gps.car_id].push(gps)
        return this.gpsArray[gps.car_id].length
    }
    //gps校正
    async docorrection(id) {
        //紀錄最後點位
        let correctArray, lastpoint
        if (!!this.lastgpsArray[id]) {
            if (this.gpsArray[id][0].timestamp - this.lastgpsArray[id].timestamp > 3000 || this.gpsArray[id][0].timestamp - this.lastgpsArray[id].timestamp < 0)
                delete this.lastgpsArray[id]
            else
                lastpoint = JSON.parse(JSON.stringify(this.lastgpsArray[id]))
        }        
        this.lastgpsArray[id] = this.gpsArray[id].slice(-1)[0]
        correctArray = await correction(this.gpsArray[id].splice(0), lastpoint)
         writeArrayByPoint(correctArray, para.IIIGPS_measurement)
    }
    getgpsArray() {
        return this.gpsArray;

    }
}




module.exports = AT35Queue;