import React, { useState, useRef, useEffect, useMemo } from "react";

const defaultSampleObject = {
  user: {
    id: 123,
    name: "Ada",
    roles: ["admin", "editor"],
    profile: { active: true, score: 98.6 },
  },
  items: [{ id: 1 }, { id: 2 }, { id: 3 }],
};

const prettyStringify = (obj) => {
  try {
    return JSON.stringify(obj, null, 2);
  } catch {
    return "";
  }
};

const parseMaybeJSON = (text) => {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
};

const InputPanel = ({ onVisualize }) => {
  const [value, setValue] = useState(prettyStringify(defaultSampleObject));
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef(null);

  const isJSONValid = useMemo(() => {
    if (!value.trim()) return false;
    try {
      JSON.parse(value);
      return true;
    } catch {
      return false;
    }
  }, [value]);

  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        if (isJSONValid) {
          onVisualize(value);
          setError("");
        } else {
          setError("Invalid JSON. Please fix syntax before visualizing.");
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [value, isJSONValid, onVisualize]);

  const handleVisualizeClick = () => {
    if (!isJSONValid) {
      setError("Invalid JSON. Please fix syntax before visualizing.");
      return;
    }
    onVisualize(value);
    setError("");
  };

  const handleFile = async (file) => {
    if (!file) return;
    const text = await file.text();
    const parsed = parseMaybeJSON(text);
    if (parsed === null) {
      setValue(text);
      setError("Uploaded file is not valid JSON.");
      return;
    }
    const pretty = prettyStringify(parsed);
    setValue(pretty);
    setError("");
    onVisualize(pretty);
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      // no-op
    }
  };

  return (
    <div className="space-y-3">
      <textarea
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          if (error) setError("");
        }}
        rows={14}
        spellCheck={false}
        className={[
          "w-full rounded-xl border bg-white/70 dark:bg-slate-900/60 backdrop-blur-md",
          "px-4 py-3 text-sm text-slate-800 dark:text-slate-100",
          "focus:outline-none focus:ring-2 focus:ring-indigo-500",
          "border-white/40 dark:border-white/10",
          "font-mono leading-6 resize-y whitespace-pre",
        ].join(" ")}
        placeholder='{ "key": "value" }'
        aria-label="JSON input"
      />

      {error ? (
        <div className="text-xs text-rose-600 dark:text-rose-400">{error}</div>
      ) : (
        <div className="text-xs text-slate-500 dark:text-slate-400">
          Tip: Press Ctrl/Cmd+Enter to visualize.
        </div>
      )}

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleVisualizeClick}
          disabled={!isJSONValid}
          title={isJSONValid ? "Visualize (Ctrl/Cmd+Enter)" : "Fix JSON syntax to enable"}
          className={[
            "inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500",
            isJSONValid
              ? "bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white"
              : "bg-slate-300 text-slate-600 cursor-not-allowed dark:bg-slate-700 dark:text-slate-400",
          ].join(" ")}
          aria-label="Visualize JSON"
        >
          Visualize
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept=".json,.txt,application/json,text/plain"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="inline-flex items-center gap-2 rounded-lg bg-slate-200 hover:bg-slate-300 active:bg-slate-400 text-slate-800 px-3 py-2 text-sm dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-100"
          aria-label="Upload JSON file"
          title="Upload .json or .txt"
        >
          Upload JSON
        </button>

        <button
          type="button"
          onClick={() => {
            const parsed = parseMaybeJSON(value);
            if (!parsed) {
              setError("Cannot format: current content is not valid JSON.");
              return;
            }
            const pretty = prettyStringify(parsed);
            setValue(pretty);
            setError("");
          }}
          className="inline-flex items-center gap-2 rounded-lg bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 px-3 py-2 text-sm dark:bg-slate-800/70 dark:hover:bg-slate-700 dark:text-slate-100"
          aria-label="Format JSON"
          title="Prettify JSON"
        >
          Format
        </button>

        <button
          type="button"
          onClick={copyToClipboard}
          className="inline-flex items-center gap-2 rounded-lg bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 px-3 py-2 text-sm dark:bg-slate-800/70 dark:hover:bg-slate-700 dark:text-slate-100"
          aria-label="Copy JSON"
          title="Copy to clipboard"
        >
          {copied ? "Copied" : "Copy"}
        </button>

        <button
          type="button"
          onClick={() => {
            setValue(prettyStringify(defaultSampleObject));
            setError("");
          }}
          className="inline-flex items-center gap-2 rounded-lg bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 px-3 py-2 text-sm dark:bg-slate-800/70 dark:hover:bg-slate-700 dark:text-slate-100"
          aria-label="Reset to sample"
          title="Reset to sample JSON"
        >
          Reset
        </button>
      </div>
    </div>
  );
};

export default InputPanel;
