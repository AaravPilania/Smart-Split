import { useState, useRef, useEffect, useCallback } from "react";
import { FiCamera, FiUpload, FiX, FiCheck, FiPlus, FiRefreshCw, FiCreditCard, FiChevronRight, FiUserPlus, FiCopy } from "react-icons/fi";
import jsQR from "jsqr";
import Tesseract from "tesseract.js";
import { apiFetch } from "../utils/api";
import { useTheme, getGradientStyle } from "../utils/theme";
import { CATEGORIES, detectCategory, detectCategoryFromText, getCategoryInfo } from "../utils/categories";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export default function ScanReceipt({ 
  groups, 
  userId, 
  onExpenseCreated,
  onClose 
}) {
  const { theme } = useTheme();
  const [mode, setMode] = useState(null); // 'camera', 'upload', or 'qrscan'
  const [image, setImage] = useState(null);
  const [imageUrl, setImageUrl] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [extractedData, setExtractedData] = useState(null);
  const [selectedGroupId, setSelectedGroupId] = useState(null);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [qrResult, setQrResult] = useState(null); // { pa, pn, am, rawUrl } when a UPI QR is decoded
  const [qrPayAmount, setQrPayAmount] = useState("");  // editable amount for QR pay confirmation
  const [friendQrResult, setFriendQrResult] = useState(null); // { id, name, email } when a friend QR is detected
  const [friendQrSending, setFriendQrSending] = useState(false);
  const [friendQrSent, setFriendQrSent] = useState(false);

  // ── Settle Payment flow state ──
  const [settleStep, setSettleStep] = useState(null); // null | "pick" | "appPicker"
  const [settleLoading, setSettleLoading] = useState(false);
  const [settleList, setSettleList] = useState([]);
  const [selectedSettle, setSelectedSettle] = useState(null);
  const [defaultUpiApp, setDefaultUpiApp] = useState(() => {
    try { return localStorage.getItem("smartsplit_default_upi_app") || null; } catch { return null; }
  });
  const [showAllApps, setShowAllApps] = useState(false);

  const UPI_APPS = [
    { key: "gpay",    label: "Google Pay",  scheme: "upi://pay", initial: "G", bg: "bg-blue-500" },
    { key: "phonepe", label: "PhonePe",     scheme: "upi://pay", initial: "P", bg: "bg-purple-600" },
    { key: "paytm",   label: "Paytm",       scheme: "upi://pay", initial: "₹", bg: "bg-sky-500" },
    { key: "generic", label: "Other UPI",   scheme: "upi://pay", initial: "U", bg: "bg-gray-500" },
  ];

  const [formData, setFormData] = useState({
    title: "",
    amount: "",
    paidBy: userId,
    splits: [],
    category: "other",
  });

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const fileInputRef = useRef(null);
  const hintTimerRef = useRef(null);
  const qrLoopRef = useRef(null);   // holds requestAnimationFrame id for QR scan loop
  const qrCanvasRef = useRef(null); // off-screen canvas for QR scanning
  const [facingMode, setFacingMode] = useState("environment");
  const [showHint, setShowHint] = useState(false);

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
    if (mode === "qrscan") {
      const t = setTimeout(() => { attachStream(); startQRLoop(); }, 100);
      return () => clearTimeout(t);
    }
  }, [mode, attachStream]); // eslint-disable-line react-hooks/exhaustive-deps

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
      if (hintTimerRef.current) clearTimeout(hintTimerRef.current);
      if (qrLoopRef.current) cancelAnimationFrame(qrLoopRef.current);
    };
  }, [imageUrl]);

  const applyStream = (stream) => {
    streamRef.current = stream;
    // Detect the actual facing mode so flipCamera state is always accurate
    const track = stream.getVideoTracks()[0];
    if (track) {
      const settings = track.getSettings();
      if (settings.facingMode) setFacingMode(settings.facingMode);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch(() => {});
    }
    // Only show the receipt hint when in receipt-camera mode (not QR scan)
    if (mode !== "qrscan") {
      if (mode !== "camera") setMode("camera");
      setShowHint(true);
      if (hintTimerRef.current) clearTimeout(hintTimerRef.current);
      hintTimerRef.current = setTimeout(() => setShowHint(false), 5000);
    }
  };

  const startCamera = async (facing = "environment") => {
    // Check for camera API availability (requires HTTPS or localhost)
    if (!navigator.mediaDevices?.getUserMedia) {
      alert("Camera access is not available. Make sure you're using a secure connection (HTTPS) and your browser supports camera access.");
      return;
    }

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
      } catch (err) {
        if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
          alert("Camera permission was denied. Please allow camera access in your browser settings and try again.");
          return;
        }
        if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
          alert("No camera found on this device.");
          return;
        }
        // For other errors (OverconstrainedError etc.) try next constraint set
      }
    }
    alert("Unable to access camera. Please check your camera is connected and try again.");
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
    if (qrLoopRef.current) {
      cancelAnimationFrame(qrLoopRef.current);
      qrLoopRef.current = null;
    }
    setMode(null);
  };

  // ── QR Scan helpers ────────────────────────────────────────────────────────

  // Parse a UPI deep-link string into { pa, pn, am, rawUrl }
  const parseUpiUrl = (raw) => {
    try {
      const url = new URL(raw.replace(/^upi:\/\/pay\?/, "https://x.com?"));
      return {
        pa: url.searchParams.get("pa") || "",
        pn: url.searchParams.get("pn") || "",
        am: url.searchParams.get("am") || "",
        rawUrl: raw,
      };
    } catch {
      return { pa: raw, pn: "", am: "", rawUrl: raw };
    }
  };

  // Start the RAF loop that reads frames and looks for a QR code
  const startQRLoop = () => {
    if (!qrCanvasRef.current) {
      qrCanvasRef.current = document.createElement("canvas");
    }
    const canvas = qrCanvasRef.current;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });

    const tick = () => {
      const video = videoRef.current;
      if (!video || video.readyState < 2) {
        qrLoopRef.current = requestAnimationFrame(tick);
        return;
      }
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const found = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: "dontInvert",
      });
      if (found) {
        const raw = found.data;
        if (raw.toLowerCase().startsWith("upi://")) {
          // Stop the loop + camera, then show result
          cancelAnimationFrame(qrLoopRef.current);
          qrLoopRef.current = null;
          if (streamRef.current) {
            streamRef.current.getTracks().forEach((t) => t.stop());
            streamRef.current = null;
          }
          if (videoRef.current) videoRef.current.srcObject = null;
          const parsed = parseUpiUrl(raw);
          setQrResult(parsed);
          setQrPayAmount(parsed.am || "");
          setMode(null); // close fullscreen camera, show modal body
          return;
        }
        // Detect friend QR codes (e.g. https://thesmartsplit.netlify.app/add-friend/<24-hex-id>)
        const friendMatch = raw.match(/\/add-friend\/([a-f0-9]{24})/i);
        if (friendMatch) {
          cancelAnimationFrame(qrLoopRef.current);
          qrLoopRef.current = null;
          if (streamRef.current) {
            streamRef.current.getTracks().forEach((t) => t.stop());
            streamRef.current = null;
          }
          if (videoRef.current) videoRef.current.srcObject = null;
          setMode(null);
          handleFriendQrDetected(friendMatch[1]);
          return;
        }
      }
      qrLoopRef.current = requestAnimationFrame(tick);
    };
    qrLoopRef.current = requestAnimationFrame(tick);
  };

  const startQRScan = async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      alert("Camera access is not available. Make sure you're on HTTPS.");
      return;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      const track = stream.getVideoTracks()[0];
      if (track?.getSettings().facingMode) setFacingMode(track.getSettings().facingMode);
      setMode("qrscan"); // triggers useEffect → attachStream + startQRLoop
    } catch (err) {
      if (err.name === "NotAllowedError") {
        alert("Camera permission denied. Allow camera access and try again.");
      } else {
        alert("Unable to access camera.");
      }
    }
  };

  const resetQRScan = () => {
    setQrResult(null);
    setQrPayAmount("");
    setFriendQrResult(null);
    setFriendQrSending(false);
    setFriendQrSent(false);
    startQRScan();
  };

  // Fetch profile after a friend QR is detected and show add-friend UI
  const handleFriendQrDetected = async (friendId) => {
    try {
      const resp = await fetch(`${API_URL}/auth/profile/${friendId}`);
      const data = await resp.json();
      setFriendQrResult({ id: friendId, name: data.user?.name || '', email: data.user?.email || '' });
    } catch {
      setFriendQrResult({ id: friendId, name: '', email: '' });
    }
  };

  const sendFriendQrRequest = async () => {
    if (!friendQrResult?.id) return;
    setFriendQrSending(true);
    try {
      const res = await apiFetch(`${API_URL}/friends/request/${friendQrResult.id}`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) { alert(data.message); return; }
      setFriendQrSent(true);
    } catch {
      alert('Something went wrong. Please try again.');
    } finally {
      setFriendQrSending(false);
    }
  };

  // ── Settle Payment helpers ──────────────────────────────────────────────

  const startSettleFlow = async () => {
    setSettleStep("pick");
    setSettleLoading(true);
    setSettleList([]);
    try {
      // Fetch settlements for every group the user belongs to
      const all = [];
      for (const g of groups) {
        try {
          const res = await apiFetch(`${API_URL}/expenses/group/${g.id}/settlements`);
          if (res.ok) {
            const data = await res.json();
            (data.settlements || []).forEach((s) => {
              if (String(s.from?.id) === String(userId)) {
                all.push({ ...s, groupName: g.name, groupId: g.id });
              }
            });
          }
        } catch (_) { /* skip group on error */ }
      }
      // Fetch payee UPI IDs when missing
      const seen = new Set();
      for (const s of all) {
        const payeeId = s.to?.id;
        if (!payeeId || seen.has(payeeId) || s.to.upiId) continue;
        seen.add(payeeId);
        try {
          const r = await apiFetch(`${API_URL}/auth/profile/${payeeId}`);
          if (r.ok) {
            const p = await r.json();
            const upi = p.user?.upiId || p.upiId || "";
            all.forEach((item) => { if (String(item.to?.id) === String(payeeId)) item.to.upiId = upi; });
          }
        } catch (_) {}
      }
      setSettleList(all);
    } catch (_) {
      setSettleList([]);
    }
    setSettleLoading(false);
  };

  const pickSettlement = (settle) => {
    setSelectedSettle(settle);
    setShowAllApps(false);
    setSettleStep("appPicker");
  };

  const openWithApp = (appKey, setAsDefault) => {
    const app = UPI_APPS.find((a) => a.key === appKey) || UPI_APPS[3];
    const s = selectedSettle;
    if (!s) return;
    const upiId = s.to?.upiId;
    if (!upiId) {
      alert(`${s.to?.name || "This person"} hasn't set their UPI ID yet.`);
      return;
    }
    if (setAsDefault) {
      try { localStorage.setItem("smartsplit_default_upi_app", appKey); } catch {}
      setDefaultUpiApp(appKey);
    }
    const params = new URLSearchParams({
      pa: upiId,
      pn: s.to?.name || "",
      am: parseFloat(s.amount).toFixed(2),
      cu: "INR",
      tn: `SmartSplit: ${s.groupName || ""}`,
    });
    window.location.href = `${app.scheme}?${params.toString()}`;
  };

  const clearDefaultApp = () => {
    try { localStorage.removeItem("smartsplit_default_upi_app"); } catch {}
    setDefaultUpiApp(null);
  };

  const resetSettleFlow = () => {
    setSettleStep(null);
    setSettleLoading(false);
    setSettleList([]);
    setSelectedSettle(null);
    setShowAllApps(false);
  };

  // ─────────────────────────────────────────────────────────────────────────

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
      /\b\d{6}\b/,                     // Indian pin codes
      /\d{10,}/,                        // Phone numbers, GSTIN etc.
      /GST|GSTIN|CIN|FSSAI|PAN\s*:/i,  // Registration numbers
      /,.*,.*,/,                        // Lines with 3+ commas (addresses)
      /\b(road|street|lane|nagar|colony|sector|block|floor|plot|marg|circle|chowk|avenue|city|town|dist)\b/i,
      /^\+?\d{2,4}[\s-]\d/,            // Phone numbers at start
    ];

    let title = "";
    for (const line of lines.slice(0, 10)) {
      if (skipRx.some(p => p.test(line))) continue;
      if (line.length < 3 || line.length > 50) continue;
      if (/^\d+$/.test(line) || /@/.test(line)) continue;
      // Prefer ALL-CAPS lines (restaurant/store name pattern) — but not too long
      if (line === line.toUpperCase() && /[A-Z]{2,}/.test(line) && line.length <= 40) { title = line; break; }
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

      const autoCategory = detectCategoryFromText(data.text) || detectCategory(extracted.title);

      setFormData({
        title: extracted.title,
        amount: extracted.amount > 0 ? extracted.amount.toString() : "",
        paidBy: userId,
        splits: splits,
        category: autoCategory,
      });

      // Fire Gemini AI suggestion — updates category silently if AI has higher confidence
      (async () => {
        try {
          const sgRes = await apiFetch(`${API_URL}/expenses/suggest-category`, {
            method: 'POST',
            body: JSON.stringify({ title: extracted.title, ocrText: data.text.slice(0, 500) }),
          });
          if (sgRes.ok) {
            const sgData = await sgRes.json();
            if (sgData.source === 'ai' && sgData.category) {
              setFormData(f => ({ ...f, category: sgData.category }));
            }
          }
        } catch (_) { /* fail silently — local detection already set */ }
      })();

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
            category: formData.category || "other",
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
      {/* ── Fullscreen Camera UI (receipt) ── */}
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
          {/* 5-second photo tip */}
          {showHint && (
            <div className="absolute inset-x-0 bottom-36 flex justify-center px-6 pointer-events-none">
              <div className="bg-black/75 backdrop-blur-sm text-white text-[13px] px-5 py-3 rounded-2xl text-center max-w-xs shadow-xl leading-snug">
                📸 Hold steady — take a clear, close picture of the bill for best results
              </div>
            </div>
          )}
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

      {/* ── Fullscreen QR Scan UI ── */}
      {mode === "qrscan" && (
        <div className="fixed inset-0 z-[60] bg-black flex flex-col">
          <div className="flex-1 relative overflow-hidden">
            <video
              ref={(el) => { videoRef.current = el; if (el && streamRef.current) { el.srcObject = streamRef.current; el.play().catch(() => {}); } }}
              autoPlay
              playsInline
              muted
              className="absolute inset-0 w-full h-full object-cover"
            />
            {/* Square QR guide overlay */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="relative w-64 h-64">
                {/* Dark vignette around guide */}
                <div className="absolute inset-0 shadow-[0_0_0_9999px_rgba(0,0,0,0.55)]" />
                {/* Animated corner brackets */}
                <div className="absolute inset-0 border-2 border-white/30 rounded-lg" />
                <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-white rounded-tl-lg" />
                <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-white rounded-tr-lg" />
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-white rounded-bl-lg" />
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-white rounded-br-lg" />
                {/* Scanning beam */}
                <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-0.5 bg-gradient-to-r from-transparent via-green-400 to-transparent opacity-80 animate-pulse" />
              </div>
            </div>
            {/* Top bar */}
            <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center">
              <button
                onClick={stopCamera}
                className="bg-black/50 text-white p-2 rounded-full"
              >
                <FiX className="text-xl" />
              </button>
              <span className="text-white/80 text-sm font-medium">Point camera at UPI QR Code</span>
              <div className="w-10" />{/* spacer */}
            </div>
          </div>
          {/* Bottom label */}
          <div className="bg-black h-24 flex flex-col items-center justify-center gap-1">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-white/70 text-sm">Scanning for QR code…</span>
            </div>
            <span className="text-white/40 text-xs">Works with GPay, PhonePe, Paytm, any UPI QR</span>
          </div>
        </div>
      )}

    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-3xl w-full p-4 sm:p-6 my-8 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-2xl font-bold text-gray-800 dark:text-white">
            {settleStep ? "Settle Payment" : friendQrResult ? "Add Friend" : qrResult ? "Pay via UPI" : "Scan Receipt"}
          </h3>
          <button
            onClick={() => { setQrResult(null); setQrPayAmount(""); setFriendQrResult(null); setFriendQrSent(false); resetSettleFlow(); onClose(); }}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            <FiX className="text-xl" />
          </button>
        </div>

        {/* ── Friend QR Result ── */}
        {friendQrResult && !qrResult && (
          <div className="space-y-4">
            <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700 rounded-xl p-4 flex items-center gap-3">
              <FiUserPlus className="text-purple-500 text-xl flex-shrink-0" />
              <div>
                <p className="font-semibold text-purple-800 dark:text-purple-300 text-sm">Friend QR Detected!</p>
                <p className="text-xs text-purple-600 dark:text-purple-400 mt-0.5">Scan your friend's QR to connect</p>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-xl p-5 flex flex-col items-center gap-3">
              <div className="h-16 w-16 rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-lg" style={getGradientStyle(theme)}>
                {friendQrResult.name?.[0]?.toUpperCase() || "?"}
              </div>
              {friendQrResult.name && <p className="text-lg font-bold text-gray-900 dark:text-white">{friendQrResult.name}</p>}
              {friendQrResult.email && <p className="text-sm text-gray-500 dark:text-gray-400">{friendQrResult.email}</p>}
            </div>

            {friendQrSent ? (
              <div className="py-4 text-center">
                <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-3">
                  <FiCheck className="text-green-600 dark:text-green-400 text-xl" />
                </div>
                <p className="font-semibold text-green-700 dark:text-green-400">Request Sent!</p>
                <p className="text-sm text-gray-500 mt-1">You'll be friends once they accept.</p>
              </div>
            ) : (
              <button
                onClick={sendFriendQrRequest}
                disabled={friendQrSending}
                className="w-full py-3 rounded-xl text-white font-bold flex items-center justify-center gap-2 disabled:opacity-70"
                style={getGradientStyle(theme)}
              >
                {friendQrSending
                  ? <span className="h-4 w-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                  : <FiUserPlus size={16} />}
                {friendQrSending ? 'Sending…' : 'Send Friend Request'}
              </button>
            )}

            <button
              onClick={() => { setFriendQrResult(null); setFriendQrSent(false); startQRScan(); }}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 text-sm font-medium transition"
            >
              <FiRefreshCw size={14} /> Scan Again
            </button>
          </div>
        )}

        {/* ── QR Result Confirmation ── */}
        {qrResult && (
          <div className="space-y-4">
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-xl p-4 flex items-center gap-3">
              <FiCheck className="text-green-500 text-xl flex-shrink-0" />
              <div>
                <p className="font-semibold text-green-800 dark:text-green-300 text-sm">QR Code Detected!</p>
                <p className="text-xs text-green-700 dark:text-green-400 font-mono mt-0.5">{qrResult.pa}</p>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-xl p-4 space-y-3">
              {qrResult.pn && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Paying to</span>
                  <span className="font-semibold text-gray-900 dark:text-white">{qrResult.pn}</span>
                </div>
              )}
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500 dark:text-gray-400">UPI ID</span>
                <span className="font-mono text-sm text-gray-700 dark:text-gray-300">{qrResult.pa}</span>
              </div>
              <div>
                <label className="block text-sm text-gray-500 dark:text-gray-400 mb-1">Amount (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={qrPayAmount}
                  onChange={(e) => setQrPayAmount(e.target.value)}
                  className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:outline-none focus:ring-2 text-lg font-semibold"
                  placeholder="Enter amount"
                  autoFocus
                />
                {qrResult.am && (
                  <p className="text-xs text-gray-400 mt-1">Pre-filled from QR · you can adjust if needed</p>
                )}
              </div>
            </div>

            <a
              href={qrPayAmount && parseFloat(qrPayAmount) > 0
                ? `upi://pay?pa=${encodeURIComponent(qrResult.pa)}&pn=${encodeURIComponent(qrResult.pn)}&am=${parseFloat(qrPayAmount).toFixed(2)}&cu=INR&tn=SmartSplit`
                : `upi://pay?pa=${encodeURIComponent(qrResult.pa)}&pn=${encodeURIComponent(qrResult.pn)}&cu=INR&tn=SmartSplit`
              }
              className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl text-white font-semibold text-sm ${
                (!qrPayAmount || parseFloat(qrPayAmount) <= 0) ? "opacity-50 pointer-events-none" : ""
              }`}
              style={getGradientStyle(theme)}
              onClick={(e) => {
                if (!qrPayAmount || parseFloat(qrPayAmount) <= 0) { e.preventDefault(); }
              }}
            >
              <FiCreditCard size={16} /> Open UPI App &amp; Pay
            </a>

            <button
              onClick={resetQRScan}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 text-sm font-medium transition"
            >
              <FiRefreshCw size={14} /> Scan Again
            </button>

            <button
              onClick={() => { setQrResult(null); setQrPayAmount(""); onClose(); }}
              className="w-full py-2 text-xs text-gray-400 hover:text-gray-600 transition"
            >
              Close
            </button>
          </div>
        )}

        {/* ── Settle Payment: Pick Settlement ── */}
        {settleStep === "pick" && (
          <div className="space-y-4">
            {settleLoading ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3">
                <div className={`animate-spin rounded-full h-10 w-10 border-b-2 ${theme.spinner}`}></div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Loading settlements…</p>
              </div>
            ) : settleList.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-gray-500 dark:text-gray-400 text-lg font-semibold mb-1">All settled up!</p>
                <p className="text-sm text-gray-400 dark:text-gray-500 mb-4">You don&apos;t owe anyone right now.</p>
                <button onClick={resetSettleFlow} className="text-sm font-medium" style={{ color: theme.gradFrom }}>Go Back</button>
              </div>
            ) : (
              <>
                <p className="text-sm text-gray-500 dark:text-gray-400">Select a payment to settle:</p>
                <div className="space-y-2">
                  {settleList.map((s, idx) => (
                    <button
                      key={idx}
                      onClick={() => pickSettlement(s)}
                      className="w-full flex items-center gap-3 p-4 rounded-xl border dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition text-left"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-800 dark:text-white truncate">Pay {s.to?.name || "Unknown"}</p>
                        <p className="text-xs text-gray-400 dark:text-gray-500">{s.groupName}</p>
                        {s.to?.upiId && <p className="text-xs font-mono text-gray-400 mt-0.5">{s.to.upiId}</p>}
                        {!s.to?.upiId && <p className="text-xs text-amber-500 mt-0.5">No UPI ID set</p>}
                      </div>
                      <span className="text-lg font-bold text-gray-900 dark:text-white flex-shrink-0">₹{parseFloat(s.amount).toFixed(2)}</span>
                      <FiChevronRight className="text-gray-400 flex-shrink-0" />
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => { resetSettleFlow(); startQRScan(); }}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 text-sm font-medium transition"
                >
                  <FiCreditCard size={14} /> Scan QR Instead
                </button>
                <button onClick={resetSettleFlow} className="w-full py-2 text-xs text-gray-400 hover:text-gray-600 transition">Back</button>
              </>
            )}
          </div>
        )}

        {/* ── Settle Payment: UPI App Picker ── */}
        {settleStep === "appPicker" && selectedSettle && (
          <div className="space-y-4">
            {/* Payment summary */}
            <div className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-xl p-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Paying</p>
                  <p className="font-semibold text-gray-800 dark:text-white">{selectedSettle.to?.name}</p>
                  {selectedSettle.to?.upiId && <p className="text-xs font-mono text-gray-400 mt-0.5">{selectedSettle.to.upiId}</p>}
                </div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">₹{parseFloat(selectedSettle.amount).toFixed(2)}</p>
              </div>
            </div>

            {!selectedSettle.to?.upiId ? (
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl p-4 text-center">
                <p className="text-amber-700 dark:text-amber-300 font-semibold text-sm mb-1">{selectedSettle.to?.name} hasn&apos;t set their UPI ID</p>
                <p className="text-xs text-amber-600 dark:text-amber-400">Ask them to update their profile, or scan their QR code instead.</p>
                <button onClick={() => { resetSettleFlow(); startQRScan(); }} className="mt-3 text-sm font-medium" style={{ color: theme.gradFrom }}>Scan QR Instead</button>
              </div>
            ) : defaultUpiApp && !showAllApps ? (
              /* ── Default app view ── */
              <div className="space-y-3">
                <p className="text-xs text-center text-gray-400 dark:text-gray-500 uppercase tracking-wide">Your default app</p>
                <button
                  onClick={() => openWithApp(defaultUpiApp, false)}
                  className="w-full py-4 rounded-2xl text-white font-bold text-base flex items-center justify-center gap-3 shadow-lg active:scale-[0.98] transition-transform"
                  style={getGradientStyle(theme)}
                >
                  <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                    UPI_APPS.find(a => a.key === defaultUpiApp)?.bg || "bg-white/20"
                  }`}>
                    {UPI_APPS.find(a => a.key === defaultUpiApp)?.initial}
                  </span>
                  Pay with {UPI_APPS.find(a => a.key === defaultUpiApp)?.label}
                </button>
                <div className="flex justify-center gap-6 pt-0.5">
                  <button
                    onClick={() => setShowAllApps(true)}
                    className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition underline-offset-2 hover:underline"
                  >
                    Use a different app
                  </button>
                  <button
                    onClick={() => { clearDefaultApp(); setShowAllApps(false); }}
                    className="text-xs text-red-400 hover:text-red-600 dark:hover:text-red-300 transition underline-offset-2 hover:underline"
                  >
                    Remove default
                  </button>
                </div>
              </div>
            ) : (
              /* ── All apps list ── */
              <div className="space-y-2">
                <p className="text-xs text-gray-400 dark:text-gray-500">Choose a payment app:</p>
                {UPI_APPS.map((app) => (
                  <div key={app.key} className="flex items-center gap-3 p-3 pr-4 rounded-xl border dark:border-gray-700 bg-white dark:bg-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-800 transition">
                    <div className={`w-10 h-10 rounded-full ${app.bg} flex items-center justify-center text-white font-bold text-base flex-shrink-0`}>
                      {app.initial}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="font-semibold text-sm text-gray-800 dark:text-white">{app.label}</p>
                        {defaultUpiApp === app.key && (
                          <span className="text-[10px] bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 px-1.5 py-0.5 rounded-full font-medium">Default</span>
                        )}
                      </div>
                      {defaultUpiApp !== app.key && (
                        <button
                          onClick={() => {
                            try { localStorage.setItem("smartsplit_default_upi_app", app.key); } catch {}
                            setDefaultUpiApp(app.key);
                            setShowAllApps(false);
                          }}
                          className="text-[11px] text-blue-400 hover:text-blue-600 dark:hover:text-blue-300 transition mt-0.5 block"
                        >
                          Set as default
                        </button>
                      )}
                    </div>
                    <button
                      onClick={() => openWithApp(app.key, false)}
                      className="px-4 py-2 rounded-xl text-white text-sm font-semibold flex-shrink-0"
                      style={getGradientStyle(theme)}
                    >
                      Pay
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Copy UPI details fallback */}
            {selectedSettle.to?.upiId && (
              <button
                onClick={() => {
                  const s = selectedSettle;
                  if (!s?.to?.upiId) return;
                  const text = `UPI ID: ${s.to.upiId} | Name: ${s.to.name} | Amount: ₹${parseFloat(s.amount).toFixed(2)}`;
                  navigator.clipboard?.writeText(text).then(() => alert('Copied! Open your UPI app and paste.'));
                }}
                className="w-full flex items-center justify-center gap-2 py-2 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition border dark:border-gray-700 rounded-lg"
              >
                <FiCopy size={13} /> Copy UPI details
              </button>
            )}

            <button onClick={() => setSettleStep("pick")} className="w-full py-2 text-xs text-gray-400 hover:text-gray-600 transition">← Back to settlements</button>
          </div>
        )}

        {!qrResult && !settleStep && mode !== "camera" && mode !== "qrscan" && !image ? (
          <>
          {/* Initial Mode Selection */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                onClick={startCamera}
                className="p-6 border-2 border-dashed rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition flex flex-col items-center justify-center gap-3"
                style={{ borderColor: theme.gradFrom }}
              >
                <FiCamera className="text-4xl" style={{ color: theme.gradFrom }} />
                <span className="font-semibold text-gray-800 dark:text-white">Open Camera</span>
                <span className="text-sm text-gray-500 dark:text-gray-400 text-center">Take a photo of receipt</span>
              </button>

              <label className="p-6 border-2 border-dashed rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition flex flex-col items-center justify-center gap-3 cursor-pointer" style={{ borderColor: theme.gradTo }}>
                <FiUpload className="text-4xl" style={{ color: theme.gradTo }} />
                <span className="font-semibold text-gray-800 dark:text-white">Upload Photo</span>
                <span className="text-sm text-gray-500 dark:text-gray-400 text-center">Select from device</span>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>

              <button
                onClick={startSettleFlow}
                className="p-6 border-2 border-dashed rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition flex flex-col items-center justify-center gap-3"
                style={{ borderColor: "#22c55e" }}
              >
                <FiCreditCard className="text-4xl" style={{ color: "#22c55e" }} />
                <span className="font-semibold text-gray-800 dark:text-white">Settle Payment</span>
                <span className="text-sm text-gray-500 dark:text-gray-400 text-center">Pay what you owe via UPI</span>
              </button>
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
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Select Group *</label>
                      <select
                        value={selectedGroupId || ""}
                        onChange={(e) => setSelectedGroupId(e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                        style={{ "--tw-ring-color": theme.gradFrom }}
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
                      className="flex-1 text-white px-6 py-3 rounded-lg font-semibold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      style={getGradientStyle(theme)}
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
                      className="px-6 py-3 border-2 rounded-lg font-semibold transition hover:bg-gray-50 dark:hover:bg-gray-800 dark:border-gray-700 dark:text-gray-200"
                      style={{ borderColor: theme.gradFrom, color: theme.gradFrom }}
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
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Select Group *
                      </label>
                      <select
                        value={selectedGroupId || ""}
                        onChange={(e) => setSelectedGroupId(e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
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
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Expense Title *
                      </label>
                      <input
                        type="text"
                        value={formData.title}
                        onChange={(e) => {
                          const t = e.target.value;
                          const aiCat = detectCategory(t);
                          setFormData({ ...formData, title: t, category: aiCat });
                        }}
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                        required
                      />
                      {formData.title.length > 2 && (() => {
                        const cat = getCategoryInfo(formData.category);
                        return (
                          <div className="mt-2 flex items-center gap-2 px-3 py-2 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800">
                            <span className="text-blue-400 dark:text-blue-300 text-xs font-semibold">✨ AI suggests:</span>
                            <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${cat.badge}`}>{cat.icon} {cat.label}</span>
                            <span className="ml-auto text-[10px] text-blue-300 dark:text-blue-400">tap below to change</span>
                          </div>
                        );
                      })()}
                    </div>

                    {/* Category picker */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Category</label>
                      <div className="flex flex-wrap gap-2">
                        {CATEGORIES.map((cat) => (
                          <button
                            key={cat.key}
                            type="button"
                            onClick={() => setFormData({ ...formData, category: cat.key })}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition ${
                              formData.category === cat.key
                                ? cat.badge + " border-current scale-105"
                                : "border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:border-gray-400"
                            }`}
                          >
                            {cat.icon} {cat.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Amount */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Total Amount *
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.amount}
                        onChange={(e) =>
                          setFormData({ ...formData, amount: e.target.value })
                        }
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                        required
                      />
                    </div>

                    {/* Paid By */}
                    {selectedGroup && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
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
                          className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
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
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Split Between *
                          </label>
                          <button
                            type="button"
                            onClick={addSplitRow}
                            className="text-sm font-semibold flex items-center gap-1"
                            style={{ color: theme.gradFrom }}
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
                              className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
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
                              className="w-32 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
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
                        className="flex-1 px-4 py-2 border-2 rounded-lg font-semibold transition dark:border-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800"
                        style={{ borderColor: theme.gradFrom, color: theme.gradFrom }}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="flex-1 px-4 py-2 text-white rounded-lg font-semibold hover:opacity-90"
                        style={getGradientStyle(theme)}
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

