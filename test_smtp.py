import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

try:
    msg = MIMEMultipart("related")
    msg["Subject"] = "Test Full SMTP"
    msg["From"] = "neelshroff03@gmail.com"
    msg["To"] = "neelshroff03@gmail.com"
    
    msg_alternative = MIMEMultipart("alternative")
    msg.attach(msg_alternative)
    
    part = MIMEText("<h1>TEST</h1>", "html")
    msg_alternative.attach(part)
    
    server = smtplib.SMTP("smtp.gmail.com", 587)
    server.ehlo()
    server.starttls()
    server.login("neelshroff03@gmail.com", "orglnzzpbglpgxus")
    server.sendmail(msg["From"], [msg["To"]], msg.as_string())
    server.quit()
    print("EMAIL COMPLETELY SENT SUCCESSFULLY!")
except Exception as e:
    print(f"FAILED: {str(e)}")
