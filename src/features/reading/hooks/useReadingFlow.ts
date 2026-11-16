import { useEffect, useReducer, useRef } from "react";
import { drawCards } from "../../../domain/tarot/drawCards";
import type { SpreadId, Topic } from "../../../domain/tarot/types";
import { randomBelow } from "../../../platform/random.web";
import type { SoundPlayer } from "../../../shared/audio";
import { initialReadingFlow, readingReducer } from "../reading.reducer";

export function useReadingFlow(sound: SoundPlayer) {
  const [state, dispatch] = useReducer(readingReducer, initialReadingFlow);
  const drawGeneration = useRef(0);
  const { topic, question, spreadId, isDrawing } = state;

  useEffect(() => () => { drawGeneration.current++; }, []);

  function handleQuestionContinue() {
    if (!topic) {
      dispatch({ type: "set-step", step: 1 });
      return;
    }
    if (question.trim().length > 240) {
      dispatch({ type: "set-error", error: "Câu hỏi tối đa 240 ký tự." });
      return;
    }
    dispatch({ type: "set-error", error: "" });
    dispatch({ type: "set-step", step: 3 });
  }

  async function startReading() {
    if (!topic || isDrawing) return;
    const generation = ++drawGeneration.current;
    dispatch({ type: "start-drawing" });
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    sound.stopEffects();
    if (!reduceMotion) sound.play("shuffle");
    else sound.play("button");
    const minimumShuffle = new Promise((resolve) => window.setTimeout(resolve, reduceMotion ? 0 : 1400));
    try {
      await minimumShuffle;
      if (generation !== drawGeneration.current) return;
      const cards = drawCards(spreadId, randomBelow).map((item) => ({ ...item, revealed: false }));
      dispatch({ type: "draw", reading: { id: crypto.randomUUID(), topic, question: question.trim(), spreadId, cards } });
    } catch (caught) {
      if (generation === drawGeneration.current) {
        dispatch({ type: "set-error", error: caught instanceof Error ? caught.message : "Không thể rút bài lúc này. Vui lòng thử lại." });
      }
    } finally {
      if (generation === drawGeneration.current) {
        sound.stop("shuffle");
        dispatch({ type: "finish-drawing" });
      }
    }
  }

  return {
    ...state,
    chooseTopic: (topic: Topic) => { sound.play("select"); dispatch({ type: "choose-topic", topic }); },
    setStep: (step: number) => dispatch({ type: "set-step", step }),
    setQuestion: (question: string) => dispatch({ type: "set-question", question }),
    setSpreadId: (value: SpreadId) => {
      if (value !== spreadId) sound.play("select");
      dispatch({ type: "set-spread", spreadId: value });
    },
    setError: (error: string) => dispatch({ type: "set-error", error }),
    setCanExport: (canExport: boolean) => dispatch({ type: "set-can-export", canExport }),
    revealCard: (index: number) => {
      if (state.reading?.cards[index] && !state.reading.cards[index].revealed) {
        sound.stop("deal");
        sound.play("flip");
      }
      dispatch({ type: "reveal", index });
    },
    revealAll: () => {
      if (state.reading?.cards.some((card) => !card.revealed)) {
        sound.stop("deal");
        sound.play("reveal-all");
      }
      dispatch({ type: "reveal-all" });
    },
    startOver: () => { drawGeneration.current++; sound.stopEffects(); sound.play("button"); dispatch({ type: "reset" }); },
    handleQuestionContinue,
    startReading,
  };
}
