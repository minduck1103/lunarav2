import type { SpreadId, Topic } from "../../domain/tarot/types";
import type { ReadingState } from "./reading.types";

type ReadingFlowState = {
  step: number;
  topic: Topic | null;
  question: string;
  spreadId: SpreadId;
  reading: ReadingState | null;
  isDrawing: boolean;
  error: string;
  canExport: boolean;
};

type ReadingAction =
  | { type: "choose-topic"; topic: Topic }
  | { type: "set-step"; step: number }
  | { type: "set-question"; question: string }
  | { type: "set-spread"; spreadId: SpreadId }
  | { type: "set-error"; error: string }
  | { type: "set-can-export"; canExport: boolean }
  | { type: "start-drawing" }
  | { type: "finish-drawing" }
  | { type: "draw"; reading: ReadingState }
  | { type: "reveal"; index: number }
  | { type: "reveal-all" }
  | { type: "reset" };

export const initialReadingFlow: ReadingFlowState = {
  step: 1,
  topic: null,
  question: "",
  spreadId: "three-card",
  reading: null,
  isDrawing: false,
  error: "",
  canExport: false,
};

export function readingReducer(state: ReadingFlowState, action: ReadingAction): ReadingFlowState {
  switch (action.type) {
    case "choose-topic": return { ...state, topic: action.topic, error: "", step: 2 };
    case "set-step": return { ...state, step: action.step };
    case "set-question": return { ...state, question: action.question };
    case "set-spread": return { ...state, spreadId: action.spreadId };
    case "set-error": return { ...state, error: action.error };
    case "set-can-export": return { ...state, canExport: action.canExport };
    case "start-drawing": return { ...state, isDrawing: true, error: "" };
    case "finish-drawing": return { ...state, isDrawing: false };
    case "draw": return { ...state, reading: action.reading, step: 4 };
    case "reveal": return { ...state, reading: state.reading && {
      ...state.reading,
      cards: state.reading.cards.map((card, index) => index === action.index ? { ...card, revealed: true } : card),
    } };
    case "reveal-all": return { ...state, reading: state.reading && {
      ...state.reading, cards: state.reading.cards.map((card) => ({ ...card, revealed: true })),
    } };
    case "reset": return { ...state, step: 1, reading: null, question: "", error: "", canExport: false, isDrawing: false };
  }
}
