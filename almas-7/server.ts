import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";

const app = express();
const PORT = 3000;

app.use(express.json());

// API health endpoint
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

// In-memory cache for TGJU and RSS to provide instant response and prevent rate-limiting
let tgjuCache: { data: any; timestamp: number } | null = null;
const rssCache = new Map<string, { data: any; timestamp: number }>();

/**
 * Helper to parse TGJU HTML and extract live market rows
 */
function parseTgjuHtml(html: string) {
  const rowRegex = /<tr[^>]*data-market-row="([^"]+)"[^>]*>([\s\S]*?)<\/tr>/gi;
  let match;
  const rawItems: Record<string, { name: string; price: string; change: string; changePercent: string; status: 'up' | 'down' | 'neutral'; time: string }> = {};

  while ((match = rowRegex.exec(html)) !== null) {
    const key = match[1];
    const content = match[2];
    
    // Price
    const priceMatch = content.match(/<td class="nf">([^<]+)<\/td>/) || match[0].match(/data-price="([^"]+)"/);
    // Change
    const changeMatch = content.match(/<span class="(low|high)">([^<]+)<\/span>/);
    const lowHighClass = changeMatch ? changeMatch[1] : '';
    const changeText = changeMatch ? changeMatch[2].trim() : '';
    
    // Time
    const timeMatch = content.match(/<td>(\d{1,2}:\d{1,2}(?::\d{1,2})?)<\/td>/);
    // Title
    const nameMatch = content.match(/<th>([^<]+)<\/th>/);

    if (priceMatch) {
      const priceVal = priceMatch[1].trim();
      let status: 'up' | 'down' | 'neutral' = 'neutral';
      if (lowHighClass === 'high') status = 'up';
      else if (lowHighClass === 'low') status = 'down';
      else if (changeText.startsWith('+') || changeText.includes('▲')) status = 'up';
      else if (changeText.startsWith('-') || changeText.includes('▼')) status = 'down';

      // Parse change percentage from format e.g. "(0.36%) 794000" or "0.5%"
      let percentStr = '';
      const percentMatch = changeText.match(/\(([\d.]+%?)\)/);
      if (percentMatch) {
        percentStr = percentMatch[1].endsWith('%') ? percentMatch[1] : `${percentMatch[1]}%`;
        if (status === 'up' && !percentStr.startsWith('+')) percentStr = `+${percentStr}`;
        if (status === 'down' && !percentStr.startsWith('-')) percentStr = `-${percentStr}`;
      } else if (changeText) {
        percentStr = changeText;
      } else {
        percentStr = '۰.۰٪';
      }

      rawItems[key] = {
        name: nameMatch ? nameMatch[1].trim() : key,
        price: priceVal,
        change: percentStr,
        changePercent: percentStr,
        status,
        time: timeMatch ? timeMatch[1].trim() : ''
      };
    }
  }

  // Helper to convert Rial to Toman string
  const rialToToman = (rialStr: string): string => {
    if (!rialStr) return '—';
    const num = parseInt(rialStr.replace(/,/g, ''), 10);
    if (isNaN(num)) return rialStr;
    return Math.round(num / 10).toLocaleString('en-US');
  };

  // Construct structured Gold & Coin list
  const goldItems = [
    {
      id: 'gold18',
      name: 'طلای ۱۸ عیار (گرم)',
      price: rawItems['geram18'] ? rialToToman(rawItems['geram18'].price) : '۴,۷۲۵,۰۰۰',
      unit: 'تومان',
      change: rawItems['geram18']?.change || '+۰.۴٪',
      status: rawItems['geram18']?.status || 'up',
      sub: rawItems['geram18']?.time ? `زمان TGJU: ${rawItems['geram18'].time}` : 'نرخ زنده اتحادیه طلا'
    },
    {
      id: 'mithqal',
      name: 'مثقال طلا (مظنه آبشده)',
      price: rawItems['mesghal'] ? rialToToman(rawItems['mesghal'].price) : '۲۰,۴۶۰,۰۰۰',
      unit: 'تومان',
      change: rawItems['mesghal']?.change || '+۰.۴٪',
      status: rawItems['mesghal']?.status || 'up',
      sub: rawItems['mesghal']?.time ? `زمان TGJU: ${rawItems['mesghal'].time}` : 'شاخص مرجع بازار طلا'
    },
    {
      id: 'coin_emami',
      name: 'سکه امامی (طرح جدید)',
      price: rawItems['sekee'] ? rialToToman(rawItems['sekee'].price) : '۵۴,۹۰۰,۰۰۰',
      unit: 'تومان',
      change: rawItems['sekee']?.change || '+۰.۵٪',
      status: rawItems['sekee']?.status || 'up',
      sub: rawItems['sekee']?.time ? `زمان TGJU: ${rawItems['sekee'].time}` : 'تمام بهار آزادی طرح امامی'
    },
    {
      id: 'coin_half',
      name: 'نیم سکه بهار آزادی',
      price: rawItems['nim'] ? rialToToman(rawItems['nim'].price) : '۲۹,۲۰۰,۰۰۰',
      unit: 'تومان',
      change: rawItems['nim']?.change || '+۰.۳٪',
      status: rawItems['nim']?.status || 'up',
      sub: rawItems['nim']?.time ? `زمان TGJU: ${rawItems['nim'].time}` : 'بازار رسمی سکه تهران'
    },
    {
      id: 'coin_quarter',
      name: 'ربع سکه بهار آزادی',
      price: rawItems['rob'] ? rialToToman(rawItems['rob'].price) : '۱۸,۷۰۰,۰۰۰',
      unit: 'تومان',
      change: rawItems['rob']?.change || '+۰.۲٪',
      status: rawItems['rob']?.status || 'up',
      sub: rawItems['rob']?.time ? `زمان TGJU: ${rawItems['rob'].time}` : 'قطع پرتقاضای بازار سکه'
    },
    {
      id: 'coin_bahar',
      name: 'سکه بهار آزادی (قدیم)',
      price: rawItems['bahar'] ? rialToToman(rawItems['bahar'].price) : '۴۹,۳۰۰,۰۰۰',
      unit: 'تومان',
      change: rawItems['bahar']?.change || '+۰.۴٪',
      status: rawItems['bahar']?.status || 'up',
      sub: 'طرح قدیم بهار آزادی'
    },
    {
      id: 'gold24',
      name: 'طلای ۲۴ عیار (گرم)',
      price: rawItems['geram24'] ? rialToToman(rawItems['geram24'].price) : '۶,۳۰۰,۰۰۰',
      unit: 'تومان',
      change: rawItems['geram24']?.change || '+۰.۴٪',
      status: rawItems['geram24']?.status || 'up',
      sub: 'شمش استاندارد ۹۹۹'
    },
    {
      id: 'coin_gerami',
      name: 'سکه گرمی بانک مرکزی',
      price: rawItems['gerami'] ? rialToToman(rawItems['gerami'].price) : '۸,۸۰۰,۰۰۰',
      unit: 'تومان',
      change: rawItems['gerami']?.change || '+۰.۱٪',
      status: rawItems['gerami']?.status || 'up',
      sub: 'سکه تک‌گرمی بسته‌بندی بانک مرکزی'
    },
    {
      id: 'ounce',
      name: 'انس جهانی طلا (XAU)',
      price: rawItems['ons'] ? rawItems['ons'].price : '۲,۶۸۸',
      unit: 'دلار',
      change: rawItems['ons']?.change || '+۰.۲٪',
      status: rawItems['ons']?.status || 'up',
      sub: 'معاملات بین‌المللی کامکس/نیویورک'
    },
    {
      id: 'silver_ounce',
      name: 'انس نقره جهانی',
      price: rawItems['silver']?.price || rawItems['silver_999']?.price || '۳۱.۴۵',
      unit: 'دلار',
      change: rawItems['silver']?.change || rawItems['silver_999']?.change || '-۰.۲٪',
      status: (rawItems['silver']?.status || rawItems['silver_999']?.status) || 'down',
      sub: 'بازار جهانی فلزات گرانبها'
    }
  ];

  // Construct structured Currency list
  const currencyItems = [
    {
      id: 'usd',
      name: '🇺🇸 دلار آمریکا (USD)',
      price: rawItems['price_dollar_rl'] ? rialToToman(rawItems['price_dollar_rl'].price) : '۶۹,۴۰۰',
      unit: 'تومان',
      change: rawItems['price_dollar_rl']?.change || '+۰.۳٪',
      status: rawItems['price_dollar_rl']?.status || 'up',
      sub: rawItems['price_dollar_rl']?.time ? `زمان TGJU: ${rawItems['price_dollar_rl'].time}` : 'اسکناس بازار آزاد تهران'
    },
    {
      id: 'eur',
      name: '🇪🇺 یورو اروپا (EUR)',
      price: rawItems['price_eur'] ? rialToToman(rawItems['price_eur'].price) : '۷۳,۶۵۰',
      unit: 'تومان',
      change: rawItems['price_eur']?.change || '+۰.۴٪',
      status: rawItems['price_eur']?.status || 'up',
      sub: rawItems['price_eur']?.time ? `زمان TGJU: ${rawItems['price_eur'].time}` : 'اسکناس نقدی بازار اروپا'
    },
    {
      id: 'aed',
      name: '🇦🇪 درهم امارات (AED)',
      price: rawItems['price_aed'] ? rialToToman(rawItems['price_aed'].price) : '۱۸,۹۲۰',
      unit: 'تومان',
      change: rawItems['price_aed']?.change || '+۰.۲٪',
      status: rawItems['price_aed']?.status || 'up',
      sub: rawItems['price_aed']?.time ? `زمان TGJU: ${rawItems['price_aed'].time}` : 'نرخ کلیدی حواله دبی'
    },
    {
      id: 'gbp',
      name: '🇬🇧 پوند انگلیس (GBP)',
      price: rawItems['price_gbp'] ? rialToToman(rawItems['price_gbp'].price) : '۸۸,۸۰۰',
      unit: 'تومان',
      change: rawItems['price_gbp']?.change || '+۰.۵٪',
      status: rawItems['price_gbp']?.status || 'up',
      sub: 'پوند بریتانیا بازار آزاد'
    },
    {
      id: 'try',
      name: '🇹🇷 لیر ترکیه (TRY)',
      price: rawItems['price_try'] ? rialToToman(rawItems['price_try'].price) : '۱,۹۹۰',
      unit: 'تومان',
      change: rawItems['price_try']?.change || '-۰.۱٪',
      status: rawItems['price_try']?.status || 'down',
      sub: 'اسکناس و حواله استانبول'
    },
    {
      id: 'cny',
      name: '🇨🇳 یوان چین (CNY)',
      price: rawItems['price_cny'] ? rialToToman(rawItems['price_cny'].price) : '۹,۵۸۰',
      unit: 'تومان',
      change: rawItems['price_cny']?.change || '+۰.۱٪',
      status: rawItems['price_cny']?.status || 'up',
      sub: 'نرخ بازرگانی و تجارت خارجی'
    },
    {
      id: 'cad',
      name: '🇨🇦 دلار کانادا (CAD)',
      price: rawItems['price_cad'] ? rialToToman(rawItems['price_cad'].price) : '۴۹,۵۰۰',
      unit: 'تومان',
      change: rawItems['price_cad']?.change || '+۰.۳٪',
      status: rawItems['price_cad']?.status || 'up',
      sub: 'حواله دانشجویی و تجاری کانادا'
    },
    {
      id: 'iqd',
      name: '🇮🇶 صد دینار عراق (IQD)',
      price: rawItems['price_iqd'] ? rialToToman(rawItems['price_iqd'].price) : '۵,۳۰۰',
      unit: 'تومان',
      change: rawItems['price_iqd']?.change || '۰.۰٪',
      status: rawItems['price_iqd']?.status || 'neutral',
      sub: 'زیارتی و حواله بغداد'
    },
    {
      id: 'usdt',
      name: '🟢 تتر دیجیتال (USDT)',
      price: rawItems['crypto-tether-irr'] ? rialToToman(rawItems['crypto-tether-irr'].price) : (rawItems['crypto-tether'] ? rialToToman(rawItems['crypto-tether'].price) : (rawItems['price_dollar_rl'] ? rialToToman(rawItems['price_dollar_rl'].price) : '۶۹,۵۵۰')),
      unit: 'تومان',
      change: rawItems['crypto-tether-irr']?.change || '+۰.۲٪',
      status: rawItems['crypto-tether-irr']?.status || 'up',
      sub: 'استیبل‌کوین دلار دیجیتال (USDT)'
    },
    {
      id: 'btc',
      name: '🪙 بیت‌کوین (BTC)',
      price: rawItems['crypto-bitcoin'] ? rawItems['crypto-bitcoin'].price : '۹۲,۵۰۰',
      unit: 'دلار',
      change: rawItems['crypto-bitcoin']?.change || '+۱.۸٪',
      status: rawItems['crypto-bitcoin']?.status || 'up',
      sub: 'پادشاه ارزهای دیجیتال جهان'
    }
  ];

  return {
    source: 'TGJU.org (شبکه اطلاع‌رسانی طلا، سکه و ارز)',
    sourceUrl: 'https://www.tgju.org/',
    fetchedAt: new Date().toISOString(),
    gold: goldItems,
    currency: currencyItems,
    rawCount: Object.keys(rawItems).length
  };
}

