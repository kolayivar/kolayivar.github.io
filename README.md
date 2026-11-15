# Kolayı Var

Kolayı Var is a Turkish-language static site with browser-based calculators, document tools, daily games (the Word puzzle, daily trivia, and Zihin Arenası), a local daily planner with focus timer, a five-day city weather forecast, a daily hub, and an exam practice tracker.

## Daily sections

- `/bugun/` brings the daily features together.
- `/gunun-quiz/` serves a date-based five-question trivia round.
- `/hava-durumu/` searches a city and displays Open-Meteo forecasts without requesting browser location.
- `/gunluk-plan/` keeps goals, streaks, and the focus timer in local browser storage.

## Site owner guides

- [Google Analytics and Search Console quick guide](ANALYTICS-REHBERI.md) (Turkish)

## Local preview

Serve this folder over HTTP (for example, `python -m http.server 8000`) and open `http://localhost:8000/`.

## Privacy notes

- Calculator inputs, exam-tracker entries, and game scores/progress are processed or stored in the visitor's browser; they are not sent to this site's server.
- Exam-tracker data can be exported by the visitor as CSV. Clearing browser storage removes local records.
- The site includes Google Analytics and Google AdSense tags. Review the privacy policy and applicable consent requirements before monetizing or serving visitors in regions that require consent.
- Verify calculation rules, tax rates, and exam scoring assumptions against current official sources before relying on results.



## Third-party licences and service constraints

See [THIRD-PARTY-NOTICES.md](THIRD-PARTY-NOTICES.md) and the [public licence page](/licenses/). Open-Meteo's free API is non-commercial; if ads or other commercial use are enabled, obtain a commercial licence or replace the API first.
