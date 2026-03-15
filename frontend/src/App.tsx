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
import Upload from "./pages/upload";
import { useAuth } from "./context/auth-context";

const App = () => {

  const {user} = useAuth()
  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[color(display-p3_0.975_0.975_0.975)]">

      <Navbar />

      <div className="flex flex-1 overflow-hidden">

        <Sidebar />

        <main className="flex-1 overflow-y-auto">
          <Routes>

            <Route path="/" element={<Home />} />

    
            <Route path="/shorts" element={<Shorts />} />
            <Route path="/course-outline" element={<CourseOutline />} />
            <Route path="/analytics" element={user ? <Analytics userId={user.id} /> : null} />
            <Route path="/live-chat" element={<RootChat />} />
<Route path="/upload" element={<Upload />} />
            <Route
              path="/course/:courseId/topic/:topicId"
              element={<TopicPage />}
            />

              <Route  path="/course/:courseId/topic/:topicId/quiz/:quizId" element={<Quiz />} />

          </Routes>
        </main>

      </div>

    </div>
  );
};

export default App;