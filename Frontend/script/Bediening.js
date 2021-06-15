const lanIP = `${window.location.hostname}:5000`;
const socket = io(`http://${lanIP}`);

let socketVentilering;
let stand;
let rgb;

const listenToSocket = function () {
        socket.on('B2F_state_knoppen', function (payload) {
        // console.log(payload)
        stand = payload['stand']
        rgb = payload['rgb']
        socketVentilering = payload['ventilatie']

        let knopAutomatisch = document.querySelector('.js-automatisch');
        let knopHandmatig = document.querySelector('.js-handmatig');
        let knopRgbAan = document.querySelector('.js-rgb-aan');
        let knopRgbUit = document.querySelector('.js-rgb-uit');
        let input = document.querySelector('.js-auto-input');

        if (stand == 1) {
            // console.log(stand)
            knopHandmatig.classList.remove('c-button--clicked')
            knopAutomatisch.classList.add('c-button--clicked')
            html = `<h3 class="u-color-primary-light u-medium">U koos voor automatische bediening.</h3>
                <div class="o-input-actuator">
                <h3 class="o-input-bediening o-input-zone--text">Temp. inschakeling ventilator</h3>
                <div class="o-input">
                <input class="js-ventilatie o-input-text" type="number" placeholder="°C" name="verlichting" id="verlichting" min="0" max="100" step="1" autofocus requierd>
                </div>
                </div>
                <div class="o-temp-vent">
                <h3 class="o-input-zone--text">Huidige temperatuur inschakeling: </h3>    
                <h3 class="o-ventilatie o-input-zone--text u-bold u-color-primary-light">${socketVentilering}°C</h3> 
                </div>
                <input class="js-button-ventilatie c-button c-button--xm" type="button" name="airco" id="airco" value="Ventilatie instellen">`
            input.innerHTML = html

            let ventilatieInstellen = document.querySelector('.js-button-ventilatie')
            let ventilatieWaarde = document.querySelector('.js-ventilatie')
            ventilatieInstellen.addEventListener('click', function () {
                let valueVentilatie = ventilatieWaarde.value
                // console.log(valueVentilatie)
                socket.emit('F2B_automatisch_ventilatie', {ventilatie: valueVentilatie})
            });
        }
        else {
            // console.log(stand)
            knopAutomatisch.classList.remove('c-button--clicked')
            knopHandmatig.classList.add('c-button--clicked')
            html = `<h3 class="u-color-primary-light u-medium">U koos voor handmatige bediening.</h3>
                <div class="o-input-actuator">
                <h3 class="o-input-bediening o-input-zone--text">Waarde verlichting (0-100%)</h3>
                <div class="o-input">
                <input class="js-verlichting o-input-text" type="number" placeholder="0-100" name="verlichting" id="verlichting" value="0" min="0" max="100" step="10" autofocus>
                </div>
                </div>
                <div class="o-input-actuator">
                <h3 class="o-input-bediening o-input-zone--text">Stand ventilator (1-3)</h3>
                <div class="o-input">
                <input class="js-ventilator o-input-text" type="number" placeholder="0-3" name="ventilator" id="ventilator" value="0" min="0" max="3" step="1">
                </div>
                </div>
                <input class="js-button-doorsturen c-button c-button--xm" type="button" name="doorsturen" id="doorsturen" value="Doorsturen">`
            input.innerHTML = html
            
            let doorsturen = document.querySelector('.js-button-doorsturen')
            let verlichting = document.querySelector('.js-verlichting')
            let ventilator = document.querySelector('.js-ventilator')
            doorsturen.addEventListener('click', function () {
                let valueVerlichting = verlichting.value
                let valueVentilator = ventilator.value
                if (valueVerlichting > 100) {
                    valueVerlichting = 100;
                }
                else if (valueVerlichting < 0) {
                    valueVerlichting = 0;
                };

                if (valueVentilator > 3) {
                    valueVentilator = 3;
                }
                else if (valueVentilator < 0) {
                    valueVentilator = 0;
                };
                // console.log(valueVerlichting)
                // console.log(valueVentilator)
                socket.emit('F2B_handmatig_waardes', {verlichting: valueVerlichting, ventilator: valueVentilator})
            });
        }

        if (rgb == 1) {
            knopRgbUit.classList.remove('c-button--clicked')
            knopRgbAan.classList.add('c-button--clicked')
        }
        else {
            knopRgbAan.classList.remove('c-button--clicked')
            knopRgbUit.classList.add('c-button--clicked')
        }
    });
};

const listenToBediening = function () {
    let knopAutomatisch = document.querySelector('.js-automatisch');
    let knopHandmatig = document.querySelector('.js-handmatig');
    let knopRgbAan = document.querySelector('.js-rgb-aan');
    let knopRgbUit = document.querySelector('.js-rgb-uit');

    knopAutomatisch.addEventListener('click', function () {
        socket.emit('F2B_automatisch')
        knopHandmatig.classList.remove('c-button--clicked')
        knopAutomatisch.classList.add('c-button--clicked')
    });

    knopHandmatig.addEventListener('click', function () {
        socket.emit('F2B_handmatig')
        knopAutomatisch.classList.remove('c-button--clicked')
        knopHandmatig.classList.add('c-button--clicked')
    });

    knopRgbAan.addEventListener('click', function() {
        socket.emit('F2B_rgb_aan')
        knopRgbUit.classList.remove('c-button--clicked')
        knopRgbAan.classList.add('c-button--clicked')
        console.log('Rgb aan')
    });

    knopRgbUit.addEventListener('click', function() {
        socket.emit('F2B_rgb_uit')
        knopRgbAan.classList.remove('c-button--clicked')
        knopRgbUit.classList.add('c-button--clicked')
        console.log('Rgb uit')
    })
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
  listenToBediening();
  listenToAfsluiten();
});
