import { useState, useEffect } from 'react';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const [customers, setCustomers] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [matches, setMatches] = useState([]);
  const [loadingMatches, setLoadingMatches] = useState(false);
  const [aiEmails, setAiEmails] = useState({}); 
  const [loadingAi, setLoadingAi] = useState(null);

  useEffect(() => {
    fetch('http://localhost:5000/api/customers')
      .then(res => res.json())
      .then(data => setCustomers(data))
      .catch(err => console.error("Error fetching customers:", err));
  }, []);

  const handleLogin = (e) => {
    e.preventDefault();
    if (username === 'admin' && password === 'admin') {
      setIsAuthenticated(true);
    } else {
      alert("Invalid credentials. Use admin / admin");
    }
  };

  const handleClientSelect = async (client) => {
    setSelectedClient(client);
    setLoadingMatches(true);
    setMatches([]);
    setAiEmails({});

    try {
      const res = await fetch(`http://localhost:5000/api/customers/${client.id}/matches`);
      const data = await res.json();
      setMatches(data);
    } catch (error) {
      console.error("Error fetching matches:", error);
    } finally {
      setLoadingMatches(false);
    }
  };

  const handleGenerateEmail = async (match) => {
    setLoadingAi(match.id);
    try {
      const res = await fetch('http://localhost:5000/api/generate-intro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ client: selectedClient, match: match })
      });
      
      if (!res.ok) throw new Error("Backend AI generation failed.");
      
      const data = await res.json();
      setAiEmails(prev => ({ ...prev, [match.id]: data }));
    } catch (error) {
      alert("AI Generation Failed. Check your Node terminal.");
      console.error(error);
    } finally {
      setLoadingAi(null);
    }
  };

  // --- VIEW 0: LOGIN SCREEN ---
  if (!isAuthenticated) {
    return (
      <div className="bg-[#141414] min-h-screen flex items-center justify-center font-sans px-4">
        <div className="bg-[#1c1c1c] p-10 rounded-2xl border border-[#cfa261]/20 w-full max-w-md text-center shadow-2xl">
          <div className="w-16 h-16 bg-[#cfa261] rounded-full mx-auto mb-6 flex items-center justify-center text-[#141414] font-serif font-bold text-2xl">
            tdc
          </div>
          <h1 className="text-4xl font-serif text-[#cfa261] mb-2 tracking-wide">The Date Crew</h1>
          <p className="text-gray-400 mb-8 font-light">Internal Matchmaker Portal</p>
          
          <form onSubmit={handleLogin} className="space-y-5">
            <input 
              type="text" 
              placeholder="Username" 
              className="w-full p-4 bg-[#141414] text-white border border-gray-700 rounded-lg focus:outline-none focus:border-[#cfa261] transition-colors"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
            <input 
              type="password" 
              placeholder="Password" 
              className="w-full p-4 bg-[#141414] text-white border border-gray-700 rounded-lg focus:outline-none focus:border-[#cfa261] transition-colors"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button 
              type="submit" 
              className="w-full bg-[#1b302b] text-white p-4 rounded-full font-medium hover:bg-[#152521] transition-all duration-300 flex items-center justify-center gap-2 border border-[#1b302b] hover:border-[#cfa261]/50"
            >
              Sign In ↗
            </button>
          </form>
        </div>
      </div>
    );
  }

  // --- VIEW 1: DETAILED WORKSPACE ---
  if (selectedClient) {
    return (
      <div className="bg-[#f2eee8] min-h-screen p-6 md:p-12 font-sans text-gray-900 selection:bg-[#cfa261]/30">
        <div className="max-w-7xl mx-auto">
          <button 
            onClick={() => setSelectedClient(null)}
            className="mb-8 text-[#1b302b] font-medium hover:text-[#cfa261] transition-colors flex items-center gap-2 group"
          >
            <span className="group-hover:-translate-x-1 transition-transform">←</span> Back to Directory
          </button>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* LEFT COLUMN: Client Profile */}
            <div className="lg:col-span-4 lg:sticky lg:top-8 h-fit">
              <div className="bg-[#141414] p-8 rounded-3xl shadow-xl border border-gray-800 text-white">
                <div className="inline-block px-3 py-1 bg-[#1b302b] text-[#cfa261] rounded-full text-xs font-bold mb-6 tracking-widest uppercase">
                  Active Client
                </div>
                <h2 className="text-4xl font-serif text-[#cfa261] mb-2 tracking-tight">
                  {selectedClient.firstName} {selectedClient.lastName}
                </h2>
                <p className="text-gray-400 mb-8 font-light">{selectedClient.age || 26} yrs • {selectedClient.city}</p>
                
                <div className="space-y-6">
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Profession</p>
                    <p className="font-medium text-gray-200 text-lg">{selectedClient.designation}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Income</p>
                    <p className="font-medium text-gray-200 text-lg">₹{selectedClient.income ? selectedClient.income.toLocaleString() : 'N/A'}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Faith</p>
                      <p className="font-medium text-gray-200">{selectedClient.religion}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Kids</p>
                      <p className="font-medium text-gray-200">{selectedClient.wantKids}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: Matches */}
            <div className="lg:col-span-8">
              <div className="flex items-center justify-between mb-8 border-b border-gray-300 pb-4">
                <h3 className="text-3xl font-serif text-[#141414] tracking-tight">
                  Premium AI Matches
                </h3>
              </div>

              {loadingMatches ? (
                <div className="bg-white p-12 rounded-2xl shadow-sm border border-gray-200 text-center animate-pulse">
                  <p className="text-[#cfa261] font-serif text-xl mb-2">Analyzing Matrix...</p>
                  <p className="text-gray-500 font-light">Cross-referencing designations and parameters.</p>
                </div>
              ) : (
                <div className="space-y-5">
                  {matches.map((match) => (
                    <div key={match.id} className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-gray-200 hover:border-[#cfa261] transition-all duration-300">
                      <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4 mb-6">
                        <div>
                          <h4 className="text-2xl font-serif text-[#141414]">{match.firstName} {match.lastName}</h4>
                          <p className="text-sm font-light text-gray-500 mt-1">{match.age || 25} yrs • {match.city} • {match.designation}</p>
                        </div>
                        <span className="bg-[#1b302b] text-[#cfa261] font-serif italic px-4 py-1.5 rounded-full text-sm">
                          {match.matchScore}% Alignment
                        </span>
                      </div>

                      {!aiEmails[match.id] ? (
                        <button 
                          onClick={() => handleGenerateEmail(match)}
                          disabled={loadingAi === match.id}
                          className="bg-[#1b302b] hover:bg-[#152521] text-white font-medium py-3 px-6 rounded-full transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 w-full md:w-auto"
                        >
                          {loadingAi === match.id ? "Drafting Insight..." : "✨ Generate AI Insight ↗"}
                        </button>
                      ) : (
                        <div className="mt-6 bg-[#1c1c1c] rounded-2xl border border-[#cfa261]/20 overflow-hidden text-white">
                          <div className="bg-[#141414] px-6 py-4 border-b border-gray-800 flex justify-between items-center">
                            <p className="text-xs font-bold text-[#cfa261] uppercase tracking-widest">Matchmaker Analysis</p>
                            <span className="text-xs text-gray-500">Groq NLP</span>
                          </div>
                          <div className="p-6">
                            <p className="text-gray-300 font-light italic mb-6 text-lg leading-relaxed text-[#cfa261]">"{aiEmails[match.id].explanation}"</p>
                            
                            <div className="bg-[#141414] p-5 rounded-xl border border-gray-800 relative">
                              <span className="absolute -top-3 left-4 bg-[#141414] px-2 text-xs font-bold text-gray-500 uppercase tracking-widest">Email Draft</span>
                              <p className="text-sm text-gray-300 whitespace-pre-wrap leading-relaxed mt-2 font-light">{aiEmails[match.id].emailDraft}</p>
                            </div>
                            
                            <button className="mt-6 w-full bg-[#cfa261] hover:bg-[#b58c53] text-[#141414] font-bold py-3 rounded-full transition-colors flex items-center justify-center gap-2">
                              Send to Client
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- VIEW 2: DASHBOARD ---
  return (
    <div className="bg-[#f2eee8] min-h-screen p-6 md:p-12 font-sans">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-4 border-b border-gray-300 pb-6">
          <div>
            <h1 className="text-5xl font-serif text-[#141414] tracking-tight mb-2">TDC <span className="italic text-[#cfa261]">Matchmaker</span></h1>
            <p className="text-gray-600 font-light">Select a premium client to initiate the search algorithm.</p>
          </div>
          <div className="flex items-center gap-6">
            <button 
              onClick={() => setIsAuthenticated(false)}
              className="text-gray-500 hover:text-[#141414] font-medium transition-colors uppercase tracking-widest text-sm"
            >
              Sign Out
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {customers.map(customer => (
            <div 
              key={customer.id} 
              onClick={() => handleClientSelect(customer)}
              className="bg-white p-8 rounded-3xl border border-gray-200 shadow-sm cursor-pointer hover:shadow-xl hover:border-[#cfa261] transition-all duration-300 group flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-start mb-6">
                  <div className="w-12 h-12 bg-[#f2eee8] text-[#141414] rounded-full flex items-center justify-center font-serif text-xl group-hover:bg-[#1b302b] group-hover:text-[#cfa261] transition-colors border border-gray-200">
                    {customer.firstName[0]}{customer.lastName[0]}
                  </div>
                  <span className="text-[#cfa261] text-xs font-bold uppercase tracking-widest">{customer.status}</span>
                </div>
                
                <h2 className="text-2xl font-serif text-[#141414] mb-1 group-hover:text-[#cfa261] transition-colors">
                  {customer.firstName} {customer.lastName}
                </h2>
                <p className="text-gray-500 font-light mb-6">{customer.age || 26} yrs • {customer.city}</p>
              </div>
              
              <div className="border-t border-gray-100 pt-5 flex justify-between items-center">
                <p className="text-sm font-medium text-gray-800 line-clamp-1">{customer.designation}</p>
                <span className="text-gray-400 group-hover:text-[#1b302b] transition-colors">↗</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default App;