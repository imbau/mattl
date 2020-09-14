const { writeArrayByPoint,queryflux } = require('./influxdb')
//const log_error = require('./winston'); //log_error(msg)
const AT35Queue = require('./Queue');
const AT35toIIIPGS = require('./IIIGPS.js').AT35toIIIPGS;

let Queueat35=new AT35Queue()
async function main(){
    let starttime=new Date("2020-07-01T08:00:00.000Z");    
    let measurementRITI  = "AT35"    
    let sum=0
    while(1){
        let endtime  = new Date(starttime.toISOString());
        endtime.setMinutes(endtime.getMinutes()+5)
        let array = await queryflux(starttime,endtime,measurementRITI)    
       // console.log("第"+starttime.toISOString()+"  "+array.length)
        for(let i in array){            
        try {                    
            let data =new AT35toIIIPGS({...array[i],get_data_time:new Date().getTime(),unix_t:new Date(array[i]._time).getTime()+100*parseInt(array[i].sec_point)})            

            //資料清洗
            if(Queueat35.AT35_isBadData(data))
                continue 
            //原始資料塞入Queue返回Queue長度
            let car_id_key='car_id',timestamp_key='timestamp'
            let QueueaLength = Queueat35.add(data,car_id_key,timestamp_key)
            //累積多少資料後後處理
            if(QueueaLength>60){                
                await Queueat35.setQueuetogpsArray(data.car_id)
                await Queueat35.docorrection(data.car_id)
    
            } 
        } catch (e) {
           //log_error({ point: 'w', e, data: array[i] })
        }
    }
    
        
    }    
    
    //console.log(new Date())


}



module.exports = {main};