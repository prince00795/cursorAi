# Kisan Sahayak — किसान सहायक

**Farmer Scheme Assistance Platform** — Find, apply for, and track Indian government agricultural schemes.

## Features

### For Farmers (Web App)
- **Personalized Scheme Matching** — AI-powered eligibility engine filters schemes based on land area, income, caste, crops, and location
- **Priority Ranked Results** — Most beneficial & accessible schemes shown first
- **Document Guidance** — Exact list of required documents per scheme
- **Application Tracking** — Track status from "Interested" → "Applied" → "Approved" → "Disbursed"
- **Online Apply Links** — Direct links to official portals + nearby CSC center guidance

### For Keypad/Basic Phone Farmers (AI Call Assistant)
- **Outbound Calls** — Admin calls farmers who don't have smartphones
- **Bilingual Scripts** — Auto-generated Hindi/English call scripts with scheme details
- **Call Outcomes** — Log whether farmer applied, needs help, or is not interested
- **Automated Follow-ups** — Schedule follow-up calls to track application progress
- **Application Number Tracking** — Collect and track application numbers over the phone

### Admin Dashboard
- Survey data import (bulk farmer onboarding)
- Farmer management with filtering
- Scheme management (add/edit/toggle)
- Call queue management
- Statistics and reporting

## Schemes Covered (15+ at launch)
- PM-KISAN (₹6,000/year income support)
- PM Fasal Bima Yojana (crop insurance)
- Kisan Credit Card
- PM Krishi Sinchai Yojana (irrigation subsidy)
- PM Kusum Yojana (solar pumps)
- SC/ST Special Component Plan
- PM Kisan Maan Dhan Yojana (pension)
- eNAM (market access)
- Soil Health Card
- SMAM (farm machinery subsidy)
- NFSM (crop development)
- PKVY (organic farming)
- National Horticulture Mission
- RKVY (agriculture development)
- NABARD Micro Irrigation Fund

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Node.js + Express + TypeScript |
| Database | SQLite (via better-sqlite3) |
| Auth | JWT |
| Frontend | React 18 + TypeScript + Vite |
| Styling | Tailwind CSS |
| State | TanStack Query |
| Call Assistant | Twilio (configurable) |

## Quick Start

### Step 1 — Install all dependencies
```bash
npm run install:all
```
> Run this from the **root folder** (the one containing `backend/` and `frontend/`). This installs dependencies for both packages.

### Step 2 — First-time setup (copy .env + seed database)
```bash
npm run setup
```
> This copies `backend/.env.example` → `backend/.env` and seeds 15 agricultural schemes into the database automatically.

### Step 3 — Start both servers
```bash
npm run dev
```
> Starts backend on **http://localhost:5000** and frontend on **http://localhost:3000** simultaneously.

### Or start separately (two terminals)
```bash
# Terminal 1 — Backend API
npm run dev:backend

# Terminal 2 — Frontend
npm run dev:frontend
```

### Step 4 — Create the first admin account
Open **http://localhost:3000/setup** in your browser.
- Fill in admin name, phone, password
- Setup key: `kisan_setup_2024`

Then login at **http://localhost:3000/login** with the admin credentials.

## API Endpoints

| Method | Path | Description |
|---|---|---|
| POST | /api/auth/register | Farmer self-registration |
| POST | /api/auth/login | Login |
| GET | /api/farmers/my-schemes | Get eligible schemes for logged-in farmer |
| POST | /api/farmers/profile | Save/update farmer profile |
| GET | /api/schemes | Browse all schemes |
| POST | /api/applications | Track a scheme |
| PUT | /api/applications/:id | Update application status |
| GET | /api/calls/outbound-queue | Farmers to call (admin) |
| GET | /api/calls/script/:farmerId | Generate call script |
| POST | /api/calls/initiate | Log a call |
| POST | /api/calls/outcome | Record call outcome |
| POST | /api/farmers/survey-import | Bulk import from survey |
| GET | /api/admin/stats | Dashboard statistics |

## Twilio Integration (AI Calls)

Set in `backend/.env`:
```
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=+91...
```

The call service is ready to integrate with Twilio's Programmable Voice API. The `callService.ts` generates bilingual (Hindi/English) call scripts with:
- Eligible scheme summaries with benefits and deadlines
- Required document lists
- Nearest CSC center guidance with estimated charges
- Follow-up scheduling

## Survey Data Import

Import farmer data collected in the field via the admin panel or API:

```json
[
  {
    "name": "Ramesh Kumar",
    "phone": "9876543210",
    "state": "Uttar Pradesh",
    "district": "Lucknow",
    "land_area_acres": 2.5,
    "caste": "OBC",
    "annual_income": 85000,
    "crops": ["Wheat", "Rice/Paddy"],
    "smartphone_proficiency": "none",
    "bank_account": true,
    "preferred_language": "hindi"
  }
]
```
