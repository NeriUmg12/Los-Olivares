// Los Olivares — Proyecto Final de Costos
// Modelo dinámico: Input -> Motor -> Dashboard -> What-If

let paginaActual = 'dashboard';

const TITULOS = {
  dashboard: 'Dashboard de Costos',
  input: '1. Input de Datos',
  motor: '2. Motor de Cálculo',
  whatif: '4. Simulación What-If'
};

const DEFAULTS = {
  capacidadNormal: 10000,
  produccionReal: 8000,
  ventasUnidades: 7000,
  precioVenta: 50,
  materiaPrima: 12,
  manoObra: 8,
  gifVariables: 5,
  gastoVentaVariable: 3,
  fijoProduccion: 80000,
  fijoAdministracion: 30000,
  periodo: 'Octubre 2026'
};

let datos = {...DEFAULTS};

const Q = n => 'Q ' + Number(n || 0).toLocaleString('es-GT', {
  minimumFractionDigits: 2, maximumFractionDigits: 2
});
const N = n => Number(n || 0).toLocaleString('es-GT', {
  maximumFractionDigits: 2
});
const pct = n => (Number(n || 0)).toFixed(2) + '%';

function valor(id) {
  const el = document.getElementById(id);
  return el ? (el.type === 'text' ? el.value : Number(el.value || 0)) : 0;
}

function leerInputs() {
  datos.capacidadNormal = valor('capacidadNormal');
  datos.produccionReal = valor('produccionReal');
  datos.ventasUnidades = valor('ventasUnidades');
  datos.precioVenta = valor('precioVenta');
  datos.materiaPrima = valor('materiaPrima');
  datos.manoObra = valor('manoObra');
  datos.gifVariables = valor('gifVariables');
  datos.gastoVentaVariable = valor('gastoVentaVariable');
  datos.fijoProduccion = valor('fijoProduccion');
  datos.fijoAdministracion = valor('fijoAdministracion');
  datos.periodo = valor('periodo') || 'Periodo actual';
}

function cargarInputs() {
  Object.keys(datos).forEach(k => {
    const el = document.getElementById(k);
    if (el) el.value = datos[k];
  });
}

function calcular(d = datos) {
  const costoVariableManufactura = d.materiaPrima + d.manoObra + d.gifVariables;
  const tasaFija = d.capacidadNormal > 0 ? d.fijoProduccion / d.capacidadNormal : 0;
  const costoAbsUnitario = costoVariableManufactura + tasaFija;
  const inventarioFinal = Math.max(0, d.produccionReal - d.ventasUnidades);

  const ventas = d.ventasUnidades * d.precioVenta;
  const costoVariableManufacturaVentas = d.ventasUnidades * costoVariableManufactura;
  const costoAbsorbenteVentas = d.ventasUnidades * costoAbsUnitario;
  const gastoVentaVariableTotal = d.ventasUnidades * d.gastoVentaVariable;

  const margenContribucion = ventas - costoVariableManufacturaVentas - gastoVentaVariableTotal;
  const margenPct = ventas ? (margenContribucion / ventas) * 100 : 0;

  const utilidadDirecta =
    margenContribucion - d.fijoProduccion - d.fijoAdministracion;

  const utilidadAbsorbente =
    ventas - costoAbsorbenteVentas - gastoVentaVariableTotal - d.fijoAdministracion;

  const diferencia = utilidadAbsorbente - utilidadDirecta;
  const reconciliacion = inventarioFinal * tasaFija;

  const variacionCapacidad =
    (d.capacidadNormal - d.produccionReal) * tasaFija;

  const costosVariablesTotales =
    costoVariableManufacturaVentas + gastoVentaVariableTotal;

  const costosFijosTotales =
    d.fijoProduccion + d.fijoAdministracion;

  const utilizacion =
    d.capacidadNormal ? (d.produccionReal / d.capacidadNormal) * 100 : 0;

  return {
    costoVariableManufactura, tasaFija, costoAbsUnitario,
    inventarioFinal, ventas, costoVariableManufacturaVentas,
    costoAbsorbenteVentas, gastoVentaVariableTotal,
    margenContribucion, margenPct, utilidadDirecta,
    utilidadAbsorbente, diferencia, reconciliacion,
    variacionCapacidad, costosVariablesTotales,
    costosFijosTotales, utilizacion
  };
}

