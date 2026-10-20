# Opciones de producto (PRD)

Cuatro capacidades que hoy le faltan a PropPilot para el propietario chico argentino. Se eligen dos para construir.

## Opciones
- **REQ-001** [Control de morosidad y recordatorios](REQ-001.md): ver quien esta atrasado y recordarle el pago.
- **REQ-002** [Alertas de vencimiento, renovacion y proximo ajuste](REQ-002.md): avisos antes del fin del contrato y de cada ajuste.
- **REQ-003** [Recibos de pago](REQ-003.md): comprobante numerado para el inquilino.
- **REQ-004** [Reporte de ingresos y gastos](REQ-004.md): resultado por propiedad y mes, con gastos cargados.

## Pueden construirse en paralelo?
Nivel negocio: que areas de la app toca cada una.

| | 001 | 002 | 003 | 004 |
|---|---|---|---|---|
| 001 morosidad | - | Si | Parcial | Si |
| 002 alertas | Si | - | Si | Si |
| 003 recibos | Parcial | Si | - | Parcial |
| 004 reportes | Si | Si | Parcial | - |

- 001 y 003 comparten el area de pagos: ambas cambian la lista de pagos.
- 003 y 004 comparten datos de pagos, aunque en pantallas distintas.
- 002 trabaja sobre contratos y fechas, casi sin cruce con las demas.

## Par recomendado: REQ-001 + REQ-002
- Atacan los dos riesgos de ingreso mas directos: cobrar tarde y dejar vencer o desajustar un contrato.
- Trabajan en areas distintas (pagos versus contratos), asi que casi no se pisan.
- Las dos son visibles en el inicio, buena demo para una reunion.
- Los recibos y los reportes son utiles, pero dependen de que el cobro ya este bien controlado.

## Apendice: errores y brechas encontrados
No son funcionalidades, son arreglos. Quedan como notas.
- La tarjeta "Inquilinos Activos" cuenta todos los inquilinos, no solo los que tienen contrato vigente (muestra 8, deberian ser 6 con los datos de ejemplo).
- El alquiler ajustado ignora la frecuencia de ajuste del contrato: cambia todos los meses en vez de cada N meses.
- El saldo pendiente usa el alquiler base, no el ajustado.
- La interfaz tiene la etiqueta "Vencido", pero el sistema no tiene ese estado.
