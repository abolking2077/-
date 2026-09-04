export function getPersianDate(date: Date = new Date()): {
  timeStr: string;
  englishTimeStr: string;
  dateStr: string;
  greetingStr: string;
  dayOfWeek: string;
} {
  // Format English Time (HH:MM:SS) in standard 24h Latin digits
  const pad = (n: number) => n.toString().padStart(2, '0');
  const englishTimeStr = `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;

  // Format Persian Time (HH:MM:SS)
  const timeStr = date.toLocaleTimeString('fa-IR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });

  // Format Persian Date
  const dateStr = date.toLocaleDateString('fa-IR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const dayOfWeek = date.toLocaleDateString('fa-IR', { weekday: 'long' });

  // Calculate appropriate Persian greeting based on hour
  const hour = date.getHours();
  let greetingStr = '✨ خوش آمدید';
  if (hour >= 5 && hour < 11) {
    greetingStr = '🌅 صبح بخیر';
  } else if (hour >= 11 && hour < 16) {
    greetingStr = '☀️ ظهر بخیر';
  } else if (hour >= 16 && hour < 20) {
    greetingStr = '🌇 عصر بخیر';
  } else {
    greetingStr = '🌙 شب بخیر';
  }

  return { timeStr, englishTimeStr, dateStr, greetingStr, dayOfWeek };
}

export function getDomain(url?: string): string {
  if (!url) return '';
  try {
    const clean = url.trim();
    const withProtocol = clean.startsWith('http://') || clean.startsWith('https://')
      ? clean
      : `https://${clean}`;
    const parsed = new URL(withProtocol);
    return parsed.hostname.replace(/^www\./, '');
  } catch {
    return url.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
  }
}

/**
 * High-definition Google Favicon API (128px) with transparent background
 */
export function getFaviconUrl(url?: string): string {
  if (!url) return '';
  const domain = getDomain(url);
  if (!domain) return '';
  return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=128`;
}

/**
 * Secondary high-res fallback via Unavatar or DuckDuckGo
 */
export function getSecondaryFaviconUrl(url?: string): string {
  if (!url) return '';
  const domain = getDomain(url);
  if (!domain) return '';
  return `https://unavatar.io/${encodeURIComponent(domain)}?fallback=https://icons.duckduckgo.com/ip3/${encodeURIComponent(domain)}.ico`;
}

/**
 * Fast client-side image brightness/luminance analyzer
 * Returns 'light' if background is bright (requires dark text)
 * Returns 'dark' if background is dark (requires white/light text)
 */
export function detectImageBrightness(imageSrc: string): Promise<'light' | 'dark'> {
  return new Promise((resolve) => {
    if (!imageSrc || !imageSrc.trim()) {
      resolve('dark');
      return;
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const sampleSize = 32;
        canvas.width = sampleSize;
        canvas.height = sampleSize;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve('dark');
          return;
        }

        ctx.drawImage(img, 0, 0, sampleSize, sampleSize);
        const imgData = ctx.getImageData(0, 0, sampleSize, sampleSize);
        const data = imgData.data;

        let totalLuminance = 0;
        let count = 0;

        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const a = data[i + 3];

          // Only consider non-transparent pixels
          if (a > 30) {
            // Standard ITU-R BT.709 perceived luminance
            const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
            totalLuminance += lum;
            count++;
          }
        }

        if (count === 0) {
          resolve('dark');
          return;
        }

        const avgLuminance = totalLuminance / count;
        // Threshold: 135 out of 255 (~53% brightness)
        resolve(avgLuminance > 135 ? 'light' : 'dark');
      } catch {
        // Fallback for CORS or canvas errors
        resolve('dark');
      }
    };

    img.onerror = () => {
      resolve('dark');
    };

    img.src = imageSrc;
  });
}

