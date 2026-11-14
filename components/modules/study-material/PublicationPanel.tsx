"use client";
import Link from "next/link";
import { PageHeader } from "@/components/common/PageHeader";
import { AdminCard } from "@/components/common/AdminCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  schoolContentApi,
  type ContentResource,
  type MaterialKind,
} from "@/lib/school-content-client";
import { usePublications } from "@/lib/use-publications";
import { FileChooser } from "./FileChooser";
import { ContentHistory } from "@/components/modules/settings/ContentHistory";
function local(value: string) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isFinite(date.getTime())
    ? new Date(date.getTime() - date.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 16)
    : "";
}
export function PublicationPanel({
  resource,
  kind = "material",
  title,
  subtitle,
}: {
  resource: ContentResource;
  kind?: MaterialKind;
  title: string;
  subtitle?: string;
}) {
  const state = usePublications(resource, kind),
    draft = state.draft,
    selectClass =
      "w-full h-12 rounded-xl border border-gray-200 bg-white px-3 text-sm";
  return (
    <div className="container mx-auto space-y-8">
      <PageHeader title={title} subtitle={subtitle} />
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
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <AdminCard className="lg:col-span-4 p-8 space-y-6">
          <h2 className="text-xs font-semibold text-gray-500">
            {state.editing ? "Edit Record" : "Create Record"}
          </h2>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              void state.save();
            }}
            className="space-y-6"
          >
            <fieldset
              disabled={state.saving || !state.ready}
              className="space-y-6"
            >
              <div>
                <Label htmlFor="publication-title">Title *</Label>
                <Input
                  id="publication-title"
                  required
                  maxLength={160}
                  value={draft.title}
                  onChange={(event) =>
                    state.setDraft({ ...draft, title: event.target.value })
                  }
                />
              </div>
              {"kind" in draft && (
                <>
                  <div>
                    <Label htmlFor="publication-description">Description</Label>
                    <textarea
                      id="publication-description"
                      className="w-full min-h-24 border border-gray-200 rounded-xl p-3"
                      maxLength={2000}
                      value={draft.description}
                      onChange={(event) =>
                        state.setDraft({
                          ...draft,
                          description: event.target.value,
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="material-scope">Availability</Label>
                    <select
                      id="material-scope"
                      className={selectClass}
                      value={draft.assignmentId ?? ""}
                      onChange={(event) =>
                        state.setDraft({
                          ...draft,
                          assignmentId: event.target.value || null,
                        })
                      }
                    >
                      <option value="">School-wide</option>
                      {state.options.assignments.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.yearName} · {item.className} ·{" "}
                          {item.sectionName} · {item.subjectName}
                        </option>
                      ))}
                    </select>
                  </div>
                  {draft.kind === "video" ? (
                    <div>
                      <Label htmlFor="video-url">HTTPS Video Link *</Label>
                      <Input
                        id="video-url"
                        type="url"
                        required
                        maxLength={2000}
                        value={draft.videoUrl ?? ""}
                        onChange={(event) =>
                          state.setDraft({
                            ...draft,
                            videoUrl: event.target.value || null,
                            fileId: null,
                          })
                        }
                      />
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Label>Stored File *</Label>
                      <FileChooser
                        value={draft.fileId}
                        onChange={(fileId) =>
                          state.setDraft({ ...draft, fileId, videoUrl: null })
                        }
                        disabled={state.saving || !state.ready}
                      />
                      <Link
                        href="/admin/study-material/upload"
                        className="text-sm underline text-secondary"
                      >
                        Upload a file to the Asset Repository
                      </Link>
                    </div>
                  )}
                </>
              )}
              {"body" in draft && (
                <>
                  <div>
                    <Label htmlFor="notice-body">Notice Text *</Label>
                    <textarea
                      id="notice-body"
                      required
                      maxLength={5000}
                      className="w-full min-h-32 rounded-xl border border-gray-200 p-3"
                      value={draft.body}
                      onChange={(event) =>
                        state.setDraft({ ...draft, body: event.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="notice-audience">Audience</Label>
                    <select
                      id="notice-audience"
                      className={selectClass}
                      value={draft.audience}
                      onChange={(event) =>
                        state.setDraft({
                          ...draft,
                          audience: event.target.value,
                        })
                      }
                    >
                      {["all", "admin", "staff", "students", "guardians"].map(
                        (value) => (
                          <option key={value} value={value}>
                            {value}
                          </option>
                        ),
                      )}
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="notice-start">Visible From *</Label>
                    <Input
                      id="notice-start"
                      required
                      type="date"
                      value={draft.startDate}
                      onChange={(event) =>
                        state.setDraft({
                          ...draft,
                          startDate: event.target.value,
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="notice-end">Visible Until *</Label>
                    <Input
                      id="notice-end"
                      required
                      type="date"
                      value={draft.endDate}
                      onChange={(event) =>
                        state.setDraft({
                          ...draft,
                          endDate: event.target.value,
                        })
                      }
                    />
                  </div>
                </>
              )}
              {"startsAt" in draft && (
                <>
                  <div>
                    <Label htmlFor="event-description">Description</Label>
                    <textarea
                      id="event-description"
                      maxLength={2000}
                      className="w-full min-h-24 rounded-xl border border-gray-200 p-3"
                      value={draft.description}
                      onChange={(event) =>
                        state.setDraft({
                          ...draft,
                          description: event.target.value,
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="event-location">Location</Label>
                    <Input
                      id="event-location"
                      maxLength={300}
                      value={draft.location}
                      onChange={(event) =>
                        state.setDraft({
                          ...draft,
                          location: event.target.value,
                        })
                      }
                    />
                  </div>
                  {(
                    [
                      ["startsAt", "Starts"],
                      ["endsAt", "Ends"],
                    ] as const
                  ).map(([key, label]) => (
                    <div key={key}>
                      <Label htmlFor={`event-${key}`}>
                        {label} (your local time) *
                      </Label>
                      <Input
                        id={`event-${key}`}
                        type="datetime-local"
                        required
                        value={local(draft[key])}
                        onChange={(event) => {
                          const date = new Date(event.target.value);
                          state.setDraft({
                            ...draft,
                            [key]: Number.isFinite(date.getTime())
                              ? date.toISOString()
                              : "",
                          });
                        }}
                      />
                    </div>
                  ))}
                </>
              )}
              <label className="flex gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={draft.published}
                  onChange={(event) =>
                    state.setDraft({
                      ...draft,
                      published: event.target.checked,
                    })
                  }
                />
                Published
              </label>
              <Button type="submit" className="w-full py-6">
                {state.saving ? "Saving…" : "Save Record"}
              </Button>
            </fieldset>
            {state.editing && (
              <Button
                type="button"
                variant="outline"
                disabled={state.saving}
                onClick={state.reset}
              >
                Cancel Edit
              </Button>
            )}
          </form>
        </AdminCard>
        <div className="lg:col-span-8 space-y-6">
          <div className="flex flex-wrap gap-4 items-center">
            <Input
              aria-label="Search publications"
              value={state.search}
              disabled={state.saving}
              onChange={(event) => state.setSearch(event.target.value)}
              placeholder="Search titles…"
              className="max-w-sm"
            />
            <label className="text-sm flex gap-2">
              <input
                type="checkbox"
                checked={state.archived}
                disabled={state.saving}
                onChange={(event) => state.setArchived(event.target.checked)}
              />
              Show archived
            </label>
          </div>
          <AdminCard className="p-8 space-y-5">
            {state.loading ? (
              <p>Loading records…</p>
            ) : !state.ready ? (
              <p>Records could not load. Reload to retry.</p>
            ) : !state.items.length ? (
              <p>No matching records.</p>
            ) : (
              state.items.map((record) => (
                <article
                  key={record.id}
                  className="border-b border-gray-200 py-4 space-y-3"
                >
                  <div className="flex justify-between flex-wrap gap-3">
                    <h2 className="font-semibold">{record.title}</h2>
                    <span className="text-xs text-gray-500">
                      {record.archived
                        ? "Archived"
                        : record.published
                          ? "Published"
                          : "Draft"}{" "}
                      · Version {record.version}
                    </span>
                  </div>
                  {"body" in record ? (
                    <>
                      <p className="text-sm whitespace-pre-wrap">
                        {record.body}
                      </p>
                      <p className="text-xs text-gray-500">
                        {record.audience} · {record.startDate} to{" "}
                        {record.endDate}
                      </p>
                    </>
                  ) : "startsAt" in record ? (
                    <>
                      <p className="text-sm whitespace-pre-wrap">
                        {record.description}
                      </p>
                      <p className="text-sm">
                        {new Date(record.startsAt).toLocaleString()} to{" "}
                        {new Date(record.endsAt).toLocaleString()} (your local
                        time)
                      </p>
                      <p className="text-sm text-gray-500">{record.location}</p>
                    </>
                  ) : (
                    <>
                      <p className="text-sm whitespace-pre-wrap">
                        {record.description}
                      </p>
                      <p className="text-xs text-gray-500">
                        {record.assignmentId
                          ? state.options.assignments.find(
                              (item) => item.id === record.assignmentId,
                            )?.subjectName || "Allocated class/subject"
                          : "School-wide"}
                      </p>
                      {record.kind === "video" && record.videoUrl ? (
                        <a
                          href={record.videoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm underline text-secondary"
                        >
                          Open Video Link
                        </a>
                      ) : (
                        record.fileId && (
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              void schoolContentApi
                                .download({
                                  id: record.fileId!,
                                  originalName: record.title,
                                })
                                .catch((error) =>
                                  state.setError(
                                    error instanceof Error
                                      ? error.message
                                      : "Download failed",
                                  ),
                                )
                            }
                          >
                            Download File
                          </Button>
                        )
                      )}
                    </>
                  )}
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={state.saving}
                      onClick={() => state.edit(record)}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={state.saving}
                      onClick={() => void state.archive(record)}
                    >
                      {record.archived ? "Restore" : "Archive"}
                    </Button>
                  </div>
                </article>
              ))
            )}
            <div className="flex justify-between gap-3 pt-4">
              <Button
                variant="outline"
                disabled={state.loading || state.saving || state.page <= 1}
                onClick={() => state.setPage(state.page - 1)}
              >
                Previous
              </Button>
              <span className="text-sm">
                Page {state.page} · {state.total} records
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
