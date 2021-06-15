from .Database import Database


class DataRepository:
    @staticmethod
    def json_or_formdata(request):
        if request.content_type == 'application/json':
            gegevens = request.get_json()
        else:
            gegevens = request.form.to_dict()
        return gegevens

    @staticmethod
    def read_devices():
        sql = "SELECT * from device"
        return Database.get_rows(sql)

    @staticmethod
    def read_historiek():
        sql = "SELECT * from devicewaarde ORDER BY MetingID DESC"
        return Database.get_rows(sql)

    @staticmethod
    def read_historiek_join():
        sql = "SELECT d.Naam as 'Naam_Device', dw.Waarde, d.Meeteenheid, date_format(dw.Tijdstip, '%d/%m/%Y %H:%i:%S') as 'Tijdstip' FROM devicewaarde dw JOIN device d ON d.DeviceID = dw.DeviceID ORDER BY MetingID DESC LIMIT 1000"
        return Database.get_rows(sql)

    @staticmethod
    def filter_meting_by_device(DeviceID):
        sql = "SELECT dw.MetingID, d.Naam as 'Naam_Device', dw.Waarde, d.Meeteenheid, date_format(dw.Tijdstip, '%d/%m/%Y %H:%i:%S') as 'Tijdstip' FROM devicewaarde dw JOIN device d ON d.DeviceID = dw.DeviceID WHERE d.DeviceID=%s ORDER BY dw.MetingID DESC"
        params = [DeviceID]
        return Database.get_rows(sql, params)

    @staticmethod
    def filter_meting_by_tijdstip(minutes):
        sql = "SELECT d.Naam as 'Naam_Device', dw.Waarde, d.Meeteenheid, date_format(dw.Tijdstip, '%d/%m/%Y %H:%i:%S') as 'Tijdstip' FROM devicewaarde dw JOIN device d ON d.DeviceID = dw.DeviceID WHERE Tijdstip between (now() - interval %s minute) AND now() ORDER BY MetingID DESC"
        params = [minutes]
        return Database.get_rows(sql, params)

    @staticmethod
    def filter_meting_by_device_tijdstip(DeviceID, minutes):
        sql = "SELECT dw.MetingID, d.Naam as 'Naam_Device', dw.Waarde, d.Meeteenheid, date_format(dw.Tijdstip, '%d/%m/%Y %H:%i:%S') as 'Tijdstip' FROM devicewaarde dw JOIN device d ON d.DeviceID = dw.DeviceID WHERE d.DeviceID = %s AND dw.Tijdstip between (now() - interval %s minute) AND now() ORDER BY dw.MetingID DESC"
        params = [DeviceID, minutes]
        return Database.get_rows(sql, params)

    @staticmethod
    def insert_meting(DeviceID, Waarde, Tijdstip):
        sql = "INSERT INTO devicewaarde(DeviceID, Waarde, Tijdstip) VALUES(%s,%s,%s)"
        params = [DeviceID, Waarde, Tijdstip]
        return Database.execute_sql(sql, params)

    # Methodes grafieken
    @staticmethod
    def filter_meting_by_device_grafieken(DeviceID):
        sql = "SELECT dw.MetingID, d.Naam as 'Naam_Device', dw.Waarde, d.Meeteenheid, dw.Tijdstip FROM devicewaarde dw JOIN device d ON d.DeviceID = dw.DeviceID WHERE d.DeviceID=%s ORDER BY dw.MetingID DESC"
        params = [DeviceID]
        return Database.get_rows(sql, params)

    @staticmethod
    def filter_meting_by_device_tijdstip_grafieken(DeviceID, minutes):
        sql = "SELECT dw.MetingID, d.Naam as 'Naam_Device', dw.Waarde, d.Meeteenheid, dw.Tijdstip FROM devicewaarde dw JOIN device d ON d.DeviceID = dw.DeviceID WHERE d.DeviceID = %s AND dw.Tijdstip between (now() - interval %s minute) AND now() ORDER BY dw.MetingID DESC"
        params = [DeviceID, minutes]
        return Database.get_rows(sql, params)
