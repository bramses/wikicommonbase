export interface ReadingListItem {
  id: string;
  title: string;
  url: string;
  dateAdded: string;
  isArchived: boolean;
}

const READING_LIST_COOKIE_KEY = 'wikipedia-reading-list';
const COOKIE_MAX_AGE = 365 * 24 * 60 * 60 * 1000; // 1 year in milliseconds

export function loadReadingList(): ReadingListItem[] {
  if (typeof document === 'undefined') return [];

  try {
    const cookies = document.cookie.split(';');
    const readingListCookie = cookies.find(cookie =>
      cookie.trim().startsWith(`${READING_LIST_COOKIE_KEY}=`)
    );

    if (readingListCookie) {
      const value = readingListCookie.split('=')[1];
      const decoded = decodeURIComponent(value);
      return JSON.parse(decoded);
    }
  } catch (error) {
    console.error('Error loading reading list from cookies:', error);
  }

  return [];
}

export function saveReadingList(items: ReadingListItem[]): void {
  if (typeof document === 'undefined') return;

  try {
    const encoded = encodeURIComponent(JSON.stringify(items));
    const expires = new Date(Date.now() + COOKIE_MAX_AGE).toUTCString();
    document.cookie = `${READING_LIST_COOKIE_KEY}=${encoded}; expires=${expires}; path=/; SameSite=Lax`;
  } catch (error) {
    console.error('Error saving reading list to cookies:', error);
  }
}

export function addToReadingList(url: string, title?: string): ReadingListItem {
  const items = loadReadingList();

  // Check if URL already exists
  const existing = items.find(item => item.url === url);
  if (existing) {
    return existing;
  }

  const newItem: ReadingListItem = {
    id: generateId(),
    title: title || extractTitleFromUrl(url),
    url: url,
    dateAdded: new Date().toISOString(),
    isArchived: false
  };

  const updatedItems = [...items, newItem];
  saveReadingList(updatedItems);
  return newItem;
}

export function removeFromReadingList(id: string): void {
  const items = loadReadingList();
  const filteredItems = items.filter(item => item.id !== id);
  saveReadingList(filteredItems);
}

export function archiveReadingListItem(id: string): void {
  const items = loadReadingList();
  const updatedItems = items.map(item =>
    item.id === id ? { ...item, isArchived: true } : item
  );
  saveReadingList(updatedItems);
}

export function unarchiveReadingListItem(id: string): void {
  const items = loadReadingList();
  const updatedItems = items.map(item =>
    item.id === id ? { ...item, isArchived: false } : item
  );
  saveReadingList(updatedItems);
}

function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

function extractTitleFromUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    if (urlObj.hostname.includes('wikipedia.org')) {
      const pathParts = urlObj.pathname.split('/');
      const titlePart = pathParts[pathParts.length - 1];
      return decodeURIComponent(titlePart).replace(/_/g, ' ');
    }
    return urlObj.hostname;
  } catch {
    return url;
  }
}

export function isValidWikipediaUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.includes('wikipedia.org') && urlObj.pathname.includes('/wiki/');
  } catch {
    return false;
  }
}