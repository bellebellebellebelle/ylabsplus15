import { useEffect, useState } from 'react';
import { Link } from '@tanstack/react-router';
import { AudioLines, ReceiptEuro, Bot, Send, Globe, Search, Plus, Lightbulb, Settings, Sparkles, ExternalLink, Workflow, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useServerFn } from '@tanstack/react-start';
import { runWebSearch } from '@/lib/web-search.functions';
import { Button } from '@/components/ui/button';
import { LiveFeed, AgentsLive } from '@/components/lab/LiveFeed';

type Activity = { kind: string; app_key: string | null; seconds_saved: number; created_at: string };
type Auto = { id: string; name: string; status: 'draft' | 'active' | 'paused' };
type Weather = { temp: number; max: number; min: number; code: number; place: string; sunrise: string; sunset: string };

/** Ask the parent Aura (lab is embedded in Aura) or open the standalone Aura window. */
export function askAura(text?: string) {
  if (window.self !== window.top) window.parent.postMessage(text ? { type: 'aura-ask', text } : { type: 'aura-talk' }, window.location.origin);
  else window.dispatchEvent(new Event('aura-talk'));
}

const weatherLabel = (c: number) => c === 0 ? 'Ensoleillé' : c < 3 ? 'Éclaircies' : c < 4 ? 'Nuageux' : c < 50 ? 'Brumeux' : c < 70 ? 'Pluie' : c < 80 ? 'Neige' : 'Orageux';
const weatherIcon = (c: number) => c === 0 ? '☀️' : c < 3 ? '⛅' : c < 50 ? '☁️' : c < 70 ? '🌧️' : c < 80 ? '❄️' : '⛈️';

function useWeather() {
  const [w, setW] = useState<Weather | null>(null);
  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(async ({ coords }) => {
      try {
        const [m, g] = await Promise.all([
          fetch(`https://api.open-meteo.com/v1/forecast?latitude=${coords.latitude}&longitude=${coords.longitude}&current=temperature_2m,weather_code&daily=temperature_2m_max,temperature_2m_min,sunrise,sunset&timezone=auto&forecast_days=1`).then(r => r.json()),
          fetch(`https://geocoding-api.open-meteo.com/v1/reverse?latitude=${coords.latitude}&longitude=${coords.longitude}&language=fr`).then(r => r.json()).catch(() => null),
        ]);
        const t = (s: string) => s?.slice(11, 16) ?? '';
        setW({ temp: Math.round(m.current.temperature_2m), code: m.current.weather_code, max: Math.round(m.daily.temperature_2m_max[0]), min: Math.round(m.daily.temperature_2m_min[0]), sunrise: t(m.daily.sunrise[0]), sunset: t(m.daily.sunset[0]), place: g?.results?.[0]?.name ?? 'Votre position' });
      } catch { /* Weather stays hidden when unavailable. */ }
    }, () => undefined, { timeout: 8000, maximumAge: 1_800_000 });
  }, []);
  return w;
}


