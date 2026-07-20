import Reveal from './Reveal.jsx';

// Pulled directly from Gowtham's VSCO gallery (im.vsco.co CDN) — real shots,
// not placeholders. Requesting w=900 for a crisp but reasonably light grid.
const PHOTOS = [
  '6a4c5ef3b32f4b4cff32c910',
  '6a4c5eb262634b7a38faf567',
  '6a4c5e4862ffdcdec4eb5e25',
  '6a4c5dfc52ea3449d460dcf2',
  '6a4c5dc66a11e66fd0f786c4',
  '6a4c5ed682c788e6b03475da',
  '6a4c5e9ef3a22b2ef058345e',
  '6a4c5e2eddfd42914eadff77',
  '6a4c5def52ea3449d460dcc4',
  '6a276cef487c86b30572eac1',
  '6a4c5ec2b32f4b4cff32c889',
  '6a4c5e88b32f4b4cff32c7c5',
].map(
  (id) => `https://im.vsco.co/aws-us-west-2/bd0ffe/332320362/${id}/vsco_070626.jpg?w=900`
);

export default function Photography() {
  return (
    <section id="photography" className="relative py-24 scroll-mt-20">
      <div className="max-w-6xl mx-auto px-5 sm:px-8">
        <Reveal>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-4">
            <span className="gradient-text">06.</span> Behind the Lens
          </h2>
          <p className="max-w-2xl text-lg leading-relaxed mb-10" style={{ color: 'var(--text-muted)' }}>
            Outside of code, I click a lot of pictures — landscape, lifestyle,
            abstract, architecture. I have a good eye for detail, and a camera
            is where that shows up first.
          </p>
        </Reveal>

        <div className="columns-2 md:columns-3 gap-4 [&>*]:mb-4">
          {PHOTOS.map((src, i) => (
            <Reveal key={src} delay={(i % 6) * 0.06}>
              <a
                href="https://vsco.co/gowthamvsco1/gallery"
                target="_blank"
                rel="noreferrer"
                className="glass glass-hover block overflow-hidden rounded-2xl break-inside-avoid"
              >
                <img
                  src={src}
                  alt="Photo by Gowtham Sai Chimmana"
                  loading="lazy"
                  className="w-full h-auto block"
                />
              </a>
            </Reveal>
          ))}
        </div>

        <Reveal delay={0.2}>
          <div className="mt-8 text-center">
            <a
              href="https://vsco.co/gowthamvsco1/gallery"
              target="_blank"
              rel="noreferrer"
              className="btn-secondary inline-flex items-center gap-2 rounded-full px-6 py-3 font-semibold"
            >
              View full gallery on VSCO ↗
            </a>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
