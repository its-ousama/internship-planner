import { useState, useRef, useEffect } from "react";
import type { Task, Priority, Status } from "../types";
import axios from "axios";
import "./TaskCard.css";

const PRIORITY_COLORS: Record<Priority, string> = {
  high: "#ef4444",
  medium: "#f59e0b",
  low: "#22c55e",
};

const PRIORITY_BG: Record<Priority, string> = {
  high: "#fef2f2",
  medium: "#fffbeb",
  low: "#f0fdf4",
};

interface Props {
  task: Task;
  onStatus: (id: number, current: Status) => void;
  onDelete: (id: number) => void;
  onEdit: (updated: Task) => void;
}

export default function TaskCard({ task, onStatus, onDelete, onEdit }: Props) {
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);
  const [editPriority, setEditPriority] = useState<Priority>(task.priority);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  const saveEdit = async () => {
    if (!editTitle.trim()) return;
    const res = await axios.patch<Task>(`http://localhost:3001/api/tasks/${task.id}`, {
      title: editTitle.trim(),
      priority: editPriority,
      color: PRIORITY_COLORS[editPriority],
    });
    onEdit(res.data);
    setEditing(false);
  };

  if (editing) {
    return (
      <div className="task-card editing">
        <input
          ref={inputRef}
          className="edit-input"
          value={editTitle}
          onChange={e => setEditTitle(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") saveEdit(); if (e.key === "Escape") setEditing(false); }}
        />
        <select
          className="edit-priority"
          value={editPriority}
          onChange={e => setEditPriority(e.target.value as Priority)}
        >
          <option value="high">🔴 High</option>
          <option value="medium">🟡 Medium</option>
          <option value="low">🟢 Low</option>
        </select>
        <button className="save-btn" onClick={saveEdit}>Save</button>
        <button className="cancel-btn" onClick={() => setEditing(false)}>Cancel</button>
      </div>
    );
  }

  return (
    <div
      className={`task-card ${task.status === "scratched" ? "scratched" : ""}`}
      style={{ borderLeft: `3px solid ${PRIORITY_COLORS[task.priority]}` }}
    >
      <button
        className="scratch-btn"
        onClick={() => onStatus(task.id, task.status)}
        title={task.status === "pending" ? "Mark as scratched" : "Undo"}
      >
        {task.status === "scratched" ? "✓" : "○"}
      </button>

      <div className="task-body">
        <span className={`task-title ${task.status === "scratched" ? "crossed" : ""}`}>
          {task.title}
        </span>
        <span
          className="priority-badge"
          style={{ background: PRIORITY_BG[task.priority], color: PRIORITY_COLORS[task.priority] }}
        >
          {task.priority}
        </span>
      </div>

      <div className="task-actions">
        <button className="action-btn" onClick={() => setEditing(true)} title="Edit">✏️</button>
        <button className="action-btn delete" onClick={() => onDelete(task.id)} title="Delete">🗑</button>
      </div>
    </div>
  );
}