export function Cockpit({ activity, ideasCount }: { activity: Activity[]; ideasCount: number }) {
  const [now, setNow] = useState<Date | null>(null);
  const [question, setQuestion] = useState('');
  const [search, setSearch] = useState('');
  const webSearch = useServerFn(runWebSearch);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [webResult, setWebResult] = useState<{ answer: string; sources: { title: string; url: string; snippet: string }[] } | null>(null);
  async function searchWeb(query: string) {
    const text = query.trim();
    if (text.length < 2 || searching) return;
    setSearch(text); setSearching(true); setSearchError(''); setWebResult(null);
    try { setWebResult(await webSearch({ data: { query: text } })); }
    catch (e) { setSearchError(e instanceof Error ? e.message : 'Recherche indisponible. Réessayez.'); }
    finally { setSearching(false); }
  }
  const weather = useWeather();
  useEffect(() => { setNow(new Date()); const id = setInterval(() => setNow(new Date()), 30_000); return () => clearInterval(id); }, []);


  const [autos, setAutos] = useState<Auto[]>([]);
  const [teams, setTeams] = useState<{ id: string; name: string; department: string }[]>([]);
  const [agents, setAgents] = useState<{ id: string; name: string; role: string; team_id: string | null; department: string; is_chief: boolean; status: string }[]>([]);
  useEffect(() => {
    void supabase.from('mm_automations').select('id,name,status').order('created_at', { ascending: false }).then(({ data }) => setAutos((data ?? []) as Auto[]));
    void supabase.from('st_teams').select('id,name,department').order('created_at').then(({ data }) => setTeams(data ?? []));
    void supabase.from('st_agents').select('id,name,role,team_id,department,is_chief,status').order('created_at').then(({ data }) => setAgents(data ?? []));
  }, []);
  const toggleAuto = async (a: Auto) => {
    const next = a.status === 'active' ? 'paused' : 'active';
    setAutos(l => l.map(x => x.id === a.id ? { ...x, status: next } : x));
    const { error } = await supabase.from('mm_automations').update({ status: next }).eq('id', a.id);
    if (error) setAutos(l => l.map(x => x.id === a.id ? { ...x, status: a.status } : x));
  };
  const track = (key: string) => { void supabase.from('lab_activity').insert({ kind: 'app_open', app_key: key }); };
  const send = (e: React.FormEvent, text: string, reset: () => void) => { e.preventDefault(); if (!text.trim()) return; askAura(text.trim()); reset(); };
  const month = now ? new Date(now.getFullYear(), now.getMonth(), 1) : null;
  const offset = month ? (month.getDay() + 6) % 7 : 0;
  const monthDays = month ? new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate() : 0;

  return <div className="cockpit">
    <LiveFeed />

    <div className="ck-top">
      <div className="ck-card ck-weather">{weather ? <><span className="ck-wicon">{weatherIcon(weather.code)}</span><div><strong>{weather.temp}°</strong><small>{weatherLabel(weather.code)}</small><small>📍 {weather.place}</small></div><div className="ck-mini"><span>↑ {weather.max}°</span><span>↓ {weather.min}°</span></div></> : <small>Autorisez la position pour voir la météo locale.</small>}</div>
      <div className="ck-card ck-date">{now && <><div><small className="ck-accent">{now.toLocaleDateString('fr-FR', { weekday: 'long' })}</small><strong>{now.getDate()}</strong><small>{now.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}</small></div><div className="ck-cal">{['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((d, i) => <b key={i}>{d}</b>)}{Array.from({ length: offset }, (_, i) => <span key={`e${i}`} />)}{Array.from({ length: monthDays }, (_, i) => <span key={i} className={i + 1 === now.getDate() ? 'today' : ''}>{i + 1}</span>)}</div></>}</div>
      <div className="ck-card ck-clock">{now && <><small className="ck-tz">{Intl.DateTimeFormat().resolvedOptions().timeZone.split('/').pop()?.replace('_', ' ')}</small><strong>{now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</strong>{weather && <small>☀ {weather.sunrise} · ☾ {weather.sunset}</small>}</>}</div>
      <button className="ck-card ck-spark" onClick={() => askAura()} aria-label="Parler à Aura"><Sparkles /></button>
    </div>

    <AgentsLive />

    <section className="ck-card ck-web">
      <header><h3><Globe size={15} />Recherche web</h3><span className="ck-pill">GPT-6 Sol</span></header>
      <form className="ck-search" onSubmit={e => { e.preventDefault(); void searchWeb(search); }}>
        <Search size={14} />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher sur le web…" aria-label="Recherche web" />
        <Button type="submit" size="sm" variant="ghost" disabled={searching} aria-label="Lancer la recherche"><Send size={14} /></Button>
      </form>
      {searching && <p className="ck-answer"><small><Sparkles size={11} />GPT-6 Sol recherche…</small></p>}
      {searchError && <p className="ck-answer"><small>{searchError}</small></p>}
      {webResult && <>
        <div className="ck-answer"><small><Sparkles size={11} />Synthèse GPT-6 Sol</small><p style={{ whiteSpace: 'pre-wrap' }}>{webResult.answer}</p></div>
        {webResult.sources.map((s, i) => <a key={s.url} href={s.url} target="_blank" rel="noreferrer" className="ck-result"><span className="ck-fav">{i + 1}</span><span><b>{s.title}</b><small>{new URL(s.url).hostname}</small></span><ExternalLink size={12} /></a>)}
      </>}
    </section>

    <section className="ck-card ck-list">
      <header><h3>Applications</h3><Link to="/apps">Toutes les apps</Link></header>
      <div className="ck-apps">
        <Link to="/memotrack" onClick={() => track('memotrack')} className="ck-app tone-cyan"><AudioLines /><span><b>MemoTrack</b><small>Mémos de réunion</small><em>● Actif</em></span></Link>
        <Link to="/mm/cockpit" onClick={() => track('mymackenzy')} className="ck-app tone-violet"><Workflow /><span><b>MyMackenzy</b><small>Automatisations</small><em>● Actif</em></span></Link>
        <Link to="/smartteams" onClick={() => track('smartteams')} className="ck-app tone-green"><Users /><span><b>Smart Teams</b><small>Équipes d’agents IA</small><em>● Actif</em></span></Link>
      </div>
      <Link to="/ideas" className="ck-add"><Plus size={13} />Ajouter une idée d’application</Link>
    </section>

    <section className="ck-card ck-list">
      <header><h3>Automatisations</h3><Link to="/angelo/tableau-de-bord">Tout voir</Link></header>
      <Link to="/angelo/tableau-de-bord" onClick={() => track('angelo')} className="ck-row"><ReceiptEuro /><span><b>ANGELO · Facture impayée → Relance</b><em>● Relances automatiques Odoo</em></span><span className="ck-toggle on" /></Link>
      {autos.map(a => <div key={a.id} className="ck-row"><Workflow /><Link to="/mm/automations/$id" params={{ id: a.id }} style={{ flex: 1, minWidth: 0 }}><b>{a.name}</b><em>● {a.status === 'active' ? 'Active' : a.status === 'paused' ? 'En pause' : 'Brouillon'} · MyMackenzy</em></Link><button type="button" role="switch" aria-checked={a.status === 'active'} aria-label={`Activer ${a.name}`} onClick={() => toggleAuto(a)} className={`ck-toggle${a.status === 'active' ? ' on' : ''}`} style={{ border: 0, cursor: 'pointer' }} /></div>)}
      <Link to="/angelo/parametres" className="ck-add"><Settings size={13} />Régler les relances</Link>
    </section>

    <section className="ck-card ck-list">
      <header><h3>Équipe virtuelle</h3><Link to="/smartteams">Gérer</Link></header>
      <Link to="/ocktavus" onClick={() => track('ocktavus')} className="ck-row"><span className="ck-avatar"><Bot size={16} /></span><span><b>Ocktavus — Agent Google</b><small>Gmail, Agenda, Drive, Docs…</small></span><em className="ck-online">● En ligne</em></Link>
      {agents.map(a => { const t = teams.find(x => x.id === a.team_id); return <Link key={a.id} to="/smartteams" onClick={() => track('smartteams')} className="ck-row"><span className="ck-avatar"><Users size={15} /></span><span><b>{a.name}{a.is_chief ? ' · Chef' : ''}</b><small>{a.role} — Équipe {t?.name ?? '—'} · {t?.department ?? a.department}</small></span><em className="ck-online">● {a.status === 'working' ? 'Au travail' : 'Prêt'}</em></Link>; })}
    </section>

    <section className="ck-card ck-quick">
      <h3>Actions rapides</h3>
      <div>
        <Link to="/memotrack" onClick={() => track('memotrack')} className="ck-q tone-pink"><AudioLines /><span><b>Nouveau mémo</b><small>MemoTrack</small></span></Link>
        <Link to="/angelo/factures" onClick={() => track('angelo')} className="ck-q tone-violet"><ReceiptEuro /><span><b>Voir les factures</b><small>ANGELO</small></span></Link>
        <Link to="/ocktavus/agent" onClick={() => track('ocktavus')} className="ck-q tone-blue"><Bot /><span><b>Parler à Ocktavus</b><small>Agent Google</small></span></Link>
        <Link to="/ideas" className="ck-q tone-amber"><Lightbulb /><span><b>Mes idées</b><small>{ideasCount} enregistrée{ideasCount > 1 ? 's' : ''}</small></span></Link>
        <Link to="/settings" search={{ tab: undefined }} className="ck-q tone-green"><Settings /><span><b>Paramètres</b><small>Connexions</small></span></Link>
      </div>
    </section>
  </div>;
}
