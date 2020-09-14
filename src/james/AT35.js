function getBuf4(buf, start){
  let dataBuf = new ArrayBuffer(4);
  let view = new DataView(dataBuf);
  for(let i = 0; i < 4; i++){
    view.setUint8(i, buf[i + start]);
  }
  return view;
}
function getBuf2(buf, start){
  let dataBuf = new ArrayBuffer(2);
  let view = new DataView(dataBuf);
  for(let i = 0; i < 2; i++){
    view.setUint8(i, buf[i + start]);
  }
  return view;
}
//不同型別
function uint32Buf(buf, start) { return [getBuf4(buf, start).getUint32(0, true), start + 4]; }
function uint16Buf(buf, start) { return [getBuf2(buf, start).getUint16(0, true), start + 2]; }
function uint16ArrBuf(buf, start){
  let arr = [];
  for(let i = 0; i < 5; i++){
    arr.push(getBuf2(buf, start).getUint16(0, true));
    start += 2;
  }
  return [arr, start];
}

function int32Buf(buf, start)  { return [getBuf4(buf, start).getInt32(0, true), start + 4]; }
function int32ArrBuf(buf, start){
  let arr = [];
  for(let i = 0; i < 5; i++){
    arr.push(getBuf4(buf, start).getInt32(0, true));
    start += 4;
  }
  return [arr, start];
}
function float32Buf(buf, start){ return [getBuf4(buf, start).getFloat32(0, true), start + 4]; }
function float32ArrBuf(buf, start){
  let arr = [];
  for(let i = 0; i < 5; i++){
    arr.push(getBuf4(buf, start).getFloat32(0, true));
    start += 4;
  }
  return [arr, start];
}
function byteBuf(buf, start){
  let dataBuf = new ArrayBuffer(1);
  let view = new DataView(dataBuf);
  view.setUint8(0, buf[start]);
  return [view.getUint8(0, true), start + 1];
}
//資料物件
module.exports = {
  data: function (bi, timestamp){
    let shift = 0;
    let bufSize = 8;
    let counter = 0;

    this.get_data_time = timestamp;

    [this.unit_id, shift] = uint32Buf(bi, shift); //30171327
    [this.unix_t, shift] = uint32Buf(bi, shift); //bi.slice(counter, bufSize + counter++);

    [this.i_lon, shift] = int32Buf(bi, shift);
    [this.i_lat, shift] = int32Buf(bi, shift);
    [this.mileage, shift] = uint32Buf(bi, shift);

    [this.event_id, shift] = byteBuf(bi, shift);
    [this.inputs , shift]= byteBuf(bi, shift);
    [this.outputs, shift] = byteBuf(bi, shift);
    [this.sats, shift] = byteBuf(bi, shift);

    [this.spd, shift] = uint16Buf(bi, shift);
    [this.heading, shift] = uint16Buf(bi, shift);
    [this.volt, shift] = float32Buf(bi, shift);

    [this.x, shift] = float32ArrBuf(bi, shift);
    [this.y, shift] = float32ArrBuf(bi, shift);
    [this.z, shift] = float32ArrBuf(bi, shift);
    [this.yaw, shift]   = float32ArrBuf(bi, shift); //+-180
    [this.roll, shift]  = float32ArrBuf(bi, shift);
    [this.pitch, shift] = float32ArrBuf(bi, shift);

    //==========================================
    [this.e_lon, shift] = int32ArrBuf(bi, shift);
    [this.e_lat, shift] = int32ArrBuf(bi, shift);

    [this.e_spd, shift] = uint16ArrBuf(bi, shift);
    [this.e_heading, shift] = uint16ArrBuf(bi, shift);
    [this.cal_status, shift] = uint16Buf(bi, shift);

  }
}
