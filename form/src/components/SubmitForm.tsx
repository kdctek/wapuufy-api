import { useMemo, useState } from 'react';
import type { GitHubUser, SubmissionType } from '../types/wapuu';
import { FileUpload } from './FileUpload';
import { WapuuPreview } from './WapuuPreview';
import { SubmitSuccess } from './SubmitSuccess';
import { slugify, validate2DForm, validate3DForm, type ValidationErrors } from '../lib/validate';
import { submit2DWapuu, submit3DModel } from '../lib/github';

function InfoIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  );
}

interface Props {
  token: string;
  user: GitHubUser;
}

export function SubmitForm({ token, user }: Props) {
  const [tab, setTab] = useState<SubmissionType>('2d');
  const [step, setStep] = useState<'form' | 'preview' | 'submitting' | 'success'>('form');
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [submitError, setSubmitError] = useState('');
  const [statusMsg, setStatusMsg] = useState('');
  const [prUrl, setPrUrl] = useState('');

  // 2D fields
  const [file2d, setFile2d] = useState<File | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [authorName, setAuthorName] = useState('');
  const [authorUrl, setAuthorUrl] = useState('');
  const [wapuuUrl, setWapuuUrl] = useState('');
  const [event, setEvent] = useState('');
  const [tags, setTags] = useState('');

  // 3D fields
  const [modelFile, setModelFile] = useState<File | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [modelName, setModelName] = useState('');
  const [modelDesc, setModelDesc] = useState('');
  const [modelAuthor, setModelAuthor] = useState('');
  const [modelAuthorUrl, setModelAuthorUrl] = useState('');
  const [animations, setAnimations] = useState('');
  const [license, setLicense] = useState('CC-BY-SA-4.0');

  const preview2dUrl = useMemo(() => file2d ? URL.createObjectURL(file2d) : undefined, [file2d]);
  const previewThumbUrl = useMemo(() => thumbnailFile ? URL.createObjectURL(thumbnailFile) : undefined, [thumbnailFile]);

  function handlePreview() {
    if (tab === '2d') {
      const errs = validate2DForm({ name, description, authorName, authorUrl, wapuuUrl, file: file2d });
      setErrors(errs);
      if (Object.keys(errs).length === 0) setStep('preview');
    } else {
      const errs = validate3DForm({
        name: modelName, description: modelDesc, authorName: modelAuthor,
        authorUrl: modelAuthorUrl, animations, modelFile, thumbnailFile,
      });
      setErrors(errs);
      if (Object.keys(errs).length === 0) setStep('preview');
    }
  }

  async function handleSubmit() {
    setStep('submitting');
    setSubmitError('');
    setStatusMsg('Starting...');

    try {
      let url: string;
      if (tab === '2d') {
        url = await submit2DWapuu({
          token, username: user.login, file: file2d!, name, description,
          authorName, authorUrl, wapuuUrl, event, tags,
        }, setStatusMsg);
      } else {
        url = await submit3DModel({
          token, username: user.login, modelFile: modelFile!, thumbnailFile: thumbnailFile!,
          name: modelName, description: modelDesc, authorName: modelAuthor,
          authorUrl: modelAuthorUrl, animations, license,
        }, setStatusMsg);
      }
      setPrUrl(url);
      setStep('success');
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Submission failed');
      setStep('preview');
    }
  }

  function handleReset() {
    setStep('form');
    setErrors({});
    setSubmitError('');
    setPrUrl('');
    setFile2d(null);
    setName('');
    setDescription('');
    setAuthorName('');
    setAuthorUrl('');
    setWapuuUrl('');
    setEvent('');
    setTags('');
    setModelFile(null);
    setThumbnailFile(null);
    setModelName('');
    setModelDesc('');
    setModelAuthor('');
    setModelAuthorUrl('');
    setAnimations('');
    setLicense('CC-BY-SA-4.0');
  }

  if (step === 'success') {
    return <SubmitSuccess prUrl={prUrl} onReset={handleReset} />;
  }

  if (step === 'submitting') {
    return (
      <div className="wapuu-submitting">
        <div className="wapuu-spinner" />
        <div className="wapuu-submitting__text">{statusMsg}</div>
      </div>
    );
  }

  if (step === 'preview') {
    return (
      <div style={{ animation: 'fadeInUp 0.4s ease' }}>
        <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: 'var(--space-md)' }}>
          Review your submission
        </h3>
        {submitError && (
          <div style={{
            padding: 'var(--space-md)',
            borderRadius: 'var(--radius-sm)',
            backgroundColor: 'color-mix(in srgb, var(--error) 10%, transparent)',
            border: '1px solid color-mix(in srgb, var(--error) 30%, transparent)',
            color: 'var(--error)',
            fontSize: '0.875rem',
            marginBottom: 'var(--space-md)',
          }}>
            {submitError}
          </div>
        )}
        {tab === '2d' ? (
          <WapuuPreview
            imageUrl={preview2dUrl}
            name={name}
            authorName={authorName}
            authorUrl={authorUrl}
            description={description}
            event={event}
            tags={tags}
          />
        ) : (
          <WapuuPreview
            imageUrl={previewThumbUrl}
            name={modelName}
            authorName={modelAuthor}
            authorUrl={modelAuthorUrl}
            description={modelDesc}
            tags={animations}
          />
        )}
        <div className="wapuu-license">
          <InfoIcon />
          <span>
            By submitting, you agree to license this work under{' '}
            <a href="https://creativecommons.org/licenses/by-sa/4.0/" target="_blank" rel="noopener noreferrer">CC BY-SA 4.0</a>.
            A pull request will be created on GitHub from your account.
          </span>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-md)', marginTop: 'var(--space-md)' }}>
          <button type="button" className="wapuu-btn wapuu-btn--secondary" onClick={() => setStep('form')}>
            Back to Edit
          </button>
          <button type="button" className="wapuu-btn wapuu-btn--primary" onClick={handleSubmit} style={{ flex: 1 }}>
            Submit Pull Request
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ animation: 'fadeInUp 0.4s ease' }}>
      {/* Tabs */}
      <div className="wapuu-tabs">
        <button
          type="button"
          className={`wapuu-tab ${tab === '2d' ? 'wapuu-tab--active' : ''}`}
          onClick={() => { setTab('2d'); setErrors({}); }}
        >
          2D Wapuu
        </button>
        <button
          type="button"
          className={`wapuu-tab ${tab === '3d' ? 'wapuu-tab--active' : ''}`}
          onClick={() => { setTab('3d'); setErrors({}); }}
        >
          3D Model
        </button>
      </div>

      {tab === '2d' ? (
        <>
          <FileUpload
            file={file2d}
            onFileChange={setFile2d}
            accept=".svg,.png,image/svg+xml,image/png"
            label="Wapuu Image"
            hint="SVG or PNG, transparent background"
            maxSize="2 MB"
            error={errors.file}
            previewUrl={preview2dUrl}
          />

          <div className="wapuu-field">
            <label className="wapuu-label" htmlFor="name">Wapuu Name</label>
            <input
              id="name"
              type="text"
              className={`wapuu-input ${errors.name ? 'wapuu-input--error' : ''}`}
              placeholder="e.g. Tokyo 2026 Wapuu"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            {name && (
              <div className="wapuu-field__hint">Slug: <code>{slugify(name)}</code></div>
            )}
            {errors.name && <div className="wapuu-field__error">{errors.name}</div>}
          </div>

          <div className="wapuu-field">
            <label className="wapuu-label" htmlFor="description">Description</label>
            <textarea
              id="description"
              className={`wapuu-input wapuu-textarea ${errors.description ? 'wapuu-input--error' : ''}`}
              placeholder="Tell us about your Wapuu..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={500}
            />
            <div className="wapuu-field__hint">{description.length}/500</div>
            {errors.description && <div className="wapuu-field__error">{errors.description}</div>}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)' }}>
            <div className="wapuu-field">
              <label className="wapuu-label" htmlFor="authorName">Author Name</label>
              <input
                id="authorName"
                type="text"
                className={`wapuu-input ${errors.authorName ? 'wapuu-input--error' : ''}`}
                placeholder="Your name"
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
              />
              {errors.authorName && <div className="wapuu-field__error">{errors.authorName}</div>}
            </div>

            <div className="wapuu-field">
              <label className="wapuu-label" htmlFor="authorUrl">
                Author URL <span className="wapuu-label__optional">(optional)</span>
              </label>
              <input
                id="authorUrl"
                type="url"
                className={`wapuu-input ${errors.authorUrl ? 'wapuu-input--error' : ''}`}
                placeholder="https://your-site.com"
                value={authorUrl}
                onChange={(e) => setAuthorUrl(e.target.value)}
              />
              {errors.authorUrl && <div className="wapuu-field__error">{errors.authorUrl}</div>}
            </div>
          </div>

          <div className="wapuu-field">
            <label className="wapuu-label" htmlFor="wapuuUrl">
              Wapuu URL <span className="wapuu-label__optional">(optional)</span>
            </label>
            <input
              id="wapuuUrl"
              type="url"
              className={`wapuu-input ${errors.wapuuUrl ? 'wapuu-input--error' : ''}`}
              placeholder="https://wordcamp.org/my-event/"
              value={wapuuUrl}
              onChange={(e) => setWapuuUrl(e.target.value)}
            />
            {errors.wapuuUrl && <div className="wapuu-field__error">{errors.wapuuUrl}</div>}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)' }}>
            <div className="wapuu-field">
              <label className="wapuu-label" htmlFor="event">
                Event <span className="wapuu-label__optional">(optional)</span>
              </label>
              <input
                id="event"
                type="text"
                className="wapuu-input"
                placeholder="e.g. wordcamp-tokyo-2026"
                value={event}
                onChange={(e) => setEvent(e.target.value)}
              />
            </div>

            <div className="wapuu-field">
              <label className="wapuu-label" htmlFor="tags">
                Tags <span className="wapuu-label__optional">(optional)</span>
              </label>
              <input
                id="tags"
                type="text"
                className="wapuu-input"
                placeholder="wordcamp, custom"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
              />
              <div className="wapuu-field__hint">Comma-separated</div>
            </div>
          </div>
        </>
      ) : (
        <>
          <FileUpload
            file={modelFile}
            onFileChange={setModelFile}
            accept=".glb,.gltf"
            label="3D Model"
            hint="GLB or GLTF format"
            maxSize="50 MB"
            error={errors.modelFile}
          />

          <FileUpload
            file={thumbnailFile}
            onFileChange={setThumbnailFile}
            accept=".png,image/png"
            label="Thumbnail"
            hint="PNG, 512x512px recommended"
            maxSize="2 MB"
            error={errors.thumbnailFile}
            previewUrl={previewThumbUrl}
          />

          <div className="wapuu-field">
            <label className="wapuu-label" htmlFor="modelName">Model Name</label>
            <input
              id="modelName"
              type="text"
              className={`wapuu-input ${errors.name ? 'wapuu-input--error' : ''}`}
              placeholder="e.g. Dancing Wapuu"
              value={modelName}
              onChange={(e) => setModelName(e.target.value)}
            />
            {modelName && (
              <div className="wapuu-field__hint">Slug: <code>{slugify(modelName)}</code></div>
            )}
            {errors.name && <div className="wapuu-field__error">{errors.name}</div>}
          </div>

          <div className="wapuu-field">
            <label className="wapuu-label" htmlFor="modelDesc">Description</label>
            <textarea
              id="modelDesc"
              className={`wapuu-input wapuu-textarea ${errors.description ? 'wapuu-input--error' : ''}`}
              placeholder="Describe your 3D model..."
              value={modelDesc}
              onChange={(e) => setModelDesc(e.target.value)}
              maxLength={500}
            />
            <div className="wapuu-field__hint">{modelDesc.length}/500</div>
            {errors.description && <div className="wapuu-field__error">{errors.description}</div>}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)' }}>
            <div className="wapuu-field">
              <label className="wapuu-label" htmlFor="modelAuthor">Author Name</label>
              <input
                id="modelAuthor"
                type="text"
                className={`wapuu-input ${errors.authorName ? 'wapuu-input--error' : ''}`}
                placeholder="Your name"
                value={modelAuthor}
                onChange={(e) => setModelAuthor(e.target.value)}
              />
              {errors.authorName && <div className="wapuu-field__error">{errors.authorName}</div>}
            </div>

            <div className="wapuu-field">
              <label className="wapuu-label" htmlFor="modelAuthorUrl">
                Author URL <span className="wapuu-label__optional">(optional)</span>
              </label>
              <input
                id="modelAuthorUrl"
                type="url"
                className={`wapuu-input ${errors.authorUrl ? 'wapuu-input--error' : ''}`}
                placeholder="https://your-site.com"
                value={modelAuthorUrl}
                onChange={(e) => setModelAuthorUrl(e.target.value)}
              />
              {errors.authorUrl && <div className="wapuu-field__error">{errors.authorUrl}</div>}
            </div>
          </div>

          <div className="wapuu-field">
            <label className="wapuu-label" htmlFor="animations">
              Animations <span className="wapuu-label__optional">(optional)</span>
            </label>
            <input
              id="animations"
              type="text"
              className="wapuu-input"
              placeholder="idle, happy, wave"
              value={animations}
              onChange={(e) => setAnimations(e.target.value)}
            />
            <div className="wapuu-field__hint">Comma-separated animation names embedded in the model</div>
          </div>

          <div className="wapuu-field">
            <label className="wapuu-label" htmlFor="license">License</label>
            <input
              id="license"
              type="text"
              className="wapuu-input"
              value={license}
              onChange={(e) => setLicense(e.target.value)}
            />
          </div>
        </>
      )}

      <button
        type="button"
        className="wapuu-btn wapuu-btn--primary wapuu-btn--full wapuu-btn--lg"
        onClick={handlePreview}
        style={{ marginTop: 'var(--space-md)' }}
      >
        Preview & Submit
      </button>
    </div>
  );
}
