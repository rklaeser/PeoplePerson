# People Person

People Person is a friend journal that helps you remember names and anything else about your friends. It's a learning project so there is no public website. Video walk through in the works.

![Screenshot 2025-06-05 at 3 25 40 PM](https://github.com/user-attachments/assets/bd91b445-2ac2-4cee-b9db-5446b205601b)

## Why?

"She smiled, she laughed, she waved. Using the reminders and lists she kept in her notebook, she asked after families, new births, and favorite axehounds. She inquired about trade situations, took notes on which lighteyes seemed to be avoiding others. In short, she acted like a queen." - Brandon Sanderson describing Navani Kholin, Rhythm of War

"Become genuinely interested in other people" - Dale Carnegie

# Stack

Firebase Auth
SvelteKit frontend.
Django CRUD backend using DRF for easy CRUD
FastAPI with LangChain for LLM backend

## To run


```bash

# Destroy then create DB
make db-clean
make db-start
make db-sync
make db-seed

# start firebase emulator for dev
make firebase-start

# start svelte frontend
npm run dev

# start django backend
cd api
source venv/bin/activate
python run django.py

# start django admin (CRUD db)
make db-superuser
cd api
source venv/bin/activate
python manage.py runserver

# start fastapi backend
cd api
source venv/bin/activate
python run fastapi.py

```
