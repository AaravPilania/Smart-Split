import { useState, useRef, useEffect, useCallback } from "react";
import { FiCamera, FiUpload, FiX, FiCheck, FiPlus, FiRefreshCw } from "react-icons/fi";
import Tesseract from "tesseract.js";
import { apiFetch } from "../utils/api";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export default function ScanReceipt({ 
  groups, 
  userId, 
  onExpenseCreated,
  onClose 
}) {
  const [mode, setMode] = useState(null); // 'camera' or 'upload'
  const [image, setImage] = useState(null);
  const [imageUrl, setImageUrl] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [extractedData, setExtractedData] = useState(null);
  const [selectedGroupId, setSelectedGroupId] = useState(null);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    amount: "",
    paidBy: userId,
    splits: [],
  });

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const fileInputRef = useRef(null);
  const [facingMode, setFacingMode] = useState("environment");

  // Attach stream to video element — called after stream acquired OR when video mounts
  const attachStream = useCallback(() => {
    if (streamRef.current && videoRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch(() => {});
    }
  }, []);

  // When camera mode activates and video element mounts, attach stream
  useEffect(() => {
    if (mode === "camera") {
      // Small timeout ensures the video element is in the DOM
      const t = setTimeout(attachStream, 50);
      return () => clearTimeout(t);
    }
  }, [mode, attachStream]);

  useEffect(() => {
    if (selectedGroupId) {
      const group = groups.find((g) => String(g.id) === String(selectedGroupId));
      setSelectedGroup(group || null);
    } else {
      setSelectedGroup(null);
    }
  }, [selectedGroupId, groups]);

  useEffect(() => {
    return () => {
      // Cleanup: stop camera stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (imageUrl) {
        URL.revokeObjectURL(imageUrl);
      }
    };
  }, [imageUrl]);

  const applyStream = (stream) => {
    streamRef.current = stream;
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch(() => {});
    }
    if (mode !== "camera") setMode("camera");
  };

  const startCamera = async (facing = facingMode) => {
    // Stop any existing stream first
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;

    // Try constraints in order: exact → ideal → plain → any video
    const attempts = [
      { facingMode: { exact: facing } },
      { facingMode: facing },
      { facingMode: { ideal: facing } },
      true, // last resort: any camera
    ];

    for (const videoConstraint of attempts) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: videoConstraint,
          audio: false,
        });
        applyStream(stream);
        return;
      } catch (_) { /* try next */ }
    }
    alert("Unable to access camera. Please allow camera permission and try again.");
  };

  const flipCamera = async () => {
    const next = facingMode === "environment" ? "user" : "environment";
    setFacingMode(next);
    await startCamera(next);
  };

  const capturePhoto = useCallback(() => {
    const video = videoRef.current;
    if (!video || video.videoWidth === 0) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    // Mirror front camera capture
    if (facingMode === "user") {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0);
    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      setImage(blob);
      setImageUrl(url);
      stopCamera();
    }, "image/jpeg", 0.95);
  }, [facingMode]);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setMode(null);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        alert("Please upload an image file");
        return;
      }
      setImage(file);
      const url = URL.createObjectURL(file);
      setImageUrl(url);
      setMode("upload");
    }
  };

  const extractExpenseData = (text) => {
    const lines = text.split("\n").map(l => l.trim()).filter(l => l.length > 0);

    // ─── AMOUNT EXTRACTION ───
    // Normalize a matched string to a float, handling . and , as decimal sep
    const toFloat = (str) => {
      let s = str.replace(/[€£₹$¥\s]/g, "");
      // e.g. "495,36" → European decimal
      if (/,\d{1,2}$/.test(s)) s = s.replace(/\./g, "").replace(",", ".");
      else s = s.replace(/,/g, "");
      return parseFloat(s);
    };

    // Match any currency amount: optional symbol + digits + decimal
    const findAmts = (str) => {
      const rx = /[€£₹$¥]?\s*\d{1,3}(?:[.,]\d{3})*[.,]\d{1,2}(?!\d)/g;
      return (str.match(rx) || [])
        .map(toFloat)
        .filter(v => !isNaN(v) && v >= 0.01 && v <= 999999.99);
    };

    let amount = null;

    // Priority label scan — bottom-to-top, first matching label with a number wins
    const priorityLabels = [
      /total\s+due/i,
      /amount\s+due/i,
      /grand\s+total/i,
      /net\s+total/i,
      /total\s+amount/i,
      /total\s+tva/i,
      /montant\s+total/i,
      /\btotal\b/i,
      /\bdue\b/i,
      /net\s+pay/i,
      /\bbalance\b/i,
    ];

    outer:
    for (const labelRx of priorityLabels) {
      for (let i = lines.length - 1; i >= 0; i--) {
        if (!labelRx.test(lines[i])) continue;
        // Numbers on the same line after the label
        const afterLabel = lines[i].replace(labelRx, "");
        const here = findAmts(afterLabel);
        if (here.length > 0) { amount = here[here.length - 1]; break outer; }
        // Number on the very next line
        if (i + 1 < lines.length) {
          const next = findAmts(lines[i + 1]);
          if (next.length > 0) { amount = next[next.length - 1]; break outer; }
        }
      }
    }

    // Fallback: largest amount in the bottom 40% of the receipt
    if (!amount) {
      const bottomNums = lines.slice(Math.floor(lines.length * 0.6)).flatMap(findAmts);
      if (bottomNums.length > 0) amount = Math.max(...bottomNums);
    }

    // Final fallback: largest amount anywhere
    if (!amount) {
      const allNums = lines.flatMap(findAmts);
      if (allNums.length > 0) amount = Math.max(...allNums);
    }

    // ─── TITLE EXTRACTION ───
    const skipRx = [
      /^invoice/i, /^date[:\s]/i, /^table[:\s]/i, /^guests?[:\s]/i,
      /^server[:\s]/i, /^order[:\s]/i, /^receipt/i, /^bill[:\s]/i,
      /^transaction/i, /^ref[.:#]/i, /^no[.:#]/i, /^tel/i, /^phone/i,
      /^fax/i, /^www\./i, /^http/i, /^[\d#]/, /^[€£₹$¥]/,
      /^(qty|description|price|total|amount|payment|subtotal|tax|vat|tva|service)/i,
      /^(discount|early\s+bird|taxable)/i,
    ];

    let title = "";
    for (const line of lines.slice(0, 10)) {
      if (skipRx.some(p => p.test(line))) continue;
      if (line.length < 3 || line.length > 70) continue;
      if (/^\d+$/.test(line) || /@/.test(line)) continue;
      // Prefer ALL-CAPS lines (restaurant/store name pattern)
      if (line === line.toUpperCase() && /[A-Z]{2,}/.test(line)) { title = line; break; }
      if (!title) title = line;
    }

    title = title
      .replace(/^(receipt|invoice|transaction|bill)\s*/i, "")
      .replace(/[#:]/g, "")
      .trim()
      .slice(0, 50);

    if (!title || title.length < 2) title = "Receipt Expense";

    return { title, amount: amount || 0, rawText: text };
  };

  // Preprocess image for better OCR (especially handwriting)
  const preprocessImage = (imageSource) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        // Upscale small images for better OCR
        const scale = Math.max(1, Math.min(3, 2000 / Math.max(img.width, img.height)));
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        const ctx = canvas.getContext("2d");
        // White background
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        // Boost contrast and convert to grayscale for handwriting
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const d = imageData.data;
        for (let i = 0; i < d.length; i += 4) {
          // Grayscale
          const gray = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
          // Mild contrast boost — aggressive values harm printed receipts
          const contrast = Math.min(255, Math.max(0, (gray - 128) * 1.3 + 128));
          d[i] = d[i + 1] = d[i + 2] = contrast;
        }
        ctx.putImageData(imageData, 0, 0);
        canvas.toBlob((blob) => resolve(blob || imageSource), "image/png");
      };
      img.onerror = () => resolve(imageSource);
      if (imageSource instanceof Blob) {
        img.src = URL.createObjectURL(imageSource);
      } else {
        img.src = imageSource;
      }
    });
  };

  const scanReceipt = async () => {
    if (!image) {
      alert("Please take a photo or upload an image first");
      return;
    }

    if (!selectedGroupId) {
      alert("Please select a group first");
      return;
    }

    try {
      setScanning(true);

      // Preprocess for better OCR (especially handwriting)
      const processedImage = await preprocessImage(image);

      // Run OCR — PSM 4 (single column) handles receipt layouts better than PSM 6
      const { data } = await Tesseract.recognize(processedImage, "eng", {
        logger: () => {},
        tessedit_pageseg_mode: "4",       // Single column of text of variable sizes
        tessedit_ocr_engine_mode: "1",    // Neural net LSTM only
        preserve_interword_spaces: "1",
      });

      const extracted = extractExpenseData(data.text);
      
      // Auto-split evenly among all group members if amount found
      const splits = [];
      if (selectedGroup && selectedGroup.members && extracted.amount > 0) {
        const splitAmount = extracted.amount / selectedGroup.members.length;
        selectedGroup.members.forEach((member) => {
          splits.push({
            userId: member.id,
            amount: parseFloat(splitAmount.toFixed(2)),
          });
        });
      }

      setExtractedData({
        ...extracted,
        rawText: data.text,
      });

      setFormData({
        title: extracted.title,
        amount: extracted.amount > 0 ? extracted.amount.toString() : "",
        paidBy: userId,
        splits: splits,
      });

      setScanning(false);
    } catch (error) {
      console.error("OCR Error:", error);
      alert("Failed to scan receipt. Please try again or enter manually.");
      setScanning(false);
    }
  };

  const handleCreateExpense = async (e) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.amount || !selectedGroupId) {
      alert("Please fill in all required fields");
      return;
    }

    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount <= 0) {
      alert("Please enter a valid amount");
      return;
    }

    // If no splits specified, split evenly among all members
    let splitBetween = [];
    
    if (formData.splits.length === 0 && selectedGroup && selectedGroup.members) {
      // Auto-split evenly
      const splitAmount = amount / selectedGroup.members.length;
      splitBetween = selectedGroup.members.map((member) => ({
        user: member.id,
        amount: parseFloat(splitAmount.toFixed(2)),
      }));
    } else {
      // Use provided splits
      const totalSplit = formData.splits.reduce(
        (sum, split) => sum + parseFloat(split.amount || 0),
        0
      );

      if (Math.abs(totalSplit - amount) > 0.01) {
        alert(
          `Split amounts (${totalSplit.toFixed(2)}) must equal total amount (${amount.toFixed(2)})`
        );
        return;
      }

      splitBetween = formData.splits.map((split) => ({
        user: split.userId,
        amount: parseFloat(split.amount),
      }));
    }

    try {

      const response = await apiFetch(
        `${API_URL}/expenses/group/${selectedGroupId}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: formData.title,
            amount: amount,
            paidBy: formData.paidBy,
            splitBetween: splitBetween,
          }),
        }
      );

      const data = await response.json();
      if (!response.ok)
        throw new Error(data.message || "Failed to create expense");

      alert("Expense created successfully from receipt!");
      if (onExpenseCreated) onExpenseCreated();
      onClose();
    } catch (error) {
      alert(error.message || "Failed to create expense");
    }
  };

  const addSplitRow = () => {
    setFormData({
      ...formData,
      splits: [
        ...formData.splits,
        { userId: "", amount: "" },
      ],
    });
  };

  const removeSplitRow = (index) => {
    setFormData({
      ...formData,
      splits: formData.splits.filter((_, i) => i !== index),
    });
  };

  const updateSplit = (index, field, value) => {
    const newSplits = [...formData.splits];
    newSplits[index] = { ...newSplits[index], [field]: value };
    setFormData({ ...formData, splits: newSplits });
  };

  return (
    <>
      {/* ── Fullscreen Camera UI ── */}
      {mode === "camera" && (
        <div className="fixed inset-0 z-[60] bg-black flex flex-col">
          {/* Video feed */}
          <div className="flex-1 relative overflow-hidden">
            <video
              ref={(el) => { videoRef.current = el; if (el && streamRef.current) { el.srcObject = streamRef.current; el.play().catch(() => {}); } }}
              autoPlay
              playsInline
              muted
              className={`absolute inset-0 w-full h-full object-cover ${facingMode === "user" ? "scale-x-[-1]" : ""}`}
            />
            {/* Receipt guide overlay */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="border-2 border-white/60 rounded-xl w-[85%] h-[65%] shadow-[0_0_0_9999px_rgba(0,0,0,0.45)]" />
            </div>
            {/* Top bar */}
            <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center">
              <button
                onClick={stopCamera}
                className="bg-black/50 text-white p-2 rounded-full"
              >
                <FiX className="text-xl" />
              </button>
              <span className="text-white/80 text-sm font-medium">Position receipt inside the frame</span>
              <button
                onClick={flipCamera}
                className="bg-black/50 text-white p-2 rounded-full"
              >
                <FiRefreshCw className="text-xl" />
              </button>
            </div>
          </div>
          {/* Bottom shutter bar */}
          <div className="bg-black h-32 flex items-center justify-center">
            <button
              onClick={capturePhoto}
              className="w-18 h-18 rounded-full border-4 border-white flex items-center justify-center active:scale-95 transition-transform"
              style={{ width: 72, height: 72 }}
            >
              <div className="w-14 h-14 rounded-full bg-white" />
            </button>
          </div>
        </div>
      )}

    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full p-4 sm:p-6 my-8 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-2xl font-bold text-gray-800">Scan Receipt</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <FiX className="text-xl" />
          </button>
        </div>

        {mode !== "camera" && !image ? (
          <>
          {/* Initial Mode Selection */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={startCamera}
                className="p-8 border-2 border-dashed border-pink-500 rounded-xl hover:bg-pink-50 transition flex flex-col items-center justify-center gap-3"
              >
                <FiCamera className="text-4xl text-pink-500" />
                <span className="font-semibold text-gray-800">Open Camera</span>
                <span className="text-sm text-gray-500">Take a photo of receipt</span>
              </button>

              <label className="p-8 border-2 border-dashed border-orange-500 rounded-xl hover:bg-orange-50 transition flex flex-col items-center justify-center gap-3 cursor-pointer">
                <FiUpload className="text-4xl text-orange-500" />
                <span className="font-semibold text-gray-800">Upload Photo</span>
                <span className="text-sm text-gray-500">Select from device</span>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>
          </div>
          </>
        ) : (
          <div className="space-y-4">
            {/* Image Preview */}
            {imageUrl && (
              <div className="space-y-4">
                <div className="relative">
                  <img
                    src={imageUrl}
                    alt="Receipt"
                    className="w-full rounded-lg border-2 border-gray-200"
                  />
                  {!extractedData && (
                    <button
                      onClick={() => {
                        setImage(null);
                        setImageUrl(null);
                        setExtractedData(null);
                        if (imageUrl) URL.revokeObjectURL(imageUrl);
                      }}
                      className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600"
                    >
                      <FiX />
                    </button>
                  )}
                </div>

                {!extractedData && (
                  <div className="space-y-3">
                    {/* Group Selection before scanning */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Select Group *</label>
                      <select
                        value={selectedGroupId || ""}
                        onChange={(e) => setSelectedGroupId(e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                      >
                        <option value="">Select a group...</option>
                        {groups.map((group) => (
                          <option key={group.id} value={group.id}>
                            {group.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  <div className="flex gap-3 flex-col sm:flex-row">
                    <button
                      onClick={scanReceipt}
                      disabled={scanning || !selectedGroupId}
                      className="flex-1 bg-gradient-to-r from-pink-500 to-orange-400 text-white px-6 py-3 rounded-lg font-semibold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {scanning ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                          Scanning Receipt...
                        </>
                      ) : (
                        <>
                          <FiCheck />
                          Scan Receipt
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => {
                        setImage(null);
                        setImageUrl(null);
                        setExtractedData(null);
                        if (imageUrl) URL.revokeObjectURL(imageUrl);
                      }}
                      className="px-6 py-3 border rounded-lg text-gray-700 hover:bg-gray-50"
                    >
                      Retake
                    </button>
                  </div>
                  </div>
                )}

                {scanning && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-blue-800 text-sm">
                      Analyzing receipt image... This may take a few seconds.
                    </p>
                  </div>
                )}

                {/* Extracted Data Form */}
                {extractedData && (
                  <form onSubmit={handleCreateExpense} className="space-y-4">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <p className="text-green-800 text-sm font-semibold mb-2">
                        ✓ Receipt scanned successfully!
                      </p>
                      {extractedData.rawText && (
                        <details className="text-xs text-green-700">
                          <summary className="cursor-pointer">View extracted text</summary>
                          <pre className="mt-2 whitespace-pre-wrap max-h-32 overflow-y-auto">
                            {extractedData.rawText.substring(0, 500)}
                          </pre>
                        </details>
                      )}
                    </div>

                    {/* Group Selection (post-scan, can still change) */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Select Group *
                      </label>
                      <select
                        value={selectedGroupId || ""}
                        onChange={(e) => setSelectedGroupId(e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                        required
                      >
                        <option value="">Select a group...</option>
                        {groups.map((group) => (
                          <option key={group.id} value={group.id}>
                            {group.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Title */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Expense Title *
                      </label>
                      <input
                        type="text"
                        value={formData.title}
                        onChange={(e) =>
                          setFormData({ ...formData, title: e.target.value })
                        }
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                        required
                      />
                    </div>

                    {/* Amount */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Total Amount *
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.amount}
                        onChange={(e) =>
                          setFormData({ ...formData, amount: e.target.value })
                        }
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                        required
                      />
                    </div>

                    {/* Paid By */}
                    {selectedGroup && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Paid By *
                        </label>
                        <select
                          value={formData.paidBy || ""}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              paidBy: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                          required
                        >
                          <option value="">Select member...</option>
                          {selectedGroup.members?.map((member) => (
                            <option key={member.id} value={member.id}>
                              {member.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {/* Splits */}
                    {selectedGroup && (
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <label className="block text-sm font-medium text-gray-700">
                            Split Between *
                          </label>
                          <button
                            type="button"
                            onClick={addSplitRow}
                            className="text-sm text-pink-500 hover:text-pink-600 flex items-center gap-1"
                          >
                            <FiPlus /> Add Person
                          </button>
                        </div>

                        {formData.splits.length === 0 && (
                          <p className="text-xs text-gray-500 mb-2">
                            Amount will be split evenly among all members if no splits are added
                          </p>
                        )}

                        {formData.splits.map((split, index) => (
                          <div key={index} className="flex gap-2 mb-2 flex-col sm:flex-row">
                            <select
                              value={split.userId || ""}
                              onChange={(e) =>
                                updateSplit(index, "userId", e.target.value)
                              }
                              className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                              required
                            >
                              <option value="">Select member...</option>
                              {selectedGroup.members?.map((member) => (
                                <option key={member.id} value={member.id}>
                                  {member.name}
                                </option>
                              ))}
                            </select>
                            <input
                              type="number"
                              step="0.01"
                              value={split.amount}
                              onChange={(e) =>
                                updateSplit(index, "amount", e.target.value)
                              }
                              className="w-32 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                              placeholder="Amount"
                              required
                            />
                            <button
                              type="button"
                              onClick={() => removeSplitRow(index)}
                              className="px-3 py-2 text-red-500 hover:bg-red-50 rounded-lg"
                            >
                              <FiX />
                            </button>
                          </div>
                        ))}

                        {formData.amount && (
                          <p className="text-sm mt-2">
                            Total split:{" "}
                            <span className="font-semibold">
                              ₹{formData.splits.reduce(
                                (sum, split) =>
                                  sum + parseFloat(split.amount || 0),
                                0
                              ).toFixed(2)}
                            </span>
                            {" / "}
                            Total amount:{" "}
                            <span className="font-semibold">
                              ₹{parseFloat(formData.amount || 0).toFixed(2)}
                            </span>
                          </p>
                        )}
                      </div>
                    )}

                    <div className="flex gap-3 pt-4">
                      <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 px-4 py-2 border rounded-lg text-gray-700 hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="flex-1 px-4 py-2 bg-gradient-to-r from-pink-500 to-orange-400 text-white rounded-lg hover:opacity-90"
                      >
                        Create Expense
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
    </>
  );
}

