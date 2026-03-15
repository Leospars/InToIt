import BottomBar from "@/components/bottom-navbar";
import { PlusCircle, UploadCloud, Trash2 } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

type UploadFile = {
  id: string;
  file: File;
  progress: number;
};

const Upload = () => {
  const [files, setFiles] = useState<UploadFile[]>([]);

  const handleFiles = (fileList: FileList | null) => {
    if (!fileList) return;

    const newFiles = Array.from(fileList).map((file) => ({
      id: crypto.randomUUID(),
      file,
      progress: 0,
    }));

    setFiles((prev) => [...prev, ...newFiles]);

    newFiles.forEach((f) => simulateUpload(f.id));
  };

  const simulateUpload = (id: string) => {
    let progress = 0;

    const interval = setInterval(() => {
      progress += Math.random() * 18;

      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
      }

      setFiles((prev) =>
        prev.map((f) =>
          f.id === id ? { ...f, progress: Math.round(progress) } : f
        )
      );
    }, 250);
  };

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const formatSize = (size: number) => {
    return `${(size / 1024).toFixed(0)} KB`;
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


      {files.length > 0 && (
        <div className="mx-auto w-full max-w-3xl flex flex-col gap-3">
          <AnimatePresence>
            {files.map((item) => (
              <motion.div
                key={item.id}
                layout
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

       
                  <div className="mt-2 h-2 w-full rounded-full bg-gray-200 overflow-hidden">
                    <motion.div
                      className="h-full bg-gray-700 rounded-full"
                      animate={{ width: `${item.progress}%` }}
                      transition={{ duration: 0.25 }}
                    />
                  </div>
                </div>

          
                <span className="text-sm font-semibold text-gray-700">
                  {item.progress}%
                </span>

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

        <BottomBar className="flex justify-center items-center gap-3">
        <button className="inline-flex items-center gap-2 justify-center rounded-[10px] bg-white px-4 h-10 shadow hover:bg-gray-100">
          <span className="text-sm font-medium text-gray-800">
            Cancel
          </span>
        </button>

        <button className="inline-flex items-center gap-2 justify-center rounded-[10px] bg-white px-4 h-10 shadow hover:bg-gray-100">
          <span className="text-sm font-medium text-gray-800">
            Upload
          </span>
        </button>
      </BottomBar>

    </div>
  );
};

export default Upload;