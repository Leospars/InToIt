import {
  Brain,
  Sparkles,
  FileText,
  BookOpen,
  MessageSquare,
  BarChart,
  Zap
} from "lucide-react";

const cards = [
  { rotate: "-16deg", icon: Brain, bg: "bg-[oklch(98.5%_0_0)]", dark: "dark:bg-[oklch(20%_0_0)]", mb: "" },
  { rotate: "-12deg", icon: FileText, bg: "bg-[oklch(97%_0_0)]", dark: "dark:bg-[oklch(25%_0_0)]", mb: "mb-3" },
  { rotate: "-4deg", icon: BookOpen, bg: "bg-[oklch(92.2%_0_0)]", dark: "dark:bg-[oklch(30%_0_0)]", mb: "mb-5" },
  { rotate: "0deg", icon: Sparkles, bg: "bg-[oklch(87%_0_0)]", dark: "dark:bg-[oklch(40%_0_0)]", mb: "mb-6" },
  { rotate: "4deg", icon: MessageSquare, bg: "bg-[oklch(70.8%_0_0)]", dark: "dark:bg-[oklch(55%_0_0)]", mb: "mb-5" },
  { rotate: "12deg", icon: BarChart, bg: "bg-[oklch(55.6%_0_0)]", dark: "dark:bg-[oklch(70%_0_0)]", mb: "mb-3" },
  { rotate: "16deg", icon: Zap, bg: "bg-[oklch(43.9%_0_0)]", dark: "dark:bg-[oklch(80%_0_0)]", mb: "" }
];

const FeatureCards = () => {
  return (
    <div className="flex items-center [&>*:not(:first-child)]:-ml-8">

      {cards.map((card, i) => {
        // const Icon = card.icon;

        return (
          <div
            key={i}
            className={`group flex items-center justify-center rounded-2xl bg-white p-1 shadow-custom dark:border dark:border-gray-300 dark:bg-gray-50 dark:shadow-none ${card.mb}`}
            style={{ transform: `rotate(${card.rotate})`, willChange: "transform" }}
          >
            <div
              className={`size-12 rounded-xl outline-subtle flex items-center justify-center transition-all duration-200 ${card.bg} ${card.dark} group-hover:scale-110`}
            >
              {/* <Icon className="size-5 text-gray-800 dark:text-gray-900" /> */}
            </div>
          </div>
        );
      })}

    </div>
  );
};

export default FeatureCards;