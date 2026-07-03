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
        
        # Attach the Kalindi logo as an inline image (check png first, then fallback to webp)
        logo_path_local = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../static/logo.webp"))
        logo_path_png = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../frontend/public/kalindi.png"))
        logo_path_webp = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../frontend/public/kalindi.webp"))
        logo_path = logo_path_local if os.path.exists(logo_path_local) else (
            logo_path_png if os.path.exists(logo_path_png) else (
                logo_path_webp if os.path.exists(logo_path_webp) else None
            )
        )
        
        if logo_path:
            with open(logo_path, "rb") as f:
                img_data = f.read()
            subtype = "webp" if logo_path.endswith(".webp") else "png"
            img = MIMEImage(img_data, _subtype=subtype)
            img.add_header("Content-ID", "<logo>")
            img.add_header("Content-Disposition", "inline", filename=os.path.basename(logo_path))
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
            <td style="padding: 16px 14px; border-bottom: 1px solid #f3e8ff; text-align: left; color: #1e072b; font-size: 14px;">
                <strong style="color: #1e072b; font-weight: 600; display: block;">{item.product_name}</strong>
                <span style="color: #6b7280; font-size: 12px; display: block; margin-top: 2px;">Weight: {item.weight}</span>
            </td>
            <td style="padding: 16px 14px; border-bottom: 1px solid #f3e8ff; text-align: center; color: #1e072b; font-size: 14px;">{item.quantity}</td>
            <td style="padding: 16px 14px; border-bottom: 1px solid #f3e8ff; text-align: right; color: #1e072b; font-size: 14px;">₹{item.price:.2f}</td>
            <td style="padding: 16px 14px; border-bottom: 1px solid #f3e8ff; text-align: right; font-weight: 700; color: #3d1a5c; font-size: 14px;">₹{subtotal:.2f}</td>
        </tr>
        """
        
    shipping_address_html = order.shipping_address.replace('\n', '<br>')
    payment_method_label = "Cash on Delivery (COD)" if getattr(order, "payment_method", "online") == "cod" else "Online (Prepaid)"
    total_label = "Total Amount to Pay (COD)" if getattr(order, "payment_method", "online") == "cod" else "Total Amount Paid"
    
    # Calculate financial summary details
    item_subtotal = sum(item.price * item.quantity for item in items)
    discount_amount = 0.0
    if order.discount_code == "FIRST7":
        discount_amount = round(item_subtotal * 0.07, 2)
    shipping_fee = max(0.0, order.total_amount - (item_subtotal - discount_amount))
    
    discount_row = ""
    if discount_amount > 0:
        discount_row = f"""
        <tr>
            <td style="text-align: left; padding: 4px 0; border: none; color: #10b981; font-size: 14px;">Discount ({order.discount_code}):</td>
            <td style="text-align: right; padding: 4px 0; border: none; color: #10b981; font-weight: 600; font-size: 14px;">-₹{discount_amount:.2f}</td>
        </tr>
        """
        
    return f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
        <style>
            body {{
                font-family: 'Outfit', 'Helvetica Neue', Helvetica, Arial, sans-serif;
                background-color: #faf5ff;
                margin: 0;
                padding: 0;
                -webkit-font-smoothing: antialiased;
            }}
            .container {{
                max-width: 600px;
                margin: 30px auto;
                background: #ffffff;
                border-radius: 28px;
                overflow: hidden;
                box-shadow: 0 15px 45px rgba(61, 26, 92, 0.06);
                border: 1px solid rgba(139, 92, 246, 0.08);
            }}
            .top-bar {{
                height: 6px;
                background: linear-gradient(90deg, #d4af37 0%, #f9f5d7 50%, #d4af37 100%);
            }}
            .header {{
                background: linear-gradient(135deg, #be185d 0%, #e91e8c 100%);
                padding: 45px 20px;
                text-align: center;
                border-bottom: 4px solid #D4AF37;
            }}
            .logo {{
                display: block;
                margin: 0 auto;
                max-height: 75px;
                width: auto;
                border: 0;
                outline: none;
                /* Styled alt text in case image is blocked */
                color: #D4AF37;
                font-size: 28px;
                font-weight: 900;
                letter-spacing: 6px;
                text-transform: uppercase;
                font-family: 'Outfit', sans-serif;
                text-align: center;
            }}
            .header p {{
                color: #ffffff;
                margin: 0;
                font-size: 11px;
                font-weight: 600;
                text-transform: uppercase;
                letter-spacing: 3px;
            }}
            .content {{
                padding: 45px 35px;
            }}
            .greeting {{
                font-size: 24px;
                color: #1e072b;
                margin-top: 0;
                font-weight: 800;
                letter-spacing: -0.5px;
                margin-bottom: 12px;
            }}
            .intro-text {{
                color: #4b5563;
                line-height: 1.6;
                font-size: 15px;
                margin-bottom: 30px;
            }}
            .details-box {{
                background: #faf6ff;
                border: 1px solid rgba(139, 92, 246, 0.1);
                border-radius: 20px;
                padding: 24px;
                margin-bottom: 35px;
            }}
            .details-box h3 {{
                margin-top: 0;
                color: #3d1a5c;
                font-size: 13px;
                font-weight: 700;
                text-transform: uppercase;
                letter-spacing: 1.5px;
                border-bottom: 1px solid rgba(139, 92, 246, 0.12);
                padding-bottom: 10px;
                margin-bottom: 16px;
            }}
            .details-table {{
                width: 100%;
                border-collapse: collapse;
            }}
            .details-table td {{
                padding: 6px 0;
                border: none;
                font-size: 14px;
                color: #4b5563;
                vertical-align: top;
            }}
            .details-table td.label-cell {{
                width: 130px;
                font-weight: 600;
                color: #8b5cf6;
            }}
            .details-table td.val-cell {{
                color: #1e072b;
            }}
            .address-block {{
                margin-top: 16px;
                padding: 14px 18px;
                background: #ffffff;
                border-radius: 12px;
                border: 1px solid rgba(139, 92, 246, 0.08);
                font-size: 13px;
                color: #4b5563;
                line-height: 1.6;
            }}
            .address-title {{
                color: #3d1a5c;
                font-weight: 700;
                display: block;
                margin-bottom: 6px;
                font-size: 11px;
                text-transform: uppercase;
                letter-spacing: 1px;
            }}
            .table-container {{
                margin-bottom: 35px;
                border-radius: 16px;
                overflow: hidden;
                border: 1px solid #f3e8ff;
            }}
            table.items-table {{
                width: 100%;
                border-collapse: collapse;
            }}
            table.items-table th {{
                background-color: #f5f2fa;
                padding: 14px;
                text-align: left;
                color: #3d1a5c;
                font-size: 11px;
                font-weight: 700;
                text-transform: uppercase;
                letter-spacing: 1.5px;
            }}
            .total-section {{
                text-align: right;
                margin-top: 30px;
            }}
            .total-amount-box {{
                display: inline-block;
                background: linear-gradient(135deg, #faf6ff 0%, #f5ecff 100%);
                border: 1.5px dashed #c084fc;
                border-radius: 18px;
                padding: 18px 28px;
                text-align: right;
                box-shadow: 0 4px 15px rgba(139, 92, 246, 0.04);
            }}
            .total-amount-label {{
                font-size: 11px;
                font-weight: 700;
                color: #8b5cf6;
                text-transform: uppercase;
                letter-spacing: 1.5px;
                margin-bottom: 6px;
            }}
            .total-amount {{
                font-size: 28px;
                font-weight: 900;
                color: #3d1a5c;
            }}
            .footer {{
                background: #faf8ff;
                padding: 35px;
                text-align: center;
                border-top: 1px solid #f3e8ff;
                font-size: 12px;
                color: #6b7280;
                line-height: 1.6;
            }}
            .footer a {{
                color: #8b5cf6;
                text-decoration: none;
                font-weight: 600;
            }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="top-bar"></div>
            <div class="header">
                <img class="logo" src="cid:logo" alt="KALINDI" style="margin-bottom: 12px;" />
                <p>Luxury Dry Fruits & Wellness</p>
            </div>
            <div class="content">
                <h2 class="greeting">Thank you for your order, {order.customer_name}!</h2>
                <p class="intro-text">We have successfully received your order. Our culinary specialists are selecting your premium handpicked items for delivery. Your receipt and shipping details are summarized below.</p>
                
                <div class="details-box">
                    <h3>Order Information</h3>
                    <table class="details-table">
                        <tr>
                            <td class="label-cell">Date & Time:</td>
                            <td class="val-cell">{order.created_at.strftime('%B %d, %Y %I:%M %p')}</td>
                        </tr>
                        <tr>
                            <td class="label-cell">Phone Number:</td>
                            <td class="val-cell">{order.customer_phone}</td>
                        </tr>
                        <tr>
                            <td class="label-cell">Payment Method:</td>
                            <td class="val-cell" style="font-weight: 700;">{payment_method_label}</td>
                        </tr>
                    </table>
                    
                    <div class="address-block">
                        <span class="address-title">Delivery Destination</span>
                        {shipping_address_html}
                    </div>
                </div>
                
                <div class="table-container">
                    <table class="items-table">
                        <thead>
                            <tr>
                                <th>Item Details</th>
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
                
                <!-- Financial Summary Breakdown -->
                <div style="margin-top: 25px; text-align: right; font-size: 14px; color: #4b5563; line-height: 1.8;">
                    <div style="display: inline-block; width: 100%; max-width: 240px;">
                        <table style="width: 100%; border-collapse: collapse;">
                            <tr>
                                <td style="text-align: left; padding: 4px 0; border: none; color: #6b7280; font-size: 14px;">Subtotal:</td>
                                <td style="text-align: right; padding: 4px 0; border: none; color: #1e072b; font-weight: 600; font-size: 14px;">₹{item_subtotal:.2f}</td>
                            </tr>
                            {discount_row}
                            <tr>
                                <td style="text-align: left; padding: 4px 0; border: none; color: #6b7280; font-size: 14px;">Delivery Charge:</td>
                                <td style="text-align: right; padding: 4px 0; border: none; color: #1e072b; font-weight: 600; font-size: 14px;">{ f"₹{shipping_fee:.2f}" if shipping_fee > 0 else "Free" }</td>
                            </tr>
                        </table>
                    </div>
                </div>
                
                <div class="total-section">
                    <div class="total-amount-box">
                        <div class="total-amount-label">{total_label}</div>
                        <div class="total-amount">₹{order.total_amount:.2f}</div>
                    </div>
                </div>
            </div>
            <div class="footer">
                <p>If you have any questions or require custom concierge services, please contact us at <a href="mailto:{settings.OWNER_EMAIL or 'support@kalindi.com'}">{settings.OWNER_EMAIL or 'support@kalindi.com'}</a></p>
                <p style="margin-top: 20px; font-size: 10px; opacity: 0.8;">&copy; 2026 Kalindi Luxury Dry Fruits & Wellness. All rights reserved.</p>
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
            <td style="padding: 12px; border-bottom: 1px solid #f3e8ff; text-align: left;">
                <strong style="color: #1e072b;">{item.product_name}</strong>
                <span style="display: block; color: #6b7280; font-size: 11px; margin-top: 2px;">Size: {item.weight}</span>
            </td>
            <td style="padding: 12px; border-bottom: 1px solid #f3e8ff; text-align: center; color: #1e072b;">{item.quantity}</td>
            <td style="padding: 12px; border-bottom: 1px solid #f3e8ff; text-align: right; color: #1e072b;">₹{item.price:.2f}</td>
            <td style="padding: 12px; border-bottom: 1px solid #f3e8ff; text-align: right; font-weight: bold; color: #3d1a5c;">₹{subtotal:.2f}</td>
        </tr>
        """
        
    shipping_address_html = order.shipping_address.replace('\n', '<br>')
    
    # Calculate financial summary details
    item_subtotal = sum(item.price * item.quantity for item in items)
    discount_amount = 0.0
    if order.discount_code == "FIRST7":
        discount_amount = round(item_subtotal * 0.07, 2)
    shipping_fee = max(0.0, order.total_amount - (item_subtotal - discount_amount))
    
    discount_row = ""
    if discount_amount > 0:
        discount_row = f"""
        <tr>
            <td style="text-align: left; padding: 2px 0; border: none; color: #10b981; font-size: 13px;">Discount ({order.discount_code}):</td>
            <td style="text-align: right; padding: 2px 0; border: none; color: #10b981; font-weight: bold; font-size: 13px;">-₹{discount_amount:.2f}</td>
        </tr>
        """
        
    return f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
        <style>
            body {{
                font-family: 'Outfit', 'Helvetica Neue', Helvetica, Arial, sans-serif;
                background-color: #faf5ff;
                margin: 0;
                padding: 20px;
                -webkit-font-smoothing: antialiased;
            }}
            .container {{
                max-width: 600px;
                margin: 0 auto;
                background: #ffffff;
                border-radius: 24px;
                overflow: hidden;
                box-shadow: 0 10px 30px rgba(61, 26, 92, 0.05);
                border: 1px solid rgba(139, 92, 246, 0.1);
            }}
            .header {{
                background: linear-gradient(135deg, #be185d 0%, #e91e8c 100%);
                padding: 30px 20px;
                color: #ffffff;
                text-align: center;
                border-bottom: 4px solid #D4AF37;
            }}
            .header h2 {{
                margin: 0;
                font-size: 22px;
                font-weight: 800;
                letter-spacing: 1px;
                color: #ffffff;
            }}
            .header p {{
                margin: 6px 0 0 0;
                font-size: 13px;
                color: #fbcfe8;
                font-weight: 600;
            }}
            .content {{
                padding: 30px;
            }}
            .details-box {{
                background: #faf6ff;
                padding: 20px;
                border-radius: 16px;
                margin-bottom: 25px;
                border: 1px solid rgba(139, 92, 246, 0.1);
            }}
            .details-title {{
                font-weight: 700;
                color: #3d1a5c;
                display: block;
                margin-bottom: 12px;
                font-size: 13px;
                text-transform: uppercase;
                letter-spacing: 1px;
                border-bottom: 1px solid rgba(139, 92, 246, 0.12);
                padding-bottom: 6px;
            }}
            .info-row {{
                margin-bottom: 8px;
                font-size: 14px;
                color: #4b5563;
            }}
            .info-row strong {{
                color: #1e072b;
                display: inline-block;
                width: 120px;
            }}
            table.items-table {{
                width: 100%;
                border-collapse: collapse;
                margin-bottom: 25px;
                border-radius: 12px;
                overflow: hidden;
                border: 1px solid #f3e8ff;
            }}
            table.items-table th {{
                background: #f5f2fa;
                padding: 12px;
                text-align: left;
                font-size: 11px;
                font-weight: 700;
                color: #3d1a5c;
                text-transform: uppercase;
                letter-spacing: 1px;
                border-bottom: 2px solid rgba(139, 92, 246, 0.1);
            }}
            table.items-table td {{
                padding: 12px;
                border-bottom: 1px solid #f3e8ff;
                font-size: 13px;
                color: #1e072b;
            }}
            .total {{
                text-align: right;
                font-size: 16px;
                font-weight: bold;
                color: #1e072b;
                margin-top: 20px;
            }}
            .total-amount {{
                font-size: 24px;
                color: #8b5cf6;
                font-weight: 900;
            }}
            .admin-note {{
                margin-top: 30px;
                text-align: center;
                font-size: 12px;
                color: #6b7280;
                background: #fdfdfd;
                padding: 12px;
                border-radius: 10px;
                border: 1px solid #eee;
            }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <img src="cid:logo" alt="KALINDI" style="max-height: 65px; width: auto; display: block; border: 0; outline: none; margin: 0 auto 12px auto; color: #D4AF37; font-size: 20px; font-weight: 900; letter-spacing: 4px; font-family: 'Outfit', sans-serif;" />
                <h2>New Order Alert!</h2>
                <p>Order #{order.id}</p>
            </div>
            <div class="content">
                <div class="details-box">
                    <span class="details-title">Customer & Shipping Details</span>
                    <div class="info-row"><strong>Name:</strong> {order.customer_name}</div>
                    <div class="info-row"><strong>Email:</strong> {order.customer_email}</div>
                    <div class="info-row"><strong>Phone:</strong> {order.customer_phone}</div>
                    <div class="info-row"><strong>Payment Method:</strong> {getattr(order, "payment_method", "online").upper()}</div>
                    <div class="info-row" style="margin-top: 10px;">
                        <strong>Shipping Address:</strong><br>
                        <span style="display: block; margin-top: 4px; padding: 10px; background: #ffffff; border: 1px solid rgba(139,92,246,0.08); border-radius: 8px; font-size: 13px; color: #4b5563;">
                            {shipping_address_html}
                        </span>
                    </div>
                </div>
                
                <h3 style="font-size: 13px; font-weight: 700; color: #3d1a5c; margin-bottom: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Ordered Items</h3>
                <table class="items-table">
                    <thead>
                        <tr>
                            <th>Item</th>
                            <th style="text-align: center;">Qty</th>
                            <th style="text-align: right;">Price</th>
                            <th style="text-align: right;">Subtotal</th>
                        </tr>
                    </thead>
                    <tbody>
                        {items_rows}
                    </tbody>
                </table>
                
                <!-- Financial Summary Breakdown -->
                <div style="margin-top: 15px; text-align: right; font-size: 13px; color: #4b5563; line-height: 1.6;">
                    <div style="display: inline-block; width: 100%; max-width: 220px;">
                        <table style="width: 100%; border-collapse: collapse;">
                            <tr>
                                <td style="text-align: left; padding: 2px 0; border: none; color: #6b7280; font-size: 13px;">Subtotal:</td>
                                <td style="text-align: right; padding: 2px 0; border: none; color: #1e072b; font-weight: bold; font-size: 13px;">₹{item_subtotal:.2f}</td>
                            </tr>
                            {discount_row}
                            <tr>
                                <td style="text-align: left; padding: 2px 0; border: none; color: #6b7280; font-size: 13px;">Delivery:</td>
                                <td style="text-align: right; padding: 2px 0; border: none; color: #1e072b; font-weight: bold; font-size: 13px;">{ f"₹{shipping_fee:.2f}" if shipping_fee > 0 else "Free" }</td>
                            </tr>
                        </table>
                    </div>
                </div>
                
                <div class="total">
                    Grand Total: <span class="total-amount">₹{order.total_amount:.2f}</span>
                </div>
                
                <div class="admin-note">
                    Please access the <a href="{settings.FRONTEND_URL}/admin" style="color: #8b5cf6; font-weight: bold; text-decoration: none;">Admin Dashboard</a> to manage processing and dispatch updates.
                </div>
            </div>
        </div>
    </body>
    </html>
    """

def send_order_notifications(order, items):
    """Background task handler to send confirmation and owner emails."""
    # 1. Send confirmation to the Customer
    customer_subject = "Thank you for your order - Kalindi Luxury"
    customer_html = generate_customer_email_html(order, items)
    send_html_email(customer_subject, customer_html, order.customer_email)
    
    # 2. Send notification to the Store Owner
    owner_subject = f"New Order Received! #{order.id} - ₹{order.total_amount:.2f}"
    owner_html = generate_admin_email_html(order, items)
    owner_email = settings.OWNER_EMAIL or settings.SMTP_USER
    if owner_email:
        send_html_email(owner_subject, owner_html, owner_email)
