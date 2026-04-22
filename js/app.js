/**
 * CMMS Enterprise — Main Application
 * SAP Fiori / CCMS Style Interface
 */

// ═══════════════════════════════════════════════
//  STATE
// ═══════════════════════════════════════════════
const State = {
  currentModule: 'dashboard',
  rows: [],
  filtered: [],
  sortCol: null,
  sortDir: 1,
  editingRow: null,
  editingIndex: null,
  useMock: !API.getUrl(),
  user: null, // Usuario autenticado
  permissions: {
    canDelete: false,
    allowedViews: []
  }
};

// ═══════════════════════════════════════════════
//  BOOT
// ═══════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', async () => {
  const savedUser = localStorage.getItem('cmms_user');
  if (savedUser) {
    State.user = JSON.parse(savedUser);
    applyPermissions();
    renderShell();
    navigate('dashboard');
  } else {
    renderLogin();
  }
});

function renderLogin() {
  document.body.innerHTML = `
    <div style="height:100vh; display:flex; align-items:center; justify-content:center; background:#1c2228">
      <div class="modal" style="display:block; opacity:1; pointer-events:all; width:350px; position:static; transform:none">
        <div class="modal-header" style="justify-content:center; border:none; padding-top:40px">
          <div style="text-align:center">
            <div style="font-size:24px; font-weight:700; color:#fff; letter-spacing:1px">CMMS ENTERPRISE</div>
            <div style="font-size:10px; color:var(--text-sub); text-transform:uppercase; margin-top:5px">Portal de Acceso Seguro</div>
          </div>
        </div>
        <div class="modal-body" style="padding:30px">
          <div class="form-field">
            <label class="form-label">Usuario</label>
            <input type="text" id="login-user" class="form-input" placeholder="admin / supervisor / tecnico">
          </div>
          <div class="form-field" style="margin-top:20px">
            <label class="form-label">Contraseña</label>
            <input type="password" id="login-pass" class="form-input" placeholder="••••••">
          </div>
          <button class="btn btn-primary" style="width:100%; margin-top:30px; padding:12px" onclick="handleLogin()">INICIAR SESIÓN</button>
        </div>
      </div>
    </div>`;
}

async function handleLogin() {
  const u = document.getElementById('login-user').value.toLowerCase();
  
  // DEMO DE ROLES (En producción consultar tabla 'usuarios' + 'roles')
  if (u === 'admin') {
    State.user = { id: '1', nombre: 'Super Admin', role: 'Super Admin' };
  } else if (u === 'supervisor') {
    State.user = { id: '2', nombre: 'Supervisor Planta', role: 'Supervisor' };
  } else if (u === 'tecnico') {
    State.user = { id: '3', nombre: 'Técnico Campo', role: 'Técnico' };
  } else {
    return alert('Usuario no reconocido. Use: admin, supervisor o tecnico');
  }

  localStorage.setItem('cmms_user', JSON.stringify(State.user));
  location.reload();
}

function applyPermissions() {
  if (!State.user) return;
  const r = State.user.role;
  
  if (r === 'Super Admin') {
    State.permissions = { canDelete: true, allowedViews: ['*'] };
  } else if (r === 'Supervisor') {
    State.permissions = { canDelete: false, allowedViews: ['dashboard','activos','manto','planeacion','inventarios','personal'] };
  } else {
    State.permissions = { canDelete: false, allowedViews: ['dashboard','manto','planeacion','calendario','gantt'] };
  }
}

function renderShell() {
  // Solo restaurar el shell original que está en el HTML si estamos logueados
  location.reload; // El HTML base ya tiene el shell, pero el login lo sobreescribió
}

function logout() {
  localStorage.removeItem('cmms_user');
  location.reload();
}

// ═══════════════════════════════════════════════
//  NAVIGATION
// ═══════════════════════════════════════════════
  if (State.permissions.allowedViews[0] !== '*' && !State.permissions.allowedViews.includes(module)) {
    if (module !== 'dashboard') {
      toast('No tienes permiso para acceder a esta vista', 'error');
      return;
    }
  }

  State.currentModule = module;
  // Update nav items
  document.querySelectorAll('.nav-item, .nav-sub').forEach(el => {
    el.classList.toggle('active', el.getAttribute('data-module') === module);
  });
  document.getElementById('shellContext').textContent =
    module === 'dashboard' ? 'Dashboard' :
    module === 'configuracion' ? 'Configuración' :
    module === 'calendario' ? 'Calendario de Trabajo' :
    module === 'gantt' ? 'Diagrama de Gantt' :
    module === 'ordenes_en_proceso' ? 'Órdenes en Ejecución' :
    module === 'usuarios' ? 'Gestión de Usuarios' :
    module === 'roles' ? 'Roles y Seguridad' :
    module === 'configuracion_negocio' ? 'Datos del Negocio' :
    (SCHEMA[module]?.label || module);

  if (module === 'dashboard')     renderDashboard();
  else if (module === 'configuracion') renderConfig();
  else if (module === 'calendario') renderCalendar();
  else if (module === 'gantt')      renderGantt();
  else if (module === 'ordenes_en_proceso') renderOrdersInProcess();
  else                            renderModule(module);
}

async function renderOrdersInProcess() {
  State.currentModule = 'ordenes_trabajo';
  await renderModule('ordenes_trabajo');
  document.getElementById('gridFilter').value = 'En proceso';
  filterGrid('En proceso');
  document.getElementById('shellContext').textContent = '▶ Órdenes en Ejecución';
}

