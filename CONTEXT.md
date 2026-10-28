# FitFlow – Plan Complet de Implementare

## Stare Curentă
- [x] Structura proiectului creată
- [ ] **Iterația 1** – Autentificare & Managementul Antrenamentelor Personale
- [ ] **Iterația 2** – Workout Activ, Antrenamente Publice, Poze Progres
- [ ] **Iterația 3** – Fișe de Progres

---

## 1. Prezentare Generală

**FitFlow** este o aplicație web de tip fitness tracker cu design Mobile-First, care permite utilizatorilor să creeze și gestioneze antrenamente personale, să urmărească progresul și să încarce poze de progres. Adminii pot crea antrenamente publice vizibile tuturor.

---

## 2. Stack Tehnologic

| Strat | Tehnologie | Detalii |
|---|---|---|
| Frontend | React 18 + Vite | SPA, React Router v6 |
| Styling | Tailwind CSS | Mobile-First, tema dark |
| HTTP Client | Axios | Interceptori JWT automat |
| Backend | Node.js + Express | REST API |
| ORM | **Prisma** | Type-safe, migrații declarative |
| Baza de Date | SQLite (dev) | Fișier local, simplu pentru laborator |
| Auth | JWT + bcrypt | Access token, refresh via httpOnly cookie |
| Upload Fișiere | Multer | Stocare locală `/uploads` |

---

## 3. Schema Baze de Date (Prisma)

### Modele

```
User
  id, name, email (unique), password (bcrypt), role (USER|ADMIN), createdAt

Workout
  id, name, description, type (PERSONAL|PUBLIC), restTime (sec), userId, createdAt
  → aparține unui User
  → are multe WorkoutExercise
  → are multe WorkoutSession

Exercise  (lista master de exerciții)
  id, name, muscleGroup

WorkoutExercise  (join table cu date suplimentare)
  id, workoutId, exerciseId, sets, reps (per set), order

WorkoutSession  (o rulare efectivă a unui antrenament)
  id, workoutId, userId, startedAt, finishedAt, status (IN_PROGRESS|COMPLETED|ABANDONED)
  → are multe SessionSet

SessionSet  (o serie efectiv realizată)
  id, sessionId, exerciseId, setNumber, targetReps, actualReps, completedAt

ProgressSheet
  id, name, description, userId, createdAt

ProgressEntry
  id, progressSheetId, value (Float), notes, date (auto = now())

PhotoFolder
  id, name, userId, createdAt

Photo
  id, filename, url, folderId, userId, uploadedAt
```

### Relații
- `User` 1→N `Workout`, `WorkoutSession`, `ProgressSheet`, `PhotoFolder`, `Photo`
- `Workout` 1→N `WorkoutExercise`, `WorkoutSession`
- `Exercise` 1→N `WorkoutExercise`
- `WorkoutSession` 1→N `SessionSet`
- `ProgressSheet` 1→N `ProgressEntry`
- `PhotoFolder` 1→N `Photo`

---

## 4. Structura Proiectului

