/**
 * aiService.js
 *
 * Strategy:
 *  1. Keyword lookup  — instant, zero AI cost, 100% correct Amharic
 *  2. Intent classify — ask GPT to return ONE English intent key (it never writes Amharic)
 *  3. Template fill   — we assemble the Amharic response from pre-written strings
 *
 * GPT-4o's Amharic generation is unreliable, so we never let it generate Amharic text.
 */

const OpenAI = require('openai');
const hotelData = require('../config/amharicHotelData');

// ─── OpenAI client (lazy) ─────────────────────────────────────────────────────
let _openai = null;
const getOpenAI = () => {
    if (!_openai) _openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    return _openai;
};

// ─── Language detection ───────────────────────────────────────────────────────
function detectLanguage(text) {
    return /[\u1200-\u137F]/.test(text) ? 'amharic' : 'english';
}

// ─── Pre-written correct Amharic template bank ───────────────────────────────
// ALL Amharic text lives here. The AI never touches these strings.
const AMHARIC_TEMPLATES = {
    greeting:
        'ሰላም! እንኳን ወደ ሃይሌ ሪዞርት አዋሳ በደህና መጡ። 🌟\nእንዴት ልረዳዎት እችላለሁ? ስለ ክፍሎቻችን፣ ዋጋዎቻችን ወይም አገልግሎቶቻችን ማወቅ ይፈልጋሉ?',

    rooms:
        'እነዚህ ክፍሎቻችን ናቸው፦\n' +
        '• መደበኛ ክፍል — $150 በሌሊት (2 ሰው)\n' +
        '• ዴሉክስ ሲስተም — $250 በሌሊት (2 ሰው)\n' +
        '• ጁኒየር ስዊት — $380 በሌሊት (3 ሰው)\n' +
        '• ፕሬዚዳንሻል ስዊት — $800 በሌሊት (4 ሰው)\n\n' +
        'ስለ አንዱ ዝርዝር መረጃ ይፈልጋሉ?',

    room_standard:
        '🛏 መደበኛ ክፍል — $150 በሌሊት\n' +
        'ምቹ ክፍል ከከተማ እይታ ጋር፣ ለ2 ሰዎች ተስማሚ።\n' +
        'መገልገያዎች፦ ነጻ ዋይ ፋይ፣ ኤሲ፣ ቴሌቪዥን፣ ማቀዝቀዣ፣ ሳፌ።',

    room_deluxe:
        '🌊 ዴሉክስ ሲስተም — $250 በሌሊት\n' +
        'ሰፊ ክፍል ከሐይቅ እይታ ጋር፣ ለ2 ሰዎች ተስማሚ።\n' +
        'መገልገያዎች፦ ነጻ ዋይ ፋይ፣ ኤሲ፣ ቴሌቪዥን፣ ሚኒ ባር፣ በረንዳ፣ ሳፌ።',

    room_junior_suite:
        '✨ ጁኒየር ስዊት — $380 በሌሊት\n' +
        'የተለየ መኖሪያ ክፍል ያለው ስዊት፣ ለ3 ሰዎች ተስማሚ።\n' +
        'መገልገያዎች፦ ነጻ ዋይ ፋይ፣ ኤሲ፣ 2 ቴሌቪዥን፣ ሚኒ ባር፣ ጃኩዚ፣ በረንዳ።',

    room_presidential:
        '👑 ፕሬዚዳንሻል ስዊት — $800 በሌሊት\n' +
        'ከፍተኛ ቅንጦት ያለው ስዊት ለ4 ሰዎች።\n' +
        'መገልገያዎች፦ ነጻ ዋይ ፋይ፣ ኤሲ፣ 4 ቴሌቪዥን፣ ሙሉ ባር፣ የግል ጃኩዚ፣ እርከን፣ አገልጋይ።',

    checkin:
        '🕐 ቼክ-ኢን እና ቼክ-አውት ሰዓቶቻችን፦\n' +
        '• ቼክ-ኢን፦ ከምሽቱ 3:00 ሰዓት\n' +
        '• ቼክ-አውት፦ ጠዋት 11:00 ሰዓት\n\n' +
        'ቀደምት ቼክ-ኢን ወይም ዘግይቶ ቼክ-አውት ለማድረግ ቅድሚያ ጥያቄ ሊቀርብ ይችላል።',

    dining:
        '🍽 ምግብ ቤቶቻችን፦\n' +
        '• የሃይሌ ሬስቶራንት — ዓለም አቀፍ እና የኢትዮጵያ ምግቦች (ጠዋት 7:00 – ምሽት 11:00)\n' +
        '• የሐይቅ ዳር ባር እና ግሪል — ቀላል ምግቦችና ግሪል (ጠዋት 10:00 – ምሽት 10:00)\n' +
        '• የሎቢ ካፌ — ቡና፣ ሻይ እና ቀለል ያሉ ምግቦች (ጠዋት 6:00 – እኩለ ሌሊት 12:00)\n\n' +
        'ስለ አንዱ ተጨማሪ መረጃ ይፈልጋሉ?',

    pool:
        '🏊 አዎ! ኢንፊኒቲ ገንዳ አለን።\n' +
        'ከቤት ውጭ ያለው ገንዳ ከሐይቁ እይታ ጋር ይገኛል።\n' +
        'ሰዓት፦ ጠዋት 6:00 – ምሽት 10:00',

    spa:
        '💆 ሙሉ አገልግሎት ስፓ አለን።\n' +
        'ማሳጅ፣ ፊት ለፊት ህክምና እና የልምድ ሕክምናዎች ይገኛሉ።\n' +
        'ቀጠሮ ለማስያዝ ስልካችንን ይደውሉ፦ 096 331 3131',

    parking:
        '🚗 የፓርኪንግ አማራጮቻችን፦\n' +
        '• ቫሌት ፓርኪንግ — $35 በሌሊት\n' +
        '• ራስ-አገልግሎት ፓርኪንግ — $20 በሌሊት',

    wifi:
        '📶 አዎ! ነጻ ዋይ ፋይ በሁሉም ቦታ ይገኛል።\n' +
        'ከፍተኛ ፍጥነት ያለው ኢንተርኔት ለሁሉም እንግዶቻችን ነጻ ነው።',

    pets:
        '🐾 አዎ፣ የቤት እንስሳት ይፈቀዳሉ።\n' +
        '• ክፍያ፦ $50 በሌሊት\n' +
        '• ከፍተኛ ቁጥር፦ 2 እንስሳት በአንድ ክፍል',

    cancellation:
        '📋 የሰርዞ መውጣት ፖሊሲ፦\n' +
        'ቼክ-ኢን ከ48 ሰዓት በፊት ሰርዞ ቢወጡ ምንም ክፍያ የለም።\n' +
        'ከ48 ሰዓት በኋላ ወይም ሳይከፍሉ ቢቀሩ የአንድ ሌሊት ዋጋ ይከፈላል።',

    room_service:
        '🛎 አዎ! 24 ሰዓት የክፍል አገልግሎት አለን።\n' +
        'ምግብ፣ መጠጥ እና ሌሎች አገልግሎቶችን ወደ ክፍልዎ ማዘዝ ይችላሉ።',

    fitness:
        '💪 የአካል ብቃት ማዕከላችን 24 ሰዓት ክፍት ነው።\n' +
        'ዘመናዊ የአካል ብቃት መሳሪያዎች እና ዮጋ ክፍሎች ይገኛሉ።',

    location:
        '📍 አድራሻችን፦\n' +
        'ኤ8፣ አዋሳ፣ ኢትዮጵያ\n' +
        'ስልክ፦ 096 331 3131\n' +
        'ኢሜይል፦ info@haileresorthawassa.com',

    attractions:
        '🗺 በአቅራቢያ የሚገኙ ቦታዎች፦\n' +
        '• የአዋሳ ሐይቅ — 0.5 ኪሜ\n' +
        '• የአዋሳ ዓሳ ገበያ — 1 ኪሜ\n' +
        '• የአዋሳ ሚሊኒየም ፓርክ — 2 ኪሜ\n' +
        '• የሲዳማ ባህል መንደር — 5 ኪሜ',

    smoking:
        '🚭 ሆቴሉ ሙሉ ለሙሉ ማጨስ የተከለከለ ነው።\n' +
        'ማጨስ የሚፈቀደው በተወሰኑ የውጭ ቦታዎች ብቻ ነው።',

    contact:
        '📞 ለማናኛውም ጥያቄ ያግኙን፦\n' +
        '• ስልክ፦ 096 331 3131 / 096 331 3132\n' +
        '• ኢሜይል፦ info@haileresorthawassa.com\n' +
        '• ድረ-ገጽ፦ www.haileresorthawassa.com',

    amenities:
        '🏨 የሆቴሉ አገልግሎቶች፦\n' +
        '• ኢንፊኒቲ ገንዳ\n' +
        '• 24 ሰዓት የአካል ብቃት ማዕከል\n' +
        '• ሙሉ አገልግሎት ስፓ\n' +
        '• ቴኒስ ሜዳ\n' +
        '• 24 ሰዓት ኮንሲየርጅ\n' +
        '• የአውሮፕላን ማረፊያ ትራንስፖርት\n' +
        '• 24 ሰዓት የክፍል አገልግሎት',

    booking:
        '📅 ክፍል ለማስያዝ፦\n' +
        '• ስልክ፦ 096 331 3131\n' +
        '• ኢሜይል፦ info@haileresorthawassa.com\n' +
        '• ድረ-ገጽ፦ www.haileresorthawassa.com\n\n' +
        'ቡድናችን ዙሪያ ሁሉ አገልግሎት ዝግጁ ነው።',

    extra_bed:
        '🛏 ተጨማሪ አልጋ $30 በሌሊት ይገኛል።\n' +
        'ለቅድሚያ ማስያዝ ወይም ስለ ቤቱ ለተጨማሪ መረጃ ያግኙን።',

    unknown:
        'ይቅርታ፣ ጥያቄዎን ሙሉ በሙሉ አልተረዳሁም።\n' +
        'እባክዎ ቡድናችንን ቀጥታ ያነጋግሩ፦\n' +
        '• ስልክ፦ 096 331 3131\n' +
        '• ኢሜይል፦ info@haileresorthawassa.com',
};

