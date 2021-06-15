from repositories.DataRepository import DataRepository
from subprocess import check_output, call 
from flask import Flask, jsonify
from flask_socketio import SocketIO, emit, send
from flask_cors import CORS
import spidev
from RPi import GPIO
from datetime import datetime
import time
from smbus import SMBus
import threading
GPIO.setmode(GPIO.BCM)

spi = spidev.SpiDev()
spi.open(0, 0)
spi.max_speed_hz = 10 ** 5 

RS = 25
E = 23
databits = [26, 19, 13, 6, 5, 22, 27, 17]
lampen = 12
motor = 24
RgbRed = 16
RgbGreen = 20

state_auto_hm = 1
state_rgb = 1
verlichting = 0
ventilator = 0

# voor automatische bediening motor
ventilatie = 30

# automatisch afsluiten Pi
state_afsluiten = 1

# region --- Code voor Hardware

#region --- Setup
GPIO.setwarnings(False)
GPIO.setup(RS, GPIO.OUT)
GPIO.setup(E, GPIO.OUT)
for bit in databits:
    GPIO.setup(bit, GPIO.OUT)
GPIO.setup((lampen, motor, RgbRed, RgbGreen), GPIO.OUT)
pwm_lampen = GPIO.PWM(lampen, 500)
pwm_lampen.start(0)
pwm_RgbRed = GPIO.PWM(RgbRed, 1000)
pwm_RgbRed.start(0)
pwm_RgbGreen = GPIO.PWM(RgbGreen, 1000)
pwm_RgbGreen.start(0)
pwm_motor = GPIO.PWM(motor, 100)
pwm_motor.start(0)

# endregion

# region --- Code LCD
def send_instruction(instruction):
    GPIO.output(RS, GPIO.LOW)
    GPIO.output(E, GPIO.HIGH)
    set_data_bits(instruction)
    GPIO.output(E, GPIO.LOW)
    time.sleep(0.01)


def send_character(character):
    GPIO.output(RS, GPIO.HIGH)
    GPIO.output(E, GPIO.HIGH)
    set_data_bits(character)
    GPIO.output(E, GPIO.LOW)
    time.sleep(0.0001)


def set_data_bits(byte):
    mask = 0x80
    for i in range(0, 8):
        GPIO.output(databits[i], byte & (mask >> i))


def write_message(bericht):
    for char in bericht[0:16]:
        send_character(ord(char))
    for char in bericht[16:]:
        move_screen()
        send_character(ord(char))


def init_LCD():
    # 8 bit notatie
    send_instruction(0b00111000)
    # scherm aan
    send_instruction(0b00001111)
    # wissen
    send_instruction(0b00000001)


def set_cursor(rij, kotje):
    byte = rij << 6 | kotje
    send_instruction(byte | 128)


def move_screen():
    send_instruction(0b00011000)
# endregion

def waarde_inlezen(channel):
    doorsturen_bytes = [1, channel, 0]
    bytes_in = spi.xfer(doorsturen_bytes)
    resultaat = (((bytes_in[1] & 3) << 8) | bytes_in[2])
    return resultaat


def procent_ldr():
    waarde = (waarde_inlezen(0x80)/1023)*100
    procent = abs(round(waarde - 100, 0))
    return procent


def ppm_co2():
    waarde = waarde_inlezen(0x90)
    co2comp = int(waarde-10) # delen door 0 waarde gecalibreerd
    co2ppm = (co2comp/1023)*5000
    return round(co2ppm)


def temperatuur():
    sensor_file_name = '/sys/bus/w1/devices/28-031997795ef8/w1_slave'
    file = open(sensor_file_name, 'r')
    bestand = file.read()
    t = bestand[-6:-1]
    t_int = int(t)
    temp = round(t_int / 1000, 1)
    return temp


def ip_opvragen():
    ips = str(check_output(['hostname', '--all-ip-addresses']))
    deel1_kabel_wifi = ips[18:]
    deel1_wifi = ips[2:]
    ip_kabel_wifi = deel1_kabel_wifi[:-3]
    ip_wifi = deel1_wifi[:-3]
    if len(ips) > 21:
        return ip_kabel_wifi
    else:
        return ip_wifi

