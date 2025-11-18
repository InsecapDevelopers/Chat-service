# Prompt para Copilot - Agregar Intent `tms.get_costo_estimado` al RAG

## Contexto del Intent

Este nuevo intent permite a los comerciales de TMS obtener una estimación de costos de elementos prácticos necesarios para cursos que NO tienen costos R12 registrados en el sistema.

## Objetivo

Cuando un curso es práctico (tiene `horasPracticas > 0`) pero no tiene `costosR12` asociados, el LLM debe inferir basándose en el **R11 del curso** qué elementos materiales se necesitan para ejercer el curso de manera práctica. Esto ayuda al comercial a valorizar correctamente la venta considerando:

- EPPs (Elementos de Protección Personal)
- Herramientas y equipos
- Materiales consumibles (varillas, cables, componentes, etc.)
- Equipamiento de seguridad
- Cualquier otro elemento material requerido

---

## Ejemplo de Entidad de Curso

```json
{
    "idCurso": 49,
    "nombreCurso": "Aplicación de Técnicas de Electrofusión",
    "codigoCurso": "P-PRO-49",
    "R11": {
        "fundamentacionTecnica": "Este curso responde a un requerimiento actual de la industria minera...",
        "horasTeoricas": 5,
        "horasPracticas": 11,
        "materialDidactico": "Presentación, apoyo audiovisual.",
        "materialEntregable": "Manual, lapicero,",
        "cantPersona": 15,
        "contenidosEspecificosR11": [
            {
                "nombre": "Termofusión de Geomembranas con equipo de cuña",
                "horasT": 2,
                "horasP": 1
            }
        ]
    },
    "costosR12": []  // ← VACÍO, por eso se usa este intent
}
```

---

## Intent a Agregar al RAG

**Intent Name:** `tms.get_costo_estimado`

**Roles Permitidos:** 
- `tms:comercial`
- `tms:logistica`
- `tms:coordinador`

---

## Lógica del Agente RAG

Cuando recibas un mensaje con:
- `intent`: `"tms.get_costo_estimado"`
- `target`: `{ codigoCurso: "P-PRO-49" }`

### Paso 1: Buscar el Curso
```
Buscar en la base de conocimiento el documento con:
- docType: "curso"
- data.codigoCurso: [código proporcionado]
```

### Paso 2: Validar Condiciones
```
SI curso.data.costosR12.length > 0:
  → Retornar: "Este curso ya tiene costos R12 registrados. Usa el intent 'tms.get_costos' para consultarlos."
  
SI curso.data.R11.horasPracticas == 0:
  → Retornar: "Este curso es completamente teórico y no requiere estimación de elementos prácticos."
  
SI NO se encuentra el curso:
  → Retornar: "No se encontró el curso con código [X]. Verifica el código e intenta nuevamente."
```

### Paso 3: Analizar el R11
```
Extraer y analizar:
1. fundamentacionTecnica (describe la industria/área/técnicas)
2. contenidosEspecificosR11 (especialmente los que tienen horasP > 0)
3. materialDidactico
4. materialEntregable
5. tecnicaMetodologica
6. cantPersona (para estimar cantidades)
7. horasPracticas (para dimensionar consumibles)
```

### Paso 4: Inferir Elementos Necesarios

Basándote en el análisis, identifica:

#### A. EPPs (Elementos de Protección Personal)
Según el tipo de curso, infiere EPPs específicos:
- Soldadura → guantes de soldador, careta, delantal de cuero, zapatos de seguridad
- Electricidad → guantes dieléctricos, lentes de seguridad, zapatos aislantes
- Construcción → casco, arnés, guantes anti-corte, lentes
- Química → mascarilla respiratoria, guantes nitrilo, lentes protección química

#### B. Herramientas y Equipos
Según contenidos específicos:
- Soldadura → máquina de soldar, porta electrodos, cepillo
- Electricidad → multímetro, pinza amperimétrica, destornilladores
- Construcción → taladros, niveles, flexómetros

#### C. Materiales Consumibles
Según duración y cantidad de personas:
- Soldadura → varillas (cantidad = personas × horas prácticas × factor)
- Electricidad → cables, conectores, terminales
- Construcción → tornillos, tarugos, materiales de montaje

#### D. Equipamiento Adicional
- Equipos de seguridad colectiva (extintores, botiquín)
- Material didáctico físico
- Equipamiento específico mencionado en el R11

---

## Formato de Respuesta Esperado

