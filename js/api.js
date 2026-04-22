/**
 * CMMS Enterprise — API Layer
 * Connects to Google Apps Script Web App backend
 * Configure GAS_URL with your deployed Apps Script URL
 */

const API = (() => {
  // ── CONFIG ─────────────────────────────────────────────
  let SUPABASE_URL = localStorage.getItem('cmms_supabase_url') || 'https://xwciwrtenrdvhwvvjkzt.supabase.co/rest/v1/';
  let SUPABASE_KEY = localStorage.getItem('cmms_supabase_key') || 'sb_publishable_RIfaIPuzvQ27Drwp-vx-MQ_o6_xgoGt';

  function setConfig(url, key) {
    SUPABASE_URL = url.trim();
    SUPABASE_KEY = key.trim();
    localStorage.setItem('cmms_supabase_url', SUPABASE_URL);
    localStorage.setItem('cmms_supabase_key', SUPABASE_KEY);
  }

  function getConfig() {
    return { url: SUPABASE_URL, key: SUPABASE_KEY };
  }

  // ── CORE REQUEST ───────────────────────────────────────
  async function request(table, method = 'GET', body = null, params = '') {
    if (!SUPABASE_URL || !SUPABASE_KEY) {
      throw new Error('Supabase no configurado. Ve a ⚙ Configuración.');
    }

    // Limpiamos la URL por si el usuario pegó el path completo /rest/v1/
    const baseUrl = SUPABASE_URL.replace(/\/+$/, '').replace(/\/rest\/v1$/, '');
    const url = `${baseUrl}/rest/v1/${table.toLowerCase()}${params}`;
    const headers = {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    };

    const options = { method, headers };
    if (body) options.body = JSON.stringify(body);

    const res = await Promise.race([
      fetch(url, options),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Tiempo de espera agotado')), 8000))
    ]);
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || `HTTP ${res.status}`);
    }
    return res.json();
  }

  // ── OPERATIONS ───────────────────────────────────

  async function getRows(table) {
    // Para Supabase, el table name suele ser minúsculas
    return request(table, 'GET', null, '?select=*');
  }

  async function addRow(table, row) {
    // Eliminamos IDs temporales si Supabase genera UUIDs
    const { id, ...data } = row;
    return request(table, 'POST', data);
  }

  async function updateRow(table, id, row) {
    // En Supabase filtramos por id (UUID)
    return request(table, 'PATCH', row, `?id=eq.${id}`);
  }

  async function deleteRow(table, id) {
    return request(table, 'DELETE', null, `?id=eq.${id}`);
  }

  async function getDashboard() {
    // Simulación de dashboard (Supabase permite RPC para esto)
    try {
      const ots = await getRows('ordenes_trabajo');
      const activos = await getRows('activos_principales');
      const personal = await getRows('personal');
      
      return {
        ot_pendientes: ots.filter(o => o.estado === 'Pendiente').length,
        ot_en_proceso: ots.filter(o => o.estado === 'En proceso').length,
        ot_completadas_mes: ots.filter(o => o.estado === 'Completada').length,
        activos_total: activos.length,
        activos_operativos: activos.filter(a => a.estado === 'Operativo').length,
        activos_falla: activos.filter(a => a.estado === 'Fuera de servicio').length,
        personal_activo: personal.filter(p => p.estado === 'Activo').length,
        inventario_bajo_stock: 0, // Habría que calcularlo
        costo_mes: ots.reduce((acc, o) => acc + (parseFloat(o.costo_total) || 0), 0),
        uptime_promedio: activos.length ? Math.round((activos.filter(a => a.estado === 'Operativo').length / activos.length) * 100) : 100
      };
    } catch (e) {
      return getMockDashboard();
    }
  }

  // ── MOCK DATA ─────────────────────
  function getMockRows(sheet) {
    if (sheet.toLowerCase() === 'empresas') {
      return [{ id: 'mock-1', codigo: 'DEMO-001', nombre: 'Empresa de Prueba (MODO DEMO)', pais: 'México', estado: 'Activa' }];
    }
    return [];
  }
  function getMockDashboard() {
    return {
      ot_pendientes: 0, ot_en_proceso: 0, ot_completadas_mes: 0,
      activos_total: 0, activos_operativos: 0, activos_falla: 0,
      personal_activo: 0, inventario_bajo_stock: 0, costo_mes: 0, uptime_promedio: 100
    };
  }

  return { setConfig, getConfig, getRows, addRow, updateRow, deleteRow, getDashboard, getMockRows, getMockDashboard, getUrl: () => SUPABASE_URL };
})();

