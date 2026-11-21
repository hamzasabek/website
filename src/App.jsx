import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Container } from 'react-bootstrap';
import { Theme, Button } from '@carbon/react';
import { ChevronRight, DocumentExport } from '@carbon/icons-react';
import { animate } from 'animejs';
import enTexRaw from '../main_master_EN.tex?raw';
import frTexRaw from '../main_master_FR.tex?raw';
import { parseCvTex } from './utils/cvTexParser';
import { CATEGORIES, getCategoryIndex } from './data/categories';
import SiteHeader from './components/SiteHeader';
import CvSections from './components/CvSections';
import LatexCvModal from './components/LatexCvModal';

function getInitialCategory() {
  if (typeof window === 'undefined') return 'profile';
  const hash = window.location.hash.replace('#', '').trim();
  const valid = CATEGORIES.some((c) => c.id === hash);
  return valid ? hash : 'profile';
}

export default function App() {
  const [lang, setLang] = useState('en');
  const [themeMode, setThemeMode] = useState('white');
  const [latexModalOpen, setLatexModalOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState(getInitialCategory);
  const [transitionDir, setTransitionDir] = useState('ltr'); // 'ltr' (left-to-right + up) or 'rtl' (right-to-left + up)

  const scrollPaneRef = useRef(null);
  const slideStageRef = useRef(null);
  const dragStateRef = useRef({
    active: false,
    dragging: false,
    startX: 0,
    startY: 0,
    lastX: 0,
    startTime: 0,
    pointerId: null,
  });
  const wheelCooldownRef = useRef(0);
  const [isDraggingStage, setIsDraggingStage] = useState(false);

  const cvByLang = useMemo(
    () => ({
      en: parseCvTex(enTexRaw, 'en'),
      fr: parseCvTex(frTexRaw, 'fr'),
    }),
    []
  );

  const activeData = cvByLang[lang];
  const currentIndex = getCategoryIndex(activeCategory);
  const prevCategory =
    CATEGORIES[(currentIndex - 1 + CATEGORIES.length) % CATEGORIES.length];
  const nextCategory = CATEGORIES[(currentIndex + 1) % CATEGORIES.length];

  const handleSelectCategory = useCallback(
    (targetId, source = 'header') => {
      if (targetId === activeCategory) {
        if (scrollPaneRef.current) {
          scrollPaneRef.current.scrollTo({ top: 0, behavior: 'smooth' });
        }
        return;
      }

      // Header clicks and next chevron slide up from left to right; previous chevron slides up from right to left
      setTransitionDir(source === 'prev' ? 'rtl' : 'ltr');
      setActiveCategory(targetId);

      if (typeof window !== 'undefined' && window.history?.replaceState) {
        window.history.replaceState(null, '', `#${targetId}`);
      }
    },
    [activeCategory]
  );

  const goPrev = useCallback(() => {
    handleSelectCategory(prevCategory.id, 'prev');
  }, [handleSelectCategory, prevCategory.id]);

  const goNext = useCallback(() => {
    handleSelectCategory(nextCategory.id, 'next');
  }, [handleSelectCategory, nextCategory.id]);

  // Document language & title
  useEffect(() => {
    document.documentElement.lang = lang;
    document.title =
      lang === 'fr'
        ? 'Hamza Sabek — Docteur en STAPS · Neurosciences de l’action'
        : 'Hamza Sabek — Ph.D. in Human Movement Science';
  }, [lang]);

  // Reset vertical scroll of the category pane and play slide-up-left-to-right animation on category change
  useEffect(() => {
    if (scrollPaneRef.current) {
      scrollPaneRef.current.scrollTop = 0;
    }

    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced || !slideStageRef.current) return;

    slideStageRef.current.style.transform = '';
    const fromX = transitionDir === 'rtl' ? 56 : -56;
    const anim = animate(slideStageRef.current, {
      opacity: [0, 1],
      translateX: [fromX, 0],
      translateY: [20, 0],
      duration: 380,
      ease: 'outCubic',
    });

    return () => {
      if (anim && typeof anim.revert === 'function') anim.revert();
    };
  }, [activeCategory, transitionDir]);

  // Mouse drag & touch swipe handlers for switching categories
  const handlePointerDown = useCallback(
    (e) => {
      if (latexModalOpen) return;
      if (e.pointerType === 'mouse' && e.button !== 0) return;

      // Don't hijack clicks on interactive controls, links, or code blocks
      const interactive = e.target?.closest?.(
        'a, button, input, textarea, select, label, pre, code, .cds--modal, .cv-katex-wrap'
      );
      if (interactive) return;

      dragStateRef.current = {
        active: true,
        dragging: false,
        startX: e.clientX,
        startY: e.clientY,
        lastX: e.clientX,
        startTime: Date.now(),
        pointerId: e.pointerId,
      };
    },
    [latexModalOpen]
  );

  const handlePointerMove = useCallback((e) => {
    const state = dragStateRef.current;
    if (!state.active) return;

    const dx = e.clientX - state.startX;
    const dy = e.clientY - state.startY;
    state.lastX = e.clientX;

    if (!state.dragging) {
      // Cancel swipe if user is scrolling vertically
      if (Math.abs(dy) > 14 && Math.abs(dy) >= Math.abs(dx)) {
        state.active = false;
        return;
      }
      // Lock into horizontal swipe once horizontal intent is clear
      if (Math.abs(dx) > 18 && Math.abs(dx) > Math.abs(dy) * 1.4) {
        state.dragging = true;
        setIsDraggingStage(true);
        window.getSelection?.()?.removeAllRanges?.();
      } else {
        return;
      }
    }

    if (slideStageRef.current) {
      const clampedOffset = Math.max(-72, Math.min(72, dx * 0.28));
      slideStageRef.current.style.transform = `translateX(${clampedOffset}px)`;
    }
  }, []);

  const finishDrag = useCallback(() => {
    const state = dragStateRef.current;
    if (!state.active) return;

    const dx = state.lastX - state.startX;
    const elapsed = Math.max(1, Date.now() - state.startTime);
    const wasDragging = state.dragging;

    state.active = false;
    state.dragging = false;
    setIsDraggingStage(false);

    if (!wasDragging) return;

    const triggered =
      Math.abs(dx) >= 80 || (Math.abs(dx) >= 42 && elapsed < 260);

    if (triggered) {
      if (dx < 0) {
        goNext();
      } else {
        goPrev();
      }
    } else if (slideStageRef.current) {
      animate(slideStageRef.current, {
        translateX: 0,
        duration: 220,
        ease: 'outCubic',
      });
    }
  }, [goNext, goPrev]);

  // Horizontal trackpad two-finger swipe support
  const handleWheel = useCallback(
    (e) => {
      if (latexModalOpen) return;
      const absX = Math.abs(e.deltaX);
      const absY = Math.abs(e.deltaY);
      if (absX < 36 || absX <= absY * 1.8) return;

      // Don't hijack horizontal scrolling inside equations or code blocks
      if (e.target?.closest?.('.cv-katex-wrap, pre, code')) return;

      const now = Date.now();
      if (now - wheelCooldownRef.current < 550) return;
      wheelCooldownRef.current = now;

      if (e.deltaX > 0) {
        goNext();
      } else {
        goPrev();
      }
    },
    [goNext, goPrev, latexModalOpen]
  );

  // Keyboard Left / Right arrow navigation when modal is closed
  useEffect(() => {
    const onKeyDown = (e) => {
      if (latexModalOpen) return;
      const tag = e.target?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || e.target?.isContentEditable) return;
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        goPrev();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        goNext();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [goPrev, goNext, latexModalOpen]);

  const footerNote =
    lang === 'fr'
      ? 'Source directe : main_master_FR.tex & main_master_EN.tex'
      : 'Parsed directly from main_master_EN.tex & main_master_FR.tex';

  const prevLabel = prevCategory[lang] || prevCategory.en;
  const nextLabel = nextCategory[lang] || nextCategory.en;

  return (
    <Theme theme={themeMode}>
      <div className="site-shell site-shell-viewport" data-carbon-theme={themeMode}>
        <SiteHeader
          lang={lang}
          onToggleLang={() => setLang((prev) => (prev === 'en' ? 'fr' : 'en'))}
          themeMode={themeMode}
          onToggleTheme={() =>
            setThemeMode((prev) => (prev === 'white' ? 'g100' : 'white'))
          }
          onOpenLatexModal={() => setLatexModalOpen(true)}
          activeCategory={activeCategory}
          onSelectCategory={handleSelectCategory}
        />

        {/* Right Main Stage Wrapper */}
        <div className="category-stage-wrapper">
          {/* Right Rectangular Category Swipe Card */}
          <button
            type="button"
            className="category-chevron category-chevron-right no-print"
            onClick={goNext}
            aria-label={`${lang === 'fr' ? 'Catégorie suivante' : 'Next category'}: ${nextLabel}`}
            title={`[${nextCategory.index}] ${nextLabel} →`}
          >
            <span className="category-chevron-meta">
              <span className="category-chevron-num number">[{nextCategory.index}]</span>
              <span className="category-chevron-label etiquette">{nextLabel}</span>
            </span>
            <span className="category-chevron-icon" aria-hidden="true">
              <ChevronRight size={18} />
            </span>
          </button>

          {/* Vertically Scrollable Single-Category Viewport (supports mouse drag & touch swipe) */}
          <div
            className={`category-scroll-pane ${isDraggingStage ? 'is-dragging-swipe' : ''}`}
            ref={scrollPaneRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={finishDrag}
            onPointerCancel={finishDrag}
            onPointerLeave={finishDrag}
            onWheel={handleWheel}
          >
            <main className="category-slide-stage" ref={slideStageRef}>
              <CvSections
                categoryId={activeCategory}
                data={activeData}
                lang={lang}
                onOpenLatexModal={() => setLatexModalOpen(true)}
              />
            </main>

            {/* Minimal Seamless Footer */}
            <footer className="cv-footer">
              <Container className="cv-container">
                <div className="cv-footer-inner">
                  <div>
                    <div className="cv-footer-name etiquette">
                      HAMZA SABEK · <span className="number">2026</span>
                    </div>
                    <p className="cv-footer-note">{footerNote}</p>
                  </div>
                  <div className="cv-footer-actions no-print">
                    <Button
                      kind="ghost"
                      size="sm"
                      onClick={() => setLatexModalOpen(true)}
                      renderIcon={DocumentExport}
                    >
                      {lang === 'fr' ? 'Source LaTeX' : 'LaTeX Source'}
                    </Button>
                  </div>
                </div>
              </Container>
            </footer>
          </div>
        </div>

        <LatexCvModal
          open={latexModalOpen}
          onClose={() => setLatexModalOpen(false)}
          lang={lang}
          rawTex={activeData.rawTex}
        />
      </div>
    </Theme>
  );
}
