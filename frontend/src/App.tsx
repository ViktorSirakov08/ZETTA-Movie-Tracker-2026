import { useMemo, useState } from 'react'
import './App.css'

type Category = 'Newest' | 'Highest Rated' | 'Most Popular'
type Genre =
  | 'All'
  | 'Action'
  | 'Adventure'
  | 'Drama'
  | 'Comedy'
  | 'Crime'
  | 'Documentary'
  | 'Fantasy'
  | 'Mystery'
  | 'Romance'
  | 'Sci-Fi'
  | 'Thriller'

type MediaBlock = {
  id: number
  title: string
  description: string
  rating: number
  genre: Genre
  category: Category
  accent: 'sage' | 'panel' | 'light'
}

const categories: Category[] = ['Newest', 'Highest Rated', 'Most Popular']

const genres: Genre[] = [
  'All',
  'Action',
  'Adventure',
  'Drama',
  'Comedy',
  'Crime',
  'Documentary',
  'Fantasy',
  'Mystery',
  'Romance',
  'Sci-Fi',
  'Thriller',
]

const mediaBlocks: MediaBlock[] = [
  {
    id: 1,
    title: 'Neon Harbor',
    description: 'A moody sci-fi mystery about a city that listens back.',
    rating: 9.1,
    genre: 'Sci-Fi',
    category: 'Newest',
    accent: 'sage',
  },
  {
    id: 2,
    title: 'Glass Orchard',
    description: 'A tender family drama wrapped in an uneasy secret.',
    rating: 8.4,
    genre: 'Drama',
    category: 'Highest Rated',
    accent: 'panel',
  },
  {
    id: 3,
    title: 'Iron Satellite',
    description: 'Fast-paced survival on a failing orbital station.',
    rating: 9.3,
    genre: 'Action',
    category: 'Most Popular',
    accent: 'light',
  },
  {
    id: 4,
    title: 'Quiet Signals',
    description: 'A documentary about memory, broadcasts, and the people behind them.',
    rating: 8.0,
    genre: 'Documentary',
    category: 'Newest',
    accent: 'panel',
  },
  {
    id: 5,
    title: 'After the Bloom',
    description: 'A soft romance about timing, distance, and second chances.',
    rating: 8.6,
    genre: 'Romance',
    category: 'Highest Rated',
    accent: 'sage',
  },
  {
    id: 6,
    title: 'Midnight Ledger',
    description: 'A tense crime story where every clue costs something.',
    rating: 9.0,
    genre: 'Crime',
    category: 'Most Popular',
    accent: 'light',
  },
]

const interestKeywords = ['space', 'family', 'mystery', 'heist', 'future']

function App() {
  const [query, setQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<Category>('Newest')
  const [selectedGenre, setSelectedGenre] = useState<Genre>('All')
  const [searchByInterests, setSearchByInterests] = useState(false)

  const filteredBlocks = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()

    return mediaBlocks.filter((block) => {
      const matchesQuery =
        normalizedQuery.length === 0 ||
        [block.title, block.description, block.genre, block.category]
          .join(' ')
          .toLowerCase()
          .includes(normalizedQuery)

      const matchesCategory = block.category === selectedCategory
      const matchesGenre = block.genre === selectedGenre || selectedGenre === 'All'
      const matchesInterest = searchByInterests
        ? interestKeywords.some((keyword) =>
            [block.title, block.description, block.genre]
              .join(' ')
              .toLowerCase()
              .includes(keyword),
          )
        : true

      return matchesQuery && matchesCategory && matchesGenre && matchesInterest
    })
  }, [query, searchByInterests, selectedCategory, selectedGenre])

  return (
    <main className="home-page">
      <header className="top-bar">
        <div className="title-block">
          <p className="eyebrow">Movie tracker</p>
          <h1>Discover what to watch next</h1>
          <p className="subtitle">
            Browse a curated feed of media and narrow it down with one genre at a time.
          </p>
        </div>

        <label className="search-shell" aria-label="Search media">
          <span className="search-icon" aria-hidden="true">
            ⌕
          </span>
          <input
            type="search"
            placeholder="Search media"
            aria-label="Search media"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>

        <aside className="filter-menu" aria-label="Filter menu">
          <div className="filter-group">
            <span className="filter-label">Categories</span>
            <div className="chip-row">
              {categories.map((category) => (
                <button
                  key={category}
                  type="button"
                  className={
                    selectedCategory === category ? 'chip chip--active' : 'chip'
                  }
                  onClick={() => setSelectedCategory(category)}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          <div className="filter-group">
            <span className="filter-label">Genres</span>
            <select
              className="genre-select"
              value={selectedGenre}
              onChange={(event) => setSelectedGenre(event.target.value as Genre)}
              aria-label="Select a genre"
            >
              {genres.map((genre) => (
                <option key={genre} value={genre}>
                  {genre}
                </option>
              ))}
            </select>
          </div>

          <label className="interest-toggle">
            <input
              type="checkbox"
              checked={searchByInterests}
              onChange={(event) => setSearchByInterests(event.target.checked)}
            />
            <span>Search by interests</span>
          </label>
        </aside>
      </header>

      <section className="media-stage" aria-label="Media blocks">
        <div className="media-grid">
          {filteredBlocks.map((block) => (
            <article className="media-card" key={block.id}>
              <div className={`media-poster media-poster--${block.accent}`}>
                <span className="poster-label">Picture</span>
              </div>

              <div className="media-copy">
                <div className="media-head">
                  <h2>{block.title}</h2>
                  <span className="media-rating">{block.rating.toFixed(1)}</span>
                </div>
                <p>{block.description}</p>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  )
}

export default App
