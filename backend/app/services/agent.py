import httpx
import asyncio
import json
from sqlalchemy.orm import Session
from ..models import Product
from ..config import settings
import logging


logger = logging.getLogger("uvicorn.error")

SYSTEM_PROMPT_TEMPLATE = """You are the Kalindi Personal Shopper, a sophisticated, professional, and highly knowledgeable advisor for Kalindi - a premium luxury dry fruit, nut, and seed brand.
Our brand represents pure, uncompromising quality, wellness, and luxury. Your speech is elegant, precise, helpful, and beautifully formatted using markdown. Do not use conversational emojis or AI-like clichés.
Write in standard sentence case (do not output entire paragraphs or responses in all-uppercase/block capitals).

{user_memory_context}

Here is the exact Product Catalog from our inventory database. Every product has multiple weight options (250g, 500g, 1000g/1kg) and prices:
{product_catalog}

RULES & BEHAVIOR:
1. CUSTOMER SHOPPING ASSISTANT:
   - If the user asks about buying or exploring a dry fruit (like almonds, pistachios, cashews, dates, figs, raisins, makhana, or gift boxes), recommend the specific product from the catalog.
   - Explain the pricing options clearly based on the weight options available for that product.
   - Compare products with high expertise (e.g. Saffron Pistachios vs California Almonds).
   - IMPORTANT: To render an interactive product shopping card inline inside the chat, append `[PRODUCT_ID: <id>]` on a new line immediately following the product recommendation. Do NOT put it inside a code block. You can append multiple product IDs if you recommend multiple items.
     Example:
     "I highly recommend our Premium California Almonds. They are crispy, highly nutritious, and excellent for snacking.
     [PRODUCT_ID: 1]"

2. WELLNESS & HEALTH ADVICE:
   - Provide scientific yet accessible health benefits (e.g. Almonds are rich in Vitamin E and good for brain health, Makhana is low-calorie and excellent for weight loss, Saffron Pistachios aid immunity).
   - Offer customized wellness prescriptions based on their goals (e.g. skin radiance, heart health, energy, muscle building).
   - If asked for a custom dose (e.g. "I eat 10 almonds and 3 figs, is that good?"), calculate a nutritional overview and suggest adding Saffron Pistachios or Cashews to round out their intake.

3. GIFT HAMPER CONFIGURATION:
   - If the user is looking for a gift, direct them to our 'Kalindi Assorted Gift Box' (Product ID: 8).
   - You can also suggest configuring a custom hamper box by picking products they like. Recommend a bundle of products and output their IDs!

4. TONE, STYLE AND STRICT FORMATTING:
   - Keep answers elegantly formatted, using bullet points, short paragraphs, and rich descriptions.
   - Use clean, premium, and sophisticated phrasing without cutesy emojis.
   - MANDATORY: Put every markdown header (e.g. `### Key Benefits:` or `### Comparison:`) on its own separate line with empty lines before and after it.
   - MANDATORY: Put bullet points (`* ` or `- `) on separate lines with empty lines between logical sections.
   - MANDATORY: Never run headings or paragraphs together in a single continuous line. Add double newlines (blank lines) between paragraphs and before/after headings.
   - MANDATORY: Keep paragraphs short (2-3 sentences max) to ensure high readability and elegant layout.

5. REORDERING PREVIOUS ORDERS:
   - If the user asks to "reorder", "add my last order to cart", or "add items from my previous order", check if the user is logged in (indicated by USER AUTHENTICATION STATUS context being present).
   - If they are logged in, confirm that you are adding the items from their last order, and append `[ADD_LAST_ORDER_TO_CART]` on a new line.
   - If they are NOT logged in, tell them they must first log in using the sidebar to retrieve their order history and automatically reorder.
"""

def get_product_catalog_string(db: Session) -> str:
    """Load active products from database and format as string for the system prompt."""
    products = db.query(Product).filter(Product.is_active == True).all()
    if not products:
        return "No products found in the database catalog."
        
    catalog_lines = []
    for p in products:
        prices = []
        if p.price_250g is not None:
            prices.append(f"250g: ₹{p.price_250g}")
        if p.price_500g is not None:
            prices.append(f"500g: ₹{p.price_500g}")
        if p.price_1000g is not None:
            prices.append(f"1kg: ₹{p.price_1000g}")
            
        prices_str = ", ".join(prices)
        catalog_lines.append(
            f"- [ID: {p.id}] {p.name}: {p.description or 'Premium dry fruit.'} | Tag: {p.tag or 'None'} | Prices: {prices_str} | Rating: {p.rating} ({p.reviews} reviews)"
        )
    return "\n".join(catalog_lines)

