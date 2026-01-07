from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from database import get_db
from datetime import datetime, date
from dateutil.relativedelta import relativedelta # Necesario para sumar meses exactos
from typing import Optional, List
from models.cuenta import Cuenta
from schemas.cuenta import CuentaCreate, CuentaOut
from models.cuota import Cuota 
from models.cuenta_persona import CuentaPersona 
from models.tarjeta import Tarjeta

router = APIRouter(prefix="/cuentas", tags=["Cuentas"])

@router.post("/")
@router.post("/")
def crear_cuenta(cuenta: CuentaCreate, db: Session = Depends(get_db)):
    # 1. CASO ESPECIAL: TRANSFERENCIA ENTRE CUENTAS PROPIAS
    if cuenta.tipo == "transferencia":
        if cuenta.tarjeta_id == cuenta.tarjeta_destino_id:
            raise HTTPException(status_code=400, detail="La tarjeta de origen y destino no pueden ser iguales.")

        tarjeta_origen = db.query(Tarjeta).filter(
            Tarjeta.id == cuenta.tarjeta_id, 
            Tarjeta.persona_id == cuenta.titular_id
        ).first()
        
        tarjeta_destino = db.query(Tarjeta).filter(
            Tarjeta.id == cuenta.tarjeta_destino_id, 
            Tarjeta.persona_id == cuenta.titular_id
        ).first()

        if not tarjeta_origen or not tarjeta_destino:
            raise HTTPException(
                status_code=400, 
                detail="Una o ambas tarjetas no pertenecen al titular o no existen."
            )

        # Creamos los dos movimientos (Salida y Entrada)
        for sub_tipo in ["Salida", "Entrada"]:
            c_mov = Cuenta(
                nombre=f"Transf: {cuenta.nombre} ({sub_tipo})",
                tipo="transferencia",
                fecha_inicio=cuenta.fecha_inicio,
                titular_id=cuenta.titular_id,
                tarjeta_id=cuenta.tarjeta_id if sub_tipo == "Salida" else cuenta.tarjeta_destino_id
            )
            db.add(c_mov)
            db.flush()
            
            # Las transferencias siempre generan una única cuota ya pagada (pago inmediato)
            nueva_cuota = Cuota(
                cuenta_id=c_mov.id,
                numero=1,
                monto=cuenta.monto_total,
                pagada=True,
                fecha_vencimiento=cuenta.fecha_inicio,
                fecha_pago=cuenta.fecha_inicio
            )
            db.add(nueva_cuota)

        db.commit()
        return {"message": "Transferencia interna realizada con éxito"}

    # 2. CASO NORMAL: INGRESOS / EGRESOS / PRÉSTAMOS
    tarjeta = None
    if cuenta.tarjeta_id:
        tarjeta = db.query(Tarjeta).filter(
            Tarjeta.id == cuenta.tarjeta_id,
            Tarjeta.persona_id == cuenta.titular_id
        ).first()
        
        if not tarjeta:
            raise HTTPException(
                status_code=400, 
                detail="La tarjeta seleccionada no pertenece al titular."
            )

    # Definir si el impacto en el saldo es inmediato
    es_pago_inmediato = False
    if cuenta.tipo == "ingreso":
        es_pago_inmediato = True
    elif cuenta.tipo == "egreso" and not cuenta.tarjeta_id:
        es_pago_inmediato = True
    elif tarjeta and tarjeta.tipo.lower() == "debito":
        es_pago_inmediato = True

    # --- LÓGICA DE VENCIMIENTO INTELIGENTE (Solo para Crédito) ---
    fecha_primer_vencimiento = cuenta.fecha_inicio

    if tarjeta and tarjeta.tipo.lower() == "credito":
        dia_compra = cuenta.fecha_inicio.day
        dia_cierre = tarjeta.dia_cierre or 25 
        dia_vence = tarjeta.dia_vencimiento or 5

        # Si compró después del cierre, cae en el segundo mes entrante
        if dia_compra > dia_cierre:
            fecha_primer_vencimiento = cuenta.fecha_inicio + relativedelta(months=2)
        else:
            fecha_primer_vencimiento = cuenta.fecha_inicio + relativedelta(months=1)
        
        try:
            fecha_primer_vencimiento = fecha_primer_vencimiento.replace(day=dia_vence)
        except ValueError:
            # Por si el día de vencimiento es 31 y el mes tiene 30
            fecha_primer_vencimiento = fecha_primer_vencimiento + relativedelta(day=31)

    # Registro de la Cuenta principal
    nueva_cuenta = Cuenta(
        nombre=cuenta.nombre,
        tipo=cuenta.tipo,
        fecha_inicio=cuenta.fecha_inicio,
        titular_id=cuenta.titular_id,
        tarjeta_id=cuenta.tarjeta_id 
    )
    db.add(nueva_cuenta)
    db.flush()

    # Calcular cuotas
    total_cuotas = cuenta.cantidad_cuotas if cuenta.cantidad_cuotas and cuenta.cantidad_cuotas > 0 else 1
    if es_pago_inmediato: 
        total_cuotas = 1

    monto_cuota = cuenta.monto_total / total_cuotas

    # Generación de Cuotas
    for i in range(total_cuotas):
        # Si es pago inmediato, el vencimiento es la fecha de compra. Si no, se calcula por mes.
        vencimiento_real = cuenta.fecha_inicio if es_pago_inmediato else fecha_primer_vencimiento + relativedelta(months=i)
        
        nueva_cuota = Cuota(
            cuenta_id=nueva_cuenta.id,
            numero=i + 1,
            monto=monto_cuota,
            pagada=es_pago_inmediato,
            fecha_vencimiento=vencimiento_real,
            fecha_pago=cuenta.fecha_inicio if es_pago_inmediato else None
        )
        db.add(nueva_cuota)

    # 3. REGISTRO DE PARTICIPANTES (Deudas de terceros)
    if cuenta.participantes:
        for p in cuenta.participantes:
            cp = CuentaPersona(
                cuenta_id=nueva_cuenta.id,
                persona_id=p.persona_id,
                monto_asignado=p.monto_asignado
            )
            db.add(cp)
    
    db.commit()
    return {"message": "Movimiento registrado con éxito"}

