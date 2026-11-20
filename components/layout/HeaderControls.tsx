"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { FaBell, FaEnvelope, FaSearch } from "react-icons/fa";
import { getHeaderFeed, type HeaderFeed } from "@/lib/header-client";

function useFeed(kind: "search" | "alerts" | "messages", query = "", enabled = true) {
  const [revision, setRevision] = useState(0);
  const [state, setState] = useState<{ key: string; data?: HeaderFeed; error?: string }>();
  const key = JSON.stringify([kind, query, revision]);
  useEffect(() => {
    if (!enabled) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const data = await getHeaderFeed(kind, query, controller.signal);
        if (!controller.signal.aborted) setState({ key, data });
      } catch (error) {
        if (!controller.signal.aborted) setState({ key, error: error instanceof Error ? error.message : "Unable to load" });
      }
    }, kind === "search" ? 300 : 0);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [kind, query, key, enabled]);
  useEffect(() => {
    if (kind === "search") return;
    const refresh = () => setRevision(value => value + 1);
    const timer = setInterval(refresh, 60000);
    window.addEventListener("focus", refresh);
    return () => { clearInterval(timer); window.removeEventListener("focus", refresh); };
  }, [kind]);
  return {
    data: state?.key === key ? state.data : undefined,
    error: state?.key === key ? state.error : undefined,
    retry: () => setRevision(value => value + 1),
  };
}

function useDropdown() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const outside = (event: MouseEvent) => {
      if (!ref.current?.contains(event.target as Node)) setOpen(false);
    };
    const escape = (event: KeyboardEvent) => { if (event.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", outside);
    document.addEventListener("keydown", escape);
    return () => { document.removeEventListener("mousedown", outside); document.removeEventListener("keydown", escape); };
  }, []);
  return { open, setOpen, ref };
}

function FeedItems({ feed, close, empty }: {
  feed: ReturnType<typeof useFeed>; close: () => void; empty: string;
}) {
  if (feed.error) return <div role="alert" className="p-4 text-sm text-rose-600">{feed.error}<button onClick={feed.retry} className="block mt-2 underline">Retry</button></div>;
  if (!feed.data) return <p role="status" className="p-4 text-sm text-gray-500">Loading…</p>;
  if (!feed.data.items.length) return <p className="p-4 text-sm text-gray-500">{empty}</p>;
  return <ul className="max-h-80 overflow-y-auto divide-y divide-gray-100">
    {feed.data.items.map(item => <li key={item.href + item.id}>
      <Link href={item.href} onClick={close} className="block px-4 py-3 hover:bg-gray-50 focus:bg-gray-50">
        <span className="block text-sm font-medium text-gray-800 break-words">{item.title}</span>
        <span className="block text-xs text-gray-500 break-words whitespace-pre-wrap">{item.detail}</span>
        {item.status && <span className="block mt-1 text-xs text-secondary">{item.status}</span>}
        {item.date && <time dateTime={item.date} className="block mt-1 text-xs text-gray-400">{new Date(item.date).toLocaleString()}</time>}
      </Link>
    </li>)}
  </ul>;
}

export function HeaderSearch() {
  const { open, setOpen, ref } = useDropdown();
  const [query, setQuery] = useState("");
  const normalized = query.trim();
  const feed = useFeed("search", normalized, open && normalized.length >= 2);
  return <div ref={ref} className="relative min-w-0 flex-1 md:flex-none">
    <form role="search" onSubmit={event => { event.preventDefault(); setOpen(true); }} className="flex items-center bg-gray-100/50 rounded-xl px-3 py-2 border border-black/5 focus-within:ring-2 focus-within:ring-secondary/20">
      <FaSearch aria-hidden="true" className="text-gray-400 mr-2 shrink-0" />
      <input type="search" aria-label="Search students and staff" aria-controls={open ? "header-search-results" : undefined} autoComplete="off" maxLength={100}
        placeholder="Search students, staff…" value={query} onFocus={() => setOpen(true)} onChange={event => { setQuery(event.target.value); setOpen(true); }}
        className="bg-transparent outline-none text-gray-800 placeholder-gray-400 text-sm w-full md:w-64 min-w-0" />
    </form>
    {open && <div id="header-search-results" className="fixed top-16 left-3 right-3 md:absolute md:top-auto md:left-0 md:right-auto mt-2 md:w-80 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50">
      {normalized.length < 2 ? <p className="p-4 text-sm text-gray-500">Enter at least 2 characters to search students and staff by name, ID or email.</p> : <>
        <FeedItems feed={feed} close={() => setOpen(false)} empty="No matching students or staff." />
        {!!feed.data?.items.length && <p className="px-4 py-2 text-xs text-gray-400">Showing up to 12 matches. Select a record to open it.</p>}
      </>}
    </div>}
  </div>;
}

export function HeaderActivity({ kind }: { kind: "alerts" | "messages" }) {
  const { open, setOpen, ref } = useDropdown();
  const feed = useFeed(kind);
  const alerts = kind === "alerts";
  const title = alerts ? "Notices & events" : "Recent emails";
  const Icon = alerts ? FaBell : FaEnvelope;
  const count = feed.data?.count ?? 0;
  return <div ref={ref} className="relative">
    <button aria-label={`${title}${count ? ` (${count})` : ""}`} aria-expanded={open} aria-controls={`header-${kind}`} onClick={() => { setOpen(!open); if (!open) feed.retry(); }}
      className="relative text-gray-500 hover:text-secondary transition-colors p-2 rounded-full hover:bg-gray-100/50">
      <Icon aria-hidden="true" className="text-lg" />
      {count > 0 && <span className="absolute -top-1 -right-2 min-w-4 px-1 rounded-full bg-secondary text-white text-[10px] leading-4">{count > 99 ? "99+" : count}</span>}
      {feed.error && <span aria-label="Unable to refresh" className="absolute top-0 right-0 text-xs text-rose-600">!</span>}
    </button>
    {open && <div id={`header-${kind}`} className="fixed top-16 left-3 right-3 md:absolute md:top-auto md:left-auto md:right-0 mt-3 md:w-80 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50">
      <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between gap-2"><h2 className="text-sm font-semibold">{title}</h2><button onClick={feed.retry} className="text-xs text-secondary">Refresh</button></div>
      <p className="px-4 pt-2 text-xs text-gray-500">{alerts ? "Active notices and upcoming events" : "Outgoing email delivery status"}</p>
      <FeedItems feed={feed} close={() => setOpen(false)} empty={alerts ? "No active notices or upcoming events." : "No emails have been created yet."} />
      <div className="border-t border-gray-100 px-4 py-3 flex justify-between text-xs text-secondary">
        <Link onClick={() => setOpen(false)} href={alerts ? "/admin/accounts/communicate/noticeboard" : "/admin/accounts/communicate/emailsmsandlog"}>{alerts ? "Noticeboard" : "View delivery log"}</Link>
        <Link onClick={() => setOpen(false)} href={alerts ? "/admin/accounts/communicate/event" : "/admin/accounts/communicate/sendemailandsms"}>{alerts ? "All events" : "Compose email"}</Link>
      </div>
    </div>}
  </div>;
}
