import { NavLink, useLocation } from "react-router-dom";
import { Clapperboard, BookOpen, BarChart3, PlusCircle } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { SignInDialog } from "./auth/sign-in";
import { UserSettingsDropdown } from "./auth/user-settings";
import { COURSES } from "@/data/courses";

import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion/accordion";

const linkBase =
  "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors";

const inactive =
  "text-[color(display-p3_0.392_0.392_0.392)] hover:text-black hover:bg-gray-200";

const active = "bg-gray-200 text-black";

const Sidebar = () => {
  const { user } = useAuth();
  const location = useLocation();
  const path = location.pathname;

  const activeCourse = COURSES.find((course) =>
    path.includes(`/course/${course.code}`)
  );

  return (
    <aside className="hidden md:flex h-full w-56 flex-col border-r border-gray-200">
      <nav className="flex flex-col gap-1 p-3">

        <NavLink
          to="/shorts"
          className={({ isActive }) =>
            `${linkBase} ${isActive ? active : inactive}`
          }
        >
          <Clapperboard size={18} />
          Shorts
        </NavLink>

        <NavLink
          to="/upload"
          className={({ isActive }) =>
            `${linkBase} ${isActive ? active : inactive}`
          }
        >
          <PlusCircle size={18} />

          Upload
        </NavLink>

        <Accordion expandedValue={activeCourse ? "courses" : null}>
          <AccordionItem value="courses">

            <AccordionTrigger
              className={`${linkBase} ${activeCourse ? active : inactive
                } w-full flex items-center justify-between`}
            >
              <NavLink
                to="/course-outline"
                className="flex items-center gap-2 flex-1"
              >
                <BookOpen size={18} />
                Courses
              </NavLink>
            </AccordionTrigger>

            <AccordionContent>
              {activeCourse && (
                <div className="ml-6 mt-2 flex flex-col gap-1">

                  <div
                    className="text-xs font-medium text-zinc-500 uppercase truncate"
                    title={activeCourse.name}
                  >
                    {activeCourse.name}
                  </div>

                  {activeCourse.topics.map((topic) => {
                    const topicPath = `/course/${activeCourse.code}/topic/${topic}`;
                    const quizPath = `${topicPath}/quiz/1`;

                    const isTopicActive =
                      path === topicPath ||
                      path.startsWith(`${topicPath}/quiz`);

                    const isQuizActive =
                      path.startsWith(`${topicPath}/quiz`);

                    return (
                      <Accordion
                        key={topic}
                        expandedValue={isQuizActive ? "quiz" : null}
                      >
                        <AccordionItem value="quiz">

                          <NavLink
                            to={topicPath}
                            className={() =>
                              `flex w-full text-sm px-3 py-1.5 rounded-md capitalize ${isTopicActive
                                ? "bg-gray-200 text-black"
                                : "text-gray-600 hover:text-black hover:bg-gray-100"
                              }`
                            }
                          >
                            {topic.replace(/-/g, " ")}
                          </NavLink>

                          <AccordionContent className="mt-2 ml-4">
                            {isTopicActive && (
                              <NavLink
                                to={quizPath}
                                className={({ isActive }) =>
                                  `flex w-full text-sm px-3 py-1.5 rounded-md  ${isActive
                                    ? "bg-gray-200 text-black"
                                    : "text-gray-600 hover:text-black hover:bg-gray-100"
                                  }`
                                }
                              >
                                Quiz
                              </NavLink>
                            )}
                          </AccordionContent>

                        </AccordionItem>
                      </Accordion>
                    );
                  })}

                </div>
              )}
            </AccordionContent>

          </AccordionItem>
        </Accordion>

        <NavLink
          to="/analytics"
          className={({ isActive }) =>
            `${linkBase} ${isActive ? active : inactive}`
          }
        >
          <BarChart3 size={18} />
          Analytics
        </NavLink>

        <NavLink
          to="/live-chat"
          className={({ isActive }) =>
            `${linkBase} ${isActive ? active : inactive}`
          }
        >
          <Clapperboard size={18} />
          Live Assistant
        </NavLink>

      </nav>

      <div
        className="mt-auto border-t border-gray-200 p-3"
        style={{ height: 75 }}
      >
        {user ? <UserSettingsDropdown user={user} /> : <SignInDialog />}
      </div>
    </aside>
  );
};

export default Sidebar;