@router.get("/titular/{titular_id}")
def listar_movimientos(
    titular_id: int, 
    mes: Optional[int] = None, 
    anio: Optional[int] = None,
    tipo: Optional[str] = None,
    persona_id: Optional[int] = None,
    skip: int = 0,    # <--- Salta N registros (ej: si skip es 10, empieza desde el 11)
    limit: int = 5,  # <--- Máximo de registros por "lote"
    db: Session = Depends(get_db)
):
    # 1. Iniciamos la consulta con las relaciones necesarias
    query = db.query(Cuenta).options(
        joinedload(Cuenta.cuotas), 
        joinedload(Cuenta.tarjeta)
    ).filter(Cuenta.titular_id == titular_id)

    # 2. Filtro por fecha (Cuotas)
    if mes and anio:
        fecha_desde = date(int(anio), int(mes), 1)
        if int(mes) == 12:
            fecha_hasta = date(int(anio) + 1, 1, 1)
        else:
            fecha_hasta = date(int(anio), int(mes) + 1, 1)
        
        query = query.join(Cuota).filter(
            Cuota.fecha_vencimiento >= fecha_desde, 
            Cuota.fecha_vencimiento < fecha_hasta
        )

    # 3. Filtro por tipo
    if tipo:
        query = query.filter(Cuenta.tipo == tipo)
        
    # 4. Filtro por persona
    if persona_id:
        query = query.join(Cuenta.personas).filter(CuentaPersona.persona_id == persona_id)

    # 5. Aplicamos Orden, Paginación y ejecutamos
    # Es vital que el order_by vaya antes del limit/offset
    return query.distinct() \
                .order_by(Cuenta.fecha_inicio.desc()) \
                .offset(skip) \
                .limit(limit) \
                .all()

@router.patch("/{cuenta_id}/anular")
def anular_cuenta(cuenta_id: int, db: Session = Depends(get_db)):
    cuenta = db.query(Cuenta).filter(Cuenta.id == cuenta_id).first()
    if not cuenta:
        raise HTTPException(status_code=404, detail="Cuenta no encontrada")
    
    cuenta.anulada = True
    # Opcional: Podrías marcar las cuotas de esta cuenta como no pagadas 
    # si quieres que dejen de sumar en ingresos.
    db.commit()
    return {"message": "Movimiento anulado"}

@router.delete("/{cuenta_id}")
def eliminar_cuenta(cuenta_id: int, db: Session = Depends(get_db)):
    cuenta = db.query(Cuenta).filter(Cuenta.id == cuenta_id).first()
    if not cuenta:
        raise HTTPException(status_code=404, detail="Cuenta no encontrada")
    
    # SQLAlchemy borrará las cuotas en cascada si tienes configurado cascade="all, delete"
    db.delete(cuenta)
    db.commit()
    return {"message": "Movimiento eliminado definitivamente"}