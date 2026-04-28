import type { Page } from "../App";
import "./Sidebar.css";

interface Props {
  page: Page;
  onPageChange: (page: Page) => void;
}

export default function Sidebar({ page, onPageChange }: Props) {
  return (
    <aside className="sidebar">
      <div className="sidebar-logo">GOOGLE PLUS</div>
      <nav className="sidebar-nav">
        <button className={`nav-item ${page === "tasks" ? "active" : ""}`} onClick={() => onPageChange("tasks")}>
          <span className="nav-icon">📝</span> Tasks
        </button>
        <button className={`nav-item ${page === "week" ? "active" : ""}`} onClick={() => onPageChange("week")}>
          <span className="nav-icon">🆘</span> This Week
        </button>
        <button className={`nav-item ${page === "calendar" ? "active" : ""}`} onClick={() => onPageChange("calendar")}>
          <span className="nav-icon">🗓️</span> Calendar
        </button>
        <button className={`nav-item ${page === "documentation" ? "active" : ""}`} onClick={() => onPageChange("documentation")}>
          <span className="nav-icon">📄</span> Documentation
        </button>
        <button className={`nav-item ${page === "boards" ? "active" : ""}`} onClick={() => onPageChange("boards")}>
          <span className="nav-icon">🎨</span> Boards
        </button>

        <button className={`nav-item ${page === "journal" ? "active" : ""}`} onClick={() => onPageChange("journal")}>
          <span className="nav-icon">⚙️</span> Settings
        </button>
      </nav>
    </aside>
  );
}