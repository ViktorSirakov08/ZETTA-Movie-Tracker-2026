import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import './HomePage.css';
import { getToken } from '../lib/auth-storage';
import { getAllMedia, type MediaItem } from '../api/media';
import { ApiError } from '../api/client';

type Category = 'Newest' | 'Highest Rated';

const categories: Category[] = ['Newest', 'Highest Rated'];
const posterAccents = ['sage', 'panel', 'light'] as const;

export function HomePage() {
  const token = getToken();

  const [media, setMedia] = useState<MediaItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] =
    useState<Category>('Newest');
  const [selectedGenre, setSelectedGenre] = useState<string>('All');
  const [filtersOpen, setFiltersOpen] = useState(false);

  useEffect(() => {
    getAllMedia()
      .then((items) => setMedia(items))
      .catch((err) => {
        setError(err instanceof ApiError ? err.message : 'Unable to load media.');
      })
      .finally(() => setLoading(false));
  }, []);

  const genreOptions = useMemo(() => {
    const names = new Set<string>();
    for (const item of media) {
      for (const genre of item.genres) {
        names.add(genre.name);
      }
    }
    return ['All', ...Array.from(names).sort((a, b) => a.localeCompare(b))];
  }, [media]);

  const filteredMedia = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return [...media]
      .filter((item) => {
        const matchesQuery =
          normalizedQuery.length === 0 ||
          [item.name, item.description, item.genres.map((g) => g.name).join(' ')]
            .join(' ')
            .toLowerCase()
            .includes(normalizedQuery);

        const matchesGenre =
          selectedGenre === 'All' ||
          item.genres.some((g) => g.name === selectedGenre);

        return matchesQuery && matchesGenre;
      })
      .sort((a, b) => {
        if (selectedCategory === 'Highest Rated') {
          return (b.rating ?? 0) - (a.rating ?? 0);
        }
        return (
          new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime()
        );
      });
  }, [media, query, selectedGenre, selectedCategory]);

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
                onChange={(event) => setSelectedGenre(event.target.value)}
                aria-label="Select a genre"
              >
                {genreOptions.map((genre) => (
                  <option key={genre} value={genre}>
                    {genre}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </aside>
      </header>

      <section className="media-stage" aria-label="Media blocks">
        {error && <p style={{ padding: '0 4px' }}>{error}</p>}

        {!error && !loading && media.length === 0 && (
          <p style={{ padding: '0 4px' }}>No media has been added yet.</p>
        )}

        <div className="media-grid">
          {filteredMedia.map((item, index) => (
            <article className="media-card" key={item.id}>
              <div
                className={`media-poster media-poster--${posterAccents[index % posterAccents.length]}`}
              >
                <span className="poster-label">Picture</span>
              </div>

              <div className="media-copy">
                <div className="media-head">
                  <h2>{item.name}</h2>
                  <span className="media-rating">
                    {item.rating === null ? 'No rating' : item.rating.toFixed(1)}
                  </span>
                </div>
                <p className="release-year">
                  Released {new Date(item.releaseDate).getFullYear()}
                </p>
                <p>{item.description}</p>
                <div className="genre-row" aria-label="Genres">
                  {item.genres.map((genre) => (
                    <span className="genre-pill" key={genre.id}>
                      {genre.name}
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