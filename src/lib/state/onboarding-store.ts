import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

export interface QuizAnswer {
  questionId: string;
  answer: string | string[];
}

interface OnboardingStore {
  // Onboarding state
  hasCompletedOnboarding: boolean;
  currentStep: number;
  quizAnswers: QuizAnswer[];

  // Actions
  setOnboardingComplete: (complete: boolean) => void;
  setCurrentStep: (step: number) => void;
  nextStep: () => void;
  previousStep: () => void;
  setQuizAnswer: (answer: QuizAnswer) => void;
  resetOnboarding: () => void;

  // Computed values
  getCookingLevel: () => "beginner" | "intermediate" | "advanced";
  getCookingGoals: () => string[];
  getChallenges: () => string[];
}

const useOnboardingStore = create<OnboardingStore>()(
  persist(
    (set, get) => ({
      hasCompletedOnboarding: false,
      currentStep: 0,
      quizAnswers: [],

      setOnboardingComplete: (complete) => set({ hasCompletedOnboarding: complete }),

      setCurrentStep: (step) => set({ currentStep: step }),

      nextStep: () => set((state) => ({ currentStep: state.currentStep + 1 })),

      previousStep: () => set((state) => ({ currentStep: Math.max(0, state.currentStep - 1) })),

      setQuizAnswer: (answer) => {
        const answers = get().quizAnswers.filter((a) => a.questionId !== answer.questionId);
        set({ quizAnswers: [...answers, answer] });
      },

      resetOnboarding: () => set({
        hasCompletedOnboarding: false,
        currentStep: 0,
        quizAnswers: [],
      }),

      getCookingLevel: () => {
        const levelAnswer = get().quizAnswers.find((a) => a.questionId === "cooking_level");
        if (!levelAnswer) return "beginner";
        if (levelAnswer.answer === "expert" || levelAnswer.answer === "professional") return "advanced";
        if (levelAnswer.answer === "intermediate") return "intermediate";
        return "beginner";
      },

      getCookingGoals: () => {
        const goalsAnswer = get().quizAnswers.find((a) => a.questionId === "cooking_goals");
        if (!goalsAnswer || typeof goalsAnswer.answer === "string") return [];
        return goalsAnswer.answer;
      },

      getChallenges: () => {
        const challengesAnswer = get().quizAnswers.find((a) => a.questionId === "challenges");
        if (!challengesAnswer || typeof challengesAnswer.answer === "string") return [];
        return challengesAnswer.answer;
      },
    }),
    {
      name: "onboarding-storage",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        hasCompletedOnboarding: state.hasCompletedOnboarding,
        quizAnswers: state.quizAnswers,
      }),
    }
  )
);

export default useOnboardingStore;
