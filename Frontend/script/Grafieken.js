const lanIP = `${window.location.hostname}:5000`;
const socket = io(`http://${lanIP}`);

let minutes;

//#region ***  Callback-Visualisation - show___         ***********
const drawChart1 = function (labels, data) {
    var options = {
        series: [{
        name: 'Temperatuur (°C)',
        data: data
      }],
        chart: {
        height: 350,
        type: 'area'
      },
      dataLabels: {
        enabled: false
      },
      stroke: {
        curve: 'smooth'
      },
      xaxis: {
        type: 'datetime',
        categories: labels
      }
      };
    var chart = new ApexCharts(document.querySelector('.js-chart_sensor1'), options)
    chart.render();
};

const drawChart2 = function (labels, data) {
    var options = {
        series: [{
        name: 'Luchtkwaliteit CO² (ppm)',
        data: data
      }],
        chart: {
        height: 350,
        type: 'area'
      },
      dataLabels: {
        enabled: false
      },
      stroke: {
        curve: 'smooth'
      },
      xaxis: {
        type: 'datetime',
        categories: labels
      }
      };
    var chart = new ApexCharts(document.querySelector('.js-chart_sensor2'), options)
    chart.render();
};

const drawChart3 = function (labels, data) {
    var options = {
        series: [{
        name: 'Lichtsterkte (%)',
        data: data
      }],
        chart: {
        height: 350,
        type: 'area'
      },
      dataLabels: {
        enabled: false
      },
      stroke: {
        curve: 'smooth'
      },
      xaxis: {
        type: 'datetime',
        categories: labels
      }
      };
    var chart = new ApexCharts(document.querySelector('.js-chart_sensor3'), options)
    chart.render();
};

const showDataSensor1 = function(jsonObject) {
    // console.log(jsonObject);
    let converted_labels = [];
    let converted_data = [];
    for(const data of jsonObject) {
        // Dit wat op de x-as komt
        converted_labels.push(data.Tijdstip);
        // Dit is wat op de y-as komt
        converted_data.push(data.Waarde)
    };
    drawChart1(converted_labels, converted_data);
};

const showDataSensor2 = function(jsonObject) {
    // console.log(jsonObject);
    let converted_labels = [];
    let converted_data = [];
    for(const data of jsonObject) {
        // console.log(data)
        // Dit wat op de x-as komt
        converted_labels.push(data.Tijdstip);
        // Dit is wat op de y-as komt
        converted_data.push(data.Waarde)
    };
    drawChart2(converted_labels, converted_data);
};

const showDataSensor3 = function(jsonObject) {
    // console.log(jsonObject);
    let converted_labels = [];
    let converted_data = [];
    for(const data of jsonObject) {
        // console.log(data)
        // Dit wat op de x-as komt
        converted_labels.push(data.Tijdstip);
        // Dit is wat op de y-as komt
        converted_data.push(data.Waarde)
    };
    drawChart3(converted_labels, converted_data);
};


const showGrafieken = function () {
  handleData(`http://${lanIP}/api/v1/grafieken/1`, showDataSensor1, null, 'GET');
  handleData(`http://${lanIP}/api/v1/grafieken/2`, showDataSensor2, null, 'GET');
  handleData(`http://${lanIP}/api/v1/grafieken/3`, showDataSensor3, null, 'GET');
}

const showGrafiekenByTijdstip = function () {
  handleData(`http://${lanIP}/api/v1/grafieken/1/tijd/${minutes}`, showDataSensor1, null, 'GET');
  handleData(`http://${lanIP}/api/v1/grafieken/2/tijd/${minutes}`, showDataSensor2, null, 'GET');
  handleData(`http://${lanIP}/api/v1/grafieken/3/tijd/${minutes}`, showDataSensor3, null, 'GET');
}
//#endregion

const listenToSocket = function () {
    socket.on('B2F_refresh_data', function () {
      if (minutes == 0) {
        showGrafieken();
      }
      else {
        showGrafiekenByTijdstip();
      }
    })
}

const listenToFilterButtonTijdstip = function () {
  let filterButton = document.querySelector('.js-button-filter-tijdstip')
  filterButton.addEventListener('click', function () {
    let input = document.querySelector('.js-list-tijdstip')
    // console.log(input.value)
    let tijdstippen = document.querySelectorAll('.js-option-tijdstip')
    for (let tijdstip of tijdstippen) {
      // console.log(tijdstip.value)
      if (input.value == tijdstip.value) {
        minutes = tijdstip.getAttribute('minuten');
        console.log(minutes)
        if (minutes == 0) {
          showGrafieken();
        }
        else {
          showGrafiekenByTijdstip();
        }
      };
    };
  });
};

const listenToAfsluiten = function () {
  let knopAfsluiten = document.querySelectorAll('.js-afsluiten');
  for (let knop of knopAfsluiten) {
  knop.addEventListener('click', function () {
      console.log('Afsluiten...')
      socket.emit('F2B_afsluiten')
  });
  }
}

//#region ***  Init / DOMContentLoaded                  ***********
document.addEventListener('DOMContentLoaded', function(){
    console.log('DOM geladen');
    listenToSocket();
    showGrafieken();
    listenToFilterButtonTijdstip();
    listenToAfsluiten();
});