function nav(pagina, el) {
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  if (el && el.classList) el.classList.add('active');

  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const page = document.getElementById('page-' + pagina);
  if (page) page.classList.add('active');

  document.getElementById('topbar-title').textContent =
    TITULOS[pagina] || pagina;
  paginaActual = pagina;

  if (pagina === 'dashboard' || pagina === 'motor' || pagina === 'whatif') {
    actualizarModelo(false);
  }
}

function actualizarModelo(mostrarMensaje = true) {
  leerInputs();

  if (datos.ventasUnidades > datos.produccionReal) {
    mostrarToast('Advertencia: las ventas no pueden superar la producción en este modelo.');
  }

  const r = calcular(datos);
  renderDashboard(r);
  renderMotor(r);
  simularWhatIf();

  if (mostrarMensaje) mostrarToast('Modelo actualizado correctamente');
}

function renderDashboard(r) {
  setText('kpi-ventas', Q(r.ventas));
  setText('kpi-mc', Q(r.margenContribucion));
  setText('kpi-mc-pct', pct(r.margenPct) + ' de las ventas');
  setText('kpi-abs', Q(r.utilidadAbsorbente));
  setText('kpi-dir', Q(r.utilidadDirecta));

  setText('bar-abs-label', Q(r.utilidadAbsorbente));
  setText('bar-dir-label', Q(r.utilidadDirecta));
  setText('diferencia-note', 'Diferencia: ' + Q(r.diferencia) +
    ' · Reconciliación: ' + Q(r.reconciliacion));

  const maxUtil = Math.max(Math.abs(r.utilidadAbsorbente), Math.abs(r.utilidadDirecta), 1);
  setWidth('bar-abs', Math.max(0, Math.abs(r.utilidadAbsorbente) / maxUtil * 100) + '%');
  setWidth('bar-dir', Math.max(0, Math.abs(r.utilidadDirecta) / maxUtil * 100) + '%');

  setText('dash-var', Q(r.costosVariablesTotales));
  setText('dash-fijo', Q(r.costosFijosTotales));

  const totalCostos = r.costosVariablesTotales + r.costosFijosTotales;
  const varPct = totalCostos ? r.costosVariablesTotales / totalCostos * 100 : 0;
  setWidth('stack-var', varPct + '%');
  setWidth('stack-fijo', (100 - varPct) + '%');

  setText('m-capacidad', N(datos.capacidadNormal));
  setText('m-produccion', N(datos.produccionReal));
  setText('m-ventas-unidades', N(datos.ventasUnidades));
  setText('m-inventario', N(r.inventarioFinal));
  setText('m-utilizacion', pct(r.utilizacion));

  const alertas = [];
  if (datos.produccionReal < datos.capacidadNormal) {
    alertas.push(`<div class="alert warn"><i class="ti ti-alert-triangle"></i>La producción utiliza el ${pct(r.utilizacion)} de la capacidad normal.</div>`);
  }
  if (r.inventarioFinal > 0) {
    alertas.push(`<div class="alert info"><i class="ti ti-package"></i>Inventario final: ${N(r.inventarioFinal)} unidades.</div>`);
  }
  if (r.diferencia !== 0) {
    alertas.push(`<div class="alert success"><i class="ti ti-check"></i>La diferencia de utilidades se reconcilia con el inventario final y la tasa fija.</div>`);
  }
  if (datos.ventasUnidades > datos.produccionReal) {
    alertas.push(`<div class="alert danger"><i class="ti ti-alert-circle"></i>Las ventas superan la producción. Revisa los datos.</div>`);
  }
  document.getElementById('dashboard-alertas').innerHTML =
    alertas.join('') || '<div class="alert success"><i class="ti ti-check"></i>Sin alertas relevantes.</div>';
}

