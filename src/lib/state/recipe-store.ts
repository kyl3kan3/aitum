import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

export interface Recipe {
  id: string;
  title: string;
  description: string;
  image: string;
  cookTime: string;
  prepTime: string;
  servings: number;
  difficulty: "Easy" | "Medium" | "Hard";
  category: string;
  ingredients: Ingredient[];
  instructions: Instruction[];
  source?: {
    type: "cookbook" | "video" | "user";
    name: string;
    url?: string;
  };
  isFavorite: boolean;
  createdAt: string;
}

export interface Ingredient {
  id: string;
  name: string;
  amount: string;
  unit: string;
}

export interface Instruction {
  step: number;
  text: string;
  timer?: number; // in minutes
}

export interface Video {
  id: string;
  title: string;
  thumbnail: string;
  duration: string;
  source: string;
  recipeId?: string;
}

interface RecipeStore {
  recipes: Recipe[];
  favoriteIds: string[];
  savedVideoIds: string[];
  videos: Video[];
  searchHistory: string[];
  capturedPhotos: string[];

  // Actions
  toggleFavorite: (recipeId: string) => void;
  addRecipe: (recipe: Recipe) => void;
  removeRecipe: (recipeId: string) => void;
  addVideo: (video: Video) => void;
  toggleSavedVideo: (videoId: string) => void;
  addSearchTerm: (term: string) => void;
  clearSearchHistory: () => void;
  addCapturedPhoto: (uri: string) => void;
  removeCapturedPhoto: (uri: string) => void;
}

