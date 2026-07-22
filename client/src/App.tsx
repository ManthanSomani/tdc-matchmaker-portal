import { useEffect, useState } from 'react';
import { generateIntro, getCustomers, getMatches, hasToken, login, logout } from './api';
import type { AiDraft, Customer, Gender, MatchPreferences, PageMeta } from './types';

const defaultPreferences: MatchPreferences = {
  preferredGenders: [],
  weights: { career: 0.35, lifestyle: 0.3, location: 0.2, language: 0.15 },
};

function ErrorBanner({ message }: { message: string }) {
  return <div role="alert" className="mb-6 rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800">{message}</div>;
}

function Login({ onSuccess }: { onSuccess: () => void }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async (event: React.FormEvent) => {
    event.preventDefault(); setBusy(true); setError('');
    try { await login(username, password); onSuccess(); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Sign-in failed.'); }
    finally { setBusy(false); }
  };

  return (
    <main className="min-h-screen bg-[#141414] px-4 flex items-center justify-center">
      <section className="w-full max-w-md rounded-3xl border border-[#cfa261]/30 bg-[#1c1c1c] p-10 text-center shadow-2xl">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-[#cfa261] text-2xl font-bold text-[#141414]">tdc</div>
        <h1 className="mb-2 font-serif text-4xl text-[#cfa261]">The Date Crew</h1>
        <p className="mb-8 text-gray-400">Secure matchmaker workspace · synthetic demo data</p>
        {error && <ErrorBanner message={error} />}
        <form onSubmit={submit} className="space-y-4">
          <label className="sr-only" htmlFor="username">Username</label>
          <input id="username" autoComplete="username" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Username" className="w-full rounded-xl border border-gray-700 bg-[#141414] p-4 text-white" />
          <label className="sr-only" htmlFor="password">Password</label>
          <input id="password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" className="w-full rounded-xl border border-gray-700 bg-[#141414] p-4 text-white" />
          <button disabled={busy} className="w-full rounded-full bg-[#1b302b] p-4 font-medium text-white disabled:opacity-50">{busy ? 'Signing in…' : 'Sign in securely'}</button>
        </form>
      </section>
    </main>
  );
}

function Preferences({ value, onChange }: { value: MatchPreferences; onChange: (next: MatchPreferences) => void }) {
  const toggleGender = (gender: Gender) => {
    const preferredGenders = value.preferredGenders.includes(gender)
      ? value.preferredGenders.filter((item) => item !== gender)
      : [...value.preferredGenders, gender];
    onChange({ ...value, preferredGenders });
  };
  return (
    <section className="mb-6 rounded-2xl border border-gray-200 bg-white p-5">
      <h3 className="font-serif text-xl">Consent-based matching preferences</h3>
      <p className="mb-4 text-xs text-gray-500">No religion, caste, income, age, or gender stereotypes affect the score.</p>
      <div className="flex flex-wrap gap-2">
        {(['Male', 'Female', 'Non-binary'] as Gender[]).map((gender) => (
          <button key={gender} onClick={() => toggleGender(gender)} className={`rounded-full border px-4 py-2 text-xs ${value.preferredGenders.includes(gender) ? 'border-[#1b302b] bg-[#1b302b] text-white' : 'border-gray-300'}`}>{gender}</button>
        ))}
        <button onClick={() => onChange({ ...value, preferredGenders: [] })} className="rounded-full border border-gray-300 px-4 py-2 text-xs">Any gender</button>
      </div>
    </section>
  );
}

export default function App() {
  const [authenticated, setAuthenticated] = useState(hasToken());
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [meta, setMeta] = useState<PageMeta>({ page: 1, limit: 12, total: 0, totalPages: 1 });
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Customer | null>(null);
  const [matches, setMatches] = useState<Customer[]>([]);
  const [preferences, setPreferences] = useState(defaultPreferences);
  const [drafts, setDrafts] = useState<Record<number, AiDraft>>({});
  const [busy, setBusy] = useState(false);
  const [loadingDraft, setLoadingDraft] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [scoringSource, setScoringSource] = useState('');

  useEffect(() => {
    if (!authenticated || selected) return;
    setBusy(true); setError('');
    const timer = window.setTimeout(() => {
      getCustomers(page, search).then(({ data, meta: nextMeta }) => { setCustomers(data); setMeta(nextMeta); })
        .catch((cause) => setError(cause instanceof Error ? cause.message : 'Could not load clients.'))
        .finally(() => setBusy(false));
    }, 250);
    return () => window.clearTimeout(timer);
  }, [authenticated, page, search, selected]);

  const selectClient = async (client: Customer) => {
    setSelected(client); setBusy(true); setMatches([]); setDrafts({}); setError('');
    try {
      const response = await getMatches(client.id, preferences);
      setMatches(response.data); setScoringSource(response.meta.scoringSource);
      if (response.meta.warning) setError(`AI similarity fallback active: ${response.meta.warning}`);
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not calculate matches.'); }
    finally { setBusy(false); }
  };

  const draftIntro = async (match: Customer) => {
    if (!selected) return;
    setLoadingDraft(match.id); setError('');
    try {
      const draft = await generateIntro(selected, match);
      setDrafts((current) => ({ ...current, [match.id]: draft }));
    }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not draft the introduction.'); }
    finally { setLoadingDraft(null); }
  };

  if (!authenticated) return <Login onSuccess={() => setAuthenticated(true)} />;

  if (selected) return (
    <main className="min-h-screen bg-[#f2eee8] p-6 md:p-12 text-gray-900">
      <div className="mx-auto max-w-7xl">
        <button onClick={() => { setSelected(null); setMatches([]); setError(''); }} className="mb-8 font-medium text-[#1b302b]">← Back to directory</button>
        {error && <ErrorBanner message={error} />}
        <div className="grid gap-8 lg:grid-cols-12">
          <aside className="h-fit rounded-3xl bg-[#141414] p-8 text-white lg:col-span-4 lg:sticky lg:top-8">
            <span className="rounded-full bg-[#1b302b] px-3 py-1 text-xs font-bold text-[#cfa261]">ACTIVE CLIENT</span>
            <h1 className="mt-6 font-serif text-4xl text-[#cfa261]">{selected.firstName} {selected.lastName}</h1>
            <p className="mt-2 text-gray-400">{selected.city} · {selected.designation}</p>
            <div className="mt-8"><Preferences value={preferences} onChange={setPreferences} /></div>
            <button onClick={() => void selectClient(selected)} className="mt-2 w-full rounded-full bg-[#cfa261] p-3 font-bold text-[#141414]">Recalculate matches</button>
          </aside>
          <section className="lg:col-span-8">
            <div className="mb-6 flex items-end justify-between border-b border-gray-300 pb-4"><div><h2 className="font-serif text-3xl">Explainable matches</h2><p className="text-xs text-gray-500">Career engine: {scoringSource || 'loading'}</p></div></div>
            {busy ? <p className="rounded-2xl bg-white p-10 text-center">Calculating alignment…</p> : (
              <div className="space-y-5">{matches.map((match) => (
                <article key={match.id} className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm md:p-8">
                  <div className="flex justify-between gap-4"><div><h3 className="font-serif text-2xl">{match.firstName} {match.lastName}</h3><p className="text-sm text-gray-500">{match.city} · {match.designation}</p></div><span className="h-fit rounded-full bg-[#1b302b] px-4 py-2 text-sm text-[#cfa261]">{match.matchScore}%</span></div>
                  <div className="mt-4 flex flex-wrap gap-2">{match.explanations?.map((item) => <span key={item} className="rounded-full bg-stone-100 px-3 py-1 text-xs">{item}</span>)}</div>
                  {!drafts[match.id] ? <button onClick={() => void draftIntro(match)} disabled={loadingDraft === match.id} className="mt-6 rounded-full bg-[#1b302b] px-6 py-3 text-white disabled:opacity-50">{loadingDraft === match.id ? 'Drafting…' : 'Generate opt-in introduction'}</button> : (
                    <div className="mt-6 rounded-2xl bg-[#141414] p-6 text-white"><p className="text-[#cfa261]">{drafts[match.id].explanation}</p><pre className="mt-4 whitespace-pre-wrap rounded-xl bg-black/30 p-4 text-sm">{drafts[match.id].emailDraft}</pre><a href={`mailto:${selected.email}?subject=${encodeURIComponent(`Potential introduction: ${match.firstName}`)}&body=${encodeURIComponent(drafts[match.id].emailDraft)}`} className="mt-4 inline-block rounded-full bg-[#cfa261] px-5 py-3 font-bold text-[#141414]">Open in email client</a></div>
                  )}
                </article>
              ))}</div>
            )}
          </section>
        </div>
      </div>
    </main>
  );

  return (
    <main className="min-h-screen bg-[#f2eee8] p-6 md:p-12">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 flex flex-col justify-between gap-4 border-b border-gray-300 pb-6 md:flex-row md:items-center"><div><h1 className="font-serif text-5xl">TDC <span className="italic text-[#cfa261]">Matchmaker</span></h1><p className="mt-2 text-gray-600">Consent-based, explainable matching on synthetic portfolio data.</p></div><button onClick={() => { logout(); setAuthenticated(false); }} className="text-sm font-medium uppercase">Sign out</button></header>
        {error && <ErrorBanner message={error} />}
        <label className="sr-only" htmlFor="search">Search clients</label><input id="search" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Search by name, city, or profession" className="mb-6 w-full rounded-2xl border border-gray-300 bg-white p-4" />
        {busy ? <p className="rounded-2xl bg-white p-10 text-center">Loading directory…</p> : <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">{customers.map((customer) => <button key={customer.id} onClick={() => void selectClient(customer)} className="rounded-3xl border border-gray-200 bg-white p-8 text-left shadow-sm transition hover:border-[#cfa261] hover:shadow-xl"><span className="text-xs font-bold uppercase tracking-wider text-[#cfa261]">{customer.status}</span><h2 className="mt-5 font-serif text-2xl">{customer.firstName} {customer.lastName}</h2><p className="mt-1 text-gray-500">{customer.city}</p><p className="mt-6 border-t pt-5 text-sm font-medium">{customer.designation}</p></button>)}</section>}
        <nav aria-label="Client pages" className="mt-8 flex items-center justify-center gap-4"><button disabled={page <= 1} onClick={() => setPage((value) => value - 1)} className="rounded-full border px-5 py-2 disabled:opacity-40">Previous</button><span className="text-sm">Page {meta.page} of {meta.totalPages} · {meta.total} clients</span><button disabled={page >= meta.totalPages} onClick={() => setPage((value) => value + 1)} className="rounded-full border px-5 py-2 disabled:opacity-40">Next</button></nav>
      </div>
    </main>
  );
}
