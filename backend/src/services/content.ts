/**
 * Content Fetcher Service
 * Fetches and extracts readable content from URLs
 */

/**
 * Fetch and extract readable content from an article URL
 */
export async function fetchArticleContent(url: string): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Ghostwriter/1.0)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      signal: controller.signal
    });

    clearTimeout(timeout);

    if (!response.ok) {
      console.error(`Failed to fetch ${url}: ${response.status}`);
      return null;
    }

    const html = await response.text();
    
    // Extract readable content from HTML
    const content = extractReadableContent(html);
    
    // Limit content to ~2000 chars for context
    if (content.length > 2000) {
      return content.slice(0, 2000) + '...';
    }
    
    return content;
  } catch (error: any) {
    if (error.name === 'AbortError') {
      console.error(`Timeout fetching ${url}`);
    } else {
      console.error(`Error fetching ${url}:`, error.message);
    }
    return null;
  }
}

/**
 * Extract readable text content from HTML
 */
function extractReadableContent(html: string): string {
  // Remove scripts and styles
  let content = html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    .replace(/<nav\b[^<]*(?:(?!<\/nav>)<[^<]*)*<\/nav>/gi, '')
    .replace(/<header\b[^<]*(?:(?!<\/header>)<[^<]*)*<\/header>/gi, '')
    .replace(/<footer\b[^<]*(?:(?!<\/footer>)<[^<]*)*<\/footer>/gi, '');

  // Try to find article content
  const articleMatch = content.match(/<article[^>]*>([\s\S]*?)<\/article>/i);
  if (articleMatch) {
    content = articleMatch[1];
  } else {
    // Try main content
    const mainMatch = content.match(/<main[^>]*>([\s\S]*?)<\/main>/i);
    if (mainMatch) {
      content = mainMatch[1];
    }
  }

  // Extract text from paragraphs
  const paragraphs: string[] = [];
  const pRegex = /<p[^>]*>([\s\S]*?)<\/p>/gi;
  let match;
  while ((match = pRegex.exec(content)) !== null) {
    const text = match[1]
      .replace(/<[^>]+>/g, '') // Remove HTML tags
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\s+/g, ' ')
      .trim();
    
    if (text.length > 50) { // Skip short snippets
      paragraphs.push(text);
    }
  }

  if (paragraphs.length > 0) {
    return paragraphs.join('\n\n');
  }

  // Fallback: just strip all HTML
  return content
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 2000);
}
