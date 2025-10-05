'use client';

import { useState } from 'react';
import { WIKIPEDIA_CATEGORIES, type WikipediaCategory } from '@/lib/categories';

interface CategoryFilterProps {
  selectedCategories: string[];
  onCategoriesChange: (categories: string[]) => void;
}

export default function CategoryFilter({ selectedCategories, onCategoriesChange }: CategoryFilterProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleCategoryToggle = (categoryName: string) => {
    if (selectedCategories.includes(categoryName)) {
      onCategoriesChange(selectedCategories.filter(c => c !== categoryName));
    } else {
      onCategoriesChange([...selectedCategories, categoryName]);
    }
  };

  const handleSelectAll = () => {
    onCategoriesChange(WIKIPEDIA_CATEGORIES.map(c => c.name));
  };

  const handleClearAll = () => {
    onCategoriesChange([]);
  };

  return (
    <div
      className="card"
      style={{
        background: 'var(--surface-elevated)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-lg)',
        padding: 'var(--space-xl)',
        marginBottom: 'var(--space-2xl)'
      }}
    >
      <div
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
        style={{ marginBottom: isExpanded ? 'var(--space-lg)' : '0' }}
      >
        <div>
          <h3
            style={{
              fontSize: 'var(--text-xl)',
              fontWeight: '600',
              color: 'var(--foreground)',
              marginBottom: 'var(--space-xs)'
            }}
          >
            🎯 Filter Random Articles
          </h3>
          <p
            style={{
              fontSize: 'var(--text-sm)',
              color: 'var(--foreground-secondary)',
              fontFamily: 'Inter, sans-serif'
            }}
          >
            {selectedCategories.length === 0
              ? 'All topics - click to filter by categories'
              : `${selectedCategories.length} categories selected`}
          </p>
        </div>
        <span
          style={{
            fontSize: 'var(--text-lg)',
            color: 'var(--foreground-secondary)',
            transition: 'transform 0.2s ease'
          }}
          className={isExpanded ? 'rotate-90' : ''}
        >
          ▶
        </span>
      </div>

      {isExpanded && (
        <div>
          <div
            className="flex gap-2 mb-4"
            style={{ marginBottom: 'var(--space-lg)' }}
          >
            <button
              onClick={handleSelectAll}
              style={{
                padding: 'var(--space-sm) var(--space-md)',
                background: 'var(--accent-soft)',
                border: '1px solid var(--accent)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--accent)',
                fontSize: 'var(--text-sm)',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--accent)';
                e.currentTarget.style.color = 'white';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'var(--accent-soft)';
                e.currentTarget.style.color = 'var(--accent)';
              }}
            >
              Select All
            </button>
            <button
              onClick={handleClearAll}
              style={{
                padding: 'var(--space-sm) var(--space-md)',
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--foreground-secondary)',
                fontSize: 'var(--text-sm)',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--accent)';
                e.currentTarget.style.color = 'var(--accent)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border)';
                e.currentTarget.style.color = 'var(--foreground-secondary)';
              }}
            >
              Clear All
            </button>
          </div>

          <div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
            style={{ gap: 'var(--space-md)' }}
          >
            {WIKIPEDIA_CATEGORIES.map((category) => {
              const isSelected = selectedCategories.includes(category.name);

              return (
                <label
                  key={category.name}
                  className="flex items-start gap-3 cursor-pointer transition-all"
                  style={{
                    padding: 'var(--space-md)',
                    background: isSelected ? 'var(--accent-soft)' : 'var(--surface)',
                    border: '1px solid',
                    borderColor: isSelected ? 'var(--accent)' : 'var(--border)',
                    borderRadius: 'var(--radius-md)',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.borderColor = 'var(--border)';
                      e.currentTarget.style.background = 'var(--background)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.borderColor = 'var(--border)';
                      e.currentTarget.style.background = 'var(--surface)';
                    }
                  }}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => handleCategoryToggle(category.name)}
                    style={{
                      width: '18px',
                      height: '18px',
                      marginTop: '2px',
                      accentColor: 'var(--accent)'
                    }}
                  />
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div
                      style={{
                        fontSize: 'var(--text-base)',
                        fontWeight: '500',
                        color: 'var(--foreground)',
                        marginBottom: 'var(--space-xs)'
                      }}
                    >
                      {category.displayName}
                    </div>
                    <div
                      style={{
                        fontSize: 'var(--text-sm)',
                        color: 'var(--foreground-secondary)',
                        lineHeight: 'var(--leading-tight)'
                      }}
                    >
                      {category.description}
                    </div>
                  </div>
                </label>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}