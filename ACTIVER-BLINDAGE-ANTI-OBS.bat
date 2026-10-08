@echo off
title VIBLAB - BLINDAGE ANTI-OBS ET ANTI-CAPTURE WINDOWS
color 0A
echo ======================================================================
echo    VIBLAB OCP MS - BLINDAGE MATERIEL ANTI-OBS ET ANTI-CAPTURE
echo ======================================================================
echo  Ce script active l'API Windows SetWindowDisplayAffinity.
echo  Il rend la fenetre VibLab COMPLETEMENT NOIRE dans :
echo    - OBS Studio (Capture d'ecran et de fenetre)
echo    - Windows Snipping Tool (Win + Shift + S)
echo    - Touche PrintScreen (Impr. Ecran)
echo    - Windows Game Bar (Win + Alt + R)
echo    - Tout logiciel tiers d'enregistrement
echo ======================================================================
echo.
python scripts\protect_screen.py
pause
