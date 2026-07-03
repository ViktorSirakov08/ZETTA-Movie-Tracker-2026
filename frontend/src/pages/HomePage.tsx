import { useMemo, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import './HomePage.css';
import { getToken } from '../lib/auth-storage';

type Category = 'All' | 'Newest' | 'Highest Rated';
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
  | 'Thriller';

type MediaBlock = {
  id: number;
  title: string;
  description: string;
  rating: number;
  releaseYear: number;
  genres: Genre[];
  accent: 'sage' | 'panel' | 'light';
};

const categories: Exclude<Category, 'All'>[] = ['Newest', 'Highest Rated'];

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
];

const mediaBlocks: MediaBlock[] = [
  {
    id: 1,
    title: 'Neon Harbor',
    description: 'A moody sci-fi mystery about a city that listens back.',
    rating: 9.1,
    releaseYear: 2026,
    genres: ['Action', 'Adventure', 'Fantasy'],
    accent: 'sage',
  },
  {
    id: 2,
    title: 'Glass Orchard',
    description: 'A tender family drama wrapped in an uneasy secret.',
    rating: 8.4,
    releaseYear: 2024,
    genres: ['Drama', 'Mystery'],
    accent: 'panel',
  },
  {
    id: 3,
    title: 'Iron Satellite',
    description: 'Fast-paced survival on a failing orbital station.',
    rating: 9.3,
    releaseYear: 2025,
    genres: ['Action', 'Sci-Fi', 'Thriller'],
    accent: 'light',
  },
  {
    id: 4,
    title: 'Quiet Signals',
    description:
      'A documentary about memory, broadcasts, and the people behind them.',
    rating: 8.0,
    releaseYear: 2023,
    genres: ['Documentary', 'Mystery'],
    accent: 'panel',
  },
  {
    id: 5,
    title: 'After the Bloom',
    description: 'A soft romance about timing, distance, and second chances.',
    rating: 8.6,
    releaseYear: 2025,
    genres: ['Romance', 'Drama'],
    accent: 'sage',
  },
  {
    id: 6,
    title: 'Midnight Ledger',
    description: 'A tense crime story where every clue costs something.',
    rating: 9.0,
    releaseYear: 2026,
    genres: ['Crime', 'Thriller', 'Mystery'],
    accent: 'light',
  },
];

const interestKeywords = ['space', 'family', 'mystery', 'heist', 'future'];

export function HomePage() {
  const token = getToken();

  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] =
    useState<Exclude<Category, 'All'>>('Newest');
  const [selectedGenre, setSelectedGenre] = useState<Genre>('All');
  const [searchByInterests, setSearchByInterests] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const filteredBlocks = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return [...mediaBlocks]
      .filter((block) => {
        const matchesQuery =
          normalizedQuery.length === 0 ||
          [
            block.title,
            block.description,
            block.genres.join(' '),
            String(block.releaseYear),
          ]
            .join(' ')
            .toLowerCase()
            .includes(normalizedQuery);

        const matchesGenre =
          selectedGenre === 'All' || block.genres.includes(selectedGenre);
        const matchesInterest = searchByInterests
          ? interestKeywords.some((keyword) =>
              [block.title, block.description, block.genres.join(' ')]
                .join(' ')
                .toLowerCase()
                .includes(keyword),
            )
          : true;

        return matchesQuery && matchesGenre && matchesInterest;
      })
      .sort((a, b) => {
        if (selectedCategory === 'Highest Rated') {
          return b.rating - a.rating || b.releaseYear - a.releaseYear;
        }

        return b.releaseYear - a.releaseYear || b.rating - a.rating;
      });
  }, [query, searchByInterests, selectedCategory, selectedGenre]);

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return (
    <main className="home-page">
      <header className="top-bar">
        <div className="nav-buttons">
          <Link to="/profile" className="profile-button">
            Profile
          </Link>
          <Link to="/history" className="profile-button">
            History
          </Link>
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

        <aside className="filter-menu-shell" aria-label="Filter menu">
          <button
            type="button"
            className={
              filtersOpen
                ? 'hamburger-button hamburger-button--open'
                : 'hamburger-button'
            }
            onClick={() => setFiltersOpen((open) => !open)}
            aria-expanded={filtersOpen}
            aria-controls="filter-panel"
            aria-label="Toggle filter menu"
          >
            <span />
            <span />
            <span />
          </button>

          <div
            id="filter-panel"
            className={
              filtersOpen ? 'filter-panel filter-panel--open' : 'filter-panel'
            }
          >
            <div className="filter-group">
              <span className="filter-label">Categories</span>
              <div className="chip-row">
                {categories.map((category) => (
                  <button
                    key={category}
                    type="button"
                    className={
                      selectedCategory === category
                        ? 'chip chip--active'
                        : 'chip'
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
                onChange={(event) =>
                  setSelectedGenre(event.target.value as Genre)
                }
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
                onChange={(event) =>
                  setSearchByInterests(event.target.checked)
                }
              />
              <span>Search by interests</span>
            </label>
          </div>
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
                  <span className="media-rating">
                    {block.rating.toFixed(1)}
                  </span>
                </div>
                <p className="release-year">Released {block.releaseYear}</p>
                <p>{block.description}</p>
                <div className="genre-row" aria-label="Genres">
                  {block.genres.map((genre) => (
                    <span className="genre-pill" key={genre}>
                      {genre}
                    </span>
                  ))}
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}