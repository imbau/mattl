
const limit ={
    IMU_cal_status:2, //個位數2 狀態正常    
    sats:3,
    BasicKey:["car_id","lat","lon"],
    AT35Key:["IMU_lan","IMU_lon"],
}

function keynotZero(obj,key){
    for(let i in key){
        if(!obj[key[i]])
            return false            
    }
    return true
}

function clear(array){
    //車機編號 經緯度不為0
    array.filter(data=>!!data.car_id || !!data.lat || !!data.lon)
    //AT35IMU 經緯度不為0  cal_status 個位數為2(正常校正) 衛星數大於3  
    if(array[0].source=='AT35')
        array.filter(data=> !!data.IMU_lat || !!data.IMU_lon || data.IMU_cal_status % 10 ==limit.IMU_cal_status  || data.sats > limit.sats)
    return new Array(array)
}

function check(gps){
    return keynotZero(gps,limit.BasicKey) && keynotZero(gps,limit.AT35Key)
}





module.exports = {clear,check,keynotZero};