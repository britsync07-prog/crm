"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  FilePlus2,
  X,
  Upload,
  FileText,
  FileSignature,
  AlertTriangle,
  Bookmark,
  Paperclip,
  Trash2,
} from "lucide-react";
import { addCustomDocumentAction, getUserTemplatesAction } from "@/app/onboarding/actions";

interface AddCustomDocumentModalProps {
  onboardingId: string;
  clientName: string;
  clientEmail: string;
  onSuccess?: () => void;
  isOpen: boolean;
  onClose: () => void;
}

export default function AddCustomDocumentModal({
  onboardingId,
  clientName,
  clientEmail,
  onSuccess,
  isOpen,
  onClose,
}: AddCustomDocumentModalProps) {
  const [activeMode, setActiveMode] = useState<"write" | "upload" | "template">("write");
  const [title, setTitle] = useState("");
  const [documentType, setDocumentType] = useState("CUSTOM_AGREEMENT");
  const [content, setContent] = useState("");
  const [requiresSignature, setRequiresSignature] = useState(true);
  const [signerName, setSignerName] = useState(clientName || "");
  const [signerEmail, setSignerEmail] = useState(clientEmail || "");
  const [saveAsTemplate, setSaveAsTemplate] = useState(false);
  const [templateName, setTemplateName] = useState("");

  // File upload state
  const [fileName, setFileName] = useState("");
  const [fileSize, setFileSize] = useState<number>(0);
  const [fileUrl, setFileUrl] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Template state
  const [availableTemplates, setAvailableTemplates] = useState<any[]>([]);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setError(null);
      loadTemplates();
      setSignerName(clientName || "");
      setSignerEmail(clientEmail || "");
    }
  }, [isOpen, clientName, clientEmail]);

  const loadTemplates = async () => {
    setIsLoadingTemplates(true);
    try {
      const res = await getUserTemplatesAction();
      if (res.success && res.templates) {
        setAvailableTemplates(res.templates);
      }
    } catch {
    } finally {
      setIsLoadingTemplates(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 25 * 1024 * 1024) {
      setError("File exceeds maximum allowed size of 25MB.");
      return;
    }

    setFileName(file.name);
    setFileSize(file.size);

    if (!title.trim()) {
      const nameWithoutExt = file.name.replace(/\.[^/.]+$/, "");
      setTitle(nameWithoutExt);
    }

    const reader = new FileReader();
    reader.onload = () => {
      setFileUrl(reader.result as string);
      if (!content.trim()) {
        setContent(`Attached file: ${file.name} (${(file.size / 1024).toFixed(1)} KB)`);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSelectTemplate = (tpl: any) => {
    setTitle(tpl.name);
    setContent(tpl.content);
    setRequiresSignature(Boolean(tpl.requiresSignature));
    setActiveMode("write");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError("Please provide a document title.");
      return;
    }

    if (activeMode === "upload" && !fileUrl && !content.trim()) {
      setError("Please select a file to upload or write document content.");
      return;
    }

    if (activeMode === "write" && !content.trim()) {
      setError("Please provide document content or notes.");
      return;
    }

    if (requiresSignature && (!signerName.trim() || !signerEmail.trim())) {
      setError("Signer name and email are required when requesting digital signatures.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await addCustomDocumentAction(onboardingId, {
        title: title.trim(),
        documentType,
        content: content.trim(),
        fileUrl: fileUrl || undefined,
        fileName: fileName || undefined,
        fileSize: fileSize || undefined,
        requiresSignature,
        signerName: requiresSignature ? signerName.trim() : undefined,
        signerEmail: requiresSignature ? signerEmail.trim() : undefined,
        saveAsTemplate,
        templateName: saveAsTemplate ? (templateName.trim() || title.trim()) : undefined,
      });

      if (res.success) {
        onSuccess?.();
        onClose();
        setTitle("");
        setContent("");
        setFileName("");
        setFileUrl("");
        setFileSize(0);
        setSaveAsTemplate(false);
      } else {
        setError(res.error || "Failed to add document.");
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-white/10 rounded-[32px] w-full max-w-2xl p-6 sm:p-8 shadow-2xl space-y-6 my-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="flex items-start justify-between border-b border-slate-100 dark:border-white/5 pb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-black uppercase tracking-widest text-[#012169] dark:text-blue-400 flex items-center gap-1">
                <FilePlus2 className="w-3.5 h-3.5" /> Manual Document Studio
              </span>
            </div>
            <h2 className="text-xl font-black uppercase tracking-tight text-slate-900 dark:text-white">
              Add Custom Document or File
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Upload client files or draft bespoke agreements. Mandatory human approval is enforced before sending.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/40 flex items-center gap-3 text-red-600 dark:text-red-400 text-xs font-bold">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Source Mode Tabs */}
        <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-slate-100 dark:bg-zinc-950 border border-slate-200 dark:border-white/5">
          <button
            type="button"
            onClick={() => setActiveMode("write")}
            className={`flex-1 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeMode === "write"
                ? "bg-white dark:bg-zinc-800 text-[#012169] dark:text-white shadow-sm"
                : "text-slate-500 hover:text-slate-900"
            }`}
          >
            <FileText className="w-3.5 h-3.5" /> Write Content
          </button>
          <button
            type="button"
            onClick={() => setActiveMode("upload")}
            className={`flex-1 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeMode === "upload"
                ? "bg-white dark:bg-zinc-800 text-[#012169] dark:text-white shadow-sm"
                : "text-slate-500 hover:text-slate-900"
            }`}
          >
            <Upload className="w-3.5 h-3.5" /> Upload File
          </button>
          <button
            type="button"
            onClick={() => setActiveMode("template")}
            className={`flex-1 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeMode === "template"
                ? "bg-white dark:bg-zinc-800 text-[#012169] dark:text-white shadow-sm"
                : "text-slate-500 hover:text-slate-900"
            }`}
          >
            <Bookmark className="w-3.5 h-3.5" /> Use Template ({availableTemplates.length})
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Document Title & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-black uppercase tracking-wider text-slate-600 dark:text-zinc-300 mb-1">
                Document Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Master Scope Addendum 2026"
                required
                className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-white/10 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#012169]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-black uppercase tracking-wider text-slate-600 dark:text-zinc-300 mb-1">
                Document Type
              </label>
              <select
                value={documentType}
                onChange={(e) => setDocumentType(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-white/10 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#012169]"
              >
                <option value="CUSTOM_AGREEMENT">Custom Agreement / Contract</option>
                <option value="SCOPE_ADDENDUM">Scope Addendum / SOW</option>
                <option value="TECHNICAL_SPEC">Technical Specification</option>
                <option value="MANUAL_FILE">Uploaded Client File</option>
                <option value="COMPLIANCE_ATTACHMENT">Compliance / Regulatory Document</option>
                <option value="OTHER">Other Custom Document</option>
              </select>
            </div>
          </div>

          {/* Mode 1: Write Document */}
          {activeMode === "write" && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-black uppercase tracking-wider text-slate-600 dark:text-zinc-300">
                  Document Content (Markdown / Plaintext) <span className="text-red-500">*</span>
                </label>
                <span className="text-[10px] font-medium text-slate-400">
                  {content.length} characters
                </span>
              </div>
              <textarea
                rows={7}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="# Scope & Agreement Details&#10;&#10;Specify the custom clauses, terms, deliverables, or specifications here..."
                className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-white/10 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#012169]"
              />
            </div>
          )}

          {/* Mode 2: Upload File */}
          {activeMode === "upload" && (
            <div className="space-y-4">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg,.zip"
                className="hidden"
              />

              {!fileName ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="p-8 rounded-3xl border-2 border-dashed border-slate-300 dark:border-white/10 hover:border-[#012169] text-center cursor-pointer transition-all bg-slate-50/50 dark:bg-zinc-950/50 space-y-2"
                >
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/50 text-[#012169] dark:text-blue-300 mx-auto flex items-center justify-center">
                    <Upload className="w-6 h-6" />
                  </div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
                    Click to select or drop your file here
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Supports PDF, DOCX, TXT, PNG, JPG (Max 25MB)
                  </p>
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-white/10 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950 text-[#012169] dark:text-blue-300 flex items-center justify-center">
                      <Paperclip className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-black text-slate-900 dark:text-white line-clamp-1">
                        {fileName}
                      </p>
                      <p className="text-[10px] text-slate-400 font-bold">
                        {(fileSize / 1024).toFixed(1)} KB &bull; File attached
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setFileName("");
                      setFileUrl("");
                      setFileSize(0);
                    }}
                    className="p-2 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}

              <div>
                <label className="block text-[11px] font-black uppercase tracking-wider text-slate-600 dark:text-zinc-300 mb-1">
                  Accompanying Notes / Summary
                </label>
                <textarea
                  rows={2}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Provide context or summary for the reviewer regarding this uploaded file..."
                  className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-white"
                />
              </div>
            </div>
          )}

          {/* Mode 3: Use Template */}
          {activeMode === "template" && (
            <div className="space-y-3">
              <label className="block text-[11px] font-black uppercase tracking-wider text-slate-600 dark:text-zinc-300">
                Select a Saved Template
              </label>

              {isLoadingTemplates ? (
                <div className="p-8 text-center text-xs text-slate-400">Loading templates...</div>
              ) : availableTemplates.length === 0 ? (
                <div className="p-8 text-center rounded-2xl border border-dashed border-slate-200 dark:border-white/10 space-y-2">
                  <Bookmark className="w-6 h-6 mx-auto text-slate-400" />
                  <p className="text-xs text-slate-500 font-bold">No custom templates found yet.</p>
                  <p className="text-[11px] text-slate-400">
                    Switch to &ldquo;Write Content&rdquo; and check &ldquo;Save as reusable template&rdquo; to create your first template.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-60 overflow-y-auto p-1">
                  {availableTemplates.map((tpl) => (
                    <div
                      key={tpl.id}
                      onClick={() => handleSelectTemplate(tpl)}
                      className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-white/5 hover:border-[#012169] transition-all cursor-pointer space-y-1 group"
                    >
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-black text-slate-900 dark:text-white group-hover:text-[#012169] line-clamp-1">
                          {tpl.name}
                        </h4>
                        {tpl.requiresSignature && (
                          <span className="text-[9px] font-bold text-indigo-600 uppercase">
                            Signature
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-400 line-clamp-2">
                        {tpl.content || "Empty content"}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Digital Signature Toggle */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-white/5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <FileSignature className="w-4 h-4 text-indigo-600" />
                <div>
                  <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tight">
                    Require Client Digital Signature
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Client will be requested to electronically sign upon approval.
                  </p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={requiresSignature}
                onChange={(e) => setRequiresSignature(e.target.checked)}
                className="w-4 h-4 accent-[#012169] rounded cursor-pointer"
              />
            </div>

            {requiresSignature && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-200 dark:border-white/5">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                    Signatory Name
                  </label>
                  <input
                    type="text"
                    value={signerName}
                    onChange={(e) => setSignerName(e.target.value)}
                    required={requiresSignature}
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-white/10 text-xs font-bold text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                    Signatory Email
                  </label>
                  <input
                    type="email"
                    value={signerEmail}
                    onChange={(e) => setSignerEmail(e.target.value)}
                    required={requiresSignature}
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-white/10 text-xs font-bold text-slate-900 dark:text-white"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Reusable Template Option */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="saveTemplateCheck"
              checked={saveAsTemplate}
              onChange={(e) => setSaveAsTemplate(e.target.checked)}
              className="w-4 h-4 accent-[#012169] rounded cursor-pointer"
            />
            <label htmlFor="saveTemplateCheck" className="text-xs font-bold text-slate-700 dark:text-zinc-300 cursor-pointer">
              Save this content as a reusable template for my future onboardings
            </label>
          </div>

          {saveAsTemplate && (
            <div>
              <input
                type="text"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                placeholder="Template Name (e.g. Bespoke Retainer Addendum)"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-white/10 text-xs font-bold text-slate-900 dark:text-white"
              />
            </div>
          )}

          {/* Mandatory Approval Notice */}
          <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 flex items-start gap-3">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-0.5 text-[11px] text-amber-800 dark:text-amber-300">
              <p className="font-black uppercase tracking-wider">Mandatory Human Approval Gate</p>
              <p className="font-medium text-amber-700 dark:text-amber-400">
                This document will be saved in <strong>PENDING APPROVAL</strong> status. It will NOT be sent or visible to the client until it is explicitly reviewed and approved in the Approval Centre.
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-3 rounded-2xl bg-[#012169] hover:bg-emerald-600 text-white text-xs font-black uppercase tracking-widest transition-all shadow-md cursor-pointer flex items-center gap-2"
            >
              {isSubmitting ? "Queueing Document..." : "Create & Queue for Approval"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
