import { useState } from 'react';
import { NavLink } from 'react-router-dom';

const stats = [
  { label: 'Fully Online', value: '100%', icon: '☄' },
  { label: '2 Months', value: '60 Days', icon: '⏳' },
  { label: 'IIT Ropar Mentorship', value: 'Lab Guided', icon: '✦' },
  { label: 'Free Program', value: 'No Fee', icon: '∞' },
];

const journey = [
  {
    name: 'Bronze',
    title: 'Onboarding + Training',
    requirement: 'Complete the initial setup and coursework phase.',
    reward: 'Build momentum, earn access, and get ready for projects.',
    accent: 'bronze',
  },
  {
    name: 'Silver',
    title: 'Core Contribution',
    requirement: 'Ship meaningful work with mentor support.',
    reward: 'Gain project credibility and progress toward completion.',
    accent: 'silver',
  },
  {
    name: 'Gold',
    title: 'Recognition',
    requirement: 'Deliver consistent, high-quality contributions.',
    reward: 'Stand out with stronger recognition and visibility.',
    accent: 'gold',
  },
  {
    name: 'Platinum',
    title: 'Return Invitation',
    requirement: 'Demonstrate exceptional impact and reliability.',
    reward: 'Receive a lab revisit invitation with travel support.',
    accent: 'platinum',
  },
];

const buildCards = [
  { icon: '🤖', title: 'AI / ML', desc: 'Practical models, pipelines, and experimentation.' },
  { icon: '🧠', title: 'LLM Applications', desc: 'Prompt workflows, tooling, and AI product features.' },
  { icon: '🌐', title: 'Web Development', desc: 'Modern interfaces and full-stack implementation.' },
  { icon: '📚', title: 'Education Technology', desc: 'Learning-first systems and student tools.' },
  { icon: '🌾', title: 'Agriculture Technology', desc: 'Solutions that support applied research and impact.' },
  { icon: '⚡', title: 'Open Source Engineering', desc: 'Contribution, review, and collaboration at scale.' },
];

const lifeSteps = [
  { label: 'Morning', icon: '☀', detail: 'Start with a focused learning session.' },
  { label: 'Mentor Interaction', icon: '✦', detail: 'Clarify goals and unblock your work.' },
  { label: 'Project Work', icon: '⌁', detail: 'Build, iterate, and ship with intent.' },
  { label: 'Code Reviews', icon: '✓', detail: 'Refine quality and improve the implementation.' },
  { label: 'Community Discussions', icon: '◌', detail: 'Learn from peers and share insights.' },
];

const processSteps = [
  { title: 'Interview', desc: 'Selection conversation and screening.' },
  { title: 'Result', desc: 'View your internship status.' },
  { title: 'Opt-In', desc: 'Confirm participation in the programme.' },
  { title: 'NOC Upload', desc: 'Submit your signed college NOC.' },
  { title: 'Offer Letter', desc: 'Receive onboarding confirmation.' },
  { title: 'Internship Begins', desc: 'Start the journey and begin work.' },
];

const faqItems = [
  {
    q: 'Who can apply for the internship?',
    a: 'Currently enrolled UG, PG, and PhD students are eligible.',
  },
  {
    q: 'Do I need an NOC before starting?',
    a: 'Yes. The NOC should be submitted before the internship begins.',
  },
  {
    q: 'Is there any stipend?',
    a: 'There is no guaranteed stipend for the programme.',
  },
  {
    q: 'How long does the internship run?',
    a: 'The internship runs for two months from your chosen start date.',
  },
  {
    q: 'Will I get a certificate?',
    a: 'Yes, on successful completion of the required stages.',
  },
];

const faqSnippets = faqItems.slice(0, 5);