```
d:\Proiect ISS\
├── CONTEXT.md                  ← acest fișier
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── seed.js             ← date inițiale (exerciții, admin)
│   ├── src/
│   │   ├── controllers/
│   │   │   ├── authController.js
│   │   │   ├── workoutController.js
│   │   │   ├── exerciseController.js
│   │   │   ├── sessionController.js
│   │   │   ├── progressController.js
│   │   │   └── photoController.js
│   │   ├── middleware/
│   │   │   ├── auth.js         ← verificare JWT
│   │   │   ├── requireAdmin.js ← verificare rol Admin
│   │   │   └── upload.js       ← configurare Multer
│   │   ├── routes/
│   │   │   ├── auth.js
│   │   │   ├── workouts.js
│   │   │   ├── exercises.js
│   │   │   ├── sessions.js
│   │   │   ├── progress.js
│   │   │   └── photos.js
│   │   └── index.js            ← entry point Express
│   ├── uploads/                ← fișiere imagini uploadate
│   ├── .env
│   └── package.json
└── frontend/
    ├── public/
    ├── src/
    │   ├── components/
    │   │   ├── layout/
    │   │   │   ├── BottomNav.jsx
    │   │   │   └── AppLayout.jsx
    │   │   └── ui/
    │   │       ├── Button.jsx
    │   │       ├── Modal.jsx
    │   │       ├── ConfirmDialog.jsx
    │   │       ├── Spinner.jsx
    │   │       └── Toast.jsx
    │   ├── pages/
    │   │   ├── auth/
    │   │   │   ├── LoginPage.jsx
    │   │   │   └── RegisterPage.jsx
    │   │   ├── dashboard/
    │   │   │   └── DashboardPage.jsx
    │   │   ├── workouts/
    │   │   │   ├── WorkoutsPage.jsx
    │   │   │   ├── CreateWorkoutPage.jsx
    │   │   │   └── EditWorkoutPage.jsx
    │   │   ├── active-workout/
    │   │   │   └── ActiveWorkoutPage.jsx
    │   │   ├── progress/
    │   │   │   ├── ProgressPage.jsx
    │   │   │   └── ProgressSheetPage.jsx
    │   │   └── photos/
    │   │       └── PhotosPage.jsx
    │   ├── context/
    │   │   └── AuthContext.jsx
    │   ├── services/
    │   │   ├── api.js          ← instanță Axios cu interceptori
    │   │   ├── authService.js
    │   │   ├── workoutService.js
    │   │   ├── sessionService.js
    │   │   ├── progressService.js
    │   │   └── photoService.js
    │   ├── hooks/
    │   │   └── useToast.js
    │   ├── App.jsx
    │   └── main.jsx
    ├── index.html
    ├── vite.config.js
    ├── tailwind.config.js
    └── package.json
```

---

## 5. Endpoint-uri API (REST)

### Auth
| Metodă | Rută | UC | Descriere |
|---|---|---|---|
| POST | `/api/auth/register` | UC-2 | Înregistrare utilizator nou |
| POST | `/api/auth/login` | UC-1 | Autentificare, returnează JWT |
| POST | `/api/auth/logout` | UC-3 | Invalidare sesiune |
| GET | `/api/auth/me` | - | Date utilizator curent |

### Workouts
| Metodă | Rută | UC | Descriere |
|---|---|---|---|
| GET | `/api/workouts` | - | Lista antrenamente proprii (My Workouts) |
| GET | `/api/workouts/public` | UC-4.2 | Lista antrenamente publice (Our Workouts) |
| POST | `/api/workouts` | UC-4.1 | Creare antrenament personal |
| POST | `/api/workouts/public` | UC-4.2 | Creare antrenament public (Admin only) |
| POST | `/api/workouts/:id/copy` | UC-4.1 | Copiază antrenament public în My Workouts |
| PUT | `/api/workouts/:id` | UC-5 | Actualizare antrenament |
| DELETE | `/api/workouts/:id` | UC-6 | Ștergere antrenament |

### Exercises
| Metodă | Rută | Descriere |
|---|---|---|
| GET | `/api/exercises` | Lista tuturor exercițiilor disponibile |

### Workout Sessions
| Metodă | Rută | UC | Descriere |
|---|---|---|---|
| POST | `/api/sessions` | UC-10 | Pornire sesiune nouă |
| PUT | `/api/sessions/:id/set` | UC-10 | Marchează o serie ca finalizată |
| PUT | `/api/sessions/:id/finish` | UC-10 | Finalizare antrenament |
| PUT | `/api/sessions/:id/abandon` | UC-10 | Abandon antrenament |

### Progress Sheets
| Metodă | Rută | UC | Descriere |
|---|---|---|---|
| GET | `/api/progress` | - | Lista fișe de progres |
| POST | `/api/progress` | UC-7 | Creare fișă nouă |
| GET | `/api/progress/:id` | - | Detalii fișă + intrări |
| POST | `/api/progress/:id/entries` | UC-8 | Adăugare intrare nouă |
| DELETE | `/api/progress/:id` | UC-9 | Ștergere fișă + intrări |

