function drawgraph1(array, timestamp) {
    var lineChartData = {

        labels: timestamp,
        scaleShowVerticalLines: true,
        datasets: [{
                type: 'line',
                label: 'Average Time in Minutes',
                data: array,
                borderColor: currentcolor,
                borderWidth: 1,
                tension: 0.2,

            }, {
                type: 'bar',
                label: 'Bar Component',
                data: array,
                backgroundColor: currentcolorlessopacity,


            }
            // data: array,}
        ]

    };

    Chart.defaults.global.legend.display = false;



    var ctx = document.getElementById("canvas").getContext("2d");
    var myNewChart = new Chart(ctx, {
        type: "bar",
        data: lineChartData,
        options: {
            scales: {
                xAxes: [{
                    gridLines: {
                        display: false
                    }
                }],
                yAxes: [{
                    gridLines: {
                        display: false
                    }
                }]
            },
            responsive: true,
            legend: {
                display: false,
            },
        }

    });
}