def run_local_fallback_agent(query: str, db: Session, user_id: int = None) -> str:
    """Wrapper that resolves user memory and prepends it to the fallback agent response."""
    query_lower = query.lower()
    if any(x in query_lower for x in ["reorder", "last order", "previous order", "add last", "add previous"]):
        if user_id:
            from ..models import User, Order
            user = db.query(User).filter(User.id == user_id).first()
            if user:
                # Check if there is a previous order
                last_order = db.query(Order).filter(Order.customer_email == user.email).order_by(Order.created_at.desc()).first()
                if last_order:
                    return f"""### Reordering Your Last Selection
I am pleased to assist you with this. I have retrieved your most recent order details (Order #{last_order.id}) and am automatically adding all of its items back to your luxury cart now.

[ADD_LAST_ORDER_TO_CART]"""
                else:
                    return "I searched your order history but could not find any previous orders associated with your account. You can start a new selection by asking about our California Almonds, Saffron Pistachios, or Gift Boxes!"
        else:
            return "To reorder or add items from your previous orders to the cart, please log in to your Kalindi account first using the button in the sidebar."

    memory_prefix = ""
    if user_id:
        from ..models import UserMemory
        goal = db.query(UserMemory).filter(UserMemory.user_id == user_id, UserMemory.key == "goal").first()
        taste = db.query(UserMemory).filter(UserMemory.user_id == user_id, UserMemory.key == "taste").first()
        
        if goal:
            goal_val = goal.value
            if goal_val.lower() == "radiant glow":
                goal_val = "Radiant Glow & Skin Wellness"
            memory_prefix = f"Since your primary goal is {goal_val}, I have carefully curated these suggestions to support your health journey.\n\n"
        elif taste:
            memory_prefix = f"Since your favorite taste is {taste.value}, I have tailored my recommendations to your palate.\n\n"
            
    base_reply = _run_local_fallback_agent(query, db)
    return memory_prefix + base_reply

