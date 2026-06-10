import { useNavigate } from 'react-router-dom';
import FluidFlowBackground from '../components/FluidFlowBackground';

const cards = [
  { title: 'Smart FAQ', emoji: '📚', description: 'AI-powered knowledge hub with semantic search. Get instant answers to program questions without the login hassle.', link: '/faq', theme: 'faq', meta: '50+ FAQs · No login needed' },
  { title: 'Leaderboard', emoji: '🏆', description: 'See where you rank. Track top contributors, celebrate peer achievements, and compete for recognition across the Samagama community.', link: '/leaderboard', theme: 'leaderboard', meta: '340+ contributors' },
  { title: 'Zoro', emoji: '✨', description: 'Your AI companion for SP points, NOC deadlines, FAQs, navigation help—and anything else you need. Available without signing in.', link: '/yaksha', theme: 'zoro', meta: 'Platform assistant · No sign-in needed' }
];

const trending = [
  { text: 'NOC mandatory?', link: '/faq?cat=noc&question=Is%20NOC%20mandatory%20for%20internship%20participation%3F&label=NOC%20Mandatory' },
  { text: 'Stipend details', link: '/faq?cat=stipend&question=How%20much%20stipend%20is%20offered%3F&label=Stipend%20Details' },
  { text: 'Final year eligible?', link: '/faq?cat=eligibility&question=Are%20final%20year%20students%20eligible%3F&label=Final%20Year%20Eligible' },
  { text: 'Remote available?', link: '/faq?cat=mode&question=Is%20remote%20internship%20available%3F&label=Remote%20Available' },
  { text: 'Application docs', link: '/faq?cat=documents&question=Which%20documents%20are%20required%3F&label=Application%20Docs' },
  { text: 'Best DSA resources', link: '/faq?search=DSA%20resources' },
  { text: 'SOP writing tips', link: '/faq?search=SOP' },
  { text: 'IIT Ropar interview prep', link: '/faq?search=Interview' }
];

function HomePage() {
  const navigate = useNavigate();

  return (
    <div className="home-page">
      <FluidFlowBackground
        className="home-fluid-background"
        colors={['#5227FF', '#FF9FFC', '#B19EEF', '#38BDF8']}
        mouseForce={24}
        cursorSize={130}
        resolution={0.28}
        autoDemo
        autoSpeed={0.55}
        autoIntensity={2.2}
      />
      <section className="hero-wrap">
        <div className="hero-content">
          <p className="hero-pill"><span className="pdot"></span> Vicharanashala · IIT Ropar Internship Portal</p>
          <h1 className="hero-title">Don't sign in yet.<br /><span className="grad-text">Read first.</span></h1>
          <p className="hero-sub">Almost every question has been asked before — usually by someone else, fifteen minutes earlier. Meet <em>Yaksha</em>. It's been waiting.</p>
          <div className="hero-actions">
            <button className="btn-primary" onClick={() => navigate('/overview')}>Overview →</button>
          </div>
          <div className="stats-bar">
            <div className="stat">
              <span className="stat-num">2,840+</span>
              <span className="stat-label">students helped</span>
            </div>
            <div className="stat">
              <span className="stat-num">9,400+</span>
              <span className="stat-label">doubts solved</span>
            </div>
            <div className="stat">
              <span className="stat-num">340+</span>
              <span className="stat-label">contributors</span>
            </div>
            <div className="stat">
              <span className="stat-num">97%</span>
              <span className="stat-label">AI accuracy</span>
            </div>
          </div>
        </div>
      </section>

      <section className="feature-grid">
        {cards.map(card => (
          <article key={card.title} className={`feature-card theme-${card.theme}`} onClick={() => navigate(card.link)}>
            <div className="card-icon">{card.emoji}</div>
            <h2>{card.title}</h2>
            <p>{card.description}</p>
            <div className="card-footer">
              <small>{card.meta}</small>
              <span className="card-arr">→</span>
            </div>
          </article>
        ))}
      </section>

      <div className="trending-section">
        <p className="trending-label">🔥 Trending today</p>
        <div className="trend-pills">
          {trending.map(item => (
            <button key={item.text} className="trend-pill" onClick={() => navigate(item.link)}>
              {item.text}
            </button>
          ))}
        </div>
      </div>

      <div className="footer-section">
        <p>Already applied? <button className="link-btn" onClick={() => navigate('/login')}>Sign in here →</button></p>
        <p className="footer-meta">samagama.in · Vicharanashala · IIT Ropar · v3.2</p>
      </div>
    </div>
  );
}

export default HomePage;
