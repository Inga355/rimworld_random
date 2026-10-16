# 🎲 RimWorld Randomizer

**Deine nächste RimWorld-Kolonie? Überlass den Start dem Zufall!**

Du spielst immer mit demselben Erzähler, suchst ewig nach dem perfekten Startplatz und würfelst Kolonisten so lange neu, bis alles passt? Dann lass den RimWorld Randomizer entscheiden. 😁

Ein kleines, kostenloses Fanprojekt für abwechslungsreiche RimWorld-Starts – **kein Mod**, keine Änderungen an deinen Spieldateien und keine Python-Installation nötig, wenn du die Windows-Version nutzt.

## ⬇️ Download für Windows

**[➡️ Aktuelle Windows-Version herunterladen (GitHub Releases)](https://github.com/Inga355/rimworld_random/releases/latest)**

1. Öffne den Link und lade unter **Assets** die Datei `RimWorldRandomizer-v1.1.1-windows.exe` herunter (bei neueren Releases entsprechend die aktuelle Versionsnummer).
2. Starte die heruntergeladene `.exe` per Doppelklick.
3. Dein Browser öffnet automatisch den Randomizer. Es erscheint kein zusätzliches Konsolenfenster.
4. Wähle optional deine DLCs aus, betätige den Randomize-Hebel und übertrage das Ergebnis in RimWorld.
5. Zum Beenden einfach den zugehörigen Browser-Tab schließen. Die lokale Anwendung beendet sich nach wenigen Sekunden automatisch. Ein normales Neuladen der Seite beendet sie nicht.

**Wichtig:** Die App läuft lokal auf deinem Rechner unter `http://127.0.0.1:5000`. Sie ist keine Online-Webseite und kein RimWorld-Mod.

### 🛡️ Windows zeigt eine Sicherheitswarnung?

Die Windows-EXE ist **nicht digital signiert**. Deshalb kann Microsoft Defender SmartScreen eine Meldung wie „Der Computer wurde durch Windows geschützt“ anzeigen. Das passiert häufig bei neuen, wenig verbreiteten Programmen ohne etablierten Herausgeber.

Das Projekt ist kostenlos und ein Hobbyprojekt – eine kostenpflichtige Codesignierung habe ich mir dafür bisher gespart. 😄 **Die Warnung allein bedeutet nicht, dass die Datei Schadsoftware enthält; sie ist aber auch kein Beleg dafür, dass sie sicher ist.**

Lade die Datei ausschließlich aus den **offiziellen GitHub-Releases** herunter. Prüfe bei Zweifeln die Datei mit deinem Virenschutz, sieh dir den öffentlichen Quellcode an oder starte die Python-Version weiter unten. Übergehe eine Windows-Warnung nur, wenn du der Quelle vertraust und die Datei selbst geprüft hast. Ich empfehle nicht, den Virenschutz dafür abzuschalten.

## 🎯 Was wird ausgewürfelt?

- **Startszenario:** z. B. Crashlanded, Lost Tribe, Rich Explorer oder Naked Brutality
- **Storyteller:** Cassandra Classic, Phoebe Chillax oder Randy Random
- **Schwierigkeit:** von Peaceful bis Losing is Fun
- **Welt-Seed:** ein zufällig generierter Seed, direkt kopierbar
- **Landing Site Rolls (1–9):** wie viele Versuche du bei der zufälligen Startplatzauswahl hast
- **Character Rerolls (1–9):** wie oft du die Startcharaktere neu würfeln darfst
- **Optionale DLCs:** Royalty, Ideology, Biotech und Anomaly; aktivierte DLCs ergänzen passende Starts oder Zusatzparameter

**Die Idee:** Halte dich an die gewürfelten Bedingungen. Nicht endlos optimieren – mit dem klarkommen, was RimWorld dir gibt. Das Tool verändert das Spiel nicht automatisch: Du setzt die Vorgaben beim Spielstart selbst um.

## 🚀 Ein kleiner Startcomputer mit Charakter

Das Interface ist als ramponiertes Raumschiff-Terminal gestaltet: grüner Röhrenbildschirm, mechanischer Randomize-Hebel, Startsequenz, optionale Geräusche und Bildschirmflackern. Über den Lautsprecher-Schalter aktivierst du den Sound; Lautstärke und Effekte lassen sich einstellen. Sound ist anfangs ausgeschaltet.

## 🧑‍💻 Alternative: aus dem Quellcode starten

Wenn du keine Windows-EXE verwenden möchtest, kannst du die Anwendung selbst mit **Python 3.11 oder neuer** starten.

Im Projektordner unter Windows:

```powershell
py -m venv .venv
.venv\Scripts\Activate.ps1
py -m pip install -r requirements.txt
py app.py
```

Wenn `py` auf deinem System nicht verfügbar ist, verwende `python` statt `py`. Danach öffnet sich die Anwendung automatisch im Browser unter `http://127.0.0.1:5000`.

### Tests

```powershell
py -m unittest discover
```

### Windows-EXE selbst bauen

```powershell
py -m pip install pyinstaller
py -m PyInstaller --noconfirm RimWorldRandomizer.spec
```

Ergebnis: `dist\RimWorldRandomizer.exe`.

Weitere Informationen zum Sound- und Bildschirmdesign: [Terminal-Atmosphäre](docs/terminal-atmosphere.md).

---

**Viel Spaß mit deiner nächsten (vermutlich völlig chaotischen) Kolonie!** 🎲

*Inoffizielles Fanprojekt. Keine Verbindung zu Ludeon Studios.*
