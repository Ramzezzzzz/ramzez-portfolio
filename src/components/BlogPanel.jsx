import { useState, useEffect } from 'react';

export default function BlogPanel() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hoveredId, setHoveredId] = useState(null);

  useEffect(() => {
    fetch('/api/blog_posts.php')
      .then(res => res.json())
      .then(data => {
        setPosts(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
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
    return <div className="text-red-400 text-center p-4">Ошибка загрузки: {error}</div>;
  }

  const getSourceIcon = (source) => {
    // можно вернуть иконку VK, Coub, Telegram или просто кастомную
    if (source === 'vk') {
      return (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M15.07 19.49c-.82 0-1.66-.22-2.38-.64-.87-.5-1.62-1.22-2.27-2.05-.32-.41-.71-.9-1.13-1.44a148 148 0 0 1-2.4-3.45l.2.23c.88.98 1.99 2.1 3.04 3.03.44.4.9.76 1.36 1.07.24.16.48.3.71.43-.33.04-.66.06-1 .06-2.24 0-4.38-.9-6-2.5-.67-.66-1.24-1.4-1.7-2.2-.7-1.24-1.06-2.6-1.06-4 0-2.62 1.28-5.1 3.46-6.65 1.3-.93 2.86-1.45 4.44-1.45 1.8 0 3.54.6 4.94 1.7 1.38 1.09 2.24 2.65 2.4 4.36.02.2.03.4.03.6 0 2.13-.86 4.13-2.4 5.6-.74.7-1.6 1.23-2.54 1.56a7.7 7.7 0 0 1-2.2.32c-.32 0-.63-.02-.94-.06.22.14.43.3.63.46.7.57 1.34 1.28 1.86 2.06.65.97 1.05 2.02 1.17 3.1.04.39.06.79.06 1.18 0 .17-.02.34-.05.5-.44-.06-.87-.18-1.28-.37z"/>
        </svg>
      );
    }
    // дефолтная иконка
    return <span className="text-xs">📄</span>;
  };

  return (
    <div className="blog-panel">
      <h2 className="text-3xl font-bold mb-6 text-center text-white tracking-tight">
        Блог / Новости
      </h2>
      <div className="flex flex-col items-center gap-6">
        {posts.map((post) => (
          <div
            key={post.id}
            className="w-full max-w-[960px] p-5 rounded-2xl transition-all duration-300 cursor-pointer"
            onMouseEnter={() => setHoveredId(post.id)}
            onMouseLeave={() => setHoveredId(null)}
            style={{
              background: 'rgba(20, 20, 30, 0.6)',
              backdropFilter: 'blur(8px)',
              border: '2px solid rgba(255, 80, 120, 0.6)',
              boxShadow: hoveredId === post.id
                ? '0 0 25px rgba(255, 80, 120, 0.6), inset 0 0 15px rgba(255, 80, 120, 0.2)'
                : '0 0 15px rgba(255, 80, 120, 0.2), inset 0 0 10px rgba(255, 80, 120, 0.05)',
              transform: hoveredId === post.id ? 'scale(1.01)' : 'scale(1)',
            }}
          >
            <div className="flex items-center gap-2 mb-2">
              {getSourceIcon(post.source)}
              <h3 className="text-lg font-semibold text-white">{post.title}</h3>
              <span className="text-gray-400 text-xs ml-auto">{post.date}</span>
            </div>

            {post.image && (
              <div className="mb-3 rounded-lg overflow-hidden bg-black/30">
                <img src={post.image} alt={post.title} className="w-full h-auto object-cover" />
              </div>
            )}
            {post.video && (
              <div className="mb-3">
                <a href={post.video} target="_blank" rel="noopener noreferrer" className="text-red-400 text-sm">
                  📹 Смотреть видео
                </a>
              </div>
            )}

            <p className="text-gray-300 text-sm mb-3">{post.text}</p>

            <div className="text-right mt-2">
              <a
                href={post.link}
                target="_blank"
                rel="noopener noreferrer"
                className="text-red-400 hover:text-red-300 text-sm inline-flex items-center gap-1"
              >
                Открыть оригинал →
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}