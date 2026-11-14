import { sessionFetch } from "./session-client";
import type { Page } from "./school-records-client";
export type StoredFile = {
  id: string;
  originalName: string;
  mimeType: string;
  purpose: "portrait" | "document";
  byteSize: number;
  sha256: string;
  archived: boolean;
  version: number;
  createdAt: string;
};
export type FileOwner = { studentId?: string; staffId?: string };
export type FileLink = {
  id: string;
  fileId: string | null;
  slot: string;
  version: number;
  originalName?: string | null;
  fileArchived?: boolean;
};
export type ContentResource = "materials" | "notices" | "events";
export type MaterialKind =
  "material" | "syllabus" | "assignment" | "download" | "video";
type State = {
  title: string;
  published: boolean;
  archived: boolean;
  version: number;
};
export type MaterialInput = State & {
  kind: MaterialKind;
  description: string;
  assignmentId: string | null;
  fileId: string | null;
  videoUrl: string | null;
};
export type NoticeInput = State & {
  body: string;
  audience: string;
  startDate: string;
  endDate: string;
};
export type EventInput = State & {
  description: string;
  location: string;
  startsAt: string;
  endsAt: string;
};
export type ContentInput = MaterialInput | NoticeInput | EventInput;
export type ContentRecord = ContentInput & { id: string };
export type ContentOptions = {
  assignments: {
    id: string;
    subjectName: string;
    className: string;
    sectionName: string;
    yearName: string;
  }[];
  today: string | null;
  timezone: string | null;
};
export type SchoolCalendar = {
  from: string;
  to: string;
  timezone: string;
  notices: (NoticeInput & { id: string })[];
  events: (EventInput & { id: string })[];
  holidays: { id: string; name: string; startDate: string; endDate: string }[];
  weekendDays: number[] | null;
};
async function json<T>(
  path: string,
  method = "GET",
  body?: unknown,
): Promise<T> {
  const response = await sessionFetch(`/api/school-content/${path}`, {
    method,
    cache: "no-store",
    ...(body !== undefined
      ? {
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      : {}),
  });
  const result = await response.json().catch(() => {
    throw new Error("Invalid server response. Please retry.");
  });
  if (!response.ok)
    throw new Error(
      Array.isArray(result.message)
        ? result.message.join("; ")
        : result.message || "Unable to load or save content",
    );
  return result as T;
}
export const schoolContentApi = {
  files: (page = 1, search = "", archived = false, purpose = "all") =>
    json<Page<StoredFile>>(
      `files?${new URLSearchParams({ page: String(page), pageSize: "20", search, archived: String(archived), purpose })}`,
    ),
  upload: async (file: File, purpose: "portrait" | "document") => {
    const body = new FormData();
    body.append("purpose", purpose);
    body.append("file", file);
    const response = await sessionFetch("/api/school-content/files", {
      method: "POST",
      body,
    });
    const result = await response.json().catch(() => {
      throw new Error("Invalid upload response");
    });
    if (!response.ok)
      throw new Error(
        Array.isArray(result.message)
          ? result.message.join("; ")
          : result.message || "Upload failed",
      );
    return result as StoredFile;
  },
  archiveFile: (file: StoredFile) =>
    json<{ file: StoredFile; changed: boolean }>(`files/${file.id}`, "PUT", {
      archived: !file.archived,
      version: file.version,
    }),
  links: (owner: FileOwner) =>
    json<FileLink[]>(
      `files/links?${new URLSearchParams(Object.entries(owner).filter((entry): entry is [string, string] => typeof entry[1] === "string"))}`,
    ),
  link: (
    owner: FileOwner,
    slot: string,
    fileId: string | null,
    version: number,
  ) =>
    json<{ link: FileLink | null; changed: boolean }>("files/links", "PUT", {
      ...owner,
      slot,
      fileId,
      version,
    }),
  options: () => json<ContentOptions>("materials/options"),
  list: (
    resource: ContentResource,
    page = 1,
    search = "",
    archived = false,
    kind = "all",
  ) =>
    json<Page<ContentRecord>>(
      `${resource}?${new URLSearchParams({ page: String(page), pageSize: "20", search, archived: String(archived), ...(resource === "materials" ? { kind } : {}) })}`,
    ),
  save: (resource: ContentResource, input: ContentInput, id?: string) =>
    json<{ record: ContentRecord; changed: boolean }>(
      `${resource}${id ? `/${id}` : ""}`,
      id ? "PUT" : "POST",
      input,
    ),
  calendar: (from: string, to: string) =>
    json<SchoolCalendar>(
      `events/calendar?${new URLSearchParams({ from, to })}`,
    ),
  history: (page = 1) =>
    json<
      Page<{
        id: string;
        resource: string;
        recordId: string;
        actorName: string;
        version: number;
        createdAt: string;
        beforeState: unknown;
        afterState: unknown;
      }>
    >(`files/history?page=${page}&pageSize=10`),
  download: async (file: Pick<StoredFile, "id" | "originalName">) => {
    const response = await sessionFetch(
      `/api/school-content/files/${file.id}/download`,
      { cache: "no-store" },
    );
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || "Download failed");
    }
    const blob = await response.blob(),
      url = URL.createObjectURL(blob),
      anchor = document.createElement("a");
    const encoded = response.headers
      .get("Content-Disposition")
      ?.match(/filename\*=UTF-8''([^;]+)/i)?.[1];
    let name = file.originalName;
    if (encoded) {
      try {
        name = decodeURIComponent(encoded);
      } catch {
        /* Retain the provided filename. */
      }
    }
    anchor.href = url;
    anchor.download = name;
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  },
};
