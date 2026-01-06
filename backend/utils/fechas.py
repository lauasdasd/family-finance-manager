from datetime import date
from dateutil.relativedelta import relativedelta

def cuota_es_del_mes(fecha_inicio, numero_cuota, mes, anio):
    fecha_cuota = fecha_inicio + relativedelta(months=numero_cuota - 1)
    return fecha_cuota.month == mes and fecha_cuota.year == anio
