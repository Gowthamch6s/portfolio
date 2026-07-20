import { motion } from 'framer-motion';
import Reveal from './Reveal.jsx';

const SKILL_GROUPS = [
  {
    label: 'AI / ML',
    skills: ['PyTorch', 'TensorFlow', 'Keras', 'Scikit-learn', 'Hugging Face', 'BERT / RoBERTa', 'NLP', 'LLMs', 'RAG', 'MLflow'],
  },
  {
    label: 'LLM & Agents',
    skills: ['LangChain', 'LlamaIndex', 'Pinecone', 'ChromaDB', 'Prompt Engineering', 'OpenAI API', 'Ollama', 'Gradio'],
  },
  {
    label: 'Languages',
    skills: ['Python', 'JavaScript', 'SQL', 'Bash', 'Java', 'C++', 'HTML / CSS'],
  },
  {
    label: 'Backend & MLOps',
    skills: ['FastAPI', 'Docker', 'Git', 'CI/CD', 'Linux', 'PostgreSQL', 'MongoDB', 'Azure', 'PySpark'],
  },
  {
    label: 'Frontend & UX',
    skills: ['React.js', 'REST API Integration', 'Figma', 'Responsive Design'],
  },
  {
    label: 'Certifications',
    skills: ['Azure AI-900', 'Oracle Java SE 8', 'ServiceNow CSA'],
  },
];

export default function Skills() {
  return (
    <section id="skills" className="relative py-24 scroll-mt-20">
      <div className="max-w-6xl mx-auto px-5 sm:px-8">
        <Reveal>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-10">
            <span className="gradient-text">02.</span> Skills
          </h2>
        </Reveal>

        <div className="grid md:grid-cols-2 gap-6">
          {SKILL_GROUPS.map((group, gi) => (
            <Reveal key={group.label} delay={gi * 0.08}>
              <div className="glass glass-hover rounded-3xl p-7 h-full">
                <h3
                  className="text-xs font-bold tracking-[0.25em] uppercase mb-5"
                  style={{ color: 'var(--accent)' }}
                >
                  {group.label}
                </h3>
                <div className="flex flex-wrap gap-2.5">
                  {group.skills.map((skill, i) => (
                    <motion.span
                      key={skill}
                      initial={{ opacity: 0, scale: 0.7 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.04, duration: 0.35, ease: 'backOut' }}
                      className="skill-chip rounded-full px-4 py-2 font-semibold text-sm cursor-default"
                    >
                      {skill}
                    </motion.span>
                  ))}
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