// ── GANTT VIEW (DYNAMIC) ──────────────────────────
async function renderGantt() {
  const mc = document.getElementById('mainContent');
  mc.innerHTML = `<div class="page-header"><h1 class="page-title">📊 Diagrama de Gantt</h1></div><div class="gantt-container" id="ganttWrap"></div>`;

  const rows = State.useMock ? API.getMockRows('ordenes_trabajo') : await API.getRows('ordenes_trabajo');
  const ots = rows.filter(r => r.fecha_inicio_programada).sort((a,b) => a.fecha_inicio_programada.localeCompare(b.fecha_inicio_programada));

  if (!ots.length) {
    document.getElementById('ganttWrap').innerHTML = '<div class="no-data">No hay órdenes programadas para mostrar en el Gantt.</div>';
    return;
  }

  // Dynamic range based on data
  const minDate = new Date(ots[0].fecha_inicio_programada);
  minDate.setDate(minDate.getDate() - 2); // padding

  let html = `<div class="gantt-chart">
    <div class="gantt-sidebar">
      <div class="gantt-row-hdr">Orden de Trabajo</div>
      ${ots.map(ot => `<div class="gantt-row-label">${ot.numero_ot}</div>`).join('')}
    </div>
    <div class="gantt-body">
      <div class="gantt-timeline">
        ${[...Array(20)].map((_, i) => {
          const d = new Date(minDate); d.setDate(d.getDate() + i);
          return `<div class="gantt-time-col">${d.getDate()}/${d.getMonth()+1}</div>`;
        }).join('')}
      </div>
      ${ots.map(ot => {
        const start = new Date(ot.fecha_inicio_programada);
        const diff = Math.floor((start - minDate) / (1000*60*60*24));
        const left = diff * 50; 
        return `
          <div class="gantt-row-track">
            <div class="gantt-bar ${BADGE_COLORS[ot.estado] || ''}" style="left:${left}px; width:100px" onclick="viewOrderDetailsByName('${ot.numero_ot}')">
              <span class="gantt-bar-text">${ot.estado}</span>
            </div>
          </div>`;
      }).join('')}
    </div>
  </div>`;
  document.getElementById('ganttWrap').innerHTML = html;
}

// ── CALENDAR VIEW ────────────────────────────────
async function renderCalendar() {
  const mc = document.getElementById('mainContent');
  mc.innerHTML = `
    <div class="page-header">
      <div class="page-title-group">
        <h1 class="page-title">🗓 Calendario de Trabajo</h1>
        <div class="page-subtitle">Órdenes de Trabajo por fecha programada</div>
      </div>
    </div>
    <div class="calendar-wrap" id="calWrap">
      <div class="spinner"></div>
    </div>`;

  const rows = State.useMock ? API.getMockRows('ordenes_trabajo') : await API.getRows('ordenes_trabajo');
  
  // Basic Calendar Logic (Current Month)
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

  let html = `<div class="cal-hdr">${monthNames[month]} ${year}</div>`;
  html += `<div class="cal-grid">
    <div class="cal-day-name">DOM</div><div class="cal-day-name">LUN</div><div class="cal-day-name">MAR</div>
    <div class="cal-day-name">MIÉ</div><div class="cal-day-name">JUE</div><div class="cal-day-name">VIE</div><div class="cal-day-name">SÁB</div>`;

  for (let i = 0; i < firstDay; i++) html += `<div class="cal-day empty"></div>`;
  
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const ots = rows.filter(r => r.fecha_inicio_programada === dateStr);
    
    html += `<div class="cal-day">
      <div class="cal-num">${d}</div>
      <div class="cal-events">
        ${ots.map(ot => `<div class="cal-event ${BADGE_COLORS[ot.estado] || ''}" onclick="viewOrderDetailsByName('${ot.numero_ot}')">${ot.numero_ot}</div>`).join('')}
      </div>
    </div>`;
  }
  html += `</div>`;
  document.getElementById('calWrap').innerHTML = html;
}

// ── GANTT VIEW ──────────────────────────────────
async function renderGantt() {
  const mc = document.getElementById('mainContent');
  mc.innerHTML = `
    <div class="page-header">
      <h1 class="page-title">📊 Diagrama de Gantt</h1>
    </div>
    <div class="gantt-container" id="ganttWrap"></div>`;

  const rows = State.useMock ? API.getMockRows('ordenes_trabajo') : await API.getRows('ordenes_trabajo');
  const ots = rows.filter(r => r.fecha_inicio_programada).sort((a,b) => a.fecha_inicio_programada.localeCompare(b.fecha_inicio_programada));

  let html = `<div class="gantt-chart">
    <div class="gantt-sidebar">
      <div class="gantt-row-hdr">Orden de Trabajo</div>
      ${ots.map(ot => `<div class="gantt-row-label">${ot.numero_ot}</div>`).join('')}
    </div>
    <div class="gantt-body">
      <div class="gantt-timeline">
        ${[...Array(14)].map((_, i) => {
          const d = new Date(); d.setDate(d.getDate() + i - 7);
          return `<div class="gantt-time-col">${d.getDate()}/${d.getMonth()+1}</div>`;
        }).join('')}
      </div>
      ${ots.map(ot => {
        const start = new Date(ot.fecha_inicio_programada);
        const today = new Date(); today.setHours(0,0,0,0);
        const diff = Math.floor((start - today) / (1000*60*60*24)) + 7;
        const left = diff * 50; // 50px per day
        return `
          <div class="gantt-row-track">
            <div class="gantt-bar ${BADGE_COLORS[ot.estado] || ''}" style="left:${left}px; width:80px" title="${ot.numero_ot}: ${ot.estado}">
              <span class="gantt-bar-text">${ot.estado}</span>
            </div>
          </div>`;
      }).join('')}
    </div>
  </div>`;
  document.getElementById('ganttWrap').innerHTML = html;
}

function viewOrderDetailsByName(name) {
  const idx = State.rows.findIndex(r => r.numero_ot === name);
  if (idx >= 0) viewOrderDetails(idx);
}

function toggleNav() {
  const nav = document.getElementById('sideNav');
  nav.classList.toggle('collapsed');
}

