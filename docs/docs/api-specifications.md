---
sidebar_position: 2
---

# API Specifications

This page documents the API specifications for the JoinMe backend service.

## Introduction

The JoinMe API is a RESTful API built with FastAPI. It provides endpoints for user authentication, event management, and recommendations.

## Events

### Create new event

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
| `user_id` | Id of user who is event organizer. |

#### Return

- `event_id`: ID of the event.

#### Exceptions thrown

- `403 Forbidden`: User reputation is too low to host events.
- `400 Bad Request`: Invalid date or missing fields.

### Delete event

`DELETE /api/events/{event_id}`

**Purpose**: Allows a user to delete existing event.

**Pre-conditions**: User is authenticated and is the creator of the event.

**Post-conditions**: The event record and any pending interactions associated with it are removed from the database.

**DELETE Arguments**:
| Argument | Description |
| :--- | :--- |
| event_id | The unique ID of the event to be deleted. |

**Return**: Success message confirming deletion.

**Exceptions thrown**:
- `403 Forbidden`: User is trying to delete an event they did not organize.
- `404 Not Found`: The event ID does not exist.

### Get event infromation
**Purpose**: Allows a user to get details about existing event.

### Update event infromation
**Purpose**: Allows a user to edit details about existing event.

## User

### Register new user

### User login