```markdown
## 📊 Estimación de Costos de Elementos Prácticos
**Curso:** [Nombre del Curso]  
**Código:** [Código del Curso]  
**Participantes:** [cantPersona] personas  
**Horas Prácticas:** [horasPracticas] horas

### 🛡️ Elementos de Protección Personal (EPP)
1. **[Elemento EPP 1]** - Cantidad estimada: [X] unidades
   - Justificación: [Por qué se necesita según el R11]
   
2. **[Elemento EPP 2]** - Cantidad estimada: [X] unidades
   - Justificación: [Por qué se necesita según el R11]

### 🔧 Herramientas y Equipos
1. **[Herramienta 1]** - Cantidad estimada: [X] unidades
   - Uso: [Para qué contenido específico del R11]
   
2. **[Herramienta 2]** - Cantidad estimada: [X] unidades
   - Uso: [Para qué contenido específico del R11]

### 📦 Materiales Consumibles
1. **[Material 1]** - Cantidad estimada: [X] unidades/kg/metros
   - Cálculo: [Personas × horas × factor de consumo]
   - Justificación: [Basado en qué contenido práctico]

2. **[Material 2]** - Cantidad estimada: [X] unidades
   - Cálculo: [Lógica de cálculo]
   - Justificación: [Basado en qué contenido práctico]

### ⚙️ Equipamiento Adicional
- [Equipo 1]: [Cantidad y justificación]
- [Equipo 2]: [Cantidad y justificación]

---

### 💡 Recomendaciones para Comercial
- Estos elementos deben considerarse en la cotización al cliente
- Los costos pueden variar según proveedor y calidad
- Considerar stock mínimo de seguridad (+10-15%)
- Validar con el equipo de logística disponibilidad actual

### 📋 Basado en:
- Fundamentación Técnica del R11
- Contenidos específicos prácticos: [Listar contenidos con horasP > 0]
- Material requerido mencionado: [Citar materialDidactico y materialEntregable]
```

---

## Ejemplo Completo de Uso

### Request del Frontend:
```json
{
  "message": "Necesito estimar los costos de elementos prácticos para el curso con código: P-PRO-49...",
  "intent": "tms.get_costo_estimado",
  "target": { "codigoCurso": "P-PRO-49" },
  "source": "tms:comercial"
}
```

### Respuesta Esperada del RAG:
```
## 📊 Estimación de Costos de Elementos Prácticos
**Curso:** Aplicación de Técnicas de Electrofusión  
**Código:** P-PRO-49  
**Participantes:** 15 personas  
**Horas Prácticas:** 11 horas

### 🛡️ Elementos de Protección Personal (EPP)
1. **Guantes dieléctricos** - Cantidad estimada: 15 pares
   - Justificación: Requeridos para manipular equipos de electrofusión con conexiones eléctricas

2. **Lentes de seguridad con protección UV** - Cantidad estimada: 15 unidades
   - Justificación: Protección contra chispas y radiación durante el proceso de termofusión

3. **Zapatos de seguridad con suela aislante** - Cantidad estimada: 15 pares
   - Justificación: Protección eléctrica durante trabajo con equipos de electrofusión

### 🔧 Herramientas y Equipos
1. **Equipo de Electrofusión (máquina)** - Cantidad estimada: 3 unidades
   - Uso: Para contenido "Programación de equipos" y prácticas de termofusión (5 personas por equipo)
   
2. **Equipo de cuña para termofusión** - Cantidad estimada: 2 unidades
   - Uso: Para contenido "Termofusión de Geomembranas con equipo de cuña"

3. **Instrumentos de medición (voltímetro/amperímetro)** - Cantidad estimada: 3 unidades
   - Uso: Para verificar conexiones eléctricas y programación correcta

### 📦 Materiales Consumibles
1. **Geomembranas de práctica** - Cantidad estimada: 45 metros lineales
   - Cálculo: 15 personas × 11 horas × 0.27 m/hora-persona
   - Justificación: Material principal para prácticas de termofusión y técnicas de evaluación

2. **Cables y conectores eléctricos** - Cantidad estimada: 30 unidades
   - Cálculo: Repuestos para conexiones durante las 11 horas prácticas
   - Justificación: Necesarios para contenido "Tipos conexiones eléctricas de los equipos"

3. **Material de limpieza (alcohol isopropílico, paños)** - Cantidad estimada: 5 litros
   - Justificación: Limpieza de superficies antes de termofusión según técnicas estándar

### ⚙️ Equipamiento Adicional
- **Generador eléctrico portátil**: 1 unidad (respaldo para prácticas en terreno)
- **Extensiones eléctricas industriales**: 4 unidades (20 metros c/u)
- **Botiquín de primeros auxilios**: 1 unidad (por seguridad en trabajo con equipos eléctricos)
- **Extintores CO2**: 2 unidades (seguridad ante equipos eléctricos)

---

### 💡 Recomendaciones para Comercial
- Estos elementos deben considerarse en la cotización al cliente
- Los costos pueden variar según proveedor y calidad
- Considerar stock mínimo de seguridad (+15% en consumibles)
- Validar con el equipo de logística disponibilidad actual de equipos de electrofusión
- **Punto crítico:** Las geomembranas y equipos especializados pueden requerir importación

### 📋 Basado en:
- Fundamentación Técnica: Curso enfocado en industria minera y construcción con técnicas de electrofusión
- Contenidos específicos prácticos: 
  - Tipos conexiones eléctricas (1h práctica)
  - Programación de equipos (1h práctica)
  - Termofusión de Geomembranas (1h práctica)
  - Técnicas de evaluación en terreno (8h prácticas)
- Material mencionado: Presentación, manual, lapicero
```