#region --- Threading
def live_data():
    global state_afsluiten
    while True:
        if state_afsluiten == 1:
            data_sensor1 = temperatuur()
            data_sensor2 = ppm_co2()
            data_sensor3 = procent_ldr()
            socketio.emit('B2F_data_sensor1', data_sensor1)
            socketio.emit('B2F_data_sensor2', data_sensor2)
            socketio.emit('B2F_data_sensor3', data_sensor3)
            init_LCD()
            write_message(f'{ip_opvragen()}')
            set_cursor(1,0)
            write_message(f'{round(data_sensor1)}')
            set_cursor(1,2)
            send_character(0b11011111)
            set_cursor(1,3)
            write_message(f'c,{round(data_sensor2)}ppm,{round(data_sensor3)}%')
            waardeR = (data_sensor2/1200)*100
            waardeG = 100-waardeR
            if state_rgb == 1:
                if waardeR >= 100:
                    pwm_RgbRed.ChangeDutyCycle(100)
                    pwm_RgbGreen.ChangeDutyCycle(0)
                elif waardeG >= 100:
                    pwm_RgbRed.ChangeDutyCycle(0)
                    pwm_RgbGreen.ChangeDutyCycle(100)
                else:
                    pwm_RgbRed.ChangeDutyCycle(waardeR)
                    pwm_RgbGreen.ChangeDutyCycle(waardeG)
            if state_rgb == 0:
                pwm_RgbRed.ChangeDutyCycle(0)
                pwm_RgbGreen.ChangeDutyCycle(0)
                
        elif state_afsluiten == 0:
            init_LCD()
            write_message('Afsluiten...')

        time.sleep(0.1)


def data_doorsturen():
    global state_rgb, verlichting, ventilator
    while True:
        data_sensor1 = temperatuur()
        data_sensor2 = ppm_co2()
        data_sensor3 = procent_ldr()
        if state_rgb == 1:
            DataRepository.insert_meting(6, 1, datetime.now())
        else:
            DataRepository.insert_meting(6, 0, datetime.now())
        if ventilator > 0:
            DataRepository.insert_meting(5, 1, datetime.now())
        else:
            DataRepository.insert_meting(5, 0, datetime.now())
        if verlichting > 0:
            DataRepository.insert_meting(4, 1, datetime.now())
        else:
            DataRepository.insert_meting(4, 0, datetime.now())
        DataRepository.insert_meting(3, data_sensor3, datetime.now())
        DataRepository.insert_meting(2, data_sensor2, datetime.now())
        DataRepository.insert_meting(1, data_sensor1, datetime.now())
        
        socketio.emit('B2F_refresh_data')
        print('Data opnieuw doorsturen naar database')
        time.sleep(30)


def actuatoren_updaten():
    global state_auto_hm, state_rgb, ventilator, verlichting, ventilatie
    while True:
        if state_auto_hm == 1:
            verlichting = 100-procent_ldr()
            waarde_ventilator = temperatuur() - ventilatie
            # print(waarde_ventilator)

            if waarde_ventilator >= 5:
                ventilator = 100
                pwm_motor.ChangeDutyCycle(ventilator)

            elif waarde_ventilator >= 3:
                ventilator = 70
                pwm_motor.ChangeDutyCycle(ventilator)

            elif waarde_ventilator >= 0:
                ventilator = 50
                pwm_motor.ChangeDutyCycle(ventilator)

            elif waarde_ventilator <= 0:
                ventilator = 0
                pwm_motor.ChangeDutyCycle(ventilator)
               
            # print(f'ventilatie: {ventilatie}')
            # print(f'ventilator: {ventilator}')
            # print(f'verlichting: {verlichting}')
            pwm_lampen.ChangeDutyCycle(verlichting)
        elif state_auto_hm == 0:
            # print(f'ventilator: {ventilator}')
            # print(f'verlichting: {verlichting}')
            pwm_lampen.ChangeDutyCycle(verlichting)
            if ventilator == 0:
                pwm_motor.ChangeDutyCycle(0)
            elif ventilator == 1:
                pwm_motor.ChangeDutyCycle(50)
            elif ventilator == 2:
                pwm_motor.ChangeDutyCycle(70)
            elif ventilator == 3:
                pwm_motor.ChangeDutyCycle(100)
        time.sleep(0.1)


thread1 = threading.Timer(0.1, live_data)
thread1.start()
thread2 = threading.Timer(30, data_doorsturen)
thread2.start()
thread3 = threading.Timer(0.1, actuatoren_updaten)
thread3.start()

# endregion

# endregion

# region --- Code voor Flask
app = Flask(__name__)
app.config['SECRET_KEY'] = 'geheim!'
socketio = SocketIO(app, cors_allowed_origins="*", logger=False,
                    engineio_logger=False, ping_timeout=1)

