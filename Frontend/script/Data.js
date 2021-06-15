const lanIP = `${window.location.hostname}:5000`;
const socket = io(`http://${lanIP}`);

let tempVentilator;

const listenToSocket = function () {
  socket.on("connect", function () {
    console.log("verbonden met socket webserver");
  });

  socket.on('B2F_state_knoppen', function (msg) {
    tempVentilator = msg['ventilatie']
  })

  socket.on("B2F_data_sensor1", function (msg) {
    // console.log(msg)
    let sensor1 = document.querySelector('.js-sensor1');
    let tempVerschil = tempVentilator - msg
    let html = `${msg} °C`
    // console.log(`Temperatuur: ${msg}°C`)
    sensor1.innerHTML = html;
    console.log(tempVerschil)
    if (tempVerschil > 3) {
      sensor1.classList.remove('c-sensor-circle--yellow')
      sensor1.classList.remove('c-sensor-circle--red')
      sensor1.classList.remove('u-text-circle--yellow')
      sensor1.classList.remove('u-text-circle--red')
      sensor1.classList.add('c-sensor-circle--green')
      sensor1.classList.add('u-text-circle--green')
    }
    else if (tempVerschil > 0 & tempVerschil < 3){
      sensor1.classList.remove('c-sensor-circle--green')
      sensor1.classList.remove('c-sensor-circle--red')
      sensor1.classList.remove('u-text-circle--green')
      sensor1.classList.remove('u-text-circle--red')
      sensor1.classList.add('c-sensor-circle--yellow')
      sensor1.classList.add('u-text-circle--yellow')      
    }
    else if (tempVerschil < 0) {
      sensor1.classList.remove('c-sensor-circle--green')
      sensor1.classList.remove('c-sensor-circle--yellow')
      sensor1.classList.remove('u-text-circle--green')
      sensor1.classList.remove('u-text-circle--yellow')
      sensor1.classList.add('c-sensor-circle--red')
      sensor1.classList.add('u-text-circle--red')
    }
  });

  socket.on("B2F_data_sensor2", function (msg) {
    let sensor2 = document.querySelector('.js-sensor2');
    let html = `${msg} ppm`
    // console.log(`CO²: ${msg}ppm`)
    sensor2.innerHTML = html;
    if (msg < 750) {
      sensor2.classList.remove('c-sensor-circle--yellow')
      sensor2.classList.remove('c-sensor-circle--red')
      sensor2.classList.remove('u-text-circle--yellow')
      sensor2.classList.remove('u-text-circle--red')
      sensor2.classList.add('c-sensor-circle--green')
      sensor2.classList.add('u-text-circle--green')
    }
    else if (msg > 750 & msg < 1200){
      sensor2.classList.remove('c-sensor-circle--green')
      sensor2.classList.remove('c-sensor-circle--red')
      sensor2.classList.remove('u-text-circle--green')
      sensor2.classList.remove('u-text-circle--red')
      sensor2.classList.add('c-sensor-circle--yellow')
      sensor2.classList.add('u-text-circle--yellow')      
    }
    else if (msg > 1200) {
      sensor2.classList.remove('c-sensor-circle--green')
      sensor2.classList.remove('c-sensor-circle--yellow')
      sensor2.classList.remove('u-text-circle--green')
      sensor2.classList.remove('u-text-circle--yellow')
      sensor2.classList.add('c-sensor-circle--red')
      sensor2.classList.add('u-text-circle--red')
    }
  });

  socket.on("B2F_data_sensor3", function (msg) {
    // console.log(msg)
    let sensor3 = document.querySelector('.js-sensor3');
    let html = `${msg} %`
    // console.log(`Lichtsterkte: ${msg}%`)
    sensor3.innerHTML = html;
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

document.addEventListener("DOMContentLoaded", function () {
  console.info("DOM geladen");
  listenToSocket();
  listenToAfsluiten();
});
