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

/**
 * Helper: extract plain string from simple token list
 */
function plainFromTokens(tokens = []) {
  return tokens
    .map((t) => {
      if (t.type === 'text') return t.value;
      if (t.children) return plainFromTokens(t.children);
      return '';
    })
    .join('')
    .trim();
}

/**
 * Split a flat token array on `linebreak` (\newline) tokens into logical lines.
 */
function splitTokenLines(tokens = []) {
  const lines = [[]];
  for (const tok of tokens) {
    if (tok.type === 'linebreak') {
      lines.push([]);
    } else {
      lines[lines.length - 1].push(tok);
    }
  }
  return lines.filter((line) => line.length > 0);
}

/**
 * Check if a token is an italicized field label ending with ':' (e.g., \textit{Title:}, \textit{Laboratoire :})
 */
function isItalicFieldLabel(tok) {
  if (!tok || tok.type !== 'italic') return false;
  const txt = plainFromTokens(tok.children);
  return txt.endsWith(':') && txt.length <= 28;
}

/**
 * Split a sub-line that may contain multiple \textit{Label:} fields separated by ' – '
 * (e.g. "\textit{Laboratory:} LICAE -- \textit{Supervisor:} Dr Loïc Heurley")
 */
function splitSublineFields(lineTokens) {
  const segments = [];
  let current = null;

  for (let i = 0; i < lineTokens.length; i++) {
    const tok = lineTokens[i];
    if (isItalicFieldLabel(tok)) {
      if (current) {
        // Trim trailing ' – ' separator from previous field value
        const lastIdx = current.valueTokens.length - 1;
        if (lastIdx >= 0 && current.valueTokens[lastIdx].type === 'text') {
          current.valueTokens[lastIdx] = {
            ...current.valueTokens[lastIdx],
            value: current.valueTokens[lastIdx].value.replace(/\s*[–—-]\s*$/, ''),
          };
        }
        segments.push(current);
      }
      const rawLabel = plainFromTokens(tok.children).replace(/\s*:$/, '').trim();
      current = {
        label: rawLabel,
        valueTokens: [],
      };
    } else if (current) {
      current.valueTokens.push(tok);
    } else {
      return null;
    }
  }

  if (current) segments.push(current);
  return segments.length > 0 ? segments : null;
}

/**
 * Render Level-1 primary line, separating leading bold title from trailing " – Context"
 */
function LevelOneLine({ tokens, hideMetrics }) {
  if (
    tokens.length >= 2 &&
    tokens[0].type === 'bold' &&
    tokens[1].type === 'text' &&
    /^\s*[–—-]\s+/.test(tokens[1].value)
  ) {
    const restFirstText = tokens[1].value.replace(/^\s*[–—-]\s+/, '');
    const contextTokens = [
      ...(restFirstText ? [{ type: 'text', value: restFirstText }] : []),
      ...tokens.slice(2),
    ];

    return (
      <div className="cv-level1-line">
        <span className="cv-level1-title">
          <RichLatexText tokens={[tokens[0]]} hideMetrics={hideMetrics} />
        </span>
        <span className="cv-level1-sep" aria-hidden="true">
          —
        </span>
        <span className="cv-level1-context">
          <RichLatexText tokens={contextTokens} hideMetrics={hideMetrics} />
        </span>
      </div>
    );
  }

  return (
    <div className="cv-level1-line">
      <RichLatexText tokens={tokens} hideMetrics={hideMetrics} />
    </div>
  );
}

/**
 * Renders a multi-level CV entry (Level 1 heading + Level 2/3 indented sub-lines & labeled metadata fields).
 */
