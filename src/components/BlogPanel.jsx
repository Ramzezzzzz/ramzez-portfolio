import { useState, useEffect } from 'react';

export default function BlogPanel() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hoveredId, setHoveredId] = useState(null);

  useEffect(() => {
    fetch('/api/blog_posts.php')
      .then(res => {
        if (!res.ok) throw new Error('Network response was not ok');
        return res.json();
      })
      .then(data => {
        setPosts(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Ошибка загрузки постов:', err);
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-12 h-12 border-4 border-red-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return <div className="text-red-400 text-center">Ошибка загрузки: {error}</div>;
  }

  return (
    <div className="blog-panel">
      <h2 className="text-3xl font-bold mb-6 text-center text-white tracking-tight">
        Блог / Новости
      </h2>
      <div className="flex flex-col items-center gap-6">
        {posts.map((post) => (
          <div
            key={post.id}
            className="post-card p-5 rounded-2xl transition-all duration-300 cursor-pointer"
            onMouseEnter={() => setHoveredId(post.id)}
            onMouseLeave={() => setHoveredId(null)}
            style={{
              background: 'rgba(20, 20, 30, 0.6)',
              backdropFilter: 'blur(8px)',
              border: '2px solid rgba(255, 80, 120, 0.6)',
              boxShadow: hoveredId === post.id
                ? '0 0 25px rgba(255, 80, 120, 0.6), inset 0 0 15px rgba(255, 80, 120, 0.2)'
                : '0 0 15px rgba(255, 80, 120, 0.2), inset 0 0 10px rgba(255, 80, 120, 0.05)',
              transform: hoveredId === post.id ? 'scale(1.02)' : 'scale(1)',
              minHeight: 'auto',
              width: '100%',
              maxWidth: '960px',
            }}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-red-400 text-sm font-semibold uppercase tracking-wide">
                {post.source}
              </span>
              <span className="text-gray-400 text-xs">{post.date}</span>
            </div>
            {post.image && (
              <div className="mb-3 rounded-lg overflow-hidden bg-black/30">
                <img src={post.image} alt={post.title} className="w-full h-auto object-cover" />
              </div>
            )}
            <h3 className="text-xl font-semibold text-white mb-2">{post.title}</h3>
            <p className="text-gray-300 text-sm mb-3">{post.text}</p>
            <div className="flex justify-between items-center mt-3">
              <a
                href={post.link}
                target="_blank"
                rel="noopener noreferrer"
                className="text-red-400 hover:text-red-300 transition text-sm"
              >
                Читать оригинал →
              </a>
              <button
                onClick={() => alert('Комментарии скоро появятся!')}
                className="text-xs px-3 py-1 rounded-full bg-red-500/20 text-red-300 border border-red-500/30 hover:bg-red-500/30 transition"
              >
                💬 Комментировать
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}