// ─── Pre-written English template bank ───────────────────────────────────────
// Used as fallback when OpenAI is unavailable or quota is exhausted
const ENGLISH_TEMPLATES = {
    greeting:
        'Welcome to Haile Resort Hawassa! 🌟\nHow can I help you today? Ask about our rooms, dining, amenities, or anything else.',

    rooms:
        'We offer four room types:\n' +
        '• Standard Room — $150/night (2 guests)\n' +
        '• Deluxe Lake View — $250/night (2 guests)\n' +
        '• Junior Suite — $380/night (3 guests)\n' +
        '• Presidential Suite — $800/night (4 guests)\n\n' +
        'Would you like details on any specific room?',

    room_standard:
        '🛏 Standard Room — $150/night\n' +
        'Cozy room with city view, queen bed, for 2 guests.\n' +
        'Amenities: Free Wi-Fi, AC, TV, mini-fridge, safe.',

    room_deluxe:
        '🌊 Deluxe Lake View — $250/night\n' +
        'Spacious room with stunning lake panorama, king bed, for 2 guests.\n' +
        'Amenities: Free Wi-Fi, AC, TV, mini-bar, balcony, safe.',

    room_junior_suite:
        '✨ Junior Suite — $380/night\n' +
        'Elegant suite with separate living area and lake view, for 3 guests.\n' +
        'Amenities: Free Wi-Fi, AC, 2× TV, mini-bar, jacuzzi, balcony.',

    room_presidential:
        '👑 Presidential Suite — $800/night\n' +
        'Ultimate luxury with panoramic views and butler service, for 4 guests.\n' +
        'Amenities: Free Wi-Fi, AC, 4× TV, full bar, private jacuzzi, terrace, butler.',

    checkin:
        '🕐 Check-in & Check-out times:\n' +
        '• Check-in: 3:00 PM\n' +
        '• Check-out: 11:00 AM\n\n' +
        'Early check-in or late check-out can be requested — subject to availability.',

    dining:
        '🍽 Our dining options:\n' +
        '• Haile Restaurant — International & Ethiopian cuisine (7:00 AM – 11:00 PM)\n' +
        '• Lakeside Bar & Grill — Grills & casual food (10:00 AM – 10:00 PM)\n' +
        '• Lobby Café — Coffee, tea & light bites (6:00 AM – midnight)\n\n' +
        'Would you like more details on any of these?',

    pool:
        '🏊 Yes! We have an outdoor infinity pool.\n' +
        'The pool overlooks Lake Hawassa and is open daily 6:00 AM – 10:00 PM.',

    spa:
        '💆 We offer a full-service spa.\n' +
        'Services include massages, facials, and wellness treatments.\n' +
        'To book an appointment, call us at 096 331 3131.',

    parking:
        '🚗 Parking options:\n' +
        '• Valet parking — $35/night\n' +
        '• Self-parking — $20/night',

    wifi:
        '📶 Yes! Free high-speed Wi-Fi is available throughout the hotel for all guests.',

    pets:
        '🐾 Pets are welcome!\n' +
        '• Fee: $50/night\n' +
        '• Maximum: 2 pets per room',

    cancellation:
        '📋 Cancellation policy:\n' +
        'Free cancellation up to 48 hours before check-in.\n' +
        'Late cancellations or no-shows incur a one-night charge.',

    room_service:
        '🛎 Yes! Room service is available 24 hours a day.\n' +
        'Food, drinks, and other services can be ordered to your room.',

    fitness:
        '💪 Our fitness center is open 24/7.\n' +
        'State-of-the-art equipment, yoga classes, and tennis courts are available.',

    location:
        '📍 Our address:\n' +
        'A8, Hawassa, Ethiopia\n' +
        'Phone: 096 331 3131\n' +
        'Email: info@haileresorthawassa.com',

    attractions:
        '🗺 Nearby attractions:\n' +
        '• Lake Hawassa — 0.5 km\n' +
        '• Hawassa Fish Market — 1 km\n' +
        '• Hawassa Millennium Park — 2 km\n' +
        '• Sidama Cultural Village — 5 km',

    smoking:
        '🚭 Haile Resort is a non-smoking property.\n' +
        'Smoking is permitted only in designated outdoor areas.',

    contact:
        '📞 Contact us:\n' +
        '• Phone: 096 331 3131 / 096 331 3132\n' +
        '• Email: info@haileresorthawassa.com\n' +
        '• Website: www.haileresorthawassa.com',

    amenities:
        '🏨 Hotel amenities:\n' +
        '• Outdoor infinity pool\n' +
        '• 24/7 fitness center\n' +
        '• Full-service spa\n' +
        '• Tennis courts\n' +
        '• 24/7 concierge\n' +
        '• Airport shuttle\n' +
        '• 24/7 room service\n' +
        '• Free Wi-Fi throughout',

    booking:
        '📅 To book a room:\n' +
        '• Phone: 096 331 3131\n' +
        '• Email: info@haileresorthawassa.com\n' +
        '• Website: www.haileresorthawassa.com\n\n' +
        'Our team is available around the clock.',

    extra_bed:
        '🛏 Extra beds are available for $30/night.\n' +
        'Please request when booking or contact us directly.',

    unknown:
        'I\'m happy to help! I can answer questions about our rooms, dining, spa, pool, parking, check-in times, and more.\n\n' +
        'Or contact us directly:\n' +
        '• Phone: 096 331 3131\n' +
        '• Email: info@haileresorthawassa.com',
};


