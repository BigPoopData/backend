function drawgraph1(array, timestamp) {
    var lineChartData = {
        labels: timestamp,
        scaleShowVerticalLines: true,
        datasets: [{
            data: array,
        }]

    };

    Chart.defaults.global.legend.display = false;



    var ctx = document.getElementById("canvas").getContext("2d");
    var myNewChart = new Chart(ctx, {
            type: "line",
            data: lineChartData,
            options: {
                responsive: true,
                legend: {
                    display: false,
                }
            }

            });
    }