function toggleGroup(id) {
  const body  = document.getElementById('grp-' + id);
  const arrow = document.getElementById('arr-' + id);
  const open  = body.classList.toggle('open');
  arrow.style.transform = open ? 'rotate(90deg)' : '';
}

// ═══════════════════════════════════════════════
//  DASHBOARD
// ═══════════════════════════════════════════════
async function renderDashboard() {
  const mc = document.getElementById('mainContent');
  mc.innerHTML = `
    <div class="page-header">
      <div class="page-title-group">
        <div class="page-breadcrumb">CMMS Enterprise</div>
        <h1 class="page-title">Dashboard</h1>
        <div class="page-subtitle">Resumen operacional en tiempo real</div>
      </div>
      <div class="page-actions">
        <button class="btn btn-ghost btn-sm" onclick="renderDashboard()">↻ Actualizar</button>
      </div>
    </div>
    <div class="dashboard" id="dashBody">
      <div class="kpi-grid" id="kpiGrid">
        ${[1,2,3,4,5].map(() => `<div class="kpi-card"><div class="skel" style="height:80px"></div></div>`).join('')}
      </div>
    </div>`;

  const data = State.useMock ? API.getMockDashboard() : await API.getDashboard().catch(() => API.getMockDashboard());

  document.getElementById('kpiGrid').innerHTML = `
    <div class="kpi-card" style="--kpi-color:#0070f2" onclick="navigate('Ordenes_de_Trabajo')">
      <div class="kpi-icon">📋</div>
      <div class="kpi-value">${data.ot_pendientes}</div>
      <div class="kpi-label">OT Pendientes</div>
      <div class="kpi-trend trend-up">+2 hoy</div>
    </div>
    <div class="kpi-card" style="--kpi-color:#e9730c" onclick="navigate('Ordenes_de_Trabajo')">
      <div class="kpi-icon">⚡</div>
      <div class="kpi-value">${data.ot_en_proceso}</div>
      <div class="kpi-label">En Proceso</div>
    </div>
    <div class="kpi-card" style="--kpi-color:#107e3e" onclick="navigate('Ordenes_de_Trabajo')">
      <div class="kpi-icon">✅</div>
      <div class="kpi-value">${data.ot_completadas_mes}</div>
      <div class="kpi-label">Completadas (mes)</div>
      <div class="kpi-trend trend-up">↑ 12%</div>
    </div>
    <div class="kpi-card" style="--kpi-color:#bb0000" onclick="navigate('Activos_Padre')">
      <div class="kpi-icon">🚨</div>
      <div class="kpi-value">${data.activos_falla}</div>
      <div class="kpi-label">Activos con Falla</div>
    </div>
    <div class="kpi-card" style="--kpi-color:#6929c4" onclick="navigate('Inventarios')">
      <div class="kpi-icon">⚠</div>
      <div class="kpi-value">${data.inventario_bajo_stock}</div>
      <div class="kpi-label">Bajo Stock</div>
    </div>
    <div class="kpi-card" style="--kpi-color:#0097a7" onclick="navigate('Personal')">
      <div class="kpi-icon">👤</div>
      <div class="kpi-value">${data.personal_activo}</div>
      <div class="kpi-label">Personal Activo</div>
    </div>`;

  // Recent OTs
  const otRows = State.useMock ? API.getMockRows('Ordenes_de_Trabajo') : [];
  document.getElementById('dashBody').innerHTML += `
    <div class="dash-grid">
      <div class="dash-card">
        <div class="dash-card-hdr">
          <span class="dash-card-title">📋 Órdenes de Trabajo Recientes</span>
          <button class="btn btn-ghost btn-sm" onclick="navigate('Ordenes_de_Trabajo')">Ver todas</button>
        </div>
        <div class="dash-card-body">
          <div class="ot-list">
            ${otRows.map(ot => `
              <div class="ot-item ${ot.prioridad === 'Crítica' ? 'critical' : ot.prioridad === 'Alta' ? 'high' : ''}">
                <div>
                  <div class="ot-num">${ot.numero_ot}</div>
                  <div class="ot-desc">${ot.descripcion_falla || ot.descripcion_trabajo || '—'}</div>
                  <div class="ot-meta">${ot.tipo_ot} · ${ot.fecha_creacion || ''}</div>
                </div>
                <div style="display:flex;flex-direction:column;align-items:flex-end;gap:4px">
                  ${badge(ot.estado)}
                  ${badge(ot.prioridad)}
                </div>
              </div>`).join('')}
          </div>
        </div>
      </div>
      <div class="dash-card">
        <div class="dash-card-hdr"><span class="dash-card-title">📊 Estado de Activos</span></div>
        <div class="dash-card-body">
          ${statBar('Operativos', data.activos_operativos, data.activos_total, '#107e3e')}
          ${statBar('En Mantenimiento', data.activos_total - data.activos_operativos - data.activos_falla, data.activos_total, '#e9730c')}
          ${statBar('Fuera de Servicio', data.activos_falla, data.activos_total, '#bb0000')}
          <div style="margin-top:20px;padding-top:16px;border-top:1px solid var(--border)">
            <div style="font-size:11px;color:var(--text-sub);margin-bottom:4px">UPTIME PROMEDIO</div>
            <div style="font-size:28px;font-weight:300;color:#48bb78">${data.uptime_promedio}%</div>
          </div>
          <div style="margin-top:16px;padding-top:16px;border-top:1px solid var(--border)">
            <div style="font-size:11px;color:var(--text-sub);margin-bottom:4px">COSTO MES</div>
            <div style="font-size:22px;font-weight:300;color:#f6ad55">$${data.costo_mes.toLocaleString()}</div>
          </div>
        </div>
      </div>
    </div>`;
}

