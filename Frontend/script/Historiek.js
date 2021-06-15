const lanIP = `${window.location.hostname}:5000`;
const socket = io(`http://${lanIP}`);

let filterDevice = 0;
let filterTijdstip = 0;
let deviceId;
let minutes;

const showTable = function (jsonObject) {
  let HTMLtable = document.querySelector('.js-table')
  let html = `<tr class="c-row js-header">
                <td class="c-cell c-cell-bold">Naam Device</td>
                <td class="c-cell c-cell-bold">Waarde</td>
                <td class="c-cell c-cell-bold">Meeteenheid</td>
                <td class="c-cell c-cell-bold">Tijdstip</td>
            </tr>`
  for (let array of jsonObject) {
      html += `</tr>
                <tr class="c-row">
                <td class="c-cell">${array.Naam_Device}</td>
                <td class="c-cell">${array.Waarde}</td>
                <td class="c-cell">${array.Meeteenheid}</td>
                <td class="c-cell">${array.Tijdstip}</td>
              </tr>`
  }
  HTMLtable.innerHTML = html
  listenToFilterButtonDevice()
  listenToFilterButtonTijdstip()
};

const getTable = function () {
  handleData(`http://${lanIP}/api/v1/historiek`, showTable, null, 'GET');
}

const getTableFilterDevice = function () {
  handleData(`http://${lanIP}/api/v1/historiek/${deviceId}`, showTable, null, 'GET');
}

const getTableFilterTijdstip = function () {
  handleData(`http://${lanIP}/api/v1/historiek/tijd/${minutes}`, showTable, null, 'GET');
}

const getTableFilterDeviceTijdstip = function () {
    handleData(`http://${lanIP}/api/v1/historiek/${deviceId}/tijd/${minutes}`, showTable, null, 'GET')
}

const listenToSocket = function () {
  socket.on('B2F_refresh_data', function () {
    if (filterDevice == 0 & filterTijdstip == 0) {
      getTable();  
    }  
    else if (filterDevice == 1 & filterTijdstip == 0) {
        getTableFilterDevice();
    }
    else if (filterDevice == 0 & filterTijdstip == 1) {
        getTableFilterTijdstip();
    }
    else if (filterDevice == 1 & filterTijdstip == 1) {
        getTableFilterDeviceTijdstip();
    }
  });
};

const listenToFilterButtonDevice = function () {
  let filterButton = document.querySelector('.js-button-filter-device')
  filterButton.addEventListener('click', function () {
    filterDevice = 1;
    let input = document.querySelector('.js-list-devices')
    // console.log(input.value)
    let devices = document.querySelectorAll('.js-option-device')
    for (let device of devices) {
      console.log(device.value)
      if (input.value == device.value) {
        deviceId = device.getAttribute('deviceid');
        if (filterTijdstip == 1) {
            if (deviceId == 0) {
            filterDevice = 0
            getTableFilterTijdstip()
            }
            else {
            filterDevice = 1
            getTableFilterDeviceTijdstip()
            }
        }
        else if (filterTijdstip == 0) {
            if (deviceId == 0) {
            filterDevice = 0
            getTable()
            }
            else {
            filterDevice = 1
            getTableFilterDevice()
            }
        }
      };
    };
  });
};

const listenToFilterButtonTijdstip = function () {
  let filterButton = document.querySelector('.js-button-filter-tijdstip')
  filterButton.addEventListener('click', function () {
    filterTijdstip = 1;
    let input = document.querySelector('.js-list-tijdstip')
    // console.log(input.value)
    let tijdstippen = document.querySelectorAll('.js-option-tijdstip')
    for (let tijdstip of tijdstippen) {
      console.log(tijdstip.value)
      if (input.value == tijdstip.value) {
        minutes = tijdstip.getAttribute('minuten');
        if (filterDevice == 1)
            if (minutes == 0) {
            filterTijdstip = 0
            getTableFilterDevice()
            }
            else {
            filterTijdstip = 1
            getTableFilterDeviceTijdstip()
            }
        else if (filterDevice == 0) {
            if (minutes == 0) {
            filterTijdstip = 0
            getTable()
            }
            else {
            filterTijdstip = 1
            getTableFilterTijdstip()
            }
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

document.addEventListener('DOMContentLoaded', function () {
    console.log('DOM content loaded');
    listenToSocket()
    if (filterDevice == 0 & filterTijdstip == 0) {
        getTable();  
    }  
    else if (filterDevice == 1 & filterTijdstip == 0) {
        getTableFilterDevice();
    }
    else if (filterDevice == 0 & filterTijdstip == 1) {
        getTableFilterTijdstip();
    }
    else if (filterDevice == 1 & filterTijdstip == 1) {
        getTableFilterDeviceTijdstip();
    }
    listenToAfsluiten();
});