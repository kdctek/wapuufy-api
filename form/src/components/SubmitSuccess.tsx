function CheckIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

interface Props {
  prUrl: string;
  onReset: () => void;
}

export function SubmitSuccess({ prUrl, onReset }: Props) {
  return (
    <div className="wapuu-success">
      <div className="wapuu-success__icon">
        <CheckIcon />
      </div>
      <div className="wapuu-success__title">Pull Request Created!</div>
      <div className="wapuu-success__desc">
        Your Wapuu submission has been sent for review. Once the maintainers merge your PR, it will appear in the Wapuufy app automatically.
      </div>
      <div className="wapuu-success__actions">
        <a href={prUrl} target="_blank" rel="noopener noreferrer" className="wapuu-btn wapuu-btn--primary wapuu-btn--lg">
          View Pull Request
        </a>
        <button type="button" className="wapuu-btn wapuu-btn--secondary wapuu-btn--lg" onClick={onReset}>
          Submit Another
        </button>
      </div>
    </div>
  );
}
