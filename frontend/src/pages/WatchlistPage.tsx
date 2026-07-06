import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import './HomePage.css';
import './WatchlistPage.css';
import { getToken } from '../lib/auth-storage';
import { getCurrentlyWatching, getWatchlist } from '../api/media';
import type { Media } from '../types/media';
import { formatGenreLabel } from '../constants/interests';

type Category = 'Newest' | 'Highest Rated';

const categories: Category[] = ['Newest', 'Highest Rated'];

function filterAndSort(
  items: Media[],
  normalizedQuery: string,
  selectedGenre: string,
  selectedCategory: Category,
): Media[] {
  return [...items]
    .filter((item) => {
      const genreNames = item.genres.map((g) => g.name).join(' ');

      const matchesQuery =
        normalizedQuery.length === 0 ||
        [item.name, item.description, genreNames]
          .join(' ')
          .toLowerCase()
          .includes(normalizedQuery);

      const matchesGenre =
        selectedGenre === 'All' || item.genres.some((g) => g.name === selectedGenre);

      return matchesQuery && matchesGenre;
    })
    .sort((a, b) => {
      if (selectedCategory === 'Highest Rated') {
        return (b.rating ?? 0) - (a.rating ?? 0);
      }
      return new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime();
    });
}

function MediaRow({ items }: { items: Media[] }) {
  if (items.length === 0) {
    return <p className="watch-section-empty">Nothing here yet.</p>;
  }

  return (
    <div className="media-row">
      {items.map((item) => (
        <article className="media-card" key={item.id}>
          <Link to={`/media/${item.id}`} className="media-card-link" key={item.id}>
            <div className="media-poster">
              {item.posterUrl ? (
                <img src={item.posterUrl} alt={item.name} />
              ) : (
                <span className="poster-label">Picture</span>
              )}
            </div>
          </Link>
          <div className="media-copy">
            <div className="media-head">
              <h2>{item.name}</h2>
              <span className="media-rating">
                {item.rating !== null ? item.rating.toFixed(1) : 'No Rating'}
              </span>
            </div>
            <p className="release-year">
              Released {new Date(item.releaseDate).getFullYear()}
            </p>
            <p>{item.description}</p>
            <div className="genre-row" aria-label="Genres">
              {item.genres.map((genre) => (
                <span className="genre-pill" key={genre.id}>
                  {formatGenreLabel(genre.name)}
                </span>
              ))}
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}

export function WatchlistPage() {
  const token = getToken();

  const [watchlist, setWatchlist] = useState<Media[]>([]);
  const [currentlyWatching, setCurrentlyWatching] = useState<Media[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Category>('Newest');
  const [selectedGenre, setSelectedGenre] = useState<string>('All');
  const [filtersOpen, setFiltersOpen] = useState(false);

  useEffect(() => {
    if (!token) {
      return;
    }

    Promise.all([getWatchlist(token), getCurrentlyWatching(token)])
      .then(([plannedItems, watchingItems]) => {
        const filteredWatchlist = plannedItems.filter((item) => {
          const isExplicitlyWatched = localStorage.getItem(`watched_${item.id}`) === 'true';
          const isRemovedFromWatchlist = localStorage.getItem(`watchlist_${item.id}`) === 'false';
          
          return !isExplicitlyWatched && !isRemovedFromWatchlist;
        });

        const filteredCurrentlyWatching = watchingItems.filter((item) => {
          const isExplicitlyWatched = localStorage.getItem(`watched_${item.id}`) === 'true';
          return !isExplicitlyWatched;
        });

        setWatchlist(filteredWatchlist);
        setCurrentlyWatching(filteredCurrentlyWatching);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Unable to load your lists.');
      })
      .finally(() => setLoading(false));
  }, [token]);

  const genreOptions = useMemo(() => {
    const names = new Set<string>();
    for (const item of [...watchlist, ...currentlyWatching]) {
      for (const genre of item.genres) {
        names.add(genre.name);
      }
    }
    return ['All', ...Array.from(names).sort((a, b) => a.localeCompare(b))];
  }, [watchlist, currentlyWatching]);

  const normalizedQuery = query.trim().toLowerCase();
  const filteredWatchlist = useMemo(
    () => filterAndSort(watchlist, normalizedQuery, selectedGenre, selectedCategory),
    [watchlist, normalizedQuery, selectedGenre, selectedCategory],
  );
  const filteredCurrentlyWatching = useMemo(
    () =>
      filterAndSort(currentlyWatching, normalizedQuery, selectedGenre, selectedCategory),
    [currentlyWatching, normalizedQuery, selectedGenre, selectedCategory],
  );

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return (
    <main className="home-page">
      <header className="top-bar">
        <Link to="/home" className="profile-button">
          Home
        </Link>

        <div className="center-controls">
          <label className="search-shell" aria-label="Search your lists">
            <span className="search-icon" aria-hidden="true">
              ⌕
            </span>
            <input
              type="search"
              placeholder="Search your lists"
              aria-label="Search your lists"
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
        </div>
      </header>

      <section className="watch-sections" aria-label="Watchlist and currently watching">
        {error && <p style={{ padding: '0 4px' }}>{error}</p>}

        <div className="watch-section">
          <h2 className="watch-section-title">Watchlist</h2>
          {!error && !loading && <MediaRow items={filteredWatchlist} />}
        </div>

        <div className="watch-section">
          <h2 className="watch-section-title">Currently Watching</h2>
          {!error && !loading && <MediaRow items={filteredCurrentlyWatching} />}
        </div>
      </section>
    </main>
  );
}