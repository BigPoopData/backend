function drawgraph1(array, timestamp) {
    var lineChartData = {

        labels: timestamp,
        scaleShowVerticalLines: true,
        datasets: [{
                type: 'line',
                label: 'Average Time in Minutes',
                data: array,
                borderColor: "rgba(231, 76, 60,1.0)",
                borderWidth: 1,
                tension: 0.2,

            }, {
                type: 'bar',
                label: 'Bar Component',
                data: array,
                backgroundColor: "rgba(231, 76, 60,0.2)",


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
            maintainAspectRatio: true,
            legend: {
                display: false,
            },
        }

    });
}