### Photos
| Metodă | Rută | UC | Descriere |
|---|---|---|---|
| GET | `/api/photos/folders` | - | Lista foldere |
| POST | `/api/photos/folders` | UC-11 | Creare folder nou |
| GET | `/api/photos/folders/:id` | - | Pozele dintr-un folder |
| POST | `/api/photos/folders/:id/upload` | UC-11 | Upload poză (Multer, max 5MB) |
| DELETE | `/api/photos/:id` | UC-12 | Ștergere poză |

---

## 6. Planul de Iterații

### Iterația 1 – Autentificare & Management Antrenamente Personale
**Use Cases**: UC-1, UC-2, UC-3, UC-4.1, UC-5, UC-6

| # | Use Case | Backend | Frontend | Status |
|---|---|---|---|---|
| UC-1 | Autentificare | POST /auth/login | LoginPage.jsx | ✅ |
| UC-2 | Înregistrare cont nou | POST /auth/register | RegisterPage.jsx | ✅ |
| UC-3 | Deconectare | POST /auth/logout | NavbarMenu.jsx | ✅ |
| UC-4.1 | Creare antrenament personal | POST /workouts | CreateWorkoutPage.jsx | ✅ |
| UC-5 | Actualizare antrenament | PUT /workouts/:id | EditWorkoutPage.jsx | ✅ |
| UC-6 | Ștergere antrenament | DELETE /workouts/:id | ConfirmDialog în WorkoutsPage | ⬜ |

**Pagini UI Iterația 1**:
- `LoginPage` – formular email + parolă, buton Login, link spre Register
- `RegisterPage` – formular Nume + Email + Parolă, buton Register
- `DashboardPage` – Hello [Nume], Active Workout card, My Recent Workouts
- `WorkoutsPage` – tab MY WORKOUTS / OUR WORKOUTS, lista carduri, buton +
- `CreateWorkoutPage` – formular Nume + Descriere + adăugare exerciții + serii/reps
- `EditWorkoutPage` – același formular, populat cu datele existente

### Iterația 2 – Workout Activ, Antrenamente Publice, Poze
**Use Cases**: UC-10, UC-4.2, UC-11, UC-12

| # | Use Case | Backend | Frontend | Status |
|---|---|---|---|---|
| UC-10 | Start la un workout | POST/PUT /sessions | ActiveWorkoutPage.jsx | ⬜ |
| UC-4.2 | Creare antrenament public (Admin) | POST /workouts/public | CreatePublicWorkoutPage.jsx | ✅ |
| UC-11 | Adaugă poză de progres | POST /photos/... | PhotosPage.jsx | ⬜ |
| UC-12 | Șterge poză de progres | DELETE /photos/:id | PhotosPage + ConfirmDialog | ⬜ |

### Iterația 3 – Fișe de Progres
**Use Cases**: UC-7, UC-8, UC-9

| # | Use Case | Backend | Frontend | Status |
|---|---|---|---|---|
| UC-7 | Creare fișă de progres | POST /progress | ProgressPage.jsx | ⬜ |
| UC-8 | Adăugare intrare în fișă | POST /progress/:id/entries | ProgressSheetPage.jsx | ⬜ |
| UC-9 | Ștergere fișă de progres | DELETE /progress/:id | ConfirmDialog în ProgressPage | ⬜ |

---

## 7. Cerințe Nefuncționale Implementate

