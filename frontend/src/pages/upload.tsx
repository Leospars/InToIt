import BottomBar from "@/components/bottom-navbar";
import { PlusCircle, UploadCloud, Trash2 } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/context/auth-context";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown/dropdown";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Tables } from "@/lib/database.types";

type UploadFile = {
  id: string;
  file: File;
  progress: number | null;
};

const API_URL = "https://intoit-rqhi.onrender.com";

const Upload = () => {
  const { session, user } = useAuth();
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [course, setCourse] = useState<Tables<"courses"> | null>(null);

  const { data: courses } = useQuery({
    queryKey: ["courses", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("courses")
        .select()
        .eq("creatorId", user!.id);

      if (error) throw error;

      return data;
    }
  });

  const handleFiles = (fileList: FileList | null) => {
    if (!fileList) return;

    const newFiles = Array.from(fileList).map((file) => ({
      id: crypto.randomUUID(),
      file,
      progress: null,
    }));

    setFiles((prev) => [...prev, ...newFiles]);
  };

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const formatSize = (size: number) => {
    return `${(size / 1024).toFixed(0)} KB`;
  };

  const uploadFiles = () => {
    if (!course) {
      console.error("Missing course");
      return;
    }

    if (!session?.access_token) {
      console.error("Missing auth token");
      return;
    }

    files.forEach((item) => {
      // START progress immediately
      setFiles((prev) =>
        prev.map((f) =>
          f.id === item.id ? { ...f, progress: 0 } : f
        )
      );

      const form = new FormData();
      form.append("course_id", course.course_id);
      form.append("file", item.file);
      form.append("extract_content", "true");

      const xhr = new XMLHttpRequest();

      xhr.open("POST", `${API_URL}/api/files/upload`);

      xhr.setRequestHeader(
        "Authorization",
        `Bearer ${session.access_token}`
      );

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percent = Math.round((event.loaded / event.total) * 100);

          setFiles((prev) =>
            prev.map((f) =>
              f.id === item.id ? { ...f, progress: percent } : f
            )
          );
        }
      };

      xhr.onload = () => {
        if (xhr.status === 200) {
          setFiles((prev) =>
            prev.map((f) =>
              f.id === item.id ? { ...f, progress: 100 } : f
            )
          );
        } else {
          console.error("Upload failed", xhr.responseText);
        }
      };

      xhr.onerror = () => {
        console.error("Upload error");
      };

      xhr.send(form);
    });
  };

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-8 py-10 pb-28">


      <div className="flex flex-col gap-4 border-b pb-6">
        <div className="flex size-8 items-center justify-center rounded-lg bg-white shadow">
          <PlusCircle size={18} className="text-gray-500" />
        </div>

        <div className="flex flex-col gap-1">
          <h2 className="text-2xl font-semibold tracking-tight capitalize">
            Upload
          </h2>

          <p className="text-gray-600">
            Upload study materials or documents to create quizzes and flashcards.
          </p>
        </div>
      </div>


      <label
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          handleFiles(e.dataTransfer.files);
        }}
        className="mx-auto w-full max-w-3xl flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-white py-28 px-6 text-center transition hover:border-gray-400 hover:bg-gray-100 cursor-pointer"
      >
        <UploadCloud className="mb-4 text-gray-400" size={36} />

        <p className="text-sm font-medium text-gray-700">
          Drag and drop files here
        </p>

        <p className="text-xs text-gray-500 mt-1">
          or click to upload
        </p>

        <input
          type="file"
          className="hidden"
          multiple
          onChange={(e) => handleFiles(e.target.files)}
        />
      </label>

      <DropdownMenu>
        <DropdownMenuTrigger>{course ? course.name : "Select"}</DropdownMenuTrigger>
        <DropdownMenuContent>
          {courses?.map(course => (
            <DropdownMenuItem
              key={course.id}
              onClick={() => setCourse(course)}
            >
              {course.name}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>


      {files.length > 0 && (
        <div className="mx-auto w-full max-w-3xl flex flex-col gap-3">
          <AnimatePresence>
            {files.map((item) => (
              <motion.div
                key={item.id}
                layout="position"
                initial={{ opacity: 0, y: -12, height: 0 }}
                animate={{ opacity: 1, y: 0, height: "auto" }}
                exit={{ opacity: 0, y: -12, height: 0 }}
                transition={{
                  duration: 0.25,
                  ease: [0.23, 1, 0.32, 1],
                }}
                className="flex items-center gap-4 rounded-xl bg-gray-50 border border-gray-200 px-4 py-3 overflow-hidden"
              >


                <div className="flex items-center justify-center size-10 rounded-lg bg-gray-200 text-gray-700 text-xs font-semibold">
                  {item.file.name.split(".").pop()?.toUpperCase()}
                </div>


                <div className="flex flex-col flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm text-gray-900">
                      {item.file.name}
                    </span>

                    <span className="text-xs text-gray-500">
                      {formatSize(item.file.size)}
                    </span>
                  </div>


                  {item.progress !== null && (
                    <div className="mt-2 h-2 w-full rounded-full bg-gray-200 overflow-hidden">
                      <motion.div
                        className="h-full bg-gray-700 rounded-full"
                        initial={false}
                        animate={{ width: `${item.progress}%` }}
                        transition={{ duration: 0.2 }}
                      />
                    </div>
                  )}
                </div>


                {item.progress !== null && (
                  <span className="text-sm font-semibold text-gray-700">
                    {item.progress}%
                  </span>
                )}


                <button
                  onClick={() => removeFile(item.id)}
                  className="text-gray-400 hover:text-red-500 transition"
                >
                  <Trash2 size={18} />
                </button>

              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Bottom bar */}
      <BottomBar className="flex justify-center items-center gap-3">
        <button
          onClick={() => setFiles([])}
          className="inline-flex items-center gap-2 justify-center rounded-[10px] bg-white px-4 h-10 shadow hover:bg-gray-100"
        >
          Cancel
        </button>

        <button
          onClick={uploadFiles}
          disabled={!files.length || !session}
          className="inline-flex items-center gap-2 justify-center rounded-[10px] bg-black px-4 h-10 shadow text-white hover:bg-gray-800 disabled:opacity-50"
        >
          Upload
        </button>
      </BottomBar>

    </div>
  );
};

export default Upload;