// Mock recipe data
const mockRecipes: Recipe[] = [
  {
    id: "1",
    title: "Classic Margherita Pizza",
    description: "A traditional Italian pizza with fresh mozzarella, tomatoes, and basil on a crispy thin crust.",
    image: "https://images.unsplash.com/photo-1604068549290-dea0e4a305ca?w=800",
    cookTime: "15 min",
    prepTime: "30 min",
    servings: 4,
    difficulty: "Medium",
    category: "Italian",
    ingredients: [
      { id: "1", name: "Pizza dough", amount: "1", unit: "lb" },
      { id: "2", name: "San Marzano tomatoes", amount: "1", unit: "can" },
      { id: "3", name: "Fresh mozzarella", amount: "8", unit: "oz" },
      { id: "4", name: "Fresh basil", amount: "1", unit: "bunch" },
      { id: "5", name: "Olive oil", amount: "2", unit: "tbsp" },
      { id: "6", name: "Sea salt", amount: "1", unit: "tsp" },
    ],
    instructions: [
      { step: 1, text: "Preheat your oven to 500°F (260°C) with a pizza stone inside for at least 30 minutes.", timer: 30 },
      { step: 2, text: "Crush the San Marzano tomatoes by hand and season with salt." },
      { step: 3, text: "Stretch the pizza dough into a 12-inch circle on a floured surface." },
      { step: 4, text: "Spread the crushed tomatoes evenly over the dough, leaving a 1-inch border." },
      { step: 5, text: "Tear the mozzarella into pieces and distribute over the pizza." },
      { step: 6, text: "Bake for 10-12 minutes until the crust is golden and cheese is bubbling.", timer: 12 },
      { step: 7, text: "Top with fresh basil leaves and drizzle with olive oil before serving." },
    ],
    source: { type: "cookbook", name: "The Pizza Bible" },
    isFavorite: false,
    createdAt: "2024-01-15",
  },
  {
    id: "2",
    title: "Honey Garlic Salmon",
    description: "Perfectly glazed salmon with a sweet and savory honey garlic sauce, ready in under 30 minutes.",
    image: "https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=800",
    cookTime: "15 min",
    prepTime: "10 min",
    servings: 2,
    difficulty: "Easy",
    category: "Seafood",
    ingredients: [
      { id: "1", name: "Salmon fillets", amount: "2", unit: "pieces" },
      { id: "2", name: "Honey", amount: "3", unit: "tbsp" },
      { id: "3", name: "Garlic", amount: "4", unit: "cloves" },
      { id: "4", name: "Soy sauce", amount: "2", unit: "tbsp" },
      { id: "5", name: "Lemon juice", amount: "1", unit: "tbsp" },
      { id: "6", name: "Butter", amount: "2", unit: "tbsp" },
    ],
    instructions: [
      { step: 1, text: "Pat salmon fillets dry and season with salt and pepper." },
      { step: 2, text: "Mix honey, minced garlic, soy sauce, and lemon juice in a bowl." },
      { step: 3, text: "Heat butter in a skillet over medium-high heat." },
      { step: 4, text: "Sear salmon skin-side up for 4 minutes until golden.", timer: 4 },
      { step: 5, text: "Flip and cook for another 3 minutes.", timer: 3 },
      { step: 6, text: "Pour the honey garlic sauce over the salmon and cook for 2 more minutes until glazed.", timer: 2 },
    ],
    source: { type: "video", name: "Cooking with Julia" },
    isFavorite: false,
    createdAt: "2024-01-20",
  },
  {
    id: "3",
    title: "Creamy Tuscan Chicken",
    description: "Tender chicken breasts in a rich sun-dried tomato and spinach cream sauce.",
    image: "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=800",
    cookTime: "25 min",
    prepTime: "15 min",
    servings: 4,
    difficulty: "Medium",
    category: "Italian",
    ingredients: [
      { id: "1", name: "Chicken breasts", amount: "4", unit: "pieces" },
      { id: "2", name: "Heavy cream", amount: "1", unit: "cup" },
      { id: "3", name: "Sun-dried tomatoes", amount: "1/2", unit: "cup" },
      { id: "4", name: "Fresh spinach", amount: "2", unit: "cups" },
      { id: "5", name: "Parmesan cheese", amount: "1/2", unit: "cup" },
      { id: "6", name: "Garlic", amount: "3", unit: "cloves" },
    ],
    instructions: [
      { step: 1, text: "Season chicken breasts with Italian herbs, salt, and pepper." },
      { step: 2, text: "Sear chicken in olive oil for 6-7 minutes per side until cooked through. Set aside.", timer: 14 },
      { step: 3, text: "In the same pan, sauté minced garlic for 1 minute." },
      { step: 4, text: "Add sun-dried tomatoes and cook for 2 minutes." },
      { step: 5, text: "Pour in heavy cream and bring to a simmer." },
      { step: 6, text: "Stir in parmesan and spinach until wilted." },
      { step: 7, text: "Return chicken to the pan and spoon sauce over. Serve immediately." },
    ],
    source: { type: "cookbook", name: "Italian Comfort Food" },
    isFavorite: false,
    createdAt: "2024-02-01",
  },
  {
    id: "4",
    title: "Thai Green Curry",
    description: "Aromatic and creamy Thai curry with vegetables and your choice of protein.",
    image: "https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?w=800",
    cookTime: "20 min",
    prepTime: "15 min",
    servings: 4,
    difficulty: "Easy",
    category: "Thai",
    ingredients: [
      { id: "1", name: "Green curry paste", amount: "3", unit: "tbsp" },
      { id: "2", name: "Coconut milk", amount: "2", unit: "cans" },
      { id: "3", name: "Chicken thighs", amount: "1", unit: "lb" },
      { id: "4", name: "Thai basil", amount: "1", unit: "cup" },
      { id: "5", name: "Bamboo shoots", amount: "1", unit: "can" },
      { id: "6", name: "Fish sauce", amount: "2", unit: "tbsp" },
    ],
    instructions: [
      { step: 1, text: "Heat a tablespoon of coconut cream in a wok over medium-high heat." },
      { step: 2, text: "Fry the curry paste for 2 minutes until fragrant.", timer: 2 },
      { step: 3, text: "Add sliced chicken and cook for 5 minutes.", timer: 5 },
      { step: 4, text: "Pour in the rest of the coconut milk and bring to a simmer." },
      { step: 5, text: "Add bamboo shoots and cook for 10 minutes.", timer: 10 },
      { step: 6, text: "Season with fish sauce and palm sugar to taste." },
      { step: 7, text: "Garnish with Thai basil and serve with jasmine rice." },
    ],
    source: { type: "user", name: "Home Recipe" },
    isFavorite: false,
    createdAt: "2024-02-10",
  },
  {
    id: "5",
    title: "Classic Beef Tacos",
    description: "Juicy seasoned ground beef tacos with all your favorite toppings.",
    image: "https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?w=800",
    cookTime: "15 min",
    prepTime: "10 min",
    servings: 4,
    difficulty: "Easy",
    category: "Mexican",
    ingredients: [
      { id: "1", name: "Ground beef", amount: "1", unit: "lb" },
      { id: "2", name: "Taco seasoning", amount: "2", unit: "tbsp" },
      { id: "3", name: "Corn tortillas", amount: "8", unit: "pieces" },
      { id: "4", name: "Cheddar cheese", amount: "1", unit: "cup" },
      { id: "5", name: "Lettuce", amount: "2", unit: "cups" },
      { id: "6", name: "Sour cream", amount: "1/2", unit: "cup" },
    ],
    instructions: [
      { step: 1, text: "Brown the ground beef in a large skillet over medium-high heat, breaking it apart." },
      { step: 2, text: "Drain excess fat and add taco seasoning with 1/4 cup water.", timer: 5 },
      { step: 3, text: "Simmer until the sauce thickens, about 5 minutes.", timer: 5 },
      { step: 4, text: "Warm tortillas in a dry pan or microwave." },
      { step: 5, text: "Assemble tacos with beef, cheese, lettuce, and your favorite toppings." },
    ],
    source: { type: "cookbook", name: "Mexican Home Cooking" },
    isFavorite: false,
    createdAt: "2024-02-15",
  },
  {
    id: "6",
    title: "Lemon Herb Roasted Chicken",
    description: "Perfectly roasted whole chicken with crispy skin and juicy meat, infused with lemon and herbs.",
    image: "https://images.unsplash.com/photo-1598103442097-8b74394b95c6?w=800",
    cookTime: "1 hr 15 min",
    prepTime: "20 min",
    servings: 6,
    difficulty: "Medium",
    category: "American",
    ingredients: [
      { id: "1", name: "Whole chicken", amount: "4", unit: "lb" },
      { id: "2", name: "Lemons", amount: "2", unit: "pieces" },
      { id: "3", name: "Fresh thyme", amount: "4", unit: "sprigs" },
      { id: "4", name: "Fresh rosemary", amount: "2", unit: "sprigs" },
      { id: "5", name: "Butter", amount: "4", unit: "tbsp" },
      { id: "6", name: "Garlic", amount: "6", unit: "cloves" },
    ],
    instructions: [
      { step: 1, text: "Preheat oven to 425°F (220°C)." },
      { step: 2, text: "Pat chicken dry and season generously inside and out with salt and pepper." },
      { step: 3, text: "Stuff cavity with halved lemon, garlic cloves, and half the herbs." },
      { step: 4, text: "Rub softened butter under and over the skin." },
      { step: 5, text: "Tie legs together and tuck wings under." },
      { step: 6, text: "Roast for 1 hour 15 minutes until internal temp reaches 165°F.", timer: 75 },
      { step: 7, text: "Rest for 10 minutes before carving.", timer: 10 },
    ],
    source: { type: "cookbook", name: "The Art of Simple Food" },
    isFavorite: false,
    createdAt: "2024-02-20",
  },
];

