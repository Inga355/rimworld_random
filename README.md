# RimWorld Randomizer

Ein kleines Flask-Programm, das zufaellige Startparameter fuer RimWorld erzeugt.
Es soll bewusst simpel bleiben und nicht mit dem Ingame-Szenario-Editor konkurrieren.

## Installation

Python 3.11 oder neuer installieren und dann im Projektordner ausfuehren:

```powershell
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

Falls `python` unter Windows nicht gefunden wird, kann stattdessen der Python-Launcher genutzt werden:

```powershell
py -m venv .venv
.venv\Scripts\Activate.ps1
py -m pip install -r requirements.txt
```

## Starten

```powershell
python app.py
```

Alternativ:

```powershell
py app.py
```

Die App startet lokal unter:

```text
http://127.0.0.1:5000
```

Beim Start oeffnet sich der Browser automatisch.

## Tests

```powershell
python -m unittest discover
```

Alternativ:

```powershell
py -m unittest discover
```

## EXE bauen

Zum Erstellen der Windows-EXE wird PyInstaller benoetigt:

```powershell
py -m pip install pyinstaller
py -m PyInstaller --noconfirm RimWorldRandomizer.spec
```

Die fertige Datei liegt danach unter:

```text
dist\RimWorldRandomizer.exe
```

## Aktueller Umfang

- Vanilla-Szenario
- Storyteller
- Schwierigkeitsgrad
- Seed
- Map-Positions-Klicks
- Character-Rerolls
- optionale DLC-Auswahl fuer Royalty, Ideology, Biotech und Anomaly

Die DLC-Unterstuetzung ist absichtlich klein gehalten: aktivierte DLCs erweitern die moeglichen Startoptionen und fuegen einfache Zusatzparameter hinzu.
