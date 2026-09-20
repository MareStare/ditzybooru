import { createFileRoute } from '@tanstack/react-router';

import { Notice, NoticeTitle } from '#/components/ui/Notice';
import { Panel, PanelBody, PanelHeader } from '#/components/ui/Panel';
import { Segmented } from '#/components/ui/Segmented';
import { useDataSource } from '#/hooks/useDataSource';
import { setDataSource } from '#/lib/settingsStore';
import type { DataSourceKind } from '#/lib/api/types';

export const Route = createFileRoute('/settings/developer')({ component: DeveloperSettingsPage });

const DATA_SOURCE_OPTIONS: Array<{ value: DataSourceKind; label: string; description: string }> = [
  { value: 'live', label: 'Live', description: 'Read from the Philomena origin server.' },
  { value: 'mock', label: 'Mock', description: 'Read the fabricated data bundled with the frontend.' },
];

function DeveloperSettingsPage() {
  const dataSource = useDataSource();

  return (
    <div className="developer-page">
      <h1 className="developer-page__title">Developer settings</h1>

      <Notice>
        <NoticeTitle>For working on the site</NoticeTitle>
        These change where the page gets its content, not how it looks. They are stored in the same cookie as every
        other setting, so the server renders from whichever one is chosen here.
      </Notice>

      <Panel>
        <PanelHeader>Data source</PanelHeader>
        <PanelBody className="developer-setting">
          <div className="developer-setting__text">
            <span className="developer-setting__label">Where images, comments and topics come from</span>
            <span className="developer-setting__hint">
              Mock data never changes and needs no network, which is what makes a layout comparable between two runs.
              Live data is read-only and anonymous: the origin&apos;s default filter applies, and faves and watched tags
              are empty until sign-in exists.
            </span>
          </div>
          <Segmented
            label="Data source"
            value={dataSource}
            options={DATA_SOURCE_OPTIONS}
            onChange={value => {
              setDataSource(value);
            }}
          />
        </PanelBody>
      </Panel>
    </div>
  );
}
