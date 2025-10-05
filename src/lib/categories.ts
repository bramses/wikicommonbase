export const CATEGORIES_STORAGE_KEY = 'wikipedia-selected-categories';

export interface WikipediaCategory {
  name: string;
  displayName: string;
  description: string;
}

export const WIKIPEDIA_CATEGORIES: WikipediaCategory[] = [
  // Culture and the arts subcategories
  {
    name: 'Literature',
    displayName: 'Literature',
    description: 'Books, authors, poetry, literary works and criticism'
  },
  {
    name: 'Music',
    displayName: 'Music',
    description: 'Musicians, composers, musical genres, instruments'
  },
  {
    name: 'Film',
    displayName: 'Film & Cinema',
    description: 'Movies, directors, actors, cinematography'
  },
  {
    name: 'Visual arts',
    displayName: 'Visual Arts',
    description: 'Painting, sculpture, architecture, design, photography'
  },
  {
    name: 'Sports',
    displayName: 'Sports',
    description: 'Athletes, competitions, Olympic Games, various sports'
  },
  {
    name: 'Games',
    displayName: 'Games & Entertainment',
    description: 'Video games, board games, puzzles, entertainment'
  },

  // Geography and places subcategories
  {
    name: 'Countries',
    displayName: 'Countries',
    description: 'Nations, territories, country profiles and information'
  },
  {
    name: 'Cities',
    displayName: 'Cities',
    description: 'Urban areas, metropolitan regions, city history'
  },
  {
    name: 'Landforms',
    displayName: 'Natural Features',
    description: 'Mountains, rivers, lakes, deserts, natural landmarks'
  },

  // Health and fitness subcategories
  {
    name: 'Medicine',
    displayName: 'Medicine',
    description: 'Medical science, diseases, treatments, healthcare'
  },
  {
    name: 'Psychology',
    displayName: 'Psychology',
    description: 'Mental health, cognitive science, psychological theories'
  },
  {
    name: 'Nutrition',
    displayName: 'Nutrition & Diet',
    description: 'Food science, dietary supplements, nutritional advice'
  },

  // History and events subcategories
  {
    name: 'Ancient history',
    displayName: 'Ancient History',
    description: 'Ancient civilizations, archaeological discoveries'
  },
  {
    name: 'Modern history',
    displayName: 'Modern History',
    description: 'Recent historical events, 20th-21st century history'
  },
  {
    name: 'Wars',
    displayName: 'Wars & Conflicts',
    description: 'Military history, battles, armed conflicts'
  },

  // Natural and physical sciences subcategories
  {
    name: 'Biology',
    displayName: 'Biology',
    description: 'Life sciences, genetics, ecology, evolution'
  },
  {
    name: 'Physics',
    displayName: 'Physics',
    description: 'Physical laws, quantum mechanics, relativity, particles'
  },
  {
    name: 'Chemistry',
    displayName: 'Chemistry',
    description: 'Chemical elements, compounds, reactions, materials'
  },
  {
    name: 'Astronomy',
    displayName: 'Astronomy & Space',
    description: 'Stars, planets, galaxies, space exploration'
  },
  {
    name: 'Earth sciences',
    displayName: 'Earth Sciences',
    description: 'Geology, meteorology, climate, environmental science'
  },

  // People and biography subcategories
  {
    name: 'Politicians',
    displayName: 'Political Figures',
    description: 'Presidents, prime ministers, political leaders'
  },
  {
    name: 'Scientists',
    displayName: 'Scientists',
    description: 'Researchers, inventors, Nobel Prize winners'
  },
  {
    name: 'Artists',
    displayName: 'Artists & Creators',
    description: 'Painters, sculptors, designers, creative professionals'
  },

  // Technology and applied sciences subcategories
  {
    name: 'Computing',
    displayName: 'Computing & IT',
    description: 'Computer science, programming, artificial intelligence'
  },
  {
    name: 'Engineering',
    displayName: 'Engineering',
    description: 'Civil, mechanical, electrical, aerospace engineering'
  },
  {
    name: 'Internet',
    displayName: 'Internet & Web',
    description: 'Online technologies, social media, web development'
  },

  // Philosophy and thinking subcategories
  {
    name: 'Ethics',
    displayName: 'Ethics & Morality',
    description: 'Moral philosophy, ethical theories, applied ethics'
  },
  {
    name: 'Logic',
    displayName: 'Logic & Reasoning',
    description: 'Logical systems, critical thinking, argumentation'
  },

  // Religion and belief systems subcategories
  {
    name: 'Christianity',
    displayName: 'Christianity',
    description: 'Christian denominations, theology, church history'
  },
  {
    name: 'Islam',
    displayName: 'Islam',
    description: 'Islamic faith, history, practices, culture'
  },
  {
    name: 'Buddhism',
    displayName: 'Buddhism',
    description: 'Buddhist philosophy, practices, schools of thought'
  },
  {
    name: 'Mythology',
    displayName: 'Mythology',
    description: 'Myths, legends, folklore from various cultures'
  },

  // Society and social sciences subcategories
  {
    name: 'Economics',
    displayName: 'Economics',
    description: 'Economic theory, markets, finance, business'
  },
  {
    name: 'Law',
    displayName: 'Law & Legal Systems',
    description: 'Legal theory, court cases, jurisprudence, rights'
  },
  {
    name: 'Education',
    displayName: 'Education',
    description: 'Schools, universities, educational theory, learning'
  },

  // Mathematics and logic subcategories
  {
    name: 'Mathematics',
    displayName: 'Mathematics',
    description: 'Pure mathematics, algebra, geometry, calculus'
  },
  {
    name: 'Statistics',
    displayName: 'Statistics',
    description: 'Statistical methods, data analysis, probability'
  }
];

/**
 * Load selected categories from localStorage
 */
export function loadSelectedCategories(): string[] {
  if (typeof window === 'undefined') return [];

  try {
    const saved = localStorage.getItem(CATEGORIES_STORAGE_KEY);
    if (saved) {
      const parsedCategories = JSON.parse(saved);
      if (Array.isArray(parsedCategories)) {
        // Validate that all categories still exist in our current list
        const validCategoryNames = new Set(WIKIPEDIA_CATEGORIES.map(c => c.name));
        return parsedCategories.filter(cat => validCategoryNames.has(cat));
      }
    }
  } catch (error) {
    console.error('Error loading saved categories:', error);
  }

  return [];
}

/**
 * Save selected categories to localStorage
 */
export function saveSelectedCategories(categories: string[]): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(CATEGORIES_STORAGE_KEY, JSON.stringify(categories));
  } catch (error) {
    console.error('Error saving categories:', error);
  }
}

/**
 * Get categories from URL parameters or localStorage
 */
export function getCategoriesFromParams(searchParams: URLSearchParams): string[] {
  const categoriesParam = searchParams.get('categories');

  if (categoriesParam) {
    // Parse from URL
    return categoriesParam.split(',').map(c => c.trim()).filter(c => c.length > 0);
  }

  // Fallback to localStorage
  return loadSelectedCategories();
}

/**
 * Create URL with categories parameter
 */
export function createUrlWithCategories(basePath: string, categories: string[], additionalParams?: Record<string, string>): string {
  const params = new URLSearchParams();

  if (categories.length > 0) {
    params.set('categories', categories.join(','));
  }

  if (additionalParams) {
    Object.entries(additionalParams).forEach(([key, value]) => {
      params.set(key, value);
    });
  }

  const paramString = params.toString();
  return paramString ? `${basePath}?${paramString}` : basePath;
}