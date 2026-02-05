/**
 * Trending Topics Fetcher
 * 
 * Sources:
 * - Google Trends (RSS)
 * - HackerNews (Public API)
 * - Reddit (Public JSON)
 */

interface TrendingTopic {
  title: string;
  source: 'google' | 'hackernews' | 'reddit';
  url?: string;
  score?: number;
  description?: string;
}

/**
 * Fetch Google Trends (US)
 */
export async function fetchGoogleTrends(): Promise<TrendingTopic[]> {
  try {
    // Google Trends RSS feed
    const response = await fetch(
      'https://trends.google.com/trending/rss?geo=US'
    );
    
    if (!response.ok) {
      console.error('Google Trends fetch failed:', response.status);
      return [];
    }

    const xml = await response.text();
    const topics: TrendingTopic[] = [];

    // Simple XML parsing for <title> tags within <item>
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    const titleRegex = /<title><!\[CDATA\[(.*?)\]\]><\/title>/;
    const linkRegex = /<link>(.*?)<\/link>/;
    const trafficRegex = /<ht:approx_traffic>(.*?)<\/ht:approx_traffic>/;

    let match;
    while ((match = itemRegex.exec(xml)) !== null) {
      const item = match[1];
      const titleMatch = titleRegex.exec(item);
      const linkMatch = linkRegex.exec(item);
      const trafficMatch = trafficRegex.exec(item);

      if (titleMatch) {
        topics.push({
          title: titleMatch[1],
          source: 'google',
          url: linkMatch?.[1],
          description: trafficMatch ? `${trafficMatch[1]} searches` : undefined
        });
      }
    }

    return topics.slice(0, 20);
  } catch (error) {
    console.error('Error fetching Google Trends:', error);
    return [];
  }
}

/**
 * Fetch HackerNews Top Stories
 */
export async function fetchHackerNews(): Promise<TrendingTopic[]> {
  try {
    // Get top story IDs
    const idsResponse = await fetch(
      'https://hacker-news.firebaseio.com/v0/topstories.json'
    );
    
    if (!idsResponse.ok) return [];
    
    const ids = await idsResponse.json() as number[];
    const topIds = ids.slice(0, 15);

    // Fetch story details
    const stories = await Promise.all(
      topIds.map(async (id) => {
        const res = await fetch(
          `https://hacker-news.firebaseio.com/v0/item/${id}.json`
        );
        if (!res.ok) return null;
        return res.json() as Promise<{
          title: string;
          url?: string;
          score: number;
          descendants?: number;
        }>;
      })
    );

    return stories
      .filter((s): s is NonNullable<typeof s> => s !== null)
      .map((story) => ({
        title: story.title,
        source: 'hackernews' as const,
        url: story.url,
        score: story.score,
        description: `${story.score} points, ${story.descendants || 0} comments`
      }));
  } catch (error) {
    console.error('Error fetching HackerNews:', error);
    return [];
  }
}

/**
 * Fetch Reddit Hot Posts from multiple subreddits
 */
export async function fetchRedditTrends(
  subreddits: string[] = ['technology', 'worldnews', 'science', 'futurology']
): Promise<TrendingTopic[]> {
  const topics: TrendingTopic[] = [];

  for (const subreddit of subreddits) {
    try {
      const response = await fetch(
        `https://www.reddit.com/r/${subreddit}/hot.json?limit=10`,
        {
          headers: {
            'User-Agent': 'Ghostwriter/1.0'
          }
        }
      );

      if (!response.ok) continue;

      const data = await response.json() as {
        data: {
          children: Array<{
            data: {
              title: string;
              url: string;
              score: number;
              num_comments: number;
              subreddit: string;
            };
          }>;
        };
      };

      for (const post of data.data.children) {
        // Skip stickied/pinned posts
        if (post.data.score < 100) continue;

        topics.push({
          title: post.data.title,
          source: 'reddit',
          url: `https://reddit.com${post.data.url}`,
          score: post.data.score,
          description: `r/${post.data.subreddit} • ${post.data.score} upvotes`
        });
      }
    } catch (error) {
      console.error(`Error fetching Reddit r/${subreddit}:`, error);
    }
  }

  // Sort by score and return top 20
  return topics
    .sort((a, b) => (b.score || 0) - (a.score || 0))
    .slice(0, 20);
}

