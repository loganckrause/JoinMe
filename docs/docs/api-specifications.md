---
sidebar_position: 2
---

# API Specifications

This page documents the API specifications for the JoinMe backend service.

## Introduction

The JoinMe API is a RESTful API built with FastAPI. It provides endpoints for user authentication, event management, and recommendations.

## Endpoints

### Events

`POST /api/events`

**Purpose**: Allows a user to create a new event.

**Pre-conditions**: User is authenticated

**Post-conditions**: New record in Events table.

#### POST Arguments

| Argument | Description |
| :--- | :--- |
| `title` | Name of the event. |
| `description` | Details of the activity. |
| `time` | When the event starts. |
| `max_capacity` | Maximum number of attendees. |
| `location` | Address |

#### Return

- `event_id`: ID of the event.

#### Exceptions thrown

- `403 Forbidden`: User reputation is too low to host events.
- `400 Bad Request`: Invalid date or missing fields.