| Cerință | Implementare |
|---|---|
| Parole criptate (bcrypt) | `bcrypt.hash()` la register, `bcrypt.compare()` la login |
| Sesiuni cu expirare 24h | JWT cu `expiresIn: '24h'` |
| Control acces Admin | Middleware `requireAdmin.js` pe rute /workouts/public |
| Stocare securizată poze | Fișiere locale în `/uploads`, acces doar cu JWT valid |
| Max 5MB per poză | Limită în configurarea Multer |
| Confirmare înainte de ștergere | Componentă `ConfirmDialog.jsx` reutilizabilă |
| Mobile-First | Tailwind CSS cu clase `sm:` breakpoints |
| Feedback vizual | Componentă `Toast.jsx` pentru succes/eroare |
| CRUD < 2 secunde | Prisma ORM + indexuri pe foreign keys |

---

## 8. Variabile de Mediu (.env)

```
DATABASE_URL="file:./dev.db"
JWT_SECRET="fitflow_secret_key_change_in_prod"
JWT_EXPIRES_IN="24h"
PORT=5000
FRONTEND_URL="http://localhost:5173"
MAX_FILE_SIZE=5242880
UPLOAD_PATH="./uploads"
```

---

## 9. Log Implementare

### [v0.1] – Setup inițial
- Structura proiectului creată
- CONTEXT.md inițializat
- Package.json-uri configurate
- Schema Prisma definită
- Fișiere de bază scaffold create

### [v0.2] – UC-1: Autentificare Utilizator
- `backend/src/services/authService.js` creat: `findUser(email)` + `authenticate(data)` (conform diagramei de secvență)
- `backend/src/controllers/authController.js` actualizat: `login` apelează `authService.authenticate()`, returnează JWT
- `frontend/src/pages/auth/LoginPage.jsx` implementat complet: form email + parolă, `handleSubmit`, redirect dashboard după login, mesaj eroare la credențiale greșite
- Flux implementat conform diagramei: steps 1-10 (introducere credențiale → handleSubmit → authenticate → findUser → creare sesiune JWT → redirect → destroy form)

---

### [v0.3] – UC-2: Înregistrare Cont Nou
- `backend/src/services/userService.js` creat: `checkEmail(email)` (SELECT) + `save(user)` (INSERT) + `createAccount(data)` (orchestrator)
- `backend/src/controllers/authController.js` actualizat: `register` apelează `userService.createAccount()`, returnează 201 la succes, 409 dacă emailul e deja folosit
- `frontend/src/pages/auth/RegisterPage.jsx` implementat complet: form Nume + Email + Parolă, `handleSubmit`, toast succes, redirect login, mesaj eroare email duplicat
- Flux implementat conform diagramei: steps 1-13 (introducere date → handleSubmit → createAccount → checkEmail → email valid → save → confirmare → succes → redirect → destroy form)

### [v0.4] – UC-3: Deconectare Utilizator
- `backend/src/services/sessionService.js` creat: `destroySession(userId)` – confirmare invalidare sesiune JWT
- `backend/src/controllers/authController.js` actualizat: `logout` apelează `sessionService.destroySession()`, returnează confirmare
- `frontend/src/components/layout/NavbarMenu.jsx` creat (boundary UC-3): avatar dropdown cu buton Logout, `handleLogout()` → POST /auth/logout → curăță AuthContext + localStorage → redirect /login
- `frontend/src/components/layout/AppLayout.jsx` actualizat: header sticky cu logo + NavbarMenu vizibil pe toate paginile protejate
- Flux implementat conform diagramei: steps 1-5 (apasă Logout → handleLogout → destroySession → sesiune invalidată → redirect login)
- Excepție 3.0.E1 tratată: dacă sesiunea expirase deja (eroare 401), logout local se execută oricum

