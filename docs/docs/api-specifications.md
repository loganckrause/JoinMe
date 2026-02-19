---
sidebar_position: 2
---

# API Specifications

This page documents the API specifications for the JoinMe backend service.

## Introduction

The JoinMe API is a RESTful API built with FastAPI. It provides endpoints for user authentication, event management, and recommendations.

## Authentication

> [!NOTE]
> Authentication details will be added as the implementation is finalized.

## Endpoints

> [!NOTE]
> The backend implementation is currently in progress. This section will be updated with detailed endpoint documentation as routes are defined in `backend/app/main.py`.

### Users

- `POST /users/register`: Register a new user
- `POST /users/login`: Authenticate a user
- `GET /users/me`: Get current user profile

### Events

- `GET /events`: List all events
- `POST /events`: Create a new event
- `GET /events/{id}`: Get event details

### Recommendations

- `GET /recommendations`: Get personalized event recommendations
