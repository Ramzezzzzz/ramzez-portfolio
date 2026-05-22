import { useState, useEffect } from 'react';

export default function ProjectsPanel() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hoveredId, setHoveredId] = useState(null);

  useEffect(() => {
    fetch('/api/projects.php')
      .then(res => {
        if (!res.ok) throw new Error('Network response was not ok');
        return res.json();
      })
      .then(data => {
        setProjects(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Ошибка загрузки проектов:', err);
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
    <div className="projects-panel">
      <h2 className="text-3xl font-bold mb-6 text-center text-white tracking-tight">
        Мои проекты
      </h2>
      <div className="flex flex-col items-center gap-6">
        {projects.map((project) => (
          <div
            key={project.id}
            className="project-card p-5 rounded-2xl transition-all duration-300 cursor-pointer"
            onMouseEnter={() => setHoveredId(project.id)}
            onMouseLeave={() => setHoveredId(null)}
            onClick={() => window.open(project.link, '_blank')}
            style={{
              // ⬅️ Восстанавливаем стили из статической версии
              background: 'rgba(20, 20, 30, 0.6)',
              backdropFilter: 'blur(8px)',
              border: '2px solid rgba(255, 80, 120, 0.6)',
              boxShadow: hoveredId === project.id
                ? '0 0 25px rgba(255, 80, 120, 0.6), inset 0 0 15px rgba(255, 80, 120, 0.2)'
                : '0 0 15px rgba(255, 80, 120, 0.2), inset 0 0 10px rgba(255, 80, 120, 0.05)',
              transform: hoveredId === project.id ? 'scale(1.02)' : 'scale(1)',
              minHeight: '200px',
              width: '100%',
              maxWidth: '960px',   // ← контролируем ширину карточки
            }}
          >
            {/* Медиа-блок (опционально) */}
            {project.media_url && (
              <div className="mb-3 rounded-lg overflow-hidden bg-black/30">
                {project.media_type === 'image' && (
                  <img src={project.media_url} alt={project.title} className="w-full h-auto object-cover" />
                )}
                {project.media_type === 'video' && (
                  <video src={project.media_url} controls className="w-full" />
                )}
                {project.media_type === 'glb' && (
                  <div className="h-32 bg-gray-800 flex items-center justify-center text-xs text-gray-400">
                    3D модель (скоро)
                  </div>
                )}
              </div>
            )}
            <h3 className="text-xl font-semibold text-white mb-2">{project.title}</h3>
            <p className="text-gray-300 text-sm mb-3">{project.description}</p>
            <div className="flex flex-wrap gap-2 mt-2">
              {project.tech?.map((tech, idx) => (
                <span
                  key={idx}
                  className="text-xs px-2 py-1 rounded-full bg-red-500/20 text-red-300 border border-red-500/30"
                >
                  {tech}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}