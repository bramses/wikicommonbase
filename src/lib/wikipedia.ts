export interface WikipediaContent {
  title: string;
  extract: string;
  url: string;
  fullContent: string;
  htmlContent: string;
  sections?: WikipediaSection[];
  image?: {
    source: string;
    width: number;
    height: number;
  };
}

export interface WikipediaSection {
  title: string;
  content: string;
  index: number;
}

function cleanWikipediaText(text: string): string {
  return text
    .replace(/\{\{[^}]*\}\}/g, '') // Remove template markup
    .replace(/\[\[([^|\]]*\|)?([^\]]*)\]\]/g, '$2') // Convert links to plain text
    .replace(/\[http[^\s\]]*\s*([^\]]*)\]/g, '$1') // Convert external links
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/'''([^']+)'''/g, '$1') // Remove bold markup
    .replace(/''([^']+)''/g, '$1') // Remove italic markup
    .replace(/\n{3,}/g, '\n\n') // Normalize multiple line breaks
    .trim();
}

function cleanWikipediaHTML(html: string): string {
  return html
    // Remove edit links
    .replace(/<span[^>]*class="mw-editsection"[^>]*>.*?<\/span>/gi, '')
    .replace(/\[edit\]/gi, '')
    // Remove navigation boxes
    .replace(/<table[^>]*class="[^"]*navbox[^"]*"[^>]*>.*?<\/table>/gi, '')
    // Remove reference groups and citation needed
    .replace(/<sup[^>]*class="[^"]*reference[^"]*"[^>]*>.*?<\/sup>/gi, '')
    // Remove coordinates
    .replace(/<span[^>]*class="[^"]*coordinates[^"]*"[^>]*>.*?<\/span>/gi, '')
    // Clean up empty paragraphs
    .replace(/<p>\s*<\/p>/gi, '')
    // Make images responsive and add data attributes for navigation
    .replace(/<img([^>]*)/gi, '<img$1 class="max-w-full h-auto" data-navigable="true"')
    // Clean up figure captions
    .replace(/<figcaption([^>]*)>/gi, '<figcaption$1 class="text-sm text-gray-600 dark:text-gray-400 mt-2 italic">')
    // Style tables
    .replace(/<table([^>]*)>/gi, '<table$1 class="border-collapse border border-gray-300 dark:border-gray-600 w-full my-4">')
    .replace(/<th([^>]*)>/gi, '<th$1 class="border border-gray-300 dark:border-gray-600 px-3 py-2 bg-gray-100 dark:bg-gray-700 font-semibold">')
    .replace(/<td([^>]*)>/gi, '<td$1 class="border border-gray-300 dark:border-gray-600 px-3 py-2">')
    // Style headings
    .replace(/<h1([^>]*)>/gi, '<h1$1 class="text-3xl font-bold mt-8 mb-4" data-navigable="true">')
    .replace(/<h2([^>]*)>/gi, '<h2$1 class="text-2xl font-bold mt-6 mb-3" data-navigable="true">')
    .replace(/<h3([^>]*)>/gi, '<h3$1 class="text-xl font-semibold mt-5 mb-2" data-navigable="true">')
    .replace(/<h4([^>]*)>/gi, '<h4$1 class="text-lg font-semibold mt-4 mb-2" data-navigable="true">')
    // Style paragraphs
    .replace(/<p([^>]*)>/gi, '<p$1 class="mb-4 leading-relaxed" data-navigable="true">')
    // Style lists
    .replace(/<ul([^>]*)>/gi, '<ul$1 class="list-disc list-inside mb-4 space-y-1">')
    .replace(/<ol([^>]*)>/gi, '<ol$1 class="list-decimal list-inside mb-4 space-y-1">')
    .replace(/<li([^>]*)>/gi, '<li$1 class="ml-4">')
    .trim();
}

export async function fetchWikipediaArticle(title: string): Promise<WikipediaContent | null> {
  try {
    // Get full text content using the extract API (no HTML)
    const extractUrl = `https://en.wikipedia.org/w/api.php?action=query&prop=extracts&explaintext&format=json&titles=${encodeURIComponent(title)}&origin=*`;
    const extractResponse = await fetch(extractUrl);

    if (!extractResponse.ok) {
      return null;
    }

    const extractData = await extractResponse.json();
    const pages = extractData.query?.pages;

    if (!pages) {
      return null;
    }

    const pageId = Object.keys(pages)[0];
    if (pageId === '-1') {
      return null;
    }

    const page = pages[pageId];
    if (!page.extract) {
      return null;
    }

    // Get page images
    const imageUrl = `https://en.wikipedia.org/w/api.php?action=query&prop=pageimages&piprop=original&format=json&titles=${encodeURIComponent(title)}&origin=*`;
    let image = undefined;

    try {
      const imageResponse = await fetch(imageUrl);
      if (imageResponse.ok) {
        const imageData = await imageResponse.json();
        const imagePages = imageData.query?.pages;
        if (imagePages && imagePages[pageId]?.original) {
          const original = imagePages[pageId].original;
          image = {
            source: original.source,
            width: original.width,
            height: original.height
          };
        }
      }
    } catch (error) {
      console.log('Could not fetch image, continuing without');
    }

    // Get page URL
    const pageUrl = `https://en.wikipedia.org/wiki/${encodeURIComponent(title)}`;

    // Clean the text content
    const cleanedText = cleanWikipediaText(page.extract);

    // Create extract (first paragraph)
    const paragraphs = cleanedText.split('\n\n');
    const extract = paragraphs[0] || cleanedText.substring(0, 500) + (cleanedText.length > 500 ? '...' : '');

    return {
      title: page.title,
      extract,
      url: pageUrl,
      fullContent: cleanedText,
      htmlContent: cleanedText, // Use clean text as htmlContent too
      sections: [], // Not parsing sections for now
      image
    };

  } catch (error) {
    console.error('Error fetching Wikipedia article:', error);
    return null;
  }
}

export async function getRandomWikipediaTitle(categories?: string[]): Promise<string | null> {
  try {
    // If no categories specified, use the default random endpoint
    if (!categories || categories.length === 0) {
      const response = await fetch('https://en.wikipedia.org/api/rest_v1/page/random/summary');
      if (!response.ok) {
        return null;
      }
      const data = await response.json();
      return data.title;
    }

    // Pick a random category from the selected ones
    const randomCategory = categories[Math.floor(Math.random() * categories.length)];

    // Get a random page from the selected category
    const url = `https://en.wikipedia.org/w/api.php?action=query&generator=categorymembers&gcmtitle=Category:${encodeURIComponent(randomCategory)}&gcmtype=page&gcmlimit=50&prop=info&format=json&origin=*`;
    const response = await fetch(url);

    if (!response.ok) {
      // Fallback to default random if category query fails
      return getRandomWikipediaTitle();
    }

    const data = await response.json();
    const pages = data.query?.pages;

    if (!pages) {
      // Fallback to default random if no pages found
      return getRandomWikipediaTitle();
    }

    // Get all page titles and pick one randomly
    const titles = Object.values(pages).map((page: any) => page.title);
    if (titles.length === 0) {
      return getRandomWikipediaTitle();
    }

    return titles[Math.floor(Math.random() * titles.length)] as string;
  } catch (error) {
    console.error('Error fetching random Wikipedia title:', error);
    return null;
  }
}