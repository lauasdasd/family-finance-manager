@echo off
title Iniciando Sistema de Finanzas

:: Inicia el Backend
:: Usamos /d para asegurar la ruta y unimos los comandos con &&
start "Backend FastAPI" cmd /k "cd /d C:\Users\lauta\family-finance-manager\backend && call venv\Scripts\activate && uvicorn main:app --host 127.0.0.1 --port 8000"

:: Inicia el Frontend
start "Frontend React" cmd /k "cd /d C:\Users\lauta\family-finance-manager\frontend && npm run dev"

:: Espera un momento y abre el navegador
timeout /t 5
start http://localhost:5173