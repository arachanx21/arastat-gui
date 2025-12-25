const { error } = require('node:console');
const {SerialPort} = require('serialport')
const express = require('express')
const { DelimiterParser } = require('@serialport/parser-delimiter');


const app = express();
const backendPort = 3000;

app.get("/",(req,res)=>{
    console.log("hello");
    res.sendStatus(200);
})

app.post("/set",(req,res)=>{
    console.log("post accepted");
    console.log(req.body);
    // console.log(req);
    res.send({"message":"lovely!"});
    // res.sendStatus(200);
})

app.listen(backendPort,()=>{
    console.log("listening..");
})
const port = new SerialPort({path:'/dev/ttyACM0', baudRate:115200},(err)=>{
    if (err) return console.log("error",err.message);
    else console.log("connected");
})


port.write('2/-600/600/10//', function(err) {
  if (err) {
    return console.log('Error on write: ', err.message)
  }
  console.log('message written')
})

const parser = port.pipe(new DelimiterParser({ delimiter: '\n' }))


parser.on('data', function (data) {
//   console.log(data)
  const text = data.toString('utf8')
  if (text.length) {
    console.log('data:',text)
  } else {
    console.log('Data (hex):', data.toString('hex'))
  }
})