function keywordLookup(message) {
    const m = message.toLowerCase();

    // Greeting
    if (m.includes('ሰላም') || m.includes('ሃይ') || m.includes('ጤና')) return 'greeting';

    // Specific rooms
    if (m.includes('መደበኛ ክፍል') || m.includes('standard')) return 'room_standard';
    if (m.includes('ዴሉክስ') || m.includes('deluxe')) return 'room_deluxe';
    if (m.includes('ጁኒየር') || m.includes('junior')) return 'room_junior_suite';
    if (m.includes('ፕሬዚዳን') || m.includes('presidential')) return 'room_presidential';

    // General rooms / price
    if (m.includes('ክፍል') || m.includes('ስዊት') || m.includes('ዋጋ') || m.includes('ዋጋው')) return 'rooms';

    // Check-in / out
    if (
        m.includes('ቼክ') ||
        m.includes('መቼ') ||
        (m.includes('ሰዓት') && (m.includes('ጠዋት') || m.includes('ምሽት')))
    ) return 'checkin';

    // Dining
    if (
        m.includes('ምግብ') || m.includes('ሬስቶራንት') ||
        m.includes('ካፌ') || m.includes('ባር') || m.includes('ምሳ') ||
        m.includes('ቁርስ') || m.includes('እራት')
    ) return 'dining';

    // Pool
    if (m.includes('ገንዳ') || m.includes('መዋኛ') || m.includes('ዋና')) return 'pool';

    // Spa
    if (m.includes('ስፓ') || m.includes('ማሳጅ')) return 'spa';

    // Fitness
    if (m.includes('ፊትነስ') || m.includes('ስፖርት') || m.includes('አካል ብቃት')) return 'fitness';

    // Wi-Fi
    if (m.includes('ዋይፋይ') || m.includes('ዋይ ፋይ') || m.includes('ኢንተርኔት')) return 'wifi';

    // Parking
    if (m.includes('ፓርኪንግ') || m.includes('መኪና') || m.includes('ቫሌት') || m.includes('ማቆሚያ')) return 'parking';

    // Pets
    if (m.includes('እንስሳ') || m.includes('ውሻ') || m.includes('ድመት')) return 'pets';

    // Cancellation
    if (m.includes('ሰርዞ') || m.includes('ሰርዘ') || m.includes('ካንሰ') || m.includes('መሰረዝ')) return 'cancellation';

    // Room service
    if (m.includes('ክፍል አገልግሎት') || m.includes('ሩም ሰርቪስ') || m.includes('ምግብ ማዘዝ')) return 'room_service';

    // Location / address
    if (m.includes('አድራሻ') || m.includes('የት') || m.includes('ቦታ') || m.includes('እንዴት')) return 'location';

    // Attractions
    if (m.includes('መስህብ') || m.includes('ቱሪስት') || m.includes('ሐይቅ') || m.includes('ጎብኘ')) return 'attractions';

    // Amenities general
    if (m.includes('አገልግሎት') || m.includes('መገልገያ') || m.includes('ምን አለ')) return 'amenities';

    // Smoking
    if (m.includes('ማጨስ') || m.includes('ሲጋራ')) return 'smoking';

    // Booking
    if (m.includes('ማስያዝ') || m.includes('ቦታ') || m.includes('ቀጠሮ') || m.includes('ለማስያዝ')) return 'booking';

    // Extra bed
    if (m.includes('ተጨማሪ አልጋ') || m.includes('ተጨማሪ ሰው')) return 'extra_bed';

    // Contact
    if (m.includes('ስልክ') || m.includes('ኢሜይል') || m.includes('ያግኙ') || m.includes('ደውሉ')) return 'contact';

    return null;
}

