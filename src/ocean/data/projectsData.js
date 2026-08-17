// Real projects, matching the resume/portfolio exactly — each island on the
// route corresponds to one actual shipped project, not a placeholder label.
export const PROJECT_ISLANDS = [
  {
    title: 'AgentFlow Studio',
    subtitle: 'Autonomous AI Agent System',
    tech: 'LangGraph · FastAPI · E2B · Next.js',
    link: 'https://github.com/Gowthamch6s/AgentFlow-Studio',
    linkLabel: 'View on GitHub',
    accent: 0x6366f1,
  },
  {
    title: 'AI Career Copilot',
    subtitle: 'Agentic RAG System',
    tech: 'LangGraph · FAISS · Groq · React',
    link: 'https://gowtham00007-ai-career-coach.hf.space',
    linkLabel: 'Live Demo',
    accent: 0x0ea5e9,
  },
  {
    title: 'Visual Defect Inspection',
    subtitle: 'AI/ML Manufacturing QC',
    tech: 'TensorFlow · Keras · TFLite',
    link: 'https://github.com/Gowthamch6s/ai-ml-inspection-system',
    linkLabel: 'View on GitHub',
    accent: 0xf97316,
  },
  {
    title: 'Doc Validation Assistant',
    subtitle: 'Offline LLM Summarizer',
    tech: 'LangChain · Llama 3 · Ollama',
    link: 'https://github.com/Gowthamch6s/ai-assistant',
    linkLabel: 'View on GitHub',
    accent: 0x7c3aed,
  },
  {
    title: 'Offline Doc Q&A',
    subtitle: 'GPU-Free Retrieval',
    tech: 'Python · PyMuPDF · NLP',
    link: 'https://github.com/Gowthamch6s/offline-document-assistant',
    linkLabel: 'View on GitHub',
    accent: 0x10b981,
  },
];

// Treasure markers — off the main labeled route, must be actively explored
// to find. This is the "play the game to reach my resume" mechanic.
export const TREASURES = [
  {
    id: 'resume',
    title: 'Resume Found!',
    detail: 'The full PDF — every project, every number.',
    action: 'download',
    href: '/resume.pdf',
    actionLabel: 'Download Resume ↓',
    icon: '📄',
  },
  {
    id: 'github',
    title: 'GitHub Found!',
    detail: 'Every repo above (and more) lives here.',
    action: 'link',
    href: 'https://github.com/Gowthamch6s',
    actionLabel: 'Open GitHub ↗',
    icon: '🐙',
  },
];
