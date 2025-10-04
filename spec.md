The following is a spec for a NextJS app with the following structure

Needed:
OpenAI API key for embeddings and GPT Vision prompt
Wikipedia article fetcher
Backend
The backend is a Postgres Database and a collection of API Routes that power the experience.
Database Schema
{ id: uuid, data: str, metadata: EntryMetadata, created_at, updated_at } where EntryMetadata is { url: str, article: str, section: str?, joins: [ids] img_url: str? }

API

/add - add a new entry to the ledger
/add-image - convert image to text, add entry to ledger same way as /add but with img_url
/search - semantic search
/join - join two entries together by id
/random - return a random highlight
/random-wiki - return a random wikipedia article
Frontend
Views
Distraction Free Reading
Keyboard controlled reader view. 

Press r to open to a random page.

Up and down arrows on your keyboard move between sentences (retain paragraph structure) (highlight past images too when images exist).

Press s to highlight the current sentence. Press p to highlight the entire paragraph of the current sentence
Ledger
A sorted by recently added table of entries with columns: data and metadata. Data is a highlight and metadata contains: a clickable link to [article > section](url) that opens a distraction free reader view directly to highlight, a list of joined to ids  

An checkbox option to group by article > section
Graph
UMAP view of all of the highlights in the ledger. Lines connect any joined entries.
Join
The join view has a random highlight selected at the top of the page that the users can see. 

Under the random highlight is a search bar where they can type in a query. 

The query is then sent off to the search endpoint where it does a semantic search and returns other highlights that are highlighted and their similarity scores. 

The user can then use their up and down buttons on their keyboard to select a highlight and press J to join it to the current highlight on the join page. 

The user can press R to surface a new highlight at the top of the page. 

If img_url present in MD, display it.

Have a collapsible list that shows users currently joined highlights. This list is updated whenever a user joins entries.