function OverviewPage() {
  const [activeMilestone, setActiveMilestone] = useState('Bronze');
  const [activeProcess, setActiveProcess] = useState(0);
  const [activeLife, setActiveLife] = useState('Morning');
  const [openFaq, setOpenFaq] = useState(0);

  const currentMilestone = journey.find(item => item.name === activeMilestone) || journey[0];
  const currentProcess = processSteps[activeProcess];

  return (
    <div className="overview-page journey-overview">
      <section className="overview-hero leaderboard-surface">
        <div className="overview-hero-orb overview-hero-orb-one" />
        <div className="overview-hero-orb overview-hero-orb-two" />
        <div className="overview-hero-copy reveal-block">
          <p className="hero-pill"><span className="pdot"></span> Programme Journey</p>
          <h1>Vicharanashala Internship</h1>
          <p className="overview-subtitle">Applied AI • Open Source • IIT Ropar</p>
          <p className="overview-description">
            A premium internship path that blends mentorship, project work, and recognition into a clear progression
            from first steps to meaningful contribution.
          </p>
          <div className="overview-hero-actions">
            <NavLink to="/login" className="cta-button overview-cta-button">
              Explore Portal →
            </NavLink>
          </div>
        </div>

        <div className="overview-stats">
          {stats.map((stat, index) => (
            <article key={stat.label} className="floating-stat reveal-card" style={{ '--delay': `${index * 80}ms` }}>
              <span className="floating-stat-icon">{stat.icon}</span>
              <strong>{stat.value}</strong>
              <p>{stat.label}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="overview-section">
        <div className="section-heading compact">
          <h2 className="section-title">Journey Map</h2>
          <p className="section-subtitle">A progression path that feels like a game, not a document.</p>
        </div>

        <div className="journey-roadmap leaderboard-surface">
          <svg className="journey-path" viewBox="0 0 1200 260" aria-hidden="true">
            <path d="M 90 165 C 230 70, 330 70, 470 165 S 710 260, 840 155 S 1040 70, 1110 155" />
          </svg>

          <div className="journey-grid">
            {journey.map((item, index) => (
              <button
                key={item.name}
                type="button"
                className={`milestone-card ${item.name === activeMilestone ? 'active' : ''} ${item.accent}`}
                onMouseEnter={() => setActiveMilestone(item.name)}
                onFocus={() => setActiveMilestone(item.name)}
                onClick={() => setActiveMilestone(item.name)}
                style={{ '--delay': `${index * 90}ms` }}
              >
                <span className="milestone-label">{item.name}</span>
                <span className="milestone-title">{item.title}</span>
                <div className="milestone-glow" aria-hidden="true" />
                <div className="milestone-tooltip">
                  <div>
                    <strong>Requirements</strong>
                    <p>{item.requirement}</p>
                  </div>
                  <div>
                    <strong>Rewards</strong>
                    <p>{item.reward}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>

          <div className="journey-current">
            <span className="journey-current-kicker">Selected Milestone</span>
            <h3>{currentMilestone.name}</h3>
            <p>{currentMilestone.title}</p>
          </div>
        </div>
      </section>

      <section className="overview-section">
        <div className="section-heading compact">
          <h2 className="section-title">What You&apos;ll Build</h2>
        </div>
        <div className="overview-grid work-grid journey-work-grid">
          {buildCards.map((item, index) => (
            <article key={item.title} className="work-card build-card reveal-card" style={{ '--delay': `${index * 70}ms` }}>
              <span className="work-dot" />
              <span className="build-icon">{item.icon}</span>
              <h3>{item.title}</h3>
              <p>{item.desc}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="overview-section">
        <div className="section-heading compact">
          <h2 className="section-title">Life as an Intern</h2>
        </div>
        <div className="intern-life-timeline leaderboard-surface">
          {lifeSteps.map((step, index) => (
            <button
              key={step.label}
              type="button"
              className={`life-step reveal-card ${activeLife === step.label ? 'active' : ''}`}
              style={{ '--delay': `${index * 90}ms` }}
              onMouseEnter={() => setActiveLife(step.label)}
              onFocus={() => setActiveLife(step.label)}
              onClick={() => setActiveLife(step.label)}
            >
              <div className="life-step-top">
                <span className="life-icon">{step.icon}</span>
                <span className="life-label">{step.label}</span>
              </div>
              <div className="life-detail">
                <span className="life-mini-bar" />
                <p>{step.detail}</p>
              </div>
            </button>
          ))}
        </div>
      </section>

      <section className="overview-section">
        <div className="section-heading compact">
          <h2 className="section-title">Internship Process</h2>
          <p className="section-subtitle">Click a step to preview the next milestone.</p>
        </div>

        <div className="process-tracker leaderboard-surface">
          <div className="process-track">
            {processSteps.map((step, index) => (
              <button
                key={step.title}
                type="button"
                className={`process-step ${index === activeProcess ? 'active' : ''}`}
                onClick={() => setActiveProcess(index)}
              >
                <span className="process-index">{index + 1}</span>
                <span className="process-title">{step.title}</span>
              </button>
            ))}
          </div>

          <div className="process-progress">
            <div className="process-progress-bar">
              <span style={{ width: `${(activeProcess / (processSteps.length - 1)) * 100}%` }} />
            </div>
            <div className="process-detail">
              <strong>{currentProcess.title}</strong>
              <p>{currentProcess.desc}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="overview-section">
        <div className="section-heading compact">
          <h2 className="section-title">Certificate & Growth</h2>
          <p className="section-subtitle">A compact overview of completion and future paths.</p>
        </div>
        <div className="overview-stack growth-grid">
          <article className="overview-compact-card leaderboard-surface growth-card">
            <div className="compact-copy">
              <p className="growth-kicker">Certificate Track</p>
              <div className="growth-header">
                <span className="growth-icon">✓</span>
                <h2>Bronze + Silver completed</h2>
              </div>
              <ul className="growth-list">
                <li>Bronze completed</li>
                <li>Silver completed</li>
                <li>Internship certificate awarded</li>
              </ul>
            </div>
          </article>

          <article className="overview-compact-card leaderboard-surface growth-card">
            <div className="compact-copy">
              <p className="growth-kicker">Future Opportunities</p>
              <div className="growth-header">
                <span className="growth-icon">✦</span>
                <h2>Continue your growth</h2>
              </div>
              <ul className="growth-list">
                <li>Gold Badge</li>
                <li>Platinum Badge</li>
                <li>Return to Lab</li>
                <li>Future collaboration opportunities</li>
              </ul>
            </div>
          </article>
        </div>
      </section>

      <section className="overview-section">
        <div className="section-heading compact">
          <h2 className="section-title">FAQ Preview</h2>
          <p className="section-subtitle">Quick answers to the questions most applicants ask first.</p>
        </div>

        <div className="faq-accordion-list">
          {faqSnippets.map((item, index) => {
            const open = openFaq === index;
            return (
              <article key={item.q} className={`faq-accordion-card ${open ? 'open' : ''}`}>
                <button
                  type="button"
                  className="faq-accordion-trigger"
                  onClick={() => setOpenFaq(open ? -1 : index)}
                >
                  <span>{item.q}</span>
                  <span className="faq-accordion-icon">{open ? '−' : '+'}</span>
                </button>
                <div className={`faq-accordion-panel ${open ? 'open' : ''}`}>
                  <p>{item.a}</p>
                </div>
              </article>
            );
          })}
        </div>

        <div className="faq-preview-action">
          <NavLink to="/faq" className="secondary-btn">
            View All FAQs →
          </NavLink>
        </div>
      </section>

      <section className="overview-cta overview-cta-full leaderboard-surface">
        <div className="overview-cta-copy">
          <p className="cta-kicker">Ready to Begin Your Journey?</p>
          <h2>Ready to Begin Your Journey?</h2>
          <p>Check your result, complete the next steps, and start building real-world projects.</p>
        </div>
        <NavLink to="/login" className="cta-button overview-cta-button">
          Explore Portal →
        </NavLink>
      </section>
    </div>
  );
}

export default OverviewPage;
