# Plantilla de Postmortem CI/CD

## 1) Resumen del incidente
- Fecha:
- Workflow:
- Commit/PR:
- Impacto (bloqueo deploy, retraso release, regresión en QA):

## 2) Tipo de problema (elige principal)
- [ ] Performance
- [ ] Accesibilidad
- [ ] Mala implementación

## 3) Síntoma observado
Describe el fallo exacto del pipeline y el paso que falló.

## 4) Evidencia
- Logs relevantes:
- Capturas/reportes Lighthouse:
- Métricas de bundle:

## 5) Causa raíz
Explica por qué ocurrió (código, configuración, dependencia, proceso).

## 6) Acciones correctivas
- Acción inmediata:
- Acción preventiva:
- Responsable:
- Fecha compromiso:

## 7) Verificación
- [ ] Lint en verde
- [ ] Tests en verde
- [ ] Build en verde
- [ ] Bundle dentro de budget
- [ ] Lighthouse dentro de umbrales

## 8) Lecciones aprendidas
Qué ajuste de proceso evita recurrencia.
