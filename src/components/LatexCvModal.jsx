import React, { useState } from 'react';
import {
  Modal,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  Button,
  TextInput,
  TextArea,
  Tag,
} from '@carbon/react';
import { Download, Copy, Upload } from '@carbon/icons-react';
import UIkit from 'uikit';
import {
  readLatexFile,
  renderLatexDocument,
  createLatexFile,
} from '../utils/latexUtils';

const LABELS = {
  en: {
    heading: 'LaTeX CV Source & Tools',
    label: 'TEX // SOURCE & BUILDER',
    tabSource: 'Active CV (.tex)',
    tabTools: 'Read / Create .tex',
    downloadActive: 'Download .tex',
    copySource: 'Copy source',
    copied: 'LaTeX source copied',
    downloaded: 'LaTeX file downloaded',
    uploadLabel: 'Open a local .tex file to inspect & preview',
    uploadBtn: 'Load .tex file',
    titleLabel: 'Document Title',
    authorLabel: 'Author',
    bodyLabel: 'LaTeX Body / Equations',
    createBtn: 'Create & Download .tex',
    previewHeading: 'Rendered Preview (latex.js / KaTeX)',
  },
  fr: {
    heading: 'Source LaTeX du CV & Outils',
    label: 'TEX // SOURCE & ÉDITEUR',
    tabSource: 'CV actif (.tex)',
    tabTools: 'Lire / Créer un .tex',
    downloadActive: 'Télécharger le .tex',
    copySource: 'Copier la source',
    copied: 'Source LaTeX copiée',
    downloaded: 'Fichier LaTeX téléchargé',
    uploadLabel: 'Ouvrir un fichier .tex local pour le lire et le prévisualiser',
    uploadBtn: 'Charger un fichier .tex',
    titleLabel: 'Titre du document',
    authorLabel: 'Auteur',
    bodyLabel: 'Corps LaTeX / Équations',
    createBtn: 'Créer et télécharger (.tex)',
    previewHeading: 'Aperçu rendu (latex.js / KaTeX)',
  },
};

const DEFAULT_SNIPPET = `P(C = 1 \\mid x_V, x_T) = \\frac{P(x_V, x_T \\mid C = 1)\\,P(C = 1)}{P(x_V, x_T)}`;

export default function LatexCvModal({ open, onClose, lang, rawTex }) {
  const t = LABELS[lang] || LABELS.en;
  const filename = lang === 'fr' ? 'main_master_FR.tex' : 'main_master_EN.tex';

  const [docTitle, setDocTitle] = useState('Research Note — Body Representation');
  const [docAuthor, setDocAuthor] = useState('Hamza Sabek');
  const [docBody, setDocBody] = useState(DEFAULT_SNIPPET);
  const [loadedFileName, setLoadedFileName] = useState('');

  const handleDownloadActive = () => {
    const blob = new Blob([rawTex], { type: 'application/x-tex;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    UIkit.notification({
      message: `<span class="etiquette">${t.downloaded}: ${filename}</span>`,
      status: 'primary',
      pos: 'bottom-right',
      timeout: 2400,
    });
  };

  const handleCopySource = async () => {
    try {
      await navigator.clipboard.writeText(rawTex);
      UIkit.notification({
        message: `<span class="etiquette">${t.copied}</span>`,
        status: 'primary',
        pos: 'bottom-right',
        timeout: 2200,
      });
    } catch {
      // Fallback ignored silently
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await readLatexFile(file);
    setLoadedFileName(file.name);
    setDocBody(text);
  };

  const handleCreateTex = () => {
    createLatexFile({
      title: docTitle,
      author: docAuthor,
      body: docBody,
      filename: 'hamza_sabek_note.tex',
    });
    UIkit.notification({
      message: `<span class="etiquette">${t.downloaded}: hamza_sabek_note.tex</span>`,
      status: 'primary',
      pos: 'bottom-right',
      timeout: 2400,
    });
  };

  const previewHtml = renderLatexDocument(docBody);

  return (
    <Modal
      open={open}
      onRequestClose={onClose}
      modalHeading={t.heading}
      modalLabel={t.label}
      passiveModal
      size="lg"
      className="latex-carbon-modal"
    >
      <Tabs>
        <TabList aria-label="LaTeX tools">
          <Tab>{t.tabSource}</Tab>
          <Tab>{t.tabTools}</Tab>
        </TabList>
        <TabPanels>
          <TabPanel>
            <div className="latex-modal-toolbar">
              <Tag type="cool-gray" size="sm" className="etiquette">
                {filename}
              </Tag>
              <div className="latex-modal-actions">
                <Button kind="tertiary" size="sm" onClick={handleCopySource} renderIcon={Copy}>
                  {t.copySource}
                </Button>
                <Button kind="primary" size="sm" onClick={handleDownloadActive} renderIcon={Download}>
                  {t.downloadActive}
                </Button>
              </div>
            </div>
            <pre className="latex-source-viewer">{rawTex}</pre>
          </TabPanel>

          <TabPanel>
            <div className="latex-tool-stack">
              <div className="latex-upload-bar">
                <span className="etiquette">{t.uploadLabel}</span>
                <label className="cds--btn cds--btn--tertiary cds--btn--sm latex-upload-label">
                  <Upload size={16} />
                  <span>{t.uploadBtn}</span>
                  <input
                    type="file"
                    accept=".tex,.latex,.txt"
                    onChange={handleFileUpload}
                    hidden
                  />
                </label>
                {loadedFileName && (
                  <Tag type="teal" size="sm" className="etiquette">
                    {loadedFileName}
                  </Tag>
                )}
              </div>

              <div className="latex-form-grid">
                <TextInput
                  id="latex-doc-title"
                  labelText={t.titleLabel}
                  value={docTitle}
                  onChange={(e) => setDocTitle(e.target.value)}
                />
                <TextInput
                  id="latex-doc-author"
                  labelText={t.authorLabel}
                  value={docAuthor}
                  onChange={(e) => setDocAuthor(e.target.value)}
                />
              </div>

              <TextArea
                id="latex-doc-body"
                labelText={t.bodyLabel}
                rows={5}
                value={docBody}
                onChange={(e) => setDocBody(e.target.value)}
                className="latex-textarea-mono"
              />

              <div className="latex-preview-box">
                <div className="etiquette latex-preview-heading">{t.previewHeading}</div>
                <div
                  className="latex-preview-output"
                  dangerouslySetInnerHTML={{ __html: previewHtml }}
                />
              </div>

              <div>
                <Button kind="primary" size="sm" onClick={handleCreateTex} renderIcon={Download}>
                  {t.createBtn}
                </Button>
              </div>
            </div>
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Modal>
  );
}
