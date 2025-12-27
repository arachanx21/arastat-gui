$(document).ready(()=>{
const socket = io();
let num = 0;
let isupdating = false;
let isRunning = false;
let refVoltage = 1650;
let RTIA = 1000;

socket.on("data",(packet)=>{
    Plotly.extendTraces('tester',{x:[[packet.dac/4095*3300-refVoltage]],y:[[(packet.curr-refVoltage)/-RTIA]]},[0])
    console.log(packet); 
})

socket.on("ocp",(packet)=>{
    console.log(packet);
    isupdating =false;
    $("#DAC").text(packet.dac);
    $("#volt").text(packet.volt);
    $("#curr").text(packet.curr);
})

socket.on("status",(packet)=>{
    console.log("status:",packet.status);
    if (packet.status == "Running") {
        $("#status").text("Running");
        isRunning = true;
    }
    else if (packet.status == "Idle") {
        $("#status").text("Idle");
        isRunning = false;
    }

})

// var test = $("#tester");
var test = document.getElementById("tester");
Plotly.newPlot( test, [{
    x: [],
    y: [] }], {
        margin: { t: 0 },
    } );
$("#clearBtn").click((e)=>{
    console.log("clicked");
    Plotly.newPlot( test, [{
    x: [],
    y: [] }], {
        margin: { t: 0 },
    } );
})
$("#checkV").click((e)=>{
    if (isupdating) return;
    else{ 
        $.ajax({
            url: '/cmd',
            type: 'POST',
            contentType: 'application/json', // Set the Content-Type header
            data: JSON.stringify({"mode":5}), // Stringify the data
            dataType: 'json', // The type of data you expect back
            success: function(response) {
                console.log('Success:', response);
                isupdating = true;
            },
            error: function(xhr, status, error) {
                console.error('Error:', error);
            }});
        }
})
$("#startMeasurement").click((e)=>{
    if (isRunning) return;
    else {
        $.ajax({
            url: '/cmd',
            type: 'POST',
            contentType: 'application/json', // Set the Content-Type header
            data: JSON.stringify({"mode":1}), // Stringify the data
            dataType: 'json', // The type of data you expect back
            success: function(response) {
                console.log('Success:', response);
                isRunning=true;
            },
            error: function(xhr, status, error) {
                console.error('Error:', error);
            }});
        }

        

    })
    const formSubmissionHandler = ()=>{
        let data = {}
        data["mode"] = parseInt($("#mode").val())
        data["startingVoltage"] = parseInt($("#startingVoltage").val());
        data["finalVoltage"] = parseInt($("#startingVoltage").val());
        data["scanRate"] = parseInt($("#scanRate").val());
        console.log(data);
    }
    $("#formSubmission").click((e)=>{
        e.preventDefault();
        formSubmissionHandler();
    })

    $("#OCP").text(refVoltage);

    $("#setOCP").click((e)=>{
        let val = parseInt($("#curr").text());
        if (isNaN(val)){
            console.log("empty");
            alert("Check the voltage first");
        }
        else {
            console.log(val)
            refVoltage=val;
            $("#OCP").text(refVoltage);
            alert("OCP is set :)");
        };      
    })
})