// ─── English keyword lookup — maps quick-question button labels to intents ────
// Used when Amharic mode is active but the user clicks an English quick-question button
function keywordLookupEnglish(message) {
    const m = message.toLowerCase();

    if (m.includes('room') || m.includes('price') || m.includes('suite')) {
        if (m.includes('standard')) return 'room_standard';
        if (m.includes('deluxe')) return 'room_deluxe';
        if (m.includes('junior')) return 'room_junior_suite';
        if (m.includes('presidential')) return 'room_presidential';
        return 'rooms';
    }
    if (m.includes('check-in') || m.includes('check in') || m.includes('check-out') || m.includes('check out')) return 'checkin';
    if (m.includes('pool') || m.includes('spa')) return m.includes('spa') ? 'spa' : 'pool';
    if (m.includes('dining') || m.includes('restaurant') || m.includes('food') || m.includes('breakfast') || m.includes('cafe')) return 'dining';
    if (m.includes('pet')) return 'pets';
    if (m.includes('parking') || m.includes('valet')) return 'parking';
    if (m.includes('wifi') || m.includes('wi-fi') || m.includes('internet')) return 'wifi';
    if (m.includes('cancel')) return 'cancellation';
    if (m.includes('gym') || m.includes('fitness')) return 'fitness';
    if (m.includes('location') || m.includes('address') || m.includes('where')) return 'location';
    if (m.includes('attract') || m.includes('nearby') || m.includes('visit')) return 'attractions';
    if (m.includes('contact') || m.includes('phone') || m.includes('email')) return 'contact';
    if (m.includes('book') || m.includes('reserv')) return 'booking';
    if (m.includes('room service')) return 'room_service';
    if (m.includes('smok')) return 'smoking';
    if (m.includes('amenity') || m.includes('amenities') || m.includes('facilities')) return 'amenities';
    if (m.includes('hello') || m.includes('hi') || m.includes('hey')) return 'greeting';

    return null;
}

