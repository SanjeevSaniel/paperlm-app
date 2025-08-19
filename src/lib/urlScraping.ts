import { load } from 'cheerio';
import { execSync } from 'child_process';

// Define the ScrapedContent interface
export interface ScrapedContent {
  title: string;
  content: string;
  metadata: Record<string, unknown>;
}


// Enhanced YouTube scraping with multiple fallback methods
export async function scrapeYouTubeContent(url: string): Promise<ScrapedContent> {
  try {
    const videoId = extractVideoId(url);
    if (!videoId) {
      throw new Error('Invalid YouTube URL format');
    }

    // Method 1: Try youtube-transcript-api (most reliable)
    try {
      const transcriptResult = await getYouTubeTranscriptWithAPI(videoId);
      if (transcriptResult.content) {
        return {
          title: transcriptResult.title,
          content: transcriptResult.content,
          metadata: {
            ...transcriptResult.metadata,
            extractionMethod: 'youtube-transcript-api',
            url,
            contentType: 'video/youtube'
          }
        };
      }
    } catch (transcriptError) {
      console.warn('YouTube transcript API failed:', transcriptError);
    }

    // Method 2: Try multiple transcript libraries as fallback
    try {
      const fallbackResult = await getYouTubeTranscriptFallback();
      if (fallbackResult.content) {
        return {
          title: fallbackResult.title,
          content: fallbackResult.content,
          metadata: {
            ...fallbackResult.metadata,
            extractionMethod: 'fallback-transcript',
            url,
            contentType: 'video/youtube'
          }
        };
      }
    } catch (fallbackError) {
      console.warn('Fallback transcript extraction failed:', fallbackError);
    }

    // Method 3: Extract video metadata and description as fallback
    try {
      const metadataResult = await getYouTubeMetadata(videoId);
      if (metadataResult.description) {
        return {
          title: metadataResult.title || 'YouTube Video',
          content: `# ${metadataResult.title}\n\n**Video Description:**\n${metadataResult.description}\n\n**Video Details:**\n- Duration: ${metadataResult.duration || 'Unknown'}\n- Upload Date: ${metadataResult.uploadDate || 'Unknown'}\n- Channel: ${metadataResult.channel || 'Unknown'}\n\n*Note: Transcript was not available for this video. This summary is based on the video's metadata and description.*`,
          metadata: {
            ...metadataResult,
            extractionMethod: 'metadata-only',
            url,
            contentType: 'video/youtube',
            hasTranscript: false
          }
        };
      }
    } catch (metadataError) {
      console.warn('Metadata extraction failed:', metadataError);
    }

    // Method 4: Last resort - basic video info
    return {
      title: 'YouTube Video',
      content: `# YouTube Video\n\n**URL:** ${url}\n**Video ID:** ${videoId}\n\n**Note:** This video does not have transcripts or captions available. Consider:\n\n- Checking if the video has closed captions enabled\n- Trying again later as transcripts may be generated automatically\n- Using video description and metadata for basic information\n\n**Suggestions for content creators:**\n- Enable auto-generated captions in YouTube Studio\n- Upload manual captions for better accuracy\n- Include detailed video descriptions`,
      metadata: {
        videoId,
        extractionMethod: 'basic-info',
        url,
        contentType: 'video/youtube',
        hasTranscript: false,
        error: 'No transcript available'
      }
    };

  } catch (error) {
    throw new Error(`Failed to extract YouTube content: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Method 1: Enhanced transcript extraction
async function getYouTubeTranscriptWithAPI(videoId: string) {
  // Try multiple transcript extraction methods
  const methods = [
    () => extractWithYoutubeTranscriptApi(videoId),
    () => extractWithAlternativeAPI(videoId),
    () => extractWithDirectAPI(videoId)
  ];

  for (const method of methods) {
    try {
      const result = await method();
      if (result && result.content) {
        return result;
      }
    } catch (error) {
      console.warn('Transcript method failed:', error);
      continue;
    }
  }
  
  throw new Error('All transcript extraction methods failed');
}

// Primary transcript extraction method
async function extractWithYoutubeTranscriptApi(videoId: string) {
  try {
    // Dynamic import to handle potential installation issues
    const { YoutubeTranscript } = await import('youtube-transcript');
    
    const transcript = await YoutubeTranscript.fetchTranscript(videoId, {
      lang: 'en'
    });
    
    if (!transcript || transcript.length === 0) {
      throw new Error('Empty transcript received');
    }

    // Format transcript with timestamps
    const formattedContent = transcript
      .map(item => {
        const time = Math.floor(item.offset / 1000);
        const minutes = Math.floor(time / 60);
        const seconds = time % 60;
        return `[${minutes}:${seconds.toString().padStart(2, '0')}] ${item.text}`;
      })
      .join('\n');

    // Get video metadata
    const metadata = await getVideoBasicInfo(videoId);

    return {
      title: metadata.title || `YouTube Video ${videoId}`,
      content: `# ${metadata.title || 'YouTube Video'}\n\n**Transcript:**\n\n${formattedContent}`,
      metadata: {
        ...metadata,
        videoId,
        transcriptLength: transcript.length,
        duration: transcript[transcript.length - 1]?.offset || 0
      }
    };
  } catch (error) {
    throw new Error(`YouTube transcript API failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Alternative API method
async function extractWithAlternativeAPI(videoId: string) {
  try {
    // Try alternative transcript extraction
    const response = await fetch(`https://www.googleapis.com/youtube/v3/captions?part=snippet&videoId=${videoId}&key=${process.env.YOUTUBE_API_KEY}`);
    
    if (!response.ok) {
      throw new Error('YouTube API request failed');
    }
    
    const data = await response.json();
    
    if (!data.items || data.items.length === 0) {
      throw new Error('No captions available via YouTube API');
    }

    // Process caption data (this would require additional implementation)
    // For now, indicate that captions exist but need manual processing
    const metadata = await getVideoBasicInfo(videoId);
    
    return {
      title: metadata.title || `YouTube Video ${videoId}`,
      content: `# ${metadata.title || 'YouTube Video'}\n\n**Captions Available:** This video has captions available but requires additional processing to extract the full transcript.\n\n**Video Description:**\n${metadata.description || 'No description available.'}`,
      metadata: {
        ...metadata,
        videoId,
        captionsAvailable: true,
        extractionMethod: 'youtube-api-captions'
      }
    };
  } catch (error) {
    throw new Error(`Alternative API failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Direct API approach for videos without transcripts
async function extractWithDirectAPI(videoId: string) {
  const metadata = await getVideoBasicInfo(videoId);
  
  if (!metadata.description || metadata.description.length < 50) {
    throw new Error('Insufficient video metadata');
  }

  return {
    title: metadata.title || `YouTube Video ${videoId}`,
    content: `# ${metadata.title || 'YouTube Video'}\n\n**Video Information:**\n\n${metadata.description}\n\n**Additional Details:**\n- Channel: ${metadata.channel || 'Unknown'}\n- Upload Date: ${metadata.uploadDate || 'Unknown'}\n- Duration: ${metadata.duration || 'Unknown'}\n\n*Note: Full transcript not available. Content based on video description and metadata.*`,
    metadata: {
      ...metadata,
      videoId,
      extractionMethod: 'metadata-description'
    }
  };
}

// Get basic video info without transcript
async function getVideoBasicInfo(videoId: string) {
  try {
    // Try to get basic video info using a simple fetch approach
    const response = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`);
    
    if (response.ok) {
      const data = await response.json();
      return {
        title: data.title,
        channel: data.author_name,
        description: `Video from channel: ${data.author_name}`,
        uploadDate: new Date().toISOString(),
        duration: 'Unknown'
      };
    }
    
    // Fallback to basic info
    return {
      title: `YouTube Video ${videoId}`,
      channel: 'Unknown',
      description: 'Video information not available',
      uploadDate: new Date().toISOString(),
      duration: 'Unknown'
    };
  } catch  {
    return {
      title: `YouTube Video ${videoId}`,
      channel: 'Unknown',
      description: 'Video metadata extraction failed',
      uploadDate: new Date().toISOString(),
      duration: 'Unknown'
    };
  }
}

// Method 2: Fallback transcript extraction
async function getYouTubeTranscriptFallback(): Promise<{ title: string; content: string; metadata: Record<string, unknown> }> {
  // Implement additional fallback methods here
  // This could include:
  // - Alternative npm packages
  // - External APIs
  // - Web scraping approaches
  
  // For now, throw an error to indicate not implemented
  throw new Error('Fallback methods not yet implemented');
}

// Method 3: Enhanced metadata extraction
async function getYouTubeMetadata(videoId: string) {
  try {
    // Multiple approaches to get video metadata
    const metadata = await getVideoBasicInfo(videoId);
    
    if (!metadata.description || metadata.description.length < 20) {
      throw new Error('Insufficient metadata');
    }
    
    return metadata;
  } catch (error) {
    throw new Error(`Metadata extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

function extractVideoId(url: string): string | null {
  const regex = /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/;
  const match = url.match(regex);
  return match ? match[1] : null;
}


export async function scrapeWithPuppeteer(url: string): Promise<{
  title: string;
  content: string;
  metadata: {
    url: string;
    description?: string;
    author?: string;
    publishedAt?: string;
    loader: 'puppeteer';
  };
}> {
  const puppeteer = await import('puppeteer');
  const browser = await puppeteer.default.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
    ],
  });

  const page = await browser.newPage();
  await page.setUserAgent(
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  );
  await page.setViewport({ width: 1280, height: 720 });
  await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });

  const data = await page.evaluate(() => {
    const unwantedSelectors = [
      'script',
      'style',
      'nav',
      'footer',
      'header',
      'noscript',
      'iframe',
      '.ads',
      '.advertisement',
      '.social-share',
      '.sidebar',
      '.navigation',
      '.comments',
      '.cookie-banner',
      '.popup',
      '.modal',
    ];
    unwantedSelectors.forEach((selector) => {
      document.querySelectorAll(selector).forEach((el) => el.remove());
    });

    const title =
      document.title ||
      document.querySelector('h1')?.textContent?.trim() ||
      'Untitled';

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
      '.article-body',
    ];

    let content = '';
    for (const selector of contentSelectors) {
      const element = document.querySelector(selector);
      if (element) {
        content = element.textContent?.trim() || '';
        if (content.length > 200) break;
      }
    }

    if (!content || content.length < 200) {
      const paragraphs = Array.from(document.querySelectorAll('p'))
        .map((p) => p.textContent?.trim())
        .filter((text) => text && text.length > 20)
        .join('\n\n');
      content = paragraphs || content;
    }

    const getMetaContent = (name: string) => {
      return (
        document
          .querySelector(`meta[name="${name}"]`)
          ?.getAttribute('content') ||
        document
          .querySelector(`meta[property="og:${name}"]`)
          ?.getAttribute('content') ||
        document
          .querySelector(`meta[property="article:${name}"]`)
          ?.getAttribute('content') ||
        document
          .querySelector(`meta[name="twitter:${name}"]`)
          ?.getAttribute('content')
      );
    };

    return {
      title: title.replace(/\s*\|\s*.*/, '').trim() || title,
      content: content.replace(/\s+/g, ' ').trim(),
      description: getMetaContent('description'),
      author:
        getMetaContent('author') ||
        document.querySelector('[rel="author"]')?.textContent?.trim() ||
        document.querySelector('.author')?.textContent?.trim(),
      publishedAt:
        getMetaContent('published_time') ||
        getMetaContent('date') ||
        document.querySelector('time[datetime]')?.getAttribute('datetime'),
    };
  });

  await browser.close();

  if (!data.content || data.content.length < 50) {
    throw new Error('Insufficient content extracted with Puppeteer');
  }

  return {
    title: data.title,
    content: data.content,
    metadata: {
      url,
      description: data.description?.substring(0, 300),
      author: data.author,
      publishedAt: data.publishedAt ?? undefined,
      loader: 'puppeteer',
    },
  };
}

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
  try {
    new URL(url);
  } catch {
    throw new Error('Invalid URL format');
  }

  try {
    const mirrorHtml = execSync(`npx mirror-web-cli --url "${url}"`, {
      encoding: 'utf8',
      timeout: 30000,
      maxBuffer: 10 * 1024 * 1024,
    });

    if (mirrorHtml && mirrorHtml.length > 100) {
      const $ = load(mirrorHtml);
      let title =
        $('title').text().trim() ||
        $('h1').first().text().trim() ||
        'Untitled Website';
      title = title.replace(/\s*\|\s*.*/, '').trim() || title;

      let content = '';
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
        '.article-body',
      ];

      for (const selector of contentSelectors) {
        const element = $(selector).first();
        if (element.length) {
          element
            .find(
              'script, style, nav, footer, header, .navigation, .sidebar, .comments, .ads, .advertisement, .social-share',
            )
            .remove();
          const elementText = element.text().trim();
          if (elementText.length > content.length) {
            content = elementText;
          }
        }
      }

      if (content.length < 200) {
        const paragraphs = $('p')
          .map((_, el) => $(el).text().trim())
          .get()
          .filter((text) => text.length > 20);
        content = paragraphs.join('\n\n');
      }

      content = content.replace(/\s+/g, ' ').trim();
      if (content && content.length >= 50) {
        return {
          title,
          content,
          metadata: { url },
        };
      }
    }
  } catch {}

  // Fallback to direct fetch
  const response = await fetch(url, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36',
      Accept:
        'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.8',
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  const html = await response.text();
  const $ = load(html);
  let title = $('title').text().trim() || 'Untitled Website';
  title = title.replace(/\s*\|\s*.*/, '').trim() || title;

  let content = '';
  const contentSelectors = [
    'article',
    'main',
    '[role="main"]',
    '.content',
    '.post-content',
    '.entry-content',
    '.article-content',
    '.main-content',
    'body',
  ];

  for (const selector of contentSelectors) {
    const element = $(selector).first();
    if (element.length && element.text().trim().length > content.length) {
      element
        .find(
          'script, style, nav, footer, header, .navigation, .sidebar, .comments, .ads',
        )
        .remove();
      content = element.text().trim();
    }
  }

  if (content.length < 100) {
    content = $('p')
      .map((_, el) => $(el).text().trim())
      .get()
      .join('\n\n');
  }

  content = content.replace(/\s+/g, ' ').trim();
  if (!content || content.length < 50) {
    throw new Error('Could not extract meaningful content from website');
  }

  return {
    title,
    content,
    metadata: { url },
  };
}
