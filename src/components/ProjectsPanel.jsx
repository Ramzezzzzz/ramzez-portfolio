import { useState } from 'react';

// Данные проектов – замените на свои, проверьте, что файл в UTF-8
const projectsData = [
  {
    id: 1,
    title: '3D Портфолио Ramzez',
    description: 'Интерактивный сайт с 3D персонажем и карточками. Полный контроль над анимацией и параллаксом.',
    tech: ['React', 'Three.js', 'Framer Motion'],
    link: 'https://github.com/Ramzezzzzz/ramzez-portfolio',
  },
  {
    id: 2,
    title: 'Нейросеть для генерации арта',
    description: 'Генерация изображений на основе текстового описания с использованием Stable Diffusion.',
    tech: ['Python', 'PyTorch', 'Hugging Face'],
    link: '#',
  },
  {
    id: 3,
    title: 'Мобильное приложение "Заметки"',
    description: 'Кроссплатформенное приложение с синхронизацией и офлайн-режимом.',
    tech: ['React Native', 'Firebase', 'Redux'],
    link: '#',
  },
  {
    id: 4,
    title: 'Блог на гравитации',
    description: 'Тёмный блог с параллакс-эффектами и поддержкой MDX.',
    tech: ['Next.js', 'Tailwind CSS', 'MDX'],
    link: '#',
  },
];

export default function ProjectsPanel() {
  const [hoveredId, setHoveredId] = useState(null);

  return (
    <div className="projects-panel">
      <h2 className="text-3xl font-bold mb-6 text-center text-white tracking-tight">
        Мои проекты
      </h2>
      <div className="grid grid-cols-1 gap-6 auto-rows-fr">
        {projectsData.map((project) => (
          <div
            key={project.id}
            className="project-card p-5 rounded-2xl transition-all duration-300 cursor-pointer"
            onMouseEnter={() => setHoveredId(project.id)}
            onMouseLeave={() => setHoveredId(null)}
            onClick={() => window.open(project.link, '_blank')}
            style={{
              background: 'rgba(20, 20, 30, 0.6)',
              backdropFilter: 'blur(8px)',
              border: '2px solid rgba(255, 80, 120, 0.6)',
              boxShadow: hoveredId === project.id
                ? '0 0 25px rgba(255, 80, 120, 0.6), inset 0 0 15px rgba(255, 80, 120, 0.2)'
                : '0 0 15px rgba(255, 80, 120, 0.2), inset 0 0 10px rgba(255, 80, 120, 0.05)',
              transform: hoveredId === project.id ? 'scale(1.02)' : 'scale(1)',
              minHeight: '200px', // на десктопе больше высота
            }}
          >
            <h3 className="text-xl font-semibold text-white mb-2">{project.title}</h3>
            <p className="text-gray-300 text-sm mb-3">{project.description}</p>
            <div className="flex flex-wrap gap-2 mt-2">
              {project.tech.map((tech) => (
                <span
                  key={tech}
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