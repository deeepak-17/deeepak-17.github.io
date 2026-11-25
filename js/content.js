/* Single source of truth for both views. Facts come from Resume-Master.pdf only,
   except GigGuard, whose facts come from its public README (github.com/deeepak-17/GigGuard). */

export function deepFreeze(obj) {
  if (obj && typeof obj === "object" && !Object.isFrozen(obj)) {
    Object.values(obj).forEach(deepFreeze);
    Object.freeze(obj);
  }
  return obj;
}

export const CONTENT = deepFreeze({
  profile: {
    name: "Deepak S",
    headline: "I make models fit and build backends.",
    pitch: "Deepak S, final-year CS student, building applied ML and backend systems.",
    email: "deepaksenthilkumar242@gmail.com",
    linkedin: "https://www.linkedin.com/in/deepak-senthilkumar-66674a2a5",
    github: "https://github.com/deeepak-17",
    resumeUrl: "assets/Deepak_S_Resume.pdf",
  },
  about: {
    paragraphs: [
      "I study Computer Science at Amrita Vishwa Vidyapeetham and Data Science at IIT Madras, in parallel.",
      "I work in Python, PyTorch and FastAPI: fine-tuning LLMs and vision models, building cloud-native microservices, and backing every result with baselines, robustness tests and load tests.",
    ],
    education: [
      {
        institution: "Amrita Vishwa Vidyapeetham",
        programme: "B.Tech in Computer Science",
        dates: "Aug 2023 to May 2027",
      },
      {
        institution: "IIT Madras",
        programme: "B.S. in Data Science and Applications",
        dates: "Jan 2024 to present",
      },
    ],
  },
  neofetch: [
    { key: "Focus", value: "Applied ML and backend" },
    { key: "Stack", value: "Python, PyTorch, FastAPI" },
    { key: "Cloud", value: "AWS EKS, Docker, Kubernetes" },
    { key: "Studying", value: "Amrita CSE and IIT Madras BS DS" },
  ],
  skills: [
    {
      group: "languages",
      colorToken: "--blue",
      items: ["Python", "C/C++", "Java", "JavaScript", "TypeScript", "SQL", "Go", "Bash"],
    },
    {
      group: "ml and ai",
      colorToken: "--mauve",
      items: [
        "PyTorch", "TensorFlow/Keras", "Hugging Face", "PEFT (LoRA/QLoRA)", "Flower",
        "Opacus", "FAISS", "scikit-learn", "OpenCV",
      ],
    },
    {
      group: "backend and web",
      colorToken: "--green",
      items: [
        "FastAPI", "Flask", "Node.js", "Express", "Spring Boot", "React", "Next.js",
        "Socket.io", "REST APIs", "Microservices",
      ],
    },
    {
      group: "data and cloud",
      colorToken: "--peach",
      items: [
        "PostgreSQL", "MongoDB", "Redis", "AWS (EKS, RDS, S3, Cognito)", "Docker",
        "Kubernetes", "GitHub Actions", "Git",
      ],
    },
  ],
  projects: [
    {
      id: "clasp",
      title: "CLASP",
      headline: "CLASP personalises a code LLM without collecting the code.",
      tagline: "Federated, cluster-personalised code assistant",
      steps: [
        {
          title: "The problem",
          body: "Personalise a code LLM for many teams without centralising their private code.",
        },
        {
          title: "Three adapters, one model",
          body: "Base, cluster and client QLoRA layers compose on DeepSeek-Coder, trained across 6 simulated federated clients under differential privacy and merged with SVD-based low-rank aggregation.",
        },
        {
          title: "A registry that can roll back",
          body: "A FastAPI service versions adapters as immutable, checksum-audited artifacts. NF4 serving fits a 4 GB VRAM budget, a HumanEval gate triggers rollback, and mutual TLS guards the traffic.",
        },
        {
          title: "Built with",
          body: "The stack, end to end.",
        },
      ],
      stack: ["PyTorch", "PEFT", "Flower", "Opacus", "FastAPI", "Docker"],
      repoUrl: "https://github.com/deeepak-17/CLASP",
    },
    {
      id: "gigguard",
      title: "GigGuard",
      headline: "GigGuard insures a delivery worker's week against rain, heat and curfews.",
      tagline: "Parametric income insurance for delivery workers",
      steps: [
        {
          title: "The problem",
          body: "Rain, heat, bad air, floods, traffic or a curfew can stop a delivery worker's week, and no insurance product is built around weekly earnings.",
        },
        {
          title: "Payouts that scale",
          body: "Six live triggers feed a fuzzy-logic engine, so a payout rises from 0% at the entry threshold to 100% at the ceiling instead of flipping at one number. The curfew trigger blends GDELT unrest events with a zero-shot NLP model reading news headlines.",
        },
        {
          title: "Priced weekly, checked for fraud",
          body: "An XGBoost model prices each week's premium from 25 features, including earnings, weather and past claims. Isolation Forest anomaly scores and GPS checks hold suspicious claims for review instead of paying them out.",
        },
        {
          title: "Built with",
          body: "The stack, end to end.",
        },
      ],
      stack: ["FastAPI", "XGBoost", "scikit-learn", "Hugging Face", "Next.js", "React Native", "Supabase"],
      repoUrl: "https://github.com/deeepak-17/GigGuard",
    },
  ],
});
