import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.image import MIMEImage
import os
from ..config import settings

def send_email_fallback(subject: str, body: str, to_email: str):
    """Fallback logger when SMTP is not configured."""
    print("=" * 60)
    print(f"MOCK EMAIL SENT TO: {to_email}")
    print(f"SUBJECT: {subject}")
    print("-" * 60)
    print(body)
    print("=" * 60)

import logging
logger = logging.getLogger(__name__)

def send_html_email(subject: str, html_content: str, to_email: str):
    """Sends an HTML email using smtplib."""
    if not settings.SMTP_HOST or not settings.SMTP_USER or not settings.SMTP_PASS:
        logger.warning(f"Mock email sent to {to_email}: {subject}")
        return False
        
    try:
        msg = MIMEMultipart("related")
        msg["Subject"] = subject
        msg["From"] = settings.SENDER_EMAIL or settings.SMTP_USER
        msg["To"] = to_email
        
        msg_alternative = MIMEMultipart("alternative")
        msg.attach(msg_alternative)
        
        part = MIMEText(html_content, "html")
        msg_alternative.attach(part)
        
        # Attach the Kalindi logo as an inline image
        logo_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../frontend/public/kalindi.png"))
        if os.path.exists(logo_path):
            with open(logo_path, "rb") as f:
                img_data = f.read()
            img = MIMEImage(img_data)
            img.add_header("Content-ID", "<logo>")
            img.add_header("Content-Disposition", "inline", filename="kalindi.png")
            msg.attach(img)
        
        # Connect to SMTP server
        server = smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT)
        server.ehlo()
        server.starttls() # Secure connection
        server.login(settings.SMTP_USER, settings.SMTP_PASS)
        server.sendmail(msg["From"], [to_email], msg.as_string())
        server.quit()
        
        logger.info(f"Successfully sent email to {to_email}")
        return True
    except Exception as e:
        logger.error(f"Error sending email to {to_email}: {str(e)}")
        return False