export function StructuredEntry({ tokens = [], hideMetrics = false }) {
  const lines = splitTokenLines(tokens);
  if (lines.length === 0) return null;

  const [firstLine, ...subLines] = lines;

  return (
    <div className="cv-entry-hierarchy">
      <LevelOneLine tokens={firstLine} hideMetrics={hideMetrics} />

      {subLines.length > 0 && (
        <div className="cv-sublevel-stack">
          {subLines.map((line, idx) => {
            const fields = splitSublineFields(line);
            if (fields) {
              return (
                <div key={idx} className="cv-sublevel-fields-group">
                  {fields.map((field, fIdx) => (
                    <div key={fIdx} className="cv-sublevel-field">
                      <span className="cv-field-tag etiquette">{field.label}</span>
                      <span className="cv-field-value">
                        <RichLatexText tokens={field.valueTokens} hideMetrics={hideMetrics} />
                      </span>
                    </div>
                  ))}
                </div>
              );
            }

            return (
              <div key={idx} className="cv-sublevel-paragraph">
                <RichLatexText tokens={line} hideMetrics={hideMetrics} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/**
 * Parse a text block for a parenthesized semicolon-separated step list
 * e.g. "(Discover: guided discovery...; Explore: simulations...; Train your eye: ...; Check yourself: ...)"
 */
function extractParenthesizedSteps(text) {
  const match = text.match(/\(([^()]+;[^()]+)\)/);
  if (!match) return null;

  const parts = match[1]
    .split(';')
    .map((s) => s.trim())
    .filter(Boolean);

  // Only treat as a structured Level-3 step list if at least 3 items have "Label: description"
  const colonCount = parts.filter((p) => /^[^:]{2,32}:\s+.+/.test(p)).length;
  if (parts.length < 3 || colonCount < 3) return null;

  const before = text.slice(0, match.index).trim();
  const after = text.slice(match.index + match[0].length).replace(/^\s*\.\s*/, '').trim();

  const steps = parts.map((p) => {
    const colonIdx = p.indexOf(':');
    if (colonIdx !== -1) {
      return {
        title: p.slice(0, colonIdx).trim(),
        desc: p.slice(colonIdx + 1).trim(),
      };
    }
    return { title: '', desc: p };
  });

  return { before, steps, after };
}

/**
 * Renders a bullet item (\bul{...}) with multi-level detection:
 * - Highlights lead phrase before ':' as a Level-2 sub-heading
 * - Expands parenthesized multi-step breakdowns into an indented Level-3 list
 */
export function StructuredBullet({ tokens = [] }) {
  if (!tokens || tokens.length === 0) return null;

  const first = tokens[0];
  if (first.type === 'text') {
    const colonIdx = first.value.indexOf(':');
    if (colonIdx > 2 && colonIdx <= 88) {
      const leadText = first.value.slice(0, colonIdx).trim();
      const afterColon = first.value.slice(colonIdx + 1).trim();

      // Check if single-text bullet also has a Level-3 parenthesized step list
      if (tokens.length === 1) {
        const stepBreakdown = extractParenthesizedSteps(afterColon);
        if (stepBreakdown) {
          return (
            <div className="cv-bullet-multilevel">
              <div className="cv-bullet-top">
                <span className="cv-bullet-lead">{leadText}</span>
                {stepBreakdown.before && (
                  <span className="cv-bullet-rest"> — {stepBreakdown.before}</span>
                )}
              </div>

              <ul className="cv-level3-list">
                {stepBreakdown.steps.map((st, sIdx) => (
                  <li key={sIdx} className="cv-level3-item">
                    {st.title && (
                      <span className="cv-level3-tag etiquette">{st.title}</span>
                    )}
                    <span className="cv-level3-desc">{st.desc}</span>
                  </li>
                ))}
              </ul>

              {stepBreakdown.after && (
                <div className="cv-bullet-footnote">{stepBreakdown.after}</div>
              )}
            </div>
          );
        }
      }

      const restTokens = [
        ...(afterColon ? [{ type: 'text', value: ` ${afterColon}` }] : []),
        ...tokens.slice(1),
      ];

      return (
        <div className="cv-bullet-multilevel">
          <span className="cv-bullet-lead">{leadText}:</span>
          <span className="cv-bullet-rest">
            <RichLatexText tokens={restTokens} />
          </span>
        </div>
      );
    }
  }

  return <RichLatexText tokens={tokens} />;
}
