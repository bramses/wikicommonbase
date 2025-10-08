# Wikipedia Commonbase

A distraction-free Wikipedia reading experience with highlighting and connection features. Build your personal knowledge graph by highlighting passages and connecting related content using semantic search.

**Curious about the Commonbase Data Structure? [Learn more about it here!](https://github.com/your-commonbase/commonbase)**

<img width="3442" height="2548" alt="screencapture-localhost-3001-reader-2025-10-04-19_42_13" src="https://github.com/user-attachments/assets/4ef2cf1a-bf2f-4cc5-a505-0ffd10386b34" />
<img width="3436" height="1624" alt="Screenshot 2025-10-04 19-44-38" src="https://github.com/user-attachments/assets/0d12d9b0-e5c8-43b8-b49d-77b09496bc3a" />
<img width="2396" height="1416" alt="Screenshot 2025-10-04 19-44-24" src="https://github.com/user-attachments/assets/a0b19126-a3b0-47fe-87b8-102fa867cedc" />
<img width="3444" height="1626" alt="Screenshot 2025-10-04 19-44-09" src="https://github.com/user-attachments/assets/66db3f08-2e7d-4a00-b13a-11dd35b395e3" />


## Features

### 📖 Distraction-Free Reader
- Navigate Wikipedia articles sentence by sentence with keyboard controls
- Highlight interesting sentences and paragraphs as you read
- Clean, focused interface for deep reading
- Press `R` to load random articles for exploration

### 📥 Inbox
- Review unconnected highlights that need to be joined with related content
- Keep your knowledge graph organized and connected
- Click any unconnected highlight to open it in the Join page

### 🔗 Join Highlights
- Connect related highlights using semantic search
- Search for similar content across all your saved passages
- Visual feedback when entries are successfully joined
- Build a web of knowledge by joining passages that share common themes

### 📚 Highlight Ledger
- View all your saved highlights in a searchable, paginated table
- Group by article and section, or browse chronologically
- Export individual sections or entire ledger to Markdown
- Infinite scroll for easy browsing of large collections

### 🕸️ Knowledge Graph
- Visualize your highlights and their connections in an interactive graph
- Explore relationships between different concepts and ideas
- 256-color system for clear visual distinction between topics
- UMAP-powered layout for meaningful spatial relationships

## Getting Started

1. **Installation**
   ```bash
   npm install
   npm run dev
   ```

2. **First Steps**
   - Press `R` in the reader to load a random Wikipedia article
   - Use `↑↓` to navigate sentences, `S` to highlight sentences, `P` to highlight paragraphs
   - Visit the Join page to connect related highlights using semantic search
   - Explore your knowledge graph to discover unexpected connections

## Keyboard Shortcuts

### Global Navigation
- `C`: Home page
- `V`: Reader
- `B`: Ledger
- `I`: Inbox
- `N`: Join page
- `M`: Knowledge Graph

### Reader
- `↑↓`: Navigate sentences
- `S`: Highlight current sentence
- `P`: Highlight current paragraph
- `R`: Load random article

### Join Page
- `/`: Focus search input
- `Enter`: Execute search
- `↑↓`: Navigate search results
- `J`: Join selected highlight with current entry
- `O`: Open selected result in reader
- `R`: Load new random highlight

## Technology Stack

- **Frontend**: Next.js 15, React, TypeScript
- **Styling**: Tailwind CSS with custom design system
- **Database**: PostgreSQL with pgvector for semantic search
- **Visualization**: D3.js with UMAP for knowledge graph
- **Search**: Vector embeddings for semantic similarity

## Design Philosophy

Inspired by distraction-free writing tools like Calmly Writer, the interface prioritizes:
- Generous whitespace and comfortable reading typography
- Muted, non-distracting color palette
- Keyboard-first navigation for flow state
- Clear visual hierarchy and purposeful interactions

## Development

This is a Next.js project. Key commands:

```bash
npm run dev     # Start development server
npm run build   # Build for production
npm run start   # Start production server
npm run lint    # Run ESLint
```

The app uses:
- App Router for file-based routing
- Server Components where possible
- Client Components for interactive features
- PostgreSQL for persistent storage
- Vector embeddings for semantic search

---

Open [http://localhost:3000](http://localhost:3000) to start exploring Wikipedia in a new way.