// API Routes
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

// Server-side bookmark sync storage (in-memory persistent per server session)
const cloudBookmarksStore = new Map<string, { bookmarks: any[]; updatedAt: string }>();

app.get("/api/sync/bookmarks", async (req, res) => {
  const userId = String(req.query.userId || req.query.email || '');
  if (!userId) {
    return res.status(400).json({ error: "userId or email is required" });
  }

  const stored = cloudBookmarksStore.get(userId);
  return res.json({
    success: true,
    bookmarks: stored?.bookmarks || null,
    updatedAt: stored?.updatedAt || null
  });
});

app.post("/api/sync/bookmarks", async (req, res) => {
  const { userId, email, bookmarks } = req.body || {};
  const userKey = userId || email;
  if (!userKey || !Array.isArray(bookmarks)) {
    return res.status(400).json({ error: "userKey and bookmarks array are required" });
  }

  const updatedAt = new Date().toISOString();
  cloudBookmarksStore.set(userKey, { bookmarks, updatedAt });

  return res.json({ success: true, count: bookmarks.length, updatedAt });
});

// TGJU Live Data Proxy & Scraper
app.get("/api/tgju", async (req, res) => {
  const now = Date.now();
  const force = req.query.force === 'true';

  // Return cached data if fresh (less than 25 seconds old) and not forced
  if (!force && tgjuCache && now - tgjuCache.timestamp < 25000) {
    return res.json({ ...tgjuCache.data, cached: true, cacheAgeMs: now - tgjuCache.timestamp });
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const tgjuResponse = await fetch("https://www.tgju.org/", {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        "Accept-Language": "fa,en-US;q=0.9,en;q=0.8",
        "Cache-Control": "no-cache",
        "Pragma": "no-cache"
      }
    });
    clearTimeout(timeout);

    if (!tgjuResponse.ok) {
      throw new Error(`TGJU returned HTTP ${tgjuResponse.status}`);
    }

    const html = await tgjuResponse.text();
    const parsedData = parseTgjuHtml(html);

    const resultData = {
      success: true,
      status: "ok",
      rates: {
        gold: parsedData.gold,
        currency: parsedData.currency
      },
      ...parsedData,
      cached: false
    };

    tgjuCache = {
      data: resultData,
      timestamp: now
    };

    return res.json(resultData);
  } catch (err: any) {
    // If cache exists even if old, return it with warning
    if (tgjuCache) {
      return res.json({
        ...tgjuCache.data,
        cached: true,
        stale: true,
        warning: "Direct fetch failed, serving last known TGJU data"
      });
    }

    // Otherwise return fallback default data
    const fallbackParsed = parseTgjuHtml("");
    return res.json({
      success: true,
      status: "ok",
      rates: {
        gold: fallbackParsed.gold,
        currency: fallbackParsed.currency
      },
      ...fallbackParsed,
      cached: false,
      stale: true,
      fallback: true,
      warning: "Could not fetch TGJU. Using baseline values."
    });
  }
});

