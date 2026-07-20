// Real content from Gowtham Sai Chimmana's resume, organized into the three village zones the
// player skis through. Every line here is pulled directly from the resume — no invented
// projects/stats — so this stays accurate for anyone reviewing it as a job candidate.

export const EDUCATION = [
  {
    title: 'KL Deemed to be University',
    subtitle: 'B.Tech — Computer Science & Engineering',
    tech: 'Aug 2020 – May 2024 · India',
    bullets: ['GPA: 8.57 / 10.0', 'Data Structures · OS · AI · DB Management'],
    accent: 0xe8b23a,
  },
  {
    title: 'University of South Florida',
    subtitle: 'Master of Science — Computer Science',
    tech: 'Aug 2024 – May 2026 · Tampa, FL',
    bullets: ['GPA: 3.50 / 4.0', 'ML · NLP · Distributed Systems · Algorithms'],
    accent: 0xe8b23a,
  },
];

export const EXPERIENCE = [
  {
    title: 'Phoenix Global',
    subtitle: 'Frontend Engineer',
    tech: 'Jun 2022 – May 2024 · EdTech Startup',
    bullets: ['Intern → 2yr offer, sole frontend engineer', 'Built core tutoring site + live dashboards'],
    accent: 0x5cc26a,
  },
  {
    title: 'University of South Florida',
    subtitle: 'Graduate Teaching Assistant — Operating Systems',
    tech: 'Nov 2024 – May 2026 · Tampa, FL',
    bullets: ['Mentored 60+ students / semester', 'Neural-symbolic AI research support'],
    accent: 0x5cc26a,
  },
];

export const PROJECTS = [
  {
    title: 'LLM Doc Validation Assistant',
    subtitle: 'Python · LangChain · Llama 3 · Ollama',
    bullets: ['Fully offline map-reduce summarization', '91% quality, <8s on 500+ page docs'],
    accent: 0x64e6ff,
  },
  {
    title: 'RAG Resume Analyzer',
    subtitle: 'LangChain · FAISS · FastAPI · HF Spaces',
    bullets: ['End-to-end RAG skill-gap pipeline', 'Live demo deployed on HF Spaces'],
    accent: 0x7dff9e,
  },
  {
    title: 'Visual Defect Inspection',
    subtitle: 'TensorFlow · Keras · TFLite · FastAPI',
    bullets: ['96.4% CNN classification accuracy', 'TFLite: 127MB → 10.66MB, <100ms CPU'],
    accent: 0x64e6ff,
  },
  {
    title: 'Offline Doc Q&A Assistant',
    subtitle: 'Python · PyMuPDF · NLP · Keyword Scoring',
    bullets: ['GPU-free, internet-free Q&A system', '88% relevance, 65% faster than manual'],
    accent: 0x7dff9e,
  },
];

export const SKILLS_ARCH_TEXT = 'SKILLS & EXPERTISE';
export const SKILLS_SUBTEXT = 'PyTorch · LangChain · FastAPI · React · TensorFlow · RAG';
