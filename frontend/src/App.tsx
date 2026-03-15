import { Route, Routes } from "react-router-dom";

import Navbar from "./components/navbar";
import Sidebar from "./components/sidebar";

import Analytics from "./pages/analytics";
import CourseOutline from "./pages/course-outline";
import Home from "./pages/home";
import { RootChat } from "./pages/live-chat";
import Quiz from "./pages/quiz";
import Shorts from "./pages/shorts";
import TopicPage from "./pages/topics";

const App = () => {
  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[color(display-p3_0.975_0.975_0.975)]">

      <Navbar />

      <div className="flex flex-1 overflow-hidden">

        <Sidebar />

        <main className="flex-1 overflow-y-auto">
          <Routes>

            <Route path="/" element={<Home />} />

            <Route path="/quiz" element={<Quiz />} />
            <Route path="/shorts" element={<Shorts />} />
            <Route path="/course-outline" element={<CourseOutline />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/live-chat" element={<RootChat />} />

            <Route
              path="/course/:courseId/topic/:topicId"
              element={<TopicPage />}
            />

          </Routes>
        </main>

      </div>

    </div>
  );
};

export default App;