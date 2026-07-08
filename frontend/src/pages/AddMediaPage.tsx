import { useEffect, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { AuthLayout } from '../components/AuthLayout';
import '../components/forms.css';
import './AddMediaPage.css';
import { getMe } from '../api/auth';
import { ensureGenreIds } from '../api/genres';
import { addEpisode, addSeason, createMedia, uploadPoster } from '../api/media';
import {
  formatGenreLabel,
  GENRE_NAMES,
  INTEREST_LABELS,
  INTEREST_NAMES,
} from '../constants/interests';
import { getToken } from '../lib/auth-storage';
import { getValidAccessToken } from '../lib/session';

type MediaType = 'MOVIE' | 'SERIES';
type AgeRestriction = 'none' | '13' | '18';

const AGE_RESTRICTION_OPTIONS: { value: AgeRestriction; label: string }[] = [
  { value: 'none', label: 'None' },
  { value: '13', label: '13+' },
  { value: '18', label: '18+' },
];

interface EpisodeDraft {
  key: string;
  title: string;
}

interface SeasonDraft {
  key: string;
  episodes: EpisodeDraft[];
}

function createEpisodeDraft(): EpisodeDraft {
  return { key: crypto.randomUUID(), title: '' };
}

// Season/episode numbers are never typed by hand — they're derived from
// position here and re-derived server-side when submitted in order, so a
// season or episode can never be created out of sequence.
function createSeasonDraft(): SeasonDraft {
  return { key: crypto.randomUUID(), episodes: [createEpisodeDraft()] };
}

function readMultiSelectValues(event: ChangeEvent<HTMLSelectElement>): string[] {
  return Array.from(event.target.selectedOptions, (option) => option.value);
}

function getTodayIsoDate(): string {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function isFutureDate(dateStr: string): boolean {
  return dateStr > getTodayIsoDate();
}

export function AddMediaPage() {
  const token = getToken();
  const navigate = useNavigate();

  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const [mediaType, setMediaType] = useState<MediaType>('MOVIE');
  const [name, setName] = useState('');
  const [releaseDate, setReleaseDate] = useState('');
  const [description, setDescription] = useState('');
  const [durationMinutes, setDurationMinutes] = useState('');
  const [selectedGenreNames, setSelectedGenreNames] = useState<string[]>([]);
  const [selectedInterestNames, setSelectedInterestNames] = useState<string[]>(
    [],
  );
  const [ageRestriction, setAgeRestriction] = useState<AgeRestriction>('none');
  const [posterUrl, setPosterUrl] = useState('');
  const [posterPreview, setPosterPreview] = useState<string | null>(null);
  const [seasons, setSeasons] = useState<SeasonDraft[]>([createSeasonDraft()]);

  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!token) {
      return;
    }

    getValidAccessToken()
      .then((validToken) => {
        if (!validToken) {
          setAuthorized(false);
          return;
        }
        return getMe(validToken).then((user) => {
          setAuthorized(user.role === 'admin');
        });
      })
      .catch(() => {
        setAuthorized(false);
      });
  }, [token]);

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (authorized === false) {
    return <Navigate to="/home" replace />;
  }

  if (authorized === null) {
    return null;
  }

  async function handlePosterFileChange(event: ChangeEvent<HTMLInputElement>) {
    console.log('handlePosterFileChange fired', event.target.files);
    const file = event.target.files?.[0];
    if (!file || !token) return;

    if (!file.type.startsWith('image/')) {
      setError('Poster must be an image file.');
      return;
    }

    setError(null);
    const previewUrl = URL.createObjectURL(file);
    setPosterPreview(previewUrl);

    try {
      const validToken = await getValidAccessToken();
      if (!validToken) {
        throw new Error('Your session has expired. Please log in again.');
      }
      const uploadedUrl = await uploadPoster(validToken, file);
      setPosterUrl(uploadedUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload poster.');
    }
  }

  function addSeasonDraft() {
    setSeasons((prev) => [...prev, createSeasonDraft()]);
  }

  function removeSeasonDraft(seasonKey: string) {
    setSeasons((prev) =>
      prev.length === 1 ? prev : prev.filter((season) => season.key !== seasonKey),
    );
  }

  function addEpisodeDraft(seasonKey: string) {
    setSeasons((prev) =>
      prev.map((season) =>
        season.key === seasonKey
          ? { ...season, episodes: [...season.episodes, createEpisodeDraft()] }
          : season,
      ),
    );
  }

  function removeEpisodeDraft(seasonKey: string, episodeKey: string) {
    setSeasons((prev) =>
      prev.map((season) =>
        season.key === seasonKey
          ? {
              ...season,
              episodes:
                season.episodes.length === 1
                  ? season.episodes
                  : season.episodes.filter((episode) => episode.key !== episodeKey),
            }
          : season,
      ),
    );
  }

  function updateEpisodeTitle(seasonKey: string, episodeKey: string, title: string) {
    setSeasons((prev) =>
      prev.map((season) =>
        season.key === seasonKey
          ? {
              ...season,
              episodes: season.episodes.map((episode) =>
                episode.key === episodeKey ? { ...episode, title } : episode,
              ),
            }
          : season,
      ),
    );
  }

  function seasonDraftsAreValid(): boolean {
    return seasons.every((season) => season.episodes.every((ep) => ep.title.trim()));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!token) {
      return;
    }

    if (selectedGenreNames.length === 0) {
      setError('Select at least one genre.');
      return;
    }

    if (isFutureDate(releaseDate)) {
      setError('Release date cannot be in the future.');
      return;
    }

    const parsedDuration = durationMinutes.trim()
      ? Number(durationMinutes)
      : undefined;

    if (
      parsedDuration !== undefined &&
      (!Number.isInteger(parsedDuration) || parsedDuration <= 0)
    ) {
      setError('Duration must be a whole number greater than zero.');
      return;
    }

    if (mediaType === 'SERIES') {
      const parsed = parseEpisodeDrafts();
      if (!parsed || parsed.length === 0) {
        setError(
          'Episode and season must be numbers',
        );
      if (seasons.length === 0 || seasons.some((season) => season.episodes.length === 0)) {
        setError('Add at least one season with at least one episode.');
        return;
      }
      if (!seasonDraftsAreValid()) {
        setError('Every episode needs a title.');
        return;
      }
    }

    setSubmitting(true);
    try {
      const validToken = await getValidAccessToken();
      if (!validToken) {
        throw new Error('Your session has expired. Please log in again.');
      }

      const genreIds = await ensureGenreIds(selectedGenreNames);

      const created = await createMedia(validToken, {
        type: mediaType,
        name: name.trim(),
        releaseDate,
        description: description.trim(),
        genreIds,
        interestNames:
          selectedInterestNames.length > 0 ? selectedInterestNames : undefined,
        ageRestriction:
          ageRestriction === '18' ? 'PG18' : ageRestriction === '13' ? 'PG13' : 'NONE',
        durationMinutes: parsedDuration,
        posterUrl: posterUrl.trim() || undefined,
      });

      if (mediaType === 'SERIES') {
        for (const seasonDraft of seasons) {
          // addSeason creates the season's first episode itself (a season
          // is never empty), so only the remaining drafts need addEpisode.
          const [firstEpisode, ...restEpisodes] = seasonDraft.episodes;
          const season = await addSeason(validToken, created.id, firstEpisode.title.trim());
          for (const episodeDraft of restEpisodes) {
            await addEpisode(validToken, created.id, {
              seasonNum: season.seasonNum,
              title: episodeDraft.title.trim(),
            });
          }
        }
      }

      navigate('/home');
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Unable to create media.',
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="add-media-page">
      <AuthLayout
        variant="profile"
        quote="Every great catalog starts with one title. Add something worth watching."
        quoteAuthor="Admin tools"
      >
        <Link to="/home" className="back-link">
          ← Back to Home
        </Link>

        <h1 className="auth-title">Add media</h1>
        <p className="auth-subtitle">
          Create a new movie or series for the catalog
        </p>

        <form className="auth-form" onSubmit={handleSubmit}>
          {error && <div className="form-error-banner">{error}</div>}

          <div className="field">
            <label>Type</label>
            <div className="type-toggle" role="group" aria-label="Media type">
              <button
                type="button"
                className={mediaType === 'MOVIE' ? 'is-active' : ''}
                onClick={() => setMediaType('MOVIE')}
              >
                Movie
              </button>
              <button
                type="button"
                className={mediaType === 'SERIES' ? 'is-active' : ''}
                onClick={() => setMediaType('SERIES')}
              >
                Series
              </button>
            </div>
          </div>

          <div className="field">
            <label htmlFor="poster-url">Poster</label>
            <div className="poster-upload">
              <div className="poster-preview">
                {posterPreview || posterUrl ? (
                  <img
                    src={posterPreview ?? posterUrl}
                    alt="Poster preview"
                  />
                ) : (
                  <span>No poster yet</span>
                )}
              </div>
              <div className="poster-upload-actions">
                <input
                  id="poster-file"
                  type="file"
                  accept="image/*"
                  onChange={handlePosterFileChange}
                />
                <span className="field-hint">or paste an image URL</span>
              </div>
              <input
                id="poster-url"
                type="url"
                placeholder=""
                value={posterUrl.startsWith('data:') ? '' : posterUrl}
                onChange={(e) => {
                  setPosterUrl(e.target.value);
                  setPosterPreview(e.target.value || null);
                }}
              />
            </div>
          </div>

          <div className="field">
            <label htmlFor="media-name">Name</label>
            <input
              id="media-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="field-row">
            <div className="field">
              <label htmlFor="release-date">Release date</label>
              <input
                id="release-date"
                type="date"
                max={getTodayIsoDate()}
                value={releaseDate}
                onChange={(e) => setReleaseDate(e.target.value)}
                required
              />
            </div>

            <div className="field">
              <label htmlFor="duration">Duration (minutes)</label>
              <input
                id="duration"
                type="number"
                min="1"
                step="1"
                placeholder={mediaType === 'MOVIE' ? '' : ''}
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(e.target.value)}
              />
            </div>
          </div>

          <div className="field">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </div>

          <div className="field">
            <label htmlFor="genres">Genres</label>
            <p className="field-hint">Hold Ctrl to select multiple.</p>
            <select
              id="genres"
              multiple
              value={selectedGenreNames}
              onChange={(event) =>
                setSelectedGenreNames(readMultiSelectValues(event))
              }
              required
            >
              {GENRE_NAMES.map((genre) => (
                <option key={genre} value={genre}>
                  {formatGenreLabel(genre)}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label htmlFor="interests">Interests</label>
            <p className="field-hint">Hold Ctrl to select multiple.</p>
            <select
              id="interests"
              multiple
              value={selectedInterestNames}
              onChange={(event) =>
                setSelectedInterestNames(readMultiSelectValues(event))
              }
            >
              {INTEREST_NAMES.map((interest) => (
                <option key={interest} value={interest}>
                  {INTEREST_LABELS[interest]}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label htmlFor="age-restriction">Age restriction</label>
            <select
              id="age-restriction"
              size={AGE_RESTRICTION_OPTIONS.length}
              value={ageRestriction}
              onChange={(event) =>
                setAgeRestriction(event.target.value as AgeRestriction)
              }
            >
              {AGE_RESTRICTION_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {mediaType === 'SERIES' && (
            <div className="field">
              <label>Seasons &amp; Episodes</label>
              <p className="field-hint">
                Season and episode numbers are assigned automatically in order —
                just add seasons and episode titles.
              </p>
              {seasons.map((season, seasonIndex) => (
                <div key={season.key} className="episode-list season-draft">
                  <div className="season-draft-header">
                    <strong>Season {seasonIndex + 1}</strong>
                    <button
                      type="button"
                      className="btn-icon"
                      aria-label="Remove season"
                      onClick={() => removeSeasonDraft(season.key)}
                    >
                      ×
                    </button>
                  </div>
                  {season.episodes.map((episode, episodeIndex) => (
                    <div key={episode.key} className="season-draft-episode-row">
                      <span className="episode-number-preview">
                        E{episodeIndex + 1}
                      </span>
                      <input
                        type="text"
                        aria-label="Episode title"
                        placeholder="Episode title"
                        value={episode.title}
                        onChange={(e) =>
                          updateEpisodeTitle(season.key, episode.key, e.target.value)
                        }
                        required
                      />
                      <button
                        type="button"
                        className="btn-icon"
                        aria-label="Remove episode"
                        onClick={() => removeEpisodeDraft(season.key, episode.key)}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    className="btn-ghost"
                    onClick={() => addEpisodeDraft(season.key)}
                  >
                    + Add episode
                  </button>
                </div>
              ))}
              <button type="button" className="btn-ghost" onClick={addSeasonDraft}>
                + Add season
              </button>
            </div>
          )}

          <button className="btn-primary" type="submit" disabled={submitting}>
            {submitting ? 'Creating...' : 'Create media'}
          </button>
        </form>
      </AuthLayout>
    </div>
  );
}