function renderMotor(r) {
  setText('motor-cvu', Q(r.costoVariableManufactura));
  setText('motor-tasa', Q(r.tasaFija));
  setText('motor-var-cap', Q(r.variacionCapacidad));
  setText('motor-inv', N(r.inventarioFinal));

  document.getElementById('motor-resumen').innerHTML = `
    <tr><td>Ventas totales</td><td class="text-right">${Q(r.ventas)}</td></tr>
    <tr><td>Costo variable manufactura / unidad</td><td class="text-right">${Q(r.costoVariableManufactura)}</td></tr>
    <tr><td>Tasa fija por unidad</td><td class="text-right">${Q(r.tasaFija)}</td></tr>
    <tr><td>Costo unitario absorbente</td><td class="text-right">${Q(r.costoAbsUnitario)}</td></tr>
    <tr><td>Inventario final</td><td class="text-right">${N(r.inventarioFinal)} unidades</td></tr>
    <tr><td>Margen de contribución total</td><td class="text-right">${Q(r.margenContribucion)}</td></tr>
    <tr><td>Margen de contribución porcentual</td><td class="text-right">${pct(r.margenPct)}</td></tr>
    <tr><td>Variación de capacidad</td><td class="text-right">${Q(r.variacionCapacidad)}</td></tr>
  `;

  document.getElementById('estado-abs').innerHTML = statementAbs(r);
  document.getElementById('estado-dir').innerHTML = statementDir(r);

  document.getElementById('reconciliacion').innerHTML = `
    <tr><td>Utilidad por Costeo Absorbente</td><td class="text-right">${Q(r.utilidadAbsorbente)}</td></tr>
    <tr><td>Utilidad por Costeo Directo</td><td class="text-right">${Q(r.utilidadDirecta)}</td></tr>
    <tr><td>Diferencia de utilidades</td><td class="text-right">${Q(r.diferencia)}</td></tr>
    <tr><td>Inventario final × tasa fija</td><td class="text-right">${Q(r.reconciliacion)}</td></tr>
    <tr><td><b>Diferencia de comprobación</b></td><td class="text-right"><b>${Q(r.diferencia - r.reconciliacion)}</b></td></tr>
  `;

  const ok = Math.abs(r.diferencia - r.reconciliacion) < 0.01;
  const box = document.getElementById('reconciliacion-status');
  box.className = ok ? 'reconcile-ok' : 'reconcile-error';
  box.innerHTML = ok
    ? '<i class="ti ti-circle-check"></i> RECONCILIACIÓN CORRECTA'
    : '<i class="ti ti-alert-circle"></i> Revisar los cálculos del modelo.';
}

function statementAbs(r) {
  return `
    <tr class="section"><td>Ventas</td><td class="text-right">${Q(r.ventas)}</td></tr>
    <tr><td>(-) Costo de ventas absorbente</td><td class="text-right">${Q(r.costoAbsorbenteVentas)}</td></tr>
    <tr class="subtotal"><td>Utilidad bruta</td><td class="text-right">${Q(r.ventas-r.costoAbsorbenteVentas)}</td></tr>
    <tr><td>(-) Gastos de venta variables</td><td class="text-right">${Q(r.gastoVentaVariableTotal)}</td></tr>
    <tr><td>(-) Costos fijos de administración</td><td class="text-right">${Q(datos.fijoAdministracion)}</td></tr>
    <tr class="final"><td>Utilidad de operación</td><td class="text-right">${Q(r.utilidadAbsorbente)}</td></tr>
  `;
}

function statementDir(r) {
  return `
    <tr class="section"><td>Ventas</td><td class="text-right">${Q(r.ventas)}</td></tr>
    <tr><td>(-) Costos variables de manufactura</td><td class="text-right">${Q(r.costoVariableManufacturaVentas)}</td></tr>
    <tr><td>(-) Gastos de venta variables</td><td class="text-right">${Q(r.gastoVentaVariableTotal)}</td></tr>
    <tr class="subtotal"><td>Margen de contribución</td><td class="text-right">${Q(r.margenContribucion)}</td></tr>
    <tr><td>(-) Costos fijos de producción</td><td class="text-right">${Q(datos.fijoProduccion)}</td></tr>
    <tr><td>(-) Costos fijos de administración</td><td class="text-right">${Q(datos.fijoAdministracion)}</td></tr>
    <tr class="final"><td>Utilidad de operación</td><td class="text-right">${Q(r.utilidadDirecta)}</td></tr>
  `;
}

