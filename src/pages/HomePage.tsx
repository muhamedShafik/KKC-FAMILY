import { Link } from 'react-router-dom';
import { TreePine, Users, BookOpen, Image, ChevronRight, Sprout, Star } from 'lucide-react';
import { motion } from 'framer-motion';
import { usePublishedMembers } from '@/hooks/useFamily';
import { Button, Avatar, Skeleton } from '@/components/ui';
import { formatDate } from '@/lib/utils';

// Heritage ornament SVG
function LeafDivider() {
  return (
    <div className="flex items-center gap-3 justify-center my-8">
      <div className="h-px flex-1 bg-gradient-to-r from-transparent to-amber-300" />
      <Sprout className="w-5 h-5 text-amber-400" />
      <div className="h-px flex-1 bg-gradient-to-l from-transparent to-amber-300" />
    </div>
  );
}

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.5, delay: i * 0.1 } }),
};

export default function HomePage() {
  const { data: members = [], isLoading } = usePublishedMembers();
  const founders = members.filter(m => m.generation === 1);
  const founderHead = founders[0];
  const founderPartner = founders[1];
  const recentMembers = members.slice(0, 6);
  const totalGenerations = members.length > 0 ? Math.max(...members.map(m => m.generation ?? 1)) : 0;
  const totalBranches = new Set(members.map(m => m.branch).filter(Boolean)).size;

  return (
    <div>
      {/* ── Hero ─────────────────────────────────────────────────── */}
      <section className="relative min-h-[90vh] flex items-center overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 bg-gradient-to-br from-stone-900 via-stone-800 to-amber-900" />
        <div className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23d4a853' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Text */}
            <div>
              <motion.div
                variants={fadeUp} initial="hidden" animate="show" custom={0}
                className="inline-flex items-center gap-2 bg-amber-500/20 text-amber-300 px-4 py-1.5 rounded-full text-sm font-medium mb-6 border border-amber-500/30"
              >
                <Star className="w-3.5 h-3.5" /> Family Heritage Since Generations
              </motion.div>

              <motion.h1
                variants={fadeUp} initial="hidden" animate="show" custom={1}
                className="font-serif text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-[1.15]"
              >
                The{' '}
                <span className="text-amber-400">KKC</span>
                <br />Family
              </motion.h1>

              <motion.p
                variants={fadeUp} initial="hidden" animate="show" custom={2}
                className="text-stone-300 text-lg md:text-xl max-w-lg mb-8 leading-relaxed"
              >
                Explore our family roots, discover stories of those who came before us, and celebrate the living legacy of the KKC family across generations.
              </motion.p>

              <motion.div
                variants={fadeUp} initial="hidden" animate="show" custom={3}
                className="flex flex-wrap gap-3"
              >
                <Link to="/tree">
                  <Button size="lg" className="bg-amber-500 hover:bg-amber-400 text-white gap-2">
                    <TreePine className="w-5 h-5" /> Explore Family Tree
                  </Button>
                </Link>
                <Link to="/history">
                  <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10 hover:text-white hover:border-white/50">
                    Our History
                  </Button>
                </Link>
              </motion.div>
            </div>

            {/* Founder card */}
            <motion.div
              variants={fadeUp} initial="hidden" animate="show" custom={2}
              className="glass-card rounded-3xl p-8 bg-white/10 border-white/20 backdrop-blur-md"
            >
              {founders.length > 0 ? (
                <>
                  <p className="text-amber-300 text-xs font-semibold uppercase tracking-widest mb-4">
                    Family Founders
                  </p>
                  <div className="flex items-center gap-4 mb-6">
                    <div className="flex -space-x-3">
                      <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-amber-400 ring-2 ring-stone-800 bg-stone-700">
                        <img
                          src={founderHead.profile_photo_url || '/uploads/founders.jpg'}
                          alt={founderHead.full_name}
                          className="w-full h-full object-cover object-top"
                        />
                      </div>
                      {founderPartner && (
                        <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-amber-300 ring-2 ring-stone-800 bg-stone-700">
                          <img
                            src={founderPartner.profile_photo_url || '/uploads/founders.jpg'}
                            alt={founderPartner.full_name}
                            className="w-full h-full object-cover object-top"
                          />
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="text-white font-serif text-lg font-semibold">{founderHead.full_name}</p>
                      {founderPartner && (
                        <p className="text-stone-300 text-sm">& {founderPartner.full_name}</p>
                      )}
                      <p className="text-amber-400 text-xs mt-0.5">Generation 1 · Roots of KKC</p>
                    </div>
                  </div>

                  <div className="h-px bg-white/20 mb-4" />

                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-2xl font-bold text-amber-400 font-serif">{members.length}</p>
                      <p className="text-xs text-stone-400 mt-0.5">Members</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-amber-400 font-serif">{totalGenerations}</p>
                      <p className="text-xs text-stone-400 mt-0.5">Generations</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-amber-400 font-serif">{totalBranches}</p>
                      <p className="text-xs text-stone-400 mt-0.5">Branches</p>
                    </div>
                  </div>

                  <Link to="/tree" className="mt-6 flex items-center justify-center gap-2 py-3 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-sm font-medium transition-colors border border-amber-500/30">
                    View Family Tree <ChevronRight className="w-4 h-4" />
                  </Link>
                </>
              ) : (
                <>
                  <p className="text-amber-300 text-xs font-semibold uppercase tracking-widest mb-4">
                    Family Heritage
                  </p>
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border-2 border-dashed border-amber-400 flex items-center justify-center text-amber-300 flex-shrink-0">
                      <TreePine className="w-7 h-7" />
                    </div>
                    <div>
                      <p className="text-white font-serif text-lg font-semibold">Ready to Begin</p>
                      <p className="text-stone-300 text-xs mt-0.5">Add First Family Head & Partner to start</p>
                    </div>
                  </div>

                  <div className="h-px bg-white/20 mb-4" />

                  <div className="grid grid-cols-3 gap-4 text-center mb-6">
                    <div>
                      <p className="text-2xl font-bold text-amber-400 font-serif">0</p>
                      <p className="text-xs text-stone-400 mt-0.5">Members</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-amber-400 font-serif">0</p>
                      <p className="text-xs text-stone-400 mt-0.5">Generations</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-amber-400 font-serif">0</p>
                      <p className="text-xs text-stone-400 mt-0.5">Branches</p>
                    </div>
                  </div>

                  <Link to="/admin/setup-founders" className="flex items-center justify-center gap-2 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-white text-sm font-semibold transition-colors shadow-lg">
                    Admin: Add First Family Head & Partner <ChevronRight className="w-4 h-4" />
                  </Link>
                </>
              )}
            </motion.div>
          </div>
        </div>

        {/* Wave bottom */}
        <div className="absolute bottom-0 inset-x-0">
          <svg viewBox="0 0 1440 80" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" className="w-full h-16">
            <path d="M0,80 C360,0 1080,80 1440,20 L1440,80 Z" fill="#fdf8f0" fillOpacity="0.97" />
          </svg>
        </div>
      </section>

      {/* ── Quick Links ───────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-4 pb-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: TreePine, label: 'Family Tree', to: '/tree', desc: 'Explore branches', color: 'text-amber-600 bg-amber-50' },
            { icon: Users, label: 'Members', to: '/members', desc: 'All family members', color: 'text-stone-600 bg-stone-50' },
            { icon: BookOpen, label: 'History', to: '/history', desc: 'Stories & milestones', color: 'text-amber-700 bg-amber-50' },
            { icon: Image, label: 'Gallery', to: '/gallery', desc: 'Family photos', color: 'text-stone-700 bg-stone-50' },
          ].map(({ icon: Icon, label, to, desc, color }, i) => (
            <motion.div key={to} variants={fadeUp} initial="hidden" whileInView="show" custom={i} viewport={{ once: true }}>
              <Link
                to={to}
                className="group flex flex-col items-center p-6 bg-white rounded-2xl shadow-sm border border-stone-100 hover:shadow-md hover:border-amber-200 transition-all duration-200 text-center"
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3 ${color} group-hover:scale-110 transition-transform`}>
                  <Icon className="w-6 h-6" />
                </div>
                <p className="font-semibold text-stone-900 text-sm">{label}</p>
                <p className="text-xs text-stone-500 mt-0.5">{desc}</p>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── About Section ─────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <LeafDivider />
        <div className="grid md:grid-cols-2 gap-12 items-center mt-8">
          <motion.div variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }}>
            <p className="text-amber-600 font-medium text-sm uppercase tracking-widest mb-3">About the KKC Family</p>
            <h2 className="font-serif text-4xl font-bold text-stone-900 mb-6">
              A Legacy Built on<br />Love & Tradition
            </h2>
            <div className="space-y-4 text-stone-600 leading-relaxed">
              <p>
                Welcome to the official KKC Family website — a living archive dedicated to celebrating our family's roots, honoring those who came before us, and connecting generations to come.
              </p>
              <p>
                This website is currently being set up. Family administrators can sign in to add founding members, build out the family tree, and begin adding our rich family history.
              </p>
              <p className="text-sm bg-amber-50 border border-amber-200 rounded-xl p-4 text-amber-800">
                <strong>📝 Getting Started:</strong> Please visit the Admin area to add the first family head and their partner to begin building the family tree.
              </p>
            </div>
            <div className="mt-8 flex gap-3">
              <Link to="/history">
                <Button variant="primary">Read Our History</Button>
              </Link>
              <Link to="/members">
                <Button variant="secondary">Meet the Family</Button>
              </Link>
            </div>
          </motion.div>

          {/* Founders image */}
          <motion.div
            variants={fadeUp} initial="hidden" whileInView="show" custom={1} viewport={{ once: true }}
            className="relative"
          >
            <div className="relative rounded-3xl overflow-hidden shadow-xl aspect-[4/5] bg-stone-200 group">
              <img
                src={founderHead?.profile_photo_url || founderPartner?.profile_photo_url || "/uploads/founders.jpg"}
                alt="Family Founders"
                className="absolute inset-0 w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-700"
                onError={(e) => {
                  const t = e.target as HTMLImageElement;
                  t.src = '/uploads/founders.jpg';
                }}
              />
              {/* Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-stone-900/70 via-stone-900/20 to-transparent" />
              <div className="absolute bottom-0 inset-x-0 p-6">
                <p className="text-white font-serif text-xl font-semibold">
                  {founderHead && founderPartner
                    ? `${founderHead.full_name} & ${founderPartner.full_name}`
                    : founderHead
                    ? founderHead.full_name
                    : 'KKC Family Founders'}
                </p>
                <p className="text-amber-300 text-sm mt-1">First Generation · The Beginning of Our Story</p>
              </div>
            </div>
            {/* Decorative elements */}
            <div className="absolute -bottom-4 -right-4 w-24 h-24 rounded-2xl bg-amber-100 -z-10" />
            <div className="absolute -top-4 -left-4 w-16 h-16 rounded-2xl bg-stone-200 -z-10" />
          </motion.div>
        </div>
      </section>

      {/* ── Recent Members ────────────────────────────────────────── */}
      {(isLoading || recentMembers.length > 0) && (
        <section className="bg-white py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-end justify-between mb-10">
              <div>
                <p className="text-amber-600 text-sm font-medium uppercase tracking-widest mb-2">Our People</p>
                <h2 className="font-serif text-3xl font-bold text-stone-900">Family Members</h2>
              </div>
              <Link to="/members" className="flex items-center gap-1 text-amber-600 hover:text-amber-800 text-sm font-medium transition-colors">
                View all <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              {isLoading
                ? Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="flex flex-col items-center p-4 rounded-2xl bg-stone-50">
                      <Skeleton className="w-16 h-16 rounded-full mb-3" />
                      <Skeleton className="h-3 w-20 mb-1" />
                      <Skeleton className="h-2 w-14" />
                    </div>
                  ))
                : recentMembers.map((m, i) => (
                    <motion.div
                      key={m.id} variants={fadeUp} initial="hidden" whileInView="show" custom={i * 0.05}
                      viewport={{ once: true }}
                    >
                      <Link
                        to={`/members/${m.id}`}
                        className="flex flex-col items-center p-4 rounded-2xl hover:bg-amber-50 border border-transparent hover:border-amber-100 transition-all text-center group"
                      >
                        <Avatar name={m.full_name} src={m.profile_photo_url} size="lg" className="mb-3 group-hover:ring-2 ring-amber-400 ring-offset-2 transition-all" />
                        <p className="font-medium text-stone-900 text-sm leading-tight">{m.full_name}</p>
                        {m.branch && <p className="text-xs text-stone-400 mt-0.5">{m.branch}</p>}
                      </Link>
                    </motion.div>
                  ))
              }
            </div>
          </div>
        </section>
      )}

      {/* ── Features / Values ─────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <LeafDivider />
        <div className="text-center mt-8 mb-12">
          <h2 className="font-serif text-3xl font-bold text-stone-900 mb-3">What You'll Find Here</h2>
          <p className="text-stone-500 max-w-xl mx-auto">Everything your family needs to connect with your shared past and celebrate your collective story.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              icon: TreePine, title: 'Interactive Family Tree',
              desc: 'Navigate through generations with our interactive tree. Expand branches, select members, and see how everyone is connected.',
              color: 'bg-amber-50 text-amber-600',
            },
            {
              icon: BookOpen, title: 'Family History',
              desc: 'Read stories, milestones, traditions, and important events that have shaped the KKC family over the years.',
              color: 'bg-stone-50 text-stone-600',
            },
            {
              icon: Image, title: 'Photo Gallery',
              desc: 'Relive cherished moments through family portraits, reunion photos, historical images, and precious memories.',
              color: 'bg-amber-50 text-amber-700',
            },
          ].map(({ icon: Icon, title, desc, color }, i) => (
            <motion.div
              key={title} variants={fadeUp} initial="hidden" whileInView="show" custom={i * 0.1}
              viewport={{ once: true }}
              className="p-8 bg-white rounded-2xl shadow-sm border border-stone-100 hover:shadow-md transition-shadow"
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${color}`}>
                <Icon className="w-6 h-6" />
              </div>
              <h3 className="font-serif text-xl font-semibold text-stone-900 mb-3">{title}</h3>
              <p className="text-stone-500 text-sm leading-relaxed">{desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────── */}
      <section className="bg-gradient-to-br from-stone-900 to-amber-900 py-20">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <TreePine className="w-12 h-12 text-amber-400 mx-auto mb-6" />
          <h2 className="font-serif text-4xl font-bold text-white mb-4">Ready to Explore?</h2>
          <p className="text-stone-300 text-lg mb-8">
            Dive into the KKC family tree and discover the people and stories that make our family special.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link to="/tree">
              <Button size="lg" className="bg-amber-500 hover:bg-amber-400 text-white">
                <TreePine className="w-5 h-5" /> View Family Tree
              </Button>
            </Link>
            <Link to="/gallery">
              <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10 hover:text-white hover:border-white/50">
                <Image className="w-5 h-5" /> Photo Gallery
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

