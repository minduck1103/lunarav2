import { useEffect, useRef, useState } from "react";
import { positionIds, rulesVersion, type InterpretationResult } from "../../../contracts/interpretation";
import { requestInterpretation } from "../../../services/interpretationClient";
import type { ReadingState } from "../reading.types";

export function useInterpretation(reading: ReadingState, onResult: (result: InterpretationResult) => void) {
  const [result, setResult] = useState<InterpretationResult | null>(null);
  const [pending, setPending] = useState(false);
  const [interpretationError, setInterpretationError] = useState("");
  const controllerRef = useRef<AbortController | null>(null);

  useEffect(() => () => {
    controllerRef.current?.abort();
    controllerRef.current = null;
  }, []);

  async function interpret() {
    if (result || controllerRef.current) return;
    const controller = new AbortController();
    controllerRef.current = controller;
    setPending(true);
    setInterpretationError("");
    let timedOut = false;
    const timeout = window.setTimeout(() => { timedOut = true; controller.abort(); }, 52_000);
    try {
      const parsed = await requestInterpretation({
        rulesVersion,
        topic: reading.topic,
        question: reading.question,
        spreadId: reading.spreadId,
        cards: reading.cards.map((item, index) => ({
          cardId: item.card.id,
          positionId: positionIds[reading.spreadId][index],
          orientation: item.isReversed ? "reversed" : "upright",
        })),
      }, { baseUrl: import.meta.env.BASE_URL, signal: controller.signal });
      if (controllerRef.current === controller) {
        setResult(parsed);
        onResult(parsed);
      }
    } catch (caught) {
      if (controllerRef.current === controller) {
        setInterpretationError(timedOut ? "Giải nghĩa mất nhiều thời gian hơn dự kiến. Vui lòng thử lại."
          : caught instanceof SyntaxError ? "Dữ liệu trả về không hợp lệ. Vui lòng thử lại."
            : caught instanceof TypeError ? "Không thể kết nối dịch vụ. Vui lòng kiểm tra mạng và thử lại."
              : caught instanceof Error ? caught.message : "Không thể giải nghĩa. Vui lòng thử lại.");
      }
    } finally {
      window.clearTimeout(timeout);
      if (controllerRef.current === controller) {
        controllerRef.current = null;
        setPending(false);
      }
    }
  }

  return { result, pending, interpretationError, interpret };
}
