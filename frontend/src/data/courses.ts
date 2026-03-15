import { Cpu, BookOpen, Calculator, Globe } from "lucide-react";

export const COURSES = [
  {
    code: "COMP2140",
    name: "Computer Architecture",
    icon: Cpu,
    topics: [
      "cpu-architecture",
      "instruction-cycle",
      "registers-and-buses",
      "alu-operations",
      "control-units",
      "memory-hierarchy",
    ],
  },
  {
    code: "COMP2190",
    name: "Algorithms & Data Structures",
    icon: BookOpen,
    topics: [
      "recurrence-relations",
      "master-theorem",
      "sorting-algorithms",
      "graph-algorithms",
      "dynamic-programming",
    ],
  },
  {
    code: "ECON2001",
    name: "Intermediate Microeconomics",
    icon: Calculator,
    topics: [
      "consumer-theory",
      "utility-maximization",
      "production-functions",
      "cost-curves",
      "market-equilibrium",
    ],
  },
  {
    code: "GEOG1100",
    name: "Geography of the Caribbean",
    icon: Globe,
    topics: [
      "physical-geography",
      "climate-systems",
      "population-distribution",
      "urban-development",
      "regional-trade",
    ],
  },
];