// ─── AI intent classifier (GPT detects intent, never writes Amharic) ──────────
const INTENT_KEYS = Object.keys(AMHARIC_TEMPLATES).filter((k) => k !== 'unknown');

async function classifyIntent(userMessage) {
    // If no OpenAI key or quota exhausted, fall back to unknown template
    if (!process.env.OPENAI_API_KEY) return 'unknown';

    const systemPrompt = `You are a hotel chatbot intent classifier.
The user is writing in Amharic. Identify ONLY which single topic they are asking about.
Reply with EXACTLY one of these keys and nothing else:
${INTENT_KEYS.join(', ')}

If none fits, reply: unknown`;

    try {
        const res = await getOpenAI().chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userMessage },
            ],
            temperature: 0,
            max_tokens: 20,
        });

        const intent = (res.choices[0]?.message?.content || '').trim().toLowerCase();
        return AMHARIC_TEMPLATES[intent] ? intent : 'unknown';
    } catch (err) {
        console.error('[aiService] classifyIntent error:', err?.message);
        return 'unknown';
    }
}

// ─── English response via GPT ─────────────────────────────────────────────────
function buildEnglishSystemPrompt() {
    return `You are a friendly assistant for Haile Resort Hawassa, Ethiopia.

Hotel info:
- Address: A8, Hawassa, Ethiopia | Phone: 096 331 3131 | Email: info@haileresorthawassa.com
- Rooms: Standard $150/night (2 guests), Deluxe $250/night (2 guests), Junior Suite $380/night (3 guests), Presidential Suite $800/night (4 guests)
- Dining: Haile Restaurant (7am–11pm), Lakeside Bar & Grill (10am–10pm), Lobby Café (6am–midnight)
- Amenities: Infinity pool, 24h gym, full-service spa, tennis courts, valet parking ($35/night), free Wi-Fi
- Check-in: 3:00 PM | Check-out: 11:00 AM
- Cancellation: Free up to 48h before check-in
- Pets: allowed, $50/night fee

Be concise (2–3 sentences), warm, and accurate. Never invent information.`;
}

