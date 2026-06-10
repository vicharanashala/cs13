import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { fetchFaq } from '../api';

const filterChips = [
  { key: 'all', label: 'All' },
  { key: 'about', label: 'About' },
  { key: 'timing', label: 'Timing' },
  { key: 'eligibility', label: 'Eligibility' },
  { key: 'noc', label: 'NOC' },
  { key: 'stipend', label: 'Stipend' },
  { key: 'mode', label: 'Internship Mode' },
  { key: 'documents', label: 'Documents' },
  { key: 'selection', label: 'Selection' },
  { key: 'work', label: 'Work' },
  { key: 'conduct', label: 'Conduct' },
  { key: 'interview', label: 'Interview' },
  { key: 'certificate', label: 'Certificate' },
  { key: 'rosetta', label: 'Rosetta' },
  { key: 'phase1', label: 'Phase 1' },
  { key: 'yaksha', label: 'Yaksha' },
  { key: 'vibe', label: 'ViBe' },
  { key: 'team', label: 'Team Formation' }
];

const faqCategoryLabels = {
  about: 'About the Internship',
  timing: 'Timing and Dates',
  eligibility: 'Eligibility',
  noc: 'NOC',
  stipend: 'Stipend',
  mode: 'Internship Mode',
  documents: 'Documents',
  selection: 'Selection, Offer Letter, and Certificate',
  work: 'Work, Mentorship, and Projects',
  conduct: 'Code of Conduct & Communication',
  interview: 'Interview Related',
  certificate: 'Certificate',
  rosetta: 'Rosetta Journal',
  phase1: 'Phase 1 — Coursework & ViBe',
  yaksha: 'Yaksha Chat',
  vibe: 'ViBe Platform',
  team: 'Team Formation'
};

