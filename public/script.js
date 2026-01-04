$(document).ready(()=>{
// // Prevent accidental print dialog during debugging and log call stack
// if (typeof window !== 'undefined') {
//     const _origPrint = window.print;
//     window.print = function(...args) {
//         console.warn('window.print called', ...args);
//         console.trace();
//         // do not call original to avoid opening print dialog
//     };
// }
const socket = io();
let num = 0;
let isupdating = false;
let isRunning = false;  
let refVoltage = 1650;
let RTIA = 1000;
let isSubmitting = false;
let plots = [];

socket.on("data",(packet)=>{
    Plotly.extendTraces('tester',{x:[[packet.dac/4095*3300-refVoltage]],y:[[(packet.curr-refVoltage)/-RTIA]]},[0])
    Plotly.extendTraces('tester_',{x:[[packet.volt-refVoltage]],y:[[(packet.curr-refVoltage)/-RTIA]]},[0])
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
var test2 = document.getElementById("tester_");
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
Plotly.newPlot( test2, [{
    x: [],
    y: [] }], layout );
$("#clearBtn").click((e)=>{
    console.log("clicked");
    Plotly.newPlot( test, [{
    x: [],
    y: [] }], layout );
    Plotly.newPlot( test2, [{
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
                isupdating = false;
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
                alert("Measurement Started!");
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
            $.ajax({
            url: '/setOCP',
            type: 'POST',
            contentType: 'application/json', // Set the Content-Type header
            data: JSON.stringify({"OCPVal":val}), // Stringify the data
            dataType: 'json', // The type of data you expect back
            success: function(response) {
                console.log('Success:', response);
                alert("OCP Val Saved!");
                return;
            },
            error: function(xhr, status, error) {
                console.error('Error:', error);
                isSubmitting=false;
                return;
            }});
            alert("OCP is set :)");
        };      
    })
    $("#setInitialVoltage").click((e)=>{
        let val = parseInt($("#initialVoltage").text());
        if (isNaN(val)){
            console.log("empty");
            alert("Check the voltage first");
        }
        else {
            console.log(val)
            initVoltage=val;
            $("#OCP").text(initVoltage);
            $.ajax({
            url: '/set',
            type: 'POST',
            contentType: 'application/json', // Set the Content-Type header
            data: JSON.stringify({"mode":9,
                                  "initVoltage":val}), // Stringify the data
            dataType: 'json', // The type of data you expect back
            success: function(response) {
                console.log('Success:', response);
                alert("init Voltage set!");
                return;
            },
            error: function(xhr, status, error) {
                console.error('Error:', error);
                isSubmitting=false;
                return;
            }});
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

    $("#setName").click((e)=>{
        const data = {"name":$("#name").text()}
        $.ajax({
            url: '/setName',
            type: 'POST',
            contentType: 'application/json', // Set the Content-Type header
            data: JSON.stringify(data), // Stringify the data
            dataType: 'json', // The type of data you expect back
            success: function(response) {
                console.log('Success:', response);
                alert("Name Saved!");
                return;
            },
            error: function(xhr, status, error) {
                console.error('Error:', error);
                isSubmitting=false;
                return;
            }});
    })

    $("#getName").click((e)=>{
        let name = $("#name").val()
        const nameSelected = $("#nameLists").val()
        if (name =='' && nameSelected == ''){
            alert('please fill the name');
            return;
        }
        if (name == '' && nameSelected != '') name = nameSelected;
        console.log(name);
        $.ajax({
            url: '/getName',
            type: 'POST',
            contentType: 'application/json', // Set the Content-Type header
            data: JSON.stringify({"name":name}), // Stringify the data
            dataType: 'json', // The type of data you expect back
            success: function(response) {
                console.log('Success:', response);
                if (plots.includes(name)){
                    return;
                }
                else{
                    plots.push(name);
                }
                if (!isNaN(parseInt(response.OCPVal))) refVoltage = response.OCPVal;
                let x_dac = response.dac.map((x)=>x/4095*3300-refVoltage );
                let x_volt = response.volt.map((x)=>x - refVoltage);
                let curr = response.curr.map((y)=>(y - refVoltage)/-RTIA);
                const data = [x_dac,curr];
                const data2 = [x_volt,curr];
                console.log(data);
                if (plots.length == 1){
                    Plotly.newPlot(test ,[{x:x_dac,y:curr}] ,layout);
                    Plotly.newPlot(test2,[{x:x_volt,y:curr}],layout);
                }
                else{
                    Plotly.addTraces('tester' ,[{x:x_dac,y:curr}] );
                    Plotly.addTraces('tester_',[{x:x_volt,y:curr}]);
                }
                return;
            },
            error: function(xhr, status, error) {
                console.error('Error:', error);
                return;
            }});
    })


    $("#setOCPVal").click(()=>{
        let val = parseInt($("#OCPVal").val());
        if (isNaN(val)){
            console.log("empty");
            alert("Check the voltage first");
        }
        else {
            console.log(val)
            refVoltage=val;
            $("#OCP").text(refVoltage);
        }
    })
    
const getNames = ()=>{
    $.ajax({
            url: '/getNames',
            type: 'POST',
            contentType: 'application/json', // Set the Content-Type header
            dataType: 'json', // The type of data you expect back
            success: function(response) {
                // console.log('Success:', response);
                response.forEach((filename)=>{
                    const fileName_ = filename.slice(0,-5);
                    $("#nameLists").append(`<option value=${fileName_}>${fileName_}</option>`)
                })
                return;
            },
            error: function(xhr, status, error) {
                console.error('Error:', error);
                return;
            }});
    
}
getNames();
    // setInterval(()=>{
    //     $.ajax({
    //         url: '/status',
    //         type: 'POST',
    //         contentType: 'application/json', // Set the Content-Type header
    //         data: JSON.stringify({}), // Stringify the data
    //         dataType: 'json', // The type of data you expect back
    //         success: function(response) {
    //             console.log('Success:', response);
    //             isRunning=true;
    //             isSubmitting=false;
    //             alert("Measurement Saved!");
    //             return;
    //         },
    //         error: function(xhr, status, error) {
    //             console.error('Error:', error);
    //             isSubmitting=false;
    //             return;
    //         }});
    // },1000);
})


