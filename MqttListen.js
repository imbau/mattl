
const mqtt = require('mqtt');
const para = require('./src/james/parameters.js');
const dataStruct = require('./src/james/AT35.js');
const RITItoIIIPGS = require('./src/james/IIIGPS.js').RITItoIIIPGS;
const AT35toIIIPGS = require('./src/james/IIIGPS.js').AT35toIIIPGS;
const oldRITItoIIIPGS = require('./src/james/IIIGPS.js').oldRITItoIIIPGS;
const log_error = require('./src/james/winston'); //log_error(msg)
const AT35Queue = require('./src/james/Queue');
//const { queryflux } = require('./src/james/influxdb')

let QueueRITI=new AT35Queue()
//let oldQueueRITI=new AT35Queue()
let mqtt_client_RITI = mqtt.connect(para.mqtt_broker_ip, para.mqtt_opt);
//gaindata();
mqtt_client_RITI.on('connect', function(){
    console.log('connected to RITI mqtt server');
    mqtt_client_RITI.subscribe(para.mqtt_topic_RITI );
    //mqtt_client_RITI.subscribe(para.mqtt_topic);  
  });
mqtt_client_RITI.on('message',async function(topic, msg){      
    //RITI資料轉IIIGPS格式  
    let data =new RITItoIIIPGS(JSON.parse(msg.toString()))    
    try {
        //資料清洗
        if(QueueRITI.RITI_isBadData(data))
            return 
        //設定車機欄位名稱 及 時間欄位名稱
        let car_id_key='car_id',timestamp_key='timestamp'
        //原始資料塞入Queue返回Queue長度 去除同樣時間資料
        let QueueaLength = QueueRITI.add(data,car_id_key,timestamp_key)        
        //累積多少資料後後處理
        if(QueueaLength>30){
            let gpsArrayLength =await QueueRITI.setQueuetogpsArray(data[car_id_key])
            await QueueRITI.docorrection(data[car_id_key])           
        } 
    } catch (e) {
        log_error({ point: 'mqtt_client_on_message_getDataPerMs', e, data })
    }
});

let Queueat35=new AT35Queue()
let mqtt_client = mqtt.connect(para.mqtt_broker_ip, para.mqtt_opt);
mqtt_client.on('connect', function () {       
	console.log('connected to AT35 mqtt server');
    mqtt_client.subscribe(para.mqtt_topic);    
});
mqtt_client.on('message', async function (topic, msg) 
{
    let date = new Date();
    let data = new dataStruct.data(msg, date.getTime());
    data.unix_t=data.unix_t*1000
    //過濾超過一小時的資料
    if(data.get_data_time-data.unix_t>60*60*1000)
        return        
      
    //原始資料轉成IIIPGS Queue  
          
        data = new AT35toIIIPGS(Queueat35.NL_AT35(data))
        //資料清洗
         if(Queueat35.AT35_isBadData(data))
             return 
        //原始資料塞入Queue返回Queue長度
        let car_id_key='car_id',timestamp_key='timestamp'
        let QueueaLength = Queueat35.add(data,car_id_key,timestamp_key)
        //累積多少資料後後處理
        if(QueueaLength>30){            
            let gpsArrayLength =await Queueat35.setQueuetogpsArray(data[car_id_key])
            await Queueat35.docorrection(data[car_id_key])
        } 
   
});

//撈取舊資料
/*async function gaindata()
{
   
    var starttime=new Date("2020-07-01T08:00:00.000Z");    
    let measurementRITI  = "RITI"    
    let sum=0
    var endtime  = new Date(starttime.toISOString());
    endtime.setMinutes(endtime.getMinutes()+20);
    //停止處理舊資料時間 只要超過
    var dt = new Date();
    while(endtime.getDate()!=dt.getDate())
    {
        let array = await queryflux(starttime,endtime,measurementRITI)    
        
        for(let i in array)
        {            
            try
            {          
           
                cleanolddata(array[i]);
           
            } catch (e) 
            {
           //log_error({ point: 'w', e, data: array[i] })
            }
        }
        //每次都處理20分鐘資料
        starttime=new Date(endtime);
        endtime=new Date(endtime.setMinutes(starttime.getMinutes()+20));
    
        
    } 

}

//清洗riti舊資料
async function cleanolddata(msgdata)
{
    let data =new oldRITItoIIIPGS(msgdata)    
    try {
        //資料清洗
        if(oldQueueRITI.RITI_isBadData(data))
            return 
        //設定車機欄位名稱 及 時間欄位名稱
        let car_id_key='car_id',timestamp_key='timestamp'
        //原始資料塞入Queue返回Queue長度 去除同樣時間資料
        let QueueaLength = oldQueueRITI.add(data,car_id_key,timestamp_key)        
        //累積多少資料後後處理
        if(QueueaLength>30){
            let gpsArrayLength =await oldQueueRITI.setQueuetogpsArray(data[car_id_key])
            await oldQueueRITI.docorrection(data[car_id_key])           
        } 
    } catch (e) {
        log_error({ point: 'mqtt_client_on_message_getDataPerMs', e, data })
    }

}*/
