# JoinMe Quick Start

## Required software

- Docker + Docker Compose
- Python 3.12+
- Node.js 18+ and npm
- Git
- Expo Go app for physical iOS/Android testing

## Python virtual environment

From the backend folder:

```bash
cd /home/logank/school/capstone/project/backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

If the Python command on your system is `python3`, use that instead.

## 1. Start Docker containers

From the repository root:

```bash
cd /home/logank/school/capstone/project
docker compose up -d
```

This starts the MySQL database and any backend containers defined in `docker-compose.yml`.

## 2. Seed the MySQL database

Run the seed script from the backend folder:

```bash
cd /home/logank/school/capstone/project/backend
PYTHONPATH=. python seed_data.py
```

This loads test data into the MySQL database.

## 3. Configure frontend environment

Create the frontend `.env.local` file:

```bash
cd /home/logank/school/capstone/project/frontend
cp .env.example .env.local
```

Then edit `frontend/.env.local` and set:

```dotenv
EXPO_PUBLIC_API_URL=http://<YOUR_MACHINE_IP>:8000
```

### Expo Go note

For Expo Go on a physical iPhone, do not use `localhost`.
Use your computer's local network IP address instead, for example:

```dotenv
EXPO_PUBLIC_API_URL=http://192.168.1.175:8000
```

Make sure your phone is on the same Wi-Fi network as your computer.

## 4. Run the frontend

From the frontend folder:

```bash
cd /home/logank/school/capstone/project/frontend
npm install
npm start
```

Then open the Expo web interface and scan the QR code with Expo Go, or use the provided tunnel URL.

## Notes

- If your phone cannot reach the backend, the login request will time out.
- Use your machine IP only for physical devices; web and simulators can use `localhost`.
