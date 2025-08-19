import cheerio from 'cheerio';
import { YoutubeTranscript } from 'youtube-transcript';
import { execSync } from 'child_process';

// Extract YouTube video ID from various URL formats
function extractYouTubeId(url: string): string | null {
  const patterns = [
    /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com|youtu\.be)\/(?:watch\?v=|embed\/|v\/)?([a-zA-Z0-9_-]{11})/,
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?.*v=([a-zA-Z0-9_-]{11})/,
    /(?:https?:\/\/)?youtu\.be\/([a-zA-Z0-9_-]{11})/
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  
  return null;
}

// Scrape YouTube video transcript and metadata
export async function scrapeYouTubeContent(url: string): Promise<{
  title: string;
  content: string;
  metadata: {
    videoId: string;
    duration?: string;
    views?: string;
    publishedAt?: string;
  };
}> {
  const videoId = extractYouTubeId(url);
  if (!videoId) {
    throw new Error('Invalid YouTube URL');
  }

  console.log('Extracting transcript for YouTube video:', videoId);

  try {
    // Get transcript
    const transcript = await YoutubeTranscript.fetchTranscript(videoId);
    
    if (!transcript || transcript.length === 0) {
      throw new Error('No transcript available for this video');
    }

    // Combine transcript text
    const content = transcript.map(item => item.text).join(' ');
    
    // Try to get video metadata using a simple fetch
    let title = `YouTube Video (${videoId})`;
    let metadata = { videoId };

    try {
      const response = await fetch(`https://www.youtube.com/watch?v=${videoId}`);
      const html = await response.text();
      const $ = cheerio.load(html);
      
      // Extract title from page
      const pageTitle = $('title').text();
      if (pageTitle && !pageTitle.includes('YouTube')) {
        title = pageTitle.replace(' - YouTube', '');
      }
      
      // Try to extract some basic metadata
      const metaDescription = $('meta[name="description"]').attr('content');
      if (metaDescription) {
        metadata = { 
          ...metadata, 
          description: metaDescription.substring(0, 200) 
        };
      }
    } catch (error) {
      console.warn('Could not fetch video metadata:', error);
    }

    return {
      title,
      content,
      metadata
    };
  } catch (error) {
    console.error('YouTube transcript error:', error);
    throw new Error(`Failed to extract YouTube content: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Scrape website content using mirror-web-cli with cheerio fallback
export async function scrapeWebsiteContent(url: string): Promise<{
  title: string;
  content: string;
  metadata: {
    url: string;
    description?: string;
    author?: string;
    publishedAt?: string;
  };
}> {
  console.log('Scraping website content from:', url);
  
  try {
    // Validate URL
    new URL(url);
  } catch {
    throw new Error('Invalid URL format');
  }

  // Try mirror-web-cli first (more reliable for complex websites)
  try {
    console.log('Attempting to use mirror-web-cli for content extraction...');
    
    // Use mirror-web-cli to extract HTML content
    const mirrorHtml = execSync(`npx mirror-web-cli --url "${url}"`, {
      encoding: 'utf8',
      timeout: 30000, // 30 second timeout
      maxBuffer: 10 * 1024 * 1024, // 10MB buffer
    });

    if (mirrorHtml && mirrorHtml.length > 100) {
      console.log('Successfully fetched HTML using mirror-web-cli, now parsing...');
      
      // Parse the HTML content using cheerio
      const $ = cheerio.load(mirrorHtml);

      // Extract title
      let title = $('title').text().trim() || 
                  $('h1').first().text().trim() || 
                  'Untitled Website';
      
      // Clean up common title patterns
      title = title.replace(/\s*\|\s*.*$/, '').trim() || title;

      // Extract main content with better selectors
      let content = '';
      
      // Try to find main content areas
      const contentSelectors = [
        'article',
        'main',
        '[role="main"]',
        '.content',
        '.post-content',
        '.entry-content',
        '.article-content',
        '.main-content',
        '.post',
        '.story-body',
        '.article-body'
      ];

      for (const selector of contentSelectors) {
        const element = $(selector).first();
        if (element.length) {
          // Remove unwanted elements
          element.find('script, style, nav, footer, header, .navigation, .sidebar, .comments, .ads, .advertisement, .social-share').remove();
          const elementText = element.text().trim();
          if (elementText.length > content.length) {
            content = elementText;
          }
        }
      }

      // Fallback: get all paragraph text if main content not found
      if (content.length < 200) {
        const paragraphs = $('p').map((_, el) => $(el).text().trim()).get().filter(text => text.length > 20);
        content = paragraphs.join('\n\n');
      }

      // Clean up content
      content = content.replace(/\s+/g, ' ').trim();
      
      if (!content || content.length < 50) {
        throw new Error('mirror-web-cli returned insufficient content after parsing');
      }

      // Extract metadata from the HTML
      const metadata: any = { url };
      
      const description = $('meta[name="description"]').attr('content') || 
                         $('meta[property="og:description"]').attr('content') ||
                         $('meta[name="twitter:description"]').attr('content');
      if (description) {
        metadata.description = description.substring(0, 300);
      }

      const author = $('meta[name="author"]').attr('content') ||
                     $('meta[property="og:author"]').attr('content') ||
                     $('meta[name="twitter:creator"]').attr('content') ||
                     $('[rel="author"]').text().trim() ||
                     $('.author').first().text().trim();
      if (author) {
        metadata.author = author;
      }

      const publishedAt = $('meta[property="article:published_time"]').attr('content') ||
                         $('meta[name="date"]').attr('content') ||
                         $('meta[property="og:updated_time"]').attr('content') ||
                         $('time[datetime]').attr('datetime') ||
                         $('.published-date').first().text().trim();
      if (publishedAt) {
        metadata.publishedAt = publishedAt;
      }

      console.log('Successfully extracted content using mirror-web-cli + cheerio parsing');
      return {
        title,
        content,
        metadata
      };
    } else {
      throw new Error('mirror-web-cli returned no HTML content');
    }
  } catch (mirrorError) {
    console.warn('mirror-web-cli failed, falling back to direct fetch + cheerio:', mirrorError);
    
    // Fallback to cheerio method
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate',
          'Connection': 'keep-alive'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const html = await response.text();
      const $ = cheerio.load(html);

      // Extract title
      let title = $('title').text().trim() || 'Untitled Website';
      
      // Clean up common title patterns
      title = title.replace(/\s*\|\s*.*$/, '').trim() || title;

      // Extract main content
      let content = '';
      
      // Try to find main content areas
      const contentSelectors = [
        'article',
        'main',
        '[role="main"]',
        '.content',
        '.post-content',
        '.entry-content',
        '.article-content',
        '.main-content',
        'body'
      ];

      for (const selector of contentSelectors) {
        const element = $(selector).first();
        if (element.length && element.text().trim().length > content.length) {
          // Remove unwanted elements
          element.find('script, style, nav, footer, header, .navigation, .sidebar, .comments, .ads').remove();
          content = element.text().trim();
          break;
        }
      }

      // Fallback: get all paragraph text
      if (content.length < 100) {
        content = $('p').map((_, el) => $(el).text().trim()).get().join('\n\n');
      }

      // Clean up content
      content = content.replace(/\s+/g, ' ').trim();
      
      if (!content || content.length < 50) {
        throw new Error('Could not extract meaningful content from website');
      }

      // Extract metadata
      const metadata: any = { url };
      
      const description = $('meta[name="description"]').attr('content') || 
                         $('meta[property="og:description"]').attr('content');
      if (description) {
        metadata.description = description.substring(0, 300);
      }

      const author = $('meta[name="author"]').attr('content') ||
                     $('meta[property="og:author"]').attr('content') ||
                     $('[rel="author"]').text().trim();
      if (author) {
        metadata.author = author;
      }

      const publishedAt = $('meta[property="article:published_time"]').attr('content') ||
                         $('meta[name="date"]').attr('content') ||
                         $('time[datetime]').attr('datetime');
      if (publishedAt) {
        metadata.publishedAt = publishedAt;
      }

      console.log('Successfully extracted content using cheerio fallback');
      return {
        title,
        content,
        metadata
      };
    } catch (cheerioError) {
      console.error('Both mirror-web-cli and cheerio failed:', cheerioError);
      throw new Error(`Failed to scrape website: ${cheerioError instanceof Error ? cheerioError.message : 'Unknown error'}`);
    }
  }
}