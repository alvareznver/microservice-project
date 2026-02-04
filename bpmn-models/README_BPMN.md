# Modelo BPMN - Proceso Editorial de Publicaciones

## Descripción General
Este modelo BPMN 2.0 representa el flujo de trabajo completo para la publicación de contenido académico en la plataforma editorial. Incluye participantes clave (Autor, Editor, Comité de Revisión) y define los diferentes caminos que un documento puede seguir.

## Participantes (Pools/Lanes)

### 1. **Autor** (Author)
- Responsable de crear y enviar borradores
- Realiza cambios solicitados
- Role: AUTHOR

### 2. **Editor** (Editorial Team)
- Revisa editorialmente el contenido
- Solicita cambios si es necesario
- Prepara el contenido para publicación
- Publica el contenido final
- Role: EDITOR

### 3. **Comité de Revisión** (Reviewer Committee)
- Realiza revisión académica/científica
- Toma la decisión final de aprobación
- Role: REVIEWER

## Eventos y Actividades

### EVENTO DE INICIO
- **Evento**: "Create Draft"
- Inicia el proceso de publicación

### ACTIVIDADES PRINCIPALES

1. **Create Publication Draft** (User Task - Autor)
   - Descripción: El autor crea el borrador inicial de la publicación
   - Estado: DRAFT
   - Asignado a: Autor

2. **Submit for Review** (User Task - Autor)
   - Descripción: El autor envía el borrador para revisión
   - Estado: DRAFT → IN_REVIEW
   - Asignado a: Autor

3. **Editorial Review** (User Task - Editor)
   - Descripción: El editor revisa editorialmente el documento
   - Estado: IN_REVIEW
   - Asignado a: Editor

4. **Committee Review** (User Task - Comité)
   - Descripción: El comité de revisión evalúa el contenido
   - Estado: IN_REVIEW
   - Asignado a: Reviewer

5. **Decision** (Exclusive Gateway - XOR)
   - Punto de decisión crítico
   - Tres posibles caminos:
     - ✅ APROBADO
     - ⚠️ REQUIERE CAMBIOS
     - ❌ RECHAZADO

#### Ruta A: APROBACIÓN DIRECTA
6a. **Prepare for Publishing** (User Task - Editor)
   - Prepara el contenido para publicación
   - Asignado a: Editor

7a. **Publish Content** (User Task - Editor)
   - Publica el contenido en la plataforma
   - Estado: APPROVED → PUBLISHED
   - Asignado a: Editor

8a. **FIN - Published** (End Event)
   - Marca el fin exitoso del proceso
   - Estado final: PUBLISHED

#### Ruta B: REQUIERE CAMBIOS
6b. **Request Changes** (User Task - Editor)
   - Comunica los cambios necesarios al autor
   - Estado: IN_REVIEW
   - Asignado a: Editor

7b. **Make Required Changes** (User Task - Autor)
   - El autor realiza los cambios solicitados
   - Estado: DRAFT
   - Asignado a: Autor

8b. El documento vuelve a **Editorial Review** para nueva evaluación

#### Ruta C: RECHAZO
6c. **Notify Rejection** (User Task - Editor)
   - Comunica el rechazo al autor
   - Estado: REJECTED
   - Asignado a: Editor

7c. **FIN - Rejected** (End Event)
   - Marca el fin del proceso (rechazado)
   - Estado final: REJECTED

## Elementos BPMN Utilizados

✅ **1 Evento de Inicio**
- StartEvent: "Create Draft"

✅ **2 Eventos de Fin**
- EndEvent: "Published" (PUBLICADO)
- EndEvent: "Rejected" (RECHAZADO)

✅ **1+ Gateways Exclusivos (XOR)**
- Gateway_Approval: Decisión central de aprobación

✅ **Tareas Humanas (User Tasks)**
- Task_CreateDraft
- Task_SubmitForReview
- Task_EditorialReview
- Task_CommitteeReview
- Task_PreparePublication
- Task_Publish
- Task_RequestChanges
- Task_MakeChanges
- Task_NotifyRejection

✅ **Flujos de Secuencia Completos**
- Sin elementos desconectados
- Todos los caminos llevan a eventos de fin

## Variables para Simulación (Token Simulation)

Se deben definir las siguientes variables para ejecutar la simulación:

```
aprobado = true/false        // ¿El documento fue aprobado?
requiereCambios = true/false // ¿Requiere cambios?
rechazado = true/false       // ¿Fue rechazado?
```

## Escenarios de Prueba

### Escenario 1: Aprobación Directa ✅
**Variables**: `aprobado=true, requiereCambios=false, rechazado=false`

**Flujo**:
1. Create Draft
2. Submit for Review
3. Editorial Review
4. Committee Review
5. Decision → APPROVED
6. Prepare for Publishing
7. Publish Content
8. **FIN: Published**

**Duración esperada**: ~5-7 días

---

### Escenario 2: Requiere Cambios ⚠️
**Variables**: `aprobado=false, requiereCambios=true, rechazado=false`

**Flujo**:
1. Create Draft
2. Submit for Review
3. Editorial Review
4. Committee Review
5. Decision → NEEDS CHANGES
6. Request Changes
7. Make Required Changes
8. Editorial Review (vuelve)
9. Committee Review (vuelve)
10. Decision → APPROVED (segunda vez)
11. Prepare for Publishing
12. Publish Content
13. **FIN: Published**

**Duración esperada**: ~10-14 días

---

### Escenario 3: Rechazo ❌
**Variables**: `aprobado=false, requiereCambios=false, rechazado=true`

**Flujo**:
1. Create Draft
2. Submit for Review
3. Editorial Review
4. Committee Review
5. Decision → REJECTED
6. Notify Rejection
7. **FIN: Rejected**

**Duración esperada**: ~3-5 días

---

## Transiciones de Estado en el Microservicio

El modelo BPMN se mapea a los estados del microservicio de Publicaciones:

| Estado BPMN | Estado DB | Descripción |
|-------------|-----------|-------------|
| Create Draft | DRAFT | Documento en creación |
| Submit for Review | IN_REVIEW | Enviado a revisión |
| Editorial Review | IN_REVIEW | En revisión editorial |
| Committee Review | IN_REVIEW | En revisión de comité |
| Approved | APPROVED | Aprobado, listo para publicar |
| Publish Content | PUBLISHED | Publicado en la plataforma |
| Rejected | REJECTED | Rechazado por comité |
| Make Changes | DRAFT | Retorna a borrador para cambios |

## Notas Importantes

1. **No Integración con Microservicios**: Este modelo BPMN es puramente ilustrativo y se simula en Camunda Modeler sin integración directa con los servicios.

2. **Token Simulation**: Usar la función "Token Simulation" de Camunda Modeler para visualizar el flujo de los tres escenarios.

3. **Validaciones de Negocio**: Las validaciones de transición de estado se implementan en el `StateValidationFacade` del microservicio de Publicaciones.

4. **Responsabilidades**: 
   - Autor: Crea y modifica contenido
   - Editor: Controla el flujo y prepara para publicación
   - Comité: Toma decisiones académicas

5. **Escalabilidad**: El modelo puede extenderse con:
   - Notificaciones por email
   - Métricas de tiempo promedio
   - Archivos adjuntos
   - Versioning de documentos
