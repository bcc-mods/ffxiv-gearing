import * as mobxReact from 'mobx-react-lite';
import classNames from 'clsx';
import { useStore } from './components/contexts';
import { Ripple, RippleSurface } from './@rmwc/ripple';
import { RippleLazy } from './components/RippleLazy';
import { CollapsibleList } from './@rmwc/list';
import { Icon } from './components/Icon';
import type { DropdownPopperProps } from './components/Dropdown';

declare const __PATCH__: string;

const GAME_VERSIONS = require('../../data/out/gameVersions').default as Record<string, string[]>;

export const GameVersionPanel = mobxReact.observer<DropdownPopperProps>(({ toggle }) => {
  const store = useStore();
  const currentVersion = store.gameVersion ?? __PATCH__;

  return (
    <div className="game-version card">
      <ul className="mdc-list">
        {Object.entries(GAME_VERSIONS).map(([groupName, versions]) => (
          <CollapsibleList
            key={groupName}
            defaultOpen={versions.includes(currentVersion)}
            handle={
              <Ripple surface={false}>
                <li tabIndex={0} className="game-version_group mdc-list-item">
                  <RippleSurface className="mdc-list-item__ripple" />

                  <span className="mdc-list-item__text">
                    {groupName}
                  </span>

                  <i className="mdc-list-item__meta" aria-hidden="true">
                    <Icon
                      className="game-version_group-icon"
                      name="chevron-right"
                    />
                  </i>
                </li>
              </Ripple>
            }
            children={
              <div className="game-version_items">
                {versions.map(version => (
                  <RippleLazy key={version}>
                    <div
                      className={classNames(
                        'game-version_item',
                        version === currentVersion && '-selected',
                      )}
                      onClick={() => {
                        store.setGameVersion(version);
                        toggle();
                      }}
                    >
                      {version}
                    </div>
                  </RippleLazy>
                ))}
              </div>
            }
          />
        ))}
      </ul>
    </div>
  );
});
