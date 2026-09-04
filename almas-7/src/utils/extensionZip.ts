import JSZip from 'jszip';

export async function downloadChromeExtensionZip(): Promise<void> {
  const zip = new JSZip();

  // 1. Manifest
  const manifest = {
    manifest_version: 3,
    name: 'I-Dashboard Pro',
    version: '1.3.0',
    description: 'داشبورد شخصی‌سازی شده و مدیریت پیشرفته بوکمارک‌ها با طرح مدرن و تم‌های اختصاصی',
    permissions: ['bookmarks', 'storage'],
    action: {
      default_popup: 'index.html',
      default_title: 'I-Dashboard Pro'
    },
    chrome_url_overrides: {
      newtab: 'index.html'
    },
    icons: {
      '128': 'icon.png'
    }
  };

  zip.file('manifest.json', JSON.stringify(manifest, null, 2));

  // 2. Fetch index.html and assets or clone
  try {
    const htmlRes = await fetch('./index.html');
    if (htmlRes.ok) {
      let htmlText = await htmlRes.text();
      zip.file('index.html', htmlText);

      // Find assets linked in html
      const scriptMatches = htmlText.matchAll(/src="(\.\/assets\/[^"]+)"/g);
      for (const match of scriptMatches) {
        const assetUrl = match[1];
        try {
          const res = await fetch(assetUrl);
          if (res.ok) {
            const blob = await res.blob();
            const filename = assetUrl.replace('./', '');
            zip.file(filename, blob);
          }
        } catch (e) {
          console.warn('Could not fetch asset:', assetUrl, e);
        }
      }

      const cssMatches = htmlText.matchAll(/href="(\.\/assets\/[^"]+)"/g);
      for (const match of cssMatches) {
        const assetUrl = match[1];
        try {
          const res = await fetch(assetUrl);
          if (res.ok) {
            const blob = await res.blob();
            const filename = assetUrl.replace('./', '');
            zip.file(filename, blob);
          }
        } catch (e) {
          console.warn('Could not fetch asset:', assetUrl, e);
        }
      }
    }

    // 3. Icon
    try {
      const iconRes = await fetch('./icon.png');
      if (iconRes.ok) {
        const iconBlob = await iconRes.blob();
        zip.file('icon.png', iconBlob);
      }
    } catch {
      // Fallback
    }

    const content = await zip.generateAsync({ type: 'blob' });
    const downloadUrl = URL.createObjectURL(content);
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = 'I-Dashboard-Pro-Chrome-Extension.zip';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(downloadUrl);
  } catch (err) {
    console.error('Failed to create extension zip:', err);
  }
}
