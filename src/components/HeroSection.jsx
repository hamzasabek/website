import React, { useEffect, useRef } from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import { Button, Tag } from '@carbon/react';
import {
  Email,
  Phone,
  Location,
  Launch,
  Download,
  Printer,
  Copy,
} from '@carbon/icons-react';
import { animate, stagger } from 'animejs';
import UIkit from 'uikit';

const UI_COPY = {
  en: {
    eyebrow: '00 // ACADEMIC PORTFOLIO & CV',
    contactBtn: 'Contact via Email',
    copyEmail: 'Copy email',
    copied: 'Email address copied to clipboard',
    downloadTex: 'LaTeX CV (.tex)',
    printPdf: 'Print / PDF',
    stats: [
      { key: 'publications', label: 'Peer-reviewed articles', suffix: '' },
      { key: 'talks', label: 'Talks & presentations', suffix: '' },
      { key: 'teachingHours', label: 'Teaching hours (HETD)', suffix: ' h' },
      { key: 'cnuSections', label: 'CNU sections (74 · 69 · 16)', suffix: '' },
    ],
  },
  fr: {
    eyebrow: '00 // PORTFOLIO ACADÉMIQUE & CV',
    contactBtn: 'Contacter par e-mail',
    copyEmail: 'Copier l’e-mail',
    copied: 'Adresse e-mail copiée dans le presse-papiers',
    downloadTex: 'CV LaTeX (.tex)',
    printPdf: 'Imprimer / PDF',
    stats: [
      { key: 'publications', label: 'Articles évalués par les pairs', suffix: '' },
      { key: 'talks', label: 'Communications scientifiques', suffix: '' },
      { key: 'teachingHours', label: 'Heures d’enseignement (éq. TD)', suffix: ' h' },
      { key: 'cnuSections', label: 'Sections CNU (74 · 69 · 16)', suffix: '' },
    ],
  },
};

export default function HeroSection({ data, lang, onOpenLatexModal }) {
  const heroRef = useRef(null);
  const copy = UI_COPY[lang] || UI_COPY.en;
  const { header, stats } = data;

  useEffect(() => {
    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced || !heroRef.current) return;

    const anim = animate(heroRef.current.querySelectorAll('.hero-stagger'), {
      opacity: [0, 1],
      translateY: [10, 0],
      delay: stagger(45),
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
    <header id="top" className="hero-band" ref={heroRef}>
      <Container className="cv-container">
        <div className="hero-stagger hero-eyebrow etiquette">{copy.eyebrow}</div>

        <Row className="align-items-end g-4">
          <Col lg={8}>
            <h1 className="hero-stagger hero-name">{header.name}</h1>
            <p className="hero-stagger hero-subtitle">{header.subtitle}</p>
            <p className="hero-stagger hero-qualification">{header.qualification}</p>

            <div className="hero-stagger hero-tags">
              <Tag type="blue" size="sm" className="etiquette">
                CNU 74 · 69 · 16
              </Tag>
              <Tag type="teal" size="sm" className="etiquette">
                LICAE · Paris Nanterre
              </Tag>
              <Tag type="cool-gray" size="sm" className="etiquette">
                <span className="hero-tag-inline">
                  <Location size={12} /> {header.location}
                </span>
              </Tag>
            </div>
          </Col>

          <Col lg={4}>
            <div className="hero-stagger hero-contact-card">
              <div className="hero-contact-row">
                <Email size={16} />
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
                  <Copy size={14} />
                </button>
              </div>

              <div className="hero-contact-row">
                <Phone size={16} />
                <a href={header.phoneHref} className="cv-link number">
                  {header.phone}
                </a>
              </div>

              <div className="hero-socials">
                {header.socials.map((soc) => (
                  <a
                    key={soc.label}
                    href={soc.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hero-social-link etiquette"
                  >
                    {soc.label}
                    <Launch size={12} />
                  </a>
                ))}
              </div>
            </div>
          </Col>
        </Row>

        <div className="hero-stagger hero-actions no-print">
          <Button
            kind="primary"
            size="md"
            href={`mailto:${header.email}`}
            renderIcon={Email}
          >
            {copy.contactBtn}
          </Button>
          <Button
            kind="tertiary"
            size="md"
            onClick={onOpenLatexModal}
            renderIcon={Download}
          >
            {copy.downloadTex}
          </Button>
          <Button
            kind="ghost"
            size="md"
            onClick={() => window.print()}
            renderIcon={Printer}
          >
            {copy.printPdf}
          </Button>
        </div>

        <div className="hero-stagger hero-kpi-grid">
          {copy.stats.map((item) => {
            const val = stats[item.key];
            const displayVal = val < 10 ? `0${val}` : `${val}`;
            return (
              <div key={item.key} className="hero-kpi-cell">
                <div className="hero-kpi-value number">
                  {displayVal}
                  {item.suffix}
                </div>
                <div className="hero-kpi-label etiquette">{item.label}</div>
              </div>
            );
          })}
        </div>
      </Container>
    </header>
  );
}
