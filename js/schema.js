/**
 * CMMS Enterprise — Data Schema (Supabase Optimized)
 * All keys and fields match the PostgreSQL schema exactly.
 */
const SCHEMA = {

  // NIVEL 1
  empresas: {
    label: "Empresas", group: "Jerarquía de Activos", icon: "🏢",
    fields: [
      { key: "id",          label: "ID",          type: "text", pk: true, readonly: true },
      { key: "codigo",      label: "Código",      type: "text", required: true },
      { key: "nombre",      label: "Nombre",      type: "text", required: true },
      { key: "rfc",         label: "RFC / RUC",   type: "text" },
      { key: "pais",        label: "País",        type: "text" },
      { key: "ciudad",      label: "Ciudad",      type: "text" },
      { key: "direccion",   label: "Dirección",   type: "textarea" },
      { key: "contacto",    label: "Contacto",    type: "text" },
      { key: "telefono",    label: "Teléfono",    type: "text" },
      { key: "email",       label: "Email",       type: "email" },
      { key: "estado",      label: "Estado",      type: "select", options: ["Activa","Inactiva"], badge: true }
    ]
  },

  // NIVEL 2
  sitios: {
    label: "Sitios / Plantas", group: "Jerarquía de Activos", icon: "🏗",
    fields: [
      { key: "id",          label: "ID",         type: "text", pk: true, readonly: true },
      { key: "empresa_id",  label: "Empresa",    type: "text", required: true, fk: "empresas" },
      { key: "codigo",      label: "Código",     type: "text", required: true },
      { key: "nombre",      label: "Nombre",     type: "text", required: true },
      { key: "descripcion", label: "Descripción",type: "textarea" },
      { key: "pais",        label: "País",       type: "text" },
      { key: "ciudad",      label: "Ciudad",     type: "text" },
      { key: "direccion",   label: "Dirección",  type: "textarea" },
      { key: "responsable", label: "Responsable",type: "text" },
      // Show relevant columns (skip PKs and ID relations for a cleaner look)
      { key: "estado",      label: "Estado",     type: "select", options: ["Activo","Inactivo"], badge: true }
    ]
  },

  // NIVEL 3
  unidades_negocio: {
    label: "Unidades de Negocio", group: "Jerarquía de Activos", icon: "🏛",
    fields: [
      { key: "id",           label: "ID",           type: "text", pk: true, readonly: true },
      { key: "sitio_id",     label: "Sitio",        type: "text", required: true, fk: "sitios" },
      { key: "codigo",       label: "Código",       type: "text", required: true },
      { key: "nombre",       label: "Nombre",       type: "text", required: true },
      { key: "tipo",         label: "Tipo",         type: "select", options: ["Producción","Mantenimiento","Logística","Administración","Calidad","Otro"] },
      { key: "descripcion",  label: "Descripción",  type: "textarea" },
      { key: "responsable_id",label: "Responsable ID",type: "text" },
      { key: "estado",       label: "Estado",       type: "select", options: ["Activa","Inactiva"], badge: true }
    ]
  },

  // NIVEL 4
  ubicaciones: {
    label: "Ubicaciones", group: "Jerarquía de Activos", icon: "📍",
    fields: [
      { key: "id",          label: "ID",              type: "text", pk: true, readonly: true },
      { key: "unidad_id",   label: "Unidad Negocio",  type: "text", required: true, fk: "unidades_negocio" },
      { key: "codigo",      label: "Código",          type: "text", required: true },
      { key: "nombre",      label: "Nombre",          type: "text", required: true },
      { key: "descripcion", label: "Descripción",     type: "textarea" }
    ]
  },

  // NIVEL 5
  procesos: {
    label: "Procesos", group: "Jerarquía de Activos", icon: "⚙",
    fields: [
      { key: "id",           label: "ID",           type: "text", pk: true, readonly: true },
      { key: "unidad_id",    label: "Unidad",       type: "text", required: true, fk: "unidades_negocio" },
      { key: "ubicacion_id", label: "Ubicación",    type: "text", fk: "ubicaciones" },
      { key: "codigo",       label: "Código",       type: "text", required: true },
      { key: "nombre",       label: "Nombre",       type: "text", required: true },
      { key: "tipo_proceso", label: "Tipo",         type: "select", options: ["Crítico","Semi-crítico","No crítico"] },
      { key: "descripcion",  label: "Descripción",  type: "textarea" },
      { key: "responsable_id",label: "Responsable ID",type: "text" },
      { key: "estado",       label: "Estado",       type: "select", options: ["Activo","Inactivo","En mantenimiento"], badge: true }
    ]
  },

  // NIVEL 6
  activos_principales: {
    label: "Activos Principales", group: "Jerarquía de Activos", icon: "🏭",
    fields: [
      { key: "id",                 label: "ID",           type: "text", pk: true, readonly: true },
      { key: "proceso_id",         label: "Proceso",      type: "text", required: true, fk: "procesos" },
      { key: "ubicacion_id",       label: "Ubicación",    type: "text", fk: "ubicaciones" },
      { key: "codigo",             label: "Código TAG",   type: "text", required: true },
      { key: "nombre",             label: "Nombre",       type: "text", required: true },
      { key: "descripcion",        label: "Descripción",  type: "textarea" },
      { key: "marca",              label: "Marca",        type: "text" },
      { key: "modelo",             label: "Modelo",       type: "text" },
      { key: "numero_serie",       label: "N° Serie",     type: "text" },
      { key: "anio_fabricacion",   label: "Año Fab.",     type: "number" },
      { key: "fecha_instalacion",  label: "F. Instalación",type: "date" },
      { key: "criticidad",         label: "Criticidad",   type: "select", options: ["Alta","Media","Baja"], badge: true },
      { key: "estado",             label: "Estado",       type: "select", options: ["Operativo","Fuera de servicio","En mantenimiento"], badge: true }
    ]
  },

  // NIVEL 6b
  sub_activos: {
    label: "Sub-Activos", group: "Jerarquía de Activos", icon: "🔧",
    fields: [
      { key: "id",                  label: "ID",           type: "text", pk: true, readonly: true },
      { key: "activo_principal_id", label: "Activo Padre", type: "text", required: true, fk: "activos_principales" },
      { key: "codigo",              label: "Código TAG",   type: "text", required: true },
      { key: "nombre",              label: "Nombre",       type: "text", required: true },
      { key: "descripcion",         label: "Descripción",  type: "textarea" },
      { key: "marca",               label: "Marca",        type: "text" },
      { key: "modelo",              label: "Modelo",       type: "text" },
      { key: "numero_serie",        label: "N° Serie",     type: "text" },
      { key: "estado",              label: "Estado",       type: "select", options: ["Operativo","Fuera de servicio"], badge: true },
      { key: "ubicacion_id",        label: "Ubicación",    type: "text", fk: "ubicaciones" }
    ]
  },

  // NIVEL 7
  sistemas: {
    label: "Sistemas", group: "Jerarquía de Activos", icon: "🔩",
    fields: [
      { key: "id",             label: "ID",           type: "text", pk: true, readonly: true },
      { key: "sub_activo_id",  label: "Sub-Activo",   type: "text", required: true, fk: "sub_activos" },
      { key: "codigo",         label: "Código",       type: "text", required: true },
      { key: "nombre",         label: "Nombre",       type: "text", required: true },
      { key: "tipo_sistema",   label: "Tipo",         type: "select", options: ["Eléctrico","Mecánico","Hidráulico","Neumático","Electrónico","Otro"] },
      { key: "descripcion",    label: "Descripción",  type: "textarea" },
      { key: "fabricante",     label: "Fabricante",   type: "text" },
      { key: "vida_util_horas",label: "Vida Útil (h)",type: "number" },
      { key: "estado",         label: "Estado",       type: "select", options: ["Operativo","Degradado","Inoperativo"], badge: true }
    ]
  },

  // NIVEL 8
  componentes: {
    label: "Componentes", group: "Jerarquía de Activos", icon: "🔩",
    fields: [
      { key: "id",                 label: "ID",           type: "text", pk: true, readonly: true },
      { key: "sistema_id",         label: "Sistema",      type: "text", required: true, fk: "sistemas" },
      { key: "nombre",             label: "Nombre",       type: "text", required: true },
      { key: "codigo",             label: "Código",       type: "text" },
      { key: "descripcion",        label: "Descripción",  type: "textarea" },
      { key: "catalogo_id",        label: "Catálogo ID",  type: "text" },
      { key: "cantidad",           label: "Cantidad",     type: "number" },
      { key: "vida_util_horas",    label: "Vida Útil (h)",type: "number" },
      { key: "fecha_instalacion",  label: "F. Instalación",type: "date" },
      { key: "estado",             label: "Estado",       type: "select", options: ["En uso","Reemplazado","Dañado"], badge: true }
    ]
  },

  // NIVEL 9
  despiece: {
    label: "Despiece", group: "Jerarquía de Activos", icon: "📐",
    fields: [
      { key: "id",                  label: "ID",           type: "text", pk: true, readonly: true },
      { key: "componente_id",       label: "Componente",   type: "text", required: true, fk: "componentes" },
      { key: "sistema_id",          label: "Sistema",      type: "text", fk: "sistemas" },
      { key: "sub_activo_id",       label: "Sub-Activo",   type: "text", fk: "sub_activos" },
      { key: "activo_principal_id", label: "Activo Padre", type: "text", fk: "activos_principales" },
      { key: "nivel_jerarquia",     label: "Nivel",        type: "number" },
      { key: "cantidad",            label: "Cantidad",     type: "number" },
      { key: "catalogo_id",         label: "Catálogo ID",  type: "text" },
      { key: "notas",               label: "Notas",        type: "textarea" },
      { key: "plano_referencia",    label: "Plano Ref.",   type: "text" }
    ]
  },

  especialidades: {
    label: "Especialidades", group: "Administración", icon: "🎓",
    fields: [
      { key: "id",          label: "ID",           type: "text", pk: true, readonly: true },
      { key: "nombre",      label: "Nombre",       type: "text", required: true },
      { key: "descripcion", label: "Descripción",  type: "textarea" },
      { key: "estado",      label: "Estado",       type: "select", options: ["Activa","Inactiva"], badge: true }
    ]
  },

  personal: {
    label: "Personal", group: "Administración", icon: "👤",
    fields: [
      { key: "id",              label: "ID",          type: "text", pk: true, readonly: true },
      { key: "nombre",          label: "Nombre",      type: "text", required: true },
      { key: "apellido",        label: "Apellido",    type: "text", required: true },
      { key: "numero_empleado", label: "N° Empleado", type: "text", required: true },
      { key: "cargo",           label: "Cargo",       type: "text" },
      { key: "especialidad_id", label: "Especialidad",type: "text", fk: "especialidades" },
      { key: "turno",           label: "Turno",       type: "select", options: ["Matutino","Vespertino","Nocturno"] },
      { key: "telefono",        label: "Teléfono",    type: "text" },
      { key: "email",           label: "Email",       type: "email" },
      { key: "fecha_ingreso",   label: "F. Ingreso",  type: "date" },
      { key: "estado",          label: "Estado",      type: "select", options: ["Activo","Inactivo","Vacaciones"], badge: true }
    ]
  },

  catalogo: {
    label: "Catálogo", group: "Almacén e Inventarios", icon: "📚",
    fields: [
      { key: "id",               label: "ID",          type: "text", pk: true, readonly: true },
      { key: "codigo_articulo",  label: "Código",      type: "text", required: true },
      { key: "nombre_articulo",  label: "Nombre",      type: "text", required: true },
      { key: "descripcion",      label: "Descripción", type: "textarea" },
      { key: "categoria",        label: "Categoría",   type: "select", options: ["Repuesto","Consumible","Herramienta","EPP"] },
      { key: "unidad_medida",    label: "Unidad",      type: "select", options: ["Pieza","Litro","Metro","Kg","Caja"] },
      { key: "marca",            label: "Marca",       type: "text" },
      { key: "numero_parte",     label: "N° Parte",    type: "text" },
      { key: "stock_minimo",     label: "Stock Mín.",  type: "number" },
      { key: "estado",           label: "Estado",      type: "select", options: ["Activo","Descontinuado"], badge: true }
    ]
  },

  mps: {
    label: "Planes MP", group: "Mantenimiento", icon: "📅",
    fields: [
      { key: "id",                  label: "ID",              type: "text", pk: true, readonly: true },
      { key: "codigo_mp",           label: "Código MP",       type: "text", required: true },
      { key: "nombre_mp",           label: "Nombre",          type: "text", required: true },
      { key: "descripcion",         label: "Descripción",     type: "textarea" },
      { key: "frecuencia",          label: "Frecuencia",      type: "number" },
      { key: "unidad_frecuencia",   label: "Unidad",          type: "select", options: ["Días","Semanas","Meses","Años"] },
      { key: "tipo_mantenimiento",  label: "Tipo",            type: "select", options: ["Preventivo","Predictivo","Correctivo"], badge: true },
      { key: "activo_principal_id", label: "Activo Principal",type: "text", fk: "activos_principales" },
      { key: "especialidad_id",     label: "Especialidad",    type: "text", fk: "especialidades" },
      { key: "tiempo_estimado_horas",label: "Tiempo Est. (h)",type: "number" },
      { key: "estado",              label: "Estado",          type: "select", options: ["Activo","Inactivo"], badge: true }
    ]
  },

  ordenes_trabajo: {
    label: "Órdenes de Trabajo", group: "Órdenes de Trabajo", icon: "📋",
    fields: [
      { key: "id",                      label: "ID",           type: "text", pk: true, readonly: true },
      { key: "numero_ot",               label: "N° OT",        type: "text", required: true },
      { key: "tipo_ot",                 label: "Tipo",         type: "select", options: ["Preventiva","Correctiva","Predictiva","Emergencia"], badge: true },
      { key: "sub_activo_id",           label: "Sub-Activo",   type: "text", fk: "sub_activos" },
      { key: "mp_id",                   label: "Plan MP",      type: "text", fk: "mps" },
      { key: "descripcion_falla",       label: "Falla",        type: "textarea" },
      { key: "descripcion_trabajo",     label: "Trabajo",      type: "textarea" },
      { key: "prioridad",               label: "Prioridad",    type: "select", options: ["Baja","Media","Alta","Crítica"], badge: true },
      { key: "personal_asignado_id",    label: "Asignado a ID",type: "text", fk: "personal" },
      { key: "fecha_creacion",          label: "F. Creación",  type: "date" },
      { key: "fecha_inicio_programada", label: "Inicio Prog.", type: "date" },
      { key: "fecha_fin_programada",    label: "Fin Prog.",    type: "date" },
      { key: "fecha_inicio_real",       label: "Inicio Real",  type: "datetime-local" },
      { key: "fecha_fin_real",          label: "Fin Real",     type: "datetime-local" },
      { key: "duracion",                label: "Duración",     type: "text", readonly: true },
      { key: "observaciones",           label: "Observaciones Técnicas", type: "textarea", required: true },
      { key: "tecnico_ejecutor_id",     label: "Técnico Ejecutor", type: "text", fk: "personal" },
      { key: "firma_tecnico",           label: "Firma Digital", type: "text" },
      { key: "estado",                  label: "Estado",       type: "select", options: ["Aprobada","Programada","En proceso","Completada","Revisada","Cerrada","Cancelada"], badge: true },
      { key: "causa_raiz",              label: "Causa Raíz",   type: "textarea" },
      { key: "accion_correctiva",       label: "Acción Correctiva", type: "textarea" },
      { key: "creado_por_id",           label: "Creado por ID",type: "text" }
    ]
  },

  inventarios: {
    label: "Inventarios", group: "Inventarios", icon: "📦",
    fields: [
      { key: "id",                     label: "ID",          type: "text", pk: true, readonly: true },
      { key: "catalogo_id",            label: "Artículo",    type: "text", required: true, fk: "catalogo" },
      { key: "ubicacion_almacen",      label: "Almacén",     type: "text" },
      { key: "stock_actual",           label: "Stock",       type: "number" },
      { key: "costo_unitario",         label: "Costo Unit.", type: "number" },
      { key: "valor_total",            label: "Valor Total", type: "number", readonly: true },
      { key: "fecha_ultimo_movimiento",label: "Últ. Mov.",   type: "date" }
    ]
  },

  planes_seguridad: {
    label: "Planes Seguridad", group: "Mantenimiento", icon: "🛡",
    fields: [
      { key: "id",          label: "ID",          type: "text", pk: true, readonly: true },
      { key: "codigo",      label: "Código",      type: "text", required: true },
      { key: "nombre",      label: "Nombre",      type: "text", required: true },
      { key: "riesgos_identificados", label: "Riesgos", type: "textarea" },
      { key: "epp_requerido", label: "EPP",       type: "textarea" },
      { key: "procedimiento_seguridad", label: "Procedimiento", type: "textarea" },
      { key: "estado",      label: "Estado",      type: "select", options: ["Activo","Inactivo"], badge: true }
    ]
  },

  servicios_contratistas: {
    label: "Contratistas", group: "Recursos y Servicios", icon: "🏢",
    fields: [
      { key: "id",             label: "ID",           type: "text", pk: true, readonly: true },
      { key: "codigo",         label: "Código",       type: "text", required: true },
      { key: "nombre_empresa", label: "Empresa",      type: "text", required: true },
      { key: "especialidad",   label: "Especialidad", type: "text" },
      { key: "contacto_nombre",label: "Contacto",     type: "text" },
      { key: "telefono",       label: "Teléfono",    type: "text" },
      { key: "email",          label: "Email",       type: "email" },
      { key: "estado",         label: "Estado",      type: "select", options: ["Activo","Inactivo"], badge: true }
    ]
  },

  orden_de_compra: {
    label: "Órdenes de Compra", group: "Almacén e Inventarios", icon: "🛒",
    fields: [
      { key: "id",             label: "ID",           type: "text", pk: true, readonly: true },
      { key: "numero_oc",      label: "N° OC",        type: "text", required: true },
      { key: "proveedor_id",   label: "Proveedor",    type: "text", fk: "servicios_contratistas" },
      { key: "fecha_pedido",   label: "F. Pedido",    type: "date" },
      { key: "monto_total",    label: "Monto Total",  type: "number" },
      { key: "estado",         label: "Estado",       type: "select", options: ["Pendiente","Aprobada","Recibida","Cancelada"], badge: true }
    ]
  },

  entradas: {
    label: "Entradas / Recepción", group: "Almacén e Inventarios", icon: "📥",
    fields: [
      { key: "id",               label: "ID",           type: "text", pk: true, readonly: true },
      { key: "codigo_recepcion", label: "Código Rec.",  type: "text", required: true },
      { key: "oc_id",            label: "Orden Compra", type: "text", fk: "orden_de_compra" },
      { key: "fecha_recepcion",  label: "F. Recepción", type: "date" },
      { key: "recibido_por_id",  label: "Recibido por", type: "text", fk: "personal" },
      { key: "almacen",          label: "Almacén",      type: "text" }
    ]
  },

  // ── ADMINISTRACIÓN Y SEGURIDAD ────────────────
  usuarios: {
    label: "Usuarios del Sistema", group: "Administración", icon: "👤",
    fields: [
      { key: "id",              label: "ID",           type: "text", pk: true, readonly: true },
      { key: "username",        label: "Usuario",      type: "text", required: true },
      { key: "nombre_completo", label: "Nombre",       type: "text" },
      { key: "rol_id",          label: "Rol",          type: "text", fk: "roles", required: true },
      { key: "estado",          label: "Estado",       type: "select", options: ["Activo","Inactivo"], badge: true }
    ]
  },

  roles: {
    label: "Roles y Permisos", group: "Administración", icon: "🔐",
    fields: [
      { key: "id",               label: "ID",           type: "text", pk: true, readonly: true },
      { key: "nombre",           label: "Nombre Rol",   type: "text", required: true },
      { key: "permiso_eliminar", label: "Puede Eliminar", type: "select", options: ["Sí","No"] },
      { key: "vistas_permitidas",label: "Vistas (Lista)", type: "textarea", placeholder: "manto,planeacion,activos..." }
    ]
  },

  configuracion_negocio: {
    label: "Datos del Negocio", group: "Administración", icon: "🏢",
    fields: [
      { key: "id",             label: "ID",           type: "text", pk: true, readonly: true },
      { key: "nombre_empresa", label: "Nombre Empresa", type: "text", required: true },
      { key: "rfc_nit",        label: "RFC / NIT",    type: "text" },
      { key: "direccion",      label: "Dirección",    type: "textarea" },
      { key: "telefono",       label: "Teléfono",     type: "text" },
      { key: "logo_url",       label: "Logo URL",     type: "text" },
      { key: "moneda",         label: "Moneda",       type: "text" }
    ]
  }
};