function statBar(label, val, total, color) {
  const pct = total ? Math.round(val / total * 100) : 0;
  return `<div style="margin-bottom:14px">
    <div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:5px">
      <span style="color:var(--text-sub)">${label}</span>
      <span style="color:var(--text)">${val} / ${total}</span>
    </div>
    <div style="height:6px;background:var(--surface2);border-radius:3px">
      <div style="height:100%;width:${pct}%;background:${color};border-radius:3px;transition:.4s"></div>
    </div>
  </div>`;
}

// ═══════════════════════════════════════════════
//  MODULE VIEW (Data Grid)
// ═══════════════════════════════════════════════
async function renderModule(module) {
  const schema = SCHEMA[module];
  if (!schema) return;

  const mc = document.getElementById('mainContent');
  mc.innerHTML = `
    <div class="page-header">
      <div class="page-title-group">
        <div class="page-breadcrumb">${schema.group} › ${schema.label}</div>
        <h1 class="page-title">${schema.icon} ${schema.label}</h1>
        <div class="page-subtitle" id="pageSubtitle">Cargando...</div>
      </div>
      <div class="page-actions">
        <button class="btn btn-ghost btn-sm" onclick="renderModule('${module}')">↻</button>
        <button class="btn btn-primary" onclick="openNewModal('${module}')">+ Nuevo</button>
      </div>
    </div>
    <div class="toolbar">
      <div class="toolbar-search">
        <svg width="13" height="13" viewBox="0 0 16 16" fill="var(--text-dim)"><path d="M15.7 14.3l-4.2-4.2A6 6 0 1 0 0 6a6 6 0 0 0 9.5 4.9l4.2 4.2 2-2.8zM6 10a4 4 0 1 1 0-8 4 4 0 0 1 0 8z"/></svg>
        <input type="text" placeholder="Filtrar registros..." id="gridFilter" oninput="filterGrid(this.value)">
      </div>
      <button class="btn btn-ghost btn-sm" onclick="exportCSV('${module}')">↓ Exportar CSV</button>
      <span class="record-count" id="recordCount"></span>
    </div>
    <div class="grid-wrap" id="gridWrap">
      <div style="padding:40px;text-align:center">
        <div class="spinner" style="margin:0 auto"></div>
      </div>
    </div>`;

  try {
    const isConfigured = !!API.getConfig().url;
    updateConnStatus(isConfigured);

    const rows = State.useMock
      ? API.getMockRows(module)
      : await API.getRows(module);
      
    State.rows     = Array.isArray(rows) ? rows : [];
    State.filtered = [...State.rows];
    
    renderGrid(module);
    
    const count = State.rows.length;
    document.getElementById('pageSubtitle').textContent = `${count} registros encontrados`;
    document.getElementById('recordCount').textContent = `${count} registros`;
    
    if (count === 0 && !State.useMock) {
      toast('No se encontraron datos en Supabase para esta tabla', 'info');
    }
  } catch (err) {
    console.error(err);
    document.getElementById('gridWrap').innerHTML =
      `<div class="no-data">
        <div class="no-data-icon">⚠</div>
        <div style="font-weight:bold;color:var(--red-lt)">Error de conexión</div>
        <div style="font-size:13px;margin-top:8px">${err.message}</div>
        <button class="btn btn-ghost btn-sm" style="margin-top:16px" onclick="renderModule('${module}')">Reintentar</button>
      </div>`;
  }
}

function updateConnStatus(connected) {
  const el = document.getElementById('connStatus');
  if (!el) return;
  if (connected) {
    el.innerHTML = `<span class="status-dot" style="background:#48bb78"></span><span class="status-text" style="color:#48bb78">SUPABASE</span>`;
  } else {
    el.innerHTML = `<span class="status-dot" style="background:#f6ad55"></span><span class="status-text" style="color:#f6ad55">DEMO</span>`;
  }
}

function renderGrid(module) {
  const schema = SCHEMA[module];
  const rows   = State.filtered;
  // Mostrar solo columnas relevantes (ocultar UUIDs y IDs internos para limpieza visual)
  const cols = schema.fields.filter(f => !f.pk && !f.key.endsWith('_id')).slice(0, 8);

  let html = `<table class="data-grid" id="dataGrid">
    <thead><tr>
      <th style="width:40px"></th>
      ${cols.map(f => `
        <th onclick="sortGrid('${f.key}')" class="${State.sortCol===f.key?'sorted':''}">
          ${f.label}
          <span class="sort-icon">${State.sortCol===f.key?(State.sortDir===1?'↑':'↓'):'↕'}</span>
        </th>`).join('')}
      <th style="width:100px">Acciones</th>
    </tr></thead>
    <tbody>`;

  if (!rows.length) {
    html += `<tr><td colspan="${cols.length + 2}" class="no-data">
      <div class="no-data-icon">📋</div>
      <div>Sin registros — haz clic en "+ Nuevo" para agregar</div>
    </td></tr>`;
  } else {
    rows.forEach((row, i) => {
      const rowId = row.id || i;
      html += `<tr onclick="selectRow('${rowId}')" id="row_${rowId}">
        <td style="color:var(--text-dim);font-size:11px;text-align:center">${i+1}</td>
        ${cols.map(f => {
          let val = row[f.key] ?? '';
          
          // Cálculo de duración al vuelo
          if (f.key === 'duracion' && row.fecha_inicio_real && row.fecha_fin_real) {
            const diff = new Date(row.fecha_fin_real) - new Date(row.fecha_inicio_real);
            const hrs = Math.floor(diff / 3600000);
            const mins = Math.floor((diff % 3600000) / 60000);
            val = `${hrs}h ${mins}m`;
          }

          if (f.badge && val) return `<td>${badge(val)}</td>`;
          return `<td title="${val}">${val}</td>`;
        }).join('')}
        <td>
          <div class="td-actions">
            ${module === 'ordenes_trabajo' ? `
              <button class="btn btn-ghost btn-sm btn-icon" title="Iniciar Trabajo" onclick="event.stopPropagation();startWorkOrder('${rowId}', ${i})">▶</button>
              <button class="btn btn-ghost btn-sm btn-icon" title="Terminar Trabajo" onclick="event.stopPropagation();finishWorkOrder(${i})">✅</button>
              <button class="btn btn-ghost btn-sm btn-icon" title="Ver Detalle" onclick="event.stopPropagation();viewOrderDetails(${i})">👁</button>
              <button class="btn btn-ghost btn-sm btn-icon" title="Imprimir PDF" onclick="event.stopPropagation();printOrderPDF(${i})">🖨</button>
            ` : ''}
            <button class="btn btn-ghost btn-sm btn-icon" title="Editar" onclick="event.stopPropagation();openEditModal('${module}',${i})">✏</button>
            ${State.permissions.canDelete ? `<button class="btn btn-danger btn-sm btn-icon" title="Eliminar" onclick="event.stopPropagation();confirmDelete('${module}',${i})">🗑</button>` : ''}
          </div>
        </td>
      </tr>`;
    });
  }
  html += `</tbody></table>`;
  document.getElementById('gridWrap').innerHTML = html;
}

