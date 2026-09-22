'use client';

/**
 * Client-side publish form.
 *
 * Every field is controlled, so a rejected submission keeps exactly what the
 * writer typed (React resets uncontrolled form fields once a form action
 * settles). Submits to the `publishPost` server action, so it also works with
 * JavaScript switched off.
 */

import Link from 'next/link';
import { useActionState, useEffect, useId, useRef, useState } from 'react';

import { DEFAULT_AUTHOR, LIMITS, SITE } from '@/lib/constants';

const EMPTY_STATE = {
  ok: false,
  errors: {},
  values: { title: '', author: '', content: '' },
  message: null,
};

/** Live counter that only speaks up near the limit. */
function Counter({ value, limit }) {
  if (value === 0) return null;
  const remaining = limit - value;
  if (remaining >= Math.min(limit * 0.2, 40)) return null;

  return (
    <span
      className={`text-xs tabular-nums ${remaining < 0 ? 'font-medium text-rust-600' : 'text-ink-400'}`}
    >
      {remaining < 0 ? `${Math.abs(remaining)} over` : `${remaining} left`}
    </span>
  );
}

function FieldError({ id, message }) {
  if (!message) return null;
  return (
    <p id={id} className="mt-1.5 text-sm text-rust-600">
      {message}
    </p>
  );
}

export default function PublishForm({ action }) {
  const [state, formAction, pending] = useActionState(action, EMPTY_STATE);

  const [values, setValues] = useState(EMPTY_STATE.values);
  const [lastState, setLastState] = useState(state);
  const titleRef = useRef(null);

  const ids = {
    title: useId(),
    author: useId(),
    content: useId(),
  };

  // A rejected submission hands the writer's text back. This is React's
  // "adjust state during render" pattern (a synchronous setState guarded by a
  // previous-value comparison), not an effect: no extra render, no flash.
  if (state !== lastState) {
    setLastState(state);
    if (state.values) setValues(state.values);
  }

  // Focus is a real DOM side effect, so it belongs in an effect.
  useEffect(() => {
    if (!state.errors || Object.keys(state.errors).length === 0) return;
    if (state.errors.title) titleRef.current?.focus();
    else if (state.errors.content) document.getElementById(ids.content)?.focus();
  }, [state, ids.content]);

  const errors = state.errors ?? {};
  const update = (field) => (event) => setValues((current) => ({ ...current, [field]: event.target.value }));

  return (
    <form action={formAction} className="space-y-8">
      {state.message && !state.ok ? (
        <p
          role="alert"
          className="rounded-sm border border-rust-200 bg-rust-50 px-4 py-3 text-sm text-rust-700"
        >
          {state.message}
        </p>
      ) : null}

      <div>
        <div className="flex items-baseline justify-between gap-4">
          <label htmlFor={ids.title} className="label">
            Title
          </label>
          <Counter value={values.title.length} limit={LIMITS.title} />
        </div>
        <input
          ref={titleRef}
          id={ids.title}
          name="title"
          type="text"
          required
          maxLength={LIMITS.title}
          value={values.title}
          onChange={update('title')}
          placeholder="What is this piece called?"
          aria-invalid={errors.title ? 'true' : undefined}
          aria-describedby={errors.title ? `${ids.title}-error` : undefined}
          className={`input mt-2.5 break-anywhere ${errors.title ? 'border-rust-400' : ''}`}
        />
        <FieldError id={`${ids.title}-error`} message={errors.title} />
      </div>

      <div>
        <div className="flex items-baseline justify-between gap-4">
          <label htmlFor={ids.author} className="label">
            Pen name
            <span className="ml-2 font-sans text-[0.65rem] font-normal normal-case tracking-[0.12em] text-ink-400">
              optional
            </span>
          </label>
          <Counter value={values.author.length} limit={LIMITS.author} />
        </div>
        <input
          id={ids.author}
          name="author"
          type="text"
          maxLength={LIMITS.author}
          value={values.author}
          onChange={update('author')}
          placeholder={DEFAULT_AUTHOR}
          aria-invalid={errors.author ? 'true' : undefined}
          aria-describedby={errors.author ? `${ids.author}-error` : `${ids.author}-hint`}
          className={`input mt-2.5 ${errors.author ? 'border-rust-400' : ''}`}
        />
        <p id={`${ids.author}-hint`} className="mt-2 text-sm text-ink-400">
          Leave this blank and it will be published as <span className="byline">{DEFAULT_AUTHOR}</span>.
        </p>
        <FieldError id={`${ids.author}-error`} message={errors.author} />
      </div>

      <div>
        <div className="flex items-baseline justify-between gap-4">
          <label htmlFor={ids.content} className="label">
            Content
          </label>
          <Counter value={values.content.length} limit={LIMITS.content} />
        </div>
        <textarea
          id={ids.content}
          name="content"
          required
          rows={18}
          value={values.content}
          onChange={update('content')}
          placeholder="Begin anywhere."
          aria-invalid={errors.content ? 'true' : undefined}
          aria-describedby={errors.content ? `${ids.content}-error` : `${ids.content}-hint`}
          className={`textarea mt-2.5 min-h-[24rem] ${errors.content ? 'border-rust-400' : ''}`}
        />
        <p id={`${ids.content}-hint`} className="mt-2 text-sm text-ink-400">
          Plain text — a blank line starts a new paragraph.
        </p>
        <FieldError id={`${ids.content}-error`} message={errors.content} />
      </div>

      <div className="flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-ink-200 pt-8">
        <button type="submit" disabled={pending} className="btn-primary">
          {pending ? 'Publishing…' : 'Publish'}
        </button>
        <Link href="/" className="link-quiet text-sm">
          Cancel
        </Link>
        <p className="w-full text-sm text-ink-400 sm:ml-auto sm:w-auto">
          Nothing is signed. Nothing is tracked.
        </p>
      </div>

      <p className="sr-only" aria-live="polite">
        {pending ? `Publishing to ${SITE.name}` : ''}
      </p>
    </form>
  );
}
