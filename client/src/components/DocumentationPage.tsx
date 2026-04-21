import { useState, useEffect } from "react";
import type { Topic } from "../types";
import { getTopics, deleteTopic } from "../api";
import TopicView from "./TopicView";
import TopicForm from "./TopicForm";
import "./DocumentationPage.css";

const CATEGORY_COLORS: Record<string, string> = {
  "Monitoring Stack": "#d97706",
  "Data & Messaging": "#059669",
  "Infrastructure": "#2563eb",
  "DevOps": "#dc2626",
};

export default function DocumentationPage() {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [selected, setSelected] = useState<Topic | null>(null);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingTopic, setEditingTopic] = useState<Topic | null>(null);

  useEffect(() => { loadTopics(); }, []);

  const loadTopics = async () => {
    const data = await getTopics();
    setTopics(data);
    if (data.length > 0 && !selected) setSelected(data[0]);
  };

  const grouped = topics
    .filter(t => t.name.toLowerCase().includes(search.toLowerCase()) ||
                 t.category.toLowerCase().includes(search.toLowerCase()))
    .reduce((acc, t) => {
      if (!acc[t.category]) acc[t.category] = [];
      acc[t.category].push(t);
      return acc;
    }, {} as Record<string, Topic[]>);

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this topic?")) return;
    await deleteTopic(id);
    const updated = topics.filter(t => t.id !== id);
    setTopics(updated);
    if (selected?.id === id) setSelected(updated[0] || null);
  };

  const handleSaved = (topic: Topic) => {
    setTopics(prev => {
      const exists = prev.find(t => t.id === topic.id);
      const updated = exists ? prev.map(t => t.id === topic.id ? topic : t) : [...prev, topic];
      return updated;
    });
    setSelected(topic);
    setShowForm(false);
    setEditingTopic(null);
  };

  if (showForm || editingTopic) {
    return (
      <TopicForm
        topic={editingTopic}
        existingTopics={topics}
        onSaved={handleSaved}
        onCancel={() => { setShowForm(false); setEditingTopic(null); }}
      />
    );
  }

  return (
    <div className="doc-layout">
      <aside className="doc-sidebar">
        <div className="doc-sidebar-top">
          <h3 className="doc-sidebar-title">Knowledge Base</h3>
          <p className="doc-sidebar-sub">{topics.length} topics</p>
        </div>
        <input
          className="doc-search"
          placeholder="Search topics..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <div className="doc-nav">
          {Object.entries(grouped).map(([cat, catTopics]) => (
            <div key={cat}>
              <div className="doc-cat-label" style={{ color: CATEGORY_COLORS[cat] || "#64748b" }}>
                {cat}
              </div>
              {catTopics.map(t => (
                <div
                  key={t.id}
                  className={`doc-nav-item ${selected?.id === t.id ? "active" : ""}`}
                  onClick={() => setSelected(t)}
                  style={selected?.id === t.id ? { borderLeftColor: t.color, color: t.color } : {}}
                >
                  <span className="doc-nav-icon">{t.icon}</span>
                  {t.name}
                </div>
              ))}
            </div>
          ))}
          {Object.keys(grouped).length === 0 && (
            <p className="doc-empty-search">No topics found.</p>
          )}
        </div>
        <button className="doc-add-btn" onClick={() => setShowForm(true)}>+ New Topic</button>
      </aside>

      <div className="doc-main">
        {selected ? (
          <TopicView
            topic={selected}
            allTopics={topics}
            onNavigate={setSelected}
            onEdit={() => setEditingTopic(selected)}
            onDelete={() => handleDelete(selected.id)}
          />
        ) : (
          <div className="doc-welcome">
            <span className="doc-welcome-icon">📚</span>
            <h3>Select a topic to read</h3>
            <p>Or add a new one using the button in the sidebar.</p>
          </div>
        )}
      </div>
    </div>
  );
}