// ── OT SPECIFIC ACTIONS ──────────────────────────
async function startWorkOrder(id, index) {
  const row = State.filtered[index];
  if (row.estado === 'En proceso') return toast('La OT ya está en proceso', 'info');
  
  if (confirm(`¿Desea iniciar la OT ${row.numero_ot}?`)) {
    try {
      const now = new Date().toISOString(); 
      const updates = { estado: 'En proceso', fecha_inicio_real: now };
      await API.updateRow('ordenes_trabajo', row.id, updates);
      Object.assign(row, updates);
      renderGrid('ordenes_trabajo');
      toast('Trabajo iniciado', 'success');
    } catch (e) { toast('Error: ' + e.message, 'error'); }
  }
}

async function finishWorkOrder(index) {
  const row = State.filtered[index];
  if (row.estado !== 'En proceso') return toast('Solo para órdenes "En proceso"', 'warning');

  if (!row.observaciones || row.observaciones.trim().length < 5) {
    toast('Capture Observaciones antes de firmar', 'error');
    openEditModal('ordenes_trabajo', index); 
    return;
  }

  const html = `
    <div style="text-align:center">
      <div style="font-size:12px;color:var(--text-dim);margin-bottom:10px">EL TÉCNICO DEBE FIRMAR PARA FINALIZAR</div>
      <canvas id="sig-canvas" width="400" height="200" style="background:#fff;border:1px solid var(--border);border-radius:4px;touch-action:none;cursor:crosshair"></canvas>
      <div style="margin-top:10px">
        <button class="btn btn-ghost btn-sm" onclick="clearSignature()">Limpiar</button>
        <button class="btn btn-primary btn-sm" onclick="saveFinishWithSignature(${index})">Confirmar y Cerrar</button>
      </div>
    </div>`;

  document.getElementById('modalTitle').textContent = `Firma de Finalización: ${row.numero_ot}`;
  document.getElementById('modalBody').innerHTML = html;
  document.getElementById('modal').classList.add('open');
  document.getElementById('modalOverlay').classList.add('open');
  initSignaturePad();
}

let sigCtx, sigDrawing = false;
function initSignaturePad() {
  const canvas = document.getElementById('sig-canvas');
  if (!canvas) return;
  sigCtx = canvas.getContext('2d');
  sigCtx.strokeStyle = "#222";
  sigCtx.lineWidth = 2;

  const getPos = (e) => {
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return { x: clientX - rect.left, y: clientY - rect.top };
  };

  const start = (e) => { sigDrawing = true; const p = getPos(e); sigCtx.beginPath(); sigCtx.moveTo(p.x, p.y); };
  const move = (e) => { if (!sigDrawing) return; const p = getPos(e); sigCtx.lineTo(p.x, p.y); sigCtx.stroke(); };
  const stop = () => { sigDrawing = false; };

  canvas.addEventListener('mousedown', start); canvas.addEventListener('mousemove', move); window.addEventListener('mouseup', stop);
  canvas.addEventListener('touchstart', (e) => { e.preventDefault(); start(e); });
  canvas.addEventListener('touchmove', (e) => { e.preventDefault(); move(e); });
  canvas.addEventListener('touchend', stop);
}

function clearSignature() { const canvas = document.getElementById('sig-canvas'); sigCtx.clearRect(0, 0, canvas.width, canvas.height); }

async function saveFinishWithSignature(index) {
  const row = State.filtered[index];
  const canvas = document.getElementById('sig-canvas');
  const signatureData = canvas.toDataURL(); // Firma en base64

  try {
    const now = new Date().toISOString();
    const updates = { estado: 'Completada', fecha_fin_real: now, firma_tecnico: signatureData };
    await API.updateRow('ordenes_trabajo', row.id, updates);
    Object.assign(row, updates);
    document.getElementById('modal').classList.remove('open');
    renderGrid('ordenes_trabajo');
    toast('OT Finalizada con firma!', 'success');
  } catch (e) { toast('Error: ' + e.message, 'error'); }
}

