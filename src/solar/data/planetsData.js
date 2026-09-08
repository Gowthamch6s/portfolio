// Real content only — same source of truth as the rest of the portfolio
// (career-twin profile / resume). Each planet is one broad life chapter
// rather than one planet per project, per an explicit "fewer, broader
// districts" choice over a planet-per-project layout.
export const PLANETS = [
  {
    id: 'academia',
    name: 'Terra Academia',
    theme: 'Education',
    color: 0x4fd1c5,
    orbitRadius: 46,
    orbitSpeed: 0.05,
    size: 6.2,
    tilt: 0.15,
    nodes: [
      {
        title: 'M.S. Computer Science',
        subtitle: 'University of South Florida · GPA 3.50/4.0',
        detail: 'Aug 2024 – May 2026, Tampa FL. Coursework: Machine Learning, NLP, Distributed Systems, Advanced Algorithms.',
      },
      {
        title: 'B.Tech Computer Science & Engineering',
        subtitle: 'KL Deemed to be University · GPA 8.57/10.0',
        detail: 'Aug 2020 – May 2024, India. Coursework: Data Structures, OS, AI, Database Management.',
      },
    ],
  },
  {
    id: 'projects',
    name: 'Nebula Forge',
    theme: 'AI / ML Projects',
    color: 0x8b5cf6,
    orbitRadius: 68,
    orbitSpeed: 0.035,
    size: 8.4,
    tilt: -0.1,
    nodes: [
      {
        title: 'AgentFlow Studio',
        subtitle: 'Autonomous AI Agent System',
        detail: 'Self-correcting 5-node LangGraph state machine with human-in-the-loop checkpoints and E2B-sandboxed code execution.',
        link: 'https://github.com/Gowthamch6s/AgentFlow-Studio',
        linkLabel: 'View on GitHub',
      },
      {
        title: 'AI Career Copilot',
        subtitle: 'Agentic RAG System',
        detail: 'LangGraph agent grounding skill-gap analysis in live job postings, with an independent LLM-judge eval pass — 100% pass rate, 1.0 avg faithfulness.',
        link: 'https://gowtham00007-ai-career-coach.hf.space',
        linkLabel: 'Live Demo',
      },
      {
        title: 'Visual Defect Inspection',
        subtitle: 'AI/ML Manufacturing QC',
        detail: '96.4% classification accuracy; compressed to TFLite (127.87 MB → 10.66 MB) for sub-100ms CPU inference.',
        link: 'https://github.com/Gowthamch6s/ai-ml-inspection-system',
        linkLabel: 'View on GitHub',
      },
      {
        title: 'Doc Validation Assistant',
        subtitle: 'Offline LLM Summarizer',
        detail: 'Fully offline map-reduce summarization via locally-hosted Llama 3 — zero data leaves the org.',
        link: 'https://github.com/Gowthamch6s/ai-assistant',
        linkLabel: 'View on GitHub',
      },
      {
        title: 'Market Intelligence Agent',
        subtitle: 'Autonomous Startup Validator',
        detail: 'LangGraph multi-agent system researching and validating startup ideas end-to-end.',
        link: 'https://github.com/Gowthamch6s',
        linkLabel: 'View on GitHub',
      },
    ],
  },
  {
    id: 'experience',
    name: 'Ignis Works',
    theme: 'Experience',
    color: 0xf97316,
    orbitRadius: 90,
    orbitSpeed: 0.026,
    size: 7.0,
    tilt: 0.22,
    nodes: [
      {
        title: 'Graduate Teaching Assistant — Operating Systems',
        subtitle: 'University of South Florida · Nov 2024 – May 2026',
        detail: '92%+ course satisfaction instructing 60+ grad students/semester; cut grading turnaround 35% with Python automation; contributed to 2 faculty publications in neural-symbolic AI.',
      },
      {
        title: 'Frontend Engineer',
        subtitle: 'Phoenix Global · Jun 2022 – May 2024',
        detail: "Shipped the company's core tutoring platform UI/UX from the ground up as the team's sole frontend engineer, serving thousands of daily active students and tutors.",
      },
    ],
  },
  {
    id: 'skills',
    name: 'Aether Core',
    theme: 'Skills',
    color: 0x22d3ee,
    orbitRadius: 112,
    orbitSpeed: 0.02,
    size: 5.6,
    tilt: -0.18,
    nodes: [
      { title: 'AI / ML', subtitle: '', detail: 'PyTorch · TensorFlow · Keras · Scikit-learn · Hugging Face · BERT/RoBERTa · NLP · LLMs · RAG · MLflow' },
      { title: 'LLM & Agents', subtitle: '', detail: 'LangChain · LangGraph · LlamaIndex · Pinecone · ChromaDB · Prompt Engineering · OpenAI API · Groq · Ollama · E2B' },
      { title: 'Backend & MLOps', subtitle: '', detail: 'FastAPI · Docker · Git · CI/CD · Linux · PostgreSQL · MongoDB · Azure · PySpark' },
      { title: 'Frontend', subtitle: '', detail: 'React.js · Next.js · TypeScript · REST APIs · Figma' },
    ],
  },
  {
    id: 'photography',
    name: 'Lumen Isle',
    theme: 'Photography',
    color: 0xfbbf24,
    orbitRadius: 132,
    orbitSpeed: 0.015,
    size: 5.2,
    tilt: 0.12,
    nodes: [
      {
        title: 'Behind the Lens',
        subtitle: 'Urban Street Photography',
        detail: 'Landscape, lifestyle, abstract, architecture — shot on my phone.',
        link: 'https://vsco.co/gowthamvsco1/gallery',
        linkLabel: 'View VSCO Gallery',
      },
    ],
  },
  {
    id: 'contact',
    name: 'Signal Station',
    theme: 'Contact',
    color: 0xf472b6,
    orbitRadius: 152,
    orbitSpeed: 0.012,
    size: 4.4,
    tilt: -0.08,
    isStation: true,
    nodes: [
      { title: 'Email', subtitle: '', detail: 'gowthamch6s@gmail.com', link: 'mailto:gowthamch6s@gmail.com', linkLabel: 'Send Email' },
      { title: 'GitHub', subtitle: '', detail: 'Every repo above (and more) lives here.', link: 'https://github.com/Gowthamch6s', linkLabel: 'Open GitHub' },
      { title: 'LinkedIn', subtitle: '', detail: "Let's connect.", link: 'https://www.linkedin.com/in/1gs/', linkLabel: 'Open LinkedIn' },
      { title: 'Resume', subtitle: '', detail: 'The full PDF — every project, every number.', link: '/resume.pdf', linkLabel: 'Download Resume', download: true },
    ],
  },
];

export const HOME_NAME = 'Gowtham';
export const HOME_TAGLINE = 'AI/ML Engineer · Agentic AI & Generative AI';
