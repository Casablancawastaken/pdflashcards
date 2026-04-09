# 📚 PDF Flashcards

Fullstack-приложение для генерации flashcard’ов из PDF с использованием LLM.

## 🚀 Возможности

- Регистрация и авторизация пользователей (JWT + refresh)
- Загрузка PDF-файлов
- Генерация карточек через LLM (Ollama)
- Просмотр карточек
- История загрузок
- Фильтрация, поиск, пагинация
- Интеграция с внешним API книг
- Ролевая модель (user / admin)

---

# 🧱 Архитектура

## Backend
- FastAPI
- SQLAlchemy
- SQLite
- JWT (access + refresh tokens)
- SSE для обновления статусов

## Frontend
- React + TypeScript
- Vite
- Chakra UI

## Тестирование
- Backend: pytest (unit + integration)
- Frontend: Vitest (unit + component)
- E2E: Playwright

---

# ⚙️ Запуск проекта

## Backend

```bash
cd back
pip install -r requirements.txt
uvicorn main:app --reload