import { useEffect, useState } from 'react';
import { getToken } from '../lib/auth-storage';
import { setWatchStatus, getWatchStatus } from '../api/media';
import { useParams, Link } from 'react-router-dom';
import { fetchMediaById } from '../api/media';
import type { Media } from '../types/media';
import './MediaPage.css';


export function MediaDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [media, setMedia] = useState<Media | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [watchStatus, setWatchStatusState] = useState<string>('NOT_WATCHED');
  
  const [isWatchlistAdded, setIsWatchlistAdded] = useState(() => {
    const saved = localStorage.getItem(`watchlist_${id}`);
    return saved === 'true';
  });

  const [isWatchedMarked, setIsWatchedMarked] = useState(() => {
    const saved = localStorage.getItem(`watched_${id}`);
    return saved === 'true';
  });

  useEffect(() => {
    if (!id) return;
    const token = getToken();

    fetchMediaById(id)
        .then(setMedia)
        .catch((err) => setError(err.message))
        .finally(() => setLoading(false));

    if (token) {
        getWatchStatus(token, id).then(setWatchStatusState).catch(() => {});
    }
  }, [id]);

  async function updateStatus(status: 'PLANNED_TO_WATCH' | 'WATCHING' | 'WATCHED') {
      const token = getToken();
      if (!token || !id) return;
      await setWatchStatus(token, id, status);
      setWatchStatusState(status);
  }

  function handlePlay() {
      updateStatus('WATCHING');
  }

  function handleAddToWatchlist() {
    const nextState = !isWatchlistAdded;
    setIsWatchlistAdded(nextState);
    localStorage.setItem(`watchlist_${id}`, String(nextState));
    
    if (nextState) {
        setIsWatchedMarked(false);
        localStorage.removeItem(`watched_${id}`);
        updateStatus('PLANNED_TO_WATCH');
    }
  }

  function handleMarkAsWatched() {
    const nextState = !isWatchedMarked;
    setIsWatchedMarked(nextState);
    localStorage.setItem(`watched_${id}`, String(nextState));
    
    if (nextState) {
        setIsWatchlistAdded(false);
        localStorage.removeItem(`watchlist_${id}`);
        updateStatus('WATCHED');
    }
  }

  if (loading) return <div className="detail-status">Loading...</div>;
  if (error) return <div className="detail-status">Something went wrong: {error}</div>;
  if (!media) return <div className="detail-status">Media not found.</div>;

  const releaseYear = new Date(media.releaseDate).getFullYear();

  return (
    <main className="media-detail-page">
      <Link to="/home" className="back-link">
        ← Back
      </Link>

      <div className="detail-layout">
        <div className="detail-poster">
          {media.posterUrl ? (
            <img src={media.posterUrl} alt={media.name} />
          ) : (
            <span className="poster-label">Picture</span>
          )}
        </div>

        <div className="detail-body">
          <div className="detail-heading">
            <div>
              <h1>{media.name}</h1>
              <p className="detail-meta">
                {releaseYear} · {media.type === 'MOVIE' ? 'Movie' : 'Series'}
                {media.durationMinutes ? ` · ${media.durationMinutes}m` : ''}
                {media.ageRestricted ? ' · Age Restricted' : ''}
              </p>
            </div>
            <span className="detail-rating">
              {media.rating !== null ? media.rating.toFixed(1) : 'No Rating'}
            </span>
            <Link to="/home" className="rate-button">
                Rate?
            </Link>
          </div>

          <div className="genre-row" aria-label="Genres">
            {media.genres.map((genre) => (
              <span className="genre-pill" key={genre.id}>
                {genre.name}
              </span>
            ))}
          </div>

          <p className="detail-description">{media.description}</p>

          <div className="detail-actions">
            <button className="action-button action-button--primary" onClick={handlePlay}>
              ▶ Play
            </button>
            <button className="action-button" onClick={handleAddToWatchlist}>
              {isWatchlistAdded ? '✓ Added to Watchlist' : '+ Add to Watchlist'}
            </button>
            <button className="action-button" onClick={handleMarkAsWatched}>
              {isWatchedMarked ? '✓ Marked' : '+ Mark as Watched'}
            </button>
          </div>

          {media.type === 'SERIES' && (
            <EpisodeList mediaId={media.id} episodes={media.episodes ?? []} />
          )}
        </div>
      </div>
    </main>
  );
}

function EpisodeList({
  episodes,
}: {
  mediaId: string;
  episodes: NonNullable<Media['episodes']>;
}) {
  if (episodes.length === 0) {
    return (
      <div className="episode-section">
        <h2>Episodes</h2>
        <p className="detail-meta">No episodes added yet.</p>
      </div>
    );
  }

  const bySeason = episodes.reduce<Record<number, typeof episodes>>((acc, ep) => {
    (acc[ep.seasonNum] ??= []).push(ep);
    return acc;
  }, {});

  return (
    <div className="episode-section">
      <h2>Episodes</h2>
      {Object.entries(bySeason).map(([season, seasonEpisodes]) => (
        <div key={season} className="season-group">
          <h3>Season {season}</h3>
          <ul className="episode-list">
            {seasonEpisodes
              .sort((a, b) => a.episodeNum - b.episodeNum)
              .map((ep) => (
                <li key={ep.id} className="episode-row">
                  <span className="episode-number">E{ep.episodeNum}</span>
                  <span className="episode-title">{ep.title}</span>
                </li>
              ))}
          </ul>
        </div>
      ))}
    </div>
  );
}