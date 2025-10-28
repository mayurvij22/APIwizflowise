import React, { useState, useEffect, useRef, useCallback } from "react";
import InputPanel from "../components/InputPanel";
import SearchBar from "../components/SearchBar";
import TreeCanvas from "../components/TreeCanvas";

const Home = () => {
  const [jsonData, setJsonData] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(420); // px
  const dragRef = useRef(null);
  const statusRef = useRef(null);

  const setStatus = useCallback((msg) => {
    if (statusRef.current) statusRef.current.textContent = msg;
  }, []);

  const handleVisualize = useCallback(
    (data) => {
      setJsonData(data);
      setStatus("Visualized JSON.");
    },
    [setStatus]
  );

  // Global shortcut: Cmd/Ctrl + Enter to visualize
  useEffect(() => {
    const handler = (e) => {
      const isCmdOrCtrl = e.metaKey || e.ctrlKey;
      if (isCmdOrCtrl && e.key === "Enter") {
        if (jsonData && String(jsonData).trim().length > 0) {
          handleVisualize(jsonData);
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [jsonData, handleVisualize]);

  // Sidebar drag to resize
  useEffect(() => {
    const onMove = (e) => {
      if (!dragRef.current) return;
      const x = e.touches ? e.touches[0].clientX : e.clientX;
      const min = 320;
      const max = Math.min(window.innerWidth - 420, 680);
      setSidebarWidth(Math.max(min, Math.min(max, x - dragRef.current.getBoundingClientRect().left)));
    };
    const stop = () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", stop);
      document.removeEventListener("touchmove", onMove);
      document.removeEventListener("touchend", stop);
    };
    const start = (e) => {
      e.preventDefault();
      document.addEventListener("mousemove", onMove);
      document.addEventListener("mouseup", stop);
      document.addEventListener("touchmove", onMove, { passive: false });
      document.addEventListener("touchend", stop);
    };
    const bar = document.getElementById("divider-bar");
    if (bar) {
      bar.addEventListener("mousedown", start);
      bar.addEventListener("touchstart", start, { passive: false });
    }
    return () => {
      if (bar) {
        bar.removeEventListener("mousedown", start);
        bar.removeEventListener("touchstart", start);
      }
      stop();
    };
  }, []);

  return (
    <div className="min-h-dvh flex flex-col bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-slate-900 dark:via-slate-950 dark:to-indigo-950">
      <div ref={statusRef} role="status" aria-live="polite" aria-atomic="true" className="sr-only" />

      {/* Top bar */}
      <header className="sticky top-0 z-30 border-b border-white/30 dark:border-white/10 backdrop-blur-md bg-white/40 dark:bg-slate-900/40 supports-[backdrop-filter]:bg-white/30">
        <div className="mx-auto max-w-7xl px-4 py-3 flex items-center gap-3">
          <h1 className="text-lg sm:text-xl font-semibold tracking-tight text-indigo-700 dark:text-indigo-300">
            🌳 JSON Tree Visualizer
          </h1>
          <div className="ml-auto w-60 sm:w-80">
            <SearchBar onSearch={setSearchTerm} />
          </div>
          <button
            type="button"
            onClick={() => setIsFullscreen((v) => !v)}
            className="ml-2 inline-flex items-center gap-1.5 rounded-md bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 px-2.5 py-1.5 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            title="Toggle full screen canvas"
          >
            {isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
          </button>
        </div>
      </header>

      {/* Split shell */}
      <div className="flex-1 mx-auto w-full max-w-7xl px-4 py-4">
        <div className="flex h-[calc(100dvh-9.5rem)] rounded-2xl overflow-hidden border border-white/40 dark:border-white/10 bg-white/55 dark:bg-slate-900/55 backdrop-blur-xl shadow-lg shadow-indigo-200/40 dark:shadow-black/30">
          {/* Left pane */}
          <aside
            className="hidden md:flex flex-col p-4 gap-4 overflow-auto"
            style={{ width: sidebarWidth }}
          >
            <div className="rounded-xl border border-white/40 dark:border-white/10 bg-white/70 dark:bg-slate-900/60 shadow-sm">
              <div className="p-4 border-b border-white/40 dark:border-white/10">
                <h2 id="input-json-heading" className="text-sm font-medium text-slate-800 dark:text-slate-100">
                  Input JSON
                </h2>
                <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                  Paste or upload, then visualize the structure.
                </p>
              </div>
              <div className="p-4">
                <InputPanel onVisualize={handleVisualize} />
                <div className="mt-3 flex items-center justify-between">
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    Tip: Ctrl/Cmd+Enter to visualize.
                  </div>
                  <button
                    onClick={() => handleVisualize(jsonData)}
                    className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white px-3 py-1.5 text-xs transition-colors shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                    type="button"
                  >
                    Visualize
                  </button>
                </div>
              </div>
            </div>

            <details className="rounded-xl border border-white/40 dark:border-white/10 bg-white/60 dark:bg-slate-900/50 shadow-sm">
              <summary className="cursor-pointer select-none p-3 text-sm text-slate-800 dark:text-slate-100">
                JSON tips
              </summary>
              <ul className="p-3 pt-0 text-sm text-slate-600 dark:text-slate-400 space-y-1.5 list-disc pl-5">
                <li>Ensure valid JSON: keys in quotes, no trailing commas.</li>
                <li>Large JSONs render better on wider screens.</li>
                <li>Use the search bar to highlight keys/values.</li>
              </ul>
            </details>
          </aside>

          {/* Divider */}
          <div
            id="divider-bar"
            ref={dragRef}
            className="hidden md:block w-2 cursor-col-resize bg-gradient-to-b from-transparent via-slate-300/50 to-transparent dark:via-slate-700/50"
            aria-hidden="true"
          />

          {/* Right pane */}
          <section className="flex-1 flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/40 dark:border-white/10">
              <h2 className="text-sm sm:text-base font-medium text-slate-800 dark:text-slate-100">
                Visualization
              </h2>
              <div className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400">
                Pan: drag • Zoom: scroll • Reset: double‑click
              </div>
            </div>

            <div className="p-2 sm:p-3 md:p-4 flex-1">
              <div
                className="h-full w-full rounded-xl bg-gradient-to-b from-white/60 to-white/30 dark:from-slate-800/40 dark:to-slate-800/20 border border-white/40 dark:border-white/10 overflow-hidden"
                style={{ minHeight: "calc(100dvh - 13rem)" }}
              >
                <TreeCanvas jsonData={jsonData} searchTerm={searchTerm} fullscreen={isFullscreen} />
              </div>
            </div>
          </section>
        </div>

        {/* Mobile input below canvas */}
        <div className="md:hidden mt-6 rounded-2xl border border-white/40 dark:border-white/10 bg-white/65 dark:bg-slate-900/55 backdrop-blur-xl shadow-lg">
          <div className="p-4 border-b border-white/40 dark:border-white/10">
            <h2 className="text-sm font-medium text-slate-800 dark:text-slate-100">Input JSON</h2>
          </div>
          <div className="p-4">
            <InputPanel onVisualize={handleVisualize} />
            <div className="mt-3 flex items-center justify-between">
              <div className="text-[11px] text-slate-500 dark:text-slate-400">Tip: Ctrl/Cmd+Enter</div>
              <button
                onClick={() => handleVisualize(jsonData)}
                className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white px-3 py-1.5 text-xs transition-colors shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                type="button"
              >
                Visualize
              </button>
            </div>
          </div>
        </div>
      </div>

      <footer className="mx-auto max-w-7xl px-4 py-6 text-center text-xs text-slate-500 dark:text-slate-400">
        Built with React and Tailwind CSS • Frosted glass UI with subtle blur and soft borders.
      </footer>
    </div>
  );
};

export default Home;
