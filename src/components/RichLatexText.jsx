import React from 'react';
import { Tag } from '@carbon/react';
import { Launch } from '@carbon/icons-react';
import { InlineMath } from 'react-katex';

/**
 * Renders parsed LaTeX inline tokens into clean IBM Carbon typography & links.
 */
export default function RichLatexText({ tokens = [], hideMetrics = false }) {
  if (!tokens || tokens.length === 0) return null;

  return (
    <>
      {tokens.map((tok, index) => {
        switch (tok.type) {
          case 'text':
            return <React.Fragment key={index}>{tok.value}</React.Fragment>;

          case 'bold':
            return (
              <strong key={index} className="cv-strong">
                <RichLatexText tokens={tok.children} hideMetrics={hideMetrics} />
              </strong>
            );

          case 'italic':
            return (
              <em key={index} className="cv-em">
                <RichLatexText tokens={tok.children} hideMetrics={hideMetrics} />
              </em>
            );

          case 'sup':
            return (
              <sup key={index}>
                <RichLatexText tokens={tok.children} hideMetrics={hideMetrics} />
              </sup>
            );

          case 'link': {
            const isExternal = tok.url.startsWith('http');
            return (
              <a
                key={index}
                href={tok.url}
                className="cv-link"
                target={isExternal ? '_blank' : undefined}
                rel={isExternal ? 'noopener noreferrer' : undefined}
              >
                <RichLatexText tokens={tok.children} hideMetrics={hideMetrics} />
              </a>
            );
          }

          case 'globe':
            return (
              <a
                key={index}
                href={tok.url}
                target="_blank"
                rel="noopener noreferrer"
                className="cv-globe-link"
                title={tok.url}
                aria-label={`External link: ${tok.url}`}
              >
                <Launch size={14} />
              </a>
            );

          case 'metric':
            if (hideMetrics) return null;
            return (
              <span key={index} className="cv-metric-wrap">
                <Tag type="cool-gray" size="sm" className="etiquette cv-metric-tag">
                  {tok.value}
                </Tag>
              </span>
            );

          case 'math':
            return <InlineMath key={index} math={tok.value} />;

          case 'dot':
            return (
              <span key={index} className="cv-dot" aria-hidden="true">
                ·
              </span>
            );

          case 'linebreak':
            return <br key={index} />;

          default:
            return null;
        }
      })}
    </>
  );
}