async function getEnglishResponse(userMessage, chatHistory = []) {
    // Step 1: keyword lookup — free, instant, covers all common questions
    const intent = keywordLookupEnglish(userMessage);
    if (intent) {
        console.log(`[aiService] ✅ English keyword → ${intent}`);
        return ENGLISH_TEMPLATES[intent] || ENGLISH_TEMPLATES.unknown;
    }

    // Step 2: try OpenAI for truly open-ended questions
    if (!process.env.OPENAI_API_KEY) {
        return ENGLISH_TEMPLATES.unknown;
    }

    try {
        const messages = [
            { role: 'system', content: buildEnglishSystemPrompt() },
            ...chatHistory.slice(-8).map((m) => ({
                role: m.role === 'user' ? 'user' : 'assistant',
                content: m.content,
            })),
            { role: 'user', content: userMessage },
        ];

        const res = await getOpenAI().chat.completions.create({
            model: process.env.OPENAI_MODEL || 'gpt-4o',
            messages,
            temperature: 0.3,
            max_tokens: 300,
        });

        return res.choices[0]?.message?.content || ENGLISH_TEMPLATES.unknown;
    } catch (err) {
        console.error('[aiService] OpenAI error:', err?.message);
        return ENGLISH_TEMPLATES.unknown;
    }
}

