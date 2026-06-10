import { useEffect, useState } from 'react';
import { approveDoubt, answerDoubt, fetchDoubts, rejectDoubt, submitDoubt } from '../api';

function DoubtPage({ role, user }) {
  const [posts, setPosts] = useState([]);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [tags, setTags] = useState([]);
  const [message, setMessage] = useState('');

  const tagOptions = ['DSA', 'Web Dev', 'AI/ML', 'Resume', 'Internship', 'Other'];

  useEffect(() => {
    refresh();
  }, [role]);

  async function refresh() {
    try {
      const data = await fetchDoubts(role);
      setPosts(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setPosts([]);
    }
  }

  function toggleTag(tag) {
    setTags(prev => prev.includes(tag) ? prev.filter(item => item !== tag) : [...prev, tag]);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!title.trim()) return;
    await submitDoubt({ title, body, tags, user });
    setTitle('');
    setBody('');
    setTags([]);
    setMessage('Your doubt is submitted for admin approval. It will appear after review.');
    refresh();
  }

  async function handleApprove(id) {
    await approveDoubt(id);
    refresh();
  }

  async function handleReject(id) {
    await rejectDoubt(id);
    refresh();
  }

  async function handleAnswer(id, answerText, reset) {
    if (!answerText.trim()) return;
    await answerDoubt(id, { text: answerText });
    reset();
    refresh();
  }

  return (
    <div className="doubt-page">
      <section className="doubt-hero">
        <div>
          <p className="page-label">Community Doubts</p>
          <h1>Ask, answer, and grow together.</h1>
          <p>Post a doubt for review, collaborate with peers, and get admin approval before it goes live.</p>
        </div>
      </section>

      <div className="doubt-grid">
        <div className="doubt-form-panel">
          <div className="form-card">
            <h2>Post a doubt</h2>
            <p>New doubts are held in pending status until an admin approves them.</p>
            <form onSubmit={handleSubmit}>
              <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Doubt title" />
              <textarea value={body} onChange={e => setBody(e.target.value)} placeholder="Describe your doubt" rows="5" />
              <div className="tag-row">
                {tagOptions.map(tag => (
                  <button
                    type="button"
                    key={tag}
                    className={tags.includes(tag) ? 'tag-btn selected' : 'tag-btn'}
                    onClick={() => toggleTag(tag)}
                  >
                    {tag}
                  </button>
                ))}
              </div>
              <button className="primary-btn" type="submit">Submit for review</button>
            </form>
            {message && <div className="alert-message">{message}</div>}
          </div>
        </div>

        <div className="doubt-feed">
          {Array.isArray(posts) && posts.map(post => (
            <DoubtCard
              key={post._id || post.id}
              post={post}
              role={role}
              onApprove={() => handleApprove(post._id || post.id)}
              onReject={() => handleReject(post._id || post.id)}
              onAnswer={handleAnswer}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function DoubtCard({ post, role, onApprove, onReject, onAnswer }) {
  const [showAnswers, setShowAnswers] = useState(false);
  const [answerText, setAnswerText] = useState('');

  return (
    <article className="doubt-card">
      <div className="doubt-card-header">
        <div>
          <strong>{post.title}</strong>
          <div className="meta-row">
            <span>{post.authorName || post.user}</span>
            <span>{post.createdAt ? new Date(post.createdAt).toLocaleString() : post.time}</span>
            <span className={post.status}>{post.status}</span>
          </div>
        </div>
        <span className="vote-pill">{post.votes} votes</span>
      </div>
      <p>{post.body}</p>
      <div className="tag-row">
        {post.tags.map(tag => <span key={tag} className="tag-pill">{tag}</span>)}
      </div>
      <div className="doubt-actions">
        <button onClick={() => setShowAnswers(prev => !prev)}>{showAnswers ? 'Hide' : 'Show'} answers</button>
        {role === 'admin' && post.status === 'pending' && (
          <div className="admin-actions">
            <button className="approve-btn" onClick={onApprove}>Approve</button>
            <button className="reject-btn" onClick={onReject}>Reject</button>
          </div>
        )}
      </div>
      {showAnswers && (
        <div className="answers-panel">
          {post.answers.length === 0 ? <p>No answers yet.</p> : post.answers.map(answer => (
            <div key={answer._id || answer.id} className="answer-item">
              <strong>{answer.userName || answer.user}</strong>
              <p>{answer.text}</p>
              <small>{answer.createdAt ? new Date(answer.createdAt).toLocaleString() : answer.time}</small>
            </div>
          ))}
          {post.status === 'approved' && (
            <div className="answer-form">
              <textarea value={answerText} onChange={e => setAnswerText(e.target.value)} placeholder="Write your answer" rows="3" />
              <button className="primary-btn" onClick={() => onAnswer(post._id || post.id, answerText, () => setAnswerText(''))}>Submit answer</button>
            </div>
          )}
        </div>
      )}
    </article>
  );
}

export default DoubtPage;