function normalizeText(value = '') {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function findShortcutMatch(faq, { category, question, search }) {
  const filteredByCategory = category && category !== 'all'
    ? faq.filter(item => item.cat === category)
    : faq;

  if (question) {
    const normalizedQuestion = normalizeText(question);
    const exact = faq.find(item => normalizeText(item.q) === normalizedQuestion);
    if (exact) return exact;
  }

  if (search) {
    const query = normalizeText(search);
    const searchHits = filteredByCategory.filter(item => (
      normalizeText(item.q).includes(query) || normalizeText(item.a).includes(query)
    ));
    if (searchHits.length > 0) return searchHits[0];

    const fallbackHits = faq.filter(item => (
      normalizeText(item.q).includes(query) || normalizeText(item.a).includes(query)
    ));
    if (fallbackHits.length > 0) return fallbackHits[0];
  }

  if (filteredByCategory.length > 0) return filteredByCategory[0];
  return null;
}

function FaqPage() {
  const location = useLocation();
  const [faq, setFaq] = useState([]);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [expandedCat, setExpandedCat] = useState({});
  const [expandedItem, setExpandedItem] = useState({});
  const [highlightedItemId, setHighlightedItemId] = useState(null);
  const itemRefs = useRef({});
  const appliedShortcutRef = useRef('');

  useEffect(() => {
    fetchFaq().then(setFaq);
  }, []);

  useEffect(() => {
    if (!faq.length) return;

    const params = new URLSearchParams(location.search);
    const category = params.get('cat') || 'all';
    const question = params.get('question') || '';
    const searchQuery = params.get('search') || '';
    const label = params.get('label') || '';
    const appliedKey = `${category}|${question}|${searchQuery}`;
    if (appliedShortcutRef.current === appliedKey) return;
    appliedShortcutRef.current = appliedKey;

    const initialSearch = searchQuery || (!question ? '' : '');
    setActiveCategory(category);
    setSearch(initialSearch);
    setExpandedCat({});
    setExpandedItem({});
    setHighlightedItemId(null);

    const matchedItem = findShortcutMatch(faq, {
      category,
      question,
      search: searchQuery || question,
    });

    if (matchedItem) {
      setActiveCategory(matchedItem.cat);
      setExpandedCat(prev => ({ ...prev, [matchedItem.cat]: true }));
      setExpandedItem(prev => ({ ...prev, [matchedItem.id]: true }));
      setHighlightedItemId(matchedItem.id);
      window.requestAnimationFrame(() => {
        itemRefs.current[matchedItem.id]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
    } else if (searchQuery || question) {
      setSearch(searchQuery || question);
    }
  }, [faq, location.search]);

  const filtered = useMemo(() => {
    let items = faq;
    if (activeCategory !== 'all') {
      items = items.filter(item => item.cat === activeCategory);
    }
    if (search.trim()) {
      const query = search.toLowerCase();
      items = items.filter(item => item.q.toLowerCase().includes(query) || item.a.toLowerCase().includes(query));
    }
    return items;
  }, [faq, activeCategory, search]);

  const grouped = useMemo(() => {
    const groups = {};
    filtered.forEach(item => {
      if (!groups[item.cat]) groups[item.cat] = [];
      groups[item.cat].push(item);
    });
    return groups;
  }, [filtered]);

  const categoriesToShow = useMemo(() => {
    return Object.entries(grouped).map(([cat, items]) => ({ key: cat, label: faqCategoryLabels[cat] || cat, items }));
  }, [grouped]);

  const shortcutTrail = useMemo(() => {
    const params = new URLSearchParams(location.search);
    const category = params.get('cat') || '';
    const question = params.get('question') || '';
    const searchQuery = params.get('search') || '';
    const label = params.get('label') || '';
    const matchedItem = findShortcutMatch(faq, {
      category,
      question,
      search: searchQuery || question,
    });

    if (matchedItem) {
      return {
        root: 'Home',
        page: 'FAQ',
        section: faqCategoryLabels[matchedItem.cat] || matchedItem.cat,
        target: label || matchedItem.q,
      };
    }

    if (searchQuery || question) {
      return {
        root: 'Home',
        page: 'FAQ',
        section: searchQuery ? 'Search' : (faqCategoryLabels[category] || category || 'Search'),
        target: label || searchQuery || question,
      };
    }

    if (category && category !== 'all') {
      return {
        root: 'Home',
        page: 'FAQ',
        section: faqCategoryLabels[category] || category,
        target: '',
      };
    }

    return null;
  }, [faq, location.search]);

  return (
    <div className="faq-page">
      <section className="faq-hero">
        <p className="page-label">Knowledge Hub</p>
        <h1>Every question, <span>answered.</span></h1>
        <p>Search the most complete FAQ database for the Samagama internship program.</p>
      </section>

      <div className="faq-controls">
        <div className="search-box">
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search — stipend, NOC, certificate, remote..." />
        </div>
      </div>

      {shortcutTrail && (
        <div className="faq-breadcrumb" style={{
          margin: '0 0 14px',
          padding: '12px 16px',
          borderRadius: 16,
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.08)',
          color: '#cbd5e1',
          fontSize: 13,
          display: 'flex',
          flexWrap: 'wrap',
          gap: 8,
          alignItems: 'center',
        }}>
          <span style={{ color: '#94a3b8', fontWeight: 700 }}>Breadcrumb</span>
          <span>Home → FAQ</span>
          {shortcutTrail.section && <span>→ {shortcutTrail.section}</span>}
          {shortcutTrail.target && <span style={{ color: '#ffffff', fontWeight: 800 }}>→ {shortcutTrail.target}</span>}
        </div>
      )}

      <div className="faq-filter-chips">
        {filterChips.map(chip => (
          <button
            key={chip.key}
            className={activeCategory === chip.key ? 'filter-chip active' : 'filter-chip'}
            onClick={() => setActiveCategory(activeCategory === chip.key ? 'all' : chip.key)}
          >
            {chip.label}
          </button>
        ))}
      </div>

      <div className="faq-groups-container">
          {categoriesToShow.length === 0 ? (
            <div className="faq-empty">No FAQ entries match your search yet. Try another keyword or ask Yaksha-mini.</div>
          ) : categoriesToShow.map((group, gi) => (
            <div key={group.key} className="faq-group">
              <button 
                className="group-header" 
                onClick={() => setExpandedCat(prev => ({ ...prev, [group.key]: !prev[group.key] }))}
              >
                <div>
                  <span>{group.label}</span>
                  <small>{group.items.length} question{group.items.length > 1 ? 's' : ''}</small>
                </div>
                <span>{expandedCat[group.key] ? '▲' : '▼'}</span>
              </button>
              <div className={expandedCat[group.key] ? 'group-body open' : 'group-body'}>
                {group.items.map(item => (
                  <article
                    key={item.id}
                    ref={el => {
                      if (el) itemRefs.current[item.id] = el;
                    }}
                    className={expandedItem[item.id] ? 'faq-item active' : 'faq-item'}
                    style={highlightedItemId === item.id ? {
                      border: '1px solid rgba(124,111,247,0.28)',
                      boxShadow: '0 0 0 1px rgba(124,111,247,0.08), 0 16px 28px rgba(0,0,0,0.18)',
                      background: 'rgba(124,111,247,0.06)',
                    } : undefined}
                  >
                    <button 
                      className="faq-question" 
                      onClick={() => setExpandedItem(prev => ({ ...prev, [item.id]: !prev[item.id] }))}
                    >
                      <span>{item.q}</span>
                      <span>▼</span>
                    </button>
                    <div className={expandedItem[item.id] ? 'faq-answer open' : 'faq-answer'}>
                      <p>{item.a}</p>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          ))}
      </div>

      <div className="faq-footer-card">
        <div>
          <h3>Didn't find your answer?</h3>
          <p>If the FAQ doesn't cover it yet, ask Yaksha-mini. We'll help you with the right internship guidance or route your question to the community.</p>
        </div>
        <a href="/yaksha">Ask Yaksha-mini →</a>
      </div>
    </div>
  );
}

export default FaqPage;
