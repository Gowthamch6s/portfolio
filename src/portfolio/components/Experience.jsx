import Reveal from './Reveal.jsx';

const TIMELINE = [
  {
    period: 'Nov 2024 — May 2026',
    title: 'Graduate Teaching Assistant — Operating Systems',
    org: 'University of South Florida · Tampa, FL',
    detail:
      "Supporting Prof. Valentina Korzhova's neural-symbolic AI research (2 active faculty publications). Instructing 60+ graduate students per semester in Operating Systems at 92%+ course satisfaction, and automating project grading with Python — cutting turnaround 35%.",
  },
  {
    period: 'Aug 2024 — May 2026',
    title: 'MS, Computer Science',
    org: 'University of South Florida · GPA 3.50 / 4.0',
    detail:
      'Coursework: Machine Learning, NLP, Distributed Systems, Advanced Algorithms.',
    education: true,
  },
  {
    period: 'Jun 2022 — May 2024',
    title: 'Frontend Engineer',
    org: 'Phoenix Global · EdTech startup serving IIT/IIM tutors · Remote',
    detail:
      "Started as intern; extended 2 years as the team's sole frontend engineer. Built the company's core tutoring website from the ground up, shipped real-time dashboards for tutor availability and student progress over REST APIs, and led UI/UX direction for a platform used daily by thousands.",
  },
  {
    period: 'Aug 2020 — May 2024',
    title: 'B.Tech, Computer Science & Engineering',
    org: 'KL Deemed to be University · GPA 8.57 / 10.0',
    detail: 'Coursework: Data Structures, Operating Systems, AI, Database Management.',
    education: true,
  },
];

export default function Experience() {
  return (
    <section id="experience" className="relative py-24 scroll-mt-20">
      <div className="max-w-6xl mx-auto px-5 sm:px-8">
        <Reveal>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-12">
            <span className="gradient-text">04.</span> Experience &amp; Education
          </h2>
        </Reveal>

        <div className="relative pl-8 sm:pl-10">
          <div className="timeline-line absolute left-2.5 sm:left-3 top-1 bottom-0 w-[3px] rounded-full" />

          <div className="flex flex-col gap-10">
            {TIMELINE.map((item, i) => (
              <Reveal key={item.title} delay={i * 0.12}>
                <div className="relative">
                  <span
                    className="absolute -left-8 sm:-left-10 top-1.5 w-4 h-4 rounded-full"
                    style={{
                      background: 'linear-gradient(120deg, var(--accent), var(--accent-2))',
                      boxShadow: '0 0 16px var(--accent-glow)',
                      transform: 'translateX(-1px)',
                    }}
                  />
                  <div className="glass glass-hover rounded-2xl p-6 sm:p-8">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span
                        className="text-xs font-bold tracking-[0.2em] uppercase"
                        style={{ color: 'var(--accent)' }}
                      >
                        {item.period}
                      </span>
                      <span
                        className="skill-chip rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider"
                        style={{ color: 'var(--text-muted)' }}
                      >
                        {item.education ? 'Education' : 'Experience'}
                      </span>
                    </div>
                    <h3 className="text-xl font-bold mt-2">{item.title}</h3>
                    <p className="font-semibold mt-0.5" style={{ color: 'var(--text-muted)' }}>
                      {item.org}
                    </p>
                    <p className="mt-3 text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                      {item.detail}
                    </p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
