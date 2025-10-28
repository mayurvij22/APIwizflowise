
import React from "react";
import Home from "./pages/Home";

function App() {
  return (
    // Root app shell; add "dark" here if using class-based dark mode
    <div className="min-h-dvh bg-white text-slate-900 dark:bg-slate-950 dark:text-slate-100 antialiased">
      {/* Optional: global app header could go here */}
      <main id="main-content" role="main" className="isolate">
        {/* Let Home control its own max-width/container */}
        <Home />
      </main>
      {/* Optional: global footer could go here */}
    </div>
  );
}

export default App;