function simularWhatIf() {
  if (!document.getElementById('whatProduccion')) return;
  const varProd = Number(document.getElementById('whatProduccion').value || 0) / 100;
  const varVentas = Number(document.getElementById('whatVentas').value || 0) / 100;

  const sim = {
    ...datos,
    produccionReal: Math.max(0, Math.round(datos.produccionReal * (1 + varProd))),
    ventasUnidades: Math.max(0, Math.round(datos.ventasUnidades * (1 + varVentas)))
  };

  const actual = calcular(datos);
  const nuevo = calcular(sim);

  setText('what-prod', N(sim.produccionReal));
  setText('what-ventas', N(sim.ventasUnidades));
  setText('what-abs', Q(nuevo.utilidadAbsorbente));
  setText('what-cambio', Q(nuevo.utilidadAbsorbente - actual.utilidadAbsorbente));

  document.getElementById('what-tabla').innerHTML = `
    <tr><td>Producción</td><td class="text-right">${N(datos.produccionReal)}</td><td class="text-right">${N(sim.produccionReal)}</td></tr>
    <tr><td>Ventas</td><td class="text-right">${N(datos.ventasUnidades)}</td><td class="text-right">${N(sim.ventasUnidades)}</td></tr>
    <tr><td>Inventario final</td><td class="text-right">${N(actual.inventarioFinal)}</td><td class="text-right">${N(nuevo.inventarioFinal)}</td></tr>
    <tr><td>Utilidad absorbente</td><td class="text-right">${Q(actual.utilidadAbsorbente)}</td><td class="text-right">${Q(nuevo.utilidadAbsorbente)}</td></tr>
    <tr><td>Utilidad directa</td><td class="text-right">${Q(actual.utilidadDirecta)}</td><td class="text-right">${Q(nuevo.utilidadDirecta)}</td></tr>
    <tr><td>Margen de contribución</td><td class="text-right">${Q(actual.margenContribucion)}</td><td class="text-right">${Q(nuevo.margenContribucion)}</td></tr>
  `;

  const cambio = nuevo.utilidadAbsorbente - actual.utilidadAbsorbente;
  const mensaje = cambio > 0
    ? `Al aumentar la producción, manteniendo las ventas constantes, se genera mayor inventario. Bajo el Costeo Absorbente una parte de los costos fijos de producción queda incorporada en el inventario, por lo que la utilidad absorbente simulada cambia en ${Q(cambio)}.`
    : cambio < 0
    ? `El escenario reduce la utilidad absorbente en ${Q(Math.abs(cambio))}. Revisa el volumen de producción y las unidades vendidas.`
    : 'El escenario no modifica la utilidad absorbente.';
  document.getElementById('what-mensaje').innerHTML =
    `<div class="scenario-box"><i class="ti ti-bulb"></i><p>${mensaje}</p></div>`;
}

function restaurarDatos() {
  datos = {...DEFAULTS};
  cargarInputs();
  actualizarModelo();
  mostrarToast('Datos restaurados a los valores iniciales');
}

function mostrarMetodologia() {
  document.getElementById('modal-metodologia').style.display = 'flex';
}
function closeModal(id) {
  const m = document.getElementById(id);
  if (m) m.style.display = 'none';
}

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}
function setWidth(id, value) {
  const el = document.getElementById(id);
  if (el) el.style.width = value;
}

let toastTimer;
function mostrarToast(msg) {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.style.display = 'block';
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.style.display = 'none', 2800);
}

document.addEventListener('DOMContentLoaded', () => {
  cargarInputs();
  actualizarModelo(false);
});
