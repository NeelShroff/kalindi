import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv

load_dotenv()

def test_smtp_connection():
    host = os.getenv("SMTP_HOST", "")
    port = int(os.getenv("SMTP_PORT", 587) if os.getenv("SMTP_PORT") else 587)
    user = os.getenv("SMTP_USER", "")
    password = os.getenv("SMTP_PASS", "")
    sender = os.getenv("SENDER_EMAIL", "")
    recipient = os.getenv("OWNER_EMAIL", "")

    print("--- SMTP Configuration Test ---")
    print(f"SMTP Host: {host}")
    print(f"SMTP Port: {port}")
    print(f"SMTP User: {user}")
    print(f"Sender Email: {sender}")
    print(f"Recipient Email: {recipient}")
    print("---------------------------------")

    if not host or not user or not password:
        print("[!] ERROR: SMTP credentials are not fully configured in your .env file.")
        print("[!] Please open 'backend/.env' and configure the SMTP variables.")
        return

    try:
        print("[*] Connecting to SMTP server...")
        server = smtplib.SMTP(host, port)
        server.ehlo()
        print("[*] Starting TLS session...")
        server.starttls()
        print("[*] Logging in...")
        server.login(user, password)
        
        print("[*] Constructing test email...")
        msg = MIMEMultipart("alternative")
        msg["Subject"] = "Kalindi - SMTP Connection Test Successful!"
        msg["From"] = sender or user
        msg["To"] = recipient or user
        
        body = """
        <html>
            <body>
                <h2 style="color: #7c3aed;">SMTP Connection Successful!</h2>
                <p>Your Kalindi backend is ready to send email notifications for customer orders.</p>
                <p>Best regards,<br><strong>Kalindi System</strong></p>
            </body>
        </html>
        """
        msg.attach(MIMEText(body, "html"))
        
        print(f"[*] Sending email to {msg['To']}...")
        server.sendmail(msg["From"], [msg["To"]], msg.as_string())
        server.quit()
        print("[+] SUCCESS: Test email sent successfully!")
        
    except Exception as e:
        print(f"[-] ERROR: Failed to connect or send mail. Reason: {e}")

if __name__ == "__main__":
    test_smtp_connection()