### [v0.5] – UC-4.1: Creează un Antrenament Personal
- `backend/src/services/workoutService.js` creat: `save()` (tranzacție Prisma INSERT workout + exerciții), `createWorkout()` (validare + orchestrare), `getMyWorkouts()`, `getWorkoutById()`
- `backend/src/controllers/workoutController.js` actualizat: `createWorkout` apelează `workoutService.createWorkout()`, `getMyWorkouts` returnează lista
- `backend/src/controllers/exerciseController.js` implementat: `getExercises()` returnează lista grupată după muscleGroup
- `frontend/src/pages/workouts/CreateWorkoutPage.jsx` implementat complet: form Nume + Descriere + exerciții cu serii/rep, handleSubmit, redirect My Workouts
- `frontend/src/pages/workouts/WorkoutsPage.jsx` implementat: tab MY WORKOUTS cu lista carduri, buton FAB +, buton Start/Edit/Delete pe fiecare card
- `frontend/src/pages/dashboard/DashboardPage.jsx` implementat: salut utilizator, quick links
- Flux implementat conform diagramei: steps 1-14

### [v0.6] – UC-5: Actualizează un Antrenament
- `backend/src/services/workoutService.js` extins: `update()` (tranzacție Prisma – UPDATE header + DELETE exerciții vechi + INSERT exerciții noi), `updateWorkout()` (validare + verificare existență + orchestrare)
- `backend/src/controllers/workoutController.js` extins: `updateWorkout` + `getWorkoutById` (necesar pentru preload form)
- `backend/src/routes/workouts.js` extins: `GET /api/workouts/:id`
- `frontend/src/pages/workouts/EditWorkoutPage.jsx` implementat complet: preloadează datele existente, `handleUpdate(newData)`, redirect My Workouts la succes
- Excepția 5.0.E1 tratată: dacă workout-ul nu mai există (404), redirect automat la /workouts
- Flux implementat conform diagramei: steps 1-11

### [v0.7] – UC-6: Șterge un Antrenament
- `backend/src/services/workoutService.js` extins: `deleteById()` (tranzacție Prisma – DELETE WorkoutExercise + DELETE Workout), `deleteWorkout(workoutId, userId)` (verificare existență + ownership + apel deleteById)
- `backend/src/controllers/workoutController.js` extins: `deleteWorkout` implementat complet – Step 4-9 din diagramă
- Frontend (`WorkoutsPage.jsx`) era deja complet: Step 1 (iconița ștergere → setDeleteTarget), Step 2 (ConfirmDialog pop-up), Step 3 (confirmare "Da" → handleDeleteConfirm), Step 4 (DELETE /api/workouts/:id), Step 9 (filter listă + toast succes)
- Flux implementat conform diagramei: steps 1-9

---


### [v0.8] – UC-4.2: Creează un Antrenament Public (Admin)
- `backend/src/services/workoutService.js` extins: `getPublicWorkouts()` (SELECT toate workouts PUBLIC), `createPublicWorkout({ name, description, restTime, adminId, exercises })` (validare + verificare duplicat PUBLIC + INSERT), `copyPublicWorkout({ workoutId, userId })` (copiere workout PUBLIC in PERSONAL)
- `deleteWorkout(workoutId, userId, role)` actualizat: adminii pot șterge orice workout PUBLIC
- `backend/src/controllers/workoutController.js`: `getPublicWorkouts`, `createPublicWorkout`, `copyWorkout` implementate complet
- `frontend/src/pages/workouts/CreatePublicWorkoutPage.jsx` creat: formular identic cu CreateWorkoutPage, badge "Public", succes → redirect `/workouts` cu `state.initialTab = 'OUR'`, guard frontend pentru non-admin
- `frontend/src/pages/workouts/WorkoutsPage.jsx` actualizat: tab OUR WORKOUTS funcțional (fetch public workouts, `PublicWorkoutCard` cu badge Public + buton Copy pentru useri + buton Delete pentru admin), FAB pe tab OUR (admin only), `initialTab` din location.state
- `frontend/src/App.jsx` actualizat: ruta `/workouts/public/new` → `CreatePublicWorkoutPage`
- Fluxuri tratate: Normal flow (steps 1-13), Alternative flow 4.1.1 (date lipsă – validare frontend + backend 400/409), Excepția 4.1.E1 (sesiune expirată – interceptor Axios redirect /login), guard frontend non-admin

*Ultima actualizare: UC-4.2 – Crează Antrenament Public ✅*
