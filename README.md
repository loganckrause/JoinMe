<p align="center">
  <img src="docs/static/img/logo.svg" alt="JoinMe Logo" width="120" />
</p>

<h1 align="center">JoinMe</h1>

<p align="center">
  <strong>Swipe. Discover. Join. — A social event discovery app.</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React_Native-61DAFB?style=flat&logo=react&logoColor=black" alt="React Native" />
  <img src="https://img.shields.io/badge/Expo-000020?style=flat&logo=expo&logoColor=white" alt="Expo" />
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=flat&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Python-3776AB?style=flat&logo=python&logoColor=white" alt="Python" />
  <img src="https://img.shields.io/badge/FastAPI-009688?style=flat&logo=fastapi&logoColor=white" alt="FastAPI" />
</p>

---

## About

JoinMe is a mobile app that helps you discover events happening around you — think Tinder, but for events. Swipe through personalized event recommendations, create your own gatherings, and connect with people who share your interests.

## Features

- **Swipe-based event discovery** — Browse events with an intuitive swipe interface
- **Event creation & management** — Create, edit, and manage your own events
- **Real-time event chat** — Message other attendees within event threads
- **Ratings & reputation** — Rate events and users to build community trust
- **Smart recommendations** — Location-aware suggestions powered by LightFM
- **Push notifications** — Stay updated on events you care about
- **Map view** — Explore nearby events on an interactive map
- **User profiles & preferences** — Customize your experience and interests

## Tech Stack

| Layer | Technologies |
|-------|-------------|
| **Frontend** | React Native, Expo, TypeScript, Expo Router |
| **Backend** | Python, FastAPI |
| **Docs** | Docusaurus |

## Project Structure

```
JoinMe/
├── frontend/     # React Native (Expo) mobile app
├── backend/      # Python FastAPI server
├── docs/         # Docusaurus documentation site
└── diagrams/     # Architecture & ER diagrams (Mermaid)
```

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (LTS)
- [Yarn](https://yarnpkg.com/)
- [Python 3.10+](https://www.python.org/)
- [Expo CLI](https://docs.expo.dev/get-started/installation/)

### Frontend

```bash
cd frontend
yarn install
npx expo start
```

Scan the QR code with Expo Go or run on a simulator.

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

## Documentation

Full project documentation is available at **[loganckrause.github.io/JoinMe](https://loganckrause.github.io/JoinMe/)**.