function viewOrderDetails(index) {
  const row = State.filtered[index];
  const schema = SCHEMA['ordenes_trabajo'];
  
  // STEPPER DE FLUJO
  const steps = ["Aprobada", "Programada", "En proceso", "Completada", "Revisada", "Cerrada"];
  const currentIdx = steps.indexOf(row.estado);
  
  let stepperHtml = `<div class="stepper" style="display:flex;justify-content:space-between;margin-bottom:30px;position:relative">
    ${steps.map((s, i) => `
      <div class="step ${i <= currentIdx ? 'active' : ''}" style="flex:1;text-align:center;position:relative;z-index:2">
        <div class="step-dot" style="width:12px;height:12px;border-radius:50%;background:${i <= currentIdx ? 'var(--accent)' : 'var(--border)'};margin:0 auto 8px"></div>
        <div style="font-size:9px;color:${i <= currentIdx ? 'var(--text)' : 'var(--text-dim)'}">${s.toUpperCase()}</div>
      </div>`).join('')}
    <div style="position:absolute;top:5px;left:5%;right:5%;height:2px;background:var(--border);z-index:1"></div>
    <div style="position:absolute;top:5px;left:5%;width:${Math.max(0, currentIdx) * 18}%;height:2px;background:var(--accent);z-index:1;transition:width 0.5s"></div>
  </div>`;

  let html = stepperHtml + `<div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;padding:10px">`;
  schema.fields.forEach(f => {
    if (f.key === 'firma_tecnico' && row[f.key]) {
       html += `<div class="full" style="border-bottom:1px solid var(--border);padding:8px 0">
        <div style="font-size:10px;color:var(--text-dim);font-weight:bold">FIRMA DEL TÉCNICO</div>
        <img src="${row[f.key]}" style="height:60px;background:#fff;margin-top:5px;border-radius:4px">
      </div>`;
       return;
    }
    const val = row[f.key] || '—';
    html += `<div style="border-bottom:1px solid var(--border);padding:8px 0">
      <div style="font-size:10px;color:var(--text-dim);font-weight:bold">${f.label.toUpperCase()}</div>
      <div style="font-size:14px;margin-top:4px">${f.badge ? badge(val) : val}</div>
    </div>`;
  });
  html += `</div>`;
  
  document.getElementById('modalTitle').textContent = `Detalle de OT: ${row.numero_ot}`;
  document.getElementById('modalBody').innerHTML = html;
  document.getElementById('modal').classList.add('open');
  document.getElementById('modalOverlay').classList.add('open');
}

function printOrderPDF(index) {
  const row = State.filtered[index];
  const win = window.open('', '_blank');
  
  const html = `
    <html>
    <head>
      <title>OT_${row.numero_ot}</title>
      <style>
        @page { size: letter; margin: 10mm; }
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #222; margin: 0; padding: 0; font-size: 10pt; line-height: 1.2; }
        .container { border: 1px solid #ccc; padding: 15px; height: 95%; display: flex; flex-direction: column; }
        .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #004a99; padding-bottom: 8px; margin-bottom: 12px; }
        .logo-box { font-weight: bold; font-size: 18pt; color: #004a99; letter-spacing: -1px; }
        .ot-badge { background: #004a99; color: white; padding: 4px 12px; border-radius: 4px; font-size: 14pt; font-weight: bold; }
        
        .data-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 12px; }
        .data-item { display: flex; border-bottom: 1px solid #eee; padding: 2px 0; }
        .data-label { width: 140px; font-weight: bold; font-size: 8pt; color: #666; text-transform: uppercase; }
        .data-val { flex: 1; font-weight: 500; font-size: 10pt; }

        .section-hdr { background: #f0f4f8; padding: 3px 8px; font-weight: bold; font-size: 9pt; border-left: 3px solid #004a99; margin: 8px 0 4px 0; }
        .text-area { border: 1px solid #eee; padding: 6px; min-height: 60px; font-size: 9.5pt; color: #333; background: #fafafa; }
        
        .footer { margin-top: auto; padding-top: 20px; display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px; text-align: center; }
        .signature { border-top: 1px solid #000; padding-top: 4px; font-size: 8pt; font-weight: bold; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo-box">CMMS ENTERPRISE</div>
          <div style="text-align:center">
            <div style="font-weight:bold; font-size:12pt">ORDEN DE TRABAJO</div>
            <div style="font-size:8pt; color:#666">Mantenimiento Industrial y Gestión de Activos</div>
          </div>
          <div class="ot-badge">${row.numero_ot}</div>
        </div>

        <div class="data-grid">
          <div class="data-item"><span class="data-label">Estado:</span><span class="data-val">${row.estado}</span></div>
          <div class="data-item"><span class="data-label">Prioridad:</span><span class="data-val">${row.prioridad}</span></div>
          <div class="data-item"><span class="data-label">Tipo OT:</span><span class="data-val">${row.tipo_ot}</span></div>
          <div class="data-item"><span class="data-label">Fecha Creación:</span><span class="data-val">${row.fecha_creacion || '—'}</span></div>
          <div class="data-item"><span class="data-label">Inicio Prog.:</span><span class="data-val">${row.fecha_inicio_programada || '—'}</span></div>
          <div class="data-item"><span class="data-label">Fin Prog.:</span><span class="data-val">${row.fecha_fin_programada || '—'}</span></div>
          <div class="data-item"><span class="data-label">Técnico:</span><span class="data-val">${row.personal_asignado_id || 'SIN ASIGNAR'}</span></div>
          <div class="data-item"><span class="data-label">Activo ID:</span><span class="data-val">${row.sub_activo_id || '—'}</span></div>
        </div>

        <div class="section-hdr">DESCRIPCIÓN DE LA FALLA O SOLICITUD</div>
        <div class="text-area">${row.descripcion_falla || 'No se especifica falla.'}</div>

        <div class="section-hdr">TRABAJO REALIZADO Y OBSERVACIONES</div>
        <div class="text-area" style="min-height:120px">${row.descripcion_trabajo || row.accion_correctiva || ''}</div>

        <div class="section-hdr">RECURSOS UTILIZADOS Y COSTOS</div>
        <div class="data-grid">
          <div class="data-item"><span class="data-label">Horas Reales:</span><span class="data-val">${row.horas_reales || '0'} hrs</span></div>
          <div class="data-item"><span class="data-label">Costo Mano Obra:</span><span class="data-val">$${row.costo_mano_obra || '0.00'}</span></div>
          <div class="data-item"><span class="data-label">Costo Materiales:</span><span class="data-val">$${row.costo_materiales || '0.00'}</span></div>
          <div class="data-item"><span class="data-label">Costo Total:</span><span class="data-val" style="font-weight:bold; color:#004a99">$${row.costo_total || '0.00'}</span></div>
        </div>

        <div class="footer">
          <div class="signature">EMITIDO POR<br><span style="font-weight:normal;color:#666">Firma y Fecha</span></div>
          <div class="signature">EJECUTADO POR<br><span style="font-weight:normal;color:#666">Firma y Fecha</span></div>
          <div class="signature">REVISADO / APROBADO<br><span style="font-weight:normal;color:#666">Firma y Fecha</span></div>
        </div>
      </div>
      <script>setTimeout(() => { window.print(); window.close(); }, 500);</script>
    </body>
    </html>
  `;
  
  win.document.write(html);
  win.document.close();
}

