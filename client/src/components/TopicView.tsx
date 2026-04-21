import type { Topic } from "../types";
import "./TopicView.css";

const ACCENT: Record<string, { bg: string; border: string }> = {
  "#2563eb": { bg: "#eff6ff", border: "#bfdbfe" },
  "#dc2626": { bg: "#fef2f2", border: "#fecaca" },
  "#059669": { bg: "#ecfdf5", border: "#a7f3d0" },
  "#7c3aed": { bg: "#f5f3ff", border: "#ddd6fe" },
  "#d97706": { bg: "#fffbeb", border: "#fde68a" },
  "#0891b2": { bg: "#ecfeff", border: "#a5f3fc" },
};

const acc = (color: string) => ACCENT[color] || { bg: "#f8fafc", border: "#e2e8f0" };

interface Props {
  topic: Topic;
  allTopics: Topic[];
  onNavigate: (t: Topic) => void;
  onEdit: () => void;
  onDelete: () => void;
}

export default function TopicView({ topic, allTopics, onNavigate, onEdit, onDelete }: Props) {
  const { bg, border } = acc(topic.color);

  return (
    <div className="topic-view">
      <div className="tv-hero">
        <div className="tv-icon" style={{ background: bg, border: `1px solid ${border}` }}>
          {topic.icon}
        </div>
        <div className="tv-hero-text">
          <h1 className="tv-name" style={{ color: topic.color }}>{topic.name}</h1>
          <p className="tv-abbr">{topic.abbr}</p>
          <span className="tv-cat-tag" style={{ background: bg, color: topic.color, border: `1px solid ${border}` }}>
            {topic.category}
          </span>
        </div>
        <div className="tv-actions">
          <button className="tv-btn edit" onClick={onEdit}>✏️ Edit</button>
          <button className="tv-btn delete" onClick={onDelete}>🗑 Delete</button>
        </div>
      </div>

      <div className="tv-divider" />

      <p className="tv-description">{topic.description}</p>

      {topic.analogy && (
        <div className="tv-analogy" style={{ background: bg, borderColor: topic.color }}>
          <div className="tv-analogy-label" style={{ color: topic.color }}>💡 Analogy</div>
          <p>{topic.analogy}</p>
        </div>
      )}

      {topic.concepts.length > 0 && (
        <>
          <h3 className="tv-section-title">Key Concepts</h3>
          <div className="tv-concepts">
            {topic.concepts.map((c, i) => (
              <div key={i} className="tv-concept-card">
                <div className="tv-concept-term" style={{ color: topic.color }}>{c.term}</div>
                <div className="tv-concept-def">{c.def}</div>
              </div>
            ))}
          </div>
        </>
      )}

      {topic.connects.length > 0 && (
        <>
          <h3 className="tv-section-title">Connects to</h3>
          <div className="tv-connects">
            {topic.connects.map((c, i) => {
              const linked = allTopics.find(t => t.slug === c.id);
              if (!linked) return null;
              const la = acc(linked.color);
              return (
                <div
                  key={i}
                  className="tv-connect-chip"
                  style={{ borderColor: la.border }}
                  onClick={() => onNavigate(linked)}
                >
                  <span className="tv-connect-dot" style={{ background: linked.color }} />
                  <div>
                    <div className="tv-connect-name">{linked.icon} {linked.name}</div>
                    <div className="tv-connect-why">{c.why}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}