const axios = require('axios');
const para = require('./parameters.js');
//加速度修正限制值
const limitspeedchange = 10



const measure = (lat1, lon1, lat2, lon2) => {  // generally used geo measurement function
  let R = 6378.137; // Radius of earth in KM
  let dLat = lat2 * Math.PI / 180 - lat1 * Math.PI / 180;
  let dLon = lon2 * Math.PI / 180 - lon1 * Math.PI / 180;
  let a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  let c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  let d = R * c;
  return d * 1000; // meters
}

//get speed 
function getSpeed(gps1,gps2,lat_key,lon_key){
  let t = gps2.timestamp - gps1.timestamp
  let m = measure(gps1[lat_key], array[i].lon, array[i - 1].lat, array[i - 1].lon)
}

async function correction(array, lastpoint) {    
  //是否要帶入最後點位計算
  let lastpointflag = !!lastpoint && lastpoint.timestamp != array[0].timestamp
  let correctionarray =[]
  if (lastpointflag )
    array.unshift(lastpoint)
  else
    array[0].iiispd=0 
  //校正api
  array = await getridgps(array)
  //array[0].cal_spd=array[0].e_spd

  for (let i = 1; i < array.length; i++) {
    try{
    let t = array[i].timestamp - array[i - 1].timestamp
    let iii_m,m = measure(array[i].lat, array[i].lon, array[i - 1].lat, array[i - 1].lon)
    array[i].cal_spd =!t?0: 3600 * m / t; // m/ms => km/hr
    //array[i].cal_spd = cal_speed_correction(array,"cal_spd",i)

    if(!!array[i].III_lat && !!array[i].III_lon){
      iii_m = measure(array[i].III_lat, array[i].III_lon, array[i - 1].III_lat, array[i - 1].III_lon)
      array[i].iii_cal_spd =!t?0: 3600 * iii_m / t; // m/ms => km/hr      
      //array[i].iii_cal_spd = cal_speed_correction(array,"iii_cal_spd",i)
    }else{
      array[i].iii_cal_spd =0
      array[i].III_lat=array[i].lat
      array[i].III_lon=array[i].lon
    }          
  }catch(e){
    array[i].iii_cal_spd=0
  }          
  
  if(array[i].iii_cal_spd > 0 && Math.abs(array[i].iii_cal_spd-array[i].speed) <limitspeedchange){
    array[i].IIIspeed=array[i].iii_cal_spd
    array[i].IIIspeedtype='iii_cal_spd'
  }else{
    if(array[i].iii_cal_spd == 0 && array[i].speed ==0){
      array[i].IIIspeed = 0
      array[i].IIIspeedtype='iii_cal_spd'
    }else{
      if(array[i].cal_spd > 0 && Math.abs(array[i].cal_spd-array[i].speed) <limitspeedchange){
        array[i].IIIspeed=array[i].cal_spd
        array[i].IIIspeedtype='cal_spd'        
      }else {
        if(array[i].cal_spd == 0 && array[i].speed ==0){
          array[i].IIIspeed=0
          array[i].IIIspeedtype='cal_spd' 
        }else {
          let iiiInterpolation = cal_speed_correction(array,"iii_cal_spd",i)
          let Interpolation = cal_speed_correction(array,"cal_spd",i)
          if( Math.abs(iiiInterpolation-array[i].speed) < limitspeedchange ){
            array[i].IIIspeed=iiiInterpolation
            array[i].IIIspeedtype='iiiInterpolation' 
          }
          else if(Math.abs(Interpolation-array[i].speed) < limitspeedchange  ){
            array[i].IIIspeed=Interpolation
            array[i].IIIspeedtype='Interpolation' 
          }
          else {
            array[i].IIIspeed=array[i].speed
            array[i].IIIspeedtype='speed' 
          }
        }
      }
    }
  }
}
for (let i = 1; i < array.length; i++) {
  if(i>5)
  {
    array[i].mean2secIIIspeed=(array[i].IIIspeed+array[i-1].IIIspeed+array[i-2].IIIspeed+array[i-3].IIIspeed+array[i-4].IIIspeed)/5
  }else
  {
    array[i].mean2secIIIspeed=(array[i].IIIspeed+array[i-1].IIIspeed)/2
  }
 
}

  if (lastpointflag)
  array.shift()
  //console.log(ridarray);

  return array.filter(a=>a.mean2secIIIspeed>=0 && a.mean2secIIIspeed<=150)
}
async function getridgps(array) {
  let url = "http://" + para.influx_servsr_ip + '/api/v20q2/AdjustGPSByRouteRid'
  let {data:{ result, cvtdata }} = await axios.post(url, array.map(gps => [gps.lat, gps.lon])).catch(
    function (error) { 
      return Promise.resolve({data:{result:false}})
    }
  )
  if (result) {
    return array.map((currElement, index)=>{
      currElement.III_lat=cvtdata.lat[index]
      currElement.III_lon=cvtdata.lon[index]
      currElement.rid=cvtdata.rid[index]
      return currElement
    })
  }else
    return array
}

function cal_speed_correction(array,key,i){
  if(Math.abs(array[i][key]-array[i].speed )> limitspeedchange){
    if(!array[i+1]){
      return Interpolation(array[i-2],array[i-1],array[i],"speed")
    }else{
      return Interpolation(array[i-1],array[i],array[i+1],"speed")
    }
  }else
    return !!array[i][key]<0?0:array[i].speed

}

//以ab求c的插補
function Interpolation(a,b,c,key)
{
  let Interpolation = parseFloat(a[key] )+ parseFloat((b[key]-a[key])/(b.timestamp-a.timestamp)*(c.timestamp-a.timestamp))
  if(Interpolation<0)
    Interpolation=0
  else if(Interpolation>limitspeedchange){
    Interpolation = (a.speed + b.speed)/2
  }  
  return Interpolation
}


module.exports = { correction }