def _run_local_fallback_agent(query: str, db: Session) -> str:
    """
    Intelligent keyword-matching fallback agent when GROQ_API_KEY is not set or API call fails.
    Maintains the luxury brand voice and injects the proper [PRODUCT_ID: X] tags without cutesy emojis.
    """
    query_lower = query.lower()
    
    # Load products to get real pricing/details from DB
    products = db.query(Product).filter(Product.is_active == True).all()
    prod_map = {p.id: p for p in products}
    
    # 1. ALMONDS
    if "almond" in query_lower:
        p = prod_map.get(1)
        prices = f"₹{p.price_250g} for 250g, ₹{p.price_500g} for 500g, or ₹{p.price_1000g} for 1kg" if p else "₹279 for 250g, ₹499 for 500g, or ₹949 for 1kg"
        return f"""### Premium California Almonds
Our select **California Almonds** are sweet, handpicked, exceptionally crispy, and highly nutritious.

**Key Wellness Benefits:**
* **Brain & Memory Support**: Source of riboflavin and L-carnitine.
* **Skin Radiance**: Rich in Vitamin E antioxidants.
* **Balanced Nutrition**: High in dietary fiber and essential healthy fats.

**Pricing Options:**
* Available from **{prices}**. 

I highly recommend adding them to your cart. You may select your preferred weight option and add it directly:
[PRODUCT_ID: 1]"""

    # 2. PISTACHIOS
    elif "pistachio" in query_lower or "pista" in query_lower:
        p = prod_map.get(2)
        prices = f"₹{p.price_250g} for 250g, ₹{p.price_500g} for 500g, or ₹{p.price_1000g} for 1kg" if p else "₹399 for 250g, ₹699 for 500g, or ₹1299 for 1kg"
        return f"""### Saffron Pistachios
Our signature **Saffron Pistachios** are roasted to crispy perfection and delicately seasoned with handpicked premium Kashmiri saffron.

**Key Wellness Benefits:**
* **Cardiovascular Support**: High in heart-healthy monounsaturated fats.
* **Immunity & Vitality**: Seasoned with real saffron, a natural mood enhancer and antioxidant.
* **Eye Health**: High in lutein and zeaxanthin.

**Pricing Options:**
* Sourced fresh for **{prices}**.

Experience the signature flavor by adding it to your order:
[PRODUCT_ID: 2]"""

    # 3. CASHEWS
    elif "cashew" in query_lower or "kaju" in query_lower:
        p = prod_map.get(3)
        prices = f"₹{p.price_250g} for 250g, ₹{p.price_500g} for 500g, or ₹{p.price_1000g} for 1kg" if p else "₹299 for 250g, ₹549 for 500g, or ₹999 for 1kg"
        return f"""### Royal Cashews W320
Our premium **Royal Cashews** are whole, jumbo-sized (W320 grade), boasting a rich, buttery, and smooth texture.

**Key Wellness Benefits:**
* **Cellular Energy**: Excellent source of copper, magnesium, and healthy fats.
* **Bone Health**: Rich in magnesium to support bone structure.
* **Heart Wellness**: Monounsaturated fats that support healthy cholesterol.

**Pricing Options:**
* Sourced to our highest standard at **{prices}**.

You may select your size and add it directly:
[PRODUCT_ID: 3]"""

    # 4. DATES
    elif "date" in query_lower or "khajur" in query_lower:
        p = prod_map.get(4)
        prices = f"₹{p.price_250g} for 250g, ₹{p.price_500g} for 500g, or ₹{p.price_1000g} for 1kg" if p else "₹289 for 250g, ₹449 for 500g, or ₹849 for 1kg"
        return f"""### Medjool Dates
Our premium **Medjool Dates** are soft, moist, and naturally sweet with a deep caramel-like flavor. Sourced fresh from world-class growers.

**Key Wellness Benefits:**
* **Natural Sweetener**: An exceptional replacement for refined sugars.
* **Digestive Health**: Rich in dietary fiber to support gut wellness.
* **Physical Energy**: Packed with essential potassium to aid post-workout recovery.

**Pricing Options:**
* Experience this natural indulgence at **{prices}**.

Select your weight option below to add to your order:
[PRODUCT_ID: 4]"""

    # 5. FIGS
    elif "fig" in query_lower or "anjeer" in query_lower:
        p = prod_map.get(5)
        prices = f"₹{p.price_250g} for 250g, ₹{p.price_500g} for 500g, or ₹{p.price_1000g} for 1kg" if p else "₹379 for 250g, ₹699 for 500g, or ₹1299 for 1kg"
        return f"""### Turkish Figs
Our **Turkish Figs** are sun-dried, plump, and imported directly from Izmir, Turkey, known globally for yielding the absolute finest figs.

**Key Wellness Benefits:**
* **Iron Abundance**: Essential for energy and fighting fatigue.
* **Bone Density**: Sourced with essential calcium and magnesium.
* **Gut Health**: High in soluble fibers for comfortable digestion.

**Pricing Options:**
* Direct boutique pricing at **{prices}**.

You may review the available sizes below:
[PRODUCT_ID: 5]"""

    # 6. RAISINS
    elif "raisin" in query_lower or "kismis" in query_lower:
        p = prod_map.get(6)
        prices = f"₹{p.price_250g} for 250g, ₹{p.price_500g} for 500g, or ₹{p.price_1000g} for 1kg" if p else "₹169 for 250g, ₹299 for 500g, or ₹549 for 1kg"
        return f"""### Jumbo Raisins
Our green **Jumbo Raisins** are naturally sun-dried to lock in their natural sweetness, vitamins, and antioxidants.

**Key Wellness Benefits:**
* **Antioxidant Protection**: High polyphenol content.
* **Quick Energy**: Natural sugars ideal for active snacks.
* **Oral Health**: Sourced with organic acids that suppress dental bacteria.

**Pricing Options:**
* Sourced fresh in value packaging at **{prices}**.

Add this sweet, healthy snack to your order below:
[PRODUCT_ID: 6]"""

    # 7. FOX NUTS / MAKHANA
    elif "fox" in query_lower or "makhana" in query_lower:
        p = prod_map.get(7)
        prices = f"₹{p.price_250g} for 250g, ₹{p.price_500g} for 500g" if p else "₹249 for 250g, or ₹449 for 500g"
        return f"""### Fox Nuts (Makhana)
Lightly roasted to a satisfying crisp, our **Fox Nuts (Makhana)** serve as an exceptional low-calorie wellness snack.

**Key Wellness Benefits:**
* **Calorie-Conscious**: Low glycemic index, gluten-free, and high in fiber.
* **Collagen Support**: Sourced with amino acids that support skin elasticity.
* **Detoxification**: Low in sodium and rich in potassium.

**Pricing Options:**
* Sourced fresh and packed for **{prices}**.

Configure your bag below:
[PRODUCT_ID: 7]"""

    # 8. GIFT HAMPERS
    elif "gift" in query_lower or "box" in query_lower or "hamper" in query_lower or "present" in query_lower:
        p = prod_map.get(8)
        price = f"₹{p.price_1000g}" if p else "₹1299"
        return f"""### The Kalindi Luxury Assorted Gift Box
Perfect for corporate greetings, festive events, or celebrating family. The **Kalindi Assorted Gift Box** is a designer rigid box containing a handpicked selection of our four flagship products: Saffron Pistachios, California Almonds, Royal Cashews, and Sun-Dried Figs.

**Why Choose Kalindi Gifting:**
* **Rigid Designer Box**: Rigid lavender and gold presentation box.
* **Personalized Cards**: Includes a gold-foil envelope with custom messages.
* **Bespoke Quality**: Selected only from our highest product grades.

**Pricing:**
* This premium selection (1kg box) is priced at **{price}**.

Add this stunning gift box directly to your order:
[PRODUCT_ID: 8]"""

    # 9. GENERAL BRAND INFO OR GENERAL GREETING
    else:
        return """### Welcome to Kalindi
I am your **Personal Shopper**, dedicated to helping you select our finest dry fruits, nuts, and organic seeds sourced from premium global orchards.

*(Note: To activate my fully dynamic GPT-powered chat capabilities, please configure the `GROQ_API_KEY` in the backend environment. For now, I am operating in a high-touch local concierge mode!)*

**How may I assist you today?**
1. **Explore Flagship Products**: Ask about *Almonds*, *Saffron Pistachios*, *Cashews*, or *Medjool Dates*.
2. **Luxury Gifting**: Ask about *Gifting Packs* or *Gift Hampers* to explore our custom assortments.
3. **Wellness Advice**: Learn how dry fruits support health, or try our **Wellness Evaluation** tab to get a personalized recommendation!

To give you a preview of our collection, here is a showcase of our finest items:
[PRODUCT_ID: 1]
[PRODUCT_ID: 2]
[PRODUCT_ID: 3]"""

