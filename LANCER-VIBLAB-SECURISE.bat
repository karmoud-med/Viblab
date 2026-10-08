@echo off
title VIBLAB PRO - NAVIGATEUR SECURISE ANTI-CAPTURE (SOLUTION 1)
color 0B

echo ======================================================================
echo    VIBLAB PRO - OCP MAINTENANCE SOLUTIONS (BLINDAGE MATERIEL)
echo ======================================================================
echo  Demarrage du navigateur securise avec affinite GPU WDA_EXCLUDEFROMCAPTURE.
echo.
echo  Ce conteneur rend l'application 100%% NOIRE dans :
echo    [X] OBS Studio (Capture d'ecran et de fenetre)
echo    [X] Windows Snipping Tool (Win + Shift + S)
echo    [X] Windows Game Bar (Win + Alt + R)
echo    [X] Touche Impr. Ecran (PrintScreen)
echo    [X] Partage d'ecran Discord / Zoom / Teams
echo.
echo  Tout reste parfaitement visible et fluide pour vous sur votre ecran !
echo ======================================================================
echo.

python scripts\viblab_secure_browser.py http://localhost:3001

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [!] Une erreur est survenue lors de l'execution du navigateur securise.
    pause
)
