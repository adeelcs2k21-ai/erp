"use client";

import { useState, useEffect } from "react";
import { Box, Button, Text, Modal, TextInput, Textarea, Table } from "@mantine/core";
import { Navigation } from "@/components/Navigation";
import { ProtectedRoute } from "@/components/ProtectedRoute";

interface Document {
  id: string;
  name: string;
  content: string;
  file_url?: string;
  file_type?: string;
  created_at: string;
  created_by: string;
  updated_at?: string;
}

export default function Documentation() {
  const [currentPage] = useState(5);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingDoc, setEditingDoc] = useState<Document | null>(null);
  const [formData, setFormData] = useState({ name: "", content: "" });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewingDoc, setViewingDoc] = useState<Document | null>(null);

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    try {
      const res = await fetch("/api/documents");
      if (res.ok) {
        const data = await res.json();
        setDocuments(data);
      }
    } catch (error) {
      console.error("Error loading documents:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      alert("Please enter a document name");
      return;
    }

    const user = JSON.parse(localStorage.getItem("user") || "{}");
    let fileUrl = "";
    let fileType = "";

    try {
      // Upload file if selected
      if (selectedFile) {
        const formDataFile = new FormData();
        formDataFile.append("file", selectedFile);

        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          body: formDataFile,
        });

        if (uploadRes.ok) {
          const uploadData = await uploadRes.json();
          fileUrl = uploadData.url;
          fileType = selectedFile.type;
        } else {
          alert("Failed to upload file");
          return;
        }
      }

      if (editingDoc) {
        // Update existing document
        await fetch("/api/documents", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: editingDoc.id,
            name: formData.name,
            content: formData.content,
            fileUrl: fileUrl || editingDoc.file_url,
            fileType: fileType || editingDoc.file_type,
          }),
        });
      } else {
        // Create new document
        await fetch("/api/documents", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: formData.name,
            content: formData.content,
            fileUrl,
            fileType,
            createdBy: user.username || "unknown",
          }),
        });
      }

      setShowModal(false);
      setEditingDoc(null);
      setFormData({ name: "", content: "" });
      setSelectedFile(null);
      loadDocuments();
    } catch (error) {
      console.error("Error saving document:", error);
      alert("Error saving document");
    }
  };

  const handleEdit = (doc: Document) => {
    setEditingDoc(doc);
    setFormData({ name: doc.name, content: doc.content });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this document?")) return;

    try {
      await fetch("/api/documents", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      loadDocuments();
    } catch (error) {
      console.error("Error deleting document:", error);
      alert("Error deleting document");
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingDoc(null);
    setFormData({ name: "", content: "" });
    setSelectedFile(null);
  };

  const handleView = (doc: Document) => {
    setViewingDoc(doc);
    setShowViewModal(true);
  };

  return (
    <ProtectedRoute>
      <style>{`
        .doc-main-container {
          width: 100%;
          min-height: 100vh;
          background-color: white;
          font-family: Poppins, sans-serif;
        }
        
        .doc-content-wrapper {
          padding: 20px;
          margin-left: 240px;
          max-width: 1400px;
        }
        
        .doc-content-box {
          border: 1px solid #ccc;
          border-radius: 4px;
          padding: 30px;
          margin-top: 40px;
        }
        
        @media (max-width: 1024px) {
          .doc-content-wrapper {
            max-width: 100%;
          }
        }
        
        @media (max-width: 768px) {
          .doc-content-wrapper {
            margin-left: 0;
            padding: 16px;
            padding-top: 70px;
          }
          
          .doc-content-box {
            border: none;
            padding: 16px;
            margin-top: 0;
          }
        }
      `}</style>

      <div className="doc-main-container">
        <Navigation currentPage={currentPage} />

        <div className="doc-content-wrapper">
          <div className="doc-content-box">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
              <Text style={{ fontSize: "18px", fontWeight: "500" }}>
                Documentation
              </Text>
              <button
                onClick={() => setShowModal(true)}
                style={{
                  padding: "8px 16px",
                  backgroundColor: "white",
                  color: "#000",
                  border: "1px solid #e0e0e0",
                  fontSize: "13px",
                  fontWeight: "400",
                  cursor: "pointer",
                  borderRadius: "4px",
                }}
              >
                + Add Document
              </button>
            </div>

            {loading ? (
              <Text style={{ color: "#999", fontSize: "14px", textAlign: "center", padding: "40px" }}>
                Loading documents...
              </Text>
            ) : documents.length === 0 ? (
              <Text style={{ color: "#999", fontSize: "14px", textAlign: "center", padding: "40px" }}>
                No documents yet. Click "Add Document" to create one.
              </Text>
            ) : (
              <div style={{ backgroundColor: "white", border: "1px solid #e0e0e0", overflow: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ backgroundColor: "#fafafa", borderBottom: "1px solid #e0e0e0" }}>
                      <th style={{ padding: "12px 16px", textAlign: "left", fontSize: "11px", fontWeight: "500", color: "#666", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                        Document Name
                      </th>
                      <th style={{ padding: "12px 16px", textAlign: "left", fontSize: "11px", fontWeight: "500", color: "#666", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                        Type
                      </th>
                      <th style={{ padding: "12px 16px", textAlign: "left", fontSize: "11px", fontWeight: "500", color: "#666", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                        Created By
                      </th>
                      <th style={{ padding: "12px 16px", textAlign: "left", fontSize: "11px", fontWeight: "500", color: "#666", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                        Date Added
                      </th>
                      <th style={{ padding: "12px 16px", textAlign: "center", fontSize: "11px", fontWeight: "500", color: "#666", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {documents.map((doc) => (
                      <tr key={doc.id} style={{ borderBottom: "1px solid #f0f0f0" }}>
                        <td style={{ padding: "16px", fontSize: "13px", fontWeight: "600" }}>
                          {doc.name}
                        </td>
                        <td style={{ padding: "16px", fontSize: "12px", color: "#666" }}>
                          {doc.file_url ? (
                            doc.file_type?.includes("pdf") ? "📄 PDF" :
                            doc.file_type?.includes("image") ? "🖼️ Image" :
                            "📎 File"
                          ) : "📝 Text"}
                        </td>
                        <td style={{ padding: "16px", fontSize: "13px", color: "#333" }}>
                          {doc.created_by}
                        </td>
                        <td style={{ padding: "16px", fontSize: "12px", color: "#888" }}>
                          {new Date(doc.created_at).toLocaleDateString()} {new Date(doc.created_at).toLocaleTimeString()}
                        </td>
                        <td style={{ padding: "16px", textAlign: "center" }}>
                          <div style={{ display: "flex", gap: "6px", justifyContent: "center" }}>
                            <button
                              onClick={() => handleView(doc)}
                              style={{
                                padding: "6px 12px",
                                backgroundColor: "#007bff",
                                color: "white",
                                border: "1px solid #007bff",
                                fontSize: "11px",
                                cursor: "pointer",
                                borderRadius: "4px",
                              }}
                            >
                              View
                            </button>
                            <button
                              onClick={() => handleEdit(doc)}
                              style={{
                                padding: "6px 12px",
                                backgroundColor: "white",
                                color: "#000",
                                border: "1px solid #e0e0e0",
                                fontSize: "11px",
                                cursor: "pointer",
                                borderRadius: "4px",
                              }}
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(doc.id)}
                              style={{
                                padding: "6px 12px",
                                backgroundColor: "white",
                                color: "#dc3545",
                                border: "1px solid #e0e0e0",
                                fontSize: "11px",
                                cursor: "pointer",
                                borderRadius: "4px",
                              }}
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      <Modal
        opened={showModal}
        onClose={handleCloseModal}
        title={editingDoc ? "Edit Document" : "Add Document"}
        size="lg"
      >
        <div style={{ fontFamily: "Poppins, sans-serif" }}>
          <div style={{ marginBottom: "16px" }}>
            <Text style={{ fontSize: "13px", fontWeight: "600", marginBottom: "8px", color: "#333" }}>
              Document Name
            </Text>
            <TextInput
              placeholder="e.g., Company Policy, User Manual, etc."
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div style={{ marginBottom: "16px" }}>
            <Text style={{ fontSize: "13px", fontWeight: "600", marginBottom: "8px", color: "#333" }}>
              Content
            </Text>
            <Textarea
              placeholder="Enter document content..."
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              rows={10}
            />
          </div>

          <div style={{ marginBottom: "16px" }}>
            <Text style={{ fontSize: "13px", fontWeight: "600", marginBottom: "8px", color: "#333" }}>
              Upload File (Optional)
            </Text>
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.gif,.doc,.docx"
              onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
              style={{
                width: "100%",
                padding: "8px",
                border: "1px solid #e0e0e0",
                borderRadius: "4px",
                fontSize: "13px",
              }}
            />
            <Text style={{ fontSize: "11px", color: "#666", marginTop: "4px" }}>
              Supported: PDF, Images (JPG, PNG, GIF), Word documents
            </Text>
            {editingDoc?.file_url && !selectedFile && (
              <Text style={{ fontSize: "12px", color: "#007bff", marginTop: "8px" }}>
                Current file: {editingDoc.file_type?.includes("pdf") ? "PDF" : editingDoc.file_type?.includes("image") ? "Image" : "Document"}
              </Text>
            )}
          </div>

          <Button
            onClick={handleSave}
            fullWidth
            style={{ backgroundColor: "#000", color: "#fff", padding: "10px" }}
          >
            {editingDoc ? "Update Document" : "Save Document"}
          </Button>
        </div>
      </Modal>

      <Modal
        opened={showViewModal}
        onClose={() => { setShowViewModal(false); setViewingDoc(null); }}
        title={viewingDoc?.name || "Document"}
        size="xl"
        styles={{ body: { padding: 0 } }}
      >
        {viewingDoc && (
          <div style={{ fontFamily: "Poppins, sans-serif" }}>
            {viewingDoc.file_url ? (
              <div>
                {viewingDoc.file_type?.includes("pdf") ? (
                  <iframe
                    src={viewingDoc.file_url}
                    style={{ width: "100%", height: "80vh", border: "none" }}
                    title={viewingDoc.name}
                  />
                ) : viewingDoc.file_type?.includes("image") ? (
                  <div style={{ padding: "20px", textAlign: "center", backgroundColor: "#f8f9fa" }}>
                    <img
                      src={viewingDoc.file_url}
                      alt={viewingDoc.name}
                      style={{ maxWidth: "100%", maxHeight: "80vh", objectFit: "contain" }}
                    />
                  </div>
                ) : (
                  <div style={{ padding: "40px", textAlign: "center" }}>
                    <Text style={{ marginBottom: "20px" }}>
                      This file type cannot be previewed. Click below to download.
                    </Text>
                    <a
                      href={viewingDoc.file_url}
                      download
                      style={{
                        padding: "10px 20px",
                        backgroundColor: "#007bff",
                        color: "white",
                        textDecoration: "none",
                        borderRadius: "4px",
                        display: "inline-block",
                      }}
                    >
                      Download File
                    </a>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ padding: "20px", whiteSpace: "pre-wrap", maxHeight: "80vh", overflow: "auto" }}>
                {viewingDoc.content || "No content available"}
              </div>
            )}
          </div>
        )}
      </Modal>
    </ProtectedRoute>
  );
}