async def generate_chat_response(messages: list, db: Session, user_id: int = None) -> str:
    """Generate a chat response using Groq API (llama-3.3-70b-versatile) with dynamic catalog, user memory, and fallback."""
    # Build user memory context if user is logged in
    user_memory_context = ""
    if user_id:
        from ..models import User, UserMemory
        user = db.query(User).filter(User.id == user_id).first()
        if user:
            user_memory_context = f"USER AUTHENTICATION STATUS: Logged In as {user.name} ({user.email})\n"
            memories = db.query(UserMemory).filter(UserMemory.user_id == user_id).all()
            if memories:
                memories_lines = []
                for m in memories:
                    val = m.value
                    if m.key == "goal" and val.lower() == "radiant glow":
                        val = "Radiant Glow & Skin Wellness"
                    memories_lines.append(f"- {m.key.replace('_', ' ').title()}: {val}")
                user_memory_context += "USER PERSONAL MEMORY:\n" + "\n".join(memories_lines) + "\nPersonalize your luxury suggestions using this context. Never ask redundant questions."

    # 1. Fetch dynamic product catalog from DB
    try:
        catalog_str = get_product_catalog_string(db)
        system_prompt = SYSTEM_PROMPT_TEMPLATE.format(
            product_catalog=catalog_str,
            user_memory_context=user_memory_context
        )
    except Exception as e:
        logger.error(f"Error loading catalog for prompt: {e}")
        catalog_str = "Error loading product data."
        system_prompt = SYSTEM_PROMPT_TEMPLATE.format(
            product_catalog=catalog_str,
            user_memory_context=user_memory_context
        )
        
    # 2. Check if GROQ_API_KEY is configured
    api_key = settings.GROQ_API_KEY
    if not api_key:
        logger.warning("GROQ_API_KEY is not set in Settings. Falling back to local concierge mode.")
        # Extract the user's latest query
        latest_query = "hello"
        for m in reversed(messages):
            if m.get("role") == "user":
                latest_query = m.get("content", "")
                break
        return run_local_fallback_agent(latest_query, db, user_id)

    # 3. Call Groq API via httpx
    try:
        # Prepare messages
        api_messages = [{"role": "system", "content": system_prompt}]
        
        # Append recent history (limit to last 8 messages for context safety)
        recent_history = messages[-8:]
        for m in recent_history:
            api_messages.append({
                "role": m.get("role"),
                "content": m.get("content")
            })
            
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.post(
                "https://api.groq.com/openai/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": "llama-3.3-70b-versatile",  # High quality + lightning fast
                    "messages": api_messages,
                    "temperature": 0.5,
                    "max_tokens": 1024
                }
            )
            
            if response.status_code == 200:
                data = response.json()
                reply = data["choices"][0]["message"]["content"]
                return reply
            else:
                logger.error(f"Groq API returned error status {response.status_code}: {response.text}")
                # Fallback on API failure
                latest_query = messages[-1].get("content", "") if messages else "hello"
                return run_local_fallback_agent(latest_query, db, user_id)
                
    except Exception as e:
        logger.error(f"Exception calling Groq API: {e}")
        latest_query = messages[-1].get("content", "") if messages else "hello"
        return run_local_fallback_agent(latest_query, db, user_id)