// Badge color map
const BADGE_COLORS = {
  "Activo": "badge-green", "Activa": "badge-green", "Operativo": "badge-green",
  "Vigente": "badge-green", "Completada": "badge-green", "Recibida": "badge-green", "Cerrada": "badge-gray",
  "En proceso": "badge-blue", "En negociación": "badge-blue", "En revisión": "badge-blue",
  "Aprobada": "badge-green", "Programada": "badge-blue", "Revisada": "badge-yellow",
  "En mantenimiento": "badge-blue", "Enviada": "badge-blue", "En uso": "badge-blue",
  "Borrador": "badge-gray", "Inactivo": "badge-gray", "Inactiva": "badge-gray",
  "Pendiente": "badge-gray", "Descontinuado": "badge-gray",
  "Baja": "badge-gray", "Media": "badge-yellow",
  "Alta": "badge-yellow", "Crítica": "badge-red",
  "Emergencia": "badge-red", "Vencido": "badge-red",
  "Fuera de servicio": "badge-red", "Cancelada": "badge-red",
  "Dañado": "badge-red", "Reemplazado": "badge-yellow",
  "Vacaciones": "badge-yellow", "Preventiva": "badge-blue",
  "Correctiva": "badge-yellow", "Predictiva": "badge-green",
  "Preventivo": "badge-blue", "Predictivo": "badge-green", "Correctivo": "badge-yellow"
};
