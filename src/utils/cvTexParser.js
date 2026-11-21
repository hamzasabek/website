/**
 * Parser for Hamza Sabek's bilingual LaTeX CV files
 * (main_master_EN.tex and main_master_FR.tex).
 *
 * Extracts header metadata and all SectionTable blocks into structured JS objects
 * with inline formatting tokens so the React UI renders 100% of the CV content
 * directly from the .tex sources.
 */

function stripComments(tex) {
  return tex
    .split(/\r?\n/)
    .map((line) => {
      let out = '';
      for (let i = 0; i < line.length; i++) {
        if (line[i] === '%' && (i === 0 || line[i - 1] !== '\\')) {
          break;
        }
        out += line[i];
      }
      return out;
    })
    .join('\n');
}

function readBracedArg(str, startIndex) {
  let i = startIndex;
  while (i < str.length && /\s/.test(str[i])) i++;
  if (str[i] !== '{') return null;

  let depth = 0;
  let contentStart = i + 1;
  for (let j = i; j < str.length; j++) {
    if (str[j] === '\\' && j + 1 < str.length) {
      j++;
      continue;
    }
    if (str[j] === '{') depth++;
    else if (str[j] === '}') {
      depth--;
      if (depth === 0) {
        return {
          content: str.slice(contentStart, j),
          endIndex: j + 1,
        };
      }
    }
  }
  return null;
}

function cleanPlainText(text) {
  return text
    .replace(/``/g, '“')
    .replace(/''/g, '”')
    .replace(/---/g, '—')
    .replace(/--/g, '–')
    .replace(/~/g, '\u00A0')
    .replace(/\\&/g, '&')
    .replace(/\\%/g, '%')
    .replace(/\\_/g, '_')
    .replace(/\\ /g, ' ')
    .replace(/\\,/g, ' ')
    .replace(/\s+/g, ' ');
}

/**
 * Parse inline LaTeX markup into an array of typed tokens:
 * { type: 'text' | 'bold' | 'italic' | 'sup' | 'link' | 'globe' | 'metric' | 'linebreak' | 'dot' }
 */
export function parseInlineLatex(raw) {
  if (!raw) return [];
  const input = raw.trim();
  const tokens = [];
  let buffer = '';
  let i = 0;

  const flushBuffer = () => {
    if (buffer) {
      const cleaned = cleanPlainText(buffer);
      if (cleaned) {
        tokens.push({ type: 'text', value: cleaned });
      }
      buffer = '';
    }
  };

  while (i < input.length) {
    // Handle math dot separator: $\;\boldsymbol{\cdot}\;$
    if (input[i] === '$') {
      const nextDollar = input.indexOf('$', i + 1);
      if (nextDollar !== -1) {
        const mathContent = input.slice(i + 1, nextDollar);
        flushBuffer();
        if (mathContent.includes('\\cdot')) {
          tokens.push({ type: 'dot' });
        } else {
          tokens.push({ type: 'math', value: mathContent.trim() });
        }
        i = nextDollar + 1;
        continue;
      }
    }

    if (input[i] === '\\') {
      // Escaped single-char symbols
      if (i + 1 < input.length && '&%_#$ '.includes(input[i + 1])) {
        buffer += input.slice(i, i + 2);
        i += 2;
        continue;
      }

      // Extract command name
      let cmdEnd = i + 1;
      while (cmdEnd < input.length && /[a-zA-Z]/.test(input[cmdEnd])) {
        cmdEnd++;
      }
      const cmd = input.slice(i + 1, cmdEnd);

      if (cmd === 'newline') {
        flushBuffer();
        tokens.push({ type: 'linebreak' });
        i = cmdEnd;
        continue;
      }

      if (cmd === 'textbf' || cmd === 'textit' || cmd === 'textsuperscript') {
        const arg = readBracedArg(input, cmdEnd);
        if (arg) {
          flushBuffer();
          const typeMap = {
            textbf: 'bold',
            textit: 'italic',
            textsuperscript: 'sup',
          };
          tokens.push({
            type: typeMap[cmd],
            children: parseInlineLatex(arg.content),
          });
          i = arg.endIndex;
          continue;
        }
      }

      if (cmd === 'color') {
        const arg = readBracedArg(input, cmdEnd);
        if (arg) {
          i = arg.endIndex;
          continue;
        }
      }

      if (cmd === 'metric') {
        const arg = readBracedArg(input, cmdEnd);
        if (arg) {
          flushBuffer();
          tokens.push({
            type: 'metric',
            value: cleanPlainText(arg.content).trim(),
          });
          i = arg.endIndex;
          continue;
        }
      }

      if (cmd === 'href') {
        const urlArg = readBracedArg(input, cmdEnd);
        if (urlArg) {
          const labelArg = readBracedArg(input, urlArg.endIndex);
          if (labelArg) {
            flushBuffer();
            const labelTrimmed = labelArg.content.trim();
            if (labelTrimmed === '\\faGlobe') {
              tokens.push({ type: 'globe', url: urlArg.content.trim() });
            } else {
              tokens.push({
                type: 'link',
                url: urlArg.content.trim(),
                children: parseInlineLatex(labelTrimmed),
              });
            }
            i = labelArg.endIndex;
            continue;
          }
        }
      }

      if (cmd === 'Huge' || cmd === 'Large' || cmd === 'small' || cmd === 'headingfont') {
        i = cmdEnd;
        continue;
      }

      if (cmd === 'today') {
        flushBuffer();
        tokens.push({ type: 'text', value: '2026' });
        i = cmdEnd;
        continue;
      }

      // Unknown command fallback: skip command name safely
      if (cmd.length > 0) {
        i = cmdEnd;
        continue;
      }
    }

    // Ignore stray bare braces used for grouping like {\small ...}
    if (input[i] === '{' || input[i] === '}') {
      i++;
      continue;
    }

    buffer += input[i];
    i++;
  }

  flushBuffer();
  return tokens;
}