---

## Implementación en el Agente

### Pseudocódigo para el RAG:

```python
def handle_get_costo_estimado(message: str, target: dict, context: dict):
    codigo_curso = target.get("codigoCurso")
    
    # 1. Buscar curso
    curso = buscar_en_kb(
        docType="curso",
        codigoCurso=codigo_curso
    )
    
    if not curso:
        return f"❌ No se encontró el curso con código {codigo_curso}"
    
    # 2. Validar condiciones
    if len(curso.data.costosR12) > 0:
        return f"ℹ️ El curso {curso.data.nombreCurso} ya tiene costos R12 registrados.\n\nUsa la opción 'Consultar Costos' para ver los costos existentes."
    
    if curso.data.R11.horasPracticas == 0:
        return f"ℹ️ El curso {curso.data.nombreCurso} es completamente teórico (0 horas prácticas) y no requiere estimación de elementos prácticos."
    
    # 3. Construir contexto para el LLM
    contexto_llm = f"""
    Analiza el siguiente curso y genera una estimación detallada de elementos prácticos necesarios:
    
    **Información del Curso:**
    - Nombre: {curso.data.nombreCurso}
    - Código: {curso.data.codigoCurso}
    - Participantes: {curso.data.R11.cantPersona}
    - Horas Prácticas: {curso.data.R11.horasPracticas}
    - Horas Teóricas: {curso.data.R11.horasTeoricas}
    
    **Fundamentación Técnica:**
    {curso.data.R11.fundamentacionTecnica}
    
    **Contenidos Específicos con Práctica:**
    {[contenido for contenido in curso.data.contenidosEspecificosR11 if contenido.horasP > 0]}
    
    **Material Didáctico:** {curso.data.R11.materialDidactico}
    **Material Entregable:** {curso.data.R11.materialEntregable}
    **Técnica Metodológica:** {curso.data.R11.tecnicaMetodologica}
    
    Genera una estimación estructurada siguiendo el formato especificado.
    """
    
    # 4. Enviar a LLM con el prompt específico
    respuesta = llm.generate(
        prompt=contexto_llm,
        temperature=0.3,  # Baja temperatura para respuestas más consistentes
        max_tokens=2000
    )
    
    return respuesta
```

---

## Testing del Intent

### Caso 1: Curso con horas prácticas y sin R12
```
✅ ESPERADO: Lista detallada de elementos estimados
```

### Caso 2: Curso con R12 existente
```
✅ ESPERADO: Mensaje indicando que use el intent 'tms.get_costos'
```

### Caso 3: Curso completamente teórico
```
✅ ESPERADO: Mensaje indicando que no requiere elementos prácticos
```

### Caso 4: Código de curso inexistente
```
✅ ESPERADO: Mensaje de error indicando que no se encontró el curso
```

---

## Notas Importantes

1. **Temperatura del LLM:** Usar temperatura baja (0.2-0.3) para mantener consistencia en las estimaciones
2. **Contexto Completo:** Siempre pasar el R11 completo al LLM para mejor inferencia
3. **Validación:** El comercial debe validar con logística la disponibilidad real
4. **Actualización:** Este es un estimado inicial, los costos reales pueden registrarse posteriormente como R12

---

## Integración con Frontend

El frontend ya está configurado para:
- Mostrar botón "Estimar Costos" solo para rol `tms:comercial`
- Enviar el intent `tms.get_costo_estimado` con el código del curso
- Mostrar emoji 💰 en el mensaje visible al usuario
- Pasar el prompt completo estructurado al RAG

**Estado:** ✅ Frontend implementado y listo
**Pendiente:** 🔄 Implementación del intent en el agente RAG del backend
