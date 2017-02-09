var sec = 0;

// function pad(val) {
//     return val > 9 ? val : "0" + val;
// }

function pad(val) {
    return val;
}


setInterval(function() {
    $("#seconds").html(pad(++sec % 60) + ' Seconds');
    if (sec > 60) {
        $("#minutes").html(pad(parseInt(sec / 60, 10)) + ' Minutes and ');
    }

    switch (sec) {
        case 30:
            $("#statusmessage").html('This could take longer...');
            break;
        case 120:
            $("#statusmessage").html('Stay patient! We know you can do it!');
            break;
        case 500:
            $("#statusmessage").html('Really taking his/her time!');
            break;
    }
}, 1000);