// ─── Main entry point ─────────────────────────────────────────────────────────
/**
 * @param {string} userMessage
 * @param {Array}  chatHistory
 * @param {string} [forcedLanguage] - 'amharic' | 'english' — from frontend language toggle.
 *                                    If provided, overrides text-based detection so the
 *                                    Amharic UI always returns Amharic even when the user
 *                                    types English (e.g. quick-question buttons).
 */
async function getAIResponse(userMessage, chatHistory = [], forcedLanguage = null) {
    // Respect explicit language from frontend; fall back to text detection
    const language = forcedLanguage || detectLanguage(userMessage);

    console.log(`[aiService] getAIResponse lang="${language}" msg="${userMessage.slice(0, 40)}"`);

    if (language === 'english') {
        // English mode — GPT answers in English. keywordLookupEnglish is NOT used
        // here; it only exists for the Amharic path to handle quick-question labels.
        return await getEnglishResponse(userMessage, chatHistory);
    }

    // ── Amharic path — NEVER calls GPT to generate Amharic ──
    // Step 1: Amharic keyword lookup (Ethiopic script messages)
    const kwIntent = keywordLookup(userMessage);
    if (kwIntent) {
        console.log(`[aiService] ✅ Amharic keyword → ${kwIntent}`);
        return AMHARIC_TEMPLATES[kwIntent];
    }

    // Step 2: English keyword lookup — handles quick-question button labels
    // sent while the Amharic UI is active (e.g. "Room types & prices")
    const enIntent = keywordLookupEnglish(userMessage);
    if (enIntent) {
        console.log(`[aiService] ✅ English keyword (Amharic mode) → ${enIntent}`);
        return AMHARIC_TEMPLATES[enIntent];
    }

    // Step 3: AI classifies intent only (returns one key, never writes Amharic)
    console.log('[aiService] keyword miss → calling intent classifier');
    const intent = await classifyIntent(userMessage);
    console.log(`[aiService] ✅ classified → ${intent}`);
    return AMHARIC_TEMPLATES[intent];
}

// ─── Direct lookup (used as fallback in chatController) ──────────────────────
function getDirectAmharicResponse(message) {
    if (!message) return null;
    const intent = keywordLookup(message) || keywordLookupEnglish(message);
    return intent ? AMHARIC_TEMPLATES[intent] : null;
}

module.exports = { getAIResponse, detectLanguage, getDirectAmharicResponse };
