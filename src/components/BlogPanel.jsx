import { useState, useEffect, useRef } from 'react';

export default function BlogPanel() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [vkReady, setVkReady] = useState(false);
  const [tgReady, setTgReady] = useState(false);
  const containerRef = useRef(null);
  const processedVkContainers = useRef(new Set()); // храним ID обработанных виджетов

  // Загружаем скрипты VK и Telegram
  useEffect(() => {
    if (!document.querySelector('script[src*="vk.com/js/api/openapi.js"]')) {
      const vkScript = document.createElement('script');
      vkScript.src = 'https://vk.com/js/api/openapi.js?173';
      vkScript.async = true;
      vkScript.onload = () => {
        if (window.VK) setVkReady(true);
      };
      document.body.appendChild(vkScript);
    } else if (window.VK) setVkReady(true);

    // Telegram можно пока полностью отключить, чтобы не мешал
    // if (!document.querySelector('script[src*="telegram.org/js/telegram-widget.js"]')) {
    //   const tgScript = document.createElement('script');
    //   tgScript.src = 'https://telegram.org/js/telegram-widget.js?22';
    //   tgScript.async = true;
    //   tgScript.onload = () => setTgReady(true);
    //   document.body.appendChild(tgScript);
    // } else setTgReady(true);
  }, []);

  // Загружаем посты из API
  useEffect(() => {
    fetch('/api/blog_posts.php')
      .then(res => {
        if (!res.ok) throw new Error('Network response not ok');
        return res.json();
      })
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

  // Инициализация VK виджетов (только один раз для каждого контейнера)
  useEffect(() => {
    if (!vkReady || loading || posts.length === 0) return;
    const timer = setTimeout(() => {
      if (window.VK && window.VK.Widgets) {
        const containers = document.querySelectorAll('.vk-widget-container');
        containers.forEach(container => {
          const id = container.id;
          if (!id) return;
          // Пропускаем, если уже обрабатывали этот контейнер
          if (processedVkContainers.current.has(id)) return;
          
          const ownerId = container.getAttribute('data-owner-id');
          const postId = container.getAttribute('data-post-id');
          const hash = container.getAttribute('data-hash') || '';
          if (ownerId && postId) {
            // Дополнительная проверка: если контейнер уже содержит что-то, не инициализируем
            if (container.innerHTML.trim() === '') {
              try {
                window.VK.Widgets.Post(id, ownerId, postId, hash);
                processedVkContainers.current.add(id);
              } catch (err) {
                console.warn('VK Widget error for', id, err);
              }
            } else {
              // Уже заполнен, просто добавляем в Set, чтобы не пытаться снова
              processedVkContainers.current.add(id);
            }
          }
        });
      }
    }, 800); // увеличенная задержка, чтобы React успел отрендерить
    return () => clearTimeout(timer);
  }, [vkReady, loading, posts]);

  // Telegram виджеты игнорируем

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-12 h-12 border-4 border-red-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return <div className="text-red-400 text-center p-4">Ошибка: {error}</div>;
  }

  const getSourceIcon = (source) => {
    // ... (ваш старый код)
    switch (source) {
      case 'vk':
        return ( <svg ...>...</svg> );
      case 'coub':
        return ( <svg ...>...</svg> );
      default: return <span className="text-xs">📄</span>;
    }
  };

  return (
    <div className="blog-panel" ref={containerRef}>
      <h2 className="text-3xl font-bold mb-6 text-center text-white tracking-tight">
        Блог / Новости
      </h2>
      <div className="flex flex-col items-center gap-6">
        <div className="w-full max-w-[960px] p-5 rounded-2xl" style={...}>
          <div className="space-y-6">
            {posts.map((post) => (
              <div key={post.id} className="border-b border-red-500/20 last:border-0 pb-4 last:pb-0">
                <div className="flex items-center gap-2 mb-2">
                  {getSourceIcon(post.source)}
                  <h3 className="text-lg font-semibold text-white">{post.title}</h3>
                  <span className="text-gray-400 text-xs ml-auto">{post.formatted_date}</span>
                </div>
                {/* Контейнер для виджета будет вставлен через dangerouslySetInnerHTML */}
                <div className="mt-2" dangerouslySetInnerHTML={{ __html: post.embed_code }} />
                {post.link && post.link !== '#' && (
                  <div className="text-right mt-2">
                    <a href={post.link} target="_blank" rel="noopener noreferrer" className="text-red-400 hover:text-red-300 text-sm">
                      Открыть оригинал →
                    </a>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}