export function tokensToPlainText(tokens) {
  return tokens
    .map((t) => {
      if (t.type === 'text' || t.type === 'metric' || t.type === 'math') return t.value;
      if (t.type === 'linebreak') return ' ';
      if (t.type === 'dot') return ' · ';
      if (t.children) return tokensToPlainText(t.children);
      return '';
    })
    .join('')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Split a SectionTable body into logical rows separated by `\\` or `\\*`.
 */
function splitTableRows(body) {
  const rows = [];
  let current = '';
  let depth = 0;

  for (let i = 0; i < body.length; i++) {
    const ch = body[i];
    if (ch === '{') {
      depth++;
      current += ch;
    } else if (ch === '}') {
      depth = Math.max(0, depth - 1);
      current += ch;
    } else if (ch === '\\' && body[i + 1] === '\\' && depth === 0) {
      rows.push(current.trim());
      current = '';
      i++; // skip second backslash
      if (body[i + 1] === '*') i++; // skip optional *
    } else {
      current += ch;
    }
  }
  if (current.trim()) rows.push(current.trim());
  return rows.filter(Boolean);
}

/**
 * Split a table row on the first top-level `&` (not escaped `\&`).
 */
function splitRowColumns(row) {
  let depth = 0;
  for (let i = 0; i < row.length; i++) {
    if (row[i] === '\\' && i + 1 < row.length) {
      i++;
      continue;
    }
    if (row[i] === '{') depth++;
    else if (row[i] === '}') depth = Math.max(0, depth - 1);
    else if (row[i] === '&' && depth === 0) {
      return {
        left: row.slice(0, i).trim(),
        right: row.slice(i + 1).trim(),
      };
    }
  }
  return { left: '', right: row.trim() };
}

function extractHeadingAndFootnote(rawTitle) {
  let titleStr = rawTitle.replace(/\\headingfont\b/g, '').replace(/\\Huge\b/g, '').trim();
  let footnoteTokens = null;

  const fnIdx = titleStr.indexOf('\\footnote');
  if (fnIdx !== -1) {
    const fnArg = readBracedArg(titleStr, fnIdx + '\\footnote'.length);
    if (fnArg) {
      footnoteTokens = parseInlineLatex(fnArg.content);
      titleStr = (titleStr.slice(0, fnIdx) + titleStr.slice(fnArg.endIndex)).trim();
    }
  }

  return {
    title: cleanPlainText(titleStr).trim(),
    footnote: footnoteTokens,
  };
}

/**
 * Extract all \begin{SectionTable}{TITLE}...\end{SectionTable} blocks from a .tex file.
 */
function extractSectionTables(texBody) {
  const sections = [];
  const startMarker = '\\begin{SectionTable}';
  const endMarker = '\\end{SectionTable}';
  let cursor = 0;

  while (cursor < texBody.length) {
    const startIdx = texBody.indexOf(startMarker, cursor);
    if (startIdx === -1) break;

    const titleArg = readBracedArg(texBody, startIdx + startMarker.length);
    if (!titleArg) break;

    const endIdx = texBody.indexOf(endMarker, titleArg.endIndex);
    if (endIdx === -1) break;

    const innerBody = texBody.slice(titleArg.endIndex, endIdx);
    const { title, footnote } = extractHeadingAndFootnote(titleArg.content);
    const rawRows = splitTableRows(innerBody);

    const parsedRows = rawRows.map((rawRow) => {
      const { left, right } = splitRowColumns(rawRow);
      const isBullet = right.startsWith('\\bul');
      let contentRaw = right;
      if (isBullet) {
        const bulArg = readBracedArg(right, '\\bul'.length);
        if (bulArg) contentRaw = bulArg.content;
      }
      return {
        label: cleanPlainText(left).trim(),
        isBullet,
        tokens: parseInlineLatex(contentRaw),
        raw: contentRaw,
      };
    });

    sections.push({
      title,
      footnote,
      rows: parsedRows,
    });

    cursor = endIdx + endMarker.length;
  }

  return sections;
}

/**
 * Group rows where bullet rows (and continuation link rows under Projects) attach to their parent entry.
 */
function groupEntries(rows, { inheritCategory = false } = {}) {
  const entries = [];
  let activeCategory = '';

  for (const row of rows) {
    if (row.label) {
      activeCategory = row.label;
    }

    const isPureLinkContinuation =
      !row.label &&
      !row.isBullet &&
      row.tokens.length === 1 &&
      row.tokens[0].type === 'link';

    if ((row.isBullet || isPureLinkContinuation) && entries.length > 0) {
      const parent = entries[entries.length - 1];
      if (row.isBullet) {
        parent.bullets.push(row.tokens);
      } else {
        parent.footerLink = row.tokens[0];
      }
    } else {
      entries.push({
        label: row.label || (inheritCategory ? activeCategory : ''),
        explicitLabel: row.label,
        tokens: row.tokens,
        bullets: [],
        footerLink: null,
      });
    }
  }

  return entries;
}

function parseHeaderSection(headerSection) {
  const name = headerSection.title;
  const firstRow = headerSection.rows[0];
  const tokens = firstRow ? firstRow.tokens : [];

  // Split by linebreak tokens into header lines
  const lines = [[]];
  for (const tok of tokens) {
    if (tok.type === 'linebreak') {
      lines.push([]);
    } else {
      lines[lines.length - 1].push(tok);
    }
  }

  const subtitleTokens = lines[0] || [];
  const qualificationTokens = lines[1] || [];
  const contactTokens = lines[2] || [];
  const socialTokens = lines[3] || [];

  const emailTok = contactTokens.find((t) => t.type === 'link' && t.url.startsWith('mailto:'));
  const phoneTok = contactTokens.find((t) => t.type === 'link' && t.url.startsWith('tel:'));
  const locationParts = contactTokens
    .filter((t) => t.type === 'text')
    .map((t) => t.value.trim())
    .filter(Boolean);

  const socials = socialTokens
    .filter((t) => t.type === 'link')
    .map((t) => ({
      label: tokensToPlainText(t.children),
      url: t.url,
    }));

  return {
    name,
    subtitle: tokensToPlainText(subtitleTokens),
    qualification: tokensToPlainText(qualificationTokens),
    email: emailTok ? emailTok.url.replace('mailto:', '') : '',
    phone: phoneTok ? tokensToPlainText(phoneTok.children) : '',
    phoneHref: phoneTok ? phoneTok.url : '',
    location: locationParts.join(' '),
    socials,
  };
}

/**
 * Parse an entire CV .tex file (EN or FR) into a clean canonical data model.
 */
export function parseCvTex(rawTex, lang = 'en') {
  const clean = stripComments(rawTex);
  const docStart = clean.indexOf('\\begin{document}');
  const docEnd = clean.indexOf('\\end{document}');
  const body =
    docStart !== -1 && docEnd !== -1
      ? clean.slice(docStart + '\\begin{document}'.length, docEnd)
      : clean;

  const tables = extractSectionTables(body);

  // Order in both main_master_EN.tex and main_master_FR.tex:
  // 0: Header (Hamza Sabek)
  // 1: Research Profile / Profil de recherche
  // 2: Education / Diplômes
  // 3: Experience / Expérience
  // 4: Projects / Projets
  // 5: Publications / Publications
  // 6: Talks and Presentations / Communications
  // 7: Teaching / Enseignements
  // 8: Academic Service / Engagement collectif
  // 9: Additional Training / Formations complémentaires
  // 10: Technical Skills / Compétences techniques
  // 11: Internships / Stages
  // 12: References / Références

  const header = tables[0] ? parseHeaderSection(tables[0]) : null;
  const sectionKeys = [
    'profile',
    'education',
    'experience',
    'projects',
    'publications',
    'talks',
    'teaching',
    'service',
    'training',
    'skills',
    'internships',
    'references',
  ];

  const sections = {};
  sectionKeys.forEach((key, idx) => {
    const tbl = tables[idx + 1];
    if (!tbl) return;
    const inheritCategory = key === 'publications' || key === 'talks' || key === 'service';
    sections[key] = {
      key,
      title: tbl.title,
      footnote: tbl.footnote,
      entries: groupEntries(tbl.rows, { inheritCategory }),
    };
  });

  // Extract total teaching hours number from teaching title (e.g., 413)
  const teachingHoursMatch = sections.teaching?.title?.match(/(\d+)/);
  const teachingHours = teachingHoursMatch ? parseInt(teachingHoursMatch[1], 10) : 413;

  return {
    lang,
    rawTex,
    header,
    sections,
    stats: {
      publications: sections.publications?.entries?.length || 0,
      talks: sections.talks?.entries?.length || 0,
      teachingHours,
      cnuSections: 3,
    },
  };
}