const mockVideos: Video[] = [
  {
    id: "v1",
    title: "Perfect Pizza Dough Technique",
    thumbnail: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800",
    duration: "12:34",
    source: "Chef Mario",
    recipeId: "1",
  },
  {
    id: "v2",
    title: "Salmon Cooking Masterclass",
    thumbnail: "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=800",
    duration: "8:45",
    source: "Seafood Kitchen",
    recipeId: "2",
  },
  {
    id: "v3",
    title: "Thai Curry Secrets",
    thumbnail: "https://images.unsplash.com/photo-1516714435131-44d6b64dc6a2?w=800",
    duration: "15:20",
    source: "Asian Flavors",
    recipeId: "4",
  },
  {
    id: "v4",
    title: "Authentic Taco Tips",
    thumbnail: "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=800",
    duration: "10:15",
    source: "Mexican Kitchen",
    recipeId: "5",
  },
];

const useRecipeStore = create<RecipeStore>()(
  persist(
    (set, get) => ({
      recipes: mockRecipes,
      favoriteIds: [],
      savedVideoIds: [],
      videos: mockVideos,
      searchHistory: [],
      capturedPhotos: [],

      toggleFavorite: (recipeId: string) => {
        const { favoriteIds } = get();
        const newFavorites = favoriteIds.includes(recipeId)
          ? favoriteIds.filter((id) => id !== recipeId)
          : [...favoriteIds, recipeId];
        set({ favoriteIds: newFavorites });
      },

      addRecipe: (recipe: Recipe) => {
        set({ recipes: [...get().recipes, recipe] });
      },

      removeRecipe: (recipeId: string) => {
        set({ recipes: get().recipes.filter((r) => r.id !== recipeId) });
      },

      addVideo: (video: Video) => {
        set({ videos: [...get().videos, video] });
      },

      toggleSavedVideo: (videoId: string) => {
        const { savedVideoIds } = get();
        const newSaved = savedVideoIds.includes(videoId)
          ? savedVideoIds.filter((id) => id !== videoId)
          : [...savedVideoIds, videoId];
        set({ savedVideoIds: newSaved });
      },

      addSearchTerm: (term: string) => {
        const { searchHistory } = get();
        const filtered = searchHistory.filter((t) => t !== term);
        set({ searchHistory: [term, ...filtered].slice(0, 10) });
      },

      clearSearchHistory: () => {
        set({ searchHistory: [] });
      },

      addCapturedPhoto: (uri: string) => {
        set({ capturedPhotos: [...get().capturedPhotos, uri] });
      },

      removeCapturedPhoto: (uri: string) => {
        set({ capturedPhotos: get().capturedPhotos.filter((p) => p !== uri) });
      },
    }),
    {
      name: "recipe-storage",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

export default useRecipeStore;
