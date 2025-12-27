const { error } = require('node:console');
const {SerialPort} = require('serialport')
const fs = require('fs');
const express = require('express')
const { DelimiterParser } = require('@serialport/parser-delimiter');
const bodyParser = require('body-parser');
const path = require('path');
const { stat } = require('node:fs');


const ARASTAT_MODES = {
    "LINEAR_SWEEP_VOLTAMMETRY":1,
    "CYCLIC_VOLTAMMETRY":2,
    "CHRONOAMPEROMETRY":3,
    "SAMPLE_RATE_CHANGE":4,
    "SET_ADC_DAC_DELAY":5,
    "SET_REF_MEAS_VOLTAGE":6,
    "SET_RTIA":7,
}

let state = {
    running:false,
    collect:false,
}

let expData = {"dac":[],
    "curr":[],
    "volt":[]
};

const app = express();
const backendPort = 3000;
const server = require('http').createServer(app);
const io = require('socket.io')(server);
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname,'public')));

app.get("/",(req,res)=>{
    console.log("hello");
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
    // res.render('index.html')

})

app.post("/set",(req,res)=>{
    console.log("post accepted");
    console.log(req.body);
    settingHandler(req.body).then(()=>{
        res.send({"message":"lovely!"});
    }).catch((err)=>{
        console.log("error",err);
    });
})

app.post("/data",(req,res)=>{
    res.send(expData);
})

app.post("/cmd",(req,res)=>{
    console.log("command accepted");
    console.log(req.body)
    commandHandler(req.body).then(()=>{
        res.send({"message":"cmd sent"});
    }).catch((err)=>{
        console.log("Err",err);
    })
})

app.post("/save",(req,res)=>{
    console.log("saving file");
    if (!state.collect && !state.running){
        writeJSONFile().then(()=>{
            res.send(200);
        }).catch((err)=>{
            console.log("error received");
            console.log(err.message);
            res.send(400);    
        });
    }
})

// app.listen(backendPort,()=>{
//     console.log(`http listening.. on port ${backendPort}`);
// })

server.listen(backendPort,()=>{
    console.log("socket listening on port 8080")
})
const port = new SerialPort({path:'/dev/ttyACM0', baudRate:115200},(err)=>{
    if (err) return console.log("error",err.message);
    else console.log("connected");
})



io.on('connection', (socket) => {
  console.log('user connected');
  socket.on('disconnect', function () {
    console.log('user disconnected');
  });
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
  parser.pause()
  const text = data.toString('utf8')
  if (text.length ) {
    console.log(text)
  }
  if (text == "---") {
    state.running = !state.running;
    if (state.running) {
        console.log("start");
        expData.curr=[];
        expData.dac=[];
        expData.volt=[];
    }
    else console.log("stop");
    if (state.running) {
        state.collect = true;
        io.emit("status",{"status":"Running"});
    }
    else {
        state.collect = false;
        io.emit("status",{"status":"Idle"});
    }
}
  if (text.includes("{")){
    let a = JSON.parse(text);
    if (state.collect)
    {
    expData.dac.push(a.dac);
    expData.volt.push(a.volt);
    expData.curr.push(a.curr);
    io.emit("data",a);
    }
    else {
        console.log(a);
        io.emit("ocp",a);
    }
  }
  parser.resume();
})



async function settingHandler(body,cb){
    let buffer = "";
    const mode = ARASTAT_MODES[body.mode];
    // console.log(mode);
    if (mode>0 && mode<4) 
        buffer += mode.toString()+"/";
        buffer += body.startingVoltage+"/";
        buffer += body.finalVoltage+"/";
        buffer += body.scanRate+"//";
    console.log(buffer);
    
    await port.write(buffer,'utf-8',(err)=>{
        if (err) throw new Error("failed to write");
        else return 1;
    })
}

async function commandHandler(body) {
    let buffer = "";
    buffer += "/"+body.mode+"//";
    port.write(buffer,'utf-8',(err)=>{
        if (err) throw new Error("failed to write");
        else return 1;
    })
    
}
const writeJSONFile = ()=>{
        let result = 0;
        const date = new Date().getTime();
        const d = new Date(date);
        const pad = n => String(n).padStart(2,'0');
        const formattedDate = `${pad(d.getDate())}${pad(d.getMonth()+1)}${String(d.getFullYear()).slice(-2)}${pad(d.getHours())}${pad(d.getMinutes())}`;
        if (expData.curr.length==0) result=0;
        else result=1;
        fs.writeFile(`${formattedDate}.json`,JSON.stringify(expData),'utf-8',(err)=>{
            if (err) console.log("error");
            else console.log("filec reated");
        })
        return new Promise(()=>{
            if (result==1) return 1;
            else throw new Error("Empty file");
        },(err)=>{
            throw new Error("cannot write the JSON file");
        })
}