/**
 * Fetch all trending topics from all sources
 */
export async function fetchAllTrends(): Promise<TrendingTopic[]> {
  const [google, hn, reddit] = await Promise.all([
    fetchGoogleTrends(),
    fetchHackerNews(),
    fetchRedditTrends()
  ]);

  // Combine and deduplicate by similar titles
  const all = [...google, ...hn, ...reddit];
  
  // Simple deduplication - could be improved with fuzzy matching
  const seen = new Set<string>();
  const unique: TrendingTopic[] = [];
  
  for (const topic of all) {
    const normalized = topic.title.toLowerCase().slice(0, 50);
    if (!seen.has(normalized)) {
      seen.add(normalized);
      unique.push(topic);
    }
  }

  return unique;
}

/**
 * Score a topic for relevance to a persona
 */
export function scoreTopicForPersona(
  topic: TrendingTopic,
  persona: { occupation?: string | null; style: string; name: string }
): number {
  let score = topic.score || 50; // Base score
  
  const topicLower = topic.title.toLowerCase();
  const styleLower = persona.style.toLowerCase();
  const occupationLower = (persona.occupation || '').toLowerCase();
  
  // Keywords that might be relevant
  const techKeywords = ['ai', 'tech', 'software', 'computer', 'digital', 'internet', 'app'];
  const scienceKeywords = ['science', 'research', 'study', 'discovery', 'space', 'physics'];
  const businessKeywords = ['business', 'economy', 'market', 'company', 'startup', 'money'];
  const philosophyKeywords = ['life', 'death', 'meaning', 'society', 'human', 'freedom', 'truth'];
  const politicsKeywords = ['government', 'policy', 'election', 'law', 'rights', 'democracy'];

  // Boost if topic matches persona's domain
  const checkKeywords = (keywords: string[]) => 
    keywords.some(k => topicLower.includes(k));
  
  if (occupationLower.includes('scientist') && checkKeywords(scienceKeywords)) score *= 1.5;
  if (occupationLower.includes('engineer') && checkKeywords(techKeywords)) score *= 1.5;
  if (occupationLower.includes('philosopher') && checkKeywords(philosophyKeywords)) score *= 1.5;
  if (occupationLower.includes('business') && checkKeywords(businessKeywords)) score *= 1.5;
  if (styleLower.includes('politic') && checkKeywords(politicsKeywords)) score *= 1.3;
  
  // Universal topics that work for anyone
  const universalKeywords = ['human', 'future', 'change', 'world', 'new'];
  if (checkKeywords(universalKeywords)) score *= 1.2;
  
  // Controversial/engaging topics get a boost
  const engagingKeywords = ['controversy', 'debate', 'vs', 'should', 'why', 'how'];
  if (checkKeywords(engagingKeywords)) score *= 1.1;

  return score;
}

/**
 * Get best topic for a specific persona
 */
export async function getBestTopicForPersona(
  persona: { occupation?: string | null; style: string; name: string },
  excludeTitles: string[] = []
): Promise<TrendingTopic | null> {
  const trends = await fetchAllTrends();
  
  if (trends.length === 0) return null;
  
  // Filter out already used topics
  const available = trends.filter(
    t => !excludeTitles.some(e => 
      t.title.toLowerCase().includes(e.toLowerCase()) ||
      e.toLowerCase().includes(t.title.toLowerCase())
    )
  );
  
  if (available.length === 0) return trends[0];
  
  // Score and sort
  const scored = available.map(topic => ({
    topic,
    score: scoreTopicForPersona(topic, persona)
  }));
  
  scored.sort((a, b) => b.score - a.score);
  
  // Add some randomness - pick from top 5
  const topN = scored.slice(0, 5);
  const randomIndex = Math.floor(Math.random() * topN.length);
  
  return topN[randomIndex].topic;
}
