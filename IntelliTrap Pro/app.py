import datetime
import csv
import io
import subprocess
import os
from flask import Flask, render_template, request, jsonify, Response, session, redirect, url_for
from flask_sqlalchemy import SQLAlchemy

app = Flask(__name__)
# Secret key is required for session management
app.secret_key = 'super_secret_cyber_key_123'

# Configure SQLAlchemy
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///database.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)

# Database Model
class Attack(db.Model):
    __tablename__ = 'attacks'
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(100))
    password = db.Column(db.String(255))
    ip_address = db.Column(db.String(50))
    user_agent = db.Column(db.Text)
    timestamp = db.Column(db.String(50))
    risk_level = db.Column(db.String(20))

# Initialize Database
with app.app_context():
    db.create_all()

def block_ip(ip_address):
    """
    Attempts to block the IP address using Windows Defender Firewall.
    Requires the script to be run with Administrator privileges.
    """
    if ip_address in ['127.0.0.1', 'localhost', '::1']:
        print(f"[SAFEGUARD] Ignored block request for localhost: {ip_address}")
        return False
        
    try:
        # Construct the netsh command
        rule_name = f"IntelliTrap_Block_{ip_address}"
        command = [
            "netsh", "advfirewall", "firewall", "add", "rule", 
            f"name={rule_name}", "dir=in", "action=block", f"remoteip={ip_address}"
        ]
        
        # Execute the command
        result = subprocess.run(command, capture_output=True, text=True)
        
        if result.returncode == 0:
            print(f"[FIREWALL] Successfully blocked IP: {ip_address}")
            return True
        else:
            print(f"[FIREWALL ERROR] Failed to block IP (Admin rights missing?): {result.stderr}")
            return False
    except Exception as e:
        print(f"[FIREWALL EXCEPTION] {str(e)}")
        return False

def analyze_risk(username, password, ip_address):
    high_risk_users = ['admin', 'root', 'hacker', 'test', 'sqladmin', 'administrator', 'sysadmin']
    
    if username.lower() in high_risk_users:
        return 'High Risk'
    
    if len(password) < 4:
        return 'Medium Risk'
    
    # Check for repeated IPs using SQLAlchemy
    count = Attack.query.filter_by(ip_address=ip_address).count()
    
    if count > 3:
        return 'High Risk'
    elif count > 1:
        return 'Medium Risk'
        
    return 'Low Risk'

# --- PUBLIC ROUTES (Honeypot) ---

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/login', methods=['POST'])
def login():
    username = request.form.get('username', '')
    password = request.form.get('password', '')
    
    # Capture environment data
    ip_address = request.remote_addr
    user_agent = request.headers.get('User-Agent', 'Unknown Browser')
    timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    
    # AI Risk Analysis
    risk_level = analyze_risk(username, password, ip_address)
    
    # If high risk, try to block the IP via firewall!
    if risk_level == 'High Risk':
        block_ip(ip_address)
    
    # Store in database via SQLAlchemy
    new_attack = Attack(
        username=username,
        password=password,
        ip_address=ip_address,
        user_agent=user_agent,
        timestamp=timestamp,
        risk_level=risk_level
    )
    db.session.add(new_attack)
    db.session.commit()
    
    print(f"[ALERT] Captured Login: {username} | Risk: {risk_level} | IP: {ip_address}")
    
    # Return a simulated failure
    return jsonify({
        "status": "error",
        "message": "Authentication Failed. Invalid Credentials."
    }), 401

# --- SECURE ADMIN ROUTES ---

@app.route('/admin-login', methods=['GET', 'POST'])
def admin_login():
    if request.method == 'POST':
        # Hardcoded admin password for presentation simplicity
        if request.form.get('password') == 'admin123':
            session['logged_in'] = True
            return redirect(url_for('dashboard'))
        else:
            return render_template('admin_login.html', error="Invalid Override Code")
    return render_template('admin_login.html')

@app.route('/logout')
def logout():
    session.pop('logged_in', None)
    return redirect(url_for('admin_login'))

@app.route('/dashboard')
def dashboard():
    if not session.get('logged_in'):
        return redirect(url_for('admin_login'))
    return render_template('dashboard.html')

@app.route('/api/stats')
def api_stats():
    if not session.get('logged_in'):
        return jsonify({"error": "Unauthorized"}), 403
        
    total_attacks = Attack.query.count()
    high_risk = Attack.query.filter_by(risk_level='High Risk').count()
    
    # Get top 5 usernames using SQLAlchemy group_by
    from sqlalchemy import func
    top_users_query = db.session.query(
        Attack.username, func.count(Attack.id).label('count')
    ).group_by(Attack.username).order_by(func.count(Attack.id).desc()).limit(5).all()
    
    top_usernames = [{"username": row.username, "count": row.count} for row in top_users_query]
    
    return jsonify({
        "total_attacks": total_attacks,
        "high_risk": high_risk,
        "top_usernames": top_usernames
    })

@app.route('/api/attacks')
def api_attacks():
    if not session.get('logged_in'):
        return jsonify({"error": "Unauthorized"}), 403
        
    recent_attacks = Attack.query.order_by(Attack.id.desc()).limit(50).all()
    attacks_list = [{
        "id": a.id,
        "username": a.username,
        "password": a.password,
        "ip_address": a.ip_address,
        "user_agent": a.user_agent,
        "timestamp": a.timestamp,
        "risk_level": a.risk_level
    } for a in recent_attacks]
    
    return jsonify(attacks_list)

@app.route('/export')
def export_csv():
    if not session.get('logged_in'):
        return redirect(url_for('admin_login'))
        
    all_attacks = Attack.query.order_by(Attack.id.desc()).all()
    
    # Create CSV in memory
    si = io.StringIO()
    cw = csv.writer(si)
    cw.writerow(['ID', 'Username', 'Password', 'IP Address', 'User Agent', 'Timestamp', 'Risk Level'])
    
    def sanitize_csv(val):
        if isinstance(val, str) and val.startswith(('=', '+', '-', '@')):
            return f"'{val}"
        return val

    for a in all_attacks:
        sanitized_row = [
            a.id,
            sanitize_csv(a.username),
            sanitize_csv(a.password),
            a.ip_address,
            sanitize_csv(a.user_agent),
            a.timestamp,
            a.risk_level
        ]
        cw.writerow(sanitized_row)
    
    output = Response(si.getvalue(), mimetype="text/csv")
    output.headers["Content-Disposition"] = "attachment; filename=threat_report.csv"
    return output

if __name__ == '__main__':
    # Use port 5000, listen on all interfaces
    app.run(debug=True, port=5000)