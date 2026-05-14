const db = require("../firebase");

const users = [
  {
    name: "Amira Khalil",
    country: "Maroc",
    language: "Français",
    major: "Informatique",
    interests: ["Tech", "Musique", "Voyage"],
    bio: "Passionnée par l'IA et la culture web. J'adore rencontrer du monde.",
    avatar: "",
    role: "student",
    createdAt: new Date(),
  },
  {
    name: "Liu Wei",
    country: "Chine",
    language: "Chinois",
    major: "Économie",
    interests: ["Cinéma", "Cuisine", "Photographie"],
    bio: "Étudiant en master, fan de photographie urbaine.",
    avatar: "",
    role: "student",
    createdAt: new Date(),
  },
  {
    name: "Dr. Elena Petrova",
    country: "Russie",
    language: "Russe",
    major: "Recherche IA",
    interests: ["Tech", "Recherche"],
    bio: "Chercheuse en IA, 8 ans d'expérience en mentorat.",
    avatar: "",
    role: "mentor",
    createdAt: new Date(),
  },
  {
    name: "Ahmed Benali",
    country: "Tunisie",
    language: "Français",
    major: "Finance",
    interests: ["Finance", "Voyage"],
    bio: "Analyste financier senior, j'aide les étudiants étrangers.",
    avatar: "",
    role: "mentor",
    createdAt: new Date(),
  }
];

const activities = [
  {
    title: "Soirée internationale",
    description: "Rencontre entre étudiants du monde entier autour d'un buffet.",
    location: "Campus Sorbonne, Paris",
    startDate: new Date("2026-05-20T18:00:00Z"),
    endDate: new Date("2026-05-20T23:00:00Z"),
    tags: ["Social", "Culturel"],
    language: "Français",
    type: "event",
    organizer: "Association Inter-Étudiants",
    maxParticipants: 150,
    currentParticipants: 42,
    isActive: true,
    imageUrl: "",
    createdAt: new Date(),
  },
  {
    title: "Hackathon IA & Santé",
    description: "48h pour coder une solution innovante pour la santé.",
    location: "Station F, Paris",
    startDate: new Date("2026-06-05T09:00:00Z"),
    endDate: new Date("2026-06-07T18:00:00Z"),
    tags: ["Tech", "Médecine", "Innovation"],
    language: "Anglais",
    type: "event",
    organizer: "Flourish AI",
    maxParticipants: 100,
    currentParticipants: 15,
    isActive: true,
    imageUrl: "",
    createdAt: new Date(),
  },
  {
    title: "Club de Cuisine Francophone",
    description: "Apprenez à cuisiner des plats français tout en pratiquant la langue.",
    location: "Maison des étudiants",
    startDate: new Date("2026-05-22T14:00:00Z"),
    endDate: new Date("2026-12-31T18:00:00Z"),
    tags: ["Cuisine", "Français", "Social"],
    language: "Français",
    type: "club",
    organizer: "Club Gastronomie",
    maxParticipants: 20,
    currentParticipants: 8,
    isActive: true,
    imageUrl: "",
    createdAt: new Date(),
  }
];

async function seed() {
  console.log("Starting seeding...");

  try {
    // Seed Users
    console.log("Seeding users...");
    for (const user of users) {
      const ref = await db.collection("users").add(user);
      console.log(`User added: ${user.name} (${ref.id})`);
    }

    // Seed Activities
    console.log("Seeding activities...");
    for (const activity of activities) {
      const ref = await db.collection("activities").add(activity);
      console.log(`Activity added: ${activity.title} (${ref.id})`);
    }

    console.log("Seeding completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Error seeding database:", error);
    process.exit(1);
  }
}

seed();
