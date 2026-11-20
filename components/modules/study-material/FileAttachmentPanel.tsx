"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { schoolContentApi, type FileLink } from "@/lib/school-content-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileChooser } from "./FileChooser";
export function FileAttachmentPanel({
  studentId,
  staffId,
  disabled = false,
}: {
  studentId?: string;
  staffId?: string;
  disabled?: boolean;
}) {
  const [links, setLinks] = useState<FileLink[]>([]),
    [slot, setSlot] = useState("portrait"),
    [selected, setSelected] = useState<string | null>(null),
    [file, setFile] = useState<File | null>(null),
    [ready, setReady] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [notice, setNotice] = useState("");
  const working = useRef(false),
    sequence = useRef(0),
    input = useRef<HTMLInputElement>(null);
  const load = useCallback(async () => {
    const token = ++sequence.current;
    setReady(false);
    setError("");
    try {
      const result = await schoolContentApi.links({ studentId, staffId });
      if (token === sequence.current) {
        setLinks(result);
        setReady(true);
      }
    } catch (err) {
      if (token === sequence.current)
        setError(
          err instanceof Error ? err.message : "Unable to load attachments",
        );
    }
  }, [studentId, staffId]);
  const invalidate = useCallback(() => {
    ++sequence.current;
  }, []);
  useEffect(() => {
    let active = true;
    void Promise.resolve().then(() => {
      if (active) return load();
    });
    return () => {
      active = false;
      invalidate();
    };
  }, [load, invalidate]);
  const current = links.find((link) => link.slot === slot),
    locked = busy || disabled || !ready;
  async function act(task: () => Promise<void>) {
    if (working.current || locked) return;
    working.current = true;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await task();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to save attachment",
      );
    } finally {
      working.current = false;
      setBusy(false);
    }
  }
  function save(fileId: string | null) {
    return act(async () => {
      const saved = await schoolContentApi.link(
        { studentId, staffId },
        slot,
        fileId,
        current?.version ?? 0,
      );
      if (saved.link)
        setLinks((previous) => [
          ...previous.filter((link) => link.slot !== slot),
          {
            ...saved.link!,
            originalName:
              fileId === null
                ? null
                : current?.fileId === fileId
                  ? current.originalName
                  : undefined,
          },
        ]);
      setSelected(null);
      setNotice(
        fileId
          ? "Attachment saved."
          : "Attachment cleared. The stored file is retained.",
      );
      await load();
    });
  }
  return (
    <div className="space-y-4">
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}{" "}
          <Button
            type="button"
            variant="ghost"
            disabled={busy}
            onClick={() => void load()}
          >
            Reload
          </Button>
        </p>
      )}
      {notice && (
        <p role="status" className="text-sm text-green-700">
          {notice}
        </p>
      )}
      <Label>Attachment Slot</Label>
      <select
        aria-label="Attachment slot"
        className="w-full h-10 border border-gray-200 rounded-xl px-3 bg-white"
        value={slot}
        disabled={busy || disabled}
        onChange={(event) => {
          setSlot(event.target.value);
          setSelected(null);
          setFile(null);
          if (input.current) input.current.value = "";
        }}
      >
        {(studentId
          ? ["portrait", "document"]
          : [
              "portrait",
              "resume",
              "joining-document",
              "other-document",
              "document",
            ]
        ).map((value) => (
          <option key={value} value={value}>
            {value.replaceAll("-", " ")}
          </option>
        ))}
      </select>
      <p className="text-sm text-gray-500">
        Current:{" "}
        {current?.fileId
          ? current.originalName || "Stored attachment"
          : "No attachment"}
        {current?.fileArchived ? " (archived file)" : ""}
      </p>
      {current?.fileId && (
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => {
              setError("");
              void schoolContentApi
                .download({
                  id: current.fileId!,
                  originalName: current.originalName || "attachment",
                })
                .catch((err) =>
                  setError(
                    err instanceof Error ? err.message : "Download failed",
                  ),
                );
            }}
          >
            Download Current
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            disabled={locked}
            onClick={() => void save(null)}
          >
            Clear Link
          </Button>
        </div>
      )}
      <FileChooser
        value={selected}
        onChange={setSelected}
        purpose={slot === "portrait" ? "portrait" : "all"}
        disabled={locked}
      />
      <Button
        type="button"
        disabled={locked || !selected}
        onClick={() => void save(selected)}
      >
        Save Attachment
      </Button>
      <div className="border-t border-gray-200 pt-4 space-y-3">
        <Label>Upload a New File</Label>
        <Input
          ref={input}
          type="file"
          aria-label="New attachment file"
          disabled={locked}
          accept={
            slot === "portrait"
              ? ".png,.jpg,.jpeg"
              : ".pdf,.png,.jpg,.jpeg,.txt"
          }
          onChange={(event) => setFile(event.target.files?.[0] ?? null)}
        />
        <Button
          type="button"
          variant="outline"
          disabled={locked || !file}
          onClick={() =>
            void act(async () => {
              if (!file || !file.size || file.size > 5242880)
                throw new Error("Choose a nonempty file up to 5 MiB.");
              const uploaded = await schoolContentApi.upload(
                file,
                slot === "portrait" ? "portrait" : "document",
              );
              setSelected(uploaded.id);
              setFile(null);
              if (input.current) input.current.value = "";
              setNotice(
                `Uploaded ${uploaded.originalName}. Save Attachment to link it.`,
              );
            })
          }
        >
          Upload File
        </Button>
        <p className="text-xs text-gray-500">
          Maximum 5 MiB. Upload and attachment saves are separate actions.
        </p>
      </div>
    </div>
  );
}
