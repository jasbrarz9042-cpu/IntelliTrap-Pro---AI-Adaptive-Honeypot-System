# IntelliTrap Pro - AI Adaptive Honeypot System

IntelliTrap Pro is a cutting-edge cybersecurity honeypot project designed to simulate a highly secure corporate login portal. Instead of blocking attackers, it silently captures their credentials, IP addresses, and browser details, analyzing the intrusion attempts in real-time.

## Features
- **Smart Honeypot Login**: A realistic, futuristic "Secure Employee Portal" that tracks all login attempts.
- **AI-Based Attack Detection**: Automatically categorizes intrusions into Low, Medium, and High Risk based on username patterns (e.g., `admin`, `root`), password complexity, and repeated attempts.
- **Live Monitoring Dashboard**: A stunning admin panel featuring real-time terminal logs, statistical charts, and detailed threat analysis.
- **Threat Reporting**: Export captured data to CSV for forensic analysis.
- **Realistic Trapping**: Uses fake loading animations ("Encrypting credentials...", "Verifying...") and returns fake authentication errors to keep attackers engaged.

## Tech Stack
- **Backend**: Python, Flask
- **Frontend**: HTML5, CSS3, Vanilla JavaScript, Chart.js
- **Database**: SQLite3

## Installation and Setup

This project is beginner-friendly and requires no complex configuration.

1. **Clone or Download** this repository.
2. Ensure you have **Python 3** installed.
3. Open a terminal in the project directory.
4. Install the required dependency (Flask):
   ```bash
   pip install flask
   ```
5. Run the application:
   ```bash
   python app.py
   ```

## Usage
- **Honeypot Portal**: Go to `http://127.0.0.1:5000/` and try logging in with different credentials to generate data.
  - *Tip: Try usernames like `admin` or `root` to trigger High Risk alerts!*
- **Admin Dashboard**: Go to `http://127.0.0.1:5000/dashboard` to view the live threat monitoring panel.

## Screenshots / Presentation Details
For a BCA/Final Year project presentation, demonstrate the following flow:
1. Show the sleek UI of the login page.
2. Attempt a fake hack using "admin" / "1234".
3. Show the fake encryption loading screens.
4. Open the Dashboard to instantly see the intrusion logged in the live terminal, the charts update, and the new high-risk entry in the table.
5. Click "Export CSV" to demonstrate reporting capabilities.