function sortGrid(col) {
  if (State.sortCol === col) State.sortDir *= -1;
  else { State.sortCol = col; State.sortDir = 1; }
  State.filtered.sort((a, b) => {
    const av = a[col] ?? '', bv = b[col] ?? '';
    return av < bv ? -State.sortDir : av > bv ? State.sortDir : 0;
  });
  renderGrid(State.currentModule);
}

function filterGrid(q) {
  const lower = q.toLowerCase();
  State.filtered = State.rows.filter(row =>
    Object.values(row).some(v => String(v).toLowerCase().includes(lower))
  );
  document.getElementById('recordCount').textContent = `${State.filtered.length} de ${State.rows.length}`;
  renderGrid(State.currentModule);
}

function selectRow(id) {
  document.querySelectorAll('#dataGrid tr').forEach(tr =>
    tr.classList.remove('selected')
  );
  const target = document.getElementById('row_' + id);
  if (target) target.classList.add('selected');
}

// ═══════════════════════════════════════════════
//  MODAL — NEW / EDIT
// ═══════════════════════════════════════════════
async function openNewModal(module) {
  State.editingRow   = null;
  State.editingIndex = null;
  await openModal(module, {});
}

async function openEditModal(module, index) {
  State.editingRow   = State.filtered[index];
  State.editingIndex = index;
  await openModal(module, State.filtered[index]);
}

async function openModal(module, data) {
  const schema = SCHEMA[module];
  const modalOverlay = document.getElementById('modalOverlay');
  const modal = document.getElementById('modal');
  const modalBody = document.getElementById('modalBody');
  const modalTitle = document.getElementById('modalTitle');

  modalTitle.textContent = State.editingRow ? `Editar — ${schema.label}` : `Nuevo — ${schema.label}`;
  modalBody.innerHTML = '<div style="padding:40px;text-align:center"><div class="spinner" style="margin:0 auto"></div><div style="margin-top:10px;color:var(--text-dim)">Cargando formulario...</div></div>';
  modal.classList.add('open');
  modalOverlay.classList.add('open');

  const fields = schema.fields.filter(f => !f.pk || State.editingRow);
  let html = '<div class="form-grid">';
  
  for (const f of fields) {
    const val  = data[f.key] ?? '';
    const full = f.type === 'textarea' ? 'full' : '';
    const req = f.required ? '<span style="color:var(--red-lt)">*</span>' : '';
    
    html += `<div class="form-field ${full}">
      <label class="form-label">${f.label.toUpperCase()} ${req}</label>`;

    if (f.fk) {
      // Campo dependiente (Foreign Key)
      try {
        const relatedRows = await API.getRows(f.fk);
        html += `<select class="form-select" id="fld_${f.key}" ${f.readonly ? 'disabled' : ''}>
          <option value="">— Seleccionar ${f.label} —</option>
          ${relatedRows.map(r => {
            const label = r.nombre || r.nombre_articulo || r.codigo || r.id;
            return `<option value="${r.id}" ${r.id===val?'selected':''}>${label}</option>`;
          }).join('')}
        </select>`;
      } catch (e) {
        html += `<input class="form-input" type="text" id="fld_${f.key}" value="${val}" placeholder="Error cargando ${f.fk}">`;
      }
    } else if (f.type === 'select') {
      html += `<select class="form-select" id="fld_${f.key}" ${f.readonly ? 'disabled' : ''}>
        <option value="">— Seleccionar —</option>
        ${f.options.map(o => `<option value="${o}" ${o===val?'selected':''}>${o}</option>`).join('')}
      </select>`;
    } else if (f.type === 'textarea') {
      html += `<textarea class="form-textarea" id="fld_${f.key}" ${f.readonly ? 'readonly' : ''}>${val}</textarea>`;
    } else {
      html += `<input class="form-input" type="${f.type||'text'}" id="fld_${f.key}" value="${val}" ${f.readonly ? 'readonly' : ''}>`;
    }
    html += '</div>';
  }
  html += '</div>';

  modalBody.innerHTML = html;
}

function closeModal() {
  document.getElementById('modal').classList.remove('open');
  document.getElementById('modalOverlay').classList.remove('open');
}

async function saveRecord() {
  const module = State.currentModule;
  const schema = SCHEMA[module];
  const row    = {};

  for (const f of schema.fields) {
    const el = document.getElementById('fld_' + f.key);
    if (!el) continue;
    const val = el.value.trim();
    if (f.required && !val) {
      el.style.borderColor = 'var(--red-lt)';
      toast(`Campo requerido: ${f.label}`, 'error');
      el.focus();
      return;
    }
    row[f.key] = val === "" ? null : val;
  }

  document.getElementById('btnSave').disabled = true;

  try {
    if (State.editingRow) {
      const updated = State.useMock ? [row] : await API.updateRow(module, State.editingRow.id, row);
      const realIdx = State.rows.indexOf(State.editingRow);
      State.rows[realIdx] = { ...State.editingRow, ...row };
      toast('Registro actualizado', 'success');
    } else {
      const created = State.useMock ? [row] : await API.addRow(module, row);
      State.rows.push(created[0] || row);
      toast('Registro creado', 'success');
    }
    State.filtered = [...State.rows];
    renderGrid(module);
    closeModal();
  } catch (err) {
    toast('Error: ' + err.message, 'error');
  } finally {
    document.getElementById('btnSave').disabled = false;
  }
}