CORS(app)


@socketio.on_error()        # Handles the default namespace
def error_handler(e):
    print(e)


print("**** Program started ****")
# endregion

# region --- API Routes
endpoint = '/api/v1'


@app.route('/')
def hallo():
    return "Server is running, er zijn momenteel geen API endpoints beschikbaar."


# Routes historiek
@app.route(endpoint + '/historiek', methods=['GET'])
def get_historiek():
    data = DataRepository.read_historiek_join()
    return jsonify(data), 200


@app.route(endpoint + '/historiek/<DeviceID>', methods=['GET'])
def filter_historiek_by_device(DeviceID):
    data = DataRepository.filter_meting_by_device(DeviceID)
    return jsonify(data), 200


@app.route(endpoint + '/historiek/tijd/<minutes>', methods=['GET'])
def filter_historiek_by_tijdstip(minutes):
    data = DataRepository.filter_meting_by_tijdstip(minutes)
    return jsonify(data), 200


@app.route(endpoint + '/historiek/<DeviceID>/tijd/<minutes>', methods=['GET'])
def filter_meting_by_device_tijdstip(DeviceID, minutes):
    data = DataRepository.filter_meting_by_device_tijdstip(DeviceID, minutes)
    return jsonify(data), 200


# Routes grafieken
@app.route(endpoint + '/grafieken/<DeviceID>', methods=['GET'])
def filter_meting_by_device_grafieken(DeviceID):
    data = DataRepository.filter_meting_by_device_grafieken(DeviceID)
    return jsonify(data), 200

@app.route(endpoint + '/grafieken/<DeviceID>/tijd/<minutes>', methods=['GET'])
def filter_meting_by_device_tijdstip_grafieken(DeviceID, minutes):
    data = DataRepository.filter_meting_by_device_tijdstip_grafieken(DeviceID, minutes)
    return jsonify(data), 200

# endregion

#region --- Socket
@socketio.on('connect')
def initial_connection():
    print('A new client connect')
    socketio.emit('B2F_state_knoppen', {'rgb': state_rgb, 'stand': state_auto_hm, 'ventilatie': ventilatie})


@socketio.on('F2B_automatisch')
def automatisch():
    global state_auto_hm, state_rgb, ventilator, ventilatie

    state_auto_hm = 1
    ventilator = 0
    socketio.emit('B2F_state_knoppen', {'rgb': state_rgb, 'stand': state_auto_hm, 'ventilatie': ventilatie})


@socketio.on('F2B_automatisch_ventilatie')
def automatisch(payload):
    global state_auto_hm, ventilatie, state_rgb

    state_auto_hm = 1
    ventilatie = int(payload['ventilatie'])
    socketio.emit('B2F_state_knoppen', {'rgb': state_rgb, 'stand': state_auto_hm, 'ventilatie': ventilatie})


@socketio.on('F2B_handmatig')
def handmatig():
    global state_auto_hm, state_rgb, ventilator, ventilatie
    

    state_auto_hm = 0
    ventilator = 0
    socketio.emit('B2F_state_knoppen', {'rgb': state_rgb, 'stand': state_auto_hm, 'ventilatie': ventilatie})


@socketio.on('F2B_handmatig_waardes')
def handmatig(payload):
    global state_auto_hm, verlichting, ventilator

    state_auto_hm = 0
    verlichting = int(payload['verlichting'])
    ventilator = int(payload['ventilator'])


@socketio.on('F2B_rgb_aan')
def rgb_aan():
    global state_rgb, state_auto_hm, ventilatie

    state_rgb = 1
    socketio.emit('B2F_state_knoppen', {'rgb': state_rgb, 'stand': state_auto_hm, 'ventilatie': ventilatie})


@socketio.on('F2B_rgb_uit')
def rgb_uit():
    global state_rgb, state_auto_hm, ventilatie

    state_rgb = 0
    socketio.emit('B2F_state_knoppen', {'rgb': state_rgb, 'stand': state_auto_hm, 'ventilatie': ventilatie})


@socketio.on('F2B_afsluiten') 
def afsluiten():
    global state_afsluiten

    state_afsluiten = 0
    time.sleep(1)
    call("sudo poweroff", shell=True)


# ANDERE FUNCTIES
if __name__ == '__main__':
    socketio.run(app, debug=False, host='0.0.0.0')
