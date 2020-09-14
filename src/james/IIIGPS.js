/* AT35 from mqtt
cal_status:0
e_heading:(5) [0, 99, 99, 98, 97]
e_lat:(5) [0, 22702552, 22702555, 22702562, 22702568]
e_lon:(5) [0, 120393364, 120393553, 120393681, 120393769]
e_spd:(5) [0, 4, 5, 6, 7]
event_id:3
get_data_time:1596684021552
heading:0
i_lat:22702555
i_lon:120393734
inputs:1
mileage:0
outputs:0
pitch:(5) [0, 0, 0, 0, 0]
roll:(5) [0, 0, 0, 0, 0]
sats:11
spd:0
unit_id:31902951
unix_t:1596072722
volt:11.774999618530273
x:(5) [0.8125, 0.75, 0.8125, 0.84375, 0.8125]
y:(5) [-0.375, -0.375, -0.375, -0.34375, -0.34375]
yaw:(5) [0, 0, 0, 0, 0]
z:(5) [0.46875, 0.4375, 0.4375, 0.46875, 0.46875]
*/

function AT35toIIIPGS(data) {
    //套圖後產生
    //this.IIIspeed    最終III速度
    //this.iii_cal_spd 套圖後的位置計算速度
    //this.cal_spd     原始位置計算速度
    this.timestamp = data.unix_t;
    this.get_data_time = data.get_data_time;
    this.source = 'AT35';        //資料來源 
    this.car_id = data.unit_id;    //車機IMEI    
    this.lon = !data.e_lon? !data.i_lon?0: settoFloat(3,data.i_lon)  : settoFloat(3,data.e_lon);          //經度 IMU or 車機
    this.lat = !data.e_lat? !data.i_lat?0:settoFloat(2,data.i_lat) :settoFloat(2,data.e_lat);          //緯度 IMU or 車機
   
    this.i_lon =!data.i_lon?0: settoFloat(3,data.i_lon);  //車機緯度
    this.i_lat =!data.i_lat?0: settoFloat(2,data.i_lat);  //車機經度
    this.e_lon =!data.e_lon?0: settoFloat(3,data.e_lon);  //IMU經度
    this.e_lat =!data.e_lat?0: settoFloat(2,data.e_lat);  //IMU緯度
    
    if(data.cal_status % 10 != 2 && data.sats > 3){ 
        if(!!data.i_lon)this.lon = this.i_lon
        if(!!data.i_lat)this.lat = this.i_lat
    }
    this.speed = data.spd;          //速度
    this.mileage = data.mileage;    //累積里程數  
    this.heading = data.heading;    //方向角

    this.event_id = data.event_id;  //事件id
    this.inputs = data.inputs;      //輸入 ex:電門入入
    this.outputs = data.outputs;    //輸出 ex:警報器
    this.sats = data.sats;          //衛星數    
    this.volt = data.volt;          //電壓

    this.x = data.x;                //g-sensor
    this.y = data.y;                //g-sensor
    this.z = data.z;                //g-sensor
    this.yaw = data.yaw;            //gyroscope +-180
    this.roll = data.roll;          //gyroscope
    this.pitch = data.pitch;        //gyroscope

    
    this.e_spd = data.e_spd;            //IMU速度    
    this.e_heading = data.e_heading;    //IMU方向角
    this.cal_status = data.cal_status;  //IMU校正狀態  十位數 IMU衛星數  個位數 校正狀態 2(正常)
    // this.rpm = data.rpm;                //引擎轉速 RITIonly
    // this.errcode = data.errcode;        //引擎轉速 RITIonly
    // this.estmileage = data.estmileage;  //估計里程 RITIonly
     if(this.cal_status % 10 == 2){
        this.speed = data.e_spd
        this.carspeed = data.spd
    } 
}

/* riti from mqtt
device_id:'c0c8'
errcode:'0'
estmileage:'17'
gps:{longitude: '120.316696', latitude: '22.665728'}
gsensor:{x: '0.905', y: '0.06', z: '0.042'}
heading:'10.9'
mileage:'221.8'
rpm:'4038'
speed:'46'
time:'2020-08-06T03:18:54.260Z'
type:'riti'
*/
function RITItoIIIPGS(data) {
    this.timestamp = new Date(data.time).getTime();
    //this.get_data_time = data.get_data_time;
    this.source = 'RITI';            //資料來源     
    this.car_id = data.device_id;                //車機cid    
    this.lon = parseFloat(data.gps.longitude);          //經度
    this.lat = parseFloat(data.gps.latitude);           //緯度
    this.speed = data.speed;            //速度
    this.mileage = data.mileage;        //累積里程數  
    this.heading = data.heading;    //方向角

    this.rpm = data.rpm;                //引擎轉速
    this.errcode = data.errcode;        //引擎轉速
    this.estmileage = data.estmileage;  //估計里程   
    this.x = data.gsensor.x;                //g-sensor
    this.y = data.gsensor.y;                //g-sensor
    this.z = data.gsensor.z;                //g-sensor 
}
 
function oldRITItoIIIPGS(data) {
    this.timestamp = new Date(data._time).getTime();
    //this.get_data_time = data.get_data_time;
    this.source = 'RITI';            //資料來源     
    this.car_id = data.cid;                //車機cid    
    this.lon = parseFloat(data.longitude);          //經度
    this.lat = parseFloat(data.latitude);           //緯度
    this.speed = data.speed;            //速度
    this.mileage = data.mileage;        //累積里程數  
    this.heading = data.direction;    //方向角

    this.rpm = data.rpm;                //引擎轉速
    this.errcode = data.errcode;        //引擎轉速
    this.estmileage = data.estmileage;  //估計里程   
    this.x = data.x;                //g-sensor
    this.y = data.y;                //g-sensor
    this.z = data.z;                //g-sensor 
}
function settoFloat(index,num){
    let s=num.toString();
    return parseFloat(s.slice(0, index) + "." + s.slice(index))
}
    

module.exports = {AT35toIIIPGS,RITItoIIIPGS,oldRITItoIIIPGS};
