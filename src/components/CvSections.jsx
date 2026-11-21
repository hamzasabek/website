import React, { useMemo, useState } from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import { Tag, Tile } from '@carbon/react';
import { Launch, Email } from '@carbon/icons-react';
import { BlockMath } from 'react-katex';
import RichLatexText from './RichLatexText';
import HeroSection from './HeroSection';

function SectionHeader({ number, title, footnote }) {
  return (
    <div className="cv-section-header">
      <div className="cv-section-eyebrow etiquette">{number}</div>
      <div className="cv-section-title-wrap">
        <h2 className="cv-section-title">{title}</h2>
        {footnote && (
          <p className="cv-section-footnote">
            <RichLatexText tokens={footnote} />
          </p>
        )}
      </div>
    </div>
  );
}

function extractMetrics(tokens) {
  return tokens.filter((t) => t.type === 'metric').map((t) => t.value);
}

function parseHoursValue(label) {
  const match = label.replace(',', '.').match(/([\d.]+)/);
  return match ? parseFloat(match[1]) : 0;
}

export default function CvSections({
  categoryId,
  data,
  lang,
  onOpenLatexModal,
}) {
  const { sections } = data;
  const [selectedTalkCategory, setSelectedTalkCategory] = useState('ALL');

  const talkCategories = useMemo(() => {
    const entries = sections.talks?.entries || [];
    const seen = [];
    for (const e of entries) {
      if (e.label && !seen.includes(e.label)) {
        seen.push(e.label);
      }
    }
    return seen;
  }, [sections.talks]);

  const effectiveTalkCategory =
    selectedTalkCategory === 'ALL' || talkCategories.includes(selectedTalkCategory)
      ? selectedTalkCategory
      : 'ALL';

  const filteredTalks = useMemo(() => {
    const entries = sections.talks?.entries || [];
    if (effectiveTalkCategory === 'ALL') return entries;
    return entries.filter((e) => e.label === effectiveTalkCategory);
  }, [sections.talks, effectiveTalkCategory]);

  const maxTeachingHours = useMemo(() => {
    const entries = sections.teaching?.entries || [];
    return Math.max(1, ...entries.map((e) => parseHoursValue(e.label)));
  }, [sections.teaching]);

  const allLabel = lang === 'fr' ? 'Toutes' : 'All';
  const modelLabel =
    lang === 'fr'
      ? 'INFÉRENCE CAUSALE BAYÉSIENNE // INTÉGRATION MULTISENSORIELLE'
      : 'BAYESIAN CAUSAL INFERENCE // MULTISENSORY INTEGRATION';
  const modelCaption =
    lang === 'fr'
      ? 'Probabilité a posteriori d’une cause commune C = 1 à partir des signaux visuels et tactiles.'
      : 'Posterior probability of a common cause C = 1 given visual and tactile sensory cues.';

  if (categoryId === 'profile') {
    return (
      <div className="cv-category-page">
        <HeroSection data={data} lang={lang} onOpenLatexModal={onOpenLatexModal} />
        {sections.profile && (
          <Container className="cv-container">
            <section id="profile" className="cv-section cv-section-single">
              <SectionHeader number="01" title={sections.profile.title} />
              <Row className="g-4 align-items-stretch">
                <Col lg={7}>
                  <div className="cv-prose-lead">
                    {sections.profile.entries.map((entry, idx) => (
                      <p key={idx}>
                        <RichLatexText tokens={entry.tokens} />
                      </p>
                    ))}
                  </div>
                </Col>
                <Col lg={5}>
                  <Tile className="cv-carbon-tile cv-equation-tile">
                    <div className="etiquette cv-tile-eyebrow">{modelLabel}</div>
                    <div className="cv-katex-wrap">
                      <BlockMath math="P(C=1 \mid x_V, x_T) = \frac{P(x_V, x_T \mid C=1)\,P(C=1)}{P(x_V, x_T)}" />
                    </div>
                    <p className="cv-equation-caption">{modelCaption}</p>
                  </Tile>
                </Col>
              </Row>
            </section>
          </Container>
        )}
      </div>
    );
  }

  return (
    <div className="cv-category-page">
      <Container className="cv-container">
        {/* 02 · PROJECTS */}
        {categoryId === 'projects' && sections.projects && (
          <section id="projects" className="cv-section cv-section-single">
            <SectionHeader number="02" title={sections.projects.title} />
            <Row className="g-4">
              {sections.projects.entries.map((entry, idx) => (
                <Col lg={12} key={idx}>
                  <Tile className="cv-carbon-tile cv-project-tile">
                    <div className="cv-project-meta">
                      <Tag
                        type="cool-gray"
                        size="sm"
                        className="etiquette"
                      >
                        {entry.label}
                      </Tag>
                      {entry.footerLink && (
                        <a
                          href={entry.footerLink.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="cv-project-ext etiquette"
                        >
                          <RichLatexText tokens={entry.footerLink.children} />
                          <Launch size={14} />
                        </a>
                      )}
                    </div>

                    <div className="cv-entry-body">
                      <RichLatexText tokens={entry.tokens} />
                    </div>

                    {entry.bullets.length > 0 && (
                      <ul className="cv-bullet-list">
                        {entry.bullets.map((bul, bIdx) => (
                          <li key={bIdx}>
                            <RichLatexText tokens={bul} />
                          </li>
                        ))}
                      </ul>
                    )}
                  </Tile>
                </Col>
              ))}
            </Row>
          </section>
        )}

        {/* 03 · PUBLICATIONS */}
        {categoryId === 'publications' && sections.publications && (
          <section id="publications" className="cv-section cv-section-single">
            <SectionHeader number="03" title={sections.publications.title} />
            <div className="cv-list-framed">
              {sections.publications.entries.map((entry, idx) => {
                const metrics = extractMetrics(entry.tokens);
                return (
                  <article key={idx} className="cv-pub-row">
                    <div className="cv-pub-index number">
                      {String(idx + 1).padStart(2, '0')}
                    </div>
                    <div className="cv-pub-content">
                      <div className="cv-pub-citation">
                        <RichLatexText tokens={entry.tokens} hideMetrics />
                      </div>
                      {metrics.length > 0 && (
                        <div className="cv-pub-metrics">
                          {metrics.map((m, mIdx) => (
                            <Tag key={mIdx} type="cool-gray" size="sm" className="etiquette">
                              {m}
                            </Tag>
                          ))}
                        </div>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        )}

        {/* 04 · EXPERIENCE */}
        {categoryId === 'experience' && sections.experience && (
          <section id="experience" className="cv-section cv-section-single">
            <SectionHeader number="04" title={sections.experience.title} />
            <div className="cv-timeline">
              {sections.experience.entries.map((entry, idx) => (
                <div key={idx} className="cv-two-col-row">
                  <div className="cv-col-label number">{entry.label}</div>
                  <div className="cv-col-content">
                    <div className="cv-entry-head">
                      <RichLatexText tokens={entry.tokens} />
                    </div>
                    {entry.bullets.length > 0 && (
                      <ul className="cv-bullet-list">
                        {entry.bullets.map((bul, bIdx) => (
                          <li key={bIdx}>
                            <RichLatexText tokens={bul} />
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 05 · EDUCATION */}
        {categoryId === 'education' && sections.education && (
          <section id="education" className="cv-section cv-section-single">
            <SectionHeader number="05" title={sections.education.title} />
            <div className="cv-timeline">
              {sections.education.entries.map((entry, idx) => (
                <div key={idx} className="cv-two-col-row">
                  <div className="cv-col-label number">{entry.label}</div>
                  <div className="cv-col-content cv-entry-body">
                    <RichLatexText tokens={entry.tokens} />
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 06 · TALKS AND PRESENTATIONS */}
        {categoryId === 'talks' && sections.talks && (
          <section id="talks" className="cv-section cv-section-single">
            <SectionHeader
              number="06"
              title={sections.talks.title}
              footnote={sections.talks.footnote}
            />

            <div className="cv-filter-bar no-print" role="group" aria-label="Filter talks">
              <button
                type="button"
                className={`cv-filter-chip etiquette ${
                  effectiveTalkCategory === 'ALL' ? 'is-active' : ''
                }`}
                onClick={() => setSelectedTalkCategory('ALL')}
              >
                {allLabel} ({sections.talks.entries.length})
              </button>
              {talkCategories.map((cat) => {
                const count = sections.talks.entries.filter((e) => e.label === cat).length;
                return (
                  <button
                    key={cat}
                    type="button"
                    className={`cv-filter-chip etiquette ${
                      effectiveTalkCategory === cat ? 'is-active' : ''
                    }`}
                    onClick={() => setSelectedTalkCategory(cat)}
                  >
                    {cat} ({count})
                  </button>
                );
              })}
            </div>

            <div className="cv-timeline">
              {filteredTalks.map((entry, idx) => (
                <div key={idx} className="cv-two-col-row cv-compact-row">
                  <div className="cv-col-label">
                    <Tag type="cool-gray" size="sm" className="etiquette">
                      {entry.label}
                    </Tag>
                  </div>
                  <div className="cv-col-content cv-entry-body">
                    <RichLatexText tokens={entry.tokens} />
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 07 · TEACHING */}
        {categoryId === 'teaching' && sections.teaching && (
          <section id="teaching" className="cv-section cv-section-single">
            <SectionHeader
              number="07"
              title={sections.teaching.title}
              footnote={sections.teaching.footnote}
            />
            <div className="cv-list-framed">
              {sections.teaching.entries.map((entry, idx) => {
                const hrs = parseHoursValue(entry.label);
                const pct = Math.round((hrs / maxTeachingHours) * 100);
                return (
                  <div key={idx} className="cv-teaching-row">
                    <div className="cv-teaching-hours">
                      <span className="number cv-hours-val">{entry.label}</span>
                      <div className="cv-hours-bar-track" aria-hidden="true">
                        <div className="cv-hours-bar-fill" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                    <div className="cv-teaching-desc">
                      <RichLatexText tokens={entry.tokens} />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* 08 · TECHNICAL SKILLS */}
        {categoryId === 'skills' && sections.skills && (
          <section id="skills" className="cv-section cv-section-single">
            <SectionHeader number="08" title={sections.skills.title} />
            <Row className="g-3">
              {sections.skills.entries.map((entry, idx) => (
                <Col md={6} key={idx}>
                  <Tile className="cv-carbon-tile cv-skill-tile">
                    <div className="etiquette cv-skill-label">{entry.label}</div>
                    <div className="cv-skill-body">
                      <RichLatexText tokens={entry.tokens} />
                    </div>
                  </Tile>
                </Col>
              ))}
            </Row>
          </section>
        )}

        {/* 09 · MORE (Academic Service, Additional Training, Internships, References) */}
        {categoryId === 'more' && (
          <div className="cv-more-stack">
            {sections.service && (
              <section id="service" className="cv-section">
                <SectionHeader number="09.1" title={sections.service.title} />
                <div className="cv-timeline">
                  {sections.service.entries.map((entry, idx) => (
                    <div key={idx} className="cv-two-col-row cv-compact-row">
                      <div className="cv-col-label etiquette">{entry.label}</div>
                      <div className="cv-col-content cv-entry-body">
                        <RichLatexText tokens={entry.tokens} />
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {sections.training && (
              <section id="training" className="cv-section">
                <SectionHeader number="09.2" title={sections.training.title} />
                <div className="cv-timeline">
                  {sections.training.entries.map((entry, idx) => (
                    <div key={idx} className="cv-two-col-row cv-compact-row">
                      <div className="cv-col-label number">{entry.label}</div>
                      <div className="cv-col-content cv-entry-body">
                        <RichLatexText tokens={entry.tokens} />
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {sections.internships && (
              <section id="internships" className="cv-section">
                <SectionHeader number="09.3" title={sections.internships.title} />
                <div className="cv-timeline">
                  {sections.internships.entries.map((entry, idx) => (
                    <div key={idx} className="cv-two-col-row cv-compact-row">
                      <div className="cv-col-label number">{entry.label}</div>
                      <div className="cv-col-content cv-entry-body">
                        <RichLatexText tokens={entry.tokens} />
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {sections.references && (
              <section id="references" className="cv-section">
                <SectionHeader number="09.4" title={sections.references.title} />
                <Row className="g-3">
                  {sections.references.entries.map((entry, idx) => (
                    <Col md={4} key={idx}>
                      <Tile className="cv-carbon-tile cv-ref-tile">
                        <div className="etiquette cv-ref-role">
                          <Email size={14} /> {entry.label}
                        </div>
                        <div className="cv-ref-body">
                          <RichLatexText tokens={entry.tokens} />
                        </div>
                      </Tile>
                    </Col>
                  ))}
                </Row>
              </section>
            )}
          </div>
        )}
      </Container>
    </div>
  );
}
