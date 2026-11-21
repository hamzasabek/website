import React, { useState } from 'react';
import { Sun, Asleep, DocumentExport, Menu, Close } from '@carbon/icons-react';
import { CATEGORIES } from '../data/categories';

export default function SiteHeader({
  lang,
  onToggleLang,
  themeMode,
  onToggleTheme,
  onOpenLatexModal,
  activeCategory,
  onSelectCategory,
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const activeItem =
    CATEGORIES.find((c) => c.id === activeCategory) || CATEGORIES[0];

  const handleNavClick = (e, id) => {
    e.preventDefault();
    onSelectCategory(id, 'header');
    setMobileOpen(false);
  };

  return (
    <>
      {/* Mobile / narrow viewport discrete bar */}
      <div className="site-mobile-bar no-print">
        <button
          type="button"
          className="site-nav-util-btn"
          onClick={() => setMobileOpen((prev) => !prev)}
          aria-label={mobileOpen ? 'Close navigation' : 'Open navigation'}
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? <Close size={18} /> : <Menu size={18} />}
        </button>

        <span className="site-mobile-current etiquette">
          <span className="nav-bracket-num number">[{activeItem.index}]</span>{' '}
          {activeItem[lang] || activeItem.en}
        </span>

        <div className="site-mobile-utils">
          <button
            type="button"
            className="site-nav-util-btn etiquette"
            onClick={onToggleLang}
            aria-label={lang === 'en' ? 'Passer en français' : 'Switch to English'}
          >
            {lang === 'en' ? 'FR' : 'EN'}
          </button>
          <button
            type="button"
            className="site-nav-util-btn"
            onClick={onToggleTheme}
            aria-label={themeMode === 'white' ? 'Dark theme' : 'Light theme'}
          >
            {themeMode === 'white' ? <Asleep size={16} /> : <Sun size={16} />}
          </button>
          <button
            type="button"
            className="site-nav-util-btn"
            onClick={onOpenLatexModal}
            aria-label={lang === 'en' ? 'LaTeX CV source' : 'Source LaTeX'}
          >
            <DocumentExport size={16} />
          </button>
        </div>
      </div>

      {/* Mobile overlay backdrop */}
      {mobileOpen && (
        <div
          className="site-nav-backdrop no-print"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Discrete Left-Side Navigation Rail */}
      <aside
        aria-label="Main navigation"
        className={`site-left-nav no-print ${mobileOpen ? 'is-mobile-open' : ''}`}
      >
        <nav className="site-left-nav-list">
          {CATEGORIES.map((item) => {
            const isActive = activeCategory === item.id;
            const label = item[lang] || item.en;
            return (
              <a
                key={item.id}
                href={`#${item.id}`}
                aria-current={isActive ? 'page' : undefined}
                className={`site-left-nav-item etiquette ${isActive ? 'is-active' : ''}`}
                onClick={(e) => handleNavClick(e, item.id)}
              >
                <span className="nav-bracket-num number">[{item.index}]</span>
                <span className="nav-item-label">{label}</span>
              </a>
            );
          })}
        </nav>

        <div className="site-left-nav-utils">
          <button
            type="button"
            className="site-nav-util-btn etiquette"
            onClick={onToggleLang}
            title={lang === 'en' ? 'Passer en français' : 'Switch to English'}
            aria-label={lang === 'en' ? 'Passer en français' : 'Switch to English'}
          >
            {lang === 'en' ? 'FR' : 'EN'}
          </button>

          <button
            type="button"
            className="site-nav-util-btn"
            onClick={onToggleTheme}
            title={
              themeMode === 'white'
                ? lang === 'en'
                  ? 'Dark theme'
                  : 'Thème sombre'
                : lang === 'en'
                ? 'Light theme'
                : 'Thème clair'
            }
            aria-label={themeMode === 'white' ? 'Dark theme' : 'Light theme'}
          >
            {themeMode === 'white' ? <Asleep size={16} /> : <Sun size={16} />}
          </button>

          <button
            type="button"
            className="site-nav-util-btn"
            onClick={onOpenLatexModal}
            title={lang === 'en' ? 'LaTeX CV source & tools' : 'Source LaTeX & outils'}
            aria-label={lang === 'en' ? 'LaTeX CV source & tools' : 'Source LaTeX & outils'}
          >
            <DocumentExport size={16} />
          </button>
        </div>
      </aside>
    </>
  );
}
