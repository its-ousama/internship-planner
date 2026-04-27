import { useState } from "react";
import dayjs from "dayjs";
import Sidebar from "./components/Sidebar";
import TasksPage from "./components/TasksPage";
import CalendarPage from "./components/CalendarPage";
import DocumentationPage from "./components/DocumentationPage";
import BoardsPage from "./components/BoardsPage";
import WeekPage from "./components/WeekPage";
import "./App.css";

export type Page = "tasks" | "calendar" | "documentation" | "boards" | "week" ;

export default function App() {
  const [selectedDate, setSelectedDate] = useState(dayjs().format("YYYY-MM-DD"));
  const [page, setPage] = useState<Page>("tasks");

  const goToDay = (date: string) => {
    setSelectedDate(date);
    setPage("tasks");
  };

  return (
    <div className="layout">
      <Sidebar page={page} onPageChange={setPage} />
      <main className="main-content">
        {page === "tasks" && <TasksPage selectedDate={selectedDate} onDateChange={setSelectedDate} />}
        {page === "calendar" && <CalendarPage onGoToDay={goToDay} />}
        {page === "documentation" && <DocumentationPage />}
        {page === "boards" && <BoardsPage />}
        {page === "week" && <WeekPage />}
      </main>
    </div>
  );
}