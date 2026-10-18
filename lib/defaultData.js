// Default portfolio data seed matching the original portfolio configuration
export const DEFAULT_PORTFOLIO_DATA = {
  name: "Hosiah Ledwaba",
  title: "Software Engineering Student",
  heroHeadline: "HOSIAH LEDWABA",
  heroSubtitle: "Software Engineering Student & Aspiring Developer",
  heroTagline: "Bridging the gap between Computer Science and Informatics. Specializing in C++, Java, Python, and scalable IT solutions.",
  contact: {
    phone: "+27832868282",
    email: "hosiahledwaba@gmail.com",
    location: "Johannesburg, South Africa",
  },
  summary: "Proficient in multiple programming languages, including C++, C#, Java, JavaScript, and Python, with a deep understanding of ASP.NET and API integration. Experienced in applying object-oriented principles, designing user-friendly GUIs, and managing databases with Microsoft SQL Server and MySQL. Background in web design and e-commerce, particularly with WooCommerce.",
  elevatorPitch: "A multi-disciplinary software engineering student blending robust backend logic with intuitive GUI design to build scalable IT solutions.",
  socialLinks: [
    { id: "linkedin", name: "LinkedIn", url: "https://www.linkedin.com/in/hosiah-ledwaba-1a4604250?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=ios_app", visible: true, title: "LinkedIn — Connect professionally" },
    { id: "github", name: "GitHub", url: "https://github.com/hosiahledwaba-cmyk", visible: true, title: "GitHub — View source code" },
    { id: "instagram", name: "Instagram", url: "https://www.instagram.com/s.ti_x.co?igsh=ZmtwZHkyNjllYWpj&utm_source=qr", visible: true, title: "Instagram — Get to know me" },
    { id: "facebook", name: "Facebook", url: "", visible: false, title: "Facebook — (add link in admin)" },
    { id: "other", name: "Other", url: "", visible: false, title: "Other profile — (add link in admin)" }
  ],
  skills: [
    { 
      name: "TypeScript", 
      category: ["Language", "Frontend", "Web"], 
      level: 10,
      experienceSummary: "Architecting strict, type-safe codebases for scalable frontend and backend applications.",
      proficiency: "Expert",
      typicalUseCases: ["Enterprise React Apps", "Strict API Interfaces", "Shared Component Libraries"],
      relevantProjects: "Portfolio Website",
      suggestedKeywords: ["Generics", "Utility Types", "Static Analysis", "TSX"],
      isInferred: false
    },
    { 
      name: "JavaScript", 
      category: ["Language", "Frontend", "Backend", "Web"], 
      level: 9,
      experienceSummary: "Extensive mastery of the JS runtime environment across browser and server contexts.",
      proficiency: "Expert",
      typicalUseCases: ["Asynchronous Logic", "DOM Manipulation", "Node.js Services"],
      relevantProjects: "E-Commerce Integration Suite",
      suggestedKeywords: ["ESNext", "Closures", "Event Loop", "Promises"],
      isInferred: false
    },
    { 
      name: "Dart", 
      category: ["Language", "Mobile", "Frontend"], 
      level: 9,
      experienceSummary: "Building high-performance, compiled native applications using the Flutter ecosystem.",
      proficiency: "Expert",
      typicalUseCases: ["Cross-platform Logic", "Reactive State Management", "Custom Render Objects"],
      relevantProjects: "Cross-platform Habit Tracker",
      suggestedKeywords: ["Isolates", "Streams", "AOT Compilation", "Null Safety"],
      isInferred: false
    },
    { 
      name: "C#", 
      category: ["Language", "Backend", "Desktop"], 
      level: 9,
      experienceSummary: "Core language for enterprise .NET solutions, API architecture, and Windows desktop apps.",
      proficiency: "Expert",
      typicalUseCases: ["ASP.NET Core APIs", "Entity Framework", "Microservices"],
      relevantProjects: "ASP.NET API Architecture",
      suggestedKeywords: ["LINQ", "Delegates", "Dependency Injection", "Task Parallel Library"],
      isInferred: false
    },
    { 
      name: "Java", 
      category: ["Language", "Backend", "Desktop", "Mobile"], 
      level: 9,
      experienceSummary: "Deep expertise in OOP patterns, JVM performance tuning, and enterprise system design.",
      proficiency: "Expert",
      typicalUseCases: ["Spring Boot Services", "Swing/JavaFX GUIs", "Android Native Modules"],
      relevantProjects: "Cross-Platform GUI System",
      suggestedKeywords: ["JVM", "Streams API", "Multithreading", "Spring"],
      isInferred: false
    },
    { 
      name: "C++", 
      category: ["Language", "Desktop", "Systems"], 
      level: 9,
      experienceSummary: "Systems-level programming focusing on memory management, pointers, and performance optimization.",
      proficiency: "Expert",
      typicalUseCases: ["Game Engines", "Low-latency Systems", "Hardware Interface"],
      relevantProjects: "Cross-Platform GUI System",
      suggestedKeywords: ["STL", "Smart Pointers", "Move Semantics", "RAII"],
      isInferred: false
    },
    { 
      name: "Python", 
      category: ["Language", "Backend", "Data"], 
      level: 8,
      experienceSummary: "Rapid development of backend services, data processing scripts, and automation tools.",
      proficiency: "Experienced",
      typicalUseCases: ["FastAPI Microservices", "Data Analysis", "Scripting Automation"],
      relevantProjects: "General Academic Coursework",
      suggestedKeywords: ["Pandas", "AsyncIO", "Decorators", "PyTest"],
      isInferred: false
    },
    { 
      name: "Kotlin", 
      category: ["Language", "Mobile", "Backend"], 
      level: 8,
      experienceSummary: "Modern, concise development for native Android applications and server-side JVM apps.",
      proficiency: "Experienced",
      typicalUseCases: ["Native Android UI", "Coroutines for Async", "DSL Creation"],
      relevantProjects: "Native Android Task Manager",
      suggestedKeywords: ["Coroutines", "Jetpack Compose", "Extensions", "Data Classes"],
      isInferred: false
    },
    { 
      name: "SQL", 
      category: ["Language", "Database"], 
      level: 9,
      experienceSummary: "Designing complex relational schemas, optimized queries, and stored procedures.",
      proficiency: "Expert",
      typicalUseCases: ["Schema Normalization", "Complex Joins", "Performance Indexing"],
      relevantProjects: "ASP.NET API Architecture",
      suggestedKeywords: ["ACID", "Transactions", "Views", "Triggers"],
      isInferred: false
    },
    { 
      name: "React Native", 
      category: ["Framework", "Mobile", "Frontend"], 
      level: 10,
      experienceSummary: "Developing native-feeling mobile experiences with shared JavaScript/TypeScript codebases.",
      proficiency: "Expert",
      typicalUseCases: ["Cross-platform Apps", "Native Module Integration", "Animation Logic"],
      relevantProjects: "Social Event Mobile App",
      suggestedKeywords: ["Metro", "FlatList", "Reanimated", "Navigation"],
      isInferred: false
    },
    { 
      name: "React", 
      category: ["Framework", "Frontend", "Web"], 
      level: 9,
      experienceSummary: "Building complex Single Page Applications (SPAs) with advanced state management.",
      proficiency: "Expert",
      typicalUseCases: ["Component Architecture", "Custom Hooks", "Performance Optimization"],
      relevantProjects: "Portfolio Website",
      suggestedKeywords: ["Virtual DOM", "Context API", "React Server Components", "Memoization"],
      isInferred: false
    },
    { 
      name: "Flutter", 
      category: ["Framework", "Mobile", "Frontend"], 
      level: 9,
      experienceSummary: "Creating fluid, high-fidelity UIs across mobile and web from a single codebase.",
      proficiency: "Expert",
      typicalUseCases: ["Custom Widgets", "State Management (Bloc/Riverpod)", "Platform Channels"],
      relevantProjects: "Cross-platform Habit Tracker",
      suggestedKeywords: ["Widgets", "Material Design", "Cupertino", "RenderObject"],
      isInferred: false
    },
    { 
      name: "ASP.NET Core", 
      category: ["Framework", "Backend", "Web"], 
      level: 9,
      experienceSummary: "Architecting secure, high-throughput Web APIs and MVC applications.",
      proficiency: "Expert",
      typicalUseCases: ["REST API Design", "Identity Server", "Microservices"],
      relevantProjects: "ASP.NET API Architecture",
      suggestedKeywords: ["Middleware", "Kestrel", "SignalR", "WebAPI"],
      isInferred: false
    },
    { 
      name: "Node.js", 
      category: ["Framework", "Backend"], 
      level: 8,
      experienceSummary: "Building scalable, event-driven network applications and real-time services.",
      proficiency: "Experienced",
      typicalUseCases: ["Real-time Sockets", "JSON APIs", "SSR Handling"],
      relevantProjects: "Real-time Chat Service",
      suggestedKeywords: ["Event Loop", "Streams", "Buffer", "Cluster"],
      isInferred: false
    },
    { 
      name: "FastAPI", 
      category: ["Framework", "Backend"], 
      level: 8,
      experienceSummary: "Developing high-performance, asynchronous Python APIs with automatic validation.",
      proficiency: "Experienced",
      typicalUseCases: ["ML Inference APIs", "Async Web Services", "Data Processing"],
      relevantProjects: "Prediction Model API",
      suggestedKeywords: ["Pydantic", "Starlette", "OpenAPI", "ASGI"],
      isInferred: false
    },
    { 
      name: "Docker", 
      category: ["DevOps", "Tool"], 
      level: 8,
      experienceSummary: "Containerizing applications for consistent development and production environments.",
      proficiency: "Experienced",
      typicalUseCases: ["Microservice Isolation", "Dev Environments", "CI/CD Integration"],
      relevantProjects: "Automated Build Pipeline",
      suggestedKeywords: ["Dockerfile", "Compose", "Volumes", "Networks"],
      isInferred: false
    },
    { 
      name: "MS SQL Server", 
      category: ["Database", "Backend"], 
      level: 9,
      experienceSummary: "Managing enterprise-grade relational data with strict integrity constraints.",
      proficiency: "Expert",
      typicalUseCases: ["Stored Procedures", "Reporting Services", "Data Warehousing"],
      relevantProjects: "ASP.NET API Architecture",
      suggestedKeywords: ["T-SQL", "SSMS", "Index Tuning"],
      isInferred: false
    },
    { 
      name: "Git & GitHub", 
      category: ["Tool", "DevOps"], 
      level: 9,
      experienceSummary: "Managing complex version control histories and collaborative workflows.",
      proficiency: "Expert",
      typicalUseCases: ["Branch Management", "Code Review", "Release Versioning"],
      relevantProjects: "All Projects",
      suggestedKeywords: ["Rebase", "Merge Strategies", "Hooks"],
      isInferred: false
    }
  ],
  education: [
    {
      institution: "University of Johannesburg",
      degree: "Bachelor of Science in Information Technology",
      years: "Expected 2026",
      description: [
        "Major: Computer Science, Informatics | Minor: Information Technology Management",
        "Covered advanced programming, database design, and information systems.",
        "Developed practical problem-solving skills in software development, algorithm design, and network security."
      ]
    },
    {
      institution: "Meridian Northern Academy",
      degree: "High School (Information Technology)",
      years: "2016-2020",
      description: [
        "Studied IT and Computer Applications Technology from Grade 10-12.",
        "Hands-on experience in programming fundamentals, algorithmic thinking, and database principles."
      ]
    }
  ],
  experience: [
    {
      role: "Software Engineering Student",
      company: "University of Johannesburg",
      years: "2021 - Present",
      summary: "Developing enterprise-ready skills in full-stack development and systems analysis.",
      highlights: [
        "Mastered OOP principles across C++ and Java environments.",
        "Designed relational database schemas for complex information systems."
      ]
    }
  ],
  projects: [
    {
      title: "Swipy E-Commerce Suite",
      description: "A social media like shopping experience built on Flutter, React TS, and Python for seamless cross-platform access and robust backend services using FastAPI.",
      outcome: "Streamlined product management and checkout flows, improving user experience for digital retail.",
      technologies: ["Flutter", "React TypeScript", "FastAPI", "Python"],
      image: "https://placehold.co/800x600/050505/00E5FF.png?text=E-Commerce+Suite",
      isPlaceholder: true,
      placeholderCaption: "Suggested: High-fidelity screenshot of the product dashboard displaying sales analytics and inventory status."
    },
    {
      title: "Cross-Platform GUI System",
      description: "A desktop application designed with Java and C++ focusing on intuitive user interface patterns and efficient data handling.",
      outcome: "Delivered a responsive GUI that reduced user input errors by enforcing strict validation logic.",
      technologies: ["Java", "C++", "Swing/JavaFX", "OOP"],
      image: "https://placehold.co/800x600/050505/00E5FF.png?text=GUI+System",
      isPlaceholder: true,
      placeholderCaption: "Suggested: Interface mockup showing the data grid component and form validation feedback states."
    },
    {
      title: "ASP.NET API Architecture",
      description: "Design and implementation of RESTful APIs to facilitate secure and scalable communication between web clients and SQL databases.",
      outcome: "Ensured robust data integrity and seamless integration across multiple client endpoints.",
      technologies: ["C#", "ASP.NET", "SQL Server", "API Design"],
      image: "https://placehold.co/800x600/050505/00E5FF.png?text=API+Architecture",
      isPlaceholder: true,
      placeholderCaption: "Suggested: Technical diagram illustrating the 3-tier architecture, API endpoints, and database schema relationships."
    }
  ],
  languages: ["English", "Sepedi", "Setswana", "Afrikaans", "Zulu"],
  heroTags: [
    "Full-Stack Engineering",
    "API Architect",
    "Database Specialist"
  ],
  headshotConfig: {
    mode: "single",
    activeId: "headshot-1",
    rotationInterval: 5,
    pictures: [
      {
        id: "headshot-1",
        url: "images/hosiah-ledwaba-profile.jpg",
        title: "Primary Professional Headshot",
        uploadedAt: "2026-01-01T00:00:00.000Z"
      }
    ]
  },
  cvConfig: {
    url: "",
    fileName: "Hosiah_Ledwaba_CV.pdf",
    fileType: "pdf",
    uploadedAt: "",
    fileSize: 0
  },
  githubConfig: {
    username: "hosiahledwaba-cmyk",
    lastSyncedAt: "",
    excludedRepos: []
  },
  posts: [
    {
      id: "post-1",
      slug: "architecting-high-throughput-microservices",
      title: "Architecting High-Throughput Systems in C++ and ASP.NET Core",
      summary: "Exploring zero-copy buffer strategies, memory layout optimization, and low-latency inter-process communication in modern backend services.",
      content: `### High-Performance Systems Architecture

When engineering mission-critical backend systems, performance bottlenecks frequently arise not from compute limitations, but from inefficient memory allocation, buffer thrashing, and excessive cache misses.

#### 1. Zero-Copy Serialization & Memory Alignment
In standard web application architectures, payloads traverse multiple serializations across transport layers. By utilizing fixed-size binary structs and memory-mapped buffers between C++ core engines and ASP.NET Core Kestrel middleware, throughput can scale linearly without GC pauses.

\`\`\`cpp
// Fixed-width packet frame for lock-free ring buffer
struct alignas(64) TelemetryFrame {
    uint64_t timestamp_ns;
    uint32_t telemetry_id;
    float payload[8];
    char checksum[16];
};
\`\`\`

#### 2. Kestrel & Epoll Event Loop Integration
ASP.NET Core's pipeline allows custom socket transports. Pairing asynchronous socket loops with thread-pinned C++ worker pools delivers deterministic microsecond response times under concurrent synthetic load.

Key takeaways:
- Cache line alignment (64 bytes) eliminates false sharing across CPU cores.
- Minimize object churn on hot network paths.
- Enforce strict typing across client-server RPC interfaces.`,
      status: "published",
      publishedAt: "2026-03-15T10:00:00.000Z",
      createdAt: "2026-03-15T09:00:00.000Z",
      tags: ["C++", "ASP.NET CORE", "SYSTEMS", "CONCURRENCY"],
      readTimeMinutes: 5,
      coverImage: "https://placehold.co/1200x630/050505/CCFF00.png?text=HIGH-THROUGHPUT+C%2B%2B+SYSTEMS",
      images: [
        {
          id: "img-p1-1",
          url: "https://placehold.co/1200x630/050505/CCFF00.png?text=HIGH-THROUGHPUT+C%2B%2B+SYSTEMS",
          caption: "Architectural overview: Memory-mapped ring buffer pipeline",
          isCover: true
        },
        {
          id: "img-p1-2",
          url: "https://placehold.co/1200x630/050505/00CCFF.png?text=SOCKET+BUFFER+METRICS",
          caption: "Throughput metrics under 100k concurrent socket requests",
          isCover: false
        }
      ],
      reactions: {
        like: 19,
        fire: 14,
        rocket: 27
      }
    },
    {
      id: "post-2",
      slug: "cross-platform-reactive-state-flutter-native",
      title: "Reactive State Pipelines: Bridging Flutter with Native Platform Channels",
      summary: "Harmonizing asynchronous Dart isolates with native Kotlin/C++ mobile modules without dropping 120Hz display refresh frames.",
      content: `### Mobile Performance & Hybrid Engineering

Bridging declarative cross-platform UI frameworks with low-level native hardware modules requires strict isolation of CPU-intensive workloads from the primary platform UI thread.

#### 1. Dart Isolates & Event Streams
Flutter renders directly via Impeller/Skia, but heavy cryptography, image decoders, and local SQL transactions must never execute on the root isolate. By routing state transitions through background isolate workers, the main thread maintains a fluid 120 FPS.

#### 2. Native Channel Marshaling
Standard MethodChannels in Flutter serialize data through binary JSON. For real-time sensor streams and audio synthesis, custom StandardMessageCodec implementations with typed byte arrays yield order-of-magnitude reductions in IPC latency.

\`\`\`dart
// StreamController bound to native binary event sink
final StreamController<SensorReading> _telemetryStream = StreamController.broadcast();
PlatformChannel.setBinaryMessengerHandler('com.hosiah.sensor/stream', (ByteData? message) async {
  if (message != null) {
    _telemetryStream.add(SensorReading.fromBuffer(message));
  }
  return null;
});
\`\`\`

#### Summary
Maintaining predictable frame budgets requires respecting platform lifecycle events and treating memory boundaries with the same rigor as distributed network requests.`,
      status: "published",
      publishedAt: "2026-04-02T14:30:00.000Z",
      createdAt: "2026-04-02T12:00:00.000Z",
      tags: ["FLUTTER", "DART", "KOTLIN", "MOBILE"],
      readTimeMinutes: 4,
      coverImage: "https://placehold.co/1200x630/050505/00CCFF.png?text=REACTIVE+STATE+PIPELINES",
      images: [
        {
          id: "img-p2-1",
          url: "https://placehold.co/1200x630/050505/00CCFF.png?text=REACTIVE+STATE+PIPELINES",
          caption: "Isolate messaging topology and platform channel event sink",
          isCover: true
        }
      ],
      reactions: {
        like: 12,
        fire: 18,
        rocket: 15
      }
    }
  ]
};
