# Правила организации тестов

## 1. Разделение тестов
- backend unit: тесты сервисного слоя
- backend integration: тесты endpoint'ов FastAPI
- frontend unit/component: тесты утилит и компонентов через Vitest
- e2e: сквозные сценарии через Playwright

## 2. Именование
- backend: test_*.py
- frontend: *.test.ts / *.test.tsx
- e2e: *.spec.ts

## 3. Минимально контролируемые метрики
- backend coverage контролируется через pytest-cov
- frontend coverage контролируется через vitest coverage
- e2e используются для проверки ключевых пользовательских сценариев