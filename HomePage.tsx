import { useEffect, useState, type ReactNode } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ArrowDown, ArrowRight, Check, ChevronDown, Heart, Menu, Plus, ShieldCheck, Sparkles, UserRound, X } from 'lucide-react';
import heroScene from '@/assets/site/hero-scene.webp';
import { HeroDecor } from './HeroDecor';
import family from '@/assets/site/family.webp';
import { AVATARS } from '@/game/storage';
import { AGE_FILTERS, ARTICLES, FAQS, GAMES, NAVIGATION, PROGRAMS, type AgeGroup, type Article, type CatalogGame } from './content';
import { ArticleArt, GameArt, ProgramArt } from './Art';
import { Logo, SunnyStar } from './Brand';
import { SiteDialog } from './Dialog';
import { ProfileDialog } from './ProfileDialog';
import { loadProfile } from './profile';
import './site.css';

type Modal = { type: 'profile' } | { type: 'game'; game: CatalogGame } | { type: 'article'; article: Article } | { type: 'privacy' } | null;

function Reveal({ children, className = '', delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  const reduce = useReducedMotion();
  return (
    <motion.div className={className} initial={reduce ? false : { opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.12 }} transition={{ duration: 0.55, delay, ease: 'easeOut' }}>
      {children}
    </motion.div>
  );
}

function scrollToSection(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
}

export default function HomePage({ onPlay }: { onPlay: (route: string) => void }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('home');
  const [scrolled, setScrolled] = useState(false);
  const [ageFilter, setAgeFilter] = useState<AgeGroup>('all');
  const [direction, setDirection] = useState('all');
  const [programIndex, setProgramIndex] = useState(0);
  const [modal, setModal] = useState<Modal>(null);
  const [profile, setProfile] = useState(loadProfile);
  const reduce = useReducedMotion();
  const program = PROGRAMS[programIndex];
  const filteredGames = GAMES.filter(game => (ageFilter === 'all' || game.groups.includes(ageFilter)) && (direction === 'all' || game.id === direction));

  useEffect(() => {
    document.title = 'PlayKids | Играя. Учимся. Растём.';
    const id = window.location.hash.slice(1);
    const timer = window.setTimeout(() => {
      if (NAVIGATION.some(item => item.id === id)) document.getElementById(id)?.scrollIntoView({ behavior: 'instant' });
      else window.scrollTo({ top: 0, behavior: 'instant' });
    }, 50);
    const onScroll = () => setScrolled(window.scrollY > 20);
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => { if (entry.isIntersecting) setActiveSection(entry.target.id); });
    }, { rootMargin: '-18% 0px -64% 0px', threshold: 0 });
    NAVIGATION.forEach(item => { const element = document.getElementById(item.id); if (element) observer.observe(element); });
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => { window.clearTimeout(timer); observer.disconnect(); window.removeEventListener('scroll', onScroll); };
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') setMenuOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [menuOpen]);

  const play = (route: string) => { setModal(null); onPlay(route); };

  return (
    <div className="playkids-site">
      <a className="pk-skip-link" href="#games">Перейти к играм</a>
      <header className={`pk-header${scrolled ? ' pk-header--scrolled' : ''}`}>
        <div className="pk-container pk-header-inner">
          <Logo />
          <nav className="pk-desktop-nav" aria-label="Основная навигация">
            {NAVIGATION.map(item => <a key={item.id} href={`#${item.id}`} className={activeSection === item.id ? 'is-active' : ''} aria-current={activeSection === item.id ? 'location' : undefined}>{item.label}</a>)}
          </nav>
          <div className="pk-header-actions">
            <button className="pk-login" type="button" onClick={() => setModal({ type: 'profile' })}>
              {profile ? <img src={AVATARS[profile.avatar]} alt="" /> : <UserRound size={20} strokeWidth={2.2} />}
              <span>{profile ? profile.name : 'Войти'}</span>
            </button>
            <button className="pk-menu-button" type="button" onClick={() => setMenuOpen(!menuOpen)} aria-expanded={menuOpen} aria-controls="mobile-navigation" aria-label={menuOpen ? 'Закрыть меню' : 'Открыть меню'}>
              {menuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
        <AnimatePresence>
          {menuOpen && (
            <motion.nav id="mobile-navigation" className="pk-mobile-nav" aria-label="Мобильная навигация" initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}>
              {NAVIGATION.map(item => <a key={item.id} href={`#${item.id}`} className={activeSection === item.id ? 'is-active' : ''} onClick={() => setMenuOpen(false)}>{item.label}<ArrowRight size={18} /></a>)}
            </motion.nav>
          )}
        </AnimatePresence>
      </header>

      <main>
        <section id="home" className="pk-hero" aria-labelledby="hero-title">
          <div className="pk-hero-scene">
            <motion.img
              className="pk-hero-photo"
              src={heroScene}
              alt="Дети и игрушечный жирафик вместе с интересом смотрят в планшет"
              fetchPriority="high"
              initial={reduce ? false : { opacity: 0, scale: 1.04 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1.1, ease: 'easeOut' }}
            />
            <HeroDecor />
          </div>
          <div className="pk-hero-blob" aria-hidden="true" />
          <div className="pk-container pk-hero-inner">
            <motion.div className="pk-hero-copy" initial={reduce ? false : { opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.65, delay: 0.1 }}>
              <h1 id="hero-title">
                <span className="pk-hero-brand">PlayKids<span>!</span></span>
                <span className="pk-hero-heading">Дошкольное<br />образование<br />в формате <em>игры</em></span>
              </h1>
              <p>Развивающие онлайн-игры для детей 3–7 лет.<br className="pk-desktop-break" /> Учимся с радостью и без спешки.</p>
              <div className="pk-hero-actions">
                <button type="button" className="pk-button pk-button--hero" onClick={() => play('/games/math')}>Начать играть<ArrowRight size={25} /></button>
                <a href="#games" className="pk-hero-more">Все игры<ArrowDown size={17} /></a>
              </div>
            </motion.div>
          </div>
          <svg className="pk-hero-waves" viewBox="0 0 1600 120" preserveAspectRatio="none" aria-hidden="true">
            <path d="M0 33C164-13 280 104 461 77C623 53 681 25 838 107L1600 120H0Z" fill="#FFE18A" />
            <path d="M650 120C788 71 827 4 955 39C1102 79 1134 135 1300 104C1438 78 1491 71 1600 83V120Z" fill="#C4AFED" />
            <path d="M0 104C188 119 370 105 562 114C827 126 1050 112 1190 116C1385 123 1460 111 1600 113V120H0Z" fill="#FFFFFF" />
          </svg>
        </section>

        <section id="games" className="pk-section pk-games" aria-labelledby="games-title">
          <div className="pk-container">
            <Reveal className="pk-section-heading">
              <span className="pk-eyebrow">Учиться интересно</span>
              <h2 id="games-title">Во что будем играть?</h2>
              <p>Маленькие приключения, в которых каждый день получается что-то новое.</p>
            </Reveal>
            <Reveal className="pk-catalog-filters" delay={0.05}>
              <div className="pk-age-filters" role="group" aria-label="Возраст ребёнка">
                {AGE_FILTERS.map(filter => <button key={filter.id} type="button" className={ageFilter === filter.id ? 'is-active' : ''} aria-pressed={ageFilter === filter.id} onClick={() => setAgeFilter(filter.id)}>{filter.label}</button>)}
              </div>
              <label className="pk-direction-select"><span className="sr-only">Направление обучения</span>
                <select value={direction} onChange={event => setDirection(event.target.value)}>
                  <option value="all">Все направления</option>
                  {GAMES.map(game => <option key={game.id} value={game.id}>{game.category}</option>)}
                </select>
                <ChevronDown size={17} />
              </label>
            </Reveal>
            <div className="pk-game-grid" aria-live="polite">
              {filteredGames.map((game, index) => (
                <Reveal key={game.id} delay={index * 0.07}>
                  <article className="pk-game-card">
                    <button type="button" className="pk-card-image-button" onClick={() => game.available ? play(game.route ?? '/games/math') : setModal({ type: 'game', game })} aria-label={game.available ? `Играть: ${game.title}` : `Подробнее: ${game.title}`}><GameArt kind={game.id} /></button>
                    <div className="pk-game-meta"><span>{game.category}</span><span>{game.ages}</span></div>
                    <h3>{game.title}</h3>
                    <p>{game.description}</p>
                    <div className="pk-card-actions">
                      <button type="button" className={game.available ? 'pk-button pk-button--small' : 'pk-text-button'} onClick={() => game.available ? play(game.route ?? '/games/math') : setModal({ type: 'game', game })}>{game.available ? 'Играть бесплатно' : 'Об игре'}<ArrowRight size={18} /></button>
                      {!game.available && <span className="pk-coming-label">Скоро</span>}
                    </div>
                  </article>
                </Reveal>
              ))}
              {!filteredGames.length && <div className="pk-empty-catalog"><Sparkles size={30} /><h3>Новые открытия уже в пути</h3><p>Для этого сочетания возраста и направления игры пока готовятся.</p><button type="button" className="pk-text-button" onClick={() => { setAgeFilter('all'); setDirection('all'); }}>Посмотреть все игры<ArrowRight size={18} /></button></div>}
            </div>
            <p className="pk-catalog-note">Начните с математики и букв — новые приключения уже в пути.</p>
          </div>
        </section>

        <section id="program" className="pk-section pk-program" aria-labelledby="program-title">
          <div className="pk-container pk-program-grid">
            <Reveal className="pk-program-intro">
              <span className="pk-eyebrow">Каждому свой темп</span>
              <h2 id="program-title">Растём. Играем.<br />Открываем новое.</h2>
              <p>От первых «почему?» до уверенного<br className="pk-desktop-break" /> «я сам!». Вместе, шаг за шагом.</p>
              <ProgramArt />
            </Reveal>
            <Reveal className="pk-program-content" delay={0.1}>
              <div className="pk-program-tabs" role="tablist" aria-label="Программа по возрасту">
                {PROGRAMS.map((item, index) => <button key={item.id} type="button" role="tab" id={`age-tab-${item.id}`} aria-selected={programIndex === index} aria-controls={`age-panel-${item.id}`} tabIndex={programIndex === index ? 0 : -1} onClick={() => setProgramIndex(index)} onKeyDown={event => {
                  if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
                  event.preventDefault();
                  const next = event.key === 'Home' ? 0 : event.key === 'End' ? PROGRAMS.length - 1 : (programIndex + (event.key === 'ArrowRight' ? 1 : -1) + PROGRAMS.length) % PROGRAMS.length;
                  setProgramIndex(next);
                  document.getElementById(`age-tab-${PROGRAMS[next].id}`)?.focus();
                }} className={programIndex === index ? 'is-active' : ''}>{item.label}</button>)}
              </div>
              <AnimatePresence mode="wait" initial={false}>
                <motion.div key={program.id} id={`age-panel-${program.id}`} role="tabpanel" aria-labelledby={`age-tab-${program.id}`} className="pk-program-panel" initial={{ opacity: 0, y: reduce ? 0 : 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: reduce ? 0 : -8 }} transition={{ duration: 0.18 }}>
                  <span className="pk-program-caption">{program.caption}</span>
                  <h3>{program.title}</h3>
                  <p>{program.description}</p>
                  <ul>{program.skills.map(skill => <li key={skill}><span><Check size={16} strokeWidth={2.5} /></span>{skill}</li>)}</ul>
                  <p className="pk-program-game"><Sparkles size={19} />{program.game}</p>
                  <button type="button" className="pk-text-button" onClick={() => { setAgeFilter(program.id); setDirection('all'); scrollToSection('games'); }}>Выбрать игры для этого возраста<ArrowRight size={19} /></button>
                </motion.div>
              </AnimatePresence>
              <p className="pk-program-note">Это ориентиры, а не строгий план. Начните с того, что интересно ребёнку.</p>
            </Reveal>
          </div>
        </section>

        <section id="about" className="pk-section pk-about" aria-labelledby="about-title">
          <div className="pk-container pk-about-grid">
            <Reveal className="pk-about-photo-wrap"><img src={family} alt="Мама и ребёнок вместе строят домик из деревянных кубиков" loading="lazy" className="pk-about-photo" /></Reveal>
            <Reveal className="pk-about-copy" delay={0.08}>
              <span className="pk-eyebrow">С заботой о детстве</span>
              <h2 id="about-title">Здесь можно<br />быть любопытным.</h2>
              <p>Мы создаём PlayKids, чтобы знакомство с новым было похоже не на урок, а на любимую игру. Здесь можно пробовать, ошибаться и пробовать снова.</p>
              <div className="pk-about-value"><Heart size={24} /><div><h3>Поддерживаем, а не торопим</h3><p>Добрые герои и подсказки вместо таймеров и строгих оценок.</p></div></div>
              <div className="pk-about-value"><ShieldCheck size={25} /><div><h3>Только ребёнок и его открытия</h3><p>Без рекламы в игре. Без обязательной регистрации и покупок.</p></div></div>
              <button type="button" className="pk-text-button" onClick={() => scrollToSection('questions')}>Ответы на вопросы родителей<ArrowRight size={19} /></button>
            </Reveal>
          </div>
        </section>

        <section id="blog" className="pk-section pk-blog" aria-labelledby="blog-title">
          <div className="pk-container">
            <Reveal className="pk-section-heading"><span className="pk-eyebrow">Вдохновение для родителей</span><h2 id="blog-title">Растём вместе с детьми</h2><p>Немного идей, поддержки и поводов провести время вместе.</p></Reveal>
            <div className="pk-article-grid">
              {ARTICLES.map((article, index) => <Reveal key={article.id} delay={index * 0.07}><article className="pk-article-card">
                <button type="button" className="pk-article-image" onClick={() => setModal({ type: 'article', article })} aria-label={`Читать: ${article.title}`}><ArticleArt art={article.art} /></button>
                <span className="pk-article-tag">{article.tag}</span>
                <h3><button type="button" onClick={() => setModal({ type: 'article', article })}>{article.title}</button></h3>
                <p>{article.summary}</p>
                <button type="button" className="pk-text-button" onClick={() => setModal({ type: 'article', article })}>Читать<ArrowRight size={18} /></button>
              </article></Reveal>)}
            </div>
          </div>
        </section>

        <section id="questions" className="pk-section pk-questions" aria-labelledby="questions-title">
          <div className="pk-container pk-questions-grid">
            <Reveal><span className="pk-eyebrow">Всё просто</span><h2 id="questions-title">Родители <br />спрашивают</h2><p>Собрали то, что важно <br />знать перед первой игрой.</p></Reveal>
            <Reveal className="pk-faq-list" delay={0.08}>{FAQS.map(item => <details key={item.question} className="pk-faq"><summary>{item.question}<Plus size={21} /></summary><p>{item.answer}</p></details>)}</Reveal>
          </div>
        </section>

        <section className="pk-final-cta" aria-labelledby="cta-title">
          <div className="pk-container pk-final-inner">
            <Reveal><h2 id="cta-title">Большие открытия<br />начинаются с игры.</h2><p>Белочка и Мишка уже ждут вас.</p><button type="button" className="pk-button" onClick={() => play('/games/math')}>Давайте играть<ArrowRight size={22} /></button></Reveal>
            <Reveal className="pk-final-star-wrap" delay={0.1}><SunnyStar className="pk-final-star" /></Reveal>
          </div>
        </section>
      </main>

      <footer className="pk-footer">
        <div className="pk-container">
          <div className="pk-footer-main"><div><Logo footer /><p>Маленькие игры.<br />Большое счастливое детство.</p></div><nav aria-label="Навигация внизу страницы"><strong>Открывайте PlayKids</strong>{NAVIGATION.slice(1).map(item => <a key={item.id} href={`#${item.id}`}>{item.label}</a>)}</nav><div className="pk-footer-parent"><strong>Для родителей</strong><button type="button" onClick={() => setModal({ type: 'profile' })}>Профиль ребёнка</button><a href="#questions">Вопросы и ответы</a><button type="button" onClick={() => setModal({ type: 'privacy' })}>Конфиденциальность</button></div></div>
          <div className="pk-footer-bottom"><span>© {new Date().getFullYear()} PlayKids</span><span>С заботой о маленьких открытиях<Heart size={15} /></span></div>
        </div>
      </footer>

      {modal?.type === 'profile' && <ProfileDialog profile={profile} onChange={setProfile} onClose={() => setModal(null)} onPlay={() => play('/games/math')} />}
      {modal?.type === 'game' && <SiteDialog title={modal.game.title} onClose={() => setModal(null)}>
        <div className="pk-game-dialog-art"><GameArt kind={modal.game.id} /></div>
        <span className="pk-dialog-overline">Готовим новое приключение</span>
        <p className="pk-dialog-description">{modal.game.description}</p>
        <ul className="pk-dialog-skills">{modal.game.skills.map(skill => <li key={skill}><Check size={18} />{skill}</li>)}</ul>
        <p className="pk-form-note">Эта игра пока в разработке. А математика с Белочкой и «Знакомство с буквами» с Мишкой уже доступны бесплатно.</p>
        <button type="button" className="pk-button pk-button--full" onClick={() => play('/games/math')}>Поиграть с Белочкой<ArrowRight size={20} /></button>
      </SiteDialog>}
      {modal?.type === 'article' && <SiteDialog title={modal.article.title} onClose={() => setModal(null)} wide>
        <div className="pk-reading-hero"><ArticleArt art={modal.article.art} /></div>
        <span className="pk-dialog-overline">{modal.article.tag}</span>
        <p className="pk-reading-intro">{modal.article.summary}</p>
        <div className="pk-reading-body">{modal.article.paragraphs.map(paragraph => <section key={paragraph.heading}><h3>{paragraph.heading}</h3><p>{paragraph.text}</p></section>)}<aside><Heart size={22} /><p>{modal.article.tip}</p></aside></div>
        <button type="button" className="pk-button" onClick={() => play('/games/math')}>Попробовать математику<ArrowRight size={20} /></button>
      </SiteDialog>}
      {modal?.type === 'privacy' && <SiteDialog title="Ваши данные остаются у вас" onClose={() => setModal(null)} wide>
        <div className="pk-reading-body"><section><h3>Что сохраняет PlayKids</h3><p>Имя, возраст и аватар ребёнка, если вы создаёте профиль, а также настройки звука и достижения в математике. Эти данные хранятся локально в вашем браузере и не отправляются на сервер аккаунтов.</p></section><section><h3>Что важно помнить</h3><p>Профиль на этом сайте не является облачным аккаунтом. На другом устройстве или после очистки данных браузера сохранения будут недоступны. Электронную почту, пароль и платёжные данные мы не запрашиваем.</p></section><section><h3>Как удалить данные</h3><p>Выйдите из профиля, чтобы удалить сохранённые имя и возраст. Чтобы удалить также настройки и игровой прогресс, очистите данные этого сайта в настройках браузера.</p></section><section><h3>Фотографии и озвучка</h3><p>Изображения и записанная озвучка загружаются вместе с сайтом. Для озвучивания заданий не требуется запись голоса ребёнка или доступ к микрофону. Рекламных и аналитических трекеров на этой странице нет.</p></section></div>
      </SiteDialog>}
    </div>
  );
}