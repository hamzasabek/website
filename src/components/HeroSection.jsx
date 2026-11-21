import React, { useEffect, useRef } from 'react';
import { Container } from 'react-bootstrap';
import { Launch, Copy, Download, Printer } from '@carbon/icons-react';
import { animate, stagger } from 'animejs';
import UIkit from 'uikit';
import RichLatexText from './RichLatexText';
import profileImg from '../assets/profile.jpg';

const UI_COPY = {
  en: {
    copyEmail: 'Copy email',
    copied: 'Email address copied to clipboard',
    downloadTex: 'LaTeX CV (.tex)',
    printPdf: 'Print / PDF',
  },
  fr: {
    copyEmail: 'Copier l’e-mail',
    copied: 'Adresse e-mail copiée dans le presse-papiers',
    downloadTex: 'CV LaTeX (.tex)',
    printPdf: 'Imprimer / PDF',
  },
};

export default function HeroSection({ data, lang, onOpenLatexModal }) {
  const heroRef = useRef(null);
  const copy = UI_COPY[lang] || UI_COPY.en;
  const { header, sections } = data;
  const profileSection = sections?.profile;

  useEffect(() => {
    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced || !heroRef.current) return;

    const anim = animate(heroRef.current.querySelectorAll('.hero-stagger'), {
      opacity: [0, 1],
      translateY: [10, 0],
      delay: stagger(55),
      duration: 420,
      ease: 'outCubic',
    });

    return () => {
      if (anim && typeof anim.revert === 'function') anim.revert();
    };
  }, [lang]);

  const handleCopyEmail = async () => {
    try {
      await navigator.clipboard.writeText(header.email);
      UIkit.notification({
        message: `<span class="etiquette">${copy.copied}</span>`,
        status: 'primary',
        pos: 'bottom-right',
        timeout: 2400,
      });
    } catch {
      window.location.href = `mailto:${header.email}`;
    }
  };

  if (!header) return null;

  return (
    <section id="profile" className="profile-editorial" ref={heroRef}>
      <Container className="cv-container">
        {/* Identity block: round portrait + name, title & CNU qualification */}
        <div className="hero-stagger profile-header-block">
          <div className="hero-avatar-frame">
            <img
              src={profileImg}
              alt={header.name}
              className="hero-avatar-img"
              width="112"
              height="112"
              loading="eager"
              decoding="async"
            />
          </div>

          <div className="profile-title-group">
            <h1 className="hero-name">{header.name}</h1>
            <p className="hero-subtitle">{header.subtitle}</p>
            <p className="hero-qualification">{header.qualification}</p>
          </div>
        </div>

        {/* Clean single-flow contact & external links line */}
        <div className="hero-stagger profile-meta-strip etiquette">
          <span className="profile-meta-item">
            <a href={`mailto:${header.email}`} className="cv-link number">
              {header.email}
            </a>
            <button
              type="button"
              className="hero-icon-btn no-print"
              onClick={handleCopyEmail}
              title={copy.copyEmail}
              aria-label={copy.copyEmail}
            >
              <Copy size={13} />
            </button>
          </span>

          <span className="profile-meta-sep" aria-hidden="true">·</span>

          <a href={header.phoneHref} className="cv-link number profile-meta-item">
            {header.phone}
          </a>

          <span className="profile-meta-sep" aria-hidden="true">·</span>

          <span className="profile-meta-item">{header.location}</span>

          {header.socials.map((soc) => (
            <React.Fragment key={soc.label}>
              <span className="profile-meta-sep" aria-hidden="true">·</span>
              <a
                href={soc.url}
                target="_blank"
                rel="noopener noreferrer"
                className="profile-social-link etiquette"
              >
                {soc.label}
                <Launch size={12} />
              </a>
            </React.Fragment>
          ))}
        </div>

        {/* Research profile prose — spacious single-column reading measure */}
        {profileSection && (
          <div className="hero-stagger profile-narrative-block">
            <div className="profile-section-label etiquette">
              [01] {profileSection.title}
            </div>
            <div className="profile-prose">
              {profileSection.entries.map((entry, idx) => (
                <p key={idx}>
                  <RichLatexText tokens={entry.tokens} />
                </p>
              ))}
            </div>
          </div>
        )}

        {/* Quiet utility links */}
        <div className="hero-stagger profile-utility-links no-print">
          <button
            type="button"
            className="profile-text-action etiquette"
            onClick={onOpenLatexModal}
          >
            <Download size={14} />
            <span>{copy.downloadTex}</span>
          </button>

          <button
            type="button"
            className="profile-text-action etiquette"
            onClick={() => window.print()}
          >
            <Printer size={14} />
            <span>{copy.printPdf}</span>
          </button>
        </div>
      </Container>
    </section>
  );
}
