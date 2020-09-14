const mongo_servsr_ip = '10.0.5.5';

//const influx_servsr_ip = 'localhost';
const influx_servsr_ip = '52.185.174.41';//'52.185.174.41';
const influx_org = 'iii';
const influx_token = 'ljVzNFswSCz3Zup7jwktkw0uF6-3DD7b__hFf7zLsvD9OJc9uVQtXCb5GxsZuL9LUf227oWutog4Gzg5IdSs7w==';

const influx_bucket = 'moto';
const AT35_measurement = 'AT35';
const AT35_clean_measurement = 'AT35_clean';
//const AT35_track_list_measurement = 'track_ranges';
const AT35_track_list_measurement = 'track_ranges_1';
const AT35_speed_measurement = 'cal_speed'

const IIIGPS_measurement = 'IIIGPS';
const influx_start_time = '2020-04-30T00:00:00.0Z'
const influx_track_cut_time = 60; //sec

//====================================================
//const mqtt_broker_ip = 'mqtt://localhost';
const mqtt_broker_ip = 'mqtt://52.185.174.41';
const mqtt_topic = 'AT35/+/Message';
const mqtt_topic_RITI = 'RITI/+/Message';
const mqtt_topic_RITI_Rawdata = 'RITI/+/Rawdata';


const mqtt_opt = {
  port:1883,

};

//====================================================
const correction_port = 10099;  //套圖
const cleaner_port = 10199;     //cleaner

//====================================================
para = {
  mongo_servsr_ip, influx_servsr_ip,
  influx_org, influx_token, influx_bucket,
  AT35_measurement, AT35_clean_measurement, AT35_track_list_measurement, AT35_speed_measurement,IIIGPS_measurement,
  influx_start_time, influx_track_cut_time,

  mqtt_broker_ip, mqtt_topic, mqtt_opt,

  correction_port,
  cleaner_port,
  mqtt_topic_RITI,mqtt_topic_RITI_Rawdata,
}

module.exports = para;
