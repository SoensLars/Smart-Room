const lanIP = `${window.location.hostname}:5000`;
const socket = io(`http://${lanIP}`);

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
    listenToAfsluiten();
  });