def generate_customer_email_html(order, items) -> str:
    """Generates a beautiful HTML receipt for the customer."""
    items_rows = ""
    for item in items:
        subtotal = item.price * item.quantity
        items_rows += f"""
        <tr>
            <td style="padding: 12px; border-bottom: 1px solid #f1f1f1; text-align: left; color: #1e1b4b;">
                <strong>{item.product_name}</strong><br>
                <span style="color: #6b7280; font-size: 12px;">Weight: {item.weight}</span>
            </td>
            <td style="padding: 12px; border-bottom: 1px solid #f1f1f1; text-align: center; color: #1e1b4b;">{item.quantity}</td>
            <td style="padding: 12px; border-bottom: 1px solid #f1f1f1; text-align: right; color: #1e1b4b;">₹{item.price:.2f}</td>
            <td style="padding: 12px; border-bottom: 1px solid #f1f1f1; text-align: right; font-weight: bold; color: #1e1b4b;">₹{subtotal:.2f}</td>
        </tr>
        </tr>
        """
        
    shipping_address_html = order.shipping_address.replace('\n', '<br>')
    
    return f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <style>
            body {{ font-family: 'Outfit', 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #faf5ff; margin: 0; padding: 0; }}
            .container {{ max-width: 600px; margin: 20px auto; background: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 10px 30px rgba(139, 92, 246, 0.05); border: 1px solid rgba(139, 92, 246, 0.1); }}
            .header {{ background: #faf5ff; padding: 30px 20px; text-align: center; border-bottom: 3px solid #d946ef; }}
            .header img {{ max-height: 80px; width: auto; object-fit: contain; margin-bottom: 10px; }}
            .header p {{ color: #7c3aed; margin: 5px 0 0 0; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 2px; }}
            .content {{ padding: 40px 30px; }}
            .greeting {{ font-size: 18px; color: #1e1b4b; margin-top: 0; }}
            .details-box {{ background: #faf5ff; border: 1px solid #f3e8ff; border-radius: 16px; padding: 20px; margin-bottom: 30px; }}
            .details-box h3 {{ margin-top: 0; color: #7c3aed; font-size: 16px; border-bottom: 1px solid #e9d5ff; padding-bottom: 8px; }}
            .details-grid {{ display: grid; grid-template-columns: 1fr 1fr; gap: 15px; font-size: 14px; color: #4c1d95; }}
            .table-container {{ margin-bottom: 30px; }}
            table {{ w-full: 100%; width: 100%; border-collapse: collapse; }}
            th {{ background-color: #faf5ff; padding: 12px; text-align: left; color: #7c3aed; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; border-bottom: 2px solid #e9d5ff; }}
            .total-section {{ text-align: right; border-top: 2px solid #f3e8ff; padding-top: 20px; font-size: 16px; color: #1e1b4b; }}
            .total-amount {{ font-size: 24px; font-weight: 800; color: #7c3aed; }}
            .footer {{ background: #faf5ff; padding: 20px; text-align: center; border-top: 1px solid #f3e8ff; font-size: 12px; color: #6b7280; }}
            .footer a {{ color: #7c3aed; text-decoration: none; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <img src="cid:logo" alt="KALINDI" />
                <p>Luxury Dry Fruits & Wellness</p>
            </div>
            <div class="content">
                <h2 class="greeting">Thank you for your order, {order.customer_name}!</h2>
                <p style="color: #4b5563; line-height: 1.6; font-size: 15px;">Your order has been received and is being processed. Below are your order details and receipt.</p>
                
                <div class="details-box">
                    <h3>Order Information</h3>
                    <div style="font-size: 14px; color: #4b5563; line-height: 1.5;">
                        <strong>Order ID:</strong> #{order.id}<br>
                        <strong>Date:</strong> {order.created_at.strftime('%B %d, %Y %I:%M %p')}<br>
                        <strong>Phone:</strong> {order.customer_phone}<br>
                        <strong>Shipping Address:</strong><br>
                        {shipping_address_html}
                    </div>
                </div>
                
                <div class="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th style="text-align: left;">Item</th>
                                <th style="text-align: center;">Qty</th>
                                <th style="text-align: right;">Price</th>
                                <th style="text-align: right;">Subtotal</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items_rows}
                        </tbody>
                    </table>
                </div>
                
                <div class="total-section">
                    <strong>Total Amount Paid: </strong>
                    <span class="total-amount">₹{order.total_amount:.2f}</span>
                </div>
            </div>
            <div class="footer">
                <p>If you have any questions, please contact us at <a href="mailto:{settings.OWNER_EMAIL or 'support@kalindi.com'}">{settings.OWNER_EMAIL or 'support@kalindi.com'}</a></p>
                <p>&copy; 2026 Kalindi Luxury. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>
    """

def generate_admin_email_html(order, items) -> str:
    """Generates an HTML notification for the store owner."""
    items_rows = ""
    for item in items:
        subtotal = item.price * item.quantity
        items_rows += f"""
        <tr>
            <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: left;">
                <strong>{item.product_name}</strong> ({item.weight})
            </td>
            <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: center;">{item.quantity}</td>
            <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: right;">₹{item.price:.2f}</td>
            <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: right;">₹{subtotal:.2f}</td>
        </tr>
        </tr>
        """
        
    shipping_address_html = order.shipping_address.replace('\n', '<br>')
    
    return f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <style>
            body {{ font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 20px; }}
            .container {{ max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.1); border-top: 4px solid #7c3aed; }}
            .header {{ background: #1e1b4b; padding: 20px; color: #ffffff; text-align: center; }}
            .content {{ padding: 30px; }}
            h2 {{ color: #1e1b4b; margin-top: 0; }}
            .details-box {{ background: #f9f9f9; padding: 15px; border-radius: 6px; margin-bottom: 20px; border-left: 3px solid #7c3aed; }}
            table {{ width: 100%; border-collapse: collapse; margin-bottom: 20px; }}
            th {{ background: #f2f2f2; padding: 10px; text-align: left; border-bottom: 2px solid #ddd; font-size: 13px; }}
            .total {{ text-align: right; font-size: 18px; font-weight: bold; color: #7c3aed; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h2>New Order Received!</h2>
                <p>Order #{order.id}</p>
            </div>
            <div class="content">
                <div class="details-box">
                    <strong>Customer Details:</strong><br>
                    Name: {order.customer_name}<br>
                    Email: {order.customer_email}<br>
                    Phone: {order.customer_phone}<br>
                    Shipping Address:<br>
                    {shipping_address_html}
                </div>
                
                <h3>Items Ordered:</h3>
                <table>
                    <thead>
                        <tr>
                            <th style="text-align: left;">Item</th>
                            <th style="text-align: center;">Qty</th>
                            <th style="text-align: right;">Price</th>
                            <th style="text-align: right;">Subtotal</th>
                        </tr>
                    </thead>
                    <tbody>
                        {items_rows}
                    </tbody>
                </table>
                
                <div class="total">
                    Grand Total: ₹{order.total_amount:.2f}
                </div>
                
                <p style="margin-top: 30px; text-align: center; font-size: 13px; color: #666;">
                    Log in to the Admin Dashboard to manage this order and update its status.
                </p>
            </div>
        </div>
    </body>
    </html>
    """

def send_order_notifications(order, items):
    """Background task handler to send confirmation and owner emails."""
    # 1. Send confirmation to the Customer
    customer_subject = f"Order Confirmation #{order.id} - Kalindi Luxury"
    customer_html = generate_customer_email_html(order, items)
    send_html_email(customer_subject, customer_html, order.customer_email)
    
    # 2. Send notification to the Store Owner
    owner_subject = f"New Order Received! #{order.id} - ₹{order.total_amount:.2f}"
    owner_html = generate_admin_email_html(order, items)
    owner_email = settings.OWNER_EMAIL or settings.SMTP_USER
    if owner_email:
        send_html_email(owner_subject, owner_html, owner_email)
