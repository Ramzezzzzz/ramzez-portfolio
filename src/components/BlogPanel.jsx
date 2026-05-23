import { useState, useEffect, useRef } from 'react';

export default function BlogPanel() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [vkReady, setVkReady] = useState(false);
  const [tgReady, setTgReady] = useState(false);
  const containerRef = useRef(null);

  // Загружаем скрипты VK и Telegram один раз
  useEffect(() => {
    let vkLoaded = false, tgLoaded = false;
    if (!document.querySelector('script[src*="vk.com/js/api/openapi.js"]')) {
      const vkScript = document.createElement('script');
      vkScript.src = 'https://vk.com/js/api/openapi.js?173';
      vkScript.async = true;
      vkScript.onload = () => {
        vkLoaded = true;
        if (window.VK) setVkReady(true);
      };
      document.body.appendChild(vkScript);
    } else if (window.VK) setVkReady(true);

    if (!document.querySelector('script[src*="telegram.org/js/telegram-widget.js"]')) {
      const tgScript = document.createElement('script');
      tgScript.src = 'https://telegram.org/js/telegram-widget.js?22';
      tgScript.async = true;
      tgScript.onload = () => { tgLoaded = true; setTgReady(true); };
      document.body.appendChild(tgScript);
    } else setTgReady(true);
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

  // Инициализируем VK виджеты после того, как посты отрендерились и VK API готов
useEffect(() => {
  if (!vkReady || loading || posts.length === 0) return;
  const timer = setTimeout(() => {
// Этот код должен быть внутри вашего useEffect
        if (window.VK && window.VK.Widgets) {
          document.querySelectorAll('.vk-widget-container').forEach(container => {
            const ownerId = container.getAttribute('data-owner-id');
            const postId = container.getAttribute('data-post-id');
            if (ownerId && postId && !container.innerHTML.trim()) {
              window.VK.Widgets.Post(container, ownerId, postId, '');
            }
          });
        }
  }, 300);
  return () => clearTimeout(timer);
}, [vkReady, loading, posts]);

  // Инициализация Telegram виджетов (если нужно)
  useEffect(() => {
    if (!tgReady || loading || posts.length === 0) return;
    // Telegram виджеты инициализируются автоматически при наличии .telegram-widget
    // Если нужна принудительная, можно вызвать window.TelegramWidget?.reinit()
    if (window.TelegramWidget && typeof window.TelegramWidget.reinit === 'function') {
      window.TelegramWidget.reinit();
    }
  }, [tgReady, loading, posts]);

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
    switch (source) {
      case 'vk':
        return (
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M15.07 19.49c-.82 0-1.66-.22-2.38-.64-.87-.5-1.62-1.22-2.27-2.05-.32-.41-.71-.9-1.13-1.44a148 148 0 0 1-2.4-3.45l.2.23c.88.98 1.99 2.1 3.04 3.03.44.4.9.76 1.36 1.07.24.16.48.3.71.43-.33.04-.66.06-1 .06-2.24 0-4.38-.9-6-2.5-.67-.66-1.24-1.4-1.7-2.2-.7-1.24-1.06-2.6-1.06-4 0-2.62 1.28-5.1 3.46-6.65 1.3-.93 2.86-1.45 4.44-1.45 1.8 0 3.54.6 4.94 1.7 1.38 1.09 2.24 2.65 2.4 4.36.02.2.03.4.03.6 0 2.13-.86 4.13-2.4 5.6-.74.7-1.6 1.23-2.54 1.56a7.7 7.7 0 0 1-2.2.32c-.32 0-.63-.02-.94-.06.22.14.43.3.63.46.7.57 1.34 1.28 1.86 2.06.65.97 1.05 2.02 1.17 3.1.04.39.06.79.06 1.18 0 .17-.02.34-.05.5-.44-.06-.87-.18-1.28-.37z"/>
          </svg>
        );
      case 'coub':
        return (
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2V7zm0 8h2v2h-2v-2z"/>
          </svg>
        );
      case 'telegram':
        return (
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15h-2v-6h2v6zm0-8h-2V7h2v2zm8 8h-2v-2h2v2zm0-4h-2v-6h2v6z"/>
          </svg>
        );
      default:
        return <span className="text-xs">📄</span>;
    }
  };

  return (
    <div className="blog-panel" ref={containerRef}>
      <h2 className="text-3xl font-bold mb-6 text-center text-white tracking-tight">
        Блог / Новости
      </h2>
      <div className="flex flex-col items-center gap-6">
        <div
          className="w-full max-w-[960px] p-5 rounded-2xl transition-all duration-300"
          style={{
            background: 'rgba(20, 20, 30, 0.6)',
            backdropFilter: 'blur(8px)',
            border: '2px solid rgba(255, 80, 120, 0.6)',
            boxShadow: '0 0 15px rgba(255, 80, 120, 0.2), inset 0 0 10px rgba(255, 80, 120, 0.05)',
          }}
        >
          <div className="space-y-6">
            {posts.map((post) => (
              <div key={post.id} className="border-b border-red-500/20 last:border-0 pb-4 last:pb-0">
                <div className="flex items-center gap-2 mb-2">
                  {getSourceIcon(post.source)}
                  <h3 className="text-lg font-semibold text-white">{post.title}</h3>
                  <span className="text-gray-400 text-xs ml-auto">{post.formatted_date}</span>
                </div>
                {/* Встраиваем виджет (безопасно, т.к. мы контролируем содержимое БД) */}
                <div className="mt-2" dangerouslySetInnerHTML={{ __html: post.embed_code }} />
                {post.link && post.link !== '#' && (
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
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}