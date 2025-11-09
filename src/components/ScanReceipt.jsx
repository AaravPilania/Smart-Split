import { useState, useRef, useEffect } from "react";
import { FiCamera, FiUpload, FiX, FiCheck, FiPlus } from "react-icons/fi";
import Tesseract from "tesseract.js";
import { API_URL } from "../utils/api";

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

  useEffect(() => {
    if (groups.length > 0 && !selectedGroupId) {
      setSelectedGroupId(groups[0].id);
      setSelectedGroup(groups[0]);
    }
  }, [groups, selectedGroupId]);

  useEffect(() => {
    if (selectedGroupId) {
      const group = groups.find((g) => g.id === selectedGroupId);
      setSelectedGroup(group);
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

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" }, // Use back camera on mobile
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setMode("camera");
    } catch (error) {
      alert("Unable to access camera. Please check permissions.");
      console.error("Camera error:", error);
    }
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement("canvas");
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(videoRef.current, 0, 0);
      
      canvas.toBlob((blob) => {
        const url = URL.createObjectURL(blob);
        setImage(blob);
        setImageUrl(url);
        stopCamera();
      }, "image/jpeg");
    }
  };

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
    // Clean the text - remove extra whitespace
    const cleanedText = text.replace(/\s+/g, " ").trim();
    const lines = text.split("\n").map(line => line.trim()).filter((line) => line.length > 0);
    
    // Extract amount - look for various patterns
    let amount = null;
    
    // Common patterns for finding total/amount
    const amountPatterns = [
      /total[:\s]*\$?\s*(\d{1,6}\.?\d{0,2})/i,
      /amount[:\s]*\$?\s*(\d{1,6}\.?\d{0,2})/i,
      /balance[:\s]*\$?\s*(\d{1,6}\.?\d{0,2})/i,
      /due[:\s]*\$?\s*(\d{1,6}\.?\d{0,2})/i,
      /\$\s*(\d{1,6}\.\d{2})/,
      /\$\s*(\d{1,6})\.(\d{2})/,
      /^(\d{1,6}\.\d{2})$/,
      /(\d{1,6}\.\d{2})/,
    ];

    // Search from bottom to top (total usually at bottom)
    const reversedLines = [...lines].reverse();
    
    for (const pattern of amountPatterns) {
      for (const line of reversedLines) {
        const match = line.match(pattern);
        if (match) {
          let extractedAmount;
          if (match[2]) {
            // Pattern with cents
            extractedAmount = parseFloat(`${match[1]}.${match[2]}`);
          } else {
            extractedAmount = parseFloat(match[1]);
          }
          
          // Validate amount is reasonable (between $0.01 and $999,999.99)
          if (extractedAmount && extractedAmount >= 0.01 && extractedAmount <= 999999.99) {
            amount = extractedAmount;
            break;
          }
        }
      }
      if (amount) break;
    }

    // Also search entire text for dollar amounts
    if (!amount) {
      const dollarMatches = cleanedText.match(/\$\s*(\d{1,6}\.?\d{0,2})/g);
      if (dollarMatches && dollarMatches.length > 0) {
        // Get the largest amount (usually the total)
        const amounts = dollarMatches
          .map(m => parseFloat(m.replace(/[^\d.]/g, '')))
          .filter(a => a >= 0.01 && a <= 999999.99)
          .sort((a, b) => b - a);
        if (amounts.length > 0) {
          amount = amounts[0];
        }
      }
    }

    // Extract title/merchant name (usually in first few lines)
    let title = "";
    const titleLines = lines.slice(0, 5); // Check first 5 lines
    
    for (const line of titleLines) {
      // Skip lines that look like dates, times, addresses, or numbers only
      if (
        line.length >= 3 &&
        line.length <= 60 &&
        !/^\d+[\.\/\-]/.test(line) && // Doesn't start with date
        !/^\$/.test(line) && // Doesn't start with $
        !/^\d+$/.test(line) && // Not just numbers
        !/^\d+\s+(AM|PM)/i.test(line) && // Not just time
        !/@/.test(line) // Not email
      ) {
        // Clean up common receipt prefixes
        const cleanLine = line
          .replace(/^receipt/i, '')
          .replace(/^invoice/i, '')
          .replace(/^transaction/i, '')
          .trim();
        
        if (cleanLine.length >= 3) {
          title = cleanLine;
          break;
        }
      }
    }

    // Fallback: use first non-empty line or default
    if (!title || title.length < 3) {
      const firstValidLine = lines.find(line => 
        line.length >= 3 && 
        line.length <= 60 && 
        !/^\d+/.test(line) &&
        !/^\$/.test(line)
      );
      title = firstValidLine || "Receipt Expense";
    }

    // Clean title
    title = title.substring(0, 50).trim();

    return {
      title: title || "Receipt Expense",
      amount: amount || 0,
      rawText: text,
    };
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

      // Use Tesseract.js for OCR
      const { data } = await Tesseract.recognize(image, "eng", {
        logger: (m) => {
          if (m.status === "recognizing text") {
            // Can show progress here if needed
          }
        },
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
        user: parseInt(split.userId),
        amount: parseFloat(split.amount),
      }));
    }

    try {

      const response = await fetch(
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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full p-6 my-8 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-2xl font-bold text-gray-800">Scan Receipt</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <FiX className="text-xl" />
          </button>
        </div>

        {!image ? (
          /* Initial Mode Selection */
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
        ) : (
          <div className="space-y-4">
            {/* Camera View */}
            {mode === "camera" && !imageUrl && (
              <div className="relative">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="w-full rounded-lg"
                />
                <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-4">
                  <button
                    onClick={stopCamera}
                    className="px-6 py-3 bg-red-500 text-white rounded-lg font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={capturePhoto}
                    className="px-6 py-3 bg-green-500 text-white rounded-lg font-semibold"
                  >
                    <FiCheck className="inline mr-2" />
                    Capture
                  </button>
                </div>
              </div>
            )}

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
                  <div className="flex gap-3">
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

                    {/* Group Selection */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Select Group *
                      </label>
                      <select
                        value={selectedGroupId || ""}
                        onChange={(e) => setSelectedGroupId(parseInt(e.target.value))}
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
                              paidBy: parseInt(e.target.value),
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
                          <div key={index} className="flex gap-2 mb-2">
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
                              ${formData.splits.reduce(
                                (sum, split) =>
                                  sum + parseFloat(split.amount || 0),
                                0
                              ).toFixed(2)}
                            </span>
                            {" / "}
                            Total amount:{" "}
                            <span className="font-semibold">
                              ${parseFloat(formData.amount || 0).toFixed(2)}
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
  );
}

