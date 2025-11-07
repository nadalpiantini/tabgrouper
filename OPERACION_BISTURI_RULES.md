# PROTOCOLO OPERACIÓN BISTURÍ - REGLAS CRÍTICAS

## 🚨 REGLA ABSOLUTA #1: OPERACIÓN BISTURÍ

**Cuando el usuario dice "operación bisturí" o "solo lo necesario":**

### ✅ LO QUE SÍ HACER:

- Tocar **SOLO** los archivos específicos mencionados
- Modificar **SOLO** las líneas exactas necesarias
- Cambiar **SOLO** lo que se pide explícitamente
- Preguntar **ANTES** de tocar cualquier archivo no mencionado

### ❌ LO QUE NUNCA HACER:

- Cambiar archivos que funcionan
- "Arreglar" errores no relacionados con la tarea
- Sobre-ingeniería o refactoring
- Modificar imports, configuraciones o dependencias
- Cambiar versiones o metadatos sin pedirlo

## 🔍 PROTOCOLO DE ERRORES:

**Si encuentro un error durante la operación:**

1. **PREGUNTAR PRIMERO:** "¿Este archivo funcionaba antes de mis cambios?"
2. **NO ASUMIR:** Que el error es por mi código
3. **NO CAMBIAR:** Nada que no esté relacionado con la tarea
4. **INVESTIGAR:** La causa real del error
5. **REPORTAR:** Al usuario exactamente qué encontré

## 📋 CHECKLIST ANTES DE CUALQUIER CAMBIO:

- [ ] ¿El usuario pidió específicamente este cambio?
- [ ] ¿Está en la lista de archivos a modificar?
- [ ] ¿Es necesario para completar la tarea?
- [ ] ¿Funcionaba antes de mis cambios?

## 🎯 EJEMPLOS DE VIOLACIONES:

- ❌ Cambiar `sw.js` cuando solo se pidió cambiar `popup.html`
- ❌ "Arreglar" imports cuando el error es de caché
- ❌ Modificar versiones sin pedirlo
- ❌ Refactorizar código que funciona

## 🎯 EJEMPLOS CORRECTOS:

- ✅ Cambiar solo `popup.html` líneas 20-28
- ✅ Modificar solo `popup.js` líneas 25-66
- ✅ Preguntar antes de tocar `sw.js`
- ✅ Reportar errores sin cambiarlos

## 🚨 PALABRAS CLAVE DE ALERTA:

- "operación bisturí"
- "solo lo necesario"
- "no tocar más nada"
- "efecto mariposa"
- "cadena de pensamientos"

**CUANDO ESCUCHE ESTAS PALABRAS: MODO BISTURÍ ACTIVADO**

---

**FECHA DE CREACIÓN:** $(date)
**MOTIVO:** Prevenir sobre-ingeniería y cambios innecesarios
**ESTADO:** ACTIVO - OBLIGATORIO SEGUIR
