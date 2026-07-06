import { useEffect, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { AuthLayout } from '../components/AuthLayout';
import '../components/forms.css';
import './AddMediaPage.css';
import { getMe } from '../api/auth';
import { ensureGenreIds } from '../api/genres';
import {
  addEpisode,
  createMedia,
  type CreateEpisodePayload,
} from '../api/media';
import {
  formatGenreLabel,
  GENRE_NAMES,
  INTEREST_LABELS,
  INTEREST_NAMES,
} from '../constants/interests';
import { getToken } from '../lib/auth-storage';

type MediaType = 'MOVIE' | 'SERIES';
type AgeRestriction = 'none' | '13' | '18';

const AGE_RESTRICTION_OPTIONS: { value: AgeRestriction; label: string }[] = [
  { value: 'none', label: 'None' },
  { value: '13', label: '13+' },
  { value: '18', label: '18+' },
];

interface EpisodeDraft {
  key: string;
  seasonNum: string;
  episodeNum: string;
  title: string;
}

function createEpisodeDraft(): EpisodeDraft {
  return {
    key: crypto.randomUUID(),
    seasonNum: '',
    episodeNum: '',
    title: '',
  };
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Failed to read poster file.'));
    reader.readAsDataURL(file);
  });
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
  const [episodes, setEpisodes] = useState<EpisodeDraft[]>([
    createEpisodeDraft(),
  ]);

  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!token) {
      return;
    }

    getMe(token)
      .then((user) => {
        setAuthorized(user.role === 'admin');
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

  function handlePosterFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (!file.type.startsWith('image/')) {
      setError('Poster must be an image file.');
      return;
    }

    setError(null);
    const previewUrl = URL.createObjectURL(file);
    setPosterPreview(previewUrl);

    readFileAsDataUrl(file)
      .then((dataUrl) => {
        setPosterUrl(dataUrl);
      })
      .catch(() => {
        setError('Failed to load poster image.');
      });
  }

  function updateEpisode(
    key: string,
    field: keyof Omit<EpisodeDraft, 'key'>,
    value: string,
  ) {
    setEpisodes((prev) =>
      prev.map((episode) =>
        episode.key === key ? { ...episode, [field]: value } : episode,
      ),
    );
  }

  function addEpisodeRow() {
    setEpisodes((prev) => [...prev, createEpisodeDraft()]);
  }

  function removeEpisodeRow(key: string) {
    setEpisodes((prev) =>
      prev.length === 1 ? prev : prev.filter((episode) => episode.key !== key),
    );
  }

  function parseEpisodeDrafts(): CreateEpisodePayload[] | null {
    const parsed: CreateEpisodePayload[] = [];

    for (const episode of episodes) {
      const seasonNum = Number(episode.seasonNum);
      const episodeNum = Number(episode.episodeNum);
      const title = episode.title.trim();

      if (!title) {
        return null;
      }

      if (
        !Number.isInteger(seasonNum) ||
        seasonNum < 1 ||
        !Number.isInteger(episodeNum) ||
        episodeNum < 1
      ) {
        return null;
      }

      parsed.push({ seasonNum, episodeNum, title });
    }

    return parsed;
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

    let episodePayload: CreateEpisodePayload[] = [];
    if (mediaType === 'SERIES') {
      const parsed = parseEpisodeDrafts();
      if (!parsed || parsed.length === 0) {
        setError(
          'Add at least one episode with a valid season, number, and title.',
        );
        return;
      }
      episodePayload = parsed;
    }

    setSubmitting(true);
    try {
      const genreIds = await ensureGenreIds(selectedGenreNames);

      const created = await createMedia(token, {
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
        for (const episode of episodePayload) {
          await addEpisode(token, created.id, episode);
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
                placeholder="https://example.com/poster.jpg"
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
                placeholder={mediaType === 'MOVIE' ? '120' : 'Optional'}
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
              <label>Episodes</label>
              <div className="episode-list">
                {episodes.map((episode) => (
                  <div key={episode.key} className="episode-row">
                    <input
                      type="text"
                      inputMode="numeric"
                      aria-label="Season number"
                      placeholder="Season"
                      value={episode.seasonNum}
                      onChange={(e) =>
                        updateEpisode(episode.key, 'seasonNum', e.target.value)
                      }
                      required
                    />
                    <input
                      type="text"
                      inputMode="numeric"
                      aria-label="Episode number"
                      placeholder="Episode"
                      value={episode.episodeNum}
                      onChange={(e) =>
                        updateEpisode(episode.key, 'episodeNum', e.target.value)
                      }
                      required
                    />
                    <input
                      type="text"
                      aria-label="Episode title"
                      placeholder="Episode title"
                      value={episode.title}
                      onChange={(e) =>
                        updateEpisode(episode.key, 'title', e.target.value)
                      }
                      required
                    />
                    <button
                      type="button"
                      className="btn-icon"
                      aria-label="Remove episode"
                      onClick={() => removeEpisodeRow(episode.key)}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
              <button
                type="button"
                className="btn-ghost"
                onClick={addEpisodeRow}
              >
                + Add episode
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
