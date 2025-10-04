'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { WikipediaContent } from '@/lib/wikipedia';
import { EntryMetadata } from '@/lib/types';

interface DistractionFreeReaderProps {
  content: WikipediaContent;
  initialHighlight?: string;
}

interface Paragraph {
  text: string;
  index: number;
  sectionTitle?: string;
  isHeading: boolean;
  headingLevel?: number;
  sentences?: Sentence[];
}

interface Sentence {
  text: string;
  index: number;
  paragraphIndex: number;
}

export default function DistractionFreeReader({ content, initialHighlight }: DistractionFreeReaderProps) {
  const [paragraphs, setParagraphs] = useState<Paragraph[]>([]);
  const [sentences, setSentences] = useState<Sentence[]>([]);
  const [currentSentenceIndex, setCurrentSentenceIndex] = useState(0);
  const [highlightedSentences, setHighlightedSentences] = useState<Set<number>>(new Set());
  const sentenceRefs = useRef<(HTMLSpanElement | null)[]>([]);

  const parseParagraphs = useCallback(() => {
    const allParagraphs: Paragraph[] = [];
    let globalIndex = 0;
    let currentSection = '';

    // Use fullContent for parsing paragraphs
    const fullContent = content.fullContent || content.extract;
    console.log(`Full content preview: "${fullContent.substring(0, 200)}..."`);

    // Split by double newlines, but also split headers that might be on same line as content
    const parts = fullContent
      .split(/\n\s*\n/)
      .flatMap(part => {
        // If a part contains headers mixed with content, split them
        const lines = part.split('\n');
        const result = [];
        let currentPart = '';

        for (const line of lines) {
          const trimmedLine = line.trim();
          if (trimmedLine.match(/^={2,6}\s*.+?\s*={2,6}$/)) {
            // This line is a header
            if (currentPart.trim()) {
              result.push(currentPart.trim());
              currentPart = '';
            }
            result.push(trimmedLine);
          } else {
            // Regular content line
            currentPart += (currentPart ? '\n' : '') + line;
          }
        }

        if (currentPart.trim()) {
          result.push(currentPart.trim());
        }

        return result;
      })
      .filter(part => part.trim());

    console.log(`Parsing ${parts.length} parts from content`);
    console.log(`First few parts:`, parts.slice(0, 5));

    parts.forEach((part, partIndex) => {
      const trimmedPart = part.trim();
      if (trimmedPart) {
        console.log(`Part ${partIndex}: "${trimmedPart.substring(0, 50)}${trimmedPart.length > 50 ? '...' : ''}"`);

        // Check if this is a section heading (any level: ==, ===, ====, etc.)
        const headingMatch = trimmedPart.match(/^(={2,6})\s*(.+?)\s*\1$/);
        const isStandaloneHeading = headingMatch &&
                                  trimmedPart === headingMatch[0]; // Entire paragraph is just the heading

        if (headingMatch) {
          const level = headingMatch[1].length;
          const title = headingMatch[2];
          console.log(`Potential heading level ${level}: "${title}", standalone: ${isStandaloneHeading}`);
        }

        if (isStandaloneHeading) {
          // This is a section heading
          const level = headingMatch[1].length;
          const title = headingMatch[2];
          currentSection = title;
          console.log(`Found section heading level ${level}: "${title}"`);
          allParagraphs.push({
            text: title,
            index: globalIndex++,
            sectionTitle: title,
            isHeading: true,
            headingLevel: level
          });
        } else {
          // This is a regular paragraph - clean up any stray heading markers that aren't section headers
          const cleanedText = trimmedPart.replace(/^(={2,6})\s*(.+?)\s*\1/gm, (match, equals, title) => {
            // If it's embedded in a larger paragraph, just return the title without heading markers
            return title;
          });

          // Split paragraph into sentences
          const sentencesInParagraph = cleanedText
            .split(/(?<=[.!?])\s+(?=[A-Z])/)
            .filter(s => s.trim().length > 0)
            .map(sentence => sentence.trim());

          allParagraphs.push({
            text: cleanedText,
            index: globalIndex++,
            sectionTitle: currentSection || undefined,
            isHeading: false,
            sentences: sentencesInParagraph.map((sentenceText, sentenceIndex) => ({
              text: sentenceText,
              index: -1, // Will be set later
              paragraphIndex: globalIndex - 1
            }))
          });
        }
      }
    });

    console.log(`Parsed ${allParagraphs.length} paragraphs`);
    setParagraphs(allParagraphs);

    // Extract all sentences from all paragraphs and assign global indices
    const allSentences: Sentence[] = [];
    let sentenceGlobalIndex = 0;

    allParagraphs.forEach(paragraph => {
      if (paragraph.sentences) {
        paragraph.sentences.forEach(sentence => {
          allSentences.push({
            ...sentence,
            index: sentenceGlobalIndex++
          });
        });
      }
    });

    console.log(`Extracted ${allSentences.length} sentences`);
    setSentences(allSentences);

    // Find initial sentence if highlight specified
    if (initialHighlight && allSentences.length > 0) {
      const foundIndex = allSentences.findIndex(s =>
        s.text.toLowerCase().includes(initialHighlight.toLowerCase())
      );
      if (foundIndex !== -1) {
        setCurrentSentenceIndex(foundIndex);
      }
    }
  }, [content, initialHighlight]);

  useEffect(() => {
    parseParagraphs();
  }, [parseParagraphs]);

  // Initialize refs array when sentences change
  useEffect(() => {
    sentenceRefs.current = new Array(sentences.length).fill(null);
  }, [sentences.length]);

  const scrollToSentence = useCallback((index: number) => {
    const sentenceElement = sentenceRefs.current[index];
    if (sentenceElement) {
      sentenceElement.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    }
  }, []);

  const handleKeyDown = useCallback(async (event: KeyboardEvent) => {
    console.log(`Key pressed: ${event.key}, sentences: ${sentences.length}, currentIndex: ${currentSentenceIndex}`);

    if (sentences.length === 0) {
      console.log('No sentences available');
      return;
    }

    switch (event.key) {
      case 'ArrowUp':
        event.preventDefault();
        console.log('Arrow Up pressed');
        setCurrentSentenceIndex(prev => {
          const newIndex = Math.max(0, prev - 1);
          console.log(`Moving from ${prev} to ${newIndex}`);
          scrollToSentence(newIndex);
          return newIndex;
        });
        break;
      case 'ArrowDown':
        event.preventDefault();
        console.log('Arrow Down pressed');
        setCurrentSentenceIndex(prev => {
          const newIndex = Math.min(sentences.length - 1, prev + 1);
          console.log(`Moving from ${prev} to ${newIndex}`);
          scrollToSentence(newIndex);
          return newIndex;
        });
        break;
      case 's':
        event.preventDefault();
        console.log('S pressed');
        await highlightCurrentSentence();
        break;
      case 'p':
        event.preventDefault();
        console.log('P pressed');
        await highlightCurrentParagraph();
        break;
      case 'r':
        event.preventDefault();
        console.log('R pressed');
        await loadRandomArticle();
        break;
    }
  }, [sentences, currentSentenceIndex, scrollToSentence]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const highlightCurrentSentence = async () => {
    const currentSentence = sentences[currentSentenceIndex];
    if (!currentSentence) return;

    // Find the paragraph this sentence belongs to
    const paragraph = paragraphs.find(p => p.index === currentSentence.paragraphIndex);

    const metadata: EntryMetadata = {
      url: content.url,
      article: content.title,
      section: paragraph?.sectionTitle,
      joins: []
    };

    try {
      const response = await fetch('/api/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: currentSentence.text, metadata })
      });

      if (response.ok) {
        setHighlightedSentences(prev => new Set([...prev, currentSentence.index]));
      }
    } catch (error) {
      console.error('Error highlighting sentence:', error);
    }
  };

  const highlightCurrentParagraph = async () => {
    const currentSentence = sentences[currentSentenceIndex];
    if (!currentSentence) return;

    // Find the paragraph this sentence belongs to
    const paragraph = paragraphs.find(p => p.index === currentSentence.paragraphIndex);
    if (!paragraph) return;

    const metadata: EntryMetadata = {
      url: content.url,
      article: content.title,
      section: paragraph.sectionTitle,
      joins: []
    };

    try {
      const response = await fetch('/api/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: paragraph.text, metadata })
      });

      if (response.ok) {
        // Highlight all sentences in this paragraph
        const paragraphSentences = sentences.filter(s => s.paragraphIndex === paragraph.index);
        paragraphSentences.forEach(s => {
          setHighlightedSentences(prev => new Set([...prev, s.index]));
        });
      }
    } catch (error) {
      console.error('Error highlighting paragraph:', error);
    }
  };

  const loadRandomArticle = async () => {
    try {
      const response = await fetch('/api/random-wiki');
      if (response.ok) {
        const { article } = await response.json();
        window.location.href = `/reader?article=${encodeURIComponent(article.title)}`;
      }
    } catch (error) {
      console.error('Error loading random article:', error);
    }
  };

  if (!content.fullContent && !content.extract) {
    return (
      <div className="p-8 text-center">
        <div className="text-lg mb-2">Loading article...</div>
        <div className="text-sm text-gray-600">
          Fetching content for {content.title}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-8 font-serif leading-relaxed">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 text-center">{content.title}</h1>
        <div className="text-center text-sm text-gray-600 dark:text-gray-400">
          {sentences.length} sentences • {paragraphs.length} paragraphs • {(content.fullContent || content.extract).length} characters
        </div>
        {content.image && (
          <div className="flex justify-center mt-4">
            <img
              src={content.image.source}
              alt={content.title}
              className="max-w-md max-h-64 object-contain rounded shadow-lg"
            />
          </div>
        )}
      </div>

      <div className="prose prose-lg dark:prose-invert max-w-none space-y-4">
        {paragraphs.map((paragraph, paragraphIndex) => {
          if (paragraph.isHeading) {
            const level = paragraph.headingLevel || 2;
            const HeadingTag = `h${Math.min(level, 6)}` as keyof JSX.IntrinsicElements;
            const headingClasses = {
              2: 'text-2xl font-bold mt-8 mb-4',
              3: 'text-xl font-bold mt-6 mb-3',
              4: 'text-lg font-semibold mt-5 mb-2',
              5: 'text-base font-semibold mt-4 mb-2',
              6: 'text-sm font-semibold mt-3 mb-1'
            };
            const headingClass = headingClasses[level as keyof typeof headingClasses] || headingClasses[2];

            return (
              <HeadingTag
                key={paragraph.index}
                className={headingClass}
              >
                {paragraph.text}
              </HeadingTag>
            );
          }

          // For regular paragraphs, render sentences with highlighting
          const paragraphSentences = sentences.filter(s => s.paragraphIndex === paragraph.index);

          return (
            <div key={paragraph.index} className="mb-4 leading-relaxed">
              {paragraphSentences.map((sentence, sentenceIndex) => {
                const globalSentenceIndex = sentences.findIndex(s => s.index === sentence.index);
                const isCurrentSentence = globalSentenceIndex === currentSentenceIndex;
                const isHighlighted = highlightedSentences.has(sentence.index);

                return (
                  <span
                    key={sentence.index}
                    ref={el => sentenceRefs.current[globalSentenceIndex] = el}
                    className={`
                      ${isCurrentSentence ? 'bg-blue-200 dark:bg-blue-800 border-2 border-blue-500 rounded px-2 py-1 font-semibold' : ''}
                      ${isHighlighted ? 'bg-yellow-200 dark:bg-yellow-800 border border-yellow-500 rounded px-1' : ''}
                      ${isCurrentSentence && isHighlighted ? 'bg-green-200 dark:bg-green-800 border-2 border-green-500' : ''}
                    `}
                  >
                    {sentence.text}
                    {sentenceIndex < paragraphSentences.length - 1 && ' '}
                  </span>
                );
              })}
            </div>
          );
        })}
      </div>

      <div className="fixed bottom-4 right-4 bg-white dark:bg-gray-800 p-4 rounded shadow-lg text-sm">
        <div>↑↓: Navigate sentences ({currentSentenceIndex + 1}/{sentences.length})</div>
        <div>S: Highlight current sentence</div>
        <div>P: Highlight full paragraph</div>
        <div>R: Random article</div>
        {sentences[currentSentenceIndex] && (
          <div className="mt-2 text-xs text-gray-500">
            Current: Sentence {currentSentenceIndex + 1}
            {(() => {
              const currentSentence = sentences[currentSentenceIndex];
              const paragraph = paragraphs.find(p => p.index === currentSentence.paragraphIndex);
              return paragraph?.sectionTitle && (
                <div>Section: {paragraph.sectionTitle}</div>
              );
            })()}
          </div>
        )}
      </div>
    </div>
  );
}