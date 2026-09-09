"use client";

import React, { useRef, useState, useEffect } from "react";
import { Check, RotateCcw, PenTool, Type, Shield, Lock } from "lucide-react";

interface SignaturePadProps {
  signerName: string;
  documentTitle: string;
  documentId: string;
  token: string;
  onSigned: (certificate: any) => void;
  onCancel?: () => void;
}

export default function SignaturePad({
  signerName,
  documentTitle,
  documentId,
  token,
  onSigned,
  onCancel,
}: SignaturePadProps) {
  const [tab, setTab] = useState<"draw" | "type">("draw");
  const [typedName, setTypedName] = useState(signerName || "");
  const [fontStyle, setFontStyle] = useState("font-serif italic");
  const [consent, setConsent] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Initialize canvas
  useEffect(() => {
    if (tab === "draw" && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = "#012169"; // BritCRM navy blue ink
      }
    }
  }, [tab]);

  // Handle touch and mouse drawing
  const getCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    const rect = canvasRef.current.getBoundingClientRect();
    if ("touches" in e) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
      };
    }
    return {
      x: (e as React.MouseEvent).clientX - rect.left,
      y: (e as React.MouseEvent).clientY - rect.top,
    };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;
    const { x, y } = getCoordinates(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || !canvasRef.current) return;
    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;
    const { x, y } = getCoordinates(e);
    ctx.lineTo(x, y);
    ctx.stroke();
    setHasDrawn(true);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    setHasDrawn(false);
  };

  const handleSubmit = async () => {
    if (!consent) {
      setError("Please check the consent box to proceed.");
      return;
    }

    let signatureData = "";
    if (tab === "draw") {
      if (!hasDrawn || !canvasRef.current) {
        setError("Please draw your signature before submitting.");
        return;
      }
      signatureData = canvasRef.current.toDataURL("image/png");
    } else {
      if (!typedName.trim()) {
        setError("Please enter your legal name.");
        return;
      }
      signatureData = `TYPED:${typedName}:${fontStyle}`;
    }

    setSubmitting(true);
    setError(null);

    try {
      const { signDocumentAction } = await import("@/app/onboarding/portal-actions");
      const res = await signDocumentAction(token, documentId, {
        type: tab === "draw" ? "DRAWN" : "TYPED",
        data: signatureData,
        name: typedName || signerName,
        consent: true,
      });

      if (res.success) {
        onSigned(res.certificate);
      } else {
        setError(res.error || "Failed to submit signature.");
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 rounded-3xl p-6 shadow-2xl space-y-6 max-w-xl mx-auto animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-100 dark:border-white/5 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#012169] animate-pulse"></span>
            <p className="text-[10px] font-black uppercase tracking-widest text-[#012169] dark:text-blue-300">
              DocuSign-Style Digital Execution
            </p>
          </div>
          <h3 className="text-lg font-black text-zinc-900 dark:text-white uppercase mt-0.5">
            {documentTitle}
          </h3>
        </div>
        <div className="flex items-center gap-1 bg-zinc-100 dark:bg-white/5 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setTab("draw")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              tab === "draw"
                ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm"
                : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
            }`}
          >
            <PenTool className="w-3.5 h-3.5" /> Draw
          </button>
          <button
            type="button"
            onClick={() => setTab("type")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              tab === "type"
                ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm"
                : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
            }`}
          >
            <Type className="w-3.5 h-3.5" /> Type
          </button>
        </div>
      </div>

      {/* Input Pad */}
      {tab === "draw" ? (
        <div className="space-y-2">
          <div className="relative border-2 border-dashed border-zinc-300 dark:border-zinc-700 rounded-2xl bg-zinc-50/70 dark:bg-zinc-950 overflow-hidden cursor-crosshair">
            <canvas
              ref={canvasRef}
              width={500}
              height={180}
              className="w-full h-44 touch-none"
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
            />
            <div className="absolute bottom-3 left-4 pointer-events-none flex items-center gap-2 opacity-40">
              <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
                Sign with touch, pen, or mouse above
              </span>
            </div>
            {hasDrawn && (
              <button
                type="button"
                onClick={clearCanvas}
                className="absolute top-3 right-3 p-2 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-white/10 text-xs font-bold text-zinc-600 hover:text-red-500 shadow-sm flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" /> Clear
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-zinc-500 mb-1">
              Full Legal Name
            </label>
            <input
              type="text"
              value={typedName}
              onChange={(e) => setTypedName(e.target.value)}
              placeholder="e.g. John Smith"
              className="w-full px-4 py-3 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-white/10 text-sm font-bold focus:ring-2 focus:ring-[#012169] transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-zinc-500 mb-2">
              Select Signature Style
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { name: "Executive Script", style: "font-serif italic tracking-wide" },
                { name: "Cursive Flow", style: "font-mono italic font-bold tracking-tight" },
                { name: "Formal Bold", style: "font-sans font-black italic tracking-widest uppercase" },
              ].map((font) => (
                <button
                  key={font.name}
                  type="button"
                  onClick={() => setFontStyle(font.style)}
                  className={`p-3 rounded-xl border text-center transition-all ${
                    fontStyle === font.style
                      ? "border-[#012169] bg-blue-50/50 dark:bg-blue-950/30 text-[#012169] dark:text-blue-300"
                      : "border-zinc-200 dark:border-white/10 hover:border-zinc-300 text-zinc-700 dark:text-zinc-300"
                  }`}
                >
                  <p className={`text-base truncate ${font.style}`}>
                    {typedName || "Signature"}
                  </p>
                  <p className="text-[9px] text-zinc-400 mt-1 uppercase font-bold">{font.name}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Mandatory Legal Consent Declaration */}
      <div className="rounded-2xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40 p-4 space-y-3">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={consent}
            onChange={(e) => {
              setConsent(e.target.checked);
              if (error) setError(null);
            }}
            className="mt-1 w-4 h-4 rounded text-[#012169] focus:ring-[#012169] border-zinc-300"
          />
          <span className="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed">
            I, <strong className="text-zinc-900 dark:text-white">{typedName || signerName}</strong>, declare that I am authorized to execute this agreement and agree that my digital signature constitutes a binding legal commitment pursuant to the UK Electronic Communications Act 2000 and the eIDAS Regulation.
          </span>
        </label>
        <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-widest text-zinc-400 pt-1 border-t border-blue-100/50 dark:border-blue-900/30">
          <span className="flex items-center gap-1">
            <Lock className="w-3 h-3 text-green-500" /> 256-Bit Encrypted Audit Seal
          </span>
          <span>Time: {new Date().toLocaleDateString("en-GB")}</span>
        </div>
      </div>

      {error && (
        <p className="text-xs font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 p-3 rounded-xl border border-red-200 dark:border-red-900/50">
          {error}
        </p>
      )}

      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-3 pt-2">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={submitting}
            className="px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-wider text-zinc-500 hover:text-zinc-900 transition-colors"
          >
            Cancel
          </button>
        )}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitting || !consent}
          className="flex items-center gap-2 bg-[#012169] hover:bg-[#c8102e] text-white px-8 py-3.5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          {submitting ? (
            "Sealing Signature..."
          ) : (
            <>
              <Check className="w-4 h-4" /> Sign Document
            </>
          )}
        </button>
      </div>
    </div>
  );
}
