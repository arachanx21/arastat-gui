const { error } = require('node:console');
const {SerialPort} = require('serialport')
const { DelimiterParser } = require('@serialport/parser-delimiter');

const app = require('./app').default;
const server = app.listen(port, () => {
    console.log(`App listening on port ${port}`);
});

server.on('error', (err) => {
    console.error('Server error:', err);
});
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