async def generate_chat_stream_response(messages: list, db: Session, user_id: int = None):
    """Async generator yielding chunks of AI response for streaming, with user memory personalization."""
    # Build user memory context if user is logged in
    user_memory_context = ""
    if user_id:
        from ..models import User, UserMemory
        user = db.query(User).filter(User.id == user_id).first()
        if user:
            user_memory_context = f"USER AUTHENTICATION STATUS: Logged In as {user.name} ({user.email})\n"
            memories = db.query(UserMemory).filter(UserMemory.user_id == user_id).all()
            if memories:
                memories_lines = []
                for m in memories:
                    val = m.value
                    if m.key == "goal" and val.lower() == "radiant glow":
                        val = "Radiant Glow & Skin Wellness"
                    memories_lines.append(f"- {m.key.replace('_', ' ').title()}: {val}")
                user_memory_context += "USER PERSONAL MEMORY:\n" + "\n".join(memories_lines) + "\nPersonalize your luxury suggestions using this context. Never ask redundant questions."

    # 1. Fetch dynamic product catalog from DB
    try:
        catalog_str = get_product_catalog_string(db)
        system_prompt = SYSTEM_PROMPT_TEMPLATE.format(
            product_catalog=catalog_str,
            user_memory_context=user_memory_context
        )
    except Exception as e:
        logger.error(f"Error loading catalog for prompt: {e}")
        catalog_str = "Error loading product data."
        system_prompt = SYSTEM_PROMPT_TEMPLATE.format(
            product_catalog=catalog_str,
            user_memory_context=user_memory_context
        )
        
    # 2. Check if GROQ_API_KEY is configured
    api_key = settings.GROQ_API_KEY
    if not api_key:
        # Fallback simulation
        latest_query = "hello"
        for m in reversed(messages):
            if m.get("role") == "user":
                latest_query = m.get("content", "")
                break
        fallback_text = run_local_fallback_agent(latest_query, db, user_id)
        # Yield in chunks of 15 characters to simulate typing and preserve all spaces/newlines
        chunk_size = 15
        for i in range(0, len(fallback_text), chunk_size):
            chunk = fallback_text[i:i+chunk_size]
            yield f"data: {json.dumps({'content': chunk})}\n\n"
            await asyncio.sleep(0.02)
        return

    # 3. Call Groq API in streaming mode via httpx
    try:
        api_messages = [{"role": "system", "content": system_prompt}]
        recent_history = messages[-8:]
        for m in recent_history:
            api_messages.append({
                "role": m.get("role"),
                "content": m.get("content")
            })
            
        async with httpx.AsyncClient(timeout=30.0) as client:
            async with client.stream(
                "POST",
                "https://api.groq.com/openai/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": "llama-3.3-70b-versatile",
                    "messages": api_messages,
                    "temperature": 0.5,
                    "max_tokens": 1024,
                    "stream": True
                }
            ) as r:
                if r.status_code != 200:
                    logger.error(f"Groq API stream returned error status {r.status_code}")
                    fallback_text = run_local_fallback_agent(messages[-1].get("content", "") if messages else "hello", db, user_id)
                    chunk_size = 15
                    for i in range(0, len(fallback_text), chunk_size):
                        chunk = fallback_text[i:i+chunk_size]
                        yield f"data: {json.dumps({'content': chunk})}\n\n"
                        await asyncio.sleep(0.02)
                    return
                
                async for line in r.aiter_lines():
                    if line.startswith("data: "):
                        data_str = line[6:].strip()
                        if data_str == "[DONE]":
                            break
                        try:
                            data_json = json.loads(data_str)
                            delta = data_json["choices"][0]["delta"]
                            if "content" in delta:
                                yield f"data: {json.dumps({'content': delta['content']})}\n\n"
                        except Exception:
                            pass
                            
    except Exception as e:
        logger.error(f"Exception calling Groq API stream: {e}")
        fallback_text = run_local_fallback_agent(messages[-1].get("content", "") if messages else "hello", db, user_id)
        chunk_size = 15
        for i in range(0, len(fallback_text), chunk_size):
            chunk = fallback_text[i:i+chunk_size]
            yield f"data: {json.dumps({'content': chunk})}\n\n"
            await asyncio.sleep(0.02)