function confirmDelete(module, index) {
  const row = State.filtered[index];
  const schema = SCHEMA[module];
  const id = row.id || index;

  if (!confirm(`¿Eliminar registro? Esta acción no se puede deshacer.`)) return;
  deleteRecord(module, index);
}

async function deleteRecord(module, index) {
  const row = State.filtered[index];
  try {
    if (!State.useMock) await API.deleteRow(module, row.id);
    const realIdx = State.rows.indexOf(row);
    State.rows.splice(realIdx, 1);
    State.filtered.splice(index, 1);
    renderGrid(module);
    toast('Registro eliminado', 'warning');
  } catch (err) {
    toast('Error al eliminar: ' + err.message, 'error');
  }
}

// ═══════════════════════════════════════════════
//  EXPORT CSV
// ═══════════════════════════════════════════════
function exportCSV(module) {
  const schema = SCHEMA[module];
  const headers = schema.fields.map(f => f.label);
  const keys    = schema.fields.map(f => f.key);
  const lines   = [headers.join(',')];
  State.filtered.forEach(row => {
    lines.push(keys.map(k => `"${(row[k]??'').toString().replace(/"/g,'""')}"`).join(','));
  });
  const blob = new Blob(['\ufeff' + lines.join('\n')], { type: 'text/csv;charset=utf-8' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = `${module}_${new Date().toISOString().slice(0,10)}.csv`;
  a.click(); URL.revokeObjectURL(url);
  toast('CSV exportado', 'success');
}

// ═══════════════════════════════════════════════
//  CONFIG PAGE
// ═══════════════════════════════════════════════
function renderConfig() {
  const mc = document.getElementById('mainContent');
  const config = API.getConfig();
  mc.innerHTML = `
    <div class="page-header">
      <div class="page-title-group">
        <div class="page-breadcrumb">Sistema</div>
        <h1 class="page-title">⚙ Configuración</h1>
      </div>
    </div>
    <div class="config-page">
      <div class="config-card">
        <div class="config-card-title">⚡ Conexión a Supabase (PostgreSQL)</div>
        <div class="form-field" style="margin-bottom:12px">
          <label class="form-label">Supabase Project URL</label>
          <input class="form-input" id="supaUrl" type="url"
            value="${config.url}"
            placeholder="https://xyz.supabase.co">
        </div>
        <div class="form-field" style="margin-bottom:12px">
          <label class="form-label">Supabase Anon Key</label>
          <input class="form-input" id="supaKey" type="password"
            value="${config.key}"
            placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...">
        </div>
        <div style="display:flex;gap:8px">
          <button class="btn btn-primary" onclick="saveSupabaseConfig()">Guardar Configuración</button>
          <button class="btn btn-ghost" onclick="testConnection()">Probar conexión</button>
        </div>
        <div style="margin-top:12px;font-size:11px;color:var(--text-dim)">
          Estado: <strong style="color:${!config.url?'var(--yellow-lt)':'var(--green-lt)'}">
            ${!config.url ? 'SIN CONFIGURAR (Modo Demo)' : 'CONECTADO A SUPABASE'}
          </strong>
        </div>
      </div>
      <div class="config-card">
        <div class="config-card-title">🚀 Pasos para Supabase</div>
        <ol style="font-size:13px;color:var(--text-sub);line-height:1.8;padding-left:18px">
          <li>Crea un proyecto en <a href="https://supabase.com" target="_blank" style="color:var(--accent)">Supabase</a></li>
          <li>Copia y pega el contenido del archivo <code>supabase_schema.sql</code> en el <b>SQL Editor</b> de Supabase y ejecútalo.</li>
          <li>Ve a <b>Project Settings → API</b> y copia la <b>URL</b> y la <b>anon public key</b>.</li>
          <li>Pégalos arriba y guarda.</li>
        </ol>
      </div>
    </div>`;
}

function saveSupabaseConfig() {
  const url = document.getElementById('supaUrl').value.trim();
  const key = document.getElementById('supaKey').value.trim();
  API.setConfig(url, key);
  State.useMock = !url;
  toast(url ? 'Configuración guardada' : 'Modo demo activo', 'success');
  renderConfig();
}

async function testConnection() {
  toast('Probando conexión...', 'info');
  try {
    // Probamos leer una tabla básica (Empresas)
    await API.getRows('empresas');
    toast('✅ Conexión exitosa a Supabase', 'success');
  } catch (err) {
    toast('❌ Error: ' + err.message, 'error');
  }
}

// ═══════════════════════════════════════════════
//  HELPERS
// ═══════════════════════════════════════════════
function badge(val) {
  const cls = BADGE_COLORS[val] || 'badge-gray';
  return `<span class="badge ${cls}">${val}</span>`;
}

function toast(msg, type = 'info', duration = 3500) {
  const c  = document.getElementById('toastContainer');
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.innerHTML = `<span>${msg}</span>`;
  c.appendChild(el);
  setTimeout(() => { el.style.opacity = '0'; el.style.transform = 'translateX(100%)'; el.style.transition = '.3s'; setTimeout(() => el.remove(), 300); }, duration);
}

function onGlobalSearch(q) {
  if (State.currentModule !== 'dashboard' && State.currentModule !== 'configuracion') {
    document.getElementById('gridFilter').value = q;
    filterGrid(q);
  }
}
