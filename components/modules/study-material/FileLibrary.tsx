"use client";
import { useRef } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { ModuleCard as AdminCard } from "@/components/common/ModuleCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useFileLibrary } from "@/lib/use-file-library";
import { ContentHistory } from "@/components/modules/settings/ContentHistory";
export function FileLibrary() {
  const state = useFileLibrary(),
    input = useRef<HTMLInputElement>(null);
  return (
    <div className="container mx-auto space-y-8">
      <PageHeader
        title="Asset Repository"
        subtitle="Digital Media Management"
      />
      {state.error && (
        <p role="alert" className="text-destructive">
          {state.error}{" "}
          <Button
            variant="outline"
            disabled={state.saving}
            onClick={() => void state.load()}
          >
            Reload
          </Button>
        </p>
      )}
      {state.notice && (
        <p role="status" className="text-green-700">
          {state.notice}
        </p>
      )}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
        <AdminCard className="xl:col-span-4 p-8 space-y-6 self-start">
          <h2 className="text-xs font-semibold text-gray-500">Upload File</h2>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              void state.upload().then((saved) => {
                if (saved && input.current) input.current.value = "";
              });
            }}
            className="space-y-6"
          >
            <fieldset
              disabled={state.saving || !state.ready}
              className="space-y-6"
            >
              <div>
                <Label htmlFor="file-purpose">Purpose</Label>
                <select
                  id="file-purpose"
                  value={state.purpose}
                  onChange={(event) =>
                    state.setPurpose(
                      event.target.value as "portrait" | "document",
                    )
                  }
                  className="block w-full h-12 rounded-xl border border-gray-200 px-3"
                >
                  <option value="document">Document</option>
                  <option value="portrait">Portrait</option>
                </select>
              </div>
              <div>
                <Label htmlFor="library-file">File</Label>
                <Input
                  ref={input}
                  id="library-file"
                  type="file"
                  accept={
                    state.purpose === "portrait"
                      ? ".png,.jpg,.jpeg"
                      : ".pdf,.png,.jpg,.jpeg,.txt"
                  }
                  onChange={(event) =>
                    state.setFile(event.target.files?.[0] ?? null)
                  }
                />
              </div>
              <p className="text-sm text-gray-500">
                PDF, PNG, JPEG or UTF-8 TXT. Maximum 5 MiB. Portraits use
                PNG/JPEG up to 4096 × 4096.
              </p>
              <Button type="submit" className="w-full py-6">
                {state.saving ? "Uploading…" : "Upload File"}
              </Button>
            </fieldset>
          </form>
        </AdminCard>
        <div className="xl:col-span-8 space-y-6">
          <div className="flex flex-wrap gap-4 items-center">
            <Input
              aria-label="Search files"
              placeholder="Search filenames…"
              value={state.search}
              disabled={state.saving}
              onChange={(event) => state.setSearch(event.target.value)}
              className="max-w-sm"
            />
            <label className="flex gap-2 text-sm">
              <input
                type="checkbox"
                checked={state.archived}
                disabled={state.saving}
                onChange={(event) => state.setArchived(event.target.checked)}
              />
              Show archived
            </label>
          </div>
          <AdminCard className="p-8 space-y-4">
            <h2 className="text-xs font-semibold text-gray-500">
              Stored Assets
            </h2>
            {state.loading ? (
              <p>Loading files…</p>
            ) : !state.ready ? (
              <p>File records could not load. Reload to retry.</p>
            ) : !state.items.length ? (
              <p>No matching files.</p>
            ) : (
              state.items.map((file) => (
                <div
                  key={file.id}
                  className="border-b border-gray-200 py-4 flex flex-wrap justify-between gap-3"
                >
                  <div>
                    <p className="font-semibold break-all">
                      {file.originalName}
                    </p>
                    <p className="text-xs text-gray-500">
                      {file.purpose} · {(file.byteSize / 1024).toFixed(1)} KiB ·{" "}
                      {file.archived ? "Archived" : "Active"}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => void state.download(file)}
                    >
                      Download
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={state.saving}
                      onClick={() => void state.archive(file)}
                    >
                      {file.archived ? "Restore" : "Archive"}
                    </Button>
                  </div>
                </div>
              ))
            )}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-4">
              <Button
                variant="outline"
                disabled={state.loading || state.saving || state.page <= 1}
                onClick={() => state.setPage(state.page - 1)}
              >
                Previous
              </Button>
              <span className="text-sm">
                Page {state.page} · {state.total} files
              </span>
              <Button
                variant="outline"
                disabled={
                  state.loading ||
                  state.saving ||
                  state.page * state.pageSize >= state.total
                }
                onClick={() => state.setPage(state.page + 1)}
              >
                Next
              </Button>
            </div>
          </AdminCard>
        </div>
      </div>
      <ContentHistory />
    </div>
  );
}
