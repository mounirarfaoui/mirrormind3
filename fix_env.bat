@echo off
REM This script will set up a 64-bit Python environment for your app
REM Please make sure you have installed 64-bit Python 3.10 or 3.11 from https://www.python.org/downloads/windows/

where python >nul 2>nul
if %errorlevel% neq 0 (
    echo Python is not installed or not in PATH. Please install 64-bit Python 3.10 or 3.11 and rerun this script.
    pause
    exit /b 1
)

REM Create virtual environment
python -m venv venv
if %errorlevel% neq 0 (
    echo Failed to create virtual environment. Make sure you are using 64-bit Python.
    pause
    exit /b 1
)

REM Activate virtual environment
call venv\Scripts\activate

REM Upgrade pip
python -m pip install --upgrade pip

REM Install dependencies
pip install torch --index-url https://download.pytorch.org/whl/cpu
pip install openai-whisper flask openai

REM Run the app
python app.py

pause 