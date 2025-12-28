$(document).ready(()=>{
// Prevent accidental print dialog during debugging and log call stack
if (typeof window !== 'undefined') {
    const _origPrint = window.print;
    window.print = function(...args) {
        console.warn('window.print called', ...args);
        console.trace();
        // do not call original to avoid opening print dialog
    };
}
const socket = io();
let num = 0;
let isupdating = false;
let isRunning = false;
let refVoltage = 1650;
let RTIA = 1000;
let isSubmitting = false;

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
        $("#status-card").css('background', 'red');
        isRunning = true;
    }
    else if (packet.status == "Idle") {
        $("#status").text("Idle");
        $("#status-card").css('background', 'green');
        isRunning = false;
    }

})

// var test = $("#tester");
var test = document.getElementById("tester");
const layout = {
        margin: { t: 0 },
        xaxis: {
            title: {
            text: 'V vs Ag/AgCl (mV)', // X-axis title
            font: {
              family: 'Courier New, monospace',
              size: 18,
              color: '#7f7f7f'
            }
        }},
        yaxis: {
            title: {
            text: 'Current (mA)', // Y-axis title
            font: {
              family: 'Courier New, monospace',
              size: 18,
              color: '#7f7f7f'
        }}}
    }
Plotly.newPlot( test, [{
    x: [],
    y: [] }], layout );
$("#clearBtn").click((e)=>{
    console.log("clicked");
    Plotly.newPlot( test, [{
    x: [],
    y: [] }], layout );
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
        if (isSubmitting) {
            alert("another process is still running");
            return;
        }
        isSubmitting=true;
        let data = {}
        data["mode"] = parseInt($("#mode").val())
        data["startingVoltage"] = parseInt($("#startingVoltage").val());
        data["finalVoltage"] = parseInt($("#finalVoltage").val());
        data["scanRate"] = parseInt($("#scanRate").val());
        $.ajax({
            url: '/set',
            type: 'POST',
            contentType: 'application/json', // Set the Content-Type header
            data: JSON.stringify(data), // Stringify the data
            dataType: 'json', // The type of data you expect back
            success: function(response) {
                console.log('Success:', response);
                isRunning=false;
                isSubmitting=false;
                alert("parameter set!");
            },
            error: function(xhr, status, error) {
                console.error('Error:', error);
                alert("Error");
                isSubmitting=false;
                return;
            }});

        }
    
    $("#setTime").click((e)=>{
        e.preventDefault();
        console.log("setTime clicked");
        if (isSubmitting) {
            alert("another process is still running");
            return;
        }
        isSubmitting=true;
        let quietTimeData = {};
        quietTimeData["mode"]=12;
        quietTimeData["quietTime"]=parseInt($("#quietTime").val());
        if (!isNaN(quietTimeData["quietTime"])){
            $.ajax({
                url: '/set',
                type: 'POST',
                contentType: 'application/json', // Set the Content-Type header
                data: JSON.stringify(quietTimeData), // Stringify the data
                dataType: 'json', // The type of data you expect back
                success: function(response) {
                    console.log('Success:', response);
                    isRunning=false;
                    isSubmitting=false;
                    alert("Quiet Time is set!");
                    return;
                },
                error: function(xhr, status, error) {
                    console.error('Error:', error);
                    isSubmitting=false;
                    alert("Error");
                    return;
            }});
        }
    })

    $("#setIdleVoltage").click((e)=>{
        if (isSubmitting) {
            alert("another process is still running");
            return;
        }
        isSubmitting = false;
        let data={}
        data["mode"]=6;
        data["idleVoltage"]=parseInt($("#idleVoltage").val());
        console.log(data);
        if (!isNaN(data["idleVoltage"])){
            $.ajax({
            url: '/set',
            type: 'POST',
            contentType: 'application/json', // Set the Content-Type header
            data: JSON.stringify(data), // Stringify the data
            dataType: 'json', // The type of data you expect back
            success: function(response) {
                console.log('Success:', response);
                isRunning=false;
                isSubmitting=false;
                alert("idleVoltage set!");
                return;
            },
            error: function(xhr, status, error) {
                console.error('Error:', error);
                isSubmitting=false;
                alert("Error");
                return;
            }});
        }
    })
    
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

    $("#save").click((e)=>{
        $.ajax({
            url: '/save',
            type: 'POST',
            contentType: 'application/json', // Set the Content-Type header
            data: JSON.stringify({}), // Stringify the data
            dataType: 'json', // The type of data you expect back
            success: function(response) {
                console.log('Success:', response);
                isRunning=true;
                isSubmitting=false;
                alert("Measurement Saved!");
                return;
            },
            error: function(xhr, status, error) {
                console.error('Error:', error);
                isSubmitting=false;
                return;
            }});
    })
})


