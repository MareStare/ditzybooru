import { useState } from 'react';
import type { SubmitEvent } from 'react';
import { createFileRoute } from '@tanstack/react-router';

import { Button } from '#/components/ui/Button';
import { Field, FieldLabel } from '#/components/ui/Field';
import { Notice, NoticeTitle } from '#/components/ui/Notice';
import { Panel, PanelBody, PanelHeader } from '#/components/ui/Panel';
import { useSite } from '#/hooks/use-site';
import { setApiKey, useApiKey } from '#/lib/api/api-key';
import { get } from '#/lib/api/backend/client';
import { HttpError } from '#/lib/http/http-client';

export const Route = createFileRoute('/settings/account')({ component: AccountSettingsPage });

type Check = { state: 'idle' } | { state: 'checking' } | { state: 'refused' } | { state: 'failed' };

/** Asks the site whether `key` is one of its keys, without saving it. */
async function check(key: string): Promise<Check> {
  try {
    await get('/filters/user', {}, { apiKey: key });
    return { state: 'idle' };
  } catch (error) {
    return error instanceof HttpError && error.response.status === 401 ? { state: 'refused' } : { state: 'failed' };
  }
}

function AccountSettingsPage() {
  const site = useSite();
  const saved = useApiKey();
  const [draft, setDraft] = useState('');
  const [result, setResult] = useState<Check>({ state: 'idle' });

  const save = (event: SubmitEvent) => {
    event.preventDefault();
    const key = draft.trim();
    if (key === '') {
      return;
    }
    setResult({ state: 'checking' });
    void check(key).then(outcome => {
      setResult(outcome);
      if (outcome.state === 'idle') {
        setApiKey(key);
        setDraft('');
      }
    });
  };

  return (
    <div className="developer-page">
      <h1 className="developer-page__title">Account</h1>

      <Notice>
        <NoticeTitle>Signing in with an API key</NoticeTitle>
        {site.name} asks for a captcha when you sign in, which only its own pages can show. Your personal API key, from
        your account settings on {site.name}, does the same job here: it lets this site read things that are yours, like
        the images your watched tags match. It stays in this browser and is sent only with the requests that need it.
      </Notice>

      <Panel>
        <PanelHeader>API key</PanelHeader>
        <PanelBody className="developer-setting">
          {saved === null ? null : (
            <div className="developer-setting__text">
              <span className="developer-setting__label">A key is saved in this browser</span>
              <div>
                <Button
                  onClick={() => {
                    setApiKey(null);
                  }}
                >
                  Remove it
                </Button>
              </div>
            </div>
          )}
          <form className="developer-setting__text" onSubmit={save}>
            <FieldLabel htmlFor="api-key">{saved === null ? 'Your API key' : 'Replace it with another key'}</FieldLabel>
            <Field
              id="api-key"
              type="password"
              autoComplete="off"
              spellCheck={false}
              value={draft}
              onChange={event => {
                setDraft(event.target.value);
              }}
            />
            <span className="developer-setting__hint" role="status">
              {result.state === 'checking' ? 'Checking the key…' : null}
              {result.state === 'refused' ? `${site.name} does not accept this key.` : null}
              {result.state === 'failed' ? 'Could not reach the site to check the key. Try again.' : null}
            </span>
            <div>
              <Button type="submit" variant="primary" disabled={draft.trim() === '' || result.state === 'checking'}>
                Save key
              </Button>
            </div>
          </form>
        </PanelBody>
      </Panel>
    </div>
  );
}