// RSS Feed Proxy & Universal Parser
app.get("/api/rss", async (req, res) => {
  const url = req.query.url as string;
  if (!url) {
    return res.status(400).json({ error: "Missing 'url' query parameter" });
  }

  const now = Date.now();
  if (rssCache.has(url)) {
    const cached = rssCache.get(url)!;
    if (now - cached.timestamp < 60000) { // 1 min cache per feed
      return res.json(cached.data);
    }
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 9000);

    const feedRes = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; AlmasDashboardBot/5.0; +https://almas.app)",
        "Accept": "application/rss+xml, application/xml, text/xml, application/atom+xml, text/html, */*"
      }
    });
    clearTimeout(timeout);

    if (!feedRes.ok) {
      throw new Error(`Feed request returned status ${feedRes.status}`);
    }

    const xmlText = await feedRes.text();
    
    // Parse RSS 2.0 / Atom XML manually or via regex
    const feedTitleMatch = xmlText.match(/<channel[\s\S]*?<title>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/i) ||
                           xmlText.match(/<feed[\s\S]*?<title[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/i);
    const feedTitle = feedTitleMatch ? feedTitleMatch[1].trim() : 'منبع خبری';

    const items: Array<{
      title: string;
      link: string;
      pubDate: string;
      description: string;
      image: string;
      source: string;
    }> = [];

    // Extract item blocks (RSS <item> or Atom <entry>)
    const itemRegex = /<(?:item|entry)[\s\S]*?<\/(?:item|entry)>/gi;
    let itemMatch;

    while ((itemMatch = itemRegex.exec(xmlText)) !== null && items.length < 15) {
      const block = itemMatch[0];

      // Title
      const titleMatch = block.match(/<title[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/i);
      const rawTitle = titleMatch ? titleMatch[1].replace(/<[^>]+>/g, '').trim() : 'بدون عنوان';

      // Link
      let link = '#';
      const linkTagMatch = block.match(/<link[^>]*href="([^"]+)"/i) || block.match(/<link[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/link>/i);
      if (linkTagMatch) {
        link = linkTagMatch[1].trim();
      }

      // PubDate
      const dateMatch = block.match(/<(?:pubDate|published|updated|dc:date)[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/(?:pubDate|published|updated|dc:date)>/i);
      const pubDate = dateMatch ? dateMatch[1].trim() : new Date().toISOString();

      // Description / Content
      const descMatch = block.match(/<(?:description|summary|content)[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/(?:description|summary|content)>/i);
      const rawDesc = descMatch ? descMatch[1].trim() : '';

      // Image Extraction: enclosure / media:content / media:thumbnail / <img> in description
      let image = '';
      const encMatch = block.match(/<enclosure[^>]*url="([^"]+)"/i) ||
                       block.match(/<media:content[^>]*url="([^"]+)"/i) ||
                       block.match(/<media:thumbnail[^>]*url="([^"]+)"/i);
      if (encMatch) {
        image = encMatch[1];
      } else if (rawDesc) {
        const imgMatch = rawDesc.match(/<img[^>]+src=["']([^"']+)["']/i);
        if (imgMatch) {
          image = imgMatch[1];
        }
      }

      if (!image) {
        image = 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=300&q=80';
      }

      // Clean HTML tags and entities from title & description
      const cleanTitle = rawTitle.replace(/&nbsp;/g, ' ').replace(/&#8211;/g, '-').replace(/&amp;/g, '&').trim();
      const cleanDesc = rawDesc.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').slice(0, 160).trim();

      if (cleanTitle) {
        items.push({
          title: cleanTitle,
          link,
          pubDate,
          description: cleanDesc,
          image,
          source: feedTitle
        });
      }
    }

    const result = {
      success: true,
      status: "ok",
      title: feedTitle,
      feed: {
        title: feedTitle,
        url
      },
      items
    };

    rssCache.set(url, { data: result, timestamp: now });
    return res.json(result);
  } catch (err: any) {
    return res.status(500).json({ success: false, error: "Failed to fetch RSS feed", message: err.message });
  }
});

async function startServer() {
  // Directly serve style.css as raw text/css so <link rel="stylesheet"> never receives Vite's JS module wrapper
  app.get('/style.css', (req, res) => {
    res.type('text/css');
    res.sendFile(path.join(process.cwd(), 'style.css'));
  });

  // In development, hook